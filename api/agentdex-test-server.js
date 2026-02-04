/**
 * Simplified AgentDEX Test Server
 * Quick server to test AgentDEX integration without full complexity
 */

const express = require('express');
const cors = require('cors');
const AgentDEXMonitor = require('./agentdx-monitor');

const app = express();
const PORT = 3002; // Different port to avoid conflicts

// Basic middleware
app.use(cors());
app.use(express.json());

// Initialize AgentDEX monitoring system
const agentdxMonitor = new AgentDEXMonitor({
  baseUrl: process.env.AGENTDEX_BASE_URL || 'https://httpbin.org', // Use httpbin for testing
  monitoringInterval: 10000, // 10 seconds for testing
});

console.log('[INIT] Initializing AgentDEX monitor...');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    agentdex: {
      isMonitoring: agentdxMonitor.isMonitoring,
      endpoints: agentdxMonitor.endpoints.length
    }
  });
});

// AgentDEX metrics endpoint
app.get('/api/agentdx/metrics', (req, res) => {
  try {
    const metrics = agentdxMonitor.getMetrics();
    const summary = agentdxMonitor.getPerformanceSummary();
    
    res.json({
      timestamp: new Date().toISOString(),
      isMonitoring: metrics.isMonitoring,
      interval: metrics.monitoringInterval,
      summary,
      endpoints: metrics.endpoints.slice(0, 5), // Limit for readability
      lastUpdate: metrics.lastUpdate
    });
  } catch (error) {
    console.error('AgentDEX metrics error:', error);
    res.status(500).json({
      error: 'Failed to fetch AgentDEX metrics',
      message: error.message
    });
  }
});

// Dashboard data with AgentDEX
app.get('/api/dashboard/data', (req, res) => {
  try {
    const agentdxData = agentdxMonitor.getMetrics();
    const agentdxSummary = agentdxMonitor.getPerformanceSummary();
    
    res.json({
      timestamp: new Date().toISOString(),
      agentdx: {
        ...agentdxData,
        summary: agentdxSummary
      },
      alerts: [],
      system: {
        uptime: process.uptime(),
        totalRequests: 100,
        errorRate: 0,
        avgResponseTime: 150
      }
    });
  } catch (error) {
    console.error('Dashboard data error:', error);
    res.status(500).json({
      error: 'Failed to fetch dashboard data',
      message: error.message
    });
  }
});

// Start/Stop AgentDEX monitoring
app.post('/api/agentdx/monitoring/:action', async (req, res) => {
  const { action } = req.params;
  
  try {
    if (action === 'start') {
      await agentdxMonitor.startMonitoring();
      console.log('[SUCCESS] AgentDEX monitoring started');
      res.json({
        message: 'AgentDEX monitoring started',
        status: 'monitoring',
        timestamp: new Date().toISOString()
      });
    } else if (action === 'stop') {
      agentdxMonitor.stopMonitoring();
      console.log('[STOP] AgentDEX monitoring stopped');
      res.json({
        message: 'AgentDEX monitoring stopped',
        status: 'stopped',
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({ error: 'Invalid action. Use start or stop.' });
    }
  } catch (error) {
    console.error('AgentDEX monitoring control error:', error);
    res.status(500).json({
      error: `Failed to ${action} AgentDEX monitoring`,
      message: error.message
    });
  }
});

// AgentDEX monitor event handlers
agentdxMonitor.on('monitoring-started', (data) => {
  console.log('[INIT] AgentDEX monitoring started - 13 endpoints');
});

agentdxMonitor.on('monitoring-stopped', (data) => {
  console.log('[STOP] AgentDEX monitoring stopped');
});

agentdxMonitor.on('agentdx-metrics', (data) => {
  console.log(`[INFO] Metrics AgentDEX metrics - ${data.aggregated.healthyEndpoints}/${data.aggregated.totalEndpoints} healthy`);
});

agentdxMonitor.on('endpoint-checked', (data) => {
  console.log(`[SEARCH] ${data.endpoint}: ${data.metrics.status} (${data.metrics.responseTime.toFixed(0)}ms)`);
});

// Start the server
app.listen(PORT, () => {
  console.log(`[INIT] AgentDEX Test Server running on port ${PORT}`);
  console.log(`[INFO] Metrics Dashboard: http://localhost:${PORT}/api/dashboard/data`);
  console.log(`[HEALTH] Health: http://localhost:${PORT}/api/health`);
  console.log(`[TARGET] AgentDEX Metrics: http://localhost:${PORT}/api/agentdx/metrics`);
  console.log(`[CONFIG] Start monitoring: curl -X POST http://localhost:${PORT}/api/agentdx/monitoring/start`);
  
  // Auto-start monitoring for demo
  setTimeout(() => {
    console.log('[INIT] Auto-starting AgentDEX monitoring...');
    agentdxMonitor.startMonitoring().catch(console.error);
  }, 2000);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[SYNC] Shutting down gracefully...');
  agentdxMonitor.stopMonitoring();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\\n[SYNC] Shutting down gracefully...');
  agentdxMonitor.stopMonitoring();
  process.exit(0);
});

module.exports = app;