/**
 * PRODUCTION Testing API Server
 * 
 * Real-time testing infrastructure API for Solana agents
 * Built on Production Solana Protocol Tester
 * Ready for immediate use by CloddsBot, Makora, SOLPRISM
 */

const express = require('express');
const cors = require('cors');
const ProductionTester = require('./production-tester');
const path = require('path');
const fs = require('fs').promises;

class ProductionTestingAPI {
  constructor(options = {}) {
    this.port = options.port || 3333;
    this.app = express();
    this.server = null;
    
    this.activeTests = new Map();
    this.testHistory = [];
    this.requestCount = 0;
    this.startTime = Date.now();
    
    this.setupMiddleware();
    this.setupRoutes();
  }

  /**
   * Setup Express middleware
   */
  setupMiddleware() {
    this.app.use(cors({
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE'],
      allowedHeaders: ['Content-Type', 'Authorization']
    }));
    
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.static(path.join(__dirname, 'public')));
    
    // Request tracking
    this.app.use((req, res, next) => {
      this.requestCount++;
      const timestamp = new Date().toISOString();
      console.log(`[${timestamp}] ${req.method} ${req.path} - Request #${this.requestCount}`);
      next();
    });

    // Error handling
    this.app.use((err, req, res, next) => {
      console.error('API Error:', err);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        message: err.message,
        timestamp: new Date().toISOString()
      });
    });
  }

  /**
   * Setup comprehensive API routes
   */
  setupRoutes() {
    // Health and status
    this.app.get('/health', (req, res) => {
      const uptime = Date.now() - this.startTime;
      res.json({
        status: 'healthy',
        service: 'Production Solana Testing API',
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(uptime / 1000)}s`,
        activeTests: this.activeTests.size,
        totalRequests: this.requestCount,
        memory: process.memoryUsage()
      });
    });

    this.app.get('/status', (req, res) => {
      res.json({
        service: 'Production Solana Testing Infrastructure',
        status: 'operational',
        environment: 'production',
        features: {
          protocolTesting: true,
          realTimeResults: true,
          multiFormat: true,
          concurrentTests: true,
          coverageReporting: true,
          performanceMetrics: true
        },
        supportedProtocols: ['jupiter', 'raydium', 'kamino', 'drift', 'marinade'],
        activeTests: this.activeTests.size,
        completedTests: this.testHistory.length
      });
    });

    // Core testing endpoints
    this.app.post('/api/test/protocols', async (req, res) => {
      try {
        const { 
          protocols = ['jupiter', 'raydium', 'kamino', 'drift', 'marinade'],
          options = {},
          async: asyncMode = true 
        } = req.body;
        
        const testId = this.generateTestId();
        const testConfig = {
          id: testId,
          protocols,
          options: {
            verbose: options.verbose || false,
            coverage: options.coverage !== false,
            realNetwork: options.realNetwork || false,
            ...options
          },
          startTime: Date.now(),
          status: 'running',
          requestedBy: req.ip
        };
        
        this.activeTests.set(testId, testConfig);
        
        if (asyncMode) {
          // Start async and return immediately
          this.runTestsAsync(testId, testConfig);
          
          res.json({
            success: true,
            testId,
            status: 'started',
            protocols,
            message: 'Protocol tests started successfully',
            estimatedDuration: `${protocols.length * 500}ms`,
            statusUrl: `/api/test/${testId}/status`,
            resultsUrl: `/api/test/${testId}/results`
          });
        } else {
          // Run synchronously and return results
          const results = await this.runTestsSync(testId, testConfig);
          res.json({
            success: true,
            testId,
            status: 'completed',
            results
          });
        }
        
      } catch (error) {
        console.error('Failed to start tests:', error);
        res.status(500).json({
          success: false,
          error: 'Failed to start tests',
          message: error.message
        });
      }
    });

    // Single protocol test
    this.app.post('/api/test/protocol/:protocol', async (req, res) => {
      try {
        const { protocol } = req.params;
        const { options = {}, async: asyncMode = true } = req.body;
        
        const supportedProtocols = ['jupiter', 'raydium', 'kamino', 'drift', 'marinade'];
        if (!supportedProtocols.includes(protocol)) {
          return res.status(400).json({
            success: false,
            error: 'Unsupported protocol',
            protocol,
            supportedProtocols
          });
        }
        
        const testId = this.generateTestId();
        const testConfig = {
          id: testId,
          protocols: [protocol],
          options: {
            verbose: options.verbose || false,
            coverage: options.coverage !== false,
            realNetwork: options.realNetwork || false,
            ...options
          },
          startTime: Date.now(),
          status: 'running',
          requestedBy: req.ip
        };
        
        this.activeTests.set(testId, testConfig);
        
        if (asyncMode) {
          this.runTestsAsync(testId, testConfig);
          res.json({
            success: true,
            testId,
            protocol,
            status: 'started',
            message: `${protocol} test started successfully`
          });
        } else {
          const results = await this.runTestsSync(testId, testConfig);
          res.json({
            success: true,
            testId,
            protocol,
            status: 'completed',
            results
          });
        }
        
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to start protocol test',
          message: error.message
        });
      }
    });

    // Test status
    this.app.get('/api/test/:testId/status', (req, res) => {
      const { testId } = req.params;
      const test = this.activeTests.get(testId) || 
                   this.testHistory.find(t => t.id === testId);
      
      if (!test) {
        return res.status(404).json({
          success: false,
          error: 'Test not found',
          testId
        });
      }
      
      const response = {
        success: true,
        testId,
        status: test.status,
        protocols: test.protocols,
        startTime: test.startTime,
        endTime: test.endTime || null,
        duration: test.endTime ? test.endTime - test.startTime : Date.now() - test.startTime
      };
      
      if (test.results) {
        response.summary = test.results.summary;
      }
      
      if (test.error) {
        response.error = test.error;
      }
      
      res.json(response);
    });

    // Test results
    this.app.get('/api/test/:testId/results', async (req, res) => {
      try {
        const { testId } = req.params;
        const { format = 'json' } = req.query;
        
        const test = this.testHistory.find(t => t.id === testId);
        
        if (!test || !test.results) {
          return res.status(404).json({
            success: false,
            error: 'Test results not found',
            testId
          });
        }
        
        const tester = new ProductionTester();
        
        switch (format.toLowerCase()) {
          case 'html':
            const html = this.generateHTMLReport(test.results);
            res.setHeader('Content-Type', 'text/html');
            return res.send(html);
            
          case 'csv':
            const csv = this.generateCSVReport(test.results);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename="${testId}-results.csv"`);
            return res.send(csv);
            
          case 'json':
          default:
            res.json({
              success: true,
              testId,
              results: test.results
            });
        }
        
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to retrieve results',
          message: error.message
        });
      }
    });

    // Test history
    this.app.get('/api/test/history', (req, res) => {
      const { limit = 50, status, protocol } = req.query;
      
      let history = this.testHistory;
      
      // Filter by status
      if (status) {
        history = history.filter(test => test.status === status);
      }
      
      // Filter by protocol
      if (protocol) {
        history = history.filter(test => test.protocols.includes(protocol));
      }
      
      // Limit results
      history = history.slice(0, parseInt(limit));
      
      const summaryData = history.map(test => ({
        id: test.id,
        protocols: test.protocols,
        status: test.status,
        startTime: test.startTime,
        endTime: test.endTime,
        duration: test.endTime ? test.endTime - test.startTime : null,
        summary: test.results?.summary || null,
        requestedBy: test.requestedBy
      }));
      
      res.json({
        success: true,
        tests: summaryData,
        total: this.testHistory.length,
        filtered: history.length,
        active: this.activeTests.size
      });
    });

    // Delete test
    this.app.delete('/api/test/:testId', async (req, res) => {
      try {
        const { testId } = req.params;
        
        // Remove from active tests
        this.activeTests.delete(testId);
        
        // Remove from history
        const index = this.testHistory.findIndex(test => test.id === testId);
        if (index >= 0) {
          this.testHistory.splice(index, 1);
        }
        
        res.json({
          success: true,
          message: 'Test deleted successfully',
          testId
        });
        
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Failed to delete test',
          message: error.message
        });
      }
    });

    // Metrics and monitoring
    this.app.get('/api/metrics', (req, res) => {
      const uptime = Date.now() - this.startTime;
      const memoryMB = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
      
      // Calculate success rate
      const completedTests = this.testHistory.filter(t => t.status === 'completed');
      const failedTests = this.testHistory.filter(t => t.status === 'failed');
      const successRate = this.testHistory.length > 0 ? 
        (completedTests.length / this.testHistory.length) * 100 : 0;
      
      // Calculate average duration
      const avgDuration = completedTests.length > 0 ?
        completedTests.reduce((sum, test) => sum + (test.endTime - test.startTime), 0) / completedTests.length : 0;
      
      res.json({
        service: 'Production Testing API',
        uptime: Math.floor(uptime / 1000),
        requestCount: this.requestCount,
        memoryUsage: `${memoryMB}MB`,
        tests: {
          active: this.activeTests.size,
          total: this.testHistory.length,
          completed: completedTests.length,
          failed: failedTests.length,
          successRate: `${successRate.toFixed(1)}%`,
          averageDuration: `${Math.round(avgDuration)}ms`
        },
        protocols: {
          supported: ['jupiter', 'raydium', 'kamino', 'drift', 'marinade'],
          totalTested: this.testHistory.reduce((sum, test) => sum + test.protocols.length, 0)
        },
        performance: {
          requestsPerSecond: (this.requestCount / (uptime / 1000)).toFixed(2),
          averageResponseTime: `${avgDuration}ms`
        }
      });
    });

    // Export endpoints
    this.app.get('/api/export/latest', async (req, res) => {
      try {
        const { format = 'json' } = req.query;
        
        const latestTest = this.testHistory[0];
        if (!latestTest || !latestTest.results) {
          return res.status(404).json({
            success: false,
            error: 'No test results available'
          });
        }
        
        switch (format.toLowerCase()) {
          case 'csv':
            const csv = this.generateCSVReport(latestTest.results);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename="latest-test-results.csv"');
            return res.send(csv);
            
          case 'html':
            const html = this.generateHTMLReport(latestTest.results);
            res.setHeader('Content-Type', 'text/html');
            return res.send(html);
            
          case 'json':
          default:
            res.json({
              success: true,
              export: latestTest.results,
              testId: latestTest.id,
              exportedAt: new Date().toISOString()
            });
        }
        
      } catch (error) {
        res.status(500).json({
          success: false,
          error: 'Export failed',
          message: error.message
        });
      }
    });

    // Dashboard
    this.app.get('/dashboard', (req, res) => {
      res.sendFile(path.join(__dirname, 'public', 'dashboard.html'));
    });

    // API documentation
    this.app.get('/api/docs', (req, res) => {
      res.json({
        title: 'Production Solana Protocol Testing API',
        version: '2.0.0',
        description: 'Real-time testing infrastructure for Solana agents and protocols',
        baseUrl: `http://localhost:${this.port}`,
        endpoints: {
          testing: {
            'POST /api/test/protocols': {
              description: 'Run comprehensive protocol tests',
              parameters: {
                protocols: 'Array of protocol names (optional)',
                options: 'Testing options object (optional)',
                async: 'Run asynchronously (default: true)'
              }
            },
            'POST /api/test/protocol/:protocol': {
              description: 'Test specific protocol',
              protocols: ['jupiter', 'raydium', 'kamino', 'drift', 'marinade']
            },
            'GET /api/test/:testId/status': 'Get test status',
            'GET /api/test/:testId/results': 'Get test results (supports ?format=json|csv|html)',
            'DELETE /api/test/:testId': 'Delete test'
          },
          monitoring: {
            'GET /health': 'Service health check',
            'GET /status': 'Service status and capabilities',
            'GET /api/metrics': 'Performance metrics',
            'GET /api/test/history': 'Test history (supports ?limit, ?status, ?protocol)'
          },
          export: {
            'GET /api/export/latest': 'Export latest results (supports ?format=json|csv|html)'
          },
          ui: {
            'GET /dashboard': 'Live testing dashboard',
            'GET /api/docs': 'This API documentation'
          }
        },
        examples: {
          testAllProtocols: 'curl -X POST http://localhost:3333/api/test/protocols',
          testJupiter: 'curl -X POST http://localhost:3333/api/test/protocol/jupiter',
          getResults: 'curl http://localhost:3333/api/test/{testId}/results?format=json',
          exportCSV: 'curl http://localhost:3333/api/export/latest?format=csv'
        }
      });
    });

    // Catch-all for undefined routes
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        path: req.originalUrl,
        method: req.method,
        availableEndpoints: '/api/docs'
      });
    });
  }

  /**
   * Run tests asynchronously
   */
  async runTestsAsync(testId, testConfig) {
    try {
      console.log(`[INIT] Starting async test ${testId}: ${testConfig.protocols.join(', ')}`);
      
      const tester = new ProductionTester(testConfig.options);
      const results = await tester.runProtocolTests(testConfig.protocols);
      
      testConfig.status = 'completed';
      testConfig.endTime = Date.now();
      testConfig.results = results;
      
      // Move to history
      this.testHistory.unshift(testConfig);
      this.activeTests.delete(testId);
      
      console.log(`[SUCCESS] Test ${testId} completed: ${results.summary.passed}/${results.summary.total} passed`);
      
    } catch (error) {
      console.error(`❌ Test ${testId} failed:`, error.message);
      
      testConfig.status = 'failed';
      testConfig.endTime = Date.now();
      testConfig.error = error.message;
      
      this.testHistory.unshift(testConfig);
      this.activeTests.delete(testId);
    }
  }

  /**
   * Run tests synchronously
   */
  async runTestsSync(testId, testConfig) {
    try {
      console.log(`[INIT] Starting sync test ${testId}: ${testConfig.protocols.join(', ')}`);
      
      const tester = new ProductionTester(testConfig.options);
      const results = await tester.runProtocolTests(testConfig.protocols);
      
      testConfig.status = 'completed';
      testConfig.endTime = Date.now();
      testConfig.results = results;
      
      this.testHistory.unshift(testConfig);
      this.activeTests.delete(testId);
      
      console.log(`[SUCCESS] Test ${testId} completed synchronously`);
      return results;
      
    } catch (error) {
      console.error(`❌ Test ${testId} failed:`, error.message);
      
      testConfig.status = 'failed';
      testConfig.endTime = Date.now();
      testConfig.error = error.message;
      
      this.testHistory.unshift(testConfig);
      this.activeTests.delete(testId);
      
      throw error;
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
   * Generate HTML report
   */
  generateHTMLReport(results) {
    const timestamp = new Date(results.timestamp).toLocaleString();
    
    const protocolRows = Object.entries(results.protocols).map(([protocol, result]) => `
      <tr class="${result.success ? 'success' : 'failure'}">
        <td>${protocol.toUpperCase()}</td>
        <td>${result.success ? '✅ PASS' : '❌ FAIL'}</td>
        <td>${result.tests?.length || 0}</td>
        <td>${result.duration}ms</td>
        <td>${result.coverage?.percentage?.toFixed(1) || 0}%</td>
        <td>${result.error || '-'}</td>
      </tr>
    `).join('');

    return `
<!DOCTYPE html>
<html>
<head>
    <title>Solana Protocol Test Results</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
        h1 { color: #2c3e50; text-align: center; margin-bottom: 30px; }
        .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin-bottom: 30px; }
        .metric { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 8px; text-align: center; }
        .metric-value { font-size: 2rem; font-weight: bold; }
        .metric-label { font-size: 0.9rem; opacity: 0.9; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        th { background: #f8f9fa; font-weight: 600; }
        .success { background: rgba(39, 174, 96, 0.1); }
        .failure { background: rgba(231, 76, 60, 0.1); }
        .footer { text-align: center; margin-top: 30px; color: #666; font-size: 0.9rem; }
    </style>
</head>
<body>
    <div class="container">
        <h1>[TEST] Solana Protocol Test Results</h1>
        
        <div class="summary">
            <div class="metric">
                <div class="metric-value">${results.summary.total}</div>
                <div class="metric-label">Total Protocols</div>
            </div>
            <div class="metric">
                <div class="metric-value">${results.summary.passed}</div>
                <div class="metric-label">Passed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${results.summary.failed}</div>
                <div class="metric-label">Failed</div>
            </div>
            <div class="metric">
                <div class="metric-value">${results.summary.duration}ms</div>
                <div class="metric-label">Duration</div>
            </div>
        </div>
        
        <table>
            <thead>
                <tr>
                    <th>Protocol</th>
                    <th>Status</th>
                    <th>Tests</th>
                    <th>Duration</th>
                    <th>Coverage</th>
                    <th>Error</th>
                </tr>
            </thead>
            <tbody>
                ${protocolRows}
            </tbody>
        </table>
        
        <div class="footer">
            <p>Generated by Production Solana Testing API on ${timestamp}</p>
            <p>Environment: ${results.environment} | Test Velocity: ${results.summary.testVelocity?.toFixed(2)} tests/sec</p>
        </div>
    </div>
</body>
</html>`;
  }

  /**
   * Generate CSV report
   */
  generateCSVReport(results) {
    const lines = ['Protocol,Status,Tests,Duration(ms),Coverage(%),Error'];
    
    Object.entries(results.protocols).forEach(([protocol, result]) => {
      lines.push([
        protocol.toUpperCase(),
        result.success ? 'PASS' : 'FAIL',
        result.tests?.length || 0,
        result.duration,
        result.coverage?.percentage?.toFixed(1) || 0,
        result.error || ''
      ].map(field => `"${field}"`).join(','));
    });
    
    return lines.join('\n');
  }

  /**
   * Start the server
   */
  async start() {
    return new Promise((resolve, reject) => {
      try {
        this.server = this.app.listen(this.port, () => {
          console.log('\n[INIT] PRODUCTION TESTING API SERVER STARTED');
          console.log('='.repeat(50));
          console.log(`[WEB] Server: http://localhost:${this.port}`);
          console.log(`[INFO] Metrics Dashboard: http://localhost:${this.port}/dashboard`);
          console.log(`[DOCS] API Docs: http://localhost:${this.port}/api/docs`);
          console.log(`[HEALTH] Health: http://localhost:${this.port}/health`);
          console.log('='.repeat(50));
          console.log('[SUCCESS] READY FOR CLODDSBOT, MAKORA, SOLPRISM!\n');
          
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
      if (this.server) {
        this.server.close(() => {
          console.log('[STOP] Production Testing API Server stopped');
          resolve();
        });
      } else {
        resolve();
      }
    });
  }
}

module.exports = ProductionTestingAPI;

// Start server if called directly
if (require.main === module) {
  const server = new ProductionTestingAPI({
    port: process.env.PORT || 3333
  });
  
  server.start()
    .then(() => {
      console.log('[SUCCESS] Production Testing Infrastructure READY!');
    })
    .catch(error => {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    });
  
  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n[STOP] Shutting down Production Testing API...');
    await server.stop();
    process.exit(0);
  });
}