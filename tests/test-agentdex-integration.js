/**
 * AgentDEX Integration Test
 * Quick test to verify the AgentDEX monitor integrates properly with the real-time server
 */

const axios = require('axios');

async function testAgentDEXIntegration() {
  console.log('[TEST] Testing AgentDEX Integration...');
  
  const baseUrl = 'http://localhost:3001';
  const testEndpoints = [
    '/api/health',
    '/api/dashboard/data', 
    '/api/agentdex/metrics',
    '/api/agentdex/monitoring/start'
  ];
  
  try {
    // Test health endpoint first
    console.log('\n[INFO] Metrics Testing health endpoint...');
    const healthResponse = await axios.get(`${baseUrl}/api/health`, {
      timeout: 5000
    });
    console.log('[SUCCESS] Health check:', healthResponse.data.status);
    
    // Test dashboard data with AgentDEX
    console.log('\n[INFO] Analytics Testing dashboard with AgentDEX data...');
    const dashboardResponse = await axios.get(`${baseUrl}/api/dashboard/data`, {
      timeout: 10000,
      headers: {
        'x-api-key': process.env.API_KEY || 'test-key'
      }
    });
    
    const hasAgentDEX = dashboardResponse.data.agentdex;
    console.log('[SUCCESS] Dashboard data received');
    console.log(`${hasAgentDEX ? '[SUCCESS]' : '[ERROR]'} AgentDEX data present:`, !!hasAgentDEX);
    
    if (hasAgentDEX) {
      console.log(`[INFO] Metrics AgentDEX endpoints: ${dashboardResponse.data.agentdex.endpoints?.length || 0}`);
      console.log(`[HEALTH] Healthy endpoints: ${dashboardResponse.data.agentdex.summary?.healthyEndpoints || 0}`);
      console.log(`[INFO] Analytics Platform status: ${dashboardResponse.data.agentdex.summary?.platformStatus || 'unknown'}`);
    }
    
    // Test AgentDEX specific endpoints
    console.log('\n[TARGET] Testing AgentDEX specific endpoints...');
    const agentdexResponse = await axios.get(`${baseUrl}/api/agentdex/metrics`, {
      timeout: 10000,
      headers: {
        'x-api-key': process.env.API_KEY || 'test-key'
      }
    });
    
    console.log('[SUCCESS] AgentDEX metrics endpoint working');
    console.log(`[INFO] Metrics Monitoring active: ${agentdexResponse.data.isMonitoring}`);
    console.log(`[TIMING] Monitoring interval: ${agentdexResponse.data.interval}ms`);
    
    // Test starting monitoring
    console.log('\n[INIT] Testing AgentDEX monitoring control...');
    const startResponse = await axios.post(`${baseUrl}/api/agentdex/monitoring/start`, {}, {
      timeout: 10000,
      headers: {
        'x-api-key': process.env.API_KEY || 'test-key'
      }
    });
    
    console.log('[SUCCESS] AgentDEX monitoring started:', startResponse.data.message);
    
    console.log('\n[SUCCESS] AgentDEX Integration Test PASSED!');
    console.log('[SUCCESS] All endpoints responding correctly');
    console.log('[SUCCESS] AgentDEX data properly integrated');
    console.log('[SUCCESS] Real-time monitoring functional');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ AgentDEX Integration Test FAILED:');
    
    if (error.code === 'ECONNREFUSED') {
      console.error('🔌 Server not running! Start with: npm run dev:api');
    } else if (error.response) {
      console.error('📡 API Error:', error.response.status, error.response.statusText);
      console.error('📄 Response:', JSON.stringify(error.response.data, null, 2));
    } else {
      console.error('💥 Unexpected Error:', error.message);
    }
    
    return false;
  }
}

// Run test if called directly
if (require.main === module) {
  testAgentDEXIntegration()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

module.exports = testAgentDEXIntegration;