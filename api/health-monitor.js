/**
 * HEALTH MONITOR
 * System health monitoring and alerting for production platform
 */

const { EventEmitter } = require('events');

class HealthMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      checkInterval: options.checkInterval || 10000, // 10 seconds
      alertThresholds: {
        memory: 85, // Alert if memory usage > 85%
        cpu: 80,    // Alert if CPU usage > 80%
        latency: 2000, // Alert if average latency > 2s
        errorRate: 5,  // Alert if error rate > 5%
        diskSpace: 90, // Alert if disk usage > 90%
        ...options.alertThresholds
      },
      
      // Alert configuration
      alertChannels: options.alertChannels || ['console'], // console, webhook, email
      webhookUrl: options.webhookUrl,
      emailConfig: options.emailConfig,
      
      // Health check configuration
      dependencies: options.dependencies || [], // External dependencies to check
      customChecks: options.customChecks || [], // Custom health check functions
      
      // Performance monitoring
      enableTrending: options.enableTrending !== false,
      trendWindow: options.trendWindow || 300000, // 5 minutes
      
      ...options
    };
    
    // Health state tracking
    this.healthState = {
      overall: 'healthy',
      components: new Map(),
      alerts: new Map(),
      metrics: {
        memory: [],
        cpu: [],
        latency: [],
        errorRate: [],
        diskSpace: []
      },
      lastCheck: null,
      uptime: Date.now()
    };
    
    // Performance tracking
    this.performanceHistory = new Map();
    this.alertHistory = [];
    
    // Dependencies
    this.dependencies = new Map();
    this.initializeDependencies();
    
    // Start monitoring
    this.startMonitoring();
    
    console.log('🏥 Health monitor initialized');
  }
  
  /**
   * Initialize dependency monitoring
   */
  initializeDependencies() {
    const defaultDependencies = [
      {
        name: 'database',
        type: 'database',
        check: async () => await this.checkDatabase()
      },
      {
        name: 'redis',
        type: 'cache',
        check: async () => await this.checkRedis()
      },
      {
        name: 'solana_mainnet',
        type: 'external',
        check: async () => await this.checkSolanaRPC('mainnet')
      },
      {
        name: 'solana_devnet',
        type: 'external',
        check: async () => await this.checkSolanaRPC('devnet')
      }
    ];
    
    // Add default dependencies
    for (const dep of defaultDependencies) {
      this.dependencies.set(dep.name, dep);
    }
    
    // Add custom dependencies
    for (const dep of this.options.dependencies) {
      this.dependencies.set(dep.name, dep);
    }
  }
  
  /**
   * Start health monitoring
   */
  startMonitoring() {
    console.log('🔍 Starting health monitoring...');
    
    // Periodic health checks
    this.checkInterval = setInterval(async () => {
      await this.performHealthCheck();
    }, this.options.checkInterval);
    
    // Trend analysis (if enabled)
    if (this.options.enableTrending) {
      this.trendInterval = setInterval(() => {
        this.analyzeTrends();
      }, 60000); // Every minute
    }
    
    // Cleanup old data
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldData();
    }, 300000); // Every 5 minutes
    
    this.emit('monitoring_started');
  }
  
  /**
   * Perform comprehensive health check
   */
  async performHealthCheck() {
    const startTime = Date.now();
    const checkResults = new Map();
    
    try {
      // System health checks
      const systemHealth = await this.checkSystemHealth();
      checkResults.set('system', systemHealth);
      
      // Dependency health checks
      for (const [name, dependency] of this.dependencies.entries()) {
        try {
          const depHealth = await this.checkDependency(dependency);
          checkResults.set(name, depHealth);
        } catch (error) {
          checkResults.set(name, {
            status: 'unhealthy',
            error: error.message,
            latency: Date.now() - startTime
          });
        }
      }
      
      // Custom health checks
      for (const customCheck of this.options.customChecks) {
        try {
          const result = await customCheck();
          checkResults.set(customCheck.name || 'custom', result);
        } catch (error) {
          checkResults.set(customCheck.name || 'custom', {
            status: 'unhealthy',
            error: error.message
          });
        }
      }
      
      // Update health state
      this.updateHealthState(checkResults);
      
      // Check for alerts
      this.checkAlerts(checkResults);
      
      // Emit health update
      this.emit('health_check_complete', {
        overall: this.healthState.overall,
        components: Object.fromEntries(checkResults),
        duration: Date.now() - startTime,
        timestamp: Date.now()
      });
      
    } catch (error) {
      console.error('Health check failed:', error);
      this.healthState.overall = 'unhealthy';
      this.emit('health_check_error', error);
    }
    
    this.healthState.lastCheck = Date.now();
  }
  
  /**
   * Check system health (memory, CPU, disk)
   */
  async checkSystemHealth() {
    const startTime = Date.now();
    
    try {
      // Memory usage
      const memUsage = process.memoryUsage();
      const memPercent = (memUsage.heapUsed / memUsage.heapTotal) * 100;
      
      // CPU usage (simplified - would use proper CPU monitoring in production)
      const cpuUsage = this.calculateCPUUsage();
      
      // Disk usage (simplified check)
      const diskUsage = await this.checkDiskUsage();
      
      // Event loop lag
      const eventLoopLag = await this.measureEventLoopLag();
      
      // Update metrics history
      this.updateMetricHistory('memory', memPercent);
      this.updateMetricHistory('cpu', cpuUsage);
      this.updateMetricHistory('diskSpace', diskUsage);
      
      // Determine status
      let status = 'healthy';
      const issues = [];
      
      if (memPercent > this.options.alertThresholds.memory) {
        status = 'unhealthy';
        issues.push(`Memory usage too high: ${memPercent.toFixed(1)}%`);
      }
      
      if (cpuUsage > this.options.alertThresholds.cpu) {
        status = status === 'healthy' ? 'degraded' : 'unhealthy';
        issues.push(`CPU usage too high: ${cpuUsage.toFixed(1)}%`);
      }
      
      if (diskUsage > this.options.alertThresholds.diskSpace) {
        status = 'unhealthy';
        issues.push(`Disk usage too high: ${diskUsage.toFixed(1)}%`);
      }
      
      if (eventLoopLag > 100) { // 100ms lag
        status = status === 'healthy' ? 'degraded' : 'unhealthy';
        issues.push(`Event loop lag: ${eventLoopLag}ms`);
      }
      
      return {
        status,
        issues,
        metrics: {
          memory: {
            used: Math.round(memUsage.heapUsed / 1024 / 1024),
            total: Math.round(memUsage.heapTotal / 1024 / 1024),
            percent: memPercent,
            rss: Math.round(memUsage.rss / 1024 / 1024),
            external: Math.round(memUsage.external / 1024 / 1024)
          },
          cpu: {
            percent: cpuUsage,
            loadAvg: this.getLoadAverage()
          },
          disk: {
            percent: diskUsage
          },
          eventLoop: {
            lag: eventLoopLag
          },
          uptime: process.uptime(),
          pid: process.pid
        },
        latency: Date.now() - startTime,
        timestamp: Date.now()
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        latency: Date.now() - startTime,
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * Check dependency health
   */
  async checkDependency(dependency) {
    const startTime = Date.now();
    
    try {
      let result;
      
      if (dependency.check && typeof dependency.check === 'function') {
        result = await dependency.check();
      } else {
        // Default health check based on type
        switch (dependency.type) {
          case 'database':
            result = await this.checkDatabase();
            break;
          case 'cache':
            result = await this.checkRedis();
            break;
          case 'external':
            result = await this.checkExternalService(dependency.url);
            break;
          default:
            throw new Error(`Unknown dependency type: ${dependency.type}`);
        }
      }
      
      const latency = Date.now() - startTime;
      
      // Ensure result has required fields
      return {
        status: result.status || 'healthy',
        latency,
        timestamp: Date.now(),
        ...result
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        latency: Date.now() - startTime,
        timestamp: Date.now()
      };
    }
  }
  
  /**
   * Database health check
   */
  async checkDatabase() {
    try {
      // This would integrate with your actual database
      // For now, simulating a check
      const latency = Math.random() * 50 + 10; // 10-60ms
      
      return {
        status: 'healthy',
        latency,
        connections: {
          active: Math.floor(Math.random() * 20) + 5,
          idle: Math.floor(Math.random() * 10) + 3
        }
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
  
  /**
   * Redis health check
   */
  async checkRedis() {
    try {
      // This would integrate with your actual Redis instance
      const latency = Math.random() * 30 + 5; // 5-35ms
      
      return {
        status: 'healthy',
        latency,
        memoryUsage: Math.floor(Math.random() * 100) + 50, // MB
        connectedClients: Math.floor(Math.random() * 50) + 10
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message
      };
    }
  }
  
  /**
   * Solana RPC health check
   */
  async checkSolanaRPC(network) {
    try {
      const endpoints = {
        mainnet: 'https://api.mainnet-beta.solana.com',
        devnet: 'https://api.devnet.solana.com'
      };
      
      const endpoint = endpoints[network];
      if (!endpoint) {
        throw new Error(`Unknown network: ${network}`);
      }
      
      const startTime = Date.now();
      
      // Simple health check - get latest slot
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'getSlot'
        }),
        timeout: 10000
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      const latency = Date.now() - startTime;
      
      if (data.error) {
        throw new Error(data.error.message);
      }
      
      return {
        status: latency < 2000 ? 'healthy' : 'degraded',
        latency,
        slot: data.result,
        network,
        endpoint
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        network,
        endpoint: endpoints[network]
      };
    }
  }
  
  /**
   * Check external service health
   */
  async checkExternalService(url) {
    try {
      const startTime = Date.now();
      
      const response = await fetch(url, {
        method: 'HEAD',
        timeout: 5000
      });
      
      const latency = Date.now() - startTime;
      
      return {
        status: response.ok ? 'healthy' : 'unhealthy',
        latency,
        statusCode: response.status,
        url
      };
      
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        url
      };
    }
  }
  
  /**
   * Update overall health state
   */
  updateHealthState(checkResults) {
    // Update component states
    for (const [name, result] of checkResults.entries()) {
      this.healthState.components.set(name, result);
    }
    
    // Determine overall health
    let healthyCount = 0;
    let degradedCount = 0;
    let unhealthyCount = 0;
    
    for (const result of checkResults.values()) {
      switch (result.status) {
        case 'healthy':
          healthyCount++;
          break;
        case 'degraded':
          degradedCount++;
          break;
        case 'unhealthy':
          unhealthyCount++;
          break;
      }
    }
    
    // Set overall status
    if (unhealthyCount > 0) {
      this.healthState.overall = 'unhealthy';
    } else if (degradedCount > 0) {
      this.healthState.overall = 'degraded';
    } else {
      this.healthState.overall = 'healthy';
    }
  }
  
  /**
   * Check for alert conditions
   */
  checkAlerts(checkResults) {
    for (const [component, result] of checkResults.entries()) {
      const alertKey = `${component}_${result.status}`;
      
      // Check if we should trigger an alert
      if (result.status === 'unhealthy' || result.status === 'degraded') {
        if (!this.healthState.alerts.has(alertKey)) {
          this.triggerAlert(component, result);
        } else {
          // Update existing alert
          const existingAlert = this.healthState.alerts.get(alertKey);
          existingAlert.count++;
          existingAlert.lastSeen = Date.now();
        }
      } else {
        // Clear alert if component is now healthy
        if (this.healthState.alerts.has(alertKey)) {
          this.clearAlert(component, alertKey);
        }
      }
    }
  }
  
  /**
   * Trigger health alert
   */
  triggerAlert(component, result) {
    const alert = {
      id: `health_${component}_${Date.now()}`,
      component,
      status: result.status,
      message: this.formatAlertMessage(component, result),
      details: result,
      triggeredAt: Date.now(),
      count: 1,
      lastSeen: Date.now(),
      severity: result.status === 'unhealthy' ? 'critical' : 'warning'
    };
    
    const alertKey = `${component}_${result.status}`;
    this.healthState.alerts.set(alertKey, alert);
    this.alertHistory.push(alert);
    
    // Send alert through configured channels
    this.sendAlert(alert);
    
    this.emit('alert_triggered', alert);
    
    console.warn(`🚨 Health Alert: ${alert.message}`);
  }
  
  /**
   * Clear health alert
   */
  clearAlert(component, alertKey) {
    const alert = this.healthState.alerts.get(alertKey);
    if (alert) {
      alert.resolvedAt = Date.now();
      alert.duration = alert.resolvedAt - alert.triggeredAt;
      
      this.healthState.alerts.delete(alertKey);
      
      console.log(`✅ Health Alert Cleared: ${component} is now healthy`);
      
      this.emit('alert_cleared', {
        component,
        alert,
        resolvedAt: Date.now()
      });
    }
  }
  
  /**
   * Format alert message
   */
  formatAlertMessage(component, result) {
    const messages = {
      system: `System health is ${result.status}: ${result.issues?.join(', ') || result.error}`,
      database: `Database is ${result.status}: ${result.error || 'Connection issues'}`,
      redis: `Redis is ${result.status}: ${result.error || 'Cache unavailable'}`,
      solana_mainnet: `Solana Mainnet is ${result.status}: ${result.error || `High latency: ${result.latency}ms`}`,
      solana_devnet: `Solana Devnet is ${result.status}: ${result.error || `High latency: ${result.latency}ms`}`
    };
    
    return messages[component] || `${component} is ${result.status}: ${result.error || 'Unknown issue'}`;
  }
  
  /**
   * Send alert through configured channels
   */
  async sendAlert(alert) {
    for (const channel of this.options.alertChannels) {
      try {
        switch (channel) {
          case 'console':
            // Already logged in triggerAlert
            break;
            
          case 'webhook':
            if (this.options.webhookUrl) {
              await this.sendWebhookAlert(alert);
            }
            break;
            
          case 'email':
            if (this.options.emailConfig) {
              await this.sendEmailAlert(alert);
            }
            break;
            
          default:
            console.warn(`Unknown alert channel: ${channel}`);
        }
      } catch (error) {
        console.error(`Failed to send alert via ${channel}:`, error);
      }
    }
  }
  
  /**
   * Send webhook alert
   */
  async sendWebhookAlert(alert) {
    const payload = {
      type: 'health_alert',
      alert: {
        id: alert.id,
        component: alert.component,
        status: alert.status,
        message: alert.message,
        severity: alert.severity,
        triggeredAt: new Date(alert.triggeredAt).toISOString(),
        details: alert.details
      },
      system: {
        hostname: require('os').hostname(),
        pid: process.pid,
        uptime: process.uptime()
      }
    };
    
    const response = await fetch(this.options.webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'solana-devex-health-monitor/1.0'
      },
      body: JSON.stringify(payload),
      timeout: 5000
    });
    
    if (!response.ok) {
      throw new Error(`Webhook failed: HTTP ${response.status}`);
    }
  }
  
  /**
   * Get current health status
   */
  getHealthStatus() {
    return {
      overall: this.healthState.overall,
      components: Object.fromEntries(this.healthState.components),
      alerts: Array.from(this.healthState.alerts.values()),
      uptime: Date.now() - this.healthState.uptime,
      lastCheck: this.healthState.lastCheck,
      timestamp: Date.now()
    };
  }
  
  /**
   * Get health metrics
   */
  getHealthMetrics() {
    const metrics = {};
    
    for (const [metricName, values] of Object.entries(this.healthState.metrics)) {
      if (values.length > 0) {
        const recent = values.slice(-10); // Last 10 values
        metrics[metricName] = {
          current: recent[recent.length - 1],
          average: recent.reduce((sum, val) => sum + val, 0) / recent.length,
          min: Math.min(...recent),
          max: Math.max(...recent),
          trend: this.calculateTrend(recent)
        };
      }
    }
    
    return metrics;
  }
  
  /**
   * Utility methods
   */
  calculateCPUUsage() {
    // Simplified CPU usage calculation
    // In production, you'd use a proper CPU monitoring library
    return Math.random() * 50 + 10;
  }
  
  async checkDiskUsage() {
    // Simplified disk usage check
    // In production, you'd check actual disk usage
    return Math.random() * 30 + 40;
  }
  
  getLoadAverage() {
    try {
      return require('os').loadavg();
    } catch (error) {
      return [0, 0, 0];
    }
  }
  
  async measureEventLoopLag() {
    return new Promise((resolve) => {
      const start = Date.now();
      setImmediate(() => {
        resolve(Date.now() - start);
      });
    });
  }
  
  updateMetricHistory(metricName, value) {
    if (!this.healthState.metrics[metricName]) {
      this.healthState.metrics[metricName] = [];
    }
    
    this.healthState.metrics[metricName].push(value);
    
    // Keep only recent values
    if (this.healthState.metrics[metricName].length > 100) {
      this.healthState.metrics[metricName] = this.healthState.metrics[metricName].slice(-100);
    }
  }
  
  calculateTrend(values) {
    if (values.length < 2) return 'stable';
    
    const first = values[0];
    const last = values[values.length - 1];
    const change = ((last - first) / first) * 100;
    
    if (Math.abs(change) < 5) return 'stable';
    return change > 0 ? 'increasing' : 'decreasing';
  }
  
  analyzeTrends() {
    // Analyze trends and predict potential issues
    for (const [metricName, values] of Object.entries(this.healthState.metrics)) {
      if (values.length >= 5) {
        const trend = this.calculateTrend(values.slice(-5));
        const current = values[values.length - 1];
        
        // Predictive alerting
        if (trend === 'increasing' && metricName === 'memory' && current > 70) {
          console.warn(`📈 Trend Alert: Memory usage trending up (${current.toFixed(1)}%)`);
        }
      }
    }
  }
  
  cleanupOldData() {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
    
    // Clean alert history
    this.alertHistory = this.alertHistory.filter(alert => alert.triggeredAt > cutoff);
    
    // Clean performance history
    this.performanceHistory.forEach((values, key) => {
      this.performanceHistory.set(key, values.filter(v => v.timestamp > cutoff));
    });
  }
  
  /**
   * Add custom health check
   */
  addCustomCheck(name, checkFunction) {
    this.options.customChecks.push({
      name,
      check: checkFunction
    });
  }
  
  /**
   * Add dependency
   */
  addDependency(name, dependency) {
    this.dependencies.set(name, dependency);
  }
  
  /**
   * Get statistics
   */
  getStatistics() {
    return {
      checks: {
        total: this.healthState.components.size,
        healthy: Array.from(this.healthState.components.values())
          .filter(c => c.status === 'healthy').length,
        degraded: Array.from(this.healthState.components.values())
          .filter(c => c.status === 'degraded').length,
        unhealthy: Array.from(this.healthState.components.values())
          .filter(c => c.status === 'unhealthy').length
      },
      alerts: {
        active: this.healthState.alerts.size,
        total: this.alertHistory.length
      },
      uptime: Date.now() - this.healthState.uptime,
      lastCheck: this.healthState.lastCheck
    };
  }
  
  /**
   * Graceful shutdown
   */
  close() {
    console.log('🔌 Closing health monitor...');
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
    }
    
    if (this.trendInterval) {
      clearInterval(this.trendInterval);
    }
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    
    this.emit('monitoring_stopped');
    console.log('✅ Health monitor closed');
  }
}

module.exports = HealthMonitor;