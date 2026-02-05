import { EventEmitter } from 'events';
import { Connection, PublicKey } from '@solana/web3.js';
import { WebSocketServer } from 'ws';
import * as os from 'os';
import { performance } from 'perf_hooks';

export interface PerformanceMetrics {
  timestamp: number;
  system: {
    cpuUsage: number;
    memoryUsage: {
      total: number;
      used: number;
      free: number;
      percentage: number;
    };
    loadAverage: number[];
  };
  solana?: {
    rpcLatency: number;
    transactionCount: number;
    blockHeight: number;
    tps?: number;
  };
  anchor?: {
    buildTime?: number;
    testTime?: number;
    deployTime?: number;
  };
  network?: {
    cluster: string;
    rpcUrl: string;
    connectivity: 'good' | 'slow' | 'poor' | 'offline';
  };
}

export interface PerformanceCollectorConfig {
  enabled?: boolean;
  collectInterval?: number; // milliseconds
  websocketPort?: number;
  connection?: Connection;
  trackBuildPerformance?: boolean;
  trackNetworkLatency?: boolean;
}

export class PerformanceCollector extends EventEmitter {
  private config: PerformanceCollectorConfig;
  private wsServer?: WebSocketServer;
  private collectInterval?: NodeJS.Timeout;
  private connection?: Connection;
  private metrics: PerformanceMetrics[] = [];
  private maxMetricsHistory = 1000;

  constructor(config: PerformanceCollectorConfig = {}) {
    super();
    this.config = {
      enabled: true,
      collectInterval: 5000, // 5 seconds
      websocketPort: 8767,
      trackBuildPerformance: true,
      trackNetworkLatency: true,
      ...config
    };
    
    if (config.connection) {
      this.connection = config.connection;
    }
  }

  public setConnection(connection: Connection): void {
    this.connection = connection;
  }

  public async startRealTimeCollection(): Promise<void> {
    if (!this.config.enabled || this.collectInterval) return;

    console.log('  Starting performance monitoring...');

    // Start WebSocket server for real-time updates
    await this.startWebSocketServer();

    // Start collecting metrics
    this.collectInterval = setInterval(async () => {
      try {
        const metrics = await this.collectCurrentMetrics();
        this.addMetrics(metrics);
        this.broadcastMetrics(metrics);
        this.emit('metrics:collected', metrics);
      } catch (error) {
        console.error('Error collecting metrics:', error);
      }
    }, this.config.collectInterval);

    console.log(`  Performance monitoring active (interval: ${this.config.collectInterval}ms)`);
  }

  public async stopRealTimeCollection(): Promise<void> {
    if (this.collectInterval) {
      clearInterval(this.collectInterval);
      this.collectInterval = undefined;
    }

    if (this.wsServer) {
      this.wsServer.close();
      this.wsServer = undefined;
    }

    console.log('  Performance monitoring stopped');
  }

  public async collectCurrentMetrics(): Promise<PerformanceMetrics> {
    const timestamp = Date.now();
    
    // Collect system metrics
    const systemMetrics = this.collectSystemMetrics();
    
    // Collect Solana metrics if connection available
    const solanaMetrics = this.connection ? await this.collectSolanaMetrics() : undefined;
    
    // Collect network metrics
    const networkMetrics = await this.collectNetworkMetrics();

    const metrics: PerformanceMetrics = {
      timestamp,
      system: systemMetrics,
      solana: solanaMetrics,
      network: networkMetrics
    };

    return metrics;
  }

  private collectSystemMetrics(): PerformanceMetrics['system'] {
    const cpus = os.cpus();
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMem = totalMem - freeMem;

    // Calculate CPU usage (simplified)
    let totalIdle = 0;
    let totalTick = 0;
    
    for (const cpu of cpus) {
      for (const type in cpu.times) {
        totalTick += cpu.times[type as keyof typeof cpu.times];
      }
      totalIdle += cpu.times.idle;
    }

    const cpuUsage = 100 - Math.round((100 * totalIdle) / totalTick);

    return {
      cpuUsage,
      memoryUsage: {
        total: Math.round(totalMem / 1024 / 1024), // MB
        used: Math.round(usedMem / 1024 / 1024), // MB
        free: Math.round(freeMem / 1024 / 1024), // MB
        percentage: Math.round((usedMem / totalMem) * 100)
      },
      loadAverage: os.loadavg()
    };
  }

  private async collectSolanaMetrics(): Promise<PerformanceMetrics['solana'] | undefined> {
    if (!this.connection) return undefined;

    try {
      const startTime = performance.now();
      
      // Test RPC latency
      const blockHeight = await this.connection.getBlockHeight();
      const endTime = performance.now();
      const rpcLatency = endTime - startTime;

      // Get recent performance samples for TPS calculation
      const perfSamples = await this.connection.getRecentPerformanceSamples(1);
      const tps = perfSamples.length > 0 ? perfSamples[0].samplePeriodSecs > 0 
        ? perfSamples[0].numTransactions / perfSamples[0].samplePeriodSecs 
        : undefined : undefined;

      return {
        rpcLatency,
        transactionCount: perfSamples.length > 0 ? perfSamples[0].numTransactions : 0,
        blockHeight,
        tps
      };
    } catch (error) {
      console.error('Error collecting Solana metrics:', error);
      return {
        rpcLatency: -1,
        transactionCount: 0,
        blockHeight: 0
      };
    }
  }

  private async collectNetworkMetrics(): Promise<PerformanceMetrics['network']> {
    let connectivity: 'good' | 'slow' | 'poor' | 'offline' = 'offline';
    let rpcUrl = 'unknown';

    if (this.connection) {
      try {
        const startTime = performance.now();
        await this.connection.getSlot();
        const latency = performance.now() - startTime;
        
        rpcUrl = this.connection.rpcEndpoint;
        
        if (latency < 100) {
          connectivity = 'good';
        } else if (latency < 500) {
          connectivity = 'slow';
        } else {
          connectivity = 'poor';
        }
      } catch {
        connectivity = 'offline';
      }
    }

    return {
      cluster: this.detectCluster(rpcUrl),
      rpcUrl,
      connectivity
    };
  }

  private detectCluster(rpcUrl: string): string {
    if (rpcUrl.includes('devnet')) return 'devnet';
    if (rpcUrl.includes('testnet')) return 'testnet';
    if (rpcUrl.includes('mainnet')) return 'mainnet-beta';
    if (rpcUrl.includes('localhost') || rpcUrl.includes('127.0.0.1')) return 'localnet';
    return 'custom';
  }

  private addMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics);
    
    // Keep only recent metrics
    if (this.metrics.length > this.maxMetricsHistory) {
      this.metrics = this.metrics.slice(-this.maxMetricsHistory);
    }
  }

  private broadcastMetrics(metrics: PerformanceMetrics): void {
    if (this.wsServer) {
      this.wsServer.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: 'metrics:update',
            data: metrics,
            timestamp: Date.now()
          }));
        }
      });
    }
  }

  private async startWebSocketServer(): Promise<void> {
    if (this.wsServer) return;

    this.wsServer = new WebSocketServer({ port: this.config.websocketPort });
    
    this.wsServer.on('connection', (ws) => {
      console.log('  Client connected for performance metrics');
      
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Performance metrics streaming enabled'
      }));

      // Send recent metrics history
      ws.send(JSON.stringify({
        type: 'metrics:history',
        data: this.metrics.slice(-50) // Last 50 metrics
      }));

      ws.on('close', () => {
        console.log('  Client disconnected from performance metrics');
      });

      ws.on('message', (message) => {
        try {
          const request = JSON.parse(message.toString());
          this.handleWebSocketRequest(ws, request);
        } catch (error) {
          console.error('Error handling WebSocket message:', error);
        }
      });
    });

    console.log(`  Performance metrics WebSocket server started on port ${this.config.websocketPort}`);
  }

  private handleWebSocketRequest(ws: any, request: any): void {
    switch (request.type) {
      case 'get:current':
        this.collectCurrentMetrics().then(metrics => {
          ws.send(JSON.stringify({
            type: 'metrics:current',
            data: metrics
          }));
        });
        break;
        
      case 'get:history':
        const count = Math.min(request.count || 50, this.maxMetricsHistory);
        ws.send(JSON.stringify({
          type: 'metrics:history',
          data: this.metrics.slice(-count)
        }));
        break;
        
      case 'get:summary':
        ws.send(JSON.stringify({
          type: 'metrics:summary',
          data: this.generateMetricsSummary()
        }));
        break;
    }
  }

  private generateMetricsSummary(): any {
    if (this.metrics.length === 0) return null;

    const recentMetrics = this.metrics.slice(-20); // Last 20 data points
    
    const avgCpuUsage = recentMetrics.reduce((sum, m) => sum + m.system.cpuUsage, 0) / recentMetrics.length;
    const avgMemoryUsage = recentMetrics.reduce((sum, m) => sum + m.system.memoryUsage.percentage, 0) / recentMetrics.length;
    const avgRpcLatency = recentMetrics
      .filter(m => m.solana?.rpcLatency && m.solana.rpcLatency > 0)
      .reduce((sum, m) => sum + m.solana!.rpcLatency, 0) / recentMetrics.length || 0;

    return {
      timeRange: {
        start: recentMetrics[0].timestamp,
        end: recentMetrics[recentMetrics.length - 1].timestamp
      },
      averages: {
        cpuUsage: Math.round(avgCpuUsage * 100) / 100,
        memoryUsage: Math.round(avgMemoryUsage * 100) / 100,
        rpcLatency: Math.round(avgRpcLatency * 100) / 100
      },
      current: recentMetrics[recentMetrics.length - 1]
    };
  }

  public getMetricsHistory(count: number = 50): PerformanceMetrics[] {
    return this.metrics.slice(-Math.min(count, this.maxMetricsHistory));
  }

  public getMetricsSummary(): any {
    return this.generateMetricsSummary();
  }

  // Enhanced performance tracking for specific Anchor operations
  public async trackBuildPerformance<T>(operation: () => Promise<T>): Promise<T & { performance: { buildTime: number } }> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      const buildTime = endTime - startTime;
      
      // Add build time to current metrics
      const currentMetrics = await this.collectCurrentMetrics();
      currentMetrics.anchor = { ...currentMetrics.anchor, buildTime };
      this.addMetrics(currentMetrics);
      this.broadcastMetrics(currentMetrics);
      
      return {
        ...result,
        performance: { buildTime }
      };
    } catch (error) {
      throw error;
    }
  }

  public async trackTestPerformance<T>(operation: () => Promise<T>): Promise<T & { performance: { testTime: number } }> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      const testTime = endTime - startTime;
      
      // Add test time to current metrics
      const currentMetrics = await this.collectCurrentMetrics();
      currentMetrics.anchor = { ...currentMetrics.anchor, testTime };
      this.addMetrics(currentMetrics);
      this.broadcastMetrics(currentMetrics);
      
      return {
        ...result,
        performance: { testTime }
      };
    } catch (error) {
      throw error;
    }
  }

  public async trackDeployPerformance<T>(operation: () => Promise<T>): Promise<T & { performance: { deployTime: number } }> {
    const startTime = performance.now();
    
    try {
      const result = await operation();
      const endTime = performance.now();
      const deployTime = endTime - startTime;
      
      // Add deploy time to current metrics
      const currentMetrics = await this.collectCurrentMetrics();
      currentMetrics.anchor = { ...currentMetrics.anchor, deployTime };
      this.addMetrics(currentMetrics);
      this.broadcastMetrics(currentMetrics);
      
      return {
        ...result,
        performance: { deployTime }
      };
    } catch (error) {
      throw error;
    }
  }
}