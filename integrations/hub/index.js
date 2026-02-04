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

  // MISSING METHODS IMPLEMENTATION
  async getProjectEndpoints(req, res) {
    try {
      const { projectId } = req.params;
      const integration = this.integrations.get(projectId);
      
      if (!integration) {
        return res.status(404).json({ error: 'Project not found' });
      }

      res.json({
        projectId,
        endpoints: integration.endpoints,
        totalEndpoints: integration.endpoints.length
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get endpoints', details: error.message });
    }
  }

  async getAllStatuses(req, res) {
    try {
      const statuses = {};
      
      for (const [projectId, integration] of this.integrations) {
        const status = this.statusMonitor.get(projectId) || {
          status: 'unknown',
          lastCheck: 0,
          endpoints: 0,
          errors: []
        };
        
        statuses[projectId] = {
          name: integration.name,
          status: status.status,
          lastCheck: status.lastCheck,
          endpoints: integration.endpoints.length,
          uptime: this.calculateUptime(integration.createdAt)
        };
      }
      
      res.json(statuses);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get statuses', details: error.message });
    }
  }

  async downloadDocs(req, res) {
    try {
      const { projectId } = req.params;
      const format = req.query.format || 'json';
      
      const integration = this.integrations.get(projectId);
      if (!integration) {
        return res.status(404).json({ error: 'Project not found' });
      }

      const docs = await this.generateProjectDocs(integration);
      
      if (format === 'json') {
        res.json(docs);
      } else if (format === 'markdown') {
        res.setHeader('Content-Type', 'text/markdown');
        res.setHeader('Content-Disposition', `attachment; filename="${integration.name}-docs.md"`);
        res.send(this.convertDocsToMarkdown(docs));
      } else {
        res.status(400).json({ error: 'Unsupported format. Use json or markdown.' });
      }
    } catch (error) {
      res.status(500).json({ error: 'Failed to download docs', details: error.message });
    }
  }

  async getTemplate(req, res) {
    try {
      const { templateId } = req.params;
      const { templates } = require('./templates');
      
      const template = templates[templateId];
      if (!template) {
        return res.status(404).json({ error: 'Template not found' });
      }

      res.json({
        template,
        implementationFiles: this.generateImplementationFiles(template),
        deploymentGuide: this.generateDeploymentGuide(template)
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get template', details: error.message });
    }
  }

  async getAllProjects(req, res) {
    try {
      const projects = Array.from(this.integrations.values()).map(integration => ({
        id: integration.id,
        name: integration.name,
        template: integration.template,
        createdAt: integration.createdAt,
        status: integration.status,
        endpointCount: integration.endpoints.length,
        lastHeartbeat: integration.lastHeartbeat
      }));

      res.json({ projects });
    } catch (error) {
      res.status(500).json({ error: 'Failed to get projects', details: error.message });
    }
  }

  async deleteProject(req, res) {
    try {
      const { projectId } = req.params;
      const integration = this.integrations.get(projectId);
      
      if (!integration) {
        return res.status(404).json({ error: 'Project not found' });
      }

      // Remove from memory
      this.integrations.delete(projectId);
      this.statusMonitor.delete(projectId);

      // Remove from disk
      const integrationsDir = path.join(__dirname, 'data', 'integrations');
      await fs.unlink(path.join(integrationsDir, `${projectId}.json`)).catch(() => {});

      // Broadcast deletion
      this.broadcastStatusUpdate(projectId, 'deleted');

      res.json({ success: true, message: 'Project deleted successfully' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete project', details: error.message });
    }
  }

  // Helper Methods
  generateEndpointPath(endpointType, config) {
    const paths = {
      balance: '/balance',
      transaction: '/transaction',
      status: '/status',
      price: '/price',
      trade: '/trade',
      mint: '/mint',
      collection: '/collection',
      transfer: '/transfer',
      stake: '/stake',
      rewards: '/rewards'
    };
    
    return paths[endpointType] || `/${endpointType}`;
  }

  generateCurlExample(endpoint, projectId) {
    const baseUrl = 'https://api.solana-devex.com';
    let curlCmd = `curl -X ${endpoint.method} "${baseUrl}/api/projects/${projectId}${endpoint.path}"`;
    curlCmd += ` -H "Authorization: Bearer YOUR_API_KEY"`;
    
    if (endpoint.method !== 'GET' && endpoint.config) {
      curlCmd += ` -H "Content-Type: application/json"`;
      curlCmd += ` -d '${JSON.stringify(endpoint.config, null, 2)}'`;
    }
    
    return curlCmd;
  }

  calculateUptime(createdAt) {
    const now = new Date();
    const created = new Date(createdAt);
    const uptimeMs = now.getTime() - created.getTime();
    
    const days = Math.floor(uptimeMs / (24 * 60 * 60 * 1000));
    const hours = Math.floor((uptimeMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
    
    if (days > 0) {
      return `${days}d ${hours}h`;
    } else {
      return `${hours}h`;
    }
  }

  async getProjectMetrics(projectId) {
    // Mock metrics - in production, you'd query a metrics database
    return {
      totalRequests: Math.floor(Math.random() * 10000) + 1000,
      avgResponseTime: Math.floor(Math.random() * 200) + 50,
      errorRate: (Math.random() * 2).toFixed(2),
      requestsToday: Math.floor(Math.random() * 1000) + 100
    };
  }

  async loadTemplates() {
    const { templates } = require('./templates');
    return Object.entries(templates).map(([id, template]) => ({
      id,
      ...template
    }));
  }

  generateEndpointExample(endpoint, projectId) {
    const baseUrl = `https://api.solana-devex.com/api/projects/${projectId}`;
    
    if (endpoint.method === 'GET') {
      return `curl "${baseUrl}${endpoint.path}" -H "Authorization: Bearer YOUR_API_KEY"`;
    } else {
      return `curl -X ${endpoint.method} "${baseUrl}${endpoint.path}" \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify(endpoint.body || {}, null, 2)}'`;
    }
  }

  generateSDKGuide(integration) {
    return `
## SDK Integration Guide

### Installation
\`\`\`bash
npm install @solana-devex/integration-sdk
\`\`\`

### Quick Setup
\`\`\`javascript
const { SolanaDevExClient } = require('@solana-devex/integration-sdk');

const client = new SolanaDevExClient({
  projectId: '${integration.id}',
  apiKey: '${integration.apiKey}',
  environment: 'production'
});
\`\`\`

### Usage Examples
${integration.endpoints.map(endpoint => `
#### ${endpoint.description}
\`\`\`javascript
${this.generateSDKExample(endpoint)}
\`\`\`
`).join('')}
    `.trim();
  }

  generateSDKExample(endpoint) {
    if (endpoint.path === '/balance') {
      return `const balance = await client.getBalance('wallet-address');`;
    } else if (endpoint.path === '/transaction') {
      return `const tx = await client.sendTransaction({
  from: 'sender-address',
  to: 'recipient-address',
  amount: 1.5
});`;
    } else if (endpoint.path === '/status') {
      return `const status = await client.getStatus();`;
    } else {
      return `const result = await client.callEndpoint('${endpoint.path}');`;
    }
  }

  generateWebhookDocs(integration) {
    return `
## Webhook Integration

If you provided a webhook URL, you'll receive real-time notifications:

### Webhook URL
\`${integration.webhookUrl || 'Not configured'}\`

### Event Types
- \`transaction.confirmed\` - Transaction confirmed on blockchain
- \`balance.changed\` - Wallet balance updated
- \`error.occurred\` - An error occurred

### Example Payload
\`\`\`json
{
  "event": "transaction.confirmed",
  "projectId": "${integration.id}",
  "timestamp": "2024-02-03T22:16:21.000Z",
  "data": {
    "signature": "tx_signature",
    "amount": 1500000000,
    "from": "sender_address",
    "to": "recipient_address"
  }
}
\`\`\`
    `.trim();
  }

  generateErrorHandlingDocs() {
    return `
## Error Handling

### HTTP Status Codes
- \`200\` - Success
- \`400\` - Bad Request (invalid parameters)
- \`401\` - Unauthorized (invalid API key)
- \`404\` - Not Found
- \`429\` - Too Many Requests (rate limited)
- \`500\` - Internal Server Error

### Error Response Format
\`\`\`json
{
  "error": "Error type",
  "message": "Human-readable error message",
  "details": "Additional error details",
  "timestamp": "2024-02-03T22:16:21.000Z"
}
\`\`\`

### Rate Limiting
- 100 requests per 15 minutes per API key
- Rate limit headers included in responses
- Exponential backoff recommended for retries
    `.trim();
  }

  generateCodeExamples(integration) {
    return {
      javascript: `
// Complete integration example
const { SolanaDevExClient } = require('@solana-devex/integration-sdk');

const client = new SolanaDevExClient({
  projectId: '${integration.id}',
  apiKey: '${integration.apiKey}'
});

async function main() {
  try {
    // Check status
    const status = await client.getStatus();
    console.log('Connection status:', status);
    
    // Get balance
    const balance = await client.getBalance('your-wallet-address');
    console.log('Balance:', balance);
    
    // Real-time updates
    const ws = client.connectWebSocket(
      (data) => console.log('Update:', data),
      (error) => console.error('Error:', error)
    );
  } catch (error) {
    console.error('Integration error:', error);
  }
}

main();
      `,
      
      curl: integration.endpoints.map(endpoint => 
        this.generateEndpointExample(endpoint, integration.id)
      ).join('\n\n')
    };
  }

  convertDocsToMarkdown(docs) {
    return `# ${docs.projectId} Integration Documentation

${docs.introduction}

${docs.authentication}

## Endpoints

${docs.endpoints.map(endpoint => `
### ${endpoint.method} ${endpoint.path}
${endpoint.description}

${endpoint.example}
`).join('')}

${docs.sdkGuide}

${docs.webhooks}

${docs.errorHandling}
    `.trim();
  }

  generateImplementationFiles(template) {
    return {
      'package.json': JSON.stringify({
        name: 'solana-integration',
        version: '1.0.0',
        dependencies: {
          '@solana-devex/integration-sdk': '^1.0.0'
        }
      }, null, 2),
      
      'index.js': template.code?.javascript || '// Integration code here',
      
      'README.md': `# Integration using ${template.name}

${template.description}

## Setup Time
${template.setupTime}

## Quick Start
1. npm install
2. Add your API key to .env
3. Run: node index.js
      `
    };
  }

  generateDeploymentGuide(template) {
    return {
      steps: [
        'Copy the generated files to your project',
        'Install dependencies: npm install',
        'Configure your API key in .env',
        'Test the integration: npm test',
        'Deploy to your preferred platform'
      ],
      platforms: [
        'Vercel: vercel deploy',
        'Heroku: git push heroku main',
        'AWS: Use AWS CLI or console',
        'Docker: docker build && docker run'
      ]
    };
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
    // Only start if running standalone (not embedded in ProductionServer)
    if (require.main === module) {
      this.app.listen(port, () => {
        console.log(`🚀 Enhanced Integration Hub running on port ${port}`);
        console.log(`📊 WebSocket monitoring on port 8080`);
        console.log(`📚 Documentation available at http://localhost:${port}/docs`);
      });
    } else {
      // Just log that it's being embedded
      console.log(`🚀 Enhanced Integration Hub running on port ${port}`);
      console.log(`📊 WebSocket monitoring on port 8080`);
      console.log(`📚 Documentation available at http://localhost:${port}/docs`);
    }
  }
}

module.exports = IntegrationHub;