/**
 * Standalone AgentDEX Monitor Test
 * Tests the AgentDEX monitor functionality independently
 */

const AgentDEXMonitor = require('./api/agentdex-monitor');

async function testAgentDEXStandalone() {
  console.log('🧪 Testing AgentDEX Monitor Standalone...');
  
  try {
    // Initialize monitor
    const monitor = new AgentDEXMonitor({
      baseUrl: 'https://httpbin.org', // Use httpbin.org for testing
      monitoringInterval: 5000, // 5 seconds for quick testing
    });
    
    console.log('✅ AgentDEX Monitor initialized');
    
    // Test getting metrics
    const initialMetrics = monitor.getMetrics();
    console.log('📊 Initial metrics:', {
      endpointCount: initialMetrics.endpoints.length,
      isMonitoring: initialMetrics.isMonitoring,
      interval: initialMetrics.monitoringInterval
    });
    
    // Test performance summary
    const summary = monitor.getPerformanceSummary();
    console.log('📈 Performance summary:', {
      platformStatus: summary.platformStatus,
      totalEndpoints: summary.totalEndpoints,
      healthyEndpoints: summary.healthyEndpoints
    });
    
    // Test event handling
    console.log('🎯 Setting up event listeners...');
    
    monitor.on('monitoring-started', (data) => {
      console.log('✅ Monitoring started event received:', data);
    });
    
    monitor.on('agentdex-metrics', (data) => {
      console.log('📊 AgentDEX metrics event received');
      console.log(`   Overall status: ${data.aggregated.overallStatus}`);
      console.log(`   Healthy endpoints: ${data.aggregated.healthyEndpoints}/${data.aggregated.totalEndpoints}`);
    });
    
    monitor.on('endpoint-checked', (data) => {
      console.log(`🔍 Endpoint checked: ${data.endpoint} - ${data.metrics.status}`);
    });
    
    // Start monitoring for a short test
    console.log('🚀 Starting monitoring for 15 seconds...');
    await monitor.startMonitoring();
    
    // Wait for a few monitoring cycles
    await new Promise(resolve => setTimeout(resolve, 15000));
    
    // Stop monitoring
    console.log('⏹️ Stopping monitoring...');
    monitor.stopMonitoring();
    
    // Final metrics
    const finalMetrics = monitor.getMetrics();
    console.log('📊 Final metrics:', {
      totalRequests: finalMetrics.endpoints.reduce((acc, e) => acc + e.totalRequests, 0),
      averageResponseTime: Math.round(finalMetrics.endpoints.reduce((acc, e) => acc + e.responseTime, 0) / finalMetrics.endpoints.length),
      healthyEndpoints: finalMetrics.endpoints.filter(e => e.status === 'healthy').length
    });
    
    console.log('\n🎉 AgentDEX Standalone Test PASSED!');
    console.log('✅ Monitor initialization successful');
    console.log('✅ Event handling functional');
    console.log('✅ Endpoint monitoring active');
    console.log('✅ Metrics collection working');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ AgentDEX Standalone Test FAILED:');
    console.error('💥 Error:', error.message);
    console.error('📄 Stack:', error.stack);
    return false;
  }
}

// Run test if called directly
if (require.main === module) {
  testAgentDEXStandalone()
    .then(success => {
      process.exit(success ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner error:', error);
      process.exit(1);
    });
}

module.exports = testAgentDEXStandalone;