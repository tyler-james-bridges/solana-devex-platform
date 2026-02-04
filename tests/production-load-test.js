/**
 * PRODUCTION LOAD TEST
 * Comprehensive load testing for the Solana DevEx Platform
 * Simulates realistic agent workloads with WebSocket connections, API calls, and monitoring
 */

const WebSocket = require('ws');
const axios = require('axios');
const cluster = require('cluster');
const numCPUs = require('os').cpus().length;

class ProductionLoadTest {
  constructor(options = {}) {
    this.options = {
      // Test configuration
      baseUrl: options.baseUrl || 'http://localhost:3001',
      wsUrl: options.wsUrl || 'ws://localhost:3001',
      
      // Load test parameters
      agents: options.agents || 50, // Number of simulated agent teams
      duration: options.duration || 300000, // 5 minutes
      rampUpTime: options.rampUpTime || 60000, // 1 minute
      
      // API test patterns
      apiRequestsPerAgent: options.apiRequestsPerAgent || 100,
      requestInterval: options.requestInterval || 5000, // 5 seconds between requests
      burstProbability: options.burstProbability || 0.1, // 10% chance of burst
      burstSize: options.burstSize || 5,
      
      // WebSocket test patterns
      wsConnectionsPerAgent: options.wsConnectionsPerAgent || 3,
      wsMessageRate: options.wsMessageRate || 2000, // Every 2 seconds
      wsReconnectProbability: options.wsReconnectProbability || 0.05, // 5% chance per minute
      
      // Test scenarios
      scenarios: options.scenarios || [
        'continuous_monitoring',
        'burst_testing',
        'protocol_health_checks',
        'real_time_updates',
        'concurrent_deployments'
      ],
      
      // Performance thresholds
      thresholds: {
        avgResponseTime: 2000, // 2 seconds
        maxResponseTime: 10000, // 10 seconds
        errorRate: 5, // 5%
        websocketErrors: 10, // 10%
        memoryUsage: 85, // 85%
        ...options.thresholds
      },
      
      // Monitoring
      enableDetailedMetrics: options.enableDetailedMetrics !== false,
      reportInterval: options.reportInterval || 30000, // 30 seconds
      
      ...options
    };
    
    // Test state
    this.agents = [];
    this.metrics = {
      requests: {
        total: 0,
        successful: 0,
        failed: 0,
        responseTimes: [],
        errors: []
      },
      websockets: {
        connections: 0,
        reconnections: 0,
        messagesSent: 0,
        messagesReceived: 0,
        errors: []
      },
      system: {
        startTime: Date.now(),
        duration: 0,
        peakMemory: 0,
        avgCpu: 0
      }
    };
    
    this.isRunning = false;
    this.startTime = null;
    
    console.log('[TEST] Production load test initialized');
  }
  
  /**
   * Start the load test
   */
  async start() {
    console.log(`[INIT] Starting production load test`);
    console.log(`[INFO] Metrics Configuration: ${this.options.agents} agents, ${this.options.duration/1000}s duration`);
    console.log(`[TARGET] Scenarios: ${this.options.scenarios.join(', ')}`);
    
    this.isRunning = true;
    this.startTime = Date.now();
    
    // Start progress reporting
    this.startProgressReporting();
    
    // Ramp up agents gradually
    await this.rampUpAgents();
    
    // Wait for test duration
    console.log('[TIMING] Test running, waiting for completion...');
    await this.waitForDuration();
    
    // Stop all agents
    await this.stopAllAgents();
    
    // Generate final report
    const report = this.generateReport();
    
    this.isRunning = false;
    
    return report;
  }
  
  /**
   * Gradually ramp up agents
   */
  async rampUpAgents() {
    const interval = this.options.rampUpTime / this.options.agents;
    
    console.log(`[INFO] Analytics Ramping up ${this.options.agents} agents over ${this.options.rampUpTime/1000}s`);
    
    for (let i = 0; i < this.options.agents; i++) {
      if (!this.isRunning) break;
      
      const agent = new SimulatedAgent(i, this.options, this.metrics);
      this.agents.push(agent);
      
      // Start agent with random scenario
      const scenario = this.options.scenarios[Math.floor(Math.random() * this.options.scenarios.length)];
      agent.start(scenario);
      
      // Wait before starting next agent
      if (i < this.options.agents - 1) {
        await this.sleep(interval);
      }
    }
    
    console.log(`[SUCCESS] All ${this.agents.length} agents started`);
  }
  
  /**
   * Wait for test duration
   */
  async waitForDuration() {
    const endTime = this.startTime + this.options.duration;
    
    while (Date.now() < endTime && this.isRunning) {
      await this.sleep(1000);
      
      // Monitor system health
      await this.monitorSystemHealth();
      
      // Check performance thresholds
      this.checkThresholds();
    }
  }
  
  /**
   * Stop all agents
   */
  async stopAllAgents() {
    console.log('[STOP] Stopping all agents...');
    
    const stopPromises = this.agents.map(agent => agent.stop());
    await Promise.allSettled(stopPromises);
    
    console.log('[SUCCESS] All agents stopped');
  }
  
  /**
   * Monitor system health during test
   */
  async monitorSystemHealth() {
    try {
      const response = await axios.get(`${this.options.baseUrl}/api/health`, {
        timeout: 5000
      });
      
      const health = response.data;
      
      // Track memory usage
      if (health.performance?.memory?.used) {
        this.metrics.system.peakMemory = Math.max(
          this.metrics.system.peakMemory,
          health.performance.memory.used
        );
      }
      
      // Check for system issues
      if (health.status !== 'healthy') {
        console.warn(`⚠️ System health degraded: ${health.status}`);
      }
      
    } catch (error) {
      console.error('❌ Failed to check system health:', error.message);
    }
  }
  
  /**
   * Check performance thresholds
   */
  checkThresholds() {
    const { requests, websockets } = this.metrics;
    const { thresholds } = this.options;
    
    // Check average response time
    if (requests.responseTimes.length > 0) {
      const avgResponseTime = requests.responseTimes.reduce((a, b) => a + b, 0) / requests.responseTimes.length;
      
      if (avgResponseTime > thresholds.avgResponseTime) {
        console.warn(`⚠️ Average response time exceeded threshold: ${avgResponseTime}ms > ${thresholds.avgResponseTime}ms`);
      }
    }
    
    // Check error rate
    if (requests.total > 0) {
      const errorRate = (requests.failed / requests.total) * 100;
      
      if (errorRate > thresholds.errorRate) {
        console.warn(`⚠️ Error rate exceeded threshold: ${errorRate}% > ${thresholds.errorRate}%`);
      }
    }
    
    // Check WebSocket error rate
    if (websockets.connections > 0) {
      const wsErrorRate = (websockets.errors.length / websockets.connections) * 100;
      
      if (wsErrorRate > thresholds.websocketErrors) {
        console.warn(`⚠️ WebSocket error rate exceeded threshold: ${wsErrorRate}% > ${thresholds.websocketErrors}%`);
      }
    }
  }
  
  /**
   * Start progress reporting
   */
  startProgressReporting() {
    this.reportInterval = setInterval(() => {
      this.printProgressReport();
    }, this.options.reportInterval);
  }
  
  /**
   * Print progress report
   */
  printProgressReport() {
    const elapsed = Date.now() - this.startTime;
    const progress = (elapsed / this.options.duration) * 100;
    const { requests, websockets } = this.metrics;
    
    const avgResponseTime = requests.responseTimes.length > 0 ?
      Math.round(requests.responseTimes.reduce((a, b) => a + b, 0) / requests.responseTimes.length) : 0;
    
    const errorRate = requests.total > 0 ?
      Math.round((requests.failed / requests.total) * 100) : 0;
    
    const rps = Math.round(requests.total / (elapsed / 1000));
    
    console.log(`[INFO] Metrics Progress: ${Math.round(progress)}% | ` +
      `Requests: ${requests.total} (${rps}/s) | ` +
      `Errors: ${errorRate}% | ` +
      `Avg Response: ${avgResponseTime}ms | ` +
      `WebSockets: ${websockets.connections} | ` +
      `Agents: ${this.agents.filter(a => a.isActive).length}`
    );
  }
  
  /**
   * Generate final test report
   */
  generateReport() {
    const endTime = Date.now();
    const duration = endTime - this.startTime;
    const { requests, websockets } = this.metrics;
    
    // Calculate statistics
    const avgResponseTime = requests.responseTimes.length > 0 ?
      requests.responseTimes.reduce((a, b) => a + b, 0) / requests.responseTimes.length : 0;
    
    const maxResponseTime = requests.responseTimes.length > 0 ?
      Math.max(...requests.responseTimes) : 0;
    
    const minResponseTime = requests.responseTimes.length > 0 ?
      Math.min(...requests.responseTimes) : 0;
    
    const percentile95 = this.calculatePercentile(requests.responseTimes, 95);
    const percentile99 = this.calculatePercentile(requests.responseTimes, 99);
    
    const errorRate = requests.total > 0 ? (requests.failed / requests.total) * 100 : 0;
    const requestsPerSecond = requests.total / (duration / 1000);
    
    const wsErrorRate = websockets.connections > 0 ? 
      (websockets.errors.length / websockets.connections) * 100 : 0;
    
    const report = {
      summary: {
        testDuration: duration,
        totalAgents: this.options.agents,
        scenarios: this.options.scenarios,
        success: this.evaluateTestSuccess(),
        timestamp: new Date().toISOString()
      },
      
      requests: {
        total: requests.total,
        successful: requests.successful,
        failed: requests.failed,
        errorRate: Math.round(errorRate * 100) / 100,
        requestsPerSecond: Math.round(requestsPerSecond * 100) / 100,
        
        responseTime: {
          average: Math.round(avgResponseTime),
          min: minResponseTime,
          max: maxResponseTime,
          percentile95: Math.round(percentile95),
          percentile99: Math.round(percentile99)
        }
      },
      
      websockets: {
        totalConnections: websockets.connections,
        reconnections: websockets.reconnections,
        messagesSent: websockets.messagesSent,
        messagesReceived: websockets.messagesReceived,
        errorRate: Math.round(wsErrorRate * 100) / 100,
        errors: websockets.errors.length
      },
      
      system: {
        peakMemoryUsage: this.metrics.system.peakMemory,
        testDuration: duration,
        startTime: new Date(this.startTime).toISOString(),
        endTime: new Date(endTime).toISOString()
      },
      
      thresholds: {
        met: this.checkAllThresholds(),
        details: this.getThresholdDetails()
      },
      
      errors: {
        request: requests.errors.slice(-50), // Last 50 errors
        websocket: websockets.errors.slice(-50)
      }
    };
    
    this.printFinalReport(report);
    return report;
  }
  
  /**
   * Print final report
   */
  printFinalReport(report) {
    console.log('\n' + '='.repeat(80));
    console.log('[CLIPBOARD] PRODUCTION LOAD TEST REPORT');
    console.log('='.repeat(80));
    
    console.log(`\n[INFO] Metrics SUMMARY:`);
    console.log(`   Test Duration: ${(report.summary.testDuration/1000).toFixed(1)}s`);
    console.log(`   Total Agents: ${report.summary.totalAgents}`);
    console.log(`   Success: ${report.summary.success ? '[SUCCESS] PASS' : '[ERROR] FAIL'}`);
    
    console.log(`\n[WEB] API REQUESTS:`);
    console.log(`   Total Requests: ${report.requests.total.toLocaleString()}`);
    console.log(`   Success Rate: ${(100 - report.requests.errorRate).toFixed(2)}%`);
    console.log(`   Requests/Second: ${report.requests.requestsPerSecond}`);
    console.log(`   Avg Response Time: ${report.requests.responseTime.average}ms`);
    console.log(`   95th Percentile: ${report.requests.responseTime.percentile95}ms`);
    console.log(`   99th Percentile: ${report.requests.responseTime.percentile99}ms`);
    
    console.log(`\n[POWER] WEBSOCKETS:`);
    console.log(`   Total Connections: ${report.websockets.totalConnections}`);
    console.log(`   Messages Sent: ${report.websockets.messagesSent.toLocaleString()}`);
    console.log(`   Messages Received: ${report.websockets.messagesReceived.toLocaleString()}`);
    console.log(`   Error Rate: ${report.websockets.errorRate.toFixed(2)}%`);
    
    console.log(`\n[TARGET] THRESHOLDS:`);
    const thresholdDetails = report.thresholds.details;
    Object.keys(thresholdDetails).forEach(key => {
      const detail = thresholdDetails[key];
      const status = detail.passed ? '✅' : '❌';
      console.log(`   ${key}: ${status} ${detail.actual} (threshold: ${detail.threshold})`);
    });
    
    if (!report.summary.success) {
      console.log(`\n[WARNING] ISSUES FOUND:`);
      if (report.requests.errorRate > this.options.thresholds.errorRate) {
        console.log(`   - High error rate: ${report.requests.errorRate}%`);
      }
      if (report.requests.responseTime.average > this.options.thresholds.avgResponseTime) {
        console.log(`   - Slow response times: ${report.requests.responseTime.average}ms avg`);
      }
      if (report.websockets.errorRate > this.options.thresholds.websocketErrors) {
        console.log(`   - WebSocket issues: ${report.websockets.errorRate}% error rate`);
      }
    }
    
    console.log('\n' + '='.repeat(80));
  }
  
  /**
   * Evaluate overall test success
   */
  evaluateTestSuccess() {
    const thresholds = this.checkAllThresholds();
    return thresholds.avgResponseTime && 
           thresholds.errorRate && 
           thresholds.websocketErrors;
  }
  
  /**
   * Check all thresholds
   */
  checkAllThresholds() {
    const { requests, websockets } = this.metrics;
    const { thresholds } = this.options;
    
    const avgResponseTime = requests.responseTimes.length > 0 ?
      requests.responseTimes.reduce((a, b) => a + b, 0) / requests.responseTimes.length : 0;
    
    const errorRate = requests.total > 0 ? (requests.failed / requests.total) * 100 : 0;
    const wsErrorRate = websockets.connections > 0 ? 
      (websockets.errors.length / websockets.connections) * 100 : 0;
    
    return {
      avgResponseTime: avgResponseTime <= thresholds.avgResponseTime,
      errorRate: errorRate <= thresholds.errorRate,
      websocketErrors: wsErrorRate <= thresholds.websocketErrors
    };
  }
  
  /**
   * Get threshold details
   */
  getThresholdDetails() {
    const { requests, websockets } = this.metrics;
    const { thresholds } = this.options;
    
    const avgResponseTime = requests.responseTimes.length > 0 ?
      Math.round(requests.responseTimes.reduce((a, b) => a + b, 0) / requests.responseTimes.length) : 0;
    
    const errorRate = requests.total > 0 ? 
      Math.round((requests.failed / requests.total) * 100 * 100) / 100 : 0;
    
    const wsErrorRate = websockets.connections > 0 ? 
      Math.round((websockets.errors.length / websockets.connections) * 100 * 100) / 100 : 0;
    
    return {
      'Average Response Time': {
        actual: `${avgResponseTime}ms`,
        threshold: `${thresholds.avgResponseTime}ms`,
        passed: avgResponseTime <= thresholds.avgResponseTime
      },
      'Error Rate': {
        actual: `${errorRate}%`,
        threshold: `${thresholds.errorRate}%`,
        passed: errorRate <= thresholds.errorRate
      },
      'WebSocket Error Rate': {
        actual: `${wsErrorRate}%`,
        threshold: `${thresholds.websocketErrors}%`,
        passed: wsErrorRate <= thresholds.websocketErrors
      }
    };
  }
  
  /**
   * Calculate percentile
   */
  calculatePercentile(values, percentile) {
    if (values.length === 0) return 0;
    
    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[index];
  }
  
  /**
   * Utility method for sleeping
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  /**
   * Stop the test early
   */
  stop() {
    console.log('[STOP] Stopping load test early...');
    this.isRunning = false;
    
    if (this.reportInterval) {
      clearInterval(this.reportInterval);
    }
  }
}

/**
 * Simulated Agent Class
 * Represents a single agent team using the platform
 */
class SimulatedAgent {
  constructor(id, options, metrics) {
    this.id = id;
    this.options = options;
    this.metrics = metrics;
    this.isActive = false;
    this.connections = [];
    this.intervals = [];
  }
  
  /**
   * Start agent with specific scenario
   */
  async start(scenario) {
    this.isActive = true;
    this.scenario = scenario;
    
    try {
      switch (scenario) {
        case 'continuous_monitoring':
          await this.runContinuousMonitoring();
          break;
        case 'burst_testing':
          await this.runBurstTesting();
          break;
        case 'protocol_health_checks':
          await this.runProtocolHealthChecks();
          break;
        case 'real_time_updates':
          await this.runRealTimeUpdates();
          break;
        case 'concurrent_deployments':
          await this.runConcurrentDeployments();
          break;
        default:
          await this.runDefault();
      }
    } catch (error) {
      console.error(`Agent ${this.id} error:`, error.message);
    }
  }
  
  /**
   * Continuous monitoring scenario
   */
  async runContinuousMonitoring() {
    // Setup WebSocket connections for real-time updates
    await this.setupWebSocketConnections();
    
    // Regular API health checks
    const healthCheckInterval = setInterval(async () => {
      if (!this.isActive) return;
      
      await this.makeApiRequest('GET', '/api/health');
      await this.makeApiRequest('GET', '/api/metrics');
    }, this.options.requestInterval);
    
    this.intervals.push(healthCheckInterval);
    
    // Periodic protocol checks
    const protocolCheckInterval = setInterval(async () => {
      if (!this.isActive) return;
      
      await this.makeApiRequest('GET', '/api/protocols/health');
    }, this.options.requestInterval * 2);
    
    this.intervals.push(protocolCheckInterval);
  }
  
  /**
   * Burst testing scenario
   */
  async runBurstTesting() {
    const burstInterval = setInterval(async () => {
      if (!this.isActive) return;
      
      // Random chance of burst
      if (Math.random() < this.options.burstProbability) {
        console.log(`[CRITICAL] Agent ${this.id} starting burst test`);
        
        // Send burst of requests
        const promises = [];
        for (let i = 0; i < this.options.burstSize; i++) {
          promises.push(this.makeApiRequest('POST', '/api/tests/run', {
            protocols: ['jupiter', 'kamino'],
            priority: 'high'
          }));
        }
        
        await Promise.allSettled(promises);
      }
    }, 60000); // Check every minute
    
    this.intervals.push(burstInterval);
    
    // Regular monitoring in between bursts
    await this.runContinuousMonitoring();
  }
  
  /**
   * Protocol health checks scenario
   */
  async runProtocolHealthChecks() {
    const protocols = ['jupiter', 'kamino', 'drift', 'raydium'];
    
    const healthCheckInterval = setInterval(async () => {
      if (!this.isActive) return;
      
      // Check each protocol
      for (const protocol of protocols) {
        await this.makeApiRequest('POST', '/api/tests/run', {
          protocols: [protocol],
          priority: 'normal'
        });
        
        // Small delay between protocol checks
        await this.sleep(1000);
      }
    }, this.options.requestInterval * protocols.length);
    
    this.intervals.push(healthCheckInterval);
  }
  
  /**
   * Real-time updates scenario
   */
  async runRealTimeUpdates() {
    // Multiple WebSocket connections for different data streams
    await this.setupWebSocketConnections(3);
    
    // Subscribe to different channels
    const channels = ['network', 'protocols', 'tests', 'alerts'];
    this.connections.forEach((ws, index) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'subscribe',
          channels: [channels[index % channels.length]]
        }));
      }
    });
    
    // Send periodic status requests
    const statusInterval = setInterval(async () => {
      if (!this.isActive) return;
      
      this.connections.forEach(ws => {
        if (ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({
            type: 'get_status',
            timestamp: Date.now()
          }));
        }
      });
    }, this.options.wsMessageRate);
    
    this.intervals.push(statusInterval);
  }
  
  /**
   * Concurrent deployments scenario
   */
  async runConcurrentDeployments() {
    const deployInterval = setInterval(async () => {
      if (!this.isActive) return;
      
      // Start deployment
      const deploymentResponse = await this.makeApiRequest('POST', '/api/pipelines/deploy', {
        name: `Test Deployment ${this.id}-${Date.now()}`,
        environment: 'devnet'
      });
      
      if (deploymentResponse) {
        // Monitor deployment progress
        const deploymentId = deploymentResponse.deploymentId;
        const monitorInterval = setInterval(async () => {
          const status = await this.makeApiRequest('GET', `/api/pipelines/${deploymentId}`);
          
          if (status && (status.status === 'success' || status.status === 'failed')) {
            clearInterval(monitorInterval);
          }
        }, 5000);
        
        // Clear monitoring after max time
        setTimeout(() => clearInterval(monitorInterval), 300000); // 5 minutes
      }
    }, this.options.requestInterval * 5); // Deploy every 25 seconds (if interval is 5s)
    
    this.intervals.push(deployInterval);
  }
  
  /**
   * Default scenario
   */
  async runDefault() {
    await this.runContinuousMonitoring();
  }
  
  /**
   * Setup WebSocket connections
   */
  async setupWebSocketConnections(count = null) {
    const connectionCount = count || this.options.wsConnectionsPerAgent;
    
    for (let i = 0; i < connectionCount; i++) {
      try {
        const ws = new WebSocket(this.options.wsUrl);
        
        ws.on('open', () => {
          this.metrics.websockets.connections++;
          console.log(`[POWER] Agent ${this.id} WebSocket ${i} connected`);
        });
        
        ws.on('message', (data) => {
          this.metrics.websockets.messagesReceived++;
          
          // Random chance of sending response
          if (Math.random() < 0.1) { // 10% chance
            ws.send(JSON.stringify({
              type: 'ping',
              timestamp: Date.now()
            }));
            this.metrics.websockets.messagesSent++;
          }
        });
        
        ws.on('error', (error) => {
          this.metrics.websockets.errors.push({
            agent: this.id,
            connection: i,
            error: error.message,
            timestamp: Date.now()
          });
        });
        
        ws.on('close', () => {
          // Random reconnection
          if (this.isActive && Math.random() < this.options.wsReconnectProbability) {
            setTimeout(() => {
              if (this.isActive) {
                this.setupWebSocketConnections(1);
                this.metrics.websockets.reconnections++;
              }
            }, Math.random() * 30000); // Reconnect within 30 seconds
          }
        });
        
        this.connections.push(ws);
        
        // Small delay between connections
        await this.sleep(100);
        
      } catch (error) {
        this.metrics.websockets.errors.push({
          agent: this.id,
          connection: i,
          error: error.message,
          timestamp: Date.now()
        });
      }
    }
  }
  
  /**
   * Make API request
   */
  async makeApiRequest(method, path, data = null) {
    const startTime = Date.now();
    
    try {
      this.metrics.requests.total++;
      
      const config = {
        method,
        url: `${this.options.baseUrl}${path}`,
        timeout: 30000,
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': 'test-key-for-load-testing'
        }
      };
      
      if (data && (method === 'POST' || method === 'PUT')) {
        config.data = data;
      }
      
      const response = await axios(config);
      
      const responseTime = Date.now() - startTime;
      this.metrics.requests.responseTimes.push(responseTime);
      this.metrics.requests.successful++;
      
      return response.data;
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      this.metrics.requests.responseTimes.push(responseTime);
      this.metrics.requests.failed++;
      
      this.metrics.requests.errors.push({
        agent: this.id,
        method,
        path,
        error: error.message,
        responseTime,
        timestamp: Date.now()
      });
      
      return null;
    }
  }
  
  /**
   * Stop agent
   */
  async stop() {
    this.isActive = false;
    
    // Clear intervals
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals = [];
    
    // Close WebSocket connections
    this.connections.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
    });
    this.connections = [];
  }
  
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Main execution
if (require.main === module) {
  const loadTest = new ProductionLoadTest({
    baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3001',
    wsUrl: process.env.TEST_WS_URL || 'ws://localhost:3001',
    agents: parseInt(process.env.TEST_AGENTS) || 50,
    duration: parseInt(process.env.TEST_DURATION) || 300000, // 5 minutes
    scenarios: process.env.TEST_SCENARIOS ? 
      process.env.TEST_SCENARIOS.split(',') : 
      ['continuous_monitoring', 'burst_testing', 'real_time_updates']
  });
  
  // Handle graceful shutdown
  process.on('SIGINT', () => {
    console.log('\n[STOP] Received SIGINT, stopping load test...');
    loadTest.stop();
    process.exit(0);
  });
  
  // Start the test
  loadTest.start()
    .then(report => {
      console.log('\n[SUCCESS] Load test completed');
      
      // Save report to file
      const fs = require('fs');
      const reportPath = `load-test-report-${Date.now()}.json`;
      fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
      console.log(`[FILE] Report saved to: ${reportPath}`);
      
      // Exit with appropriate code
      process.exit(report.summary.success ? 0 : 1);
    })
    .catch(error => {
      console.error('❌ Load test failed:', error);
      process.exit(1);
    });
}

module.exports = { ProductionLoadTest, SimulatedAgent };