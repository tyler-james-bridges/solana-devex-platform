/**
 * Enhanced Integration Hub for Solana DevEx Platform
 * Makes it dead simple for any project to integrate in under 5 minutes
 */

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs').promises;
const path = require('path');
const WebSocket = require('ws');

class IntegrationHub {
  constructor() {
    this.app = express();
    this.integrations = new Map();
    this.statusMonitor = new Map();
    this.wsClients = new Set();
    
    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    
    // Load existing integrations
    this.loadIntegrations();
  }

  setupMiddleware() {
    this.app.use(express.json());
    this.app.use(express.static('public'));
    
    // CORS for easy integration
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      next();
    });
  }

  setupRoutes() {
    // ONE-CLICK INTEGRATION SETUP
    this.app.post('/api/integrate/quick-setup', this.handleQuickSetup.bind(this));
    
    // AUTO-GENERATED API ENDPOINTS
    this.app.get('/api/integrate/:projectId/endpoints', this.getProjectEndpoints.bind(this));
    this.app.post('/api/integrate/:projectId/generate-endpoint', this.generateEndpoint.bind(this));
    
    // REAL-TIME STATUS MONITORING
    this.app.get('/api/integrate/:projectId/status', this.getProjectStatus.bind(this));
    this.app.get('/api/integrate/status/all', this.getAllStatuses.bind(this));
    
    // DOCUMENTATION GENERATOR
    this.app.get('/api/integrate/:projectId/docs', this.generateDocs.bind(this));
    this.app.get('/api/integrate/:projectId/docs/download', this.downloadDocs.bind(this));
    
    // INTEGRATION TEMPLATES
    this.app.get('/api/integrate/templates', this.getTemplates.bind(this));
    this.app.get('/api/integrate/templates/:templateId', this.getTemplate.bind(this));
    
    // Project management
    this.app.get('/api/integrate/projects', this.getAllProjects.bind(this));
    this.app.delete('/api/integrate/:projectId', this.deleteProject.bind(this));
    
    // Health check
    this.app.get('/api/integrate/health', (req, res) => {
      res.json({ status: 'healthy', timestamp: Date.now() });
    });
  }

  setupWebSocket() {
    this.wss = new WebSocket.Server({ port: 8080 });
    
    this.wss.on('connection', (ws) => {
      this.wsClients.add(ws);
      
      ws.on('close', () => {
        this.wsClients.delete(ws);
      });
      
      // Send current status to new client
      ws.send(JSON.stringify({
        type: 'initial_status',
        data: Object.fromEntries(this.statusMonitor)
      }));
    });
  }

  // ONE-CLICK SETUP HANDLER
  async handleQuickSetup(req, res) {
    try {
      const { projectName, repoUrl, template, webhookUrl } = req.body;
      
      if (!projectName) {
        return res.status(400).json({ error: 'Project name is required' });
      }

      const projectId = uuidv4();
      const apiKey = uuidv4();
      
      const integration = {
        id: projectId,
        name: projectName,
        repoUrl,
        template: template || 'basic-solana',
        apiKey,
        webhookUrl,
        createdAt: new Date().toISOString(),
        status: 'active',
        endpoints: [],
        lastHeartbeat: Date.now()
      };

      // Generate initial endpoints based on template
      integration.endpoints = await this.generateTemplateEndpoints(template);
      
      // Store integration
      this.integrations.set(projectId, integration);
      this.statusMonitor.set(projectId, {
        status: 'online',
        lastCheck: Date.now(),
        endpoints: integration.endpoints.length,
        errors: []
      });

      // Save to disk
      await this.saveIntegration(integration);
      
      // Generate documentation
      const docs = await this.generateProjectDocs(integration);
      
      // Broadcast status update
      this.broadcastStatusUpdate(projectId, 'created');

      res.json({
        success: true,
        projectId,
        apiKey,
        dashboardUrl: `${req.protocol}://${req.get('host')}/dashboard/${projectId}`,
        docsUrl: `${req.protocol}://${req.get('host')}/api/integrate/${projectId}/docs`,
        endpoints: integration.endpoints,
        quickStartGuide: this.generateQuickStartGuide(integration),
        estimatedSetupTime: '2-5 minutes'
      });

    } catch (error) {
      console.error('Quick setup error:', error);
      res.status(500).json({ error: 'Setup failed', details: error.message });
    }
  }

  // AUTO-GENERATE API ENDPOINTS
  async generateEndpoint(req, res) {
    try {
      const { projectId } = req.params;
      const { endpointType, config } = req.body;
      
      const integration = this.integrations.get(projectId);
      if (!integration) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const endpoint = {
        id: uuidv4(),
        type: endpointType,
        path: this.generateEndpointPath(endpointType, config),
        method: config.method || 'GET',
        description: config.description || `Auto-generated ${endpointType} endpoint`,
        createdAt: new Date().toISOString(),
        config
      };

      integration.endpoints.push(endpoint);
      await this.saveIntegration(integration);

      res.json({
        endpoint,
        fullUrl: `${req.protocol}://${req.get('host')}/api/projects/${projectId}${endpoint.path}`,
        curlExample: this.generateCurlExample(endpoint, projectId)
      });

    } catch (error) {
      res.status(500).json({ error: 'Endpoint generation failed', details: error.message });
    }
  }

  // REAL-TIME STATUS MONITORING
  async getProjectStatus(req, res) {
    const { projectId } = req.params;
    const integration = this.integrations.get(projectId);
    
    if (!integration) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const status = this.statusMonitor.get(projectId) || {
      status: 'unknown',
      lastCheck: 0,
      endpoints: 0,
      errors: []
    };

    res.json({
      project: integration,
      status: status.status,
      lastCheck: status.lastCheck,
      endpointCount: integration.endpoints.length,
      uptime: this.calculateUptime(integration.createdAt),
      recentErrors: status.errors.slice(-10),
      metrics: await this.getProjectMetrics(projectId)
    });
  }

  // DOCUMENTATION GENERATOR
  async generateDocs(req, res) {
    try {
      const { projectId } = req.params;
      const integration = this.integrations.get(projectId);
      
      if (!integration) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const docs = await this.generateProjectDocs(integration);
      
      res.json({
        projectId,
        projectName: integration.name,
        documentation: docs,
        lastUpdated: new Date().toISOString()
      });

    } catch (error) {
      res.status(500).json({ error: 'Documentation generation failed', details: error.message });
    }
  }

  // TEMPLATE SYSTEM
  async getTemplates(req, res) {
    const templates = await this.loadTemplates();
    res.json({
      templates,
      categories: ['Web3 DApp', 'Trading Bot', 'NFT Platform', 'DeFi Protocol', 'Gaming', 'Basic Integration']
    });
  }

  // Helper Methods
  async generateTemplateEndpoints(template) {
    const templates = {
      'basic-solana': [
        { path: '/balance', method: 'GET', description: 'Get wallet balance' },
        { path: '/transaction', method: 'POST', description: 'Send transaction' },
        { path: '/status', method: 'GET', description: 'Get connection status' }
      ],
      'nft-platform': [
        { path: '/mint', method: 'POST', description: 'Mint NFT' },
        { path: '/collection', method: 'GET', description: 'Get collection metadata' },
        { path: '/transfer', method: 'POST', description: 'Transfer NFT' }
      ],
      'trading-bot': [
        { path: '/price', method: 'GET', description: 'Get token price' },
        { path: '/trade', method: 'POST', description: 'Execute trade' },
        { path: '/portfolio', method: 'GET', description: 'Get portfolio' }
      ]
    };

    return (templates[template] || templates['basic-solana']).map(endpoint => ({
      ...endpoint,
      id: uuidv4(),
      createdAt: new Date().toISOString()
    }));
  }

  generateQuickStartGuide(integration) {
    return {
      steps: [
        {
          step: 1,
          title: 'Install SDK',
          code: `npm install @solana-devex/integration-sdk`,
          duration: '30 seconds'
        },
        {
          step: 2,
          title: 'Initialize Client',
          code: `
import { SolanaDevExClient } from '@solana-devex/integration-sdk';

const client = new SolanaDevExClient({
  projectId: '${integration.id}',
  apiKey: '${integration.apiKey}',
  environment: 'production'
});`,
          duration: '1 minute'
        },
        {
          step: 3,
          title: 'Make Your First Call',
          code: `
// Check status
const status = await client.getStatus();

// Get balance
const balance = await client.getBalance('your-wallet-address');`,
          duration: '1 minute'
        },
        {
          step: 4,
          title: 'Set Up Webhooks (Optional)',
          code: `
client.setWebhookUrl('${integration.webhookUrl || 'https://your-app.com/webhook'}');`,
          duration: '2 minutes'
        }
      ],
      estimatedTime: '2-5 minutes',
      nextSteps: [
        'Check the documentation for advanced features',
        'Set up monitoring dashboard',
        'Configure error handling',
        'Add custom endpoints as needed'
      ]
    };
  }

  async generateProjectDocs(integration) {
    return {
      introduction: `
# ${integration.name} Integration Documentation

This documentation provides everything you need to integrate with the Solana DevEx Platform.

## Quick Start
Your integration is ready! Use the provided API key to authenticate requests.

**API Key:** \`${integration.apiKey}\`
**Base URL:** \`https://api.solana-devex.com/api/projects/${integration.id}\`
      `,
      authentication: `
## Authentication

Include your API key in the Authorization header:
\`\`\`
Authorization: Bearer ${integration.apiKey}
\`\`\`
      `,
      endpoints: integration.endpoints.map(endpoint => ({
        path: endpoint.path,
        method: endpoint.method,
        description: endpoint.description,
        example: this.generateEndpointExample(endpoint, integration.id)
      })),
      sdkGuide: this.generateSDKGuide(integration),
      webhooks: this.generateWebhookDocs(integration),
      errorHandling: this.generateErrorHandlingDocs(),
      examples: this.generateCodeExamples(integration)
    };
  }

  broadcastStatusUpdate(projectId, event, data = {}) {
    const message = JSON.stringify({
      type: 'status_update',
      projectId,
      event,
      timestamp: Date.now(),
      data
    });

    this.wsClients.forEach(ws => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(message);
      }
    });
  }

  async loadIntegrations() {
    try {
      const integrationsDir = path.join(__dirname, 'data', 'integrations');
      const files = await fs.readdir(integrationsDir).catch(() => []);
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const data = await fs.readFile(path.join(integrationsDir, file), 'utf8');
          const integration = JSON.parse(data);
          this.integrations.set(integration.id, integration);
        }
      }
    } catch (error) {
      console.log('No existing integrations found, starting fresh');
    }
  }

  async saveIntegration(integration) {
    const integrationsDir = path.join(__dirname, 'data', 'integrations');
    await fs.mkdir(integrationsDir, { recursive: true });
    await fs.writeFile(
      path.join(integrationsDir, `${integration.id}.json`),
      JSON.stringify(integration, null, 2)
    );
  }

  start(port = 3001) {
    this.app.listen(port, () => {
      console.log(`🚀 Enhanced Integration Hub running on port ${port}`);
      console.log(`📊 WebSocket monitoring on port 8080`);
      console.log(`📚 Documentation available at http://localhost:${port}/docs`);
    });
  }
}

module.exports = IntegrationHub;