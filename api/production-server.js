/**
 * PRODUCTION-GRADE SERVER
 * Enterprise-ready API server optimized for handling dozens of agent teams simultaneously
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;
const { body, param, validationResult } = require('express-validator');
require('dotenv').config();

// Import production-grade modules
const ProductionWebSocketManager = require('./production-websocket-manager');
const ProductionMonitor = require('./production-monitor');
const ProductionCache = require('./production-cache');
const ProductionDatabase = require('./production-database');
const ProductionRateLimiter = require('./production-rate-limiter');
const HealthMonitor = require('./health-monitor');
const LoadBalancer = require('./load-balancer');

// Performance monitoring
const performanceMonitor = {
  requests: 0,
  errors: 0,
  startTime: Date.now(),
  memory: process.memoryUsage(),
  cpu: process.cpuUsage(),
  responses: new Map(), // Track response times
  
  updateStats() {
    this.memory = process.memoryUsage();
    this.cpu = process.cpuUsage();
  },
  
  getStats() {
    return {
      requests: this.requests,
      errors: this.errors,
      uptime: Date.now() - this.startTime,
      memory: {
        used: Math.round(this.memory.heapUsed / 1024 / 1024),
        total: Math.round(this.memory.heapTotal / 1024 / 1024),
        external: Math.round(this.memory.external / 1024 / 1024),
        rss: Math.round(this.memory.rss / 1024 / 1024)
      },
      avgResponseTime: this.getAverageResponseTime(),
      errorRate: this.requests > 0 ? (this.errors / this.requests * 100) : 0
    };
  },
  
  getAverageResponseTime() {
    if (this.responses.size === 0) return 0;
    let total = 0;
    this.responses.forEach(time => total += time);
    return Math.round(total / this.responses.size);
  }
};

// Update performance stats every 30 seconds
setInterval(() => {
  performanceMonitor.updateStats();
  // Clean old response times (keep last 1000)
  if (performanceMonitor.responses.size > 1000) {
    const entries = Array.from(performanceMonitor.responses.entries());
    const recent = entries.slice(-1000);
    performanceMonitor.responses.clear();
    recent.forEach(([id, time]) => performanceMonitor.responses.set(id, time));
  }
}, 30000);

// Cluster setup for multi-core scaling
if (cluster.isMaster && process.env.NODE_ENV === 'production') {
  console.log(`Master ${process.pid} is running`);
  console.log(`Spawning ${numCPUs} workers...`);

  // Fork workers
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`Worker ${worker.process.pid} died. Spawning replacement...`);
    cluster.fork();
  });

  // Master process handles load balancing and coordination
  const loadBalancer = new LoadBalancer();
  loadBalancer.start();

  return;
}

// Worker process
console.log(`Worker ${process.pid} started`);

const app = express();
const PORT = process.env.PORT || (3001 + cluster.worker.id);

// Production middleware stack
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      connectSrc: ["'self'", "wss:", "ws:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));

app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) return false;
    return compression.filter(req, res);
  }
}));

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
}));

app.use(express.json({ 
  limit: '50mb',
  verify: (req, res, buf, encoding) => {
    // Validate JSON before parsing
    if (buf.length > 50 * 1024 * 1024) {
      throw new Error('Request too large');
    }
  }
}));

// Initialize production components
const cache = new ProductionCache({
  maxSize: 10000,
  ttl: 300000, // 5 minutes
  checkPeriod: 60000 // Check every minute
});

const database = new ProductionDatabase({
  maxConnections: 100,
  acquireTimeoutMillis: 30000,
  idleTimeoutMillis: 30000,
  retries: 3
});

const rateLimiter = new ProductionRateLimiter({
  redis: process.env.REDIS_URL,
  windowMs: 15 * 60 * 1000, // 15 minutes
  limits: {
    default: 1000, // 1000 requests per 15 minutes
    expensive: 10, // 10 expensive operations per 15 minutes
    burst: 100, // 100 requests in burst window
    concurrent: 50 // Max 50 concurrent requests per IP
  }
});

const wsManager = new ProductionWebSocketManager({
  maxConnections: 10000,
  maxConnectionsPerIP: 100,
  heartbeatInterval: 30000,
  compression: true,
  rateLimiting: true,
  clustering: true
});

const monitor = new ProductionMonitor({
  batchSize: 100,
  flushInterval: 5000,
  maxMetrics: 50000,
  compression: true,
  sampling: 0.1 // Sample 10% for heavy metrics
});

const healthMonitor = new HealthMonitor({
  checkInterval: 10000,
  alertThresholds: {
    memory: 85, // Alert if memory > 85%
    cpu: 80,    // Alert if CPU > 80%
    latency: 2000, // Alert if avg latency > 2s
    errorRate: 5   // Alert if error rate > 5%
  }
});

// Performance tracking middleware
app.use((req, res, next) => {
  const start = Date.now();
  const requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  req.requestId = requestId;
  req.startTime = start;
  
  performanceMonitor.requests++;
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    performanceMonitor.responses.set(requestId, duration);
    
    if (res.statusCode >= 400) {
      performanceMonitor.errors++;
    }
    
    // Log slow requests
    if (duration > 5000) {
      console.warn(`Slow request: ${req.method} ${req.path} - ${duration}ms`);
    }
  });
  
  next();
});

// Production rate limiting
app.use('/api/', rateLimiter.createLimiter('default'));
app.use('/api/tests/run', rateLimiter.createLimiter('expensive'));
app.use('/api/pipelines/deploy', rateLimiter.createLimiter('expensive'));

// Input validation middleware
const validateInput = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    performanceMonitor.errors++;
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
      requestId: req.requestId
    });
  }
  next();
};

// Authentication middleware
const authenticate = async (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  
  if (req.path === '/api/health' || req.path === '/api/metrics/public') {
    return next();
  }
  
  if (!process.env.API_KEY) {
    return res.status(503).json({ 
      error: 'Service unavailable',
      message: 'API_KEY configuration required',
      requestId: req.requestId
    });
  }
  
  // Check cache first
  const cacheKey = `auth:${apiKey}`;
  const cached = cache.get(cacheKey);
  if (cached === 'valid') {
    return next();
  } else if (cached === 'invalid') {
    return res.status(401).json({ 
      error: 'Unauthorized', 
      requestId: req.requestId
    });
  }
  
  // Validate API key
  const isValid = apiKey && apiKey.includes(process.env.API_KEY);
  cache.set(cacheKey, isValid ? 'valid' : 'invalid', 300000); // Cache for 5 minutes
  
  if (!isValid) {
    return res.status(401).json({ 
      error: 'Unauthorized',
      requestId: req.requestId
    });
  }
  
  next();
};

// Error handling middleware
app.use((error, req, res, next) => {
  performanceMonitor.errors++;
  
  console.error('Server error:', {
    error: error.message,
    stack: error.stack,
    requestId: req.requestId,
    path: req.path,
    method: req.method
  });
  
  // Don't leak error details in production
  const isDev = process.env.NODE_ENV !== 'production';
  
  res.status(error.statusCode || 500).json({
    error: 'Internal server error',
    message: isDev ? error.message : 'Something went wrong',
    requestId: req.requestId,
    ...(isDev && { stack: error.stack })
  });
});

// OPTIMIZED API ROUTES

// Health check with detailed system status
app.get('/api/health', async (req, res) => {
  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
    worker: process.pid,
    uptime: process.uptime(),
    performance: performanceMonitor.getStats(),
    dependencies: {
      database: await database.healthCheck(),
      cache: cache.healthCheck(),
      websockets: wsManager.getStats(),
      monitor: monitor.getStats()
    },
    version: '2.0.0'
  };
  
  // Determine overall health status
  const dbHealth = health.dependencies.database.status === 'healthy';
  const memoryOk = health.performance.memory.used < health.performance.memory.total * 0.9;
  const errorRateOk = health.performance.errorRate < 10;
  
  if (!dbHealth || !memoryOk || !errorRateOk) {
    health.status = 'degraded';
  }
  
  res.json(health);
});

// Get comprehensive metrics with caching
app.get('/api/metrics', authenticate, async (req, res) => {
  const cacheKey = `metrics:${req.query.timeframe || '1h'}`;
  let metrics = cache.get(cacheKey);
  
  if (!metrics) {
    metrics = await monitor.getMetrics({
      timeframe: req.query.timeframe || '1h',
      aggregation: req.query.aggregation || 'avg',
      protocols: req.query.protocols?.split(','),
      includeAlerts: req.query.includeAlerts === 'true'
    });
    
    cache.set(cacheKey, metrics, 30000); // Cache for 30 seconds
  }
  
  res.json({
    ...metrics,
    requestId: req.requestId,
    cached: cache.get(cacheKey) !== undefined
  });
});

// Public metrics (limited data, heavily cached)
app.get('/api/metrics/public', rateLimiter.createLimiter('burst'), async (req, res) => {
  const cacheKey = 'metrics:public';
  let publicMetrics = cache.get(cacheKey);
  
  if (!publicMetrics) {
    const fullMetrics = await monitor.getMetrics({ timeframe: '1h' });
    
    publicMetrics = {
      network: {
        status: fullMetrics.network?.status || 'unknown',
        latency: fullMetrics.network?.avgLatency || 0,
        tps: fullMetrics.network?.tps || 0
      },
      protocols: Object.entries(fullMetrics.protocols || {}).reduce((acc, [name, data]) => {
        acc[name] = {
          status: data.status,
          latency: data.avgLatency
        };
        return acc;
      }, {}),
      timestamp: new Date().toISOString()
    };
    
    cache.set(cacheKey, publicMetrics, 60000); // Cache for 1 minute
  }
  
  res.json({
    ...publicMetrics,
    requestId: req.requestId
  });
});

// Optimized test execution with queuing
app.post('/api/tests/run', 
  authenticate,
  [
    body('protocols').optional().isArray().withMessage('protocols must be an array'),
    body('protocols.*').optional().isIn(['jupiter', 'kamino', 'drift', 'raydium']).withMessage('Invalid protocol'),
    body('priority').optional().isIn(['low', 'normal', 'high']).withMessage('Invalid priority'),
    body('timeout').optional().isInt({ min: 1000, max: 300000 }).withMessage('Invalid timeout')
  ],
  validateInput,
  async (req, res) => {
    const { protocols = ['jupiter', 'kamino'], priority = 'normal', timeout = 30000 } = req.body;
    
    try {
      const testJob = await monitor.queueTest({
        protocols,
        priority,
        timeout,
        requestId: req.requestId,
        initiatedBy: req.headers['x-api-key']?.substr(0, 10) + '...'
      });
      
      res.json({
        message: 'Test queued successfully',
        testId: testJob.id,
        estimatedStartTime: testJob.estimatedStartTime,
        position: testJob.queuePosition,
        requestId: req.requestId
      });
    } catch (error) {
      res.status(500).json({
        error: 'Failed to queue test',
        message: error.message,
        requestId: req.requestId
      });
    }
  }
);

// Get test results with pagination and filtering
app.get('/api/tests', authenticate, async (req, res) => {
  const {
    page = 1,
    limit = 20,
    status,
    protocol,
    since
  } = req.query;
  
  try {
    const results = await database.getTestResults({
      page: parseInt(page),
      limit: parseInt(limit),
      status,
      protocol,
      since,
      includeDetails: req.query.details === 'true'
    });
    
    res.json({
      ...results,
      requestId: req.requestId
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to fetch test results',
      message: error.message,
      requestId: req.requestId
    });
  }
});

// WebSocket endpoint with production optimizations
const server = require('http').createServer(app);
wsManager.initialize(server);

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  
  server.close(() => {
    console.log('HTTP server closed');
    
    Promise.all([
      database.close(),
      cache.close(),
      monitor.close(),
      wsManager.close()
    ]).then(() => {
      console.log('All connections closed');
      process.exit(0);
    }).catch((error) => {
      console.error('Error during shutdown:', error);
      process.exit(1);
    });
  });
});

// Memory monitoring and alerts
setInterval(() => {
  const memUsage = process.memoryUsage();
  const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
  
  if (memPercent > 85) {
    console.warn(`High memory usage: ${memPercent.toFixed(2)}%`);
    healthMonitor.triggerAlert('memory', memPercent);
    
    // Force garbage collection if available
    if (global.gc) {
      global.gc();
      console.log('Forced garbage collection');
    }
  }
}, 30000);

server.listen(PORT, () => {
  console.log(`[INIT] Production server running on port ${PORT} (Worker ${process.pid})`);
  console.log(`[INFO] Metrics Performance monitoring enabled`);
  console.log(`[CONFIG] Environment: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = { app, server, performanceMonitor };