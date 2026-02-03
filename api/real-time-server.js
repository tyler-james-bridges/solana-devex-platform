/**
 * Real-Time API Server with Production RPC Integration
 * WebSocket-enabled server for live Solana protocol monitoring
 */

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { createServer } = require('http');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, param, validationResult } = require('express-validator');
require('dotenv').config();

// Import our enhanced monitoring system
const RealTimeProtocolMonitor = require('../lib/real-time-monitor.js');
const SolanaProtocolTester = require('../lib/solana-tester');
const CICDManager = require('../lib/cicd-manager');

const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });

const PORT = process.env.PORT || 3001;

// Enhanced security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "ws:", "wss:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));

// Enhanced rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // increased for real-time dashboard
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

// WebSocket rate limiting
const wsConnections = new Map();
const wsRateLimit = (ws, req) => {
  const ip = req.socket.remoteAddress;
  const now = Date.now();
  
  if (!wsConnections.has(ip)) {
    wsConnections.set(ip, { count: 1, resetTime: now + 60000 });
    return true;
  }
  
  const connInfo = wsConnections.get(ip);
  if (now > connInfo.resetTime) {
    wsConnections.set(ip, { count: 1, resetTime: now + 60000 });
    return true;
  }
  
  if (connInfo.count >= 10) { // Max 10 connections per IP per minute
    return false;
  }
  
  connInfo.count++;
  return true;
};

// Production RPC providers configuration
const rpcProviders = [
  {
    name: 'Helius',
    mainnet: process.env.HELIUS_MAINNET_URL || 'https://rpc.helius.xyz/',
    testnet: process.env.HELIUS_TESTNET_URL || 'https://rpc.helius.xyz/',
    devnet: process.env.HELIUS_DEVNET_URL || 'https://rpc.helius.xyz/',
    websocket: {
      mainnet: process.env.HELIUS_MAINNET_WS || 'wss://rpc.helius.xyz/',
      testnet: process.env.HELIUS_TESTNET_WS || 'wss://rpc.helius.xyz/',
      devnet: process.env.HELIUS_DEVNET_WS || 'wss://rpc.helius.xyz/'
    },
    apiKey: process.env.HELIUS_API_KEY,
    rateLimit: 100
  },
  {
    name: 'QuickNode',
    mainnet: process.env.QUICKNODE_MAINNET_URL || 'https://solana-mainnet.quicknode.pro/v1/',
    testnet: process.env.QUICKNODE_TESTNET_URL || 'https://solana-testnet.quicknode.pro/v1/',
    devnet: process.env.QUICKNODE_DEVNET_URL || 'https://solana-devnet.quicknode.pro/v1/',
    websocket: {
      mainnet: process.env.QUICKNODE_MAINNET_WS || 'wss://solana-mainnet.quicknode.pro/v1/',
      testnet: process.env.QUICKNODE_TESTNET_WS || 'wss://solana-testnet.quicknode.pro/v1/',
      devnet: process.env.QUICKNODE_DEVNET_WS || 'wss://solana-devnet.quicknode.pro/v1/'
    },
    apiKey: process.env.QUICKNODE_API_KEY,
    rateLimit: 100
  },
  {
    name: 'Alchemy',
    mainnet: process.env.ALCHEMY_MAINNET_URL || 'https://solana-mainnet.g.alchemy.com/v2/',
    testnet: process.env.ALCHEMY_TESTNET_URL || 'https://solana-testnet.g.alchemy.com/v2/',
    devnet: process.env.ALCHEMY_DEVNET_URL || 'https://solana-devnet.g.alchemy.com/v2/',
    websocket: {
      mainnet: process.env.ALCHEMY_MAINNET_WS || 'wss://solana-mainnet.g.alchemy.com/v2/',
      testnet: process.env.ALCHEMY_TESTNET_WS || 'wss://solana-testnet.g.alchemy.com/v2/',
      devnet: process.env.ALCHEMY_DEVNET_WS || 'wss://solana-devnet.g.alchemy.com/v2/'
    },
    apiKey: process.env.ALCHEMY_API_KEY,
    rateLimit: 300
  }
];

// Initialize enhanced monitoring system
const monitor = new RealTimeProtocolMonitor({
  network: process.env.SOLANA_NETWORK || 'mainnet',
  rpcProviders: rpcProviders.filter(provider => 
    provider.apiKey || provider.name === 'Solana Labs'
  ),
  enableAlerts: true,
  metricsRetention: 24
});

// Initialize other services
const protocolTester = new SolanaProtocolTester(
  process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com'
);

const cicdManager = new CICDManager({
  githubToken: process.env.GITHUB_TOKEN,
  workspaceRoot: process.cwd()
});

// Real-time data storage
let connectedClients = new Set();
let alertHistory = [];
let systemMetrics = {
  uptime: 0,
  totalRequests: 0,
  errorRate: 0,
  avgResponseTime: 0
};

// Request tracking middleware
app.use((req, res, next) => {
  const startTime = Date.now();
  systemMetrics.totalRequests++;
  
  res.on('finish', () => {
    const responseTime = Date.now() - startTime;
    systemMetrics.avgResponseTime = (systemMetrics.avgResponseTime + responseTime) / 2;
    
    if (res.statusCode >= 400) {
      systemMetrics.errorRate = (systemMetrics.errorRate + 1) / 2;
    }
  });
  
  next();
});

// Auth middleware with enhanced security
const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  
  if (req.path === '/api/health' || req.path === '/api/metrics/public') {
    return next();
  }
  
  if (!process.env.API_KEY) {
    console.warn('⚠️  API_KEY not set - running in development mode');
    return next();
  }
  
  if (!apiKey || !apiKey.includes(process.env.API_KEY)) {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      message: 'Valid API key required' 
    });
  }
  
  next();
};

// Input validation helper
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

// Enhanced health check with detailed system info
app.get('/api/health', (req, res) => {
  const dashboardData = monitor.getDashboardData();
  
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    network: process.env.SOLANA_NETWORK || 'mainnet',
    monitoring: {
      isActive: monitor.isMonitoring,
      providers: Object.keys(dashboardData.network).length,
      protocols: dashboardData.protocols.length,
      connectedClients: connectedClients.size
    },
    system: systemMetrics
  });
});

// Real-time dashboard data
app.get('/api/dashboard/data', authMiddleware, (req, res) => {
  try {
    const dashboardData = monitor.getDashboardData();
    
    res.json({
      timestamp: new Date().toISOString(),
      ...dashboardData,
      alerts: alertHistory.slice(-10),
      system: systemMetrics
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
});

// Network metrics API
app.get('/api/metrics/network', authMiddleware, (req, res) => {
  const { provider, timeframe = '1h' } = req.query;
  
  try {
    let metrics = [];
    
    if (provider) {
      metrics = monitor.getMetrics(`network.${provider}`, getTimeframeLimitent(timeframe));
    } else {
      // Get metrics from all providers
      const dashboardData = monitor.getDashboardData();
      Object.keys(dashboardData.network).forEach(providerName => {
        const providerMetrics = monitor.getMetrics(`network.${providerName}`, getTimeframeLimitent(timeframe));
        metrics = metrics.concat(providerMetrics.map(m => ({ ...m, provider: providerName })));
      });
    }
    
    res.json({
      timeframe,
      provider: provider || 'all',
      metrics: metrics.sort((a, b) => a.timestamp - b.timestamp),
      count: metrics.length
    });
  } catch (error) {
    console.error('Network metrics error:', error);
    res.status(500).json({
      error: 'Failed to fetch network metrics',
      message: error.message
    });
  }
});

// Protocol metrics API
app.get('/api/metrics/protocols', authMiddleware, (req, res) => {
  const { protocol, timeframe = '1h' } = req.query;
  
  try {
    let metrics = [];
    
    if (protocol) {
      metrics = monitor.getMetrics(`protocol.${protocol.toLowerCase()}`, getTimeframeLimitent(timeframe));
    } else {
      // Get metrics from all protocols
      const dashboardData = monitor.getDashboardData();
      dashboardData.protocols.forEach(p => {
        const protocolMetrics = monitor.getMetrics(`protocol.${p.name.toLowerCase()}`, getTimeframeLimitent(timeframe));
        metrics = metrics.concat(protocolMetrics.map(m => ({ ...m, protocol: p.name })));
      });
    }
    
    res.json({
      timeframe,
      protocol: protocol || 'all',
      metrics: metrics.sort((a, b) => a.timestamp - b.timestamp),
      count: metrics.length
    });
  } catch (error) {
    console.error('Protocol metrics error:', error);
    res.status(500).json({
      error: 'Failed to fetch protocol metrics',
      message: error.message
    });
  }
});

// Alert management API
app.get('/api/alerts', authMiddleware, (req, res) => {
  const { severity, limit = 50 } = req.query;
  
  let filteredAlerts = alertHistory;
  
  if (severity) {
    filteredAlerts = alertHistory.filter(alert => alert.severity === severity);
  }
  
  res.json({
    alerts: filteredAlerts.slice(-parseInt(limit)),
    total: filteredAlerts.length,
    unresolved: filteredAlerts.filter(alert => !alert.resolved).length
  });
});

// Mark alert as resolved
app.post('/api/alerts/:alertId/resolve', 
  authMiddleware,
  [param('alertId').isString().withMessage('Alert ID must be a string')],
  handleValidationErrors,
  (req, res) => {
    const { alertId } = req.params;
    
    const alertIndex = alertHistory.findIndex(alert => alert.id === alertId);
    if (alertIndex === -1) {
      return res.status(404).json({ error: 'Alert not found' });
    }
    
    alertHistory[alertIndex].resolved = true;
    alertHistory[alertIndex].resolvedAt = new Date().toISOString();
    
    // Broadcast to connected clients
    broadcastToClients({
      type: 'alert_resolved',
      data: alertHistory[alertIndex]
    });
    
    res.json({
      message: 'Alert marked as resolved',
      alert: alertHistory[alertIndex]
    });
  }
);

// Protocol testing endpoint (enhanced)
app.post('/api/protocols/test',
  authMiddleware,
  [
    body('protocol').isIn(['jupiter', 'kamino', 'drift', 'raydium', 'all'])
      .withMessage('Invalid protocol name'),
    body('testType').optional().isIn(['basic', 'advanced', 'stress'])
      .withMessage('Invalid test type')
  ],
  handleValidationErrors,
  async (req, res) => {
    const { protocol, testType = 'basic' } = req.body;
    const testId = `test-${Date.now()}`;
    
    try {
      let results;
      
      if (protocol === 'all') {
        results = await Promise.allSettled([
          protocolTester.testJupiterSwap('So11111111111111111111111111111111111111112', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 1),
          protocolTester.testKaminoLending(),
          protocolTester.testDriftProtocol(),
          protocolTester.testRaydiumLiquidity()
        ]);
        
        results = {
          jupiter: results[0].status === 'fulfilled' ? results[0].value : { success: false, error: results[0].reason },
          kamino: results[1].status === 'fulfilled' ? results[1].value : { success: false, error: results[1].reason },
          drift: results[2].status === 'fulfilled' ? results[2].value : { success: false, error: results[2].reason },
          raydium: results[3].status === 'fulfilled' ? results[3].value : { success: false, error: results[3].reason }
        };
      } else {
        switch (protocol) {
          case 'jupiter':
            results = await protocolTester.testJupiterSwap('So11111111111111111111111111111111111111112', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 1);
            break;
          case 'kamino':
            results = await protocolTester.testKaminoLending();
            break;
          case 'drift':
            results = await protocolTester.testDriftProtocol();
            break;
          case 'raydium':
            results = await protocolTester.testRaydiumLiquidity();
            break;
        }
      }
      
      // Broadcast test results
      broadcastToClients({
        type: 'protocol_test_result',
        data: {
          testId,
          protocol,
          testType,
          results,
          timestamp: new Date().toISOString()
        }
      });
      
      res.json({
        testId,
        protocol,
        testType,
        results,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Protocol test error:', error);
      res.status(500).json({
        error: 'Protocol test failed',
        message: error.message,
        testId
      });
    }
  }
);

// Public metrics endpoint (rate limited)
const publicMetricsLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30, // 30 requests per minute
});

app.get('/api/metrics/public', publicMetricsLimiter, (req, res) => {
  const dashboardData = monitor.getDashboardData();
  
  // Return only public/aggregated metrics
  res.json({
    timestamp: new Date().toISOString(),
    network: {
      status: Object.values(dashboardData.network).every(n => n.status === 'healthy') ? 'healthy' : 'degraded',
      averageLatency: Object.values(dashboardData.network).reduce((acc, n) => acc + n.latency, 0) / Object.keys(dashboardData.network).length,
      providers: Object.keys(dashboardData.network).length
    },
    protocols: {
      total: dashboardData.protocols.length,
      healthy: dashboardData.protocols.filter(p => p.status === 'healthy').length,
      degraded: dashboardData.protocols.filter(p => p.status === 'degraded').length,
      down: dashboardData.protocols.filter(p => p.status === 'down').length
    },
    uptime: dashboardData.uptime
  });
});

// WebSocket connection handling
// SECURITY PATCH: WebSocket connection tracking
const ipConnections = new Map();
const MAX_WS_CONNECTIONS_PER_IP = 3;

wss.on('connection', (ws, req) => {
  const ip = req.socket.remoteAddress;
  const currentCount = ipConnections.get(ip) || 0;
  
  if (currentCount >= MAX_WS_CONNECTIONS_PER_IP) {
    console.log(`🚨 WebSocket connection limit exceeded for IP: ${ip}`);
    ws.close(1008, 'Connection limit exceeded');
    return;
  }
  
  ipConnections.set(ip, currentCount + 1);
  
  // Clean up on disconnect
  ws.on('close', () => {
    const count = ipConnections.get(ip) || 0;
    if (count <= 1) {
      ipConnections.delete(ip);
    } else {
      ipConnections.set(ip, count - 1);
    }
  });
  // Rate limiting check
  if (!wsRateLimit(ws, req)) {
    ws.close(1008, 'Rate limit exceeded');
    return;
  }
  
  console.log('📡 WebSocket client connected');
  connectedClients.add(ws);
  
  // Send initial dashboard data
  const initialData = monitor.getDashboardData();
  ws.send(JSON.stringify({
    type: 'initial_data',
    data: {
      ...initialData,
      alerts: alertHistory.slice(-10),
      system: systemMetrics,
      timestamp: new Date().toISOString()
    }
  }));
  
  // Handle incoming messages
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleWebSocketMessage(ws, data);
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });
  
  // Handle disconnection
  ws.on('close', () => {
    console.log('📡 WebSocket client disconnected');
    connectedClients.delete(ws);
  });
  
  // Handle errors
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
    connectedClients.delete(ws);
  });
});

// WebSocket message handler
function handleWebSocketMessage(ws, data) {
  switch (data.type) {
    case 'subscribe':
      // Handle subscription to specific data streams
      ws.subscriptions = ws.subscriptions || new Set();
      if (data.streams) {
        data.streams.forEach(stream => ws.subscriptions.add(stream));
      }
      break;
      
    case 'unsubscribe':
      // Handle unsubscription
      if (ws.subscriptions && data.streams) {
        data.streams.forEach(stream => ws.subscriptions.delete(stream));
      }
      break;
      
    case 'ping':
      // Health check
      ws.send(JSON.stringify({ type: 'pong', timestamp: new Date().toISOString() }));
      break;
      
    default:
      console.warn('Unknown WebSocket message type:', data.type);
  }
}

// Broadcast to all connected clients
function broadcastToClients(message) {
  connectedClients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      // Check if client is subscribed to this type of message
      if (!client.subscriptions || client.subscriptions.has(message.type) || client.subscriptions.has('all')) {
        client.send(JSON.stringify(message));
      }
    }
  });
}

// Helper function to convert timeframe to limit
function getTimeframeLimitent(timeframe) {
  switch (timeframe) {
    case '5m': return 30;   // 5 minutes
    case '15m': return 90;  // 15 minutes
    case '1h': return 360;  // 1 hour
    case '6h': return 2160; // 6 hours
    case '24h': return 8640; // 24 hours
    default: return 360;
  }
}

// Monitor event handlers
monitor.on('network_metrics', (data) => {
  broadcastToClients({
    type: 'network_metrics',
    data
  });
});

monitor.on('protocol_metrics', (data) => {
  broadcastToClients({
    type: 'protocol_metrics',
    data
  });
});

monitor.on('alert', (alert) => {
  const alertData = {
    id: `alert-${Date.now()}`,
    ...alert,
    resolved: false
  };
  
  alertHistory.push(alertData);
  
  // Keep only last 1000 alerts
  if (alertHistory.length > 1000) {
    alertHistory = alertHistory.slice(-1000);
  }
  
  broadcastToClients({
    type: 'alert',
    data: alertData
  });
  
  console.log(`🚨 Alert: ${alert.rule.name} - ${alert.value} ${alert.rule.condition}`);
});

monitor.on('health_check', (data) => {
  broadcastToClients({
    type: 'health_check',
    data
  });
});

monitor.on('monitoring_started', (data) => {
  console.log('🚀 Real-time monitoring started');
  broadcastToClients({
    type: 'monitoring_status',
    data: { status: 'started', ...data }
  });
});

monitor.on('monitoring_stopped', (data) => {
  console.log('🛑 Real-time monitoring stopped');
  broadcastToClients({
    type: 'monitoring_status',
    data: { status: 'stopped', ...data }
  });
});

// Regular dashboard updates
setInterval(() => {
  broadcastToClients({
    type: 'dashboard_update',
    data: {
      ...monitor.getDashboardData(),
      system: systemMetrics,
      timestamp: new Date().toISOString()
    }
  });
}, 5000); // Every 5 seconds

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('🔄 Shutting down gracefully...');
  
  await monitor.stopMonitoring();
  
  wss.clients.forEach(client => {
    client.close(1001, 'Server shutting down');
  });
  
  server.close(() => {
    console.log('✅ Server shut down successfully');
    process.exit(0);
  });
});

// Start the enhanced monitoring system
// SECURITY PATCH: Automatic monitoring disabled
// monitor.startMonitoring().catch(console.error);
console.log('🛡️  Security: Real-time monitoring disabled by default. Use API to enable with limits.');

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Real-time Solana DevEx API server running on port ${PORT}`);
  console.log(`📊 Dashboard: http://localhost:${PORT}/api/dashboard/data`);
  console.log(`🔗 WebSocket: ws://localhost:${PORT}`);
  console.log(`🏥 Health: http://localhost:${PORT}/api/health`);
  console.log(`🌐 Network: ${process.env.SOLANA_NETWORK || 'mainnet'}`);
});

module.exports = { app, server, wss, monitor };