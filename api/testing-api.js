/**
 * Testing API Server - Production Grade
 * 
 * Real-time testing infrastructure API for Solana agents
 * Built on LiteSVM Protocol Tester
 */

const express = require('express');
const cors = require('cors');
const WebSocket = require('ws');
const ProductionLiteSVMTester = require('./litesvm-protocol-tester');
const path = require('path');
const fs = require('fs').promises;

class TestingAPIServer {
  constructor(options = {}) {
    this.port = options.port || 3333;
    this.app = express();
    this.server = null;
    this.wss = null;
    this.tester = new ProductionLiteSVMTester({
      verbose: options.verbose || false
    });
    
    this.activeTests = new Map();
    this.testHistory = [];
    this.clients = new Set();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
      next();
    });

    // Error handling
    this.app.use((err, req, res, next) => {
      console.error('API Error:', err);
      res.status(500).json({
        error: 'Internal server error',
        message: err.message
      });
    });
  }

  /**
   * Setup API routes
   */
  setupRoutes() {
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        tester: this.tester.getStatus()
      });
    });

    // Run protocol tests
    this.app.post('/api/test/protocols', async (req, res) => {
      try {
        const { protocols, options } = req.body;
        
        const testId = this.generateTestId();
        const testConfig = {
          id: testId,
          protocols: protocols || ['jupiter', 'raydium', 'kamino', 'drift', 'marinade'],
          options: options || {},
          startTime: Date.now(),
          status: 'running'
        };
        
        this.activeTests.set(testId, testConfig);
        
        // Start tests asynchronously
        this.runTestsAsync(testId, testConfig);
        
        res.json({
          testId,
          status: 'started',
          message: 'Protocol tests started',
          websocketUrl: `ws://localhost:${this.port}/ws`
        });
        
      } catch (error) {
        res.status(500).json({
          error: 'Failed to start tests',
          message: error.message
        });
      }
    });

    // Get test status
    this.app.get('/api/test/:testId/status', (req, res) => {
      const { testId } = req.params;
      const test = this.activeTests.get(testId);
      
      if (!test) {
        return res.status(404).json({
          error: 'Test not found',
          testId
        });
      }
      
      res.json(test);
    });

    // Get test results
    this.app.get('/api/test/:testId/results', async (req, res) => {
      try {
        const { testId } = req.params;
        const { format } = req.query;
        
        const resultsPath = path.join(__dirname, 'test-results', `${testId}-results.json`);
        const resultsData = await fs.readFile(resultsPath, 'utf8');
        const results = JSON.parse(resultsData);
        
        if (format === 'html') {
          const html = this.tester.generateHTMLReport(results);
          res.setHeader('Content-Type', 'text/html');
          return res.send(html);
        }
        
        if (format === 'csv') {
          const csv = this.tester.convertToCSV(results);
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', `attachment; filename="${testId}-results.csv"`);
          return res.send(csv);
        }
        
        res.json(results);
        
      } catch (error) {
        res.status(404).json({
          error: 'Results not found',
          message: error.message
        });
      }
    });

    // List test history
    this.app.get('/api/test/history', (req, res) => {
      const { limit } = req.query;
      const history = this.testHistory
        .slice(0, limit ? parseInt(limit) : 50)
        .map(test => ({
          id: test.id,
          protocols: test.protocols,
          status: test.status,
          startTime: test.startTime,
          endTime: test.endTime,
          duration: test.endTime ? test.endTime - test.startTime : null,
          summary: test.results?.summary || null
        }));
      
      res.json({
        tests: history,
        total: this.testHistory.length
      });
    });

    // Delete test results
    this.app.delete('/api/test/:testId', async (req, res) => {
      try {
        const { testId } = req.params;
        
        // Remove from active tests
        this.activeTests.delete(testId);
        
        // Remove from history
        this.testHistory = this.testHistory.filter(test => test.id !== testId);
        
        // Delete results file
        const resultsPath = path.join(__dirname, 'test-results', `${testId}-results.json`);
        try {
          await fs.unlink(resultsPath);
        } catch (error) {
          // File might not exist
        }
        
        res.json({
          message: 'Test deleted successfully',
          testId
        });
        
      } catch (error) {
        res.status(500).json({
          error: 'Failed to delete test',
          message: error.message
        });
      }
    });

    // Test specific protocol
    this.app.post('/api/test/protocol/:protocol', async (req, res) => {
      try {
        const { protocol } = req.params;
        const { options } = req.body;
        
        const testId = this.generateTestId();
        const testConfig = {
          id: testId,
          protocols: [protocol],
          options: options || {},
          startTime: Date.now(),
          status: 'running'
        };
        
        this.activeTests.set(testId, testConfig);
        this.runTestsAsync(testId, testConfig);
        
        res.json({
          testId,
          status: 'started',
          protocol,
          message: `${protocol} test started`
        });
        
      } catch (error) {
        res.status(500).json({
          error: 'Failed to start protocol test',
          message: error.message
        });
      }
    });

    // Live testing dashboard
    this.app.get('/dashboard', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    });

    // API documentation
    this.app.get('/api/docs', (req, res) => {
      res.json({
        title: 'LiteSVM Protocol Testing API',
        version: '1.0.0',
        endpoints: {
          'POST /api/test/protocols': 'Run protocol tests',
          'GET /api/test/:testId/status': 'Get test status',
          'GET /api/test/:testId/results': 'Get test results',
          'GET /api/test/history': 'List test history',
          'DELETE /api/test/:testId': 'Delete test',
          'POST /api/test/protocol/:protocol': 'Test specific protocol',
          'GET /dashboard': 'Live testing dashboard',
          'GET /health': 'Health check'
        },
        websocket: '/ws',
        formats: ['json', 'html', 'csv']
      });
    });

    // Metrics endpoint for monitoring
    this.app.get('/api/metrics', (req, res) => {
      const metrics = {
        activeTests: this.activeTests.size,
        totalTests: this.testHistory.length,
        connectedClients: this.clients.size,
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        testerStatus: this.tester.getStatus()
      };
      
      res.json(metrics);
    });

    // Export test results for external use
    this.app.get('/api/export/latest', async (req, res) => {
      try {
        const { format } = req.query;
        const latestPath = path.join(__dirname, 'test-results', 'latest-results.json');
        const resultsData = await fs.readFile(latestPath, 'utf8');
        const results = JSON.parse(resultsData);
        
        const exportData = this.tester.exportResults(results, format || 'json');
        
        if (format === 'csv') {
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', 'attachment; filename="latest-test-results.csv"');
        } else if (format === 'html') {
          res.setHeader('Content-Type', 'text/html');
        } else {
          res.setHeader('Content-Type', 'application/json');
        }
        
        res.send(exportData);
        
      } catch (error) {
        res.status(404).json({
          error: 'No test results available',
          message: error.message
        });
      }
    });
  }

  /**
   * Setup WebSocket for real-time updates
   */
  setupWebSocket() {
    this.app.get('/ws', (req, res) => {
      res.json({
        message: 'WebSocket endpoint for real-time test updates',
        url: `ws://localhost:${this.port}/ws`
      });
    });
  }

  /**
   * Run tests asynchronously
   */
  async runTestsAsync(testId, testConfig) {
    try {
      console.log(`[INIT] Starting test ${testId} with protocols: ${testConfig.protocols.join(', ')}`);
      
      // Update status
      testConfig.status = 'running';
      this.broadcastUpdate({
        type: 'test_started',
        testId,
        protocols: testConfig.protocols
      });
      
      // Run the actual tests
      const tester = new ProductionLiteSVMTester({
        verbose: true,
        ...testConfig.options
      });
      
      const results = await tester.runProtocolTests(testConfig.protocols);
      
      // Save results
      const resultsPath = path.join(__dirname, 'test-results');
      await fs.mkdir(resultsPath, { recursive: true });
      
      const testResultsPath = path.join(resultsPath, `${testId}-results.json`);
      await fs.writeFile(testResultsPath, JSON.stringify(results, null, 2));
      
      // Update test config
      testConfig.status = 'completed';
      testConfig.endTime = Date.now();
      testConfig.results = results;
      
      // Move to history
      this.testHistory.unshift(testConfig);
      this.activeTests.delete(testId);
      
      console.log(`[SUCCESS] Test ${testId} completed successfully`);
      
      this.broadcastUpdate({
        type: 'test_completed',
        testId,
        results: results.summary
      });
      
    } catch (error) {
      console.error(`❌ Test ${testId} failed:`, error);
      
      testConfig.status = 'failed';
      testConfig.endTime = Date.now();
      testConfig.error = error.message;
      
      this.testHistory.unshift(testConfig);
      this.activeTests.delete(testId);
      
      this.broadcastUpdate({
        type: 'test_failed',
        testId,
        error: error.message
      });
    }
  }

  /**
   * Generate unique test ID
   */
  generateTestId() {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `test_${timestamp}_${random}`;
  }

  /**
   * Broadcast update to WebSocket clients
   */
  broadcastUpdate(data) {
    const message = JSON.stringify({
      timestamp: new Date().toISOString(),
      ...data
    });
    
    if (this.wss) {
      this.wss.clients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    }
  }

  /**
   * Start the server
   */
  async start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          console.log(`[INIT] Testing API Server running on port ${this.port}`);
          console.log(`[INFO] Metrics Dashboard: http://localhost:${this.port}/dashboard`);
          console.log(`[DOCS] API Docs: http://localhost:${this.port}/api/docs`);
          
          // Setup WebSocket server
          this.wss = new WebSocket.Server({ server: this.server, path: '/ws' });
          
          this.wss.on('connection', (ws) => {
            console.log('Client connected to WebSocket');
            this.clients.add(ws);
            
            // Send welcome message
            ws.send(JSON.stringify({
              type: 'connection',
              message: 'Connected to LiteSVM Testing API',
              timestamp: new Date().toISOString()
            }));
            
            ws.on('close', () => {
              console.log('Client disconnected from WebSocket');
              this.clients.delete(ws);
            });
            
            ws.on('error', (error) => {
              console.error('WebSocket error:', error);
              this.clients.delete(ws);
            });
          });
          
          resolve(this.server);
        });
        
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Stop the server
   */
  async stop() {
    return new Promise((resolve) => {
      if (this.wss) {
        this.wss.close();
      }
      
      if (this.server) {
        this.server.close(() => {
          console.log('Testing API Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = TestingAPIServer;

// Start server if called directly
if (require.main === module) {
  const server = new TestingAPIServer({
    port: process.env.PORT || 3333,
    verbose: true
  });
  
  server.start()
    .then(() => {
      console.log('[SUCCESS] Testing API Server started successfully');
    })
    .catch(error => {
      console.error('❌ Failed to start Testing API Server:', error);
      process.exit(1);
    });
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down Testing API Server...');
    await server.stop();
    process.exit(0);
  });
}