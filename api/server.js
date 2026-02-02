const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const { Connection, clusterApiUrl } = require('@solana/web3.js');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

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
app.post('/api/tests/run', async (req, res) => {
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
app.post('/api/pipelines/deploy', async (req, res) => {
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

// Initialize some mock data
const initializeMockData = () => {
  // Initialize protocol health
  ['jupiter', 'kamino', 'drift', 'raydium'].forEach(protocol => {
    protocolHealth[protocol] = {
      name: protocol,
      status: 'healthy',
      latency: Math.random() * 200 + 50,
      successRate: Math.random() * 10 + 90,
      lastCheck: new Date().toISOString(),
      message: `${protocol} is operational`
    };
  });
  
  // Initialize some deployment history
  deployments.push(
    {
      id: 'dep-1',
      name: 'Trading Bot v2.1',
      environment: 'mainnet',
      status: 'success',
      progress: 100,
      currentStage: 'completed',
      startedAt: new Date(Date.now() - 3600000).toISOString(),
      completedAt: new Date(Date.now() - 3000000).toISOString(),
      logs: []
    },
    {
      id: 'dep-2',
      name: 'DeFi Dashboard',
      environment: 'devnet',
      status: 'failed',
      progress: 25,
      currentStage: 'test',
      startedAt: new Date(Date.now() - 1800000).toISOString(),
      completedAt: new Date(Date.now() - 1500000).toISOString(),
      logs: []
    }
  );
};

initializeMockData();

server.listen(PORT, () => {
  console.log(`🚀 Solana DevEx API server running on port ${PORT}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
  console.log(`📊 WebSocket: ws://localhost:${PORT}`);
});