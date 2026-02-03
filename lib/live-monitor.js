/**
 * Live Monitoring System
 * Real-time monitoring of Solana network and protocol health
 */

const { Connection, PublicKey } = require('@solana/web3.js');
const WebSocket = require('ws');
const EventEmitter = require('events');

class LiveMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.rpcEndpoint = options.rpcEndpoint || 'https://api.devnet.solana.com';
    this.wsEndpoint = options.wsEndpoint || 'wss://api.devnet.solana.com';
    this.connection = new Connection(this.rpcEndpoint, 'confirmed');
    
    this.monitoringInterval = options.monitoringInterval || 30000; // 30 seconds
    this.isMonitoring = false;
    this.metrics = new Map();
    this.subscriptions = new Map();
    
    // Protocol addresses to monitor
    this.protocolAddresses = {
      jupiter: new PublicKey('JUP4Fb2cqiRUcaTHdrPC8h2gNsA2ETXiPDD33WcGuJB'),
      kamino: new PublicKey('6LtLpnUFNByNXLyCoK9wA2MykKAmQNZKBdY8s47fahHb'),
      drift: new PublicKey('dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH'),
      raydium: new PublicKey('675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8')
    };
    
    this.healthThresholds = {
      latency: {
        healthy: 1000,    // < 1s
        degraded: 3000,   // 1-3s
        down: 5000        // > 5s
      },
      blockTime: {
        healthy: 500,     // < 500ms
        degraded: 1000,   // 500ms-1s
        down: 2000        // > 2s
      }
    };
  }

  /**
   * Start real-time monitoring
   */
  async startMonitoring() {
    if (this.isMonitoring) {
      return;
    }

    this.isMonitoring = true;
    console.log('Starting live monitoring...');

    // Start periodic health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks();
    }, this.monitoringInterval);

    // Start WebSocket connections for real-time updates
    await this.startWebSocketMonitoring();

    // Initial health check
    await this.performHealthChecks();

    this.emit('monitoring_started');
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      return;
    }

    this.isMonitoring = false;
    console.log('Stopping live monitoring...');

    // Clear intervals
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
    }

    // Close WebSocket connections
    this.subscriptions.forEach((subscription, key) => {
      if (subscription && typeof subscription.unsubscribe === 'function') {
        subscription.unsubscribe();
      }
    });
    this.subscriptions.clear();

    this.emit('monitoring_stopped');
  }

  /**
   * Perform comprehensive health checks
   */
  async performHealthChecks() {
    const startTime = Date.now();
    const healthData = {
      timestamp: new Date().toISOString(),
      network: {},
      protocols: {}
    };

    try {
      // Network health checks
      healthData.network = await this.checkNetworkHealth();
      
      // Protocol health checks
      for (const [protocol, address] of Object.entries(this.protocolAddresses)) {
        healthData.protocols[protocol] = await this.checkProtocolHealth(protocol, address);
      }

      // Update metrics
      this.updateMetrics(healthData);
      
      // Emit health update
      this.emit('health_update', healthData);
      
      console.log(`Health check completed in ${Date.now() - startTime}ms`);
    } catch (error) {
      console.error('Health check failed:', error);
      this.emit('health_check_error', error);
    }
  }

  /**
   * Check Solana network health
   */
  async checkNetworkHealth() {
    const checks = {};
    const startTime = Date.now();

    try {
      // Basic connectivity
      const [slot, health, blockHeight, blockTime, supply] = await Promise.all([
        this.connection.getSlot('confirmed'),
        this.connection.getHealth(),
        this.connection.getBlockHeight('confirmed'),
        this.connection.getRecentBlockhash('confirmed'),
        this.connection.getSupply('confirmed').catch(() => null)
      ]);

      const latency = Date.now() - startTime;

      // Check latest block time
      const latestBlockTime = blockTime.value.blockhash ? 
        await this.connection.getBlockTime(slot).catch(() => null) : null;
      
      const currentTime = Math.floor(Date.now() / 1000);
      const blockAge = latestBlockTime ? currentTime - latestBlockTime : null;

      // Determine health status
      let status = 'healthy';
      if (latency > this.healthThresholds.latency.down || 
          (blockAge && blockAge > this.healthThresholds.blockTime.down / 1000)) {
        status = 'down';
      } else if (latency > this.healthThresholds.latency.degraded || 
                 (blockAge && blockAge > this.healthThresholds.blockTime.degraded / 1000)) {
        status = 'degraded';
      }

      return {
        status,
        latency,
        slot,
        blockHeight,
        blockAge,
        health: health === 'ok',
        supply: supply ? {
          total: supply.value.total,
          circulating: supply.value.circulating,
          nonCirculating: supply.value.nonCirculating
        } : null,
        endpoint: this.rpcEndpoint,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'down',
        error: error.message,
        latency: Date.now() - startTime,
        endpoint: this.rpcEndpoint,
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Check individual protocol health
   */
  async checkProtocolHealth(protocolName, programId) {
    const startTime = Date.now();

    try {
      // Get program account info
      const accountInfo = await this.connection.getAccountInfo(programId);
      
      if (!accountInfo) {
        return {
          status: 'down',
          error: 'Program not found',
          latency: Date.now() - startTime,
          lastUpdated: new Date().toISOString()
        };
      }

      // Get some program accounts to test responsiveness
      const programAccounts = await this.connection.getProgramAccounts(
        programId,
        { 
          limit: 3,
          dataSlice: { offset: 0, length: 0 }
        }
      ).catch(() => []);

      const latency = Date.now() - startTime;

      // Determine health based on latency
      let status = 'healthy';
      if (latency > this.healthThresholds.latency.down) {
        status = 'down';
      } else if (latency > this.healthThresholds.latency.degraded) {
        status = 'degraded';
      }

      return {
        status,
        latency,
        programId: programId.toBase58(),
        accountsFound: programAccounts.length,
        executable: accountInfo.executable,
        owner: accountInfo.owner.toBase58(),
        lamports: accountInfo.lamports,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      return {
        status: 'down',
        error: error.message,
        latency: Date.now() - startTime,
        programId: programId.toBase58(),
        lastUpdated: new Date().toISOString()
      };
    }
  }

  /**
   * Start WebSocket monitoring for real-time updates
   */
  async startWebSocketMonitoring() {
    try {
      // Monitor slot changes for network activity
      const slotSubscription = await this.connection.onSlotChange((slotInfo) => {
        this.emit('slot_change', {
          slot: slotInfo.slot,
          parent: slotInfo.parent,
          root: slotInfo.root,
          timestamp: new Date().toISOString()
        });
      });

      this.subscriptions.set('slot_changes', slotSubscription);

      // Monitor root changes for finality
      const rootSubscription = await this.connection.onRootChange((root) => {
        this.emit('root_change', {
          root,
          timestamp: new Date().toISOString()
        });
      });

      this.subscriptions.set('root_changes', rootSubscription);

      console.log('WebSocket monitoring started');
    } catch (error) {
      console.error('Failed to start WebSocket monitoring:', error);
    }
  }

  /**
   * Monitor specific account changes
   */
  async monitorAccount(accountPubkey, label) {
    try {
      const subscription = await this.connection.onAccountChange(
        new PublicKey(accountPubkey),
        (accountInfo, context) => {
          this.emit('account_change', {
            label,
            account: accountPubkey,
            lamports: accountInfo.lamports,
            owner: accountInfo.owner.toBase58(),
            executable: accountInfo.executable,
            rentEpoch: accountInfo.rentEpoch,
            slot: context.slot,
            timestamp: new Date().toISOString()
          });
        },
        'confirmed'
      );

      this.subscriptions.set(`account_${accountPubkey}`, subscription);
      console.log(`Monitoring account: ${label} (${accountPubkey})`);
      
      return subscription;
    } catch (error) {
      console.error(`Failed to monitor account ${accountPubkey}:`, error);
      return null;
    }
  }

  /**
   * Monitor program logs for debugging
   */
  async monitorProgramLogs(programId, label) {
    try {
      const subscription = await this.connection.onLogs(
        new PublicKey(programId),
        (logs, context) => {
          this.emit('program_logs', {
            label,
            programId,
            logs: logs.logs,
            signature: logs.signature,
            slot: context.slot,
            timestamp: new Date().toISOString()
          });
        },
        'confirmed'
      );

      this.subscriptions.set(`logs_${programId}`, subscription);
      console.log(`Monitoring logs for: ${label} (${programId})`);
      
      return subscription;
    } catch (error) {
      console.error(`Failed to monitor logs for ${programId}:`, error);
      return null;
    }
  }

  /**
   * Update internal metrics
   */
  updateMetrics(healthData) {
    const timestamp = Date.now();
    
    // Network metrics
    if (healthData.network && healthData.network.latency) {
      this.addMetric('network_latency', healthData.network.latency, timestamp);
      this.addMetric('network_slot', healthData.network.slot, timestamp);
      
      if (healthData.network.blockAge) {
        this.addMetric('block_age', healthData.network.blockAge, timestamp);
      }
    }

    // Protocol metrics
    Object.entries(healthData.protocols).forEach(([protocol, data]) => {
      if (data.latency) {
        this.addMetric(`protocol_latency_${protocol}`, data.latency, timestamp);
      }
    });

    // Cleanup old metrics (keep last 1000 points per metric)
    this.metrics.forEach((values, metric) => {
      if (values.length > 1000) {
        this.metrics.set(metric, values.slice(-1000));
      }
    });
  }

  /**
   * Add metric data point
   */
  addMetric(name, value, timestamp = Date.now()) {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }
    
    this.metrics.get(name).push({
      timestamp,
      value
    });
  }

  /**
   * Get metric history
   */
  getMetricHistory(name, limit = 100) {
    if (!this.metrics.has(name)) {
      return [];
    }
    
    const values = this.metrics.get(name);
    return values.slice(-limit);
  }

  /**
   * Get current health summary
   */
  getHealthSummary() {
    const summary = {
      timestamp: new Date().toISOString(),
      isMonitoring: this.isMonitoring,
      networks: {},
      protocols: {},
      metrics: {}
    };

    // Get latest network health
    const networkLatency = this.getMetricHistory('network_latency', 1);
    if (networkLatency.length > 0) {
      const latest = networkLatency[0];
      summary.networks.solana = {
        status: this.determineStatus(latest.value, 'latency'),
        latency: latest.value,
        lastUpdated: new Date(latest.timestamp).toISOString()
      };
    }

    // Get protocol health
    Object.keys(this.protocolAddresses).forEach(protocol => {
      const protocolLatency = this.getMetricHistory(`protocol_latency_${protocol}`, 1);
      if (protocolLatency.length > 0) {
        const latest = protocolLatency[0];
        summary.protocols[protocol] = {
          status: this.determineStatus(latest.value, 'latency'),
          latency: latest.value,
          lastUpdated: new Date(latest.timestamp).toISOString()
        };
      }
    });

    // Calculate average metrics
    const avgNetworkLatency = this.calculateAverage('network_latency', 10);
    if (avgNetworkLatency !== null) {
      summary.metrics.avgNetworkLatency = avgNetworkLatency;
    }

    return summary;
  }

  /**
   * Determine health status based on thresholds
   */
  determineStatus(value, type) {
    const thresholds = this.healthThresholds[type];
    if (!thresholds) return 'unknown';

    if (value < thresholds.healthy) return 'healthy';
    if (value < thresholds.degraded) return 'degraded';
    return 'down';
  }

  /**
   * Calculate average of recent metric values
   */
  calculateAverage(metricName, count = 10) {
    const history = this.getMetricHistory(metricName, count);
    if (history.length === 0) return null;

    const sum = history.reduce((acc, point) => acc + point.value, 0);
    return Math.round(sum / history.length);
  }

  /**
   * Export monitoring data for external systems
   */
  exportData() {
    return {
      timestamp: new Date().toISOString(),
      isMonitoring: this.isMonitoring,
      metrics: Object.fromEntries(
        Array.from(this.metrics.entries()).map(([name, values]) => [
          name,
          values.slice(-100) // Last 100 points per metric
        ])
      ),
      subscriptions: Array.from(this.subscriptions.keys()),
      healthSummary: this.getHealthSummary()
    };
  }
}

module.exports = LiveMonitor;