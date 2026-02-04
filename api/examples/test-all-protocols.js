/**
 * Protocol Health Monitor Test Suite
 * 
 * Tests all protocol endpoints and monitoring functionality
 * Run this to verify the monitoring system is working correctly
 */

const axios = require('axios');

class ProtocolHealthTester {
  constructor(apiUrl = 'http://localhost:3002/api') {
    this.apiUrl = apiUrl;
    this.testResults = [];
  }

  /**
   * Run all tests and generate a comprehensive report
   */
  async runAllTests() {
    console.log('🧪 Solana Protocol Health Monitor Test Suite');
    console.log('='.repeat(50));
    console.log('Testing all endpoints and functionality...\n');

    const testSuite = [
      { name: 'API Health Check', test: () => this.testApiHealth() },
      { name: 'Overall Status Endpoint', test: () => this.testOverallStatus() },
      { name: 'All Protocols Endpoint', test: () => this.testAllProtocols() },
      { name: 'Jupiter Protocol Health', test: () => this.testProtocolHealth('jupiter') },
      { name: 'Kamino Protocol Health', test: () => this.testProtocolHealth('kamino') },
      { name: 'Drift Protocol Health', test: () => this.testProtocolHealth('drift') },
      { name: 'Raydium Protocol Health', test: () => this.testProtocolHealth('raydium') },
      { name: 'Protocol Status Quick Check', test: () => this.testProtocolStatus() },
      { name: 'Alerts Endpoint', test: () => this.testAlertsEndpoint() },
      { name: 'Metrics Endpoint', test: () => this.testMetricsEndpoint() },
      { name: 'Monitoring Control', test: () => this.testMonitoringControl() },
      { name: 'Performance Test', test: () => this.testPerformance() },
      { name: 'Error Handling', test: () => this.testErrorHandling() }
    ];

    for (const testCase of testSuite) {
      await this.runTest(testCase.name, testCase.test);
      await this.sleep(500); // Small delay between tests
    }

    this.generateReport();
  }

  /**
   * Run an individual test with error handling
   */
  async runTest(name, testFunction) {
    const startTime = Date.now();
    let result;

    try {
      await testFunction();
      result = {
        name,
        status: 'PASS',
        duration: Date.now() - startTime,
        details: 'Test completed successfully'
      };
      console.log(`✅ ${name} - PASSED (${result.duration}ms)`);
    } catch (error) {
      result = {
        name,
        status: 'FAIL',
        duration: Date.now() - startTime,
        error: error.message,
        details: error.stack
      };
      console.log(`❌ ${name} - FAILED (${result.duration}ms)`);
      console.log(`   Error: ${error.message}`);
    }

    this.testResults.push(result);
  }

  /**
   * Test API health check endpoint
   */
  async testApiHealth() {
    const response = await axios.get(`${this.apiUrl}/health`);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const data = response.data;
    const required = ['status', 'service', 'version', 'timestamp', 'uptime', 'endpoints'];
    
    for (const field of required) {
      if (!data.hasOwnProperty(field)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (data.status !== 'healthy') {
      throw new Error(`API not healthy: ${data.status}`);
    }
  }

  /**
   * Test overall status endpoint
   */
  async testOverallStatus() {
    const response = await axios.get(`${this.apiUrl}/status`);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const data = response.data;
    const required = ['overall_status', 'protocols', 'summary', 'monitoring'];
    
    for (const field of required) {
      if (!data.hasOwnProperty(field)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Check if overall status is one of expected values
    const validStatuses = ['healthy', 'degraded', 'down'];
    if (!validStatuses.includes(data.overall_status)) {
      throw new Error(`Invalid overall status: ${data.overall_status}`);
    }

    // Check protocols data
    const protocols = ['jupiter', 'kamino', 'drift', 'raydium'];
    for (const protocol of protocols) {
      if (!data.protocols[protocol]) {
        throw new Error(`Missing protocol data: ${protocol}`);
      }
    }
  }

  /**
   * Test all protocols endpoint
   */
  async testAllProtocols() {
    const response = await axios.get(`${this.apiUrl}/protocols`);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const data = response.data;
    const required = ['timestamp', 'monitoring_active', 'protocols', 'summary'];
    
    for (const field of required) {
      if (!data.hasOwnProperty(field)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Check each protocol has required data
    const protocols = ['jupiter', 'kamino', 'drift', 'raydium'];
    for (const protocol of protocols) {
      if (!data.protocols[protocol]) {
        throw new Error(`Missing protocol: ${protocol}`);
      }

      const protocolData = data.protocols[protocol];
      const protocolRequired = ['name', 'status', 'uptime', 'responseTime'];
      
      for (const field of protocolRequired) {
        if (!protocolData.hasOwnProperty(field)) {
          throw new Error(`Missing ${protocol} field: ${field}`);
        }
      }
    }
  }

  /**
   * Test individual protocol health
   */
  async testProtocolHealth(protocol) {
    const response = await axios.get(`${this.apiUrl}/protocols/${protocol}`);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const data = response.data;
    const required = ['protocol', 'name', 'status', 'uptime', 'responseTime', 'endpoints'];
    
    for (const field of required) {
      if (!data.hasOwnProperty(field)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate status is one of expected values
    const validStatuses = ['healthy', 'degraded', 'down', 'unknown'];
    if (!validStatuses.includes(data.status)) {
      throw new Error(`Invalid status: ${data.status}`);
    }

    // Validate uptime is a reasonable number
    if (typeof data.uptime !== 'number' || data.uptime < 0 || data.uptime > 100) {
      throw new Error(`Invalid uptime: ${data.uptime}`);
    }

    // Check endpoints data exists
    if (!data.endpoints || typeof data.endpoints !== 'object') {
      throw new Error('Missing or invalid endpoints data');
    }
  }

  /**
   * Test protocol status quick check
   */
  async testProtocolStatus() {
    const protocols = ['jupiter', 'kamino', 'drift', 'raydium'];
    
    for (const protocol of protocols) {
      const response = await axios.get(`${this.apiUrl}/protocols/${protocol}/status`);
      
      if (response.status !== 200) {
        throw new Error(`${protocol} status check failed: ${response.status}`);
      }

      const data = response.data;
      const required = ['protocol', 'status', 'uptime', 'last_check'];
      
      for (const field of required) {
        if (!data.hasOwnProperty(field)) {
          throw new Error(`${protocol} missing field: ${field}`);
        }
      }

      if (data.protocol !== protocol) {
        throw new Error(`Protocol mismatch: expected ${protocol}, got ${data.protocol}`);
      }
    }
  }

  /**
   * Test alerts endpoint
   */
  async testAlertsEndpoint() {
    const response = await axios.get(`${this.apiUrl}/alerts`);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const data = response.data;
    const required = ['total_alerts', 'critical', 'warning', 'alerts'];
    
    for (const field of required) {
      if (!data.hasOwnProperty(field)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Validate numbers make sense
    if (data.total_alerts !== data.alerts.length) {
      throw new Error(`Alert count mismatch: ${data.total_alerts} vs ${data.alerts.length}`);
    }

    // Check alert structure if any exist
    if (data.alerts.length > 0) {
      const alert = data.alerts[0];
      const alertRequired = ['protocol', 'type', 'category', 'message'];
      
      for (const field of alertRequired) {
        if (!alert.hasOwnProperty(field)) {
          throw new Error(`Alert missing field: ${field}`);
        }
      }
    }
  }

  /**
   * Test metrics endpoint
   */
  async testMetricsEndpoint() {
    // Test all protocols metrics
    const response = await axios.get(`${this.apiUrl}/metrics`);
    
    if (response.status !== 200) {
      throw new Error(`Expected status 200, got ${response.status}`);
    }

    const data = response.data;
    const required = ['period', 'timestamp', 'overall', 'protocols'];
    
    for (const field of required) {
      if (!data.hasOwnProperty(field)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Test specific protocol metrics
    const response2 = await axios.get(`${this.apiUrl}/metrics?protocol=jupiter`);
    
    if (response2.status !== 200) {
      throw new Error(`Jupiter metrics failed: ${response2.status}`);
    }

    const data2 = response2.data;
    if (data2.protocol !== 'jupiter') {
      throw new Error(`Protocol mismatch in metrics: ${data2.protocol}`);
    }
  }

  /**
   * Test monitoring control endpoints
   */
  async testMonitoringControl() {
    // Test start monitoring
    const startResponse = await axios.post(`${this.apiUrl}/monitoring/start`);
    
    if (startResponse.status !== 200) {
      throw new Error(`Start monitoring failed: ${startResponse.status}`);
    }

    const startData = startResponse.data;
    if (!startData.message || !startData.status) {
      throw new Error('Invalid start monitoring response');
    }

    // Wait a moment
    await this.sleep(1000);

    // Test stop monitoring
    const stopResponse = await axios.post(`${this.apiUrl}/monitoring/stop`);
    
    if (stopResponse.status !== 200) {
      throw new Error(`Stop monitoring failed: ${stopResponse.status}`);
    }

    const stopData = stopResponse.data;
    if (!stopData.message || !stopData.status) {
      throw new Error('Invalid stop monitoring response');
    }

    // Restart monitoring for other tests
    await axios.post(`${this.apiUrl}/monitoring/start`);
  }

  /**
   * Test API performance
   */
  async testPerformance() {
    const endpoints = [
      '/health',
      '/status',
      '/protocols',
      '/alerts',
      '/metrics'
    ];

    const performanceResults = [];

    for (const endpoint of endpoints) {
      const startTime = Date.now();
      await axios.get(`${this.apiUrl}${endpoint}`);
      const duration = Date.now() - startTime;
      
      performanceResults.push({ endpoint, duration });

      // Performance should be reasonable (< 5 seconds)
      if (duration > 5000) {
        throw new Error(`${endpoint} too slow: ${duration}ms`);
      }
    }

    const averageResponseTime = performanceResults.reduce((sum, r) => sum + r.duration, 0) / performanceResults.length;
    
    if (averageResponseTime > 2000) {
      throw new Error(`Average response time too slow: ${averageResponseTime}ms`);
    }

    console.log(`   Average response time: ${averageResponseTime.toFixed(2)}ms`);
  }

  /**
   * Test error handling
   */
  async testErrorHandling() {
    // Test invalid protocol
    try {
      await axios.get(`${this.apiUrl}/protocols/invalid`);
      throw new Error('Should have failed for invalid protocol');
    } catch (error) {
      if (!error.response || error.response.status !== 400) {
        throw new Error(`Expected 400 error, got: ${error.response?.status || error.message}`);
      }
    }

    // Test invalid endpoint
    try {
      await axios.get(`${this.apiUrl}/invalid-endpoint`);
      throw new Error('Should have failed for invalid endpoint');
    } catch (error) {
      if (!error.response || error.response.status !== 404) {
        throw new Error(`Expected 404 error, got: ${error.response?.status || error.message}`);
      }
    }

    // Test invalid metrics parameter
    try {
      await axios.get(`${this.apiUrl}/metrics?protocol=invalid`);
      throw new Error('Should have failed for invalid metrics protocol');
    } catch (error) {
      if (!error.response || error.response.status !== 400) {
        throw new Error(`Expected 400 error, got: ${error.response?.status || error.message}`);
      }
    }
  }

  /**
   * Generate comprehensive test report
   */
  generateReport() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('='.repeat(60));

    const totalTests = this.testResults.length;
    const passedTests = this.testResults.filter(r => r.status === 'PASS').length;
    const failedTests = this.testResults.filter(r => r.status === 'FAIL').length;
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);

    console.log(`Total Tests: ${totalTests}`);
    console.log(`Passed: ${passedTests} ✅`);
    console.log(`Failed: ${failedTests} ${failedTests > 0 ? '❌' : ''}`);
    console.log(`Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    console.log(`Total Duration: ${totalDuration}ms`);
    console.log(`Average Test Duration: ${(totalDuration / totalTests).toFixed(2)}ms`);

    if (failedTests > 0) {
      console.log('\n❌ FAILED TESTS:');
      this.testResults
        .filter(r => r.status === 'FAIL')
        .forEach(test => {
          console.log(`   - ${test.name}: ${test.error}`);
        });
    }

    console.log('\n📋 DETAILED RESULTS:');
    this.testResults.forEach(test => {
      const status = test.status === 'PASS' ? '✅' : '❌';
      console.log(`   ${status} ${test.name} (${test.duration}ms)`);
    });

    if (passedTests === totalTests) {
      console.log('\n🎉 ALL TESTS PASSED! The monitoring system is working correctly.');
      console.log('🚀 Ready for production use by hackathon projects!');
    } else {
      console.log('\n⚠️  Some tests failed. Please check the monitoring system configuration.');
    }

    console.log('\n💡 Next steps:');
    console.log('   - Open dashboard.html in your browser');
    console.log('   - Try the example integrations in simple-monitor.js');
    console.log('   - Use the API endpoints in your hackathon project');
    console.log('   - Monitor protocol health in real-time');
  }

  /**
   * Utility function for delays
   */
  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  const tester = new ProtocolHealthTester();
  
  tester.runAllTests().catch(error => {
    console.error('❌ Test suite failed:', error.message);
    console.log('💡 Make sure the health monitoring API is running on port 3002');
    process.exit(1);
  });
}

module.exports = ProtocolHealthTester;