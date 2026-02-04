/**
 * Standalone Webhook Handler
 * Drop this into any project to immediately connect with the CI/CD system
 * Usage: node standalone-webhook.js [port] [cicd-server-url]
 */

const express = require('express');
const crypto = require('crypto');
const axios = require('axios');

class StandaloneWebhook {
  constructor(options = {}) {
    this.port = options.port || process.env.PORT || 3002;
    this.cicdServerUrl = options.cicdServerUrl || process.env.CICD_SERVER_URL || 'http://localhost:3001';
    this.webhookSecret = options.webhookSecret || process.env.WEBHOOK_SECRET;
    this.projectName = options.projectName || process.env.PROJECT_NAME || 'unknown-project';
    
    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
  }

  setupMiddleware() {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.raw({ type: 'application/json', limit: '10mb' }));
    
    // CORS
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Hub-Signature-256, X-GitHub-Event');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });
  }

  setupRoutes() {
    // GitHub webhook endpoint
    this.app.post('/webhook/github', this.handleGitHubWebhook.bind(this));
    
    // Generic webhook endpoint
    this.app.post('/webhook/generic', this.handleGenericWebhook.bind(this));
    
    // Health check
    this.app.get('/health', (req, res) => {
      res.json({
        status: 'healthy',
        project: this.projectName,
        cicdServer: this.cicdServerUrl,
        timestamp: new Date().toISOString()
      });
    });

    // Status endpoint
    this.app.get('/status', async (req, res) => {
      try {
        // Check if CI/CD server is reachable
        const response = await axios.get(`${this.cicdServerUrl}/api/health`, { timeout: 5000 });
        res.json({
          webhook: 'healthy',
          project: this.projectName,
          cicdServer: 'connected',
          cicdStatus: response.data,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(503).json({
          webhook: 'healthy',
          project: this.projectName,
          cicdServer: 'disconnected',
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    });

    // Configuration endpoint
    this.app.get('/config', (req, res) => {
      res.json({
        projectName: this.projectName,
        cicdServerUrl: this.cicdServerUrl,
        hasWebhookSecret: !!this.webhookSecret,
        endpoints: {
          github: '/webhook/github',
          generic: '/webhook/generic',
          health: '/health',
          status: '/status'
        }
      });
    });
  }

  async handleGitHubWebhook(req, res) {
    try {
      const signature = req.get('X-Hub-Signature-256');
      const event = req.get('X-GitHub-Event');
      const payload = req.body;

      console.log(`[${new Date().toISOString()}] GitHub webhook: ${event}`);

      // Verify signature if secret is configured
      if (this.webhookSecret && signature) {
        const expectedSignature = 'sha256=' + crypto
          .createHmac('sha256', this.webhookSecret)
          .update(payload)
          .digest('hex');

        if (signature !== expectedSignature) {
          console.error('Invalid webhook signature');
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }

      const data = JSON.parse(payload);

      // Add project identification
      const enrichedData = {
        ...data,
        _webhook_meta: {
          project: this.projectName,
          timestamp: new Date().toISOString(),
          source: 'standalone-webhook'
        }
      };

      // Forward to CI/CD system
      await this.forwardToCI CD(event, enrichedData);

      // Send immediate response
      res.status(200).json({ 
        received: true, 
        event,
        project: this.projectName,
        forwarded: true 
      });

      // Log the event
      this.logWebhookEvent(event, data);

    } catch (error) {
      console.error('GitHub webhook error:', error);
      res.status(500).json({ 
        error: error.message,
        project: this.projectName 
      });
    }
  }

  async handleGenericWebhook(req, res) {
    try {
      const payload = req.body;
      const eventType = req.get('X-Event-Type') || 'generic';

      console.log(`[${new Date().toISOString()}] Generic webhook: ${eventType}`);

      const enrichedData = {
        ...payload,
        _webhook_meta: {
          project: this.projectName,
          timestamp: new Date().toISOString(),
          source: 'standalone-webhook',
          eventType
        }
      };

      // Forward to CI/CD system
      await this.forwardToCICD(eventType, enrichedData);

      res.status(200).json({ 
        received: true, 
        event: eventType,
        project: this.projectName,
        forwarded: true 
      });

    } catch (error) {
      console.error('Generic webhook error:', error);
      res.status(500).json({ 
        error: error.message,
        project: this.projectName 
      });
    }
  }

  async forwardToCICD(eventType, data) {
    try {
      const response = await axios.post(`${this.cicdServerUrl}/api/webhooks/github`, 
        JSON.stringify(data),
        {
          headers: {
            'Content-Type': 'application/json',
            'X-GitHub-Event': eventType,
            'X-Forwarded-From': this.projectName
          },
          timeout: 10000
        }
      );

      console.log(`[SUCCESS] Forwarded ${eventType} to CI/CD system`);
      return response.data;

    } catch (error) {
      console.error(`❌ Failed to forward ${eventType} to CI/CD system:`, error.message);
      
      // Don't throw - we don't want to fail the webhook just because forwarding failed
      // The source system (GitHub) doesn't care about our internal forwarding
      return null;
    }
  }

  logWebhookEvent(event, data) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      event,
      project: this.projectName,
      repository: data.repository?.full_name,
      ref: data.ref,
      action: data.action,
      sender: data.sender?.login
    };

    console.log(`[LOG] Webhook log:`, JSON.stringify(logEntry, null, 2));

    // Could also write to a file or send to a logging service
    // fs.appendFileSync('webhook.log', JSON.stringify(logEntry) + '\n');
  }

  start() {
    this.app.listen(this.port, () => {
      console.log(`\n[INIT] Standalone Webhook Handler started!`);
      console.log(`[NETWORK] Project: ${this.projectName}`);
      console.log(`[GLOBAL] Port: ${this.port}`);
      console.log(`[LINK] CI/CD Server: ${this.cicdServerUrl}`);
      console.log(`[LOCK] Webhook Secret: ${this.webhookSecret ? 'Configured' : 'Not configured'}`);
      console.log('\n[CLIPBOARD] Endpoints:');
      console.log(`   GitHub: http://localhost:${this.port}/webhook/github`);
      console.log(`   Generic: http://localhost:${this.port}/webhook/generic`);
      console.log(`   Health: http://localhost:${this.port}/health`);
      console.log(`   Status: http://localhost:${this.port}/status`);
      console.log(`   Config: http://localhost:${this.port}/config`);
      console.log('\n[FAST] Ready to receive webhooks!');
      console.log('');
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log('\n[STOP] Shutting down webhook handler...');
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      console.log('\n[STOP] Shutting down webhook handler...');
      process.exit(0);
    });

    // Error handling
    process.on('uncaughtException', (error) => {
      console.error('💥 Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });
  }

  /**
   * Quick deployment helper
   * Creates all necessary files for immediate deployment
   */
  static createDeploymentFiles(projectPath = '.') {
    const fs = require('fs');
    const path = require('path');

    // package.json for the webhook
    const packageJson = {
      "name": "standalone-webhook",
      "version": "1.0.0",
      "description": "Standalone webhook handler for CI/CD integration",
      "main": "standalone-webhook.js",
      "scripts": {
        "start": "node standalone-webhook.js",
        "dev": "nodemon standalone-webhook.js",
        "test": "curl http://localhost:3002/health"
      },
      "dependencies": {
        "express": "^4.18.2",
        "axios": "^1.13.4"
      },
      "devDependencies": {
        "nodemon": "^3.0.1"
      }
    };

    // Environment template
    const envTemplate = `# Webhook Configuration
PROJECT_NAME=my-project
PORT=3002
CICD_SERVER_URL=http://localhost:3001
WEBHOOK_SECRET=your-webhook-secret-here

# Optional: If using with specific platforms
VERCEL_TOKEN=
RAILWAY_TOKEN=
HEROKU_TOKEN=
`;

    // Docker file
    const dockerfile = `FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .

EXPOSE 3002

CMD ["npm", "start"]
`;

    // Docker compose for easy deployment
    const dockerCompose = `version: '3.8'
services:
  webhook:
    build: .
    ports:
      - "3002:3002"
    environment:
      - PROJECT_NAME=\${PROJECT_NAME:-my-project}
      - CICD_SERVER_URL=\${CICD_SERVER_URL:-http://localhost:3001}
      - WEBHOOK_SECRET=\${WEBHOOK_SECRET}
    env_file:
      - .env
    restart: unless-stopped
`;

    // Railway deployment config
    const railwayToml = `[build]
builder = "NIXPACKS"

[deploy]
startCommand = "npm start"

[[services]]
name = "webhook"
`;

    // Vercel deployment config
    const vercelJson = {
      "version": 2,
      "builds": [
        {
          "src": "standalone-webhook.js",
          "use": "@vercel/node"
        }
      ],
      "routes": [
        {
          "src": "/(.*)",
          "dest": "standalone-webhook.js"
        }
      ]
    };

    // Create files
    const files = [
      ['package.json', JSON.stringify(packageJson, null, 2)],
      ['.env.example', envTemplate],
      ['Dockerfile', dockerfile],
      ['docker-compose.yml', dockerCompose],
      ['railway.toml', railwayToml],
      ['vercel.json', JSON.stringify(vercelJson, null, 2)]
    ];

    files.forEach(([filename, content]) => {
      const filePath = path.join(projectPath, filename);
      fs.writeFileSync(filePath, content);
      console.log(`[SUCCESS] Created ${filename}`);
    });

    // Create README
    const readme = `# Standalone Webhook Handler

Drop-in webhook handler for CI/CD integration.

## Quick Start

1. **Install dependencies:**
   \`\`\`bash
   npm install
   \`\`\`

2. **Configure environment:**
   \`\`\`bash
   cp .env.example .env
   # Edit .env with your settings
   \`\`\`

3. **Start the webhook:**
   \`\`\`bash
   npm start
   \`\`\`

## Deployment Options

### Local Development
\`\`\`bash
npm run dev
\`\`\`

### Docker
\`\`\`bash
docker-compose up -d
\`\`\`

### Railway
\`\`\`bash
railway up
\`\`\`

### Vercel
\`\`\`bash
vercel
\`\`\`

## Configuration

Set these environment variables:

- \`PROJECT_NAME\`: Your project identifier
- \`CICD_SERVER_URL\`: CI/CD system URL
- \`WEBHOOK_SECRET\`: GitHub webhook secret (optional)

## GitHub Setup

1. Go to repository Settings → Webhooks
2. Add webhook with URL: \`https://your-domain.com/webhook/github\`
3. Set content type to \`application/json\`
4. Add your webhook secret
5. Select events to send

## Endpoints

- \`POST /webhook/github\` - GitHub webhooks
- \`POST /webhook/generic\` - Generic webhooks  
- \`GET /health\` - Health check
- \`GET /status\` - Connection status
- \`GET /config\` - Configuration info

Ready to use with Makora, SOLPRISM, or any project!
`;

    fs.writeFileSync(path.join(projectPath, 'README.md'), readme);
    console.log(`[SUCCESS] Created README.md`);

    console.log(`\n[SUCCESS] Deployment files created in ${projectPath}`);
    console.log('[CLIPBOARD] Next steps:');
    console.log('1. Run: npm install');
    console.log('2. Copy: cp .env.example .env');
    console.log('3. Edit: .env with your settings');
    console.log('4. Start: npm start');
  }
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.includes('--create-deployment')) {
    StandaloneWebhook.createDeploymentFiles();
    process.exit(0);
  }

  const port = args[0] || process.env.PORT || 3002;
  const cicdServerUrl = args[1] || process.env.CICD_SERVER_URL || 'http://localhost:3001';
  const projectName = process.env.PROJECT_NAME || 'standalone-project';
  
  const webhook = new StandaloneWebhook({
    port: parseInt(port),
    cicdServerUrl,
    projectName
  });
  
  webhook.start();
}

module.exports = StandaloneWebhook;