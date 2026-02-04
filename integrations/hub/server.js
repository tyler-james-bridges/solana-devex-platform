#!/usr/bin/env node

/**
 * Enhanced Integration Hub Server
 * Production-ready server for the Solana DevEx Integration Hub
 */

require('dotenv').config();
const IntegrationHub = require('./index.js');
const express = require('express');
const path = require('path');
const fs = require('fs');
const helmet = require('helmet');
const compression = require('compression');
const rateLimit = require('express-rate-limit');

class ProductionServer {
  constructor() {
    this.app = express();
    this.integrationHub = new IntegrationHub();
    this.port = process.env.PORT || 3001;
    this.wsPort = process.env.WS_PORT || 8080;
    
    this.setupSecurity();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
    
    // Graceful shutdown
    process.on('SIGTERM', () => this.shutdown());
    process.on('SIGINT', () => this.shutdown());
  }

  setupSecurity() {
    // Security headers
    this.app.use(helmet({
      contentSecurityPolicy: {
        directives: {
          defaultSrc: ["'self'"],
          scriptSrc: ["'self'", "'unsafe-inline'", "cdn.tailwindcss.com", "unpkg.com"],
          styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "cdn.tailwindcss.com"],
          fontSrc: ["'self'", "fonts.gstatic.com"],
          imgSrc: ["'self'", "data:", "https:"],
          connectSrc: ["'self'", "ws:", "wss:"]
        }
      }
    }));

    // Rate limiting
    const limiter = rateLimit({
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW) || 15 * 60 * 1000, // 15 minutes
      max: parseInt(process.env.RATE_LIMIT_MAX) || 100,
      message: {
        error: 'Too many requests from this IP, please try again later.',
        retryAfter: Math.ceil(900 / 60) // in minutes
      },
      standardHeaders: true,
      legacyHeaders: false,
    });

    this.app.use('/api/', limiter);
  }

  setupMiddleware() {
    // Compression
    this.app.use(compression());

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Logging
    this.app.use((req, res, next) => {
      const start = Date.now();
      res.on('finish', () => {
        const duration = Date.now() - start;
        console.log(`${req.method} ${req.path} ${res.statusCode} - ${duration}ms`);
      });
      next();
    });

    // Static files
    this.app.use(express.static('public'));
  }

  setupRoutes() {
    // Mount Integration Hub routes
    this.app.use(this.integrationHub.app);

    // Dashboard route
    this.app.get('/dashboard/:projectId?', (req, res) => {
      res.sendFile(path.join(__dirname, 'dashboard.html'));
    });

    // API documentation
    this.app.get('/api/docs', this.generateAPIDocs.bind(this));

    // SDK download
    this.app.get('/sdk/download/:format?', this.handleSDKDownload.bind(this));

    // Template preview
    this.app.get('/templates/:templateId/preview', this.handleTemplatePreview.bind(this));

    // Status page
    this.app.get('/status', this.handleStatus.bind(this));

    // Metrics endpoint (for monitoring)
    this.app.get('/metrics', this.handleMetrics.bind(this));
  }

  setupErrorHandling() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `The endpoint ${req.method} ${req.path} does not exist`,
        timestamp: new Date().toISOString()
      });
    });

    // Global error handler
    this.app.use((err, req, res, next) => {
      console.error('Unhandled error:', err);
      
      const isDevelopment = process.env.NODE_ENV === 'development';
      
      res.status(err.status || 500).json({
        error: 'Internal Server Error',
        message: isDevelopment ? err.message : 'Something went wrong',
        ...(isDevelopment && { stack: err.stack }),
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown'
      });
    });
  }

  async generateAPIDocs(req, res) {
    const { templates } = require('./templates');
    
    const docs = {
      title: 'Solana DevEx Integration Hub API',
      version: '1.0.0',
      description: 'Complete API documentation for the Enhanced Integration Hub',
      baseUrl: `${req.protocol}://${req.get('host')}`,
      
      authentication: {
        type: 'Bearer Token',
        header: 'Authorization: Bearer YOUR_API_KEY',
        example: 'Authorization: Bearer sk_live_1234567890abcdef'
      },

      quickStart: {
        steps: [
          'Create integration via POST /api/integrate/quick-setup',
          'Get your API key from the response',
          'Use the API key to authenticate requests',
          'Start making API calls to your project endpoints'
        ],
        estimatedTime: 'Under 5 minutes'
      },

      endpoints: {
        integration: {
          'POST /api/integrate/quick-setup': {
            description: 'Create a new integration in one click',
            body: {
              projectName: 'string (required)',
              template: 'string (optional, default: basic-solana)',
              repoUrl: 'string (optional)',
              webhookUrl: 'string (optional)'
            },
            response: {
              success: true,
              projectId: 'uuid',
              apiKey: 'string',
              dashboardUrl: 'string',
              docsUrl: 'string',
              endpoints: 'array',
              quickStartGuide: 'object',
              estimatedSetupTime: 'string'
            }
          },
          
          'GET /api/integrate/projects': {
            description: 'List all your integrations',
            response: {
              projects: 'array'
            }
          },
          
          'GET /api/integrate/:projectId/status': {
            description: 'Get real-time status of your integration',
            response: {
              status: 'online|offline|warning',
              lastCheck: 'timestamp',
              endpointCount: 'number',
              uptime: 'string',
              recentErrors: 'array'
            }
          }
        },

        endpoints: {
          'GET /api/integrate/:projectId/endpoints': {
            description: 'List all endpoints for a project'
          },
          'POST /api/integrate/:projectId/generate-endpoint': {
            description: 'Generate a new API endpoint',
            body: {
              endpointType: 'string',
              config: 'object'
            }
          }
        },

        documentation: {
          'GET /api/integrate/:projectId/docs': {
            description: 'Get auto-generated documentation for your integration'
          },
          'GET /api/integrate/:projectId/docs/download': {
            description: 'Download documentation as PDF/HTML'
          }
        },

        templates: {
          'GET /api/integrate/templates': {
            description: 'List available integration templates',
            response: {
              templates: Object.keys(templates),
              categories: ['Web3 DApp', 'Trading Bot', 'NFT Platform', 'DeFi Protocol', 'Gaming']
            }
          },
          'GET /api/integrate/templates/:templateId': {
            description: 'Get detailed template information'
          }
        }
      },

      templates: Object.entries(templates).map(([id, template]) => ({
        id,
        name: template.name,
        description: template.description,
        category: template.category,
        setupTime: template.setupTime,
        endpoints: template.endpoints.length
      })),

      sdks: {
        javascript: {
          installation: 'npm install @solana-devex/integration-sdk',
          import: "const { SolanaDevExClient } = require('@solana-devex/integration-sdk');",
          usage: `
const client = new SolanaDevExClient({
  projectId: 'your-project-id',
  apiKey: 'your-api-key'
});

const balance = await client.getBalance('wallet-address');
          `.trim()
        },
        
        python: {
          installation: 'pip install solana-devex-sdk',
          import: 'from solana_devex import Client',
          usage: `
client = Client('your-project-id', 'your-api-key')
balance = client.get_balance('wallet-address')
          `.trim()
        }
      },

      examples: {
        'Basic Integration': {
          description: 'Simple wallet operations',
          code: `
// Get wallet balance
const balance = await client.getBalance('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM');

// Send SOL
const transaction = await client.sendTransaction({
  from: 'sender-address',
  to: 'recipient-address',
  amount: 1.5 // SOL
});
          `.trim()
        },

        'Real-time Updates': {
          description: 'WebSocket connection for live data',
          code: `
const ws = client.connectWebSocket(
  (data) => console.log('Update:', data),
  (error) => console.error('Error:', error)
);
          `.trim()
        }
      },

      statusCodes: {
        200: 'Success',
        201: 'Created',
        400: 'Bad Request - Invalid parameters',
        401: 'Unauthorized - Invalid or missing API key',
        404: 'Not Found - Resource does not exist',
        429: 'Too Many Requests - Rate limit exceeded',
        500: 'Internal Server Error'
      },

      support: {
        documentation: `${req.protocol}://${req.get('host')}/docs`,
        dashboard: `${req.protocol}://${req.get('host')}/dashboard`,
        status: `${req.protocol}://${req.get('host')}/status`,
        email: 'support@solana-devex.com',
        discord: 'https://discord.gg/solana-devex'
      }
    };

    res.json(docs);
  }

  async handleSDKDownload(req, res) {
    const { format } = req.params;
    const sdkPath = path.join(__dirname, 'sdk');

    switch (format) {
      case 'npm':
        // Return package info for npm installation
        res.json({
          package: '@solana-devex/integration-sdk',
          version: '1.0.0',
          install: 'npm install @solana-devex/integration-sdk',
          documentation: 'https://docs.solana-devex.com/sdk'
        });
        break;

      case 'js':
        // Send the SDK file directly
        res.sendFile(path.join(sdkPath, 'index.js'));
        break;

      default:
        res.json({
          availableFormats: ['npm', 'js'],
          defaultInstall: 'npm install @solana-devex/integration-sdk'
        });
    }
  }

  async handleTemplatePreview(req, res) {
    const { templateId } = req.params;
    const { templates } = require('./templates');
    
    const template = templates[templateId];
    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({
      template,
      livePreview: `${req.protocol}://${req.get('host')}/templates/${templateId}/demo`,
      codeExamples: template.code
    });
  }

  async handleStatus(req, res) {
    const status = {
      service: 'Enhanced Integration Hub',
      status: 'operational',
      version: '1.0.0',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      
      components: {
        api: 'operational',
        webSocket: 'operational', 
        database: 'operational',
        monitoring: 'operational'
      },
      
      statistics: {
        totalIntegrations: this.integrationHub.integrations.size,
        activeConnections: this.integrationHub.wsClients.size,
        memoryUsage: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      }
    };

    res.json(status);
  }

  async handleMetrics(req, res) {
    // Prometheus-style metrics for monitoring
    const metrics = `
# HELP integration_hub_total_integrations Total number of integrations
# TYPE integration_hub_total_integrations gauge
integration_hub_total_integrations ${this.integrationHub.integrations.size}

# HELP integration_hub_active_connections Active WebSocket connections
# TYPE integration_hub_active_connections gauge
integration_hub_active_connections ${this.integrationHub.wsClients.size}

# HELP integration_hub_uptime_seconds Server uptime in seconds
# TYPE integration_hub_uptime_seconds counter
integration_hub_uptime_seconds ${process.uptime()}

# HELP integration_hub_memory_usage_bytes Memory usage in bytes
# TYPE integration_hub_memory_usage_bytes gauge
integration_hub_memory_usage_bytes ${process.memoryUsage().rss}
    `.trim();

    res.setHeader('Content-Type', 'text/plain');
    res.send(metrics);
  }

  start() {
    // Start Integration Hub
    this.integrationHub.start(this.port);
    
    console.log(`🚀 Enhanced Integration Hub is running!`);
    console.log(`🌐 API Server: http://localhost:${this.port}`);
    console.log(`📊 WebSocket: ws://localhost:${this.wsPort}`);
    console.log(`📚 API Docs: http://localhost:${this.port}/api/docs`);
    console.log(`🎛️  Dashboard: http://localhost:${this.port}/dashboard`);
    console.log(`📈 Status: http://localhost:${this.port}/status`);
    console.log(`📊 Metrics: http://localhost:${this.port}/metrics`);
    console.log(`\n✨ Ready to accept integrations! Projects can connect in under 5 minutes.`);
  }

  shutdown() {
    console.log('\n🔄 Gracefully shutting down...');
    
    // Close WebSocket connections
    this.integrationHub.wsClients.forEach(ws => {
      ws.close(1000, 'Server shutting down');
    });
    
    // Close server
    process.exit(0);
  }
}

// Start server if called directly
if (require.main === module) {
  const server = new ProductionServer();
  server.start();
}

module.exports = ProductionServer;