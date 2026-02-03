const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { Connection, clusterApiUrl } = require('@solana/web3.js');
const axios = require('axios');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { body, param, validationResult } = require('express-validator');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
app.use('/api/', limiter);

// API Authentication middleware
const authMiddleware = (req, res, next) => {
  const apiKey = req.headers['x-api-key'] || req.headers['authorization'];
  
  // Allow health checks without auth
  if (req.path === '/api/health') {
    return next();
  }
  
  // For now, if no API key env var is set, allow all requests (dev mode)
  if (!process.env.API_KEY) {
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

// Solana connection
const connection = new Connection(clusterApiUrl('devnet'));

// In-memory storage (use Redis in production)
let testResults = [];
let protocolHealth = {};
let deployments = [];
let realTimeMetrics = {
  testsRun: 0,
  successRate: 95.5,
  avgLatency: 150,
  activeDeployments: 3
};

// Protocol testing framework
class ProtocolTester {
  async testJupiterSwap(fromToken, toToken, amount) {
    try {
      // Mock Jupiter API call for testing
      const response = await axios.get('https://quote-api.jup.ag/v6/quote', {
        params: {
          inputMint: fromToken,
          outputMint: toToken,
          amount: amount * 1000000, // Convert to lamports
          slippageBps: 50
        }
      });
      
      return {
        success: true,
        data: response.data,
        latency: Math.random() * 200 + 50,
        message: 'Jupiter swap quote retrieved successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        latency: 0,
        message: 'Failed to get Jupiter quote'
      };
    }
  }

  async testKaminoLending() {
    try {
      // Mock Kamino lending test
      await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
      
      const success = Math.random() > 0.1; // 90% success rate
      return {
        success,
        latency: Math.random() * 300 + 100,
        message: success ? 'Kamino lending integration healthy' : 'Kamino lending test failed',
        data: {
          pools: ['USDC-SOL', 'ETH-SOL', 'mSOL-SOL'],
          totalTvl: '45.6M',
          activePositions: 1247
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        latency: 0,
        message: 'Kamino test failed'
      };
    }
  }

  async testDriftProtocol() {
    try {
      // Mock Drift protocol test
      await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1200));
      
      const success = Math.random() > 0.15; // 85% success rate
      return {
        success,
        latency: Math.random() * 400 + 150,
        message: success ? 'Drift protocol responding' : 'Drift protocol degraded',
        data: {
          markets: ['SOL-PERP', 'BTC-PERP', 'ETH-PERP'],
          totalVolume24h: '12.3M',
          openInterest: '5.6M'
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        latency: 0,
        message: 'Drift test failed'
      };
    }
  }

  async testRaydiumLiquidity() {
    try {
      // Mock Raydium test - simulate occasional failures
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 800));
      
      const success = Math.random() > 0.3; // 70% success rate (degraded)
      return {
        success,
        latency: success ? Math.random() * 200 + 100 : 0,
        message: success ? 'Raydium pools accessible' : 'Raydium experiencing issues',
        data: success ? {
          pools: 156,
          totalTvl: '23.8M',
          volume24h: '8.9M'
        } : null
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        latency: 0,
        message: 'Raydium test failed'
      };
    }
  }
}

const protocolTester = new ProtocolTester();

// Routes

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Get all test results
app.get('/api/tests', (req, res) => {
  res.json({
    tests: testResults,
    summary: {
      total: testResults.length,
      passed: testResults.filter(t => t.status === 'passed').length,
      failed: testResults.filter(t => t.status === 'failed').length,
      running: testResults.filter(t => t.status === 'running').length
    }
  });
});

// Run protocol tests
app.post('/api/tests/run', 
  authMiddleware,
  [
    body('protocols').optional().isArray().withMessage('protocols must be an array'),
    body('protocols.*').optional().isIn(['jupiter', 'kamino', 'drift', 'raydium']).withMessage('Invalid protocol name')
  ],
  handleValidationErrors,
  async (req, res) => {
    const { protocols } = req.body;
    const testId = Date.now().toString();
  
  const runTests = async () => {
    for (const protocol of protocols || ['jupiter', 'kamino', 'drift', 'raydium']) {
      const testStart = Date.now();
      let result;
      
      // Add test to running state
      const testEntry = {
        id: `${testId}-${protocol}`,
        name: `${protocol.charAt(0).toUpperCase() + protocol.slice(1)} Integration Test`,
        protocol: protocol,
        status: 'running',
        startedAt: new Date().toISOString(),
        duration: 0
      };
      
      testResults.unshift(testEntry);
      
      // Run the actual test
      switch (protocol) {
        case 'jupiter':
          result = await protocolTester.testJupiterSwap('So11111111111111111111111111111111111111112', 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 1);
          break;
        case 'kamino':
          result = await protocolTester.testKaminoLending();
          break;
        case 'drift':
          result = await protocolTester.testDriftProtocol();
          break;
        case 'raydium':
          result = await protocolTester.testRaydiumLiquidity();
          break;
        default:
          result = { success: false, message: 'Unknown protocol' };
      }
      
      // Update test result
      const testIndex = testResults.findIndex(t => t.id === testEntry.id);
      if (testIndex !== -1) {
        testResults[testIndex] = {
          ...testEntry,
          status: result.success ? 'passed' : 'failed',
          duration: (Date.now() - testStart) / 1000,
          completedAt: new Date().toISOString(),
          result: result,
          latency: result.latency
        };
      }
      
      // Update protocol health
      protocolHealth[protocol] = {
        name: protocol,
        status: result.success ? 'healthy' : 'degraded',
        latency: result.latency || 0,
        successRate: Math.random() * 10 + 90, // Mock success rate
        lastCheck: new Date().toISOString(),
        message: result.message
      };
    }
    
    // Update metrics
    realTimeMetrics.testsRun += protocols?.length || 4;
    realTimeMetrics.successRate = (testResults.filter(t => t.status === 'passed').length / testResults.filter(t => t.status !== 'running').length) * 100;
    realTimeMetrics.avgLatency = testResults.reduce((acc, t) => acc + (t.latency || 0), 0) / testResults.length;
  };
  
  // Run tests asynchronously
  runTests();
  
  res.json({
    message: 'Tests started',
    testId: testId,
    protocols: protocols || ['jupiter', 'kamino', 'drift', 'raydium']
  });
});

// Get protocol health status
app.get('/api/protocols/health', (req, res) => {
  res.json({
    protocols: Object.values(protocolHealth),
    lastUpdated: new Date().toISOString()
  });
});

// Get CI/CD pipeline status
app.get('/api/pipelines', (req, res) => {
  res.json({
    pipelines: deployments,
    summary: {
      total: deployments.length,
      success: deployments.filter(d => d.status === 'success').length,
      running: deployments.filter(d => d.status === 'running').length,
      failed: deployments.filter(d => d.status === 'failed').length
    }
  });
});

// Deploy pipeline
app.post('/api/pipelines/deploy',
  authMiddleware,
  [
    body('name').isString().isLength({ min: 1, max: 100 }).withMessage('Name must be 1-100 characters'),
    body('environment').optional().isIn(['devnet', 'testnet', 'mainnet']).withMessage('Invalid environment'),
    body('branch').optional().isString().isLength({ min: 1, max: 50 }).withMessage('Branch name must be 1-50 characters')
  ],
  handleValidationErrors,
  async (req, res) => {
    const { name, environment, branch } = req.body;
  
  const deploymentId = Date.now().toString();
  const deployment = {
    id: deploymentId,
    name: name || 'Unknown Project',
    environment: environment || 'devnet',
    branch: branch || 'main',
    status: 'running',
    progress: 0,
    stages: ['build', 'test', 'deploy', 'verify'],
    currentStage: 'build',
    startedAt: new Date().toISOString(),
    logs: []
  };
  
  deployments.unshift(deployment);
  
  // Simulate deployment process
  const simulateDeployment = async () => {
    const stages = ['build', 'test', 'deploy', 'verify'];
    const stageDurations = [2000, 3000, 4000, 1000]; // ms
    
    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i];
      const duration = stageDurations[i];
      
      // Update current stage
      const deploymentIndex = deployments.findIndex(d => d.id === deploymentId);
      if (deploymentIndex !== -1) {
        deployments[deploymentIndex].currentStage = stage;
        deployments[deploymentIndex].progress = (i / stages.length) * 100;
        deployments[deploymentIndex].logs.push({
          timestamp: new Date().toISOString(),
          level: 'info',
          message: `Starting ${stage} stage...`
        });
      }
      
      await new Promise(resolve => setTimeout(resolve, duration));
      
      // Random chance of failure
      if (Math.random() < 0.1 && i > 0) { // 10% chance of failure after build
        const failureIndex = deployments.findIndex(d => d.id === deploymentId);
        if (failureIndex !== -1) {
          deployments[failureIndex].status = 'failed';
          deployments[failureIndex].completedAt = new Date().toISOString();
          deployments[failureIndex].logs.push({
            timestamp: new Date().toISOString(),
            level: 'error',
            message: `${stage} stage failed: Simulated error`
          });
        }
        return;
      }
      
      // Success log
      const successIndex = deployments.findIndex(d => d.id === deploymentId);
      if (successIndex !== -1) {
        deployments[successIndex].logs.push({
          timestamp: new Date().toISOString(),
          level: 'success',
          message: `${stage} stage completed successfully`
        });
      }
    }
    
    // Mark as complete
    const completeIndex = deployments.findIndex(d => d.id === deploymentId);
    if (completeIndex !== -1) {
      deployments[completeIndex].status = 'success';
      deployments[completeIndex].progress = 100;
      deployments[completeIndex].completedAt = new Date().toISOString();
      deployments[completeIndex].logs.push({
        timestamp: new Date().toISOString(),
        level: 'success',
        message: 'Deployment completed successfully!'
      });
    }
  };
  
  simulateDeployment();
  
  res.json({
    message: 'Deployment started',
    deploymentId: deploymentId,
    deployment: deployment
  });
});

// Real-time metrics
app.get('/api/metrics', (req, res) => {
  res.json({
    metrics: realTimeMetrics,
    timestamp: new Date().toISOString()
  });
});

// WebSocket for real-time updates
const server = require('http').createServer(app);
const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected to WebSocket');
  
  // Send initial data
  ws.send(JSON.stringify({
    type: 'initial',
    data: {
      tests: testResults,
      protocols: Object.values(protocolHealth),
      pipelines: deployments,
      metrics: realTimeMetrics
    }
  }));
  
  ws.on('close', () => {
    console.log('Client disconnected from WebSocket');
  });
});

// Broadcast updates every 5 seconds
setInterval(() => {
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'update',
        data: {
          tests: testResults.slice(0, 10), // Latest 10 tests
          protocols: Object.values(protocolHealth),
          pipelines: deployments.slice(0, 5), // Latest 5 deployments
          metrics: realTimeMetrics
        }
      }));
    }
  });
}, 5000);

// Initialize comprehensive demo data
const initializeMockData = () => {
  // Initialize realistic protocol health
  const protocolData = {
    jupiter: { baseLatency: 120, baseSuccess: 99.5, status: 'healthy' },
    kamino: { baseLatency: 95, baseSuccess: 98.8, status: 'healthy' },
    drift: { baseLatency: 180, baseSuccess: 97.2, status: 'degraded' },
    raydium: { baseLatency: 250, baseSuccess: 94.1, status: 'degraded' }
  };
  
  Object.entries(protocolData).forEach(([protocol, data]) => {
    protocolHealth[protocol] = {
      name: protocol,
      status: data.status,
      latency: data.baseLatency + Math.random() * 20,
      successRate: data.baseSuccess + Math.random() * 2,
      lastCheck: new Date().toISOString(),
      message: `${protocol} ${data.status === 'healthy' ? 'is operational' : 'experiencing minor issues'}`
    };
  });
  
  // Initialize realistic test history
  const testHistory = [
    { protocol: 'jupiter', name: 'Jupiter V6 Swap Integration', status: 'passed', duration: 1.8 },
    { protocol: 'kamino', name: 'Kamino Lending Pool Validation', status: 'passed', duration: 2.1 },
    { protocol: 'drift', name: 'Drift Perpetuals Position Test', status: 'failed', duration: 0.9 },
    { protocol: 'raydium', name: 'Raydium AMM Liquidity Check', status: 'passed', duration: 1.5 },
    { protocol: 'jupiter', name: 'Price Impact Analysis', status: 'passed', duration: 0.7 },
    { protocol: 'drift', name: 'PnL Calculation Validation', status: 'passed', duration: 1.3 }
  ];
  
  testHistory.forEach((test, index) => {
    testResults.push({
      id: `test-${index}`,
      name: test.name,
      protocol: test.protocol,
      status: test.status,
      duration: test.duration,
      timestamp: `${Math.floor(Math.random() * 60)} min ago`,
      startedAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      completedAt: new Date(Date.now() - Math.random() * 3600000).toISOString(),
      latency: Math.random() * 300 + 50
    });
  });
  
  // Initialize comprehensive deployment history  
  const deploymentHistory = [
    {
      id: 'dep-prod-1',
      name: 'Autonomous Trading Agent v3.2',
      environment: 'mainnet',
      branch: 'release/v3.2',
      status: 'success',
      progress: 100,
      currentStage: 'completed',
      startedAt: new Date(Date.now() - 7200000).toISOString(),
      completedAt: new Date(Date.now() - 6000000).toISOString(),
      logs: [
        { timestamp: new Date(Date.now() - 7200000).toISOString(), level: 'info', message: 'Build started for mainnet deployment' },
        { timestamp: new Date(Date.now() - 6800000).toISOString(), level: 'success', message: 'All 47 tests passed' },
        { timestamp: new Date(Date.now() - 6200000).toISOString(), level: 'success', message: 'Deployed to mainnet successfully' }
      ]
    },
    {
      id: 'dep-staging-1',
      name: 'DeFi Yield Optimizer v2.1',
      environment: 'testnet',
      branch: 'feature/advanced-routing',
      status: 'running',
      progress: 78,
      currentStage: 'deploy',
      startedAt: new Date(Date.now() - 1200000).toISOString(),
      logs: [
        { timestamp: new Date(Date.now() - 1200000).toISOString(), level: 'info', message: 'Starting deployment pipeline' },
        { timestamp: new Date(Date.now() - 900000).toISOString(), level: 'success', message: 'Build completed successfully' },
        { timestamp: new Date(Date.now() - 600000).toISOString(), level: 'info', message: 'Deploying to testnet...' }
      ]
    },
    {
      id: 'dep-dev-1',
      name: 'Protocol Analytics Dashboard',
      environment: 'devnet',
      branch: 'hotfix/ui-improvements',
      status: 'failed',
      progress: 45,
      currentStage: 'test',
      startedAt: new Date(Date.now() - 2400000).toISOString(),
      completedAt: new Date(Date.now() - 2100000).toISOString(),
      logs: [
        { timestamp: new Date(Date.now() - 2400000).toISOString(), level: 'info', message: 'Pipeline started' },
        { timestamp: new Date(Date.now() - 2200000).toISOString(), level: 'success', message: 'Build stage completed' },
        { timestamp: new Date(Date.now() - 2100000).toISOString(), level: 'error', message: 'Integration tests failed: Jupiter API timeout' }
      ]
    }
  ];
  
  deployments.push(...deploymentHistory);
  
  // Update metrics based on demo data
  realTimeMetrics = {
    testsRun: testResults.length,
    successRate: (testResults.filter(t => t.status === 'passed').length / testResults.length) * 100,
    avgLatency: testResults.reduce((acc, t) => acc + (t.latency || 150), 0) / testResults.length,
    activeDeployments: deployments.filter(d => d.status === 'running').length,
    totalDeployments: deployments.length,
    healthyProtocols: Object.values(protocolHealth).filter(p => p.status === 'healthy').length
  };
};

initializeMockData();

server.listen(PORT, () => {
  console.log(`🚀 Solana DevEx API server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 WebSocket: ws://localhost:${PORT}`);
});