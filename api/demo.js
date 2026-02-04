/**
 * PRODUCTION DEMONSTRATION
 * 
 * Complete demonstration of the LiteSVM-powered Solana Protocol Testing Infrastructure
 * Built for CloddsBot (103 skills), Makora (3 programs), SOLPRISM
 */

const ProductionTester = require('./production-tester');
const ProductionTestingAPI = require('./production-testing-api');
const axios = require('axios');

class ProductionDemo {
  constructor() {
    this.apiServer = null;
    this.baseUrl = 'http://localhost:3333';
  }

  async run() {
    console.log('🎯 PRODUCTION SOLANA PROTOCOL TESTING INFRASTRUCTURE DEMO');
    console.log('='.repeat(70));
    console.log('Built for: CloddsBot (103 skills), Makora (3 programs), SOLPRISM');
    console.log('='.repeat(70));
    console.log('');

    try {
      // Demo 1: Direct Protocol Testing
      await this.demonstrateDirectTesting();
      
      // Demo 2: API Server
      await this.demonstrateAPIServer();
      
      // Demo 3: External Usage Patterns
      await this.demonstrateExternalUsage();
      
      // Demo 4: Production Features
      await this.demonstrateProductionFeatures();
      
      console.log('\n🎉 DEMO COMPLETE - PRODUCTION INFRASTRUCTURE READY!');
      this.printQuickStart();
      
    } catch (error) {
      console.error('❌ Demo failed:', error);
    } finally {
      await this.cleanup();
    }
  }

  /**
   * Demonstrate direct protocol testing
   */
  async demonstrateDirectTesting() {
    console.log('📊 DEMO 1: Direct Protocol Testing');
    console.log('-'.repeat(40));
    
    const tester = new ProductionTester({
      verbose: false,
      coverage: true
    });

    console.log('🧪 Running Jupiter + Raydium tests...');
    const results = await tester.runProtocolTests(['jupiter', 'raydium']);
    
    console.log('✅ Results:');
    console.log(`   - Protocols: ${results.summary.total}`);
    console.log(`   - Passed: ${results.summary.passed}`);
    console.log(`   - Failed: ${results.summary.failed}`);
    console.log(`   - Duration: ${results.summary.duration}ms`);
    console.log(`   - Test Velocity: ${results.summary.testVelocity.toFixed(2)} tests/sec`);
    console.log(`   - Coverage: ${results.coverage.overall.toFixed(1)}%`);
    
    // Save results
    const savedPath = await tester.saveResults(results);
    console.log(`   - Saved to: ${savedPath}`);
    console.log('');
  }

  /**
   * Demonstrate API server functionality
   */
  async demonstrateAPIServer() {
    console.log('🌐 DEMO 2: Production API Server');
    console.log('-'.repeat(40));
    
    // Start server
    console.log('🚀 Starting API server...');
    this.apiServer = new ProductionTestingAPI({ port: 3333 });
    await this.apiServer.start();
    
    // Wait for server to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test health endpoint
    console.log('💚 Testing health endpoint...');
    const health = await this.makeRequest('GET', '/health');
    console.log(`   - Status: ${health.status}`);
    console.log(`   - Version: ${health.service}`);
    console.log(`   - Uptime: ${health.uptime}`);
    
    // Test protocol endpoint
    console.log('🧪 Testing Jupiter via API...');
    const testResponse = await this.makeRequest('POST', '/api/test/protocol/jupiter', {
      async: false
    });
    console.log(`   - Test ID: ${testResponse.testId}`);
    console.log(`   - Status: ${testResponse.status}`);
    console.log(`   - Results: ${testResponse.results.summary.passed}/${testResponse.results.summary.total} passed`);
    
    // Test export
    console.log('📤 Testing result export...');
    const exported = await this.makeRequest('GET', '/api/export/latest');
    console.log(`   - Export successful: ${exported.success}`);
    console.log(`   - Test ID: ${exported.testId}`);
    console.log('');
  }

  /**
   * Demonstrate external usage patterns
   */
  async demonstrateExternalUsage() {
    console.log('🔌 DEMO 3: External Usage Patterns');
    console.log('-'.repeat(40));
    
    console.log('🎯 CloddsBot Usage Pattern:');
    console.log('   const tester = new ProductionTester();');
    console.log('   const results = await tester.runProtocolTests(["jupiter", "raydium"]);');
    console.log('   // 103 skills can now test protocols!');
    
    const cloddsResults = await this.makeRequest('POST', '/api/test/protocols', {
      protocols: ['jupiter', 'raydium'],
      options: { verbose: false },
      async: false
    });
    console.log(`   ✅ CloddsBot test: ${cloddsResults.results.summary.passed}/${cloddsResults.results.summary.total} passed`);
    
    console.log('\n🏗️ Makora Usage Pattern:');
    console.log('   curl -X POST http://localhost:3333/api/test/protocol/kamino');
    console.log('   // 3 programs can test individually!');
    
    const makoraResults = await this.makeRequest('POST', '/api/test/protocol/kamino', {
      async: false
    });
    console.log(`   ✅ Makora test: ${makoraResults.results.summary.passed}/${makoraResults.results.summary.total} passed`);
    
    console.log('\n🔍 SOLPRISM Usage Pattern:');
    console.log('   GET /api/metrics - Live monitoring');
    console.log('   GET /api/test/history - Historical data');
    
    const metrics = await this.makeRequest('GET', '/api/metrics');
    console.log(`   ✅ SOLPRISM monitoring: ${metrics.tests.total} total tests, ${metrics.tests.successRate} success rate`);
    console.log('');
  }

  /**
   * Demonstrate production features
   */
  async demonstrateProductionFeatures() {
    console.log('⚡ DEMO 4: Production Features');
    console.log('-'.repeat(40));
    
    // Test concurrency
    console.log('🚀 Testing concurrent execution...');
    const concurrentPromises = [
      this.makeRequest('POST', '/api/test/protocol/jupiter'),
      this.makeRequest('POST', '/api/test/protocol/raydium'),
      this.makeRequest('POST', '/api/test/protocol/kamino')
    ];
    
    const concurrentResults = await Promise.all(concurrentPromises);
    console.log(`   ✅ Started ${concurrentResults.length} concurrent tests`);
    
    // Wait for completion
    console.log('⏳ Waiting for completion...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check results
    const history = await this.makeRequest('GET', '/api/test/history?limit=5');
    console.log(`   ✅ History shows ${history.tests.length} recent tests`);
    
    // Test export formats
    console.log('📊 Testing export formats...');
    try {
      await this.makeRequest('GET', '/api/export/latest?format=csv');
      console.log('   ✅ CSV export working');
    } catch (e) {
      console.log('   ⚠️ CSV export pending (no completed tests)');
    }
    
    // Test documentation
    console.log('📖 Testing API documentation...');
    const docs = await this.makeRequest('GET', '/api/docs');
    console.log(`   ✅ Documentation available: ${Object.keys(docs.endpoints).length} endpoint categories`);
    console.log('');
  }

  /**
   * Make HTTP request
   */
  async makeRequest(method, endpoint, data = null) {
    const config = {
      method,
      url: `${this.baseUrl}${endpoint}`,
      timeout: 10000
    };
    
    if (data) {
      config.data = data;
      config.headers = { 'Content-Type': 'application/json' };
    }
    
    const response = await axios(config);
    return response.data;
  }

  /**
   * Print quick start guide
   */
  printQuickStart() {
    console.log('🚀 QUICK START GUIDE');
    console.log('='.repeat(50));
    console.log('');
    console.log('🎯 FOR IMMEDIATE USE:');
    console.log('');
    console.log('1️⃣ START API SERVER:');
    console.log('   npm run testing-server');
    console.log('   # Server: http://localhost:3333');
    console.log('   # Dashboard: http://localhost:3333/dashboard');
    console.log('');
    console.log('2️⃣ RUN DIRECT TESTS:');
    console.log('   npm run test:protocols');
    console.log('   # Tests all protocols directly');
    console.log('');
    console.log('3️⃣ API USAGE:');
    console.log('   # Test all protocols');
    console.log('   curl -X POST http://localhost:3333/api/test/protocols');
    console.log('');
    console.log('   # Test specific protocol');
    console.log('   curl -X POST http://localhost:3333/api/test/protocol/jupiter');
    console.log('');
    console.log('   # Get results');
    console.log('   curl http://localhost:3333/api/test/{testId}/results');
    console.log('');
    console.log('4️⃣ EXPORT RESULTS:');
    console.log('   # JSON: GET /api/export/latest');
    console.log('   # CSV:  GET /api/export/latest?format=csv');
    console.log('   # HTML: GET /api/export/latest?format=html');
    console.log('');
    console.log('🎉 PRODUCTION FEATURES:');
    console.log('   ✅ Real protocol testing simulation');
    console.log('   ✅ Live transaction simulation');
    console.log('   ✅ Performance benchmarking');
    console.log('   ✅ Coverage reporting');
    console.log('   ✅ Multiple export formats');
    console.log('   ✅ Real-time API');
    console.log('   ✅ Live dashboard');
    console.log('   ✅ Concurrent testing');
    console.log('   ✅ Production-grade error handling');
    console.log('');
    console.log('📊 DASHBOARD: http://localhost:3333/dashboard');
    console.log('📖 API DOCS: http://localhost:3333/api/docs');
    console.log('💚 HEALTH: http://localhost:3333/health');
    console.log('');
    console.log('🎯 READY FOR PRODUCTION USE TODAY!');
    console.log('='.repeat(50));
  }

  /**
   * Cleanup resources
   */
  async cleanup() {
    if (this.apiServer) {
      console.log('🧹 Stopping demo server...');
      await this.apiServer.stop();
    }
  }
}

// Run demo if called directly
if (require.main === module) {
  const demo = new ProductionDemo();
  
  demo.run()
    .then(() => {
      console.log('\n✨ Demo completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Demo failed:', error);
      process.exit(1);
    });
}

module.exports = ProductionDemo;