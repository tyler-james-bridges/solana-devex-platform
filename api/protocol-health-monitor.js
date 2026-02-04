/**
 * Protocol Health Monitor - Production-Grade Monitoring for Solana DeFi Protocols
 * Real API endpoint monitoring that other hackathon projects can actually use
 * 
 * Monitors:
 * - Jupiter V6 quote/swap endpoints
 * - Kamino lending vault health
 * - Drift perpetual markets  
 * - Raydium liquidity pools
 * - Real latency/uptime tracking
 */

const axios = require('axios');
const { Connection, PublicKey } = require('@solana/web3.js');
const EventEmitter = require('events');

class ProtocolHealthMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.rpcEndpoint = options.rpcEndpoint || 'https://api.mainnet-beta.solana.com';
    this.connection = new Connection(this.rpcEndpoint, 'confirmed');
    this.monitoringInterval = options.monitoringInterval || 30000; // 30s default
    
    // Protocol configuration with real endpoints and addresses
    this.protocols = {
      jupiter: {
        name: 'Jupiter V6',
        endpoints: {
          quote: 'https://quote-api.jup.ag/v6/quote',
          swap: 'https://quote-api.jup.ag/v6/swap',
          price: 'https://price.jup.ag/v6/price'
        },
        programId: 'JUP6LkbZbjS1jKKwapdHNy74zcZ3tLUZoi5QNyVTaV4',
        testTokens: {
          inputMint: 'So11111111111111111111111111111111111111112', // SOL
          outputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
          amount: 1000000 // 0.001 SOL
        }
      },
      kamino: {
        name: 'Kamino Finance',
        endpoints: {
          markets: 'https://api.kamino.finance/markets',
          strategies: 'https://api.kamino.finance/strategies',
          positions: 'https://api.kamino.finance/positions'
        },
        programId: '6LtLpnUFNByNXLyCoK9wA2MykKAmQNZKBdY8s47fahHb',
        testVault: '7sP9fug8rqZwLNNKhNlXkCrmSqdAeMu8GKBtBY1rjfjP' // Example vault
      },
      drift: {
        name: 'Drift Protocol',
        endpoints: {
          stats: 'https://dlob.drift.trade/stats',
          markets: 'https://dlob.drift.trade/markets',
          positions: 'https://dlob.drift.trade/positions'
        },
        programId: 'dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH',
        testMarket: 0 // SOL-PERP market index
      },
      raydium: {
        name: 'Raydium',
        endpoints: {
          pools: 'https://api.raydium.io/v2/sdk/liquidity/mainnet.json',
          price: 'https://api.raydium.io/v2/main/price',
          farms: 'https://api.raydium.io/v2/sdk/farm/mainnet.json'
        },
        programId: '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8',
        testPool: 'HDP2AYFmvLz8ZLHA8ggQoEJt8uHfBd3dXGbRJupu5Ja2' // SOL-USDC pool
      }
    };
    
    // Health metrics storage
    this.healthMetrics = new Map();
    this.uptimeTracking = new Map();
    this.alertThresholds = {
      responseTime: {
        warning: 2000,  // 2s
        critical: 5000  // 5s
      },
      uptime: {
        warning: 95,   // 95%
        critical: 90   // 90%
      },
      errorRate: {
        warning: 5,    // 5%
        critical: 10   // 10%
      }
    };
    
    this.isMonitoring = false;
    this.monitoringIntervals = new Map();
    
    // Initialize metrics storage for each protocol
    Object.keys(this.protocols).forEach(protocol => {
      this.healthMetrics.set(protocol, {
        status: 'unknown',
        lastCheck: null,
        responseTime: [],
        errorRate: 0,
        uptime: 100,
        endpoints: {},
        onChainHealth: {},
        alerts: []
      });
      
      this.uptimeTracking.set(protocol, {
        totalChecks: 0,
        successfulChecks: 0,
        startTime: Date.now()
      });
    });
  }

  /**
   * Start comprehensive protocol monitoring
   */
  async startMonitoring() {
    if (this.isMonitoring) {
      console.log('Monitoring already active');
      return;
    }

    this.isMonitoring = true;
    console.log('🔄 Starting comprehensive protocol health monitoring...');

    // Start monitoring each protocol
    for (const [protocolName, protocolConfig] of Object.entries(this.protocols)) {
      this.startProtocolMonitoring(protocolName, protocolConfig);
    }

    // Initial health check
    await this.performAllHealthChecks();

    this.emit('monitoring_started', {
      protocols: Object.keys(this.protocols),
      timestamp: new Date().toISOString()
    });

    console.log('✅ Protocol health monitoring started');
  }

  /**
   * Stop all monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    console.log('⏹️ Stopping protocol health monitoring...');

    // Clear all intervals
    this.monitoringIntervals.forEach((interval, protocol) => {
      clearInterval(interval);
    });
    this.monitoringIntervals.clear();

    this.emit('monitoring_stopped', {
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Start monitoring for a specific protocol
   */
  startProtocolMonitoring(protocolName, protocolConfig) {
    const interval = setInterval(async () => {
      try {
        await this.checkProtocolHealth(protocolName, protocolConfig);
      } catch (error) {
        console.error(`Error monitoring ${protocolName}:`, error.message);
      }
    }, this.monitoringInterval);

    this.monitoringIntervals.set(protocolName, interval);
  }

  /**
   * Perform health checks for all protocols
   */
  async performAllHealthChecks() {
    const promises = Object.entries(this.protocols).map(([name, config]) =>
      this.checkProtocolHealth(name, config)
    );

    await Promise.allSettled(promises);
  }

  /**
   * Comprehensive health check for a specific protocol
   */
  async checkProtocolHealth(protocolName, protocolConfig) {
    const startTime = Date.now();
    const metrics = this.healthMetrics.get(protocolName);
    const uptimeData = this.uptimeTracking.get(protocolName);
    
    uptimeData.totalChecks++;

    try {
      console.log(`🔍 Checking ${protocolConfig.name} health...`);

      // Check API endpoints
      const endpointResults = await this.checkApiEndpoints(protocolName, protocolConfig);
      
      // Check on-chain health
      const onChainResults = await this.checkOnChainHealth(protocolName, protocolConfig);
      
      // Determine overall status
      const overallStatus = this.calculateOverallStatus(endpointResults, onChainResults);
      
      // Update metrics
      const responseTime = Date.now() - startTime;
      this.updateMetrics(protocolName, {
        status: overallStatus.status,
        responseTime,
        endpoints: endpointResults,
        onChainHealth: onChainResults,
        details: overallStatus.details
      });

      if (overallStatus.status !== 'down') {
        uptimeData.successfulChecks++;
      }

      // Check for alerts
      this.checkAlerts(protocolName);

      this.emit('protocol_health_update', {
        protocol: protocolName,
        status: overallStatus.status,
        responseTime,
        endpoints: endpointResults,
        onChain: onChainResults,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error(`❌ Health check failed for ${protocolName}:`, error.message);
      
      this.updateMetrics(protocolName, {
        status: 'down',
        responseTime: Date.now() - startTime,
        error: error.message
      });

      this.emit('protocol_error', {
        protocol: protocolName,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Check API endpoint health for Jupiter V6
   */
  async checkJupiterEndpoints(protocolConfig) {
    const results = {};

    // Test quote endpoint
    try {
      const quoteStart = Date.now();
      const quoteResponse = await axios.get(protocolConfig.endpoints.quote, {
        params: {
          inputMint: protocolConfig.testTokens.inputMint,
          outputMint: protocolConfig.testTokens.outputMint,
          amount: protocolConfig.testTokens.amount,
          slippageBps: 50
        },
        timeout: 10000
      });

      results.quote = {
        status: 'healthy',
        responseTime: Date.now() - quoteStart,
        data: {
          routes: quoteResponse.data?.routePlan?.length || 0,
          inAmount: quoteResponse.data?.inAmount,
          outAmount: quoteResponse.data?.outAmount,
          priceImpact: quoteResponse.data?.priceImpactPct
        }
      };
    } catch (error) {
      results.quote = {
        status: 'down',
        error: error.message,
        responseTime: 10000
      };
    }

    // Test price endpoint
    try {
      const priceStart = Date.now();
      const priceResponse = await axios.get(protocolConfig.endpoints.price, {
        params: {
          ids: 'SOL,USDC'
        },
        timeout: 5000
      });

      results.price = {
        status: 'healthy',
        responseTime: Date.now() - priceStart,
        data: {
          prices: Object.keys(priceResponse.data?.data || {}).length
        }
      };
    } catch (error) {
      results.price = {
        status: 'down',
        error: error.message,
        responseTime: 5000
      };
    }

    return results;
  }

  /**
   * Check API endpoint health for Kamino
   */
  async checkKaminoEndpoints(protocolConfig) {
    const results = {};

    try {
      const marketsStart = Date.now();
      const marketsResponse = await axios.get(protocolConfig.endpoints.markets, {
        timeout: 5000
      });

      results.markets = {
        status: 'healthy',
        responseTime: Date.now() - marketsStart,
        data: {
          marketsCount: marketsResponse.data?.length || 0
        }
      };
    } catch (error) {
      results.markets = {
        status: 'down',
        error: error.message,
        responseTime: 5000
      };
    }

    return results;
  }

  /**
   * Check API endpoint health for Drift
   */
  async checkDriftEndpoints(protocolConfig) {
    const results = {};

    try {
      const statsStart = Date.now();
      const statsResponse = await axios.get(protocolConfig.endpoints.stats, {
        timeout: 5000
      });

      results.stats = {
        status: 'healthy',
        responseTime: Date.now() - statsStart,
        data: {
          volume24h: statsResponse.data?.volume24h,
          openInterest: statsResponse.data?.openInterest
        }
      };
    } catch (error) {
      results.stats = {
        status: 'down',
        error: error.message,
        responseTime: 5000
      };
    }

    return results;
  }

  /**
   * Check API endpoint health for Raydium  
   */
  async checkRaydiumEndpoints(protocolConfig) {
    const results = {};

    try {
      const poolsStart = Date.now();
      const poolsResponse = await axios.get(protocolConfig.endpoints.pools, {
        timeout: 10000 // Larger timeout for pool data
      });

      results.pools = {
        status: 'healthy',
        responseTime: Date.now() - poolsStart,
        data: {
          poolCount: Object.keys(poolsResponse.data?.official || {}).length +
                     Object.keys(poolsResponse.data?.unOfficial || {}).length
        }
      };
    } catch (error) {
      results.pools = {
        status: 'down',
        error: error.message,
        responseTime: 10000
      };
    }

    return results;
  }

  /**
   * Check API endpoints for all protocols
   */
  async checkApiEndpoints(protocolName, protocolConfig) {
    switch (protocolName) {
      case 'jupiter':
        return await this.checkJupiterEndpoints(protocolConfig);
      case 'kamino':
        return await this.checkKaminoEndpoints(protocolConfig);
      case 'drift':
        return await this.checkDriftEndpoints(protocolConfig);
      case 'raydium':
        return await this.checkRaydiumEndpoints(protocolConfig);
      default:
        throw new Error(`Unknown protocol: ${protocolName}`);
    }
  }

  /**
   * Check on-chain health (program accounts, etc.)
   */
  async checkOnChainHealth(protocolName, protocolConfig) {
    const results = {};

    try {
      // Check if program exists and is executable
      const programAccount = await this.connection.getAccountInfo(
        new PublicKey(protocolConfig.programId)
      );

      if (!programAccount) {
        throw new Error(`Program account not found: ${protocolConfig.programId}`);
      }

      results.program = {
        status: programAccount.executable ? 'healthy' : 'degraded',
        executable: programAccount.executable,
        lamports: programAccount.lamports,
        owner: programAccount.owner.toBase58()
      };

      // Protocol-specific on-chain checks
      switch (protocolName) {
        case 'jupiter':
          results.programAccounts = await this.checkJupiterOnChain(protocolConfig);
          break;
        case 'kamino':
          results.vaults = await this.checkKaminoOnChain(protocolConfig);
          break;
        case 'drift':
          results.markets = await this.checkDriftOnChain(protocolConfig);
          break;
        case 'raydium':
          results.pools = await this.checkRaydiumOnChain(protocolConfig);
          break;
      }

    } catch (error) {
      results.program = {
        status: 'down',
        error: error.message
      };
    }

    return results;
  }

  /**
   * Jupiter-specific on-chain checks
   */
  async checkJupiterOnChain(protocolConfig) {
    try {
      // Check for recent program account activity
      const programAccounts = await this.connection.getProgramAccounts(
        new PublicKey(protocolConfig.programId),
        {
          limit: 5,
          dataSlice: { offset: 0, length: 0 }
        }
      );

      return {
        status: 'healthy',
        accountCount: programAccounts.length
      };
    } catch (error) {
      return {
        status: 'down',
        error: error.message
      };
    }
  }

  /**
   * Kamino-specific on-chain checks
   */
  async checkKaminoOnChain(protocolConfig) {
    try {
      if (protocolConfig.testVault) {
        const vaultAccount = await this.connection.getAccountInfo(
          new PublicKey(protocolConfig.testVault)
        );

        return {
          status: vaultAccount ? 'healthy' : 'degraded',
          vaultExists: !!vaultAccount,
          lamports: vaultAccount?.lamports
        };
      }

      return { status: 'healthy', note: 'No specific vault to check' };
    } catch (error) {
      return {
        status: 'down',
        error: error.message
      };
    }
  }

  /**
   * Drift-specific on-chain checks
   */
  async checkDriftOnChain(protocolConfig) {
    try {
      // Check program accounts for market data
      const accounts = await this.connection.getProgramAccounts(
        new PublicKey(protocolConfig.programId),
        {
          limit: 3,
          dataSlice: { offset: 0, length: 0 }
        }
      );

      return {
        status: 'healthy',
        accountCount: accounts.length
      };
    } catch (error) {
      return {
        status: 'down',
        error: error.message
      };
    }
  }

  /**
   * Raydium-specific on-chain checks
   */
  async checkRaydiumOnChain(protocolConfig) {
    try {
      if (protocolConfig.testPool) {
        const poolAccount = await this.connection.getAccountInfo(
          new PublicKey(protocolConfig.testPool)
        );

        return {
          status: poolAccount ? 'healthy' : 'degraded',
          poolExists: !!poolAccount,
          lamports: poolAccount?.lamports
        };
      }

      return { status: 'healthy', note: 'No specific pool to check' };
    } catch (error) {
      return {
        status: 'down',
        error: error.message
      };
    }
  }

  /**
   * Calculate overall protocol status
   */
  calculateOverallStatus(endpointResults, onChainResults) {
    const allChecks = [
      ...Object.values(endpointResults),
      ...Object.values(onChainResults)
    ].filter(result => result && result.status);

    const statusCounts = allChecks.reduce((acc, check) => {
      acc[check.status] = (acc[check.status] || 0) + 1;
      return acc;
    }, {});

    const total = allChecks.length;
    const healthy = statusCounts.healthy || 0;
    const degraded = statusCounts.degraded || 0;
    const down = statusCounts.down || 0;

    let overallStatus;
    let details = {
      total,
      healthy,
      degraded,
      down,
      healthPercentage: (healthy / total) * 100
    };

    if (down > total * 0.5) {
      overallStatus = 'down';
    } else if (down > 0 || degraded > total * 0.3) {
      overallStatus = 'degraded';
    } else {
      overallStatus = 'healthy';
    }

    return { status: overallStatus, details };
  }

  /**
   * Update metrics for a protocol
   */
  updateMetrics(protocolName, data) {
    const metrics = this.healthMetrics.get(protocolName);
    
    metrics.status = data.status;
    metrics.lastCheck = new Date().toISOString();
    
    if (data.responseTime) {
      metrics.responseTime.push({
        timestamp: Date.now(),
        value: data.responseTime
      });
      
      // Keep only last 100 measurements
      if (metrics.responseTime.length > 100) {
        metrics.responseTime = metrics.responseTime.slice(-100);
      }
    }
    
    if (data.endpoints) {
      metrics.endpoints = data.endpoints;
    }
    
    if (data.onChainHealth) {
      metrics.onChainHealth = data.onChainHealth;
    }

    if (data.error) {
      metrics.lastError = {
        message: data.error,
        timestamp: new Date().toISOString()
      };
    }

    // Calculate uptime
    const uptimeData = this.uptimeTracking.get(protocolName);
    if (uptimeData.totalChecks > 0) {
      metrics.uptime = (uptimeData.successfulChecks / uptimeData.totalChecks) * 100;
    }

    this.healthMetrics.set(protocolName, metrics);
  }

  /**
   * Check for alert conditions
   */
  checkAlerts(protocolName) {
    const metrics = this.healthMetrics.get(protocolName);
    const alerts = [];

    // Check response time
    if (metrics.responseTime.length > 0) {
      const latestResponseTime = metrics.responseTime[metrics.responseTime.length - 1].value;
      
      if (latestResponseTime > this.alertThresholds.responseTime.critical) {
        alerts.push({
          type: 'critical',
          category: 'response_time',
          message: `High response time: ${latestResponseTime}ms`,
          threshold: this.alertThresholds.responseTime.critical,
          value: latestResponseTime
        });
      } else if (latestResponseTime > this.alertThresholds.responseTime.warning) {
        alerts.push({
          type: 'warning',
          category: 'response_time',
          message: `Elevated response time: ${latestResponseTime}ms`,
          threshold: this.alertThresholds.responseTime.warning,
          value: latestResponseTime
        });
      }
    }

    // Check uptime
    if (metrics.uptime < this.alertThresholds.uptime.critical) {
      alerts.push({
        type: 'critical',
        category: 'uptime',
        message: `Low uptime: ${metrics.uptime.toFixed(1)}%`,
        threshold: this.alertThresholds.uptime.critical,
        value: metrics.uptime
      });
    } else if (metrics.uptime < this.alertThresholds.uptime.warning) {
      alerts.push({
        type: 'warning',
        category: 'uptime',
        message: `Degraded uptime: ${metrics.uptime.toFixed(1)}%`,
        threshold: this.alertThresholds.uptime.warning,
        value: metrics.uptime
      });
    }

    if (alerts.length > 0) {
      metrics.alerts = alerts;
      this.emit('protocol_alert', {
        protocol: protocolName,
        alerts,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Get health summary for all protocols
   */
  getHealthSummary() {
    const summary = {
      timestamp: new Date().toISOString(),
      isMonitoring: this.isMonitoring,
      protocols: {},
      overall: {
        healthy: 0,
        degraded: 0,
        down: 0,
        total: 0
      }
    };

    for (const [protocolName, metrics] of this.healthMetrics.entries()) {
      const protocolSummary = {
        name: this.protocols[protocolName].name,
        status: metrics.status,
        uptime: metrics.uptime,
        lastCheck: metrics.lastCheck,
        responseTime: metrics.responseTime.length > 0 ? 
          metrics.responseTime[metrics.responseTime.length - 1].value : null,
        endpoints: Object.keys(metrics.endpoints).length,
        alerts: metrics.alerts?.length || 0
      };

      summary.protocols[protocolName] = protocolSummary;
      summary.overall[metrics.status]++;
      summary.overall.total++;
    }

    return summary;
  }

  /**
   * Get detailed metrics for a specific protocol
   */
  getProtocolMetrics(protocolName) {
    const metrics = this.healthMetrics.get(protocolName);
    const uptimeData = this.uptimeTracking.get(protocolName);
    
    if (!metrics) {
      throw new Error(`Protocol not found: ${protocolName}`);
    }

    return {
      protocol: protocolName,
      name: this.protocols[protocolName].name,
      status: metrics.status,
      lastCheck: metrics.lastCheck,
      uptime: metrics.uptime,
      responseTime: {
        current: metrics.responseTime.length > 0 ? 
          metrics.responseTime[metrics.responseTime.length - 1].value : null,
        average: metrics.responseTime.length > 0 ?
          metrics.responseTime.reduce((sum, r) => sum + r.value, 0) / metrics.responseTime.length : null,
        history: metrics.responseTime.slice(-20) // Last 20 measurements
      },
      endpoints: metrics.endpoints,
      onChainHealth: metrics.onChainHealth,
      alerts: metrics.alerts || [],
      lastError: metrics.lastError,
      uptime_tracking: {
        totalChecks: uptimeData.totalChecks,
        successfulChecks: uptimeData.successfulChecks,
        startTime: new Date(uptimeData.startTime).toISOString()
      }
    };
  }

  /**
   * Export all monitoring data for external systems
   */
  exportMonitoringData() {
    const data = {
      timestamp: new Date().toISOString(),
      isMonitoring: this.isMonitoring,
      summary: this.getHealthSummary(),
      detailed_metrics: {}
    };

    for (const protocolName of Object.keys(this.protocols)) {
      try {
        data.detailed_metrics[protocolName] = this.getProtocolMetrics(protocolName);
      } catch (error) {
        data.detailed_metrics[protocolName] = { error: error.message };
      }
    }

    return data;
  }
}

module.exports = ProtocolHealthMonitor;