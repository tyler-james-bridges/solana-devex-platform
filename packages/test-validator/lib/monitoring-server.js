const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');
const PerformanceCollector = require('./performance-collector');
const ValidatorManager = require('./validator-manager');
const EnvironmentManager = require('./environment-manager');
const { loadConfig } = require('./config-loader');

class MonitoringServer {
  constructor(port = 3001) {
    this.port = port;
    this.app = express();
    this.server = null;
    this.wss = null;
    this.performanceCollector = new PerformanceCollector();
    this.validatorManager = null;
    this.environmentManager = new EnvironmentManager();
    this.clients = new Set();
    
    this.setupRoutes();
  }

  setupRoutes() {
    // Middleware
    this.app.use(express.json());
    this.app.use(express.static(path.join(__dirname, '../monitoring/public')));

    // API Routes
    this.app.get('/api/status', this.handleStatus.bind(this));
    this.app.get('/api/metrics', this.handleMetrics.bind(this));
    this.app.get('/api/metrics/history', this.handleMetricsHistory.bind(this));
    this.app.get('/api/environments', this.handleEnvironmentsList.bind(this));
    this.app.post('/api/validator/start', this.handleValidatorStart.bind(this));
    this.app.post('/api/validator/stop', this.handleValidatorStop.bind(this));
    this.app.post('/api/validator/restart', this.handleValidatorRestart.bind(this));
    this.app.post('/api/validator/reset', this.handleValidatorReset.bind(this));
    this.app.post('/api/environments', this.handleCreateEnvironment.bind(this));
    this.app.delete('/api/environments/:name', this.handleDeleteEnvironment.bind(this));

    // Health check
    this.app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    // Serve dashboard
    this.app.get('/', (req, res) => {
      res.sendFile(path.join(__dirname, '../monitoring/dashboard.html'));
    });
  }

  async start(port = null) {
    if (port) this.port = port;
    
    const config = await loadConfig();
    this.validatorManager = new ValidatorManager(config);

    this.server = http.createServer(this.app);
    
    // Setup WebSocket server for real-time updates
    this.wss = new WebSocket.Server({ server: this.server });
    this.setupWebSocket();

    // Start performance collection
    await this.performanceCollector.startCollection(1000);
    this.performanceCollector.addListener(this.broadcastMetrics.bind(this));

    return new Promise((resolve, reject) => {
      this.server.listen(this.port, (error) => {
        if (error) {
          reject(error);
        } else {
          console.log(`Monitoring server started on http://localhost:${this.port}`);
          resolve();
        }
      });
    });
  }

  async stop() {
    this.performanceCollector.stopCollection();
    
    if (this.wss) {
      this.wss.close();
    }
    
    if (this.server) {
      return new Promise((resolve) => {
        this.server.close(resolve);
      });
    }
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('New WebSocket client connected');
      this.clients.add(ws);

      ws.on('close', () => {
        console.log('WebSocket client disconnected');
        this.clients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error.message);
        this.clients.delete(ws);
      });

      // Send initial status
      this.sendStatusToClient(ws);
    });
  }

  async sendStatusToClient(ws) {
    try {
      const [status, metrics] = await Promise.all([
        this.validatorManager.getStatus(),
        this.performanceCollector.collect()
      ]);

      ws.send(JSON.stringify({
        type: 'status',
        data: { status, metrics }
      }));
    } catch (error) {
      console.error('Failed to send status to client:', error.message);
    }
  }

  broadcastMetrics(metrics) {
    const message = JSON.stringify({
      type: 'metrics',
      data: metrics
    });

    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        try {
          client.send(message);
        } catch (error) {
          console.error('Failed to send metrics to client:', error.message);
          this.clients.delete(client);
        }
      }
    });
  }

  // API Handlers
  async handleStatus(req, res) {
    try {
      const status = await this.validatorManager.getStatus();
      res.json(status);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleMetrics(req, res) {
    try {
      const metrics = await this.performanceCollector.collect();
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleMetricsHistory(req, res) {
    try {
      const { start, end } = req.query;
      const startDate = start ? new Date(start) : new Date(Date.now() - 24 * 60 * 60 * 1000);
      const endDate = end ? new Date(end) : new Date();
      
      const metrics = await this.performanceCollector.getHistoricalMetrics(startDate, endDate);
      res.json(metrics);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleEnvironmentsList(req, res) {
    try {
      const environments = await this.environmentManager.listEnvironments();
      res.json(environments);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleValidatorStart(req, res) {
    try {
      const { environment, reset, monitoring } = req.body;
      const result = await this.validatorManager.start({
        environment,
        reset,
        monitoring
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleValidatorStop(req, res) {
    try {
      await this.validatorManager.stop();
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleValidatorRestart(req, res) {
    try {
      const { environment, reset } = req.body;
      await this.validatorManager.restart({ environment, reset });
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleValidatorReset(req, res) {
    try {
      const { hard } = req.body;
      await this.validatorManager.reset(hard);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleCreateEnvironment(req, res) {
    try {
      const { name, ...options } = req.body;
      const environment = await this.environmentManager.createEnvironment(name, options);
      res.json(environment);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async handleDeleteEnvironment(req, res) {
    try {
      const { name } = req.params;
      await this.environmentManager.deleteEnvironment(name);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

module.exports = MonitoringServer;