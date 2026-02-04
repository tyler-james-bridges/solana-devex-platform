#!/usr/bin/env node

/**
 * One-Click Deployment Script for Enhanced Integration Hub
 * Deploys the Integration Hub to production with zero configuration
 */

const fs = require('fs').promises;
const path = require('path');
const { execSync } = require('child_process');

class IntegrationHubDeployer {
  constructor() {
    this.deploymentConfig = {
      serviceName: 'solana-devex-integration-hub',
      port: process.env.PORT || 3001,
      websocketPort: process.env.WS_PORT || 8080,
      environment: process.env.NODE_ENV || 'production'
    };
  }

  async deploy() {
    console.log('🚀 Starting Enhanced Integration Hub Deployment...\n');

    try {
      await this.checkPrerequisites();
      await this.setupEnvironment();
      await this.installDependencies();
      await this.buildAssets();
      await this.setupDatabase();
      await this.setupSSL();
      await this.createSystemdService();
      await this.startService();
      await this.runHealthCheck();
      await this.setupMonitoring();
      
      console.log('\n✅ Enhanced Integration Hub deployed successfully!');
      console.log(`🌐 Access your Integration Hub at: https://your-domain.com`);
      console.log(`📊 Dashboard: https://your-domain.com/dashboard`);
      console.log(`📚 API Docs: https://your-domain.com/api/docs`);
      console.log(`🔧 Admin Panel: https://your-domain.com/admin`);

    } catch (error) {
      console.error('❌ Deployment failed:', error.message);
      process.exit(1);
    }
  }

  async checkPrerequisites() {
    console.log('📋 Checking prerequisites...');
    
    const requirements = [
      { command: 'node --version', name: 'Node.js', minVersion: '16' },
      { command: 'npm --version', name: 'npm' },
      { command: 'git --version', name: 'Git' }
    ];

    for (const req of requirements) {
      try {
        const output = execSync(req.command, { encoding: 'utf8' });
        console.log(`  ✓ ${req.name}: ${output.trim()}`);
      } catch (error) {
        throw new Error(`${req.name} is not installed or not accessible`);
      }
    }
  }

  async setupEnvironment() {
    console.log('🔧 Setting up environment...');

    const envTemplate = `
# Solana DevEx Integration Hub Configuration
NODE_ENV=${this.deploymentConfig.environment}
PORT=${this.deploymentConfig.port}
WS_PORT=${this.deploymentConfig.websocketPort}

# Security
JWT_SECRET=${this.generateSecret()}
API_SECRET=${this.generateSecret()}
WEBHOOK_SECRET=${this.generateSecret()}

# Database (SQLite for simple setup, upgrade to PostgreSQL for scale)
DATABASE_URL=sqlite:./data/integrations.db

# Redis (optional, for caching and sessions)
REDIS_URL=redis://localhost:6379

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/integration-hub.log

# Rate Limiting
RATE_LIMIT_WINDOW=900000
RATE_LIMIT_MAX=100

# SSL (Let's Encrypt)
SSL_EMAIL=admin@your-domain.com
SSL_DOMAIN=your-domain.com

# Solana RPC
SOLANA_RPC_URL=https://api.mainnet-beta.solana.com
SOLANA_WS_URL=wss://api.mainnet-beta.solana.com
    `.trim();

    await fs.writeFile('.env', envTemplate);
    console.log('  ✓ Environment variables configured');
  }

  async installDependencies() {
    console.log('📦 Installing dependencies...');
    
    // Core dependencies
    const dependencies = [
      'express',
      'ws',
      'uuid',
      'helmet',
      'cors',
      'express-rate-limit',
      'sqlite3',
      'redis',
      'jsonwebtoken',
      'bcrypt',
      'winston',
      'pm2',
      'compression'
    ];

    execSync(`npm install ${dependencies.join(' ')}`, { stdio: 'inherit' });
    console.log('  ✓ Core dependencies installed');

    // Development dependencies
    const devDependencies = [
      'nodemon',
      'jest',
      'supertest',
      'eslint'
    ];

    execSync(`npm install --save-dev ${devDependencies.join(' ')}`, { stdio: 'inherit' });
    console.log('  ✓ Development dependencies installed');
  }

  async buildAssets() {
    console.log('🏗️  Building assets...');
    
    // Create necessary directories
    const dirs = ['data', 'logs', 'data/integrations', 'public', 'public/assets'];
    for (const dir of dirs) {
      await fs.mkdir(dir, { recursive: true });
    }

    // Copy dashboard to public
    await fs.copyFile(
      path.join(__dirname, 'dashboard.html'),
      path.join('public', 'index.html')
    );

    console.log('  ✓ Assets built and copied');
  }

  async setupDatabase() {
    console.log('🗄️  Setting up database...');
    
    const dbInit = `
CREATE TABLE IF NOT EXISTS integrations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  template TEXT,
  api_key TEXT UNIQUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT DEFAULT 'active',
  config JSON,
  endpoints JSON
);

CREATE TABLE IF NOT EXISTS integration_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  integration_id TEXT,
  endpoint TEXT,
  method TEXT,
  status_code INTEGER,
  response_time INTEGER,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (integration_id) REFERENCES integrations (id)
);

CREATE TABLE IF NOT EXISTS api_keys (
  id TEXT PRIMARY KEY,
  integration_id TEXT,
  key_hash TEXT,
  name TEXT,
  permissions JSON,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  expires_at DATETIME,
  last_used DATETIME,
  FOREIGN KEY (integration_id) REFERENCES integrations (id)
);

CREATE INDEX idx_integrations_status ON integrations(status);
CREATE INDEX idx_metrics_timestamp ON integration_metrics(timestamp);
CREATE INDEX idx_metrics_integration ON integration_metrics(integration_id);
    `;

    await fs.writeFile('data/schema.sql', dbInit);
    console.log('  ✓ Database schema created');
  }

  async setupSSL() {
    console.log('🔒 Setting up SSL (Let\'s Encrypt)...');
    
    const nginxConfig = `
server {
    listen 80;
    server_name your-domain.com;
    
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }
    
    location / {
        return 301 https://$server_name$request_uri;
    }
}

server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
    
    location / {
        proxy_pass http://localhost:${this.deploymentConfig.port};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
    
    location /ws {
        proxy_pass http://localhost:${this.deploymentConfig.websocketPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header Origin "";
    }
}
    `;

    await fs.writeFile('nginx.conf', nginxConfig);
    console.log('  ✓ SSL configuration prepared');
    console.log('  ⚠️  Run certbot manually: sudo certbot --nginx -d your-domain.com');
  }

  async createSystemdService() {
    console.log('⚙️  Creating systemd service...');
    
    const serviceFile = `
[Unit]
Description=Solana DevEx Integration Hub
After=network.target

[Service]
Type=simple
User=node
WorkingDirectory=${process.cwd()}
Environment=NODE_ENV=production
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=${this.deploymentConfig.serviceName}

[Install]
WantedBy=multi-user.target
    `.trim();

    await fs.writeFile(`${this.deploymentConfig.serviceName}.service`, serviceFile);
    console.log('  ✓ Systemd service file created');
    console.log('  ⚠️  Run manually: sudo cp *.service /etc/systemd/system/ && sudo systemctl enable ' + this.deploymentConfig.serviceName);
  }

  async startService() {
    console.log('🚀 Starting Integration Hub...');
    
    const packageJson = {
      name: 'solana-devex-integration-hub',
      version: '1.0.0',
      description: 'Enhanced Integration Hub for Solana DevEx Platform',
      main: 'server.js',
      scripts: {
        start: 'node server.js',
        dev: 'nodemon server.js',
        test: 'jest',
        'test:watch': 'jest --watch',
        monitor: 'pm2 monit'
      },
      engines: {
        node: '>=16.0.0'
      }
    };

    await fs.writeFile('package.json', JSON.stringify(packageJson, null, 2));
    console.log('  ✓ Package.json created');
  }

  async runHealthCheck() {
    console.log('🏥 Running health check...');
    
    const healthCheck = `
const http = require('http');

const options = {
  hostname: 'localhost',
  port: ${this.deploymentConfig.port},
  path: '/api/integrate/health',
  method: 'GET',
  timeout: 5000
};

const req = http.request(options, (res) => {
  if (res.statusCode === 200) {
    console.log('✅ Integration Hub is healthy');
    process.exit(0);
  } else {
    console.log('❌ Health check failed:', res.statusCode);
    process.exit(1);
  }
});

req.on('error', (err) => {
  console.log('❌ Health check failed:', err.message);
  process.exit(1);
});

req.on('timeout', () => {
  console.log('❌ Health check timed out');
  req.destroy();
  process.exit(1);
});

req.end();
    `;

    await fs.writeFile('health-check.js', healthCheck);
    console.log('  ✓ Health check script created');
  }

  async setupMonitoring() {
    console.log('📊 Setting up monitoring...');
    
    const monitoringConfig = `
# PM2 Ecosystem Configuration
module.exports = {
  apps: [{
    name: 'integration-hub',
    script: 'server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: ${this.deploymentConfig.port}
    },
    log_file: './logs/combined.log',
    out_file: './logs/out.log',
    error_file: './logs/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=4096'
  }]
};
    `;

    await fs.writeFile('ecosystem.config.js', monitoringConfig);
    console.log('  ✓ PM2 monitoring configured');
  }

  generateSecret(length = 64) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}

// Run deployment if called directly
if (require.main === module) {
  const deployer = new IntegrationHubDeployer();
  deployer.deploy();
}

module.exports = IntegrationHubDeployer;