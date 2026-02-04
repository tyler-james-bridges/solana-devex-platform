/**
 * Protocol Health API Server
 * Public API endpoints for protocol health monitoring that other hackathon projects can use
 * 
 * Endpoints for CloddsBot, SuperRouter, Makora, and other developers
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, query, param, validationResult } = require('express-validator');
const WebSocket = require('ws');
const ProtocolHealthMonitor = require('./protocol-health-monitor');

const app = express();
const PORT = process.env.HEALTH_API_PORT || 3002;

// Security and middleware
app.use(helmet());
app.use(cors({
  origin: '*', // Allow all origins for hackathon use
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key']
}));
app.use(express.json({ limit: '1mb' }));

// Rate limiting - generous for hackathon use
const limiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute per IP
  message: {
    error: 'Rate limit exceeded',
    message: 'Too many requests. Limit: 60 requests per minute',
    retryAfter: 60
  }
});
app.use('/api/', limiter);

// Initialize protocol health monitor
const healthMonitor = new ProtocolHealthMonitor({
  rpcEndpoint: process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com',
  monitoringInterval: 30000 // 30 seconds
});

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

// In-memory cache for API responses (use Redis in production)
const cache = new Map();
const CACHE_TTL = 10000; // 10 seconds

// Cache middleware
const cacheMiddleware = (key, ttl = CACHE_TTL) => {
  return (req, res, next) => {
    const cacheKey = typeof key === 'string' ? key : key(req);
    const cached = cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < ttl) {
      return res.json(cached.data);
    }
    
    // Store original send
    const originalSend = res.json;
    res.json = function(data) {
      // Cache the response
      cache.set(cacheKey, {
        data,
        timestamp: Date.now()
      });
      
      // Call original send
      return originalSend.call(this, data);
    };
    
    next();
  };
};

// Health monitor event handlers
healthMonitor.on('monitoring_started', () => {
  console.log('✅ Protocol health monitoring started');
});

healthMonitor.on('protocol_health_update', (data) => {
  // Broadcast to WebSocket clients
  broadcastToClients({
    type: 'protocol_update',
    data
  });
});

healthMonitor.on('protocol_alert', (data) => {
  console.log(`🚨 Alert for ${data.protocol}:`, data.alerts.map(a => a.message));
  
  // Broadcast alerts to WebSocket clients
  broadcastToClients({
    type: 'alert',
    data
  });
});

// ============================================================================
// API ENDPOINTS
// ============================================================================

/**
 * Health check endpoint
 */
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'Solana Protocol Health Monitor',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    monitoring: healthMonitor.isMonitoring,
    endpoints: {
      status: '/api/status',
      protocols: '/api/protocols',
      specific_protocol: '/api/protocols/{protocol}',
      alerts: '/api/alerts',
      metrics: '/api/metrics',
      websocket: `ws://localhost:${PORT}/ws`
    }
  });
});

/**
 * Overall system status - perfect for status pages
 */
app.get('/api/status', 
  cacheMiddleware('status', 5000),
  (req, res) => {
    try {
      const summary = healthMonitor.getHealthSummary();
      
      res.json({
        overall_status: summary.overall.down > 0 ? 'down' : 
                       summary.overall.degraded > 0 ? 'degraded' : 'healthy',
        protocols: summary.protocols,
        summary: summary.overall,
        monitoring: {
          is_active: summary.isMonitoring,
          last_updated: summary.timestamp
        }
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get status',
        message: error.message
      });
    }
  }
);

/**
 * All protocol health data
 */
app.get('/api/protocols',
  cacheMiddleware('protocols', 10000),
  (req, res) => {
    try {
      const exportData = healthMonitor.exportMonitoringData();
      
      res.json({
        timestamp: exportData.timestamp,
        monitoring_active: exportData.isMonitoring,
        protocols: exportData.detailed_metrics,
        summary: exportData.summary.overall
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get protocol data',
        message: error.message
      });
    }
  }
);

/**
 * Specific protocol health
 */
app.get('/api/protocols/:protocol',
  [
    param('protocol').isIn(['jupiter', 'kamino', 'drift', 'raydium'])
      .withMessage('Protocol must be one of: jupiter, kamino, drift, raydium')
  ],
  handleValidationErrors,
  cacheMiddleware((req) => `protocol_${req.params.protocol}`, 5000),
  (req, res) => {
    try {
      const protocol = req.params.protocol;
      const metrics = healthMonitor.getProtocolMetrics(protocol);
      
      res.json(metrics);
    } catch (error) {
      if (error.message.includes('Protocol not found')) {
        return res.status(404).json({
          error: 'Protocol not found',
          message: error.message,
          available_protocols: ['jupiter', 'kamino', 'drift', 'raydium']
        });
      }
      
      res.status(500).json({
        error: 'Failed to get protocol metrics',
        message: error.message
      });
    }
  }
);

/**
 * Quick protocol status check - for automated systems
 */
app.get('/api/protocols/:protocol/status',
  [
    param('protocol').isIn(['jupiter', 'kamino', 'drift', 'raydium'])
  ],
  handleValidationErrors,
  cacheMiddleware((req) => `status_${req.params.protocol}`, 3000),
  (req, res) => {
    try {
      const protocol = req.params.protocol;
      const metrics = healthMonitor.getProtocolMetrics(protocol);
      
      res.json({
        protocol,
        status: metrics.status,
        uptime: metrics.uptime,
        response_time: metrics.responseTime.current,
        last_check: metrics.lastCheck,
        alerts: metrics.alerts.length
      });
    } catch (error) {
      res.status(404).json({
        protocol: req.params.protocol,
        status: 'unknown',
        error: error.message
      });
    }
  }
);

/**
 * Active alerts across all protocols
 */
app.get('/api/alerts',
  cacheMiddleware('alerts', 5000),
  (req, res) => {
    try {
      const exportData = healthMonitor.exportMonitoringData();
      const alerts = [];
      
      Object.entries(exportData.detailed_metrics).forEach(([protocol, metrics]) => {
        if (metrics.alerts && metrics.alerts.length > 0) {
          metrics.alerts.forEach(alert => {
            alerts.push({
              protocol,
              protocol_name: metrics.name,
              ...alert,
              timestamp: new Date().toISOString()
            });
          });
        }
      });
      
      // Sort by type (critical first) then by protocol
      alerts.sort((a, b) => {
        if (a.type === 'critical' && b.type !== 'critical') return -1;
        if (b.type === 'critical' && a.type !== 'critical') return 1;
        return a.protocol.localeCompare(b.protocol);
      });
      
      res.json({
        total_alerts: alerts.length,
        critical: alerts.filter(a => a.type === 'critical').length,
        warning: alerts.filter(a => a.type === 'warning').length,
        alerts
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get alerts',
        message: error.message
      });
    }
  }
);

/**
 * Performance metrics for monitoring dashboards
 */
app.get('/api/metrics',
  [
    query('protocol').optional().isIn(['jupiter', 'kamino', 'drift', 'raydium']),
    query('period').optional().isIn(['1h', '6h', '24h', '7d']).withMessage('Period must be 1h, 6h, 24h, or 7d')
  ],
  handleValidationErrors,
  cacheMiddleware((req) => `metrics_${req.query.protocol || 'all'}_${req.query.period || '1h'}`, 15000),
  (req, res) => {
    try {
      const protocol = req.query.protocol;
      const period = req.query.period || '1h';
      
      if (protocol) {
        // Single protocol metrics
        const metrics = healthMonitor.getProtocolMetrics(protocol);
        
        res.json({
          protocol,
          period,
          current_status: metrics.status,
          uptime: metrics.uptime,
          response_time: {
            current: metrics.responseTime.current,
            average: metrics.responseTime.average,
            history: metrics.responseTime.history
          },
          endpoints: Object.keys(metrics.endpoints).map(endpoint => ({
            name: endpoint,
            status: metrics.endpoints[endpoint].status,
            response_time: metrics.endpoints[endpoint].responseTime
          })),
          checks: metrics.uptime_tracking
        });
      } else {
        // All protocols summary metrics
        const summary = healthMonitor.getHealthSummary();
        
        res.json({
          period,
          timestamp: summary.timestamp,
          overall: summary.overall,
          protocols: Object.entries(summary.protocols).map(([name, data]) => ({
            protocol: name,
            name: data.name,
            status: data.status,
            uptime: data.uptime,
            response_time: data.responseTime,
            alerts: data.alerts
          }))
        });
      }
    } catch (error) {
      res.status(500).json({
        error: 'Failed to get metrics',
        message: error.message
      });
    }
  }
);

/**
 * Start monitoring endpoint
 */
app.post('/api/monitoring/start',
  [
    body('interval').optional().isInt({ min: 10000, max: 300000 })
      .withMessage('Interval must be between 10000ms (10s) and 300000ms (5min)')
  ],
  handleValidationErrors,
  (req, res) => {
    try {
      if (healthMonitor.isMonitoring) {
        return res.json({
          message: 'Monitoring already active',
          status: 'active'
        });
      }
      
      // Update interval if provided
      if (req.body.interval) {
        healthMonitor.monitoringInterval = req.body.interval;
      }
      
      healthMonitor.startMonitoring();
      
      res.json({
        message: 'Monitoring started successfully',
        status: 'started',
        interval: healthMonitor.monitoringInterval,
        protocols: Object.keys(healthMonitor.protocols)
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to start monitoring',
        message: error.message
      });
    }
  }
);

/**
 * Stop monitoring endpoint
 */
app.post('/api/monitoring/stop', (req, res) => {
  try {
    if (!healthMonitor.isMonitoring) {
      return res.json({
        message: 'Monitoring already stopped',
        status: 'stopped'
      });
    }
    
    healthMonitor.stopMonitoring();
    
    res.json({
      message: 'Monitoring stopped successfully',
      status: 'stopped'
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to stop monitoring',
      message: error.message
    });
  }
});

// ============================================================================
// WEBSOCKET SUPPORT
// ============================================================================

const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server, path: '/ws' });

let connectedClients = new Set();

wss.on('connection', (ws, req) => {
  connectedClients.add(ws);
  console.log(`📡 WebSocket client connected. Total: ${connectedClients.size}`);
  
  // Send initial status
  try {
    const summary = healthMonitor.getHealthSummary();
    ws.send(JSON.stringify({
      type: 'initial',
      data: summary
    }));
  } catch (error) {
    console.error('Error sending initial data:', error.message);
  }
  
  // Handle client messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      
      if (data.type === 'subscribe' && data.protocol) {
        // Subscribe to specific protocol updates
        ws.subscribedProtocol = data.protocol;
        ws.send(JSON.stringify({
          type: 'subscribed',
          protocol: data.protocol
        }));
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error.message);
    }
  });
  
  ws.on('close', () => {
    connectedClients.delete(ws);
    console.log(`📡 WebSocket client disconnected. Total: ${connectedClients.size}`);
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error.message);
    connectedClients.delete(ws);
  });
});

// Broadcast function
function broadcastToClients(data) {
  connectedClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      try {
        // Filter by subscription if client has one
        if (client.subscribedProtocol && data.data.protocol !== client.subscribedProtocol) {
          return;
        }
        
        client.send(JSON.stringify(data));
      } catch (error) {
        console.error('Error broadcasting to client:', error.message);
        connectedClients.delete(client);
      }
    }
  });
}

// Send periodic updates to WebSocket clients
setInterval(() => {
  if (connectedClients.size > 0 && healthMonitor.isMonitoring) {
    try {
      const summary = healthMonitor.getHealthSummary();
      broadcastToClients({
        type: 'periodic_update',
        data: summary
      });
    } catch (error) {
      console.error('Error sending periodic update:', error.message);
    }
  }
}, 15000); // Every 15 seconds

// ============================================================================
// ERROR HANDLING
// ============================================================================

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `${req.method} ${req.originalUrl} not found`,
    available_endpoints: [
      'GET /api/health',
      'GET /api/status',
      'GET /api/protocols',
      'GET /api/protocols/{protocol}',
      'GET /api/protocols/{protocol}/status',
      'GET /api/alerts',
      'GET /api/metrics',
      'POST /api/monitoring/start',
      'POST /api/monitoring/stop'
    ]
  });
});

// Error handler
app.use((error, req, res, next) => {
  console.error('API Error:', error.message);
  
  res.status(error.status || 500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// ============================================================================
// SERVER STARTUP
// ============================================================================

// Cleanup on exit
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down gracefully...');
  healthMonitor.stopMonitoring();
  server.close(() => {
    console.log('✅ Server shutdown complete');
    process.exit(0);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Protocol Health API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📈 Status endpoint: http://localhost:${PORT}/api/status`);
  console.log(`🔌 WebSocket: ws://localhost:${PORT}/ws`);
  console.log(`\n🎯 Ready for hackathon projects!`);
  
  // Auto-start monitoring
  console.log('\n🔄 Starting protocol health monitoring...');
  healthMonitor.startMonitoring().catch(console.error);
});

module.exports = { app, healthMonitor };