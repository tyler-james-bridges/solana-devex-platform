/**
 * Simple Protocol Health Monitor Example
 * 
 * This script shows how other hackathon projects can use our health monitoring API
 * Perfect for CloddsBot, SuperRouter, Makora developers
 */

const axios = require('axios');

class SimpleProtocolMonitor {
  constructor(apiUrl = 'http://localhost:3002/api') {
    this.apiUrl = apiUrl;
  }

  /**
   * Check if a protocol is healthy before using it
   */
  async isProtocolHealthy(protocol) {
    try {
      const response = await axios.get(`${this.apiUrl}/protocols/${protocol}/status`);
      return response.data.status === 'healthy' && response.data.uptime > 95;
    } catch (error) {
      console.error(`Error checking ${protocol} health:`, error.message);
      return false; // Assume unhealthy if we can't check
    }
  }

  /**
   * Get the best protocol for a specific operation based on health
   */
  async getBestProtocolFor(operation, protocols) {
    const healthChecks = await Promise.all(
      protocols.map(async (protocol) => {
        try {
          const response = await axios.get(`${this.apiUrl}/protocols/${protocol}`);
          return {
            protocol,
            healthy: response.data.status === 'healthy',
            responseTime: response.data.responseTime.current || 999999,
            uptime: response.data.uptime || 0
          };
        } catch (error) {
          return {
            protocol,
            healthy: false,
            responseTime: 999999,
            uptime: 0
          };
        }
      })
    );

    // Filter healthy protocols and sort by response time
    const healthyProtocols = healthChecks
      .filter(p => p.healthy && p.uptime > 90)
      .sort((a, b) => a.responseTime - b.responseTime);

    return healthyProtocols.length > 0 ? healthyProtocols[0].protocol : null;
  }

  /**
   * Monitor protocols continuously and alert on issues
   */
  async startContinuousMonitoring(callback) {
    const checkHealth = async () => {
      try {
        const response = await axios.get(`${this.apiUrl}/status`);
        const summary = response.data;

        // Check for any issues
        if (summary.overall_status !== 'healthy') {
          const alertResponse = await axios.get(`${this.apiUrl}/alerts`);
          const alerts = alertResponse.data.alerts;

          callback({
            status: 'alert',
            overallStatus: summary.overall_status,
            alerts: alerts.filter(a => a.type === 'critical'),
            protocolStates: summary.protocols
          });
        } else {
          callback({
            status: 'healthy',
            overallStatus: summary.overall_status,
            protocolStates: summary.protocols
          });
        }
      } catch (error) {
        callback({
          status: 'error',
          message: `Health check failed: ${error.message}`
        });
      }
    };

    // Initial check
    await checkHealth();

    // Set up interval for continuous monitoring
    return setInterval(checkHealth, 30000); // Check every 30 seconds
  }
}

// Example usage for hackathon projects
async function exampleUsage() {
  const monitor = new SimpleProtocolMonitor();

  console.log('[SEARCH] Solana Protocol Health Monitor Example');
  console.log('==========================================');

  // Example 1: Check if Jupiter is healthy before doing a swap
  console.log('\n[INFO] Metrics Example 1: Check protocol health before operations');
  const jupiterHealthy = await monitor.isProtocolHealthy('jupiter');
  console.log(`Jupiter is ${jupiterHealthy ? 'healthy [SUCCESS]' : 'degraded/down [ERROR]'}`);

  if (jupiterHealthy) {
    console.log('[SUCCESS] Safe to proceed with Jupiter swap');
  } else {
    console.log('[WARNING]  Consider using alternative DEX or retrying later');
  }

  // Example 2: Get the best DEX for swapping based on current health
  console.log('\n[INIT] Example 2: Choose best DEX for swapping');
  const bestDex = await monitor.getBestProtocolFor('swap', ['jupiter', 'raydium']);
  console.log(`Best DEX for swapping: ${bestDex || 'None available'}`);

  // Example 3: Monitor for lending protocols
  console.log('\n[MONEY] Example 3: Choose best lending protocol');
  const bestLending = await monitor.getBestProtocolFor('lending', ['kamino']);
  console.log(`Best lending protocol: ${bestLending || 'None available'}`);

  // Example 4: Continuous monitoring
  console.log('\n[SYNC] Example 4: Starting continuous monitoring...');
  
  let monitoringInterval;
  
  const handleHealthUpdate = (data) => {
    if (data.status === 'alert') {
      console.log(`[ALERT] ALERT: System status is ${data.overallStatus}`);
      data.alerts.forEach(alert => {
        console.log(`   - ${alert.protocol}: ${alert.message}`);
      });
    } else if (data.status === 'healthy') {
      console.log(`[SUCCESS] All systems healthy (${new Date().toLocaleTimeString()})`);
    } else if (data.status === 'error') {
      console.log(`[ERROR] Health check error: ${data.message}`);
    }
  };

  try {
    monitoringInterval = await monitor.startContinuousMonitoring(handleHealthUpdate);
    console.log('   Monitoring started. Press Ctrl+C to stop.');
    
    // Clean shutdown on SIGINT
    process.on('SIGINT', () => {
      console.log('\n[STOP] Stopping monitoring...');
      if (monitoringInterval) {
        clearInterval(monitoringInterval);
      }
      console.log('[SUCCESS] Monitoring stopped');
      process.exit(0);
    });

    // Keep the process running
    process.stdin.resume();
    
  } catch (error) {
    console.error('❌ Failed to start monitoring:', error.message);
  }
}

// ============================================================================
// INTEGRATION EXAMPLES FOR SPECIFIC PROJECTS
// ============================================================================

/**
 * Example integration for CloddsBot (Solana trading bot)
 */
class CloddsBot {
  constructor() {
    this.monitor = new SimpleProtocolMonitor();
  }

  async executeSwap(inputToken, outputToken, amount) {
    console.log(`\n[BOT] CloddsBot: Planning swap ${inputToken} -> ${outputToken}`);

    // Check protocol health before swap
    const bestDex = await this.monitor.getBestProtocolFor('swap', ['jupiter', 'raydium']);
    
    if (!bestDex) {
      throw new Error('No healthy DEX available for swapping');
    }

    console.log(`[SUCCESS] Using ${bestDex} for swap (healthiest option)`);
    
    // Your actual swap logic would go here
    // This is just a demonstration
    return {
      dex: bestDex,
      inputToken,
      outputToken,
      amount,
      status: 'simulated'
    };
  }
}

/**
 * Example integration for SuperRouter (Multi-protocol router)
 */
class SuperRouter {
  constructor() {
    this.monitor = new SimpleProtocolMonitor();
  }

  async findBestRoute(operation, protocols) {
    console.log(`\n[ROUTE]️  SuperRouter: Finding best route for ${operation}`);

    const healthyProtocols = [];
    
    for (const protocol of protocols) {
      const isHealthy = await this.monitor.isProtocolHealthy(protocol);
      if (isHealthy) {
        healthyProtocols.push(protocol);
      }
      console.log(`   ${protocol}: ${isHealthy ? 'healthy [SUCCESS]' : 'degraded [ERROR]'}`);
    }

    return {
      availableProtocols: healthyProtocols,
      recommendedRoute: healthyProtocols[0] || null,
      operation
    };
  }
}

/**
 * Example integration for Makora (Portfolio management)
 */
class Makora {
  constructor() {
    this.monitor = new SimpleProtocolMonitor();
  }

  async rebalancePortfolio(positions) {
    console.log('\n[INFO] Metrics Makora: Rebalancing portfolio');

    // Check health of all protocols we might use
    const protocolHealth = {};
    const protocols = ['jupiter', 'kamino', 'drift', 'raydium'];

    for (const protocol of protocols) {
      protocolHealth[protocol] = await this.monitor.isProtocolHealthy(protocol);
    }

    console.log('Protocol health check:');
    Object.entries(protocolHealth).forEach(([protocol, healthy]) => {
      console.log(`   ${protocol}: ${healthy ? 'healthy [SUCCESS]' : 'degraded [ERROR]'}`);
    });

    // Only proceed with rebalancing if critical protocols are healthy
    const criticalProtocols = ['jupiter']; // Add your critical protocols
    const criticalHealthy = criticalProtocols.every(p => protocolHealth[p]);

    if (!criticalHealthy) {
      console.log('[WARNING]  Postponing rebalancing due to critical protocol issues');
      return { status: 'postponed', reason: 'Critical protocols unhealthy' };
    }

    console.log('[SUCCESS] Proceeding with rebalancing');
    return { status: 'executed', protocolHealth };
  }
}

// Run examples if this script is executed directly
if (require.main === module) {
  console.log('[INIT] Starting Solana Protocol Health Monitor Examples\n');
  
  // Run the main examples
  exampleUsage().then(() => {
    // If continuous monitoring is not started, run integration examples
    setTimeout(async () => {
      console.log('\n' + '='.repeat(60));
      console.log('[CONFIG] Integration Examples for Hackathon Projects');
      console.log('='.repeat(60));

      try {
        // CloddsBot example
        const cloddsBot = new CloddsBot();
        await cloddsBot.executeSwap('SOL', 'USDC', 1000000);

        // SuperRouter example
        const superRouter = new SuperRouter();
        await superRouter.findBestRoute('swap', ['jupiter', 'raydium']);

        // Makora example
        const makora = new Makora();
        await makora.rebalancePortfolio([]);

        console.log('\n[SUCCESS] Integration examples completed');
      } catch (error) {
        console.error('❌ Integration examples failed:', error.message);
        console.log('[INFO] Make sure the health monitoring API is running on port 3002');
      }
    }, 5000);
  }).catch(error => {
    console.error('❌ Examples failed:', error.message);
    console.log('[INFO] Make sure the health monitoring API is running on port 3002');
    process.exit(1);
  });
}

module.exports = { SimpleProtocolMonitor, CloddsBot, SuperRouter, Makora };