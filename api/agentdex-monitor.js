/**
 * AgentDEX Integration Monitor
 * Real-time monitoring of AgentDEX 13 REST endpoints
 * Requested by @JacobsClawd on Colosseum Forum
 */

const axios = require('axios');
const EventEmitter = require('events');

class AgentDEXMonitor extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.baseUrl = options.baseUrl || 'https://api.agentdex.com'; // Placeholder - will get real URL
    this.monitoringInterval = options.monitoringInterval || 30000; // 30 seconds as requested
    this.isMonitoring = false;
    this.metrics = new Map();
    this.responseTimeHistory = new Map();
    
    // Health thresholds for AgentDEX monitoring
    this.healthThresholds = {
      responseTime: {
        healthy: 500,    // < 500ms
        degraded: 1000,  // 500ms-1s  
        down: 3000       // > 3s
      },
      errorRate: {
        healthy: 1,      // < 1%
        degraded: 5,     // 1-5%
        down: 10         // > 10%
      },
      swapSuccessRate: {
        healthy: 95,     // > 95%
        degraded: 90,    // 90-95%
        down: 85         // < 85%
      }
    };

    // AgentDEX 13 REST endpoints as mentioned by @JacobsClawd
    this.endpoints = [
      // Core Trading Endpoints
      { name: 'swap', path: '/swap', method: 'POST', category: 'trading' },
      { name: 'quote', path: '/quote', method: 'GET', category: 'trading' },
      { name: 'routes', path: '/routes', method: 'GET', category: 'trading' },
      { name: 'prices', path: '/prices', method: 'GET', category: 'trading' },
      
      // Jupiter Integration
      { name: 'jupiter-swap', path: '/jupiter/swap', method: 'POST', category: 'jupiter' },
      { name: 'jupiter-quote', path: '/jupiter/quote', method: 'GET', category: 'jupiter' },
      { name: 'jupiter-routes', path: '/jupiter/routes', method: 'GET', category: 'jupiter' },
      
      // Health & Status
      { name: 'health', path: '/health', method: 'GET', category: 'status' },
      { name: 'status', path: '/status', method: 'GET', category: 'status' },
      
      // Analytics & Metrics  
      { name: 'volume', path: '/analytics/volume', method: 'GET', category: 'analytics' },
      { name: 'fees', path: '/analytics/fees', method: 'GET', category: 'analytics' },
      { name: 'slippage', path: '/analytics/slippage', method: 'GET', category: 'analytics' },
      
      // Markets
      { name: 'markets', path: '/markets', method: 'GET', category: 'markets' }
    ];
    
    // Initialize response time tracking for percentile calculations
    this.initializeMetrics();
  }

  /**
   * Initialize metrics tracking for all endpoints
   */
  initializeMetrics() {
    this.endpoints.forEach(endpoint => {
      const key = endpoint.name;
      this.metrics.set(key, {
        name: endpoint.name,
        path: endpoint.path,
        method: endpoint.method,
        category: endpoint.category,
        status: 'unknown',
        responseTime: 0,
        errorRate: 0,
        successRate: 100,
        totalRequests: 0,
        successfulRequests: 0,
        errorRequests: 0,
        lastCheck: null,
        uptime: 100,
        // Performance percentiles
        p50: 0,
        p95: 0,
        p99: 0
      });
      
      this.responseTimeHistory.set(key, []);
    });
  }

  /**
   * Start monitoring AgentDEX endpoints
   */
  async startMonitoring() {
    if (this.isMonitoring) {
      console.log('AgentDEX monitoring already running');
      return;
    }

    this.isMonitoring = true;
    console.log('🚀 Starting AgentDEX endpoint monitoring...');
    console.log(`📊 Monitoring ${this.endpoints.length} endpoints every ${this.monitoringInterval}ms`);
    
    // Start monitoring loop
    this.monitoringLoop();
    
    this.emit('monitoring-started', {
      timestamp: Date.now(),
      endpointCount: this.endpoints.length,
      interval: this.monitoringInterval
    });
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    this.isMonitoring = false;
    if (this.monitoringTimer) {
      clearTimeout(this.monitoringTimer);
    }
    console.log('⏹️ AgentDEX monitoring stopped');
    
    this.emit('monitoring-stopped', {
      timestamp: Date.now()
    });
  }

  /**
   * Main monitoring loop
   */
  async monitoringLoop() {
    if (!this.isMonitoring) return;

    try {
      await this.checkAllEndpoints();
    } catch (error) {
      console.error('❌ Error in AgentDEX monitoring loop:', error);
      this.emit('monitoring-error', {
        timestamp: Date.now(),
        error: error.message
      });
    }

    // Schedule next check
    this.monitoringTimer = setTimeout(() => {
      this.monitoringLoop();
    }, this.monitoringInterval);
  }

  /**
   * Check all AgentDEX endpoints
   */
  async checkAllEndpoints() {
    const startTime = Date.now();
    const promises = this.endpoints.map(endpoint => this.checkEndpoint(endpoint));
    
    await Promise.allSettled(promises);
    
    const duration = Date.now() - startTime;
    console.log(`✅ AgentDEX health check completed in ${duration}ms`);
    
    // Emit aggregated metrics
    this.emitAggregatedMetrics();
  }

  /**
   * Check individual endpoint
   */
  async checkEndpoint(endpoint) {
    const startTime = Date.now();
    const endpointKey = endpoint.name;
    
    try {
      const response = await this.makeRequest(endpoint);
      const responseTime = Date.now() - startTime;
      
      // Update metrics
      this.updateEndpointMetrics(endpointKey, {
        success: true,
        responseTime,
        statusCode: response.status,
        data: response.data
      });
      
      // Special handling for swap success rate
      if (endpoint.name === 'swap' && response.data) {
        this.updateSwapMetrics(response.data);
      }
      
    } catch (error) {
      const responseTime = Date.now() - startTime;
      
      this.updateEndpointMetrics(endpointKey, {
        success: false,
        responseTime,
        error: error.message,
        statusCode: error.response?.status || 0
      });
    }
  }

  /**
   * Make HTTP request to endpoint
   */
  async makeRequest(endpoint) {
    const config = {
      method: endpoint.method,
      url: `${this.baseUrl}${endpoint.path}`,
      timeout: 5000,
      headers: {
        'User-Agent': 'Solana-DevEx-Platform/1.0',
        'Accept': 'application/json'
      }
    };

    // Add sample data for POST requests
    if (endpoint.method === 'POST') {
      config.data = this.getSampleRequestData(endpoint.name);
      config.headers['Content-Type'] = 'application/json';
    }

    return await axios(config);
  }

  /**
   * Get sample request data for POST endpoints
   */
  getSampleRequestData(endpointName) {
    const sampleData = {
      'swap': {
        inputToken: 'USDC',
        outputToken: 'SOL', 
        amount: 100,
        slippage: 0.5
      },
      'jupiter-swap': {
        inputMint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        outputMint: 'So11111111111111111111111111111111111111112', // SOL
        amount: 1000000,
        slippageBps: 50
      }
    };
    
    return sampleData[endpointName] || {};
  }

  /**
   * Update endpoint metrics
   */
  updateEndpointMetrics(endpointKey, result) {
    const metrics = this.metrics.get(endpointKey);
    if (!metrics) return;
    
    // Update basic metrics
    metrics.totalRequests++;
    metrics.lastCheck = Date.now();
    
    if (result.success) {
      metrics.successfulRequests++;
      metrics.status = this.getHealthStatus(result.responseTime);
    } else {
      metrics.errorRequests++;
      metrics.status = 'down';
    }
    
    // Calculate rates
    metrics.errorRate = (metrics.errorRequests / metrics.totalRequests) * 100;
    metrics.successRate = (metrics.successfulRequests / metrics.totalRequests) * 100;
    metrics.uptime = metrics.successRate;
    
    // Update response time and percentiles
    this.updateResponseTimeMetrics(endpointKey, result.responseTime);
    
    // Update current response time
    metrics.responseTime = result.responseTime;
    
    this.emit('endpoint-checked', {
      endpoint: endpointKey,
      metrics: { ...metrics },
      timestamp: Date.now()
    });
  }

  /**
   * Update response time metrics and calculate percentiles
   */
  updateResponseTimeMetrics(endpointKey, responseTime) {
    const history = this.responseTimeHistory.get(endpointKey);
    const metrics = this.metrics.get(endpointKey);
    
    // Add new response time
    history.push(responseTime);
    
    // Keep only last 100 measurements for percentile calculation
    if (history.length > 100) {
      history.shift();
    }
    
    // Calculate percentiles
    if (history.length > 0) {
      const sorted = [...history].sort((a, b) => a - b);
      metrics.p50 = this.getPercentile(sorted, 50);
      metrics.p95 = this.getPercentile(sorted, 95);
      metrics.p99 = this.getPercentile(sorted, 99);
    }
  }

  /**
   * Calculate percentile from sorted array
   */
  getPercentile(sortedArray, percentile) {
    const index = Math.ceil((percentile / 100) * sortedArray.length) - 1;
    return sortedArray[Math.max(0, index)] || 0;
  }

  /**
   * Get health status based on response time
   */
  getHealthStatus(responseTime) {
    const thresholds = this.healthThresholds.responseTime;
    
    if (responseTime < thresholds.healthy) return 'healthy';
    if (responseTime < thresholds.degraded) return 'degraded';
    return 'down';
  }

  /**
   * Update swap-specific metrics
   */
  updateSwapMetrics(swapData) {
    // Extract slippage and success information from swap response
    if (swapData.slippage !== undefined) {
      this.emit('swap-slippage', {
        slippage: swapData.slippage,
        timestamp: Date.now()
      });
    }
    
    if (swapData.success !== undefined) {
      this.emit('swap-success', {
        success: swapData.success,
        timestamp: Date.now()
      });
    }
  }

  /**
   * Emit aggregated metrics for dashboard
   */
  emitAggregatedMetrics() {
    const allMetrics = Array.from(this.metrics.values());
    
    const aggregated = {
      totalEndpoints: allMetrics.length,
      healthyEndpoints: allMetrics.filter(m => m.status === 'healthy').length,
      degradedEndpoints: allMetrics.filter(m => m.status === 'degraded').length,
      downEndpoints: allMetrics.filter(m => m.status === 'down').length,
      overallStatus: this.getOverallStatus(allMetrics),
      averageResponseTime: this.getAverageResponseTime(allMetrics),
      overallErrorRate: this.getOverallErrorRate(allMetrics),
      overallSuccessRate: this.getOverallSuccessRate(allMetrics),
      categoryBreakdown: this.getCategoryBreakdown(allMetrics),
      timestamp: Date.now()
    };
    
    this.emit('agentdex-metrics', {
      aggregated,
      endpoints: allMetrics
    });
  }

  /**
   * Get overall system status
   */
  getOverallStatus(metrics) {
    const downCount = metrics.filter(m => m.status === 'down').length;
    const degradedCount = metrics.filter(m => m.status === 'degraded').length;
    
    if (downCount > metrics.length * 0.3) return 'down';
    if (degradedCount > metrics.length * 0.5) return 'degraded';
    return 'healthy';
  }

  /**
   * Calculate average response time
   */
  getAverageResponseTime(metrics) {
    const validMetrics = metrics.filter(m => m.responseTime > 0);
    if (validMetrics.length === 0) return 0;
    
    const sum = validMetrics.reduce((acc, m) => acc + m.responseTime, 0);
    return Math.round(sum / validMetrics.length);
  }

  /**
   * Calculate overall error rate
   */
  getOverallErrorRate(metrics) {
    const totalRequests = metrics.reduce((acc, m) => acc + m.totalRequests, 0);
    const totalErrors = metrics.reduce((acc, m) => acc + m.errorRequests, 0);
    
    return totalRequests > 0 ? Math.round((totalErrors / totalRequests) * 100 * 10) / 10 : 0;
  }

  /**
   * Calculate overall success rate
   */
  getOverallSuccessRate(metrics) {
    const totalRequests = metrics.reduce((acc, m) => acc + m.totalRequests, 0);
    const totalSuccessful = metrics.reduce((acc, m) => acc + m.successfulRequests, 0);
    
    return totalRequests > 0 ? Math.round((totalSuccessful / totalRequests) * 100 * 10) / 10 : 100;
  }

  /**
   * Get breakdown by endpoint category
   */
  getCategoryBreakdown(metrics) {
    const categories = {};
    
    metrics.forEach(metric => {
      if (!categories[metric.category]) {
        categories[metric.category] = {
          total: 0,
          healthy: 0,
          degraded: 0,
          down: 0,
          averageResponseTime: 0
        };
      }
      
      const cat = categories[metric.category];
      cat.total++;
      cat[metric.status]++;
    });
    
    // Calculate average response times for each category
    Object.keys(categories).forEach(categoryName => {
      const categoryMetrics = metrics.filter(m => m.category === categoryName);
      categories[categoryName].averageResponseTime = this.getAverageResponseTime(categoryMetrics);
    });
    
    return categories;
  }

  /**
   * Get current metrics for all endpoints
   */
  getMetrics() {
    return {
      endpoints: Array.from(this.metrics.values()),
      isMonitoring: this.isMonitoring,
      monitoringInterval: this.monitoringInterval,
      lastUpdate: Date.now()
    };
  }

  /**
   * Get metrics for specific endpoint
   */
  getEndpointMetrics(endpointName) {
    return this.metrics.get(endpointName);
  }

  /**
   * Get performance summary as requested by @JacobsClawd
   */
  getPerformanceSummary() {
    const allMetrics = Array.from(this.metrics.values());
    const swapMetrics = allMetrics.filter(m => m.category === 'trading' || m.category === 'jupiter');
    
    return {
      // Overall platform health
      platformStatus: this.getOverallStatus(allMetrics),
      totalEndpoints: allMetrics.length,
      healthyEndpoints: allMetrics.filter(m => m.status === 'healthy').length,
      
      // Performance metrics as requested
      overallP50: Math.round(swapMetrics.reduce((acc, m) => acc + m.p50, 0) / swapMetrics.length),
      overallP95: Math.round(swapMetrics.reduce((acc, m) => acc + m.p95, 0) / swapMetrics.length),
      overallP99: Math.round(swapMetrics.reduce((acc, m) => acc + m.p99, 0) / swapMetrics.length),
      
      // Error tracking
      errorRate: this.getOverallErrorRate(allMetrics),
      successRate: this.getOverallSuccessRate(allMetrics),
      
      // Jupiter routing efficiency (through AgentDEX)
      jupiterRouting: {
        responseTime: this.getAverageResponseTime(allMetrics.filter(m => m.category === 'jupiter')),
        successRate: this.getOverallSuccessRate(allMetrics.filter(m => m.category === 'jupiter')),
        status: this.getOverallStatus(allMetrics.filter(m => m.category === 'jupiter'))
      },
      
      // Category breakdown
      categories: this.getCategoryBreakdown(allMetrics),
      
      timestamp: Date.now()
    };
  }
}

module.exports = AgentDEXMonitor;