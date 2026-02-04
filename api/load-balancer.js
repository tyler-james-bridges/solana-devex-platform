/**
 * LOAD BALANCER
 * Production load balancing and worker management for clustering
 */

const cluster = require('cluster');
const os = require('os');
const { EventEmitter } = require('events');

class LoadBalancer extends EventEmitter {
  constructor(options = {}) {
    super();
    
    this.options = {
      workers: options.workers || os.cpus().length,
      maxWorkers: options.maxWorkers || os.cpus().length * 2,
      minWorkers: options.minWorkers || Math.ceil(os.cpus().length / 2),
      
      // Load balancing strategy
      strategy: options.strategy || 'round_robin', // round_robin, least_connections, weighted
      
      // Health monitoring
      healthCheckInterval: options.healthCheckInterval || 30000,
      workerTimeout: options.workerTimeout || 60000,
      maxRestarts: options.maxRestarts || 5,
      restartWindow: options.restartWindow || 300000, // 5 minutes
      
      // Scaling settings
      autoScaling: options.autoScaling !== false,
      scaleUpThreshold: options.scaleUpThreshold || 80, // CPU %
      scaleDownThreshold: options.scaleDownThreshold || 30, // CPU %
      scaleCheckInterval: options.scaleCheckInterval || 60000, // 1 minute
      
      // Performance monitoring
      enableMetrics: options.enableMetrics !== false,
      metricsRetention: options.metricsRetention || 3600000, // 1 hour
      
      ...options
    };
    
    // Worker management
    this.workers = new Map();
    this.workerStats = new Map();
    this.currentWorkerIndex = 0;
    
    // Performance tracking
    this.metrics = {
      requests: 0,
      errors: 0,
      totalWorkers: 0,
      activeWorkers: 0,
      avgResponseTime: 0,
      cpuUsage: [],
      memoryUsage: [],
      restarts: 0
    };
    
    // Scaling state
    this.scalingState = {
      lastScale: Date.now(),
      isScaling: false,
      history: []
    };
    
    // Only run as master
    if (!cluster.isMaster) {
      throw new Error('LoadBalancer can only run in master process');
    }
    
    console.log('[BALANCE]️ Load balancer initialized');
  }
  
  /**
   * Start the load balancer
   */
  start() {
    console.log(`[INIT] Starting load balancer with ${this.options.workers} workers`);
    
    // Spawn initial workers
    for (let i = 0; i < this.options.workers; i++) {
      this.spawnWorker();
    }
    
    // Setup cluster event handlers
    this.setupClusterEvents();
    
    // Start health monitoring
    this.startHealthMonitoring();
    
    // Start auto-scaling if enabled
    if (this.options.autoScaling) {
      this.startAutoScaling();
    }
    
    // Start metrics collection
    if (this.options.enableMetrics) {
      this.startMetricsCollection();
    }
    
    this.emit('started', {
      workers: this.options.workers,
      strategy: this.options.strategy
    });
  }
  
  /**
   * Spawn a new worker
   */
  spawnWorker() {
    const worker = cluster.fork();
    const workerId = worker.id;
    
    const workerInfo = {
      id: workerId,
      worker,
      pid: worker.process.pid,
      spawned: Date.now(),
      connections: 0,
      requests: 0,
      errors: 0,
      status: 'starting',
      lastHeartbeat: Date.now(),
      restarts: 0,
      cpu: 0,
      memory: 0
    };
    
    this.workers.set(workerId, workerInfo);
    this.workerStats.set(workerId, {
      responseTimesms: [],
      requestRate: 0,
      errorRate: 0
    });
    
    // Setup worker-specific event handlers
    worker.on('message', (message) => {
      this.handleWorkerMessage(workerId, message);
    });
    
    worker.on('online', () => {
      workerInfo.status = 'online';
      console.log(`[SUCCESS] Worker ${workerId} (PID ${worker.process.pid}) online`);
    });
    
    worker.on('listening', () => {
      workerInfo.status = 'ready';
      console.log(`[AUDIO] Worker ${workerId} listening`);
    });
    
    worker.on('disconnect', () => {
      workerInfo.status = 'disconnected';
      console.log(`[POWER] Worker ${workerId} disconnected`);
    });
    
    worker.on('exit', (code, signal) => {
      this.handleWorkerExit(workerId, code, signal);
    });
    
    // Send configuration to worker
    worker.send({
      type: 'config',
      loadBalancer: true,
      workerId,
      metrics: this.options.enableMetrics
    });
    
    this.metrics.totalWorkers++;
    this.updateActiveWorkerCount();
    
    return worker;
  }
  
  /**
   * Setup cluster event handlers
   */
  setupClusterEvents() {
    cluster.on('fork', (worker) => {
      console.log(`[FORK] Worker ${worker.id} forked`);
    });
    
    cluster.on('online', (worker) => {
      const workerInfo = this.workers.get(worker.id);
      if (workerInfo) {
        workerInfo.status = 'online';
      }
    });
    
    cluster.on('listening', (worker, address) => {
      console.log(`[LISTEN] Worker ${worker.id} listening on ${address.address}:${address.port}`);
    });
    
    cluster.on('disconnect', (worker) => {
      console.log(`Worker ${worker.id} disconnected`);
    });
    
    cluster.on('exit', (worker, code, signal) => {
      console.log(`Worker ${worker.id} exited with code ${code} and signal ${signal}`);
    });
  }
  
  /**
   * Handle worker messages
   */
  handleWorkerMessage(workerId, message) {
    const workerInfo = this.workers.get(workerId);
    if (!workerInfo) return;
    
    switch (message.type) {
      case 'heartbeat':
        workerInfo.lastHeartbeat = Date.now();
        workerInfo.status = 'healthy';
        break;
        
      case 'stats':
        this.updateWorkerStats(workerId, message.data);
        break;
        
      case 'request_start':
        workerInfo.connections++;
        workerInfo.requests++;
        this.metrics.requests++;
        break;
        
      case 'request_end':
        workerInfo.connections = Math.max(0, workerInfo.connections - 1);
        if (message.error) {
          workerInfo.errors++;
          this.metrics.errors++;
        }
        break;
        
      case 'error':
        workerInfo.errors++;
        this.metrics.errors++;
        console.error(`Worker ${workerId} error:`, message.error);
        break;
        
      default:
        console.log(`Unknown message type from worker ${workerId}:`, message.type);
    }
  }
  
  /**
   * Handle worker exit
   */
  handleWorkerExit(workerId, code, signal) {
    const workerInfo = this.workers.get(workerId);
    if (!workerInfo) return;
    
    console.log(`[DEAD] Worker ${workerId} exited (code: ${code}, signal: ${signal})`);
    
    // Check if we should restart the worker
    const shouldRestart = this.shouldRestartWorker(workerInfo, code, signal);
    
    // Clean up worker info
    this.workers.delete(workerId);
    this.workerStats.delete(workerId);
    this.updateActiveWorkerCount();
    
    if (shouldRestart) {
      console.log(`[SYNC] Restarting worker ${workerId}`);
      workerInfo.restarts++;
      this.metrics.restarts++;
      
      // Spawn replacement worker
      setTimeout(() => {
        this.spawnWorker();
      }, 1000); // 1 second delay
    }
    
    this.emit('worker_exit', {
      workerId,
      code,
      signal,
      restarted: shouldRestart
    });
  }
  
  /**
   * Determine if worker should be restarted
   */
  shouldRestartWorker(workerInfo, code, signal) {
    // Don't restart if explicitly killed
    if (signal === 'SIGTERM' || signal === 'SIGKILL') {
      return false;
    }
    
    // Don't restart if too many restarts
    if (workerInfo.restarts >= this.options.maxRestarts) {
      console.warn(`⚠️ Worker ${workerInfo.id} exceeded max restarts (${this.options.maxRestarts})`);
      return false;
    }
    
    // Check restart window
    const restartWindow = this.options.restartWindow;
    const recentRestarts = this.getRecentRestarts(restartWindow);
    
    if (recentRestarts.length >= this.options.maxRestarts) {
      console.warn(`⚠️ Too many restarts in window: ${recentRestarts.length}`);
      return false;
    }
    
    // Don't restart if below minimum workers
    const activeWorkers = this.getActiveWorkers().length;
    if (activeWorkers < this.options.minWorkers) {
      return true;
    }
    
    return true;
  }
  
  /**
   * Start health monitoring
   */
  startHealthMonitoring() {
    console.log('[HEALTH] Starting worker health monitoring');
    
    this.healthInterval = setInterval(() => {
      this.checkWorkerHealth();
    }, this.options.healthCheckInterval);
  }
  
  /**
   * Check worker health
   */
  checkWorkerHealth() {
    const now = Date.now();
    const timeout = this.options.workerTimeout;
    
    for (const [workerId, workerInfo] of this.workers.entries()) {
      const timeSinceHeartbeat = now - workerInfo.lastHeartbeat;
      
      if (timeSinceHeartbeat > timeout) {
        console.warn(`⚠️ Worker ${workerId} health check failed (${timeSinceHeartbeat}ms since last heartbeat)`);
        
        // Mark as unhealthy
        workerInfo.status = 'unhealthy';
        
        // Kill unresponsive worker
        if (timeSinceHeartbeat > timeout * 2) {
          console.error(`[DEAD] Killing unresponsive worker ${workerId}`);
          try {
            workerInfo.worker.kill('SIGTERM');
          } catch (error) {
            console.error(`Failed to kill worker ${workerId}:`, error);
          }
        }
      }
      
      // Request worker stats
      workerInfo.worker.send({ type: 'get_stats' });
    }
  }
  
  /**
   * Start auto-scaling
   */
  startAutoScaling() {
    console.log('[INFO] Analytics Starting auto-scaling');
    
    this.scalingInterval = setInterval(() => {
      this.checkScaling();
    }, this.options.scaleCheckInterval);
  }
  
  /**
   * Check if scaling is needed
   */
  checkScaling() {
    if (this.scalingState.isScaling) {
      return; // Already scaling
    }
    
    const activeWorkers = this.getActiveWorkers();
    const avgCpuUsage = this.getAverageCpuUsage();
    const avgMemoryUsage = this.getAverageMemoryUsage();
    
    const shouldScaleUp = (
      avgCpuUsage > this.options.scaleUpThreshold &&
      activeWorkers.length < this.options.maxWorkers
    );
    
    const shouldScaleDown = (
      avgCpuUsage < this.options.scaleDownThreshold &&
      activeWorkers.length > this.options.minWorkers
    );
    
    if (shouldScaleUp) {
      this.scaleUp();
    } else if (shouldScaleDown) {
      this.scaleDown();
    }
  }
  
  /**
   * Scale up workers
   */
  scaleUp() {
    const activeWorkers = this.getActiveWorkers().length;
    const newWorkerCount = Math.min(activeWorkers + 1, this.options.maxWorkers);
    
    if (newWorkerCount > activeWorkers) {
      console.log(`[INFO] Analytics Scaling up: ${activeWorkers} → ${newWorkerCount} workers`);
      
      this.scalingState.isScaling = true;
      this.scalingState.lastScale = Date.now();
      
      this.spawnWorker();
      
      setTimeout(() => {
        this.scalingState.isScaling = false;
      }, 30000); // 30 second cooldown
      
      this.scalingState.history.push({
        action: 'scale_up',
        from: activeWorkers,
        to: newWorkerCount,
        timestamp: Date.now(),
        reason: 'high_cpu'
      });
      
      this.emit('scaled_up', { from: activeWorkers, to: newWorkerCount });
    }
  }
  
  /**
   * Scale down workers
   */
  scaleDown() {
    const activeWorkers = this.getActiveWorkers();
    const newWorkerCount = Math.max(activeWorkers.length - 1, this.options.minWorkers);
    
    if (newWorkerCount < activeWorkers.length) {
      console.log(`[DOWN] Scaling down: ${activeWorkers.length} → ${newWorkerCount} workers`);
      
      this.scalingState.isScaling = true;
      this.scalingState.lastScale = Date.now();
      
      // Find worker with least connections
      const leastBusyWorker = activeWorkers.reduce((min, worker) => 
        worker.connections < min.connections ? worker : min
      );
      
      // Gracefully shutdown the worker
      leastBusyWorker.worker.disconnect();
      
      setTimeout(() => {
        if (this.workers.has(leastBusyWorker.id)) {
          leastBusyWorker.worker.kill('SIGTERM');
        }
        this.scalingState.isScaling = false;
      }, 10000); // 10 second grace period
      
      this.scalingState.history.push({
        action: 'scale_down',
        from: activeWorkers.length,
        to: newWorkerCount,
        timestamp: Date.now(),
        reason: 'low_cpu'
      });
      
      this.emit('scaled_down', { from: activeWorkers.length, to: newWorkerCount });
    }
  }
  
  /**
   * Get next worker using load balancing strategy
   */
  getNextWorker() {
    const activeWorkers = this.getActiveWorkers();
    
    if (activeWorkers.length === 0) {
      return null;
    }
    
    switch (this.options.strategy) {
      case 'round_robin':
        return this.getRoundRobinWorker(activeWorkers);
        
      case 'least_connections':
        return this.getLeastConnectionsWorker(activeWorkers);
        
      case 'weighted':
        return this.getWeightedWorker(activeWorkers);
        
      default:
        return this.getRoundRobinWorker(activeWorkers);
    }
  }
  
  /**
   * Round robin worker selection
   */
  getRoundRobinWorker(workers) {
    const worker = workers[this.currentWorkerIndex % workers.length];
    this.currentWorkerIndex++;
    return worker;
  }
  
  /**
   * Least connections worker selection
   */
  getLeastConnectionsWorker(workers) {
    return workers.reduce((min, worker) => 
      worker.connections < min.connections ? worker : min
    );
  }
  
  /**
   * Weighted worker selection (based on performance)
   */
  getWeightedWorker(workers) {
    // Simple weight calculation based on inverse of response time and error rate
    const weights = workers.map(worker => {
      const stats = this.workerStats.get(worker.id);
      const avgResponseTime = stats?.averageResponseTime || 100;
      const errorRate = worker.errors / Math.max(worker.requests, 1);
      
      // Lower response time and error rate = higher weight
      return 1 / (avgResponseTime * (1 + errorRate));
    });
    
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
    let random = Math.random() * totalWeight;
    
    for (let i = 0; i < workers.length; i++) {
      random -= weights[i];
      if (random <= 0) {
        return workers[i];
      }
    }
    
    return workers[0]; // Fallback
  }
  
  /**
   * Update worker statistics
   */
  updateWorkerStats(workerId, stats) {
    const workerInfo = this.workers.get(workerId);
    if (!workerInfo) return;
    
    // Update worker info
    workerInfo.cpu = stats.cpu || 0;
    workerInfo.memory = stats.memory || 0;
    workerInfo.lastHeartbeat = Date.now();
    
    // Update detailed stats
    const workerStats = this.workerStats.get(workerId) || {};
    workerStats.responseTimesMs = stats.responseTimesMs || [];
    workerStats.requestRate = stats.requestRate || 0;
    workerStats.errorRate = stats.errorRate || 0;
    
    this.workerStats.set(workerId, workerStats);
  }
  
  /**
   * Get active workers
   */
  getActiveWorkers() {
    return Array.from(this.workers.values()).filter(worker => 
      worker.status === 'ready' || worker.status === 'healthy'
    );
  }
  
  /**
   * Get load balancer statistics
   */
  getStats() {
    const activeWorkers = this.getActiveWorkers();
    
    return {
      workers: {
        total: this.workers.size,
        active: activeWorkers.length,
        details: Array.from(this.workers.values()).map(worker => ({
          id: worker.id,
          pid: worker.pid,
          status: worker.status,
          connections: worker.connections,
          requests: worker.requests,
          errors: worker.errors,
          uptime: Date.now() - worker.spawned,
          cpu: worker.cpu,
          memory: worker.memory
        }))
      },
      
      metrics: {
        ...this.metrics,
        activeWorkers: activeWorkers.length,
        avgCpu: this.getAverageCpuUsage(),
        avgMemory: this.getAverageMemoryUsage()
      },
      
      scaling: {
        strategy: this.options.strategy,
        autoScaling: this.options.autoScaling,
        lastScale: this.scalingState.lastScale,
        isScaling: this.scalingState.isScaling,
        history: this.scalingState.history.slice(-10) // Last 10 scaling events
      },
      
      performance: {
        requestRate: this.calculateRequestRate(),
        errorRate: this.metrics.requests > 0 ? 
          (this.metrics.errors / this.metrics.requests) * 100 : 0,
        averageResponseTime: this.calculateAverageResponseTime()
      }
    };
  }
  
  /**
   * Utility methods
   */
  updateActiveWorkerCount() {
    this.metrics.activeWorkers = this.getActiveWorkers().length;
  }
  
  getAverageCpuUsage() {
    const workers = this.getActiveWorkers();
    if (workers.length === 0) return 0;
    
    const totalCpu = workers.reduce((sum, worker) => sum + worker.cpu, 0);
    return totalCpu / workers.length;
  }
  
  getAverageMemoryUsage() {
    const workers = this.getActiveWorkers();
    if (workers.length === 0) return 0;
    
    const totalMemory = workers.reduce((sum, worker) => sum + worker.memory, 0);
    return totalMemory / workers.length;
  }
  
  getRecentRestarts(windowMs) {
    const cutoff = Date.now() - windowMs;
    return this.scalingState.history.filter(event => 
      event.action === 'restart' && event.timestamp > cutoff
    );
  }
  
  calculateRequestRate() {
    // Simplified request rate calculation
    const workers = this.getActiveWorkers();
    return workers.reduce((sum, worker) => {
      const stats = this.workerStats.get(worker.id);
      return sum + (stats?.requestRate || 0);
    }, 0);
  }
  
  calculateAverageResponseTime() {
    const workers = this.getActiveWorkers();
    const allResponseTimes = [];
    
    workers.forEach(worker => {
      const stats = this.workerStats.get(worker.id);
      if (stats?.responseTimesMs) {
        allResponseTimes.push(...stats.responseTimesMs);
      }
    });
    
    if (allResponseTimes.length === 0) return 0;
    
    const sum = allResponseTimes.reduce((total, time) => total + time, 0);
    return sum / allResponseTimes.length;
  }
  
  /**
   * Start metrics collection
   */
  startMetricsCollection() {
    this.metricsInterval = setInterval(() => {
      this.collectMetrics();
    }, 30000); // Every 30 seconds
  }
  
  collectMetrics() {
    const now = Date.now();
    
    this.metrics.cpuUsage.push({
      timestamp: now,
      value: this.getAverageCpuUsage()
    });
    
    this.metrics.memoryUsage.push({
      timestamp: now,
      value: this.getAverageMemoryUsage()
    });
    
    // Clean old metrics
    const retention = this.options.metricsRetention;
    const cutoff = now - retention;
    
    this.metrics.cpuUsage = this.metrics.cpuUsage.filter(m => m.timestamp > cutoff);
    this.metrics.memoryUsage = this.metrics.memoryUsage.filter(m => m.timestamp > cutoff);
  }
  
  /**
   * Graceful shutdown
   */
  async shutdown() {
    console.log('[POWER] Shutting down load balancer...');
    
    // Clear intervals
    if (this.healthInterval) clearInterval(this.healthInterval);
    if (this.scalingInterval) clearInterval(this.scalingInterval);
    if (this.metricsInterval) clearInterval(this.metricsInterval);
    
    // Gracefully shutdown all workers
    const shutdownPromises = [];
    
    for (const [workerId, workerInfo] of this.workers.entries()) {
      console.log(`[EXPORT] Shutting down worker ${workerId}`);
      
      const shutdownPromise = new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.warn(`⚠️ Force killing worker ${workerId}`);
          workerInfo.worker.kill('SIGKILL');
          resolve();
        }, 10000); // 10 second timeout
        
        workerInfo.worker.once('exit', () => {
          clearTimeout(timeout);
          resolve();
        });
        
        workerInfo.worker.disconnect();
        workerInfo.worker.kill('SIGTERM');
      });
      
      shutdownPromises.push(shutdownPromise);
    }
    
    await Promise.all(shutdownPromises);
    
    console.log('[SUCCESS] Load balancer shutdown complete');
    this.emit('shutdown');
  }
}

module.exports = LoadBalancer;