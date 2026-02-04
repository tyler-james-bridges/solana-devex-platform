const pidusage = require('pidusage');
const si = require('systeminformation');
const fs = require('fs-extra');
const path = require('path');
const { getConfigDir } = require('./config-loader');

class PerformanceCollector {
  constructor(config = {}) {
    this.config = config;
    this.metricsDir = path.join(getConfigDir(), 'metrics');
    this.isCollecting = false;
    this.collectionInterval = null;
    this.metrics = new Map();
  }

  async initialize() {
    await fs.ensureDir(this.metricsDir);
  }

  async collect() {
    try {
      const metrics = {
        timestamp: new Date().toISOString(),
        system: await this.collectSystemMetrics(),
        validator: await this.collectValidatorMetrics(),
        network: await this.collectNetworkMetrics(),
        storage: await this.collectStorageMetrics()
      };

      return metrics;
    } catch (error) {
      console.error('Failed to collect metrics:', error.message);
      return null;
    }
  }

  async collectSystemMetrics() {
    try {
      const [cpu, memory, load] = await Promise.all([
        si.currentLoad(),
        si.mem(),
        si.currentLoad()
      ]);

      return {
        cpu: {
          usage: parseFloat(cpu.currentLoad?.toFixed(2)) || 0,
          cores: cpu.cpus?.length || 0,
          speed: cpu.avgLoad || 0
        },
        memory: {
          total: Math.round(memory.total / 1024 / 1024), // MB
          used: Math.round(memory.used / 1024 / 1024), // MB
          free: Math.round(memory.free / 1024 / 1024), // MB
          usage: parseFloat(((memory.used / memory.total) * 100).toFixed(2))
        },
        load: {
          avg1: parseFloat(load.avgLoad?.toFixed(2)) || 0,
          avg5: 0, // systeminformation doesn't provide this easily
          avg15: 0
        }
      };
    } catch (error) {
      console.error('Failed to collect system metrics:', error.message);
      return {
        cpu: { usage: 0, cores: 0, speed: 0 },
        memory: { total: 0, used: 0, free: 0, usage: 0 },
        load: { avg1: 0, avg5: 0, avg15: 0 }
      };
    }
  }

  async collectValidatorMetrics() {
    try {
      const ValidatorManager = require('./validator-manager');
      const { loadConfig } = require('./config-loader');
      
      const config = await loadConfig();
      const validatorManager = new ValidatorManager(config);
      const status = await validatorManager.getStatus();

      if (!status.running || !status.pid) {
        return {
          running: false,
          pid: null,
          cpu: 0,
          memory: 0,
          uptime: 0,
          tps: 0,
          blockHeight: 0,
          slotHeight: 0
        };
      }

      // Get process metrics
      let processMetrics = {};
      try {
        processMetrics = await pidusage(status.pid);
      } catch (error) {
        console.log('Failed to get process metrics:', error.message);
      }

      // Get validator-specific metrics via RPC
      const rpcMetrics = await this.collectRpcMetrics();

      return {
        running: true,
        pid: status.pid,
        cpu: parseFloat((processMetrics.cpu || 0).toFixed(2)),
        memory: Math.round((processMetrics.memory || 0) / 1024 / 1024), // MB
        uptime: Math.floor((processMetrics.elapsed || 0) / 1000), // seconds
        tps: rpcMetrics.tps || 0,
        blockHeight: rpcMetrics.blockHeight || 0,
        slotHeight: rpcMetrics.slotHeight || 0,
        epochInfo: rpcMetrics.epochInfo || null
      };
    } catch (error) {
      console.error('Failed to collect validator metrics:', error.message);
      return {
        running: false,
        pid: null,
        cpu: 0,
        memory: 0,
        uptime: 0,
        tps: 0,
        blockHeight: 0,
        slotHeight: 0
      };
    }
  }

  async collectRpcMetrics() {
    try {
      const { execa } = require('execa');
      const { loadConfig } = require('./config-loader');
      const config = await loadConfig();
      const rpcUrl = `http://localhost:${config.validator.rpc_port}`;

      // Get block height
      const blockHeightResult = await execa('solana', [
        'block-height',
        '--url', rpcUrl
      ], { timeout: 5000 });

      // Get slot height  
      const slotResult = await execa('solana', [
        'slot',
        '--url', rpcUrl
      ], { timeout: 5000 });

      // Get epoch info
      const epochResult = await execa('solana', [
        'epoch-info',
        '--url', rpcUrl,
        '--output', 'json'
      ], { timeout: 5000 });

      let epochInfo = null;
      try {
        epochInfo = JSON.parse(epochResult.stdout);
      } catch (e) {
        // Ignore JSON parse errors
      }

      // Calculate TPS (simplified - just approximate)
      const currentTime = Date.now();
      const currentSlot = parseInt(slotResult.stdout.trim());
      
      let tps = 0;
      if (this.lastTpsCheck) {
        const timeDiff = (currentTime - this.lastTpsCheck.time) / 1000;
        const slotDiff = currentSlot - this.lastTpsCheck.slot;
        if (timeDiff > 0 && slotDiff > 0) {
          // Rough estimate: assume ~400ms per slot, ~64 transactions per slot
          tps = (slotDiff * 64) / timeDiff;
        }
      }

      this.lastTpsCheck = { time: currentTime, slot: currentSlot };

      return {
        blockHeight: parseInt(blockHeightResult.stdout.trim()),
        slotHeight: currentSlot,
        tps: parseFloat(tps.toFixed(2)),
        epochInfo
      };
    } catch (error) {
      // RPC might not be ready or reachable
      return {
        blockHeight: 0,
        slotHeight: 0,
        tps: 0,
        epochInfo: null
      };
    }
  }

  async collectNetworkMetrics() {
    try {
      const [networkStats, networkInterfaces] = await Promise.all([
        si.networkStats(),
        si.networkInterfaces()
      ]);

      const primaryInterface = networkStats[0] || {};
      
      return {
        interface: primaryInterface.iface || 'unknown',
        bytesReceived: primaryInterface.rx_bytes || 0,
        bytesTransmitted: primaryInterface.tx_bytes || 0,
        packetsReceived: primaryInterface.rx_packets || 0,
        packetsTransmitted: primaryInterface.tx_packets || 0,
        errors: (primaryInterface.rx_errors || 0) + (primaryInterface.tx_errors || 0),
        speed: networkInterfaces[0]?.speed || 0
      };
    } catch (error) {
      console.error('Failed to collect network metrics:', error.message);
      return {
        interface: 'unknown',
        bytesReceived: 0,
        bytesTransmitted: 0,
        packetsReceived: 0,
        packetsTransmitted: 0,
        errors: 0,
        speed: 0
      };
    }
  }

  async collectStorageMetrics() {
    try {
      const { loadConfig } = require('./config-loader');
      const config = await loadConfig();
      const ledgerDir = config.validator.ledger_dir;
      
      const [fsSize, ledgerSize] = await Promise.all([
        si.fsSize(),
        this.getDirectorySize(ledgerDir)
      ]);

      // Find the filesystem containing the ledger
      const ledgerFs = fsSize.find(fs => ledgerDir.startsWith(fs.mount)) || fsSize[0];

      return {
        filesystem: ledgerFs?.fs || 'unknown',
        totalSpace: Math.round((ledgerFs?.size || 0) / 1024 / 1024 / 1024), // GB
        usedSpace: Math.round((ledgerFs?.used || 0) / 1024 / 1024 / 1024), // GB
        freeSpace: Math.round(((ledgerFs?.size || 0) - (ledgerFs?.used || 0)) / 1024 / 1024 / 1024), // GB
        usage: parseFloat(((ledgerFs?.use || 0)).toFixed(2)), // Percentage
        ledgerSize: Math.round(ledgerSize / 1024 / 1024), // MB
        mount: ledgerFs?.mount || 'unknown'
      };
    } catch (error) {
      console.error('Failed to collect storage metrics:', error.message);
      return {
        filesystem: 'unknown',
        totalSpace: 0,
        usedSpace: 0,
        freeSpace: 0,
        usage: 0,
        ledgerSize: 0,
        mount: 'unknown'
      };
    }
  }

  async getDirectorySize(dirPath) {
    try {
      if (!(await fs.pathExists(dirPath))) {
        return 0;
      }

      let totalSize = 0;
      const items = await fs.readdir(dirPath);

      for (const item of items) {
        const itemPath = path.join(dirPath, item);
        const stats = await fs.stat(itemPath);

        if (stats.isDirectory()) {
          totalSize += await this.getDirectorySize(itemPath);
        } else {
          totalSize += stats.size;
        }
      }

      return totalSize;
    } catch (error) {
      console.error(`Failed to calculate directory size for ${dirPath}:`, error.message);
      return 0;
    }
  }

  async startCollection(intervalMs = 1000) {
    if (this.isCollecting) {
      console.log('Metrics collection is already running');
      return;
    }

    await this.initialize();
    this.isCollecting = true;

    this.collectionInterval = setInterval(async () => {
      try {
        const metrics = await this.collect();
        if (metrics) {
          await this.saveMetrics(metrics);
          this.notifyListeners(metrics);
        }
      } catch (error) {
        console.error('Error during metrics collection:', error.message);
      }
    }, intervalMs);

    console.log(`Started metrics collection with ${intervalMs}ms interval`);
  }

  stopCollection() {
    if (!this.isCollecting) {
      console.log('Metrics collection is not running');
      return;
    }

    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
    }

    this.isCollecting = false;
    console.log('Stopped metrics collection');
  }

  async saveMetrics(metrics) {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const metricsFile = path.join(this.metricsDir, `${date}.jsonl`);
    
    const line = JSON.stringify(metrics) + '\n';
    await fs.appendFile(metricsFile, line);
  }

  async getHistoricalMetrics(startDate, endDate) {
    const metrics = [];
    const currentDate = new Date(startDate);
    const end = new Date(endDate);

    while (currentDate <= end) {
      const dateStr = currentDate.toISOString().split('T')[0];
      const metricsFile = path.join(this.metricsDir, `${dateStr}.jsonl`);

      if (await fs.pathExists(metricsFile)) {
        const content = await fs.readFile(metricsFile, 'utf8');
        const lines = content.trim().split('\n');

        for (const line of lines) {
          try {
            const metric = JSON.parse(line);
            metrics.push(metric);
          } catch (error) {
            console.warn(`Invalid metrics line: ${line}`);
          }
        }
      }

      currentDate.setDate(currentDate.getDate() + 1);
    }

    return metrics;
  }

  // Event system for real-time metrics
  listeners = new Set();

  addListener(callback) {
    this.listeners.add(callback);
  }

  removeListener(callback) {
    this.listeners.delete(callback);
  }

  notifyListeners(metrics) {
    this.listeners.forEach(callback => {
      try {
        callback(metrics);
      } catch (error) {
        console.error('Error notifying metrics listener:', error.message);
      }
    });
  }

  async cleanupOldMetrics(retentionDays = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays);

    try {
      const files = await fs.readdir(this.metricsDir);
      
      for (const file of files) {
        if (path.extname(file) === '.jsonl') {
          const dateStr = path.basename(file, '.jsonl');
          const fileDate = new Date(dateStr);
          
          if (fileDate < cutoffDate) {
            await fs.remove(path.join(this.metricsDir, file));
            console.log(`Cleaned up old metrics file: ${file}`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to cleanup old metrics:', error.message);
    }
  }
}

module.exports = PerformanceCollector;