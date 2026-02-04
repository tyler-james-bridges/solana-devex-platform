#!/usr/bin/env node

/**
 * CI/CD System Startup Script
 * Configures and starts the real CI/CD integration system
 */

const fs = require('fs').promises;
const path = require('path');
const { spawn, exec } = require('child_process');
const { promisify } = require('util');
const readline = require('readline');

const execAsync = promisify(exec);

class CICDSystemStarter {
  constructor() {
    this.configPath = path.join(__dirname, '..', '.env.cicd');
    this.config = {};
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
  }

  async start() {
    console.log('🚀 Starting Real CI/CD Integration System Setup...\n');
    
    try {
      // Check if configuration already exists
      const configExists = await this.checkExistingConfig();
      
      if (!configExists) {
        console.log('📝 Setting up CI/CD configuration...\n');
        await this.collectConfiguration();
        await this.saveConfiguration();
      } else {
        console.log('📄 Loading existing configuration...\n');
        await this.loadConfiguration();
      }
      
      // Install dependencies
      await this.installDependencies();
      
      // Start the CI/CD integration server
      await this.startCICDServer();
      
      // Display usage information
      this.displayUsageInfo();
      
    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      process.exit(1);
    }
  }

  async checkExistingConfig() {
    try {
      await fs.access(this.configPath);
      return true;
    } catch {
      return false;
    }
  }

  async loadConfiguration() {
    try {
      const configContent = await fs.readFile(this.configPath, 'utf8');
      const lines = configContent.split('\n');
      
      for (const line of lines) {
        if (line.trim() && !line.startsWith('#')) {
          const [key, value] = line.split('=');
          if (key && value) {
            this.config[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
          }
        }
      }
      
      console.log('✅ Configuration loaded successfully');
    } catch (error) {
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
  }

  async collectConfiguration() {
    console.log('This setup will configure your CI/CD system with real API integrations.');
    console.log('You can leave fields blank to configure them later.\n');

    // GitHub Configuration
    console.log('🔧 GitHub Integration:');
    this.config.GITHUB_TOKEN = await this.promptInput(
      'GitHub Personal Access Token (repo, admin:repo_hook permissions): ',
      'Optional - needed for webhook management and status updates'
    );
    
    this.config.GITHUB_WEBHOOK_SECRET = await this.promptInput(
      'GitHub Webhook Secret (recommended): ',
      'Optional - secures webhook payloads'
    ) || this.generateWebhookSecret();

    // Deployment Platform APIs
    console.log('\n🚀 Deployment Platform APIs:');
    this.config.VERCEL_TOKEN = await this.promptInput(
      'Vercel API Token: ',
      'Optional - for Vercel deployment monitoring'
    );
    
    this.config.RAILWAY_TOKEN = await this.promptInput(
      'Railway API Token: ',
      'Optional - for Railway deployment monitoring'
    );
    
    this.config.HEROKU_TOKEN = await this.promptInput(
      'Heroku API Token: ',
      'Optional - for Heroku deployment monitoring'
    );

    // Server Configuration
    console.log('\n🌐 Server Configuration:');
    this.config.CICD_PORT = await this.promptInput('CI/CD Server Port (default 3001): ', '') || '3001';
    
    this.config.PUBLIC_URL = await this.promptInput(
      'Public URL (for webhooks): ',
      'e.g., https://yourdomain.com or use ngrok for local dev'
    );
    
    this.config.DASHBOARD_URL = await this.promptInput(
      'Dashboard URL (for status links): ',
      'Where your dashboard will be hosted'
    ) || this.config.PUBLIC_URL;

    // Notification Configuration
    console.log('\n📢 Notifications (Optional):');
    this.config.DISCORD_WEBHOOK_URL = await this.promptInput(
      'Discord Webhook URL: ',
      'Optional - for build/deployment notifications'
    );
    
    this.config.SLACK_WEBHOOK_URL = await this.promptInput(
      'Slack Webhook URL: ',
      'Optional - for build/deployment notifications'
    );
  }

  async promptInput(question, helpText = '') {
    if (helpText) {
      console.log(`  ${helpText}`);
    }
    
    return new Promise((resolve) => {
      this.rl.question(`  ${question}`, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  generateWebhookSecret() {
    return require('crypto').randomBytes(32).toString('hex');
  }

  async saveConfiguration() {
    const configContent = `# CI/CD Integration Configuration
# Generated on ${new Date().toISOString()}

# GitHub Integration
GITHUB_TOKEN=${this.config.GITHUB_TOKEN}
GITHUB_WEBHOOK_SECRET=${this.config.GITHUB_WEBHOOK_SECRET}

# Deployment Platform APIs
VERCEL_TOKEN=${this.config.VERCEL_TOKEN}
RAILWAY_TOKEN=${this.config.RAILWAY_TOKEN}
HEROKU_TOKEN=${this.config.HEROKU_TOKEN}

# Server Configuration
CICD_PORT=${this.config.CICD_PORT}
PUBLIC_URL=${this.config.PUBLIC_URL}
DASHBOARD_URL=${this.config.DASHBOARD_URL}

# Notifications
DISCORD_WEBHOOK_URL=${this.config.DISCORD_WEBHOOK_URL}
SLACK_WEBHOOK_URL=${this.config.SLACK_WEBHOOK_URL}

# Auto-generated
NODE_ENV=production
`;

    await fs.writeFile(this.configPath, configContent);
    console.log(`✅ Configuration saved to ${this.configPath}`);
  }

  async installDependencies() {
    console.log('\n📦 Installing CI/CD dependencies...');
    
    const requiredPackages = [
      '@octokit/rest',
      'express',
      'ws',
      'axios',
      'crypto'
    ];

    const apiDir = path.join(__dirname, '..', 'api');
    const packageJsonPath = path.join(apiDir, 'package.json');
    
    try {
      // Read existing package.json
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
      
      // Add missing dependencies
      let needsInstall = false;
      for (const pkg of requiredPackages) {
        if (!packageJson.dependencies[pkg] && !packageJson.devDependencies[pkg]) {
          console.log(`  Adding ${pkg}...`);
          packageJson.dependencies[pkg] = 'latest';
          needsInstall = true;
        }
      }
      
      if (needsInstall) {
        await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
        console.log('  Running npm install...');
        await execAsync('npm install', { cwd: apiDir });
      }
      
      console.log('✅ Dependencies installed');
    } catch (error) {
      console.warn('⚠️  Could not auto-install dependencies:', error.message);
      console.log('Please run manually: cd api && npm install');
    }
  }

  async startCICDServer() {
    console.log('\n🚀 Starting CI/CD Integration Server...');
    
    const serverScript = `
const RealCICDIntegration = require('./real-cicd-integration');
const dotenv = require('dotenv');
const path = require('path');

// Load CI/CD configuration
dotenv.config({ path: path.join(__dirname, '..', '.env.cicd') });

console.log('🔧 CI/CD Integration Server Starting...');
console.log('📊 Dashboard will be available at:', process.env.DASHBOARD_URL || 'http://localhost:3000');
console.log('🔗 Webhook endpoint:', process.env.PUBLIC_URL + '/api/webhooks/github');
console.log('');

const cicd = new RealCICDIntegration();

process.on('SIGINT', () => {
  console.log('\\n🛑 Shutting down CI/CD Integration Server...');
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  console.error('💥 Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('💥 Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
`;

    const serverPath = path.join(__dirname, '..', 'api', 'start-cicd-server.js');
    await fs.writeFile(serverPath, serverScript);
    
    // Set environment variables for the current process
    Object.entries(this.config).forEach(([key, value]) => {
      if (value) {
        process.env[key] = value;
      }
    });
    
    console.log('✅ Server script created');
    console.log(`📂 Starting server from: ${serverPath}`);
    
    // Start the server
    const serverProcess = spawn('node', [serverPath], {
      cwd: path.join(__dirname, '..', 'api'),
      stdio: 'inherit',
      env: { ...process.env, ...this.config }
    });
    
    serverProcess.on('error', (error) => {
      console.error('❌ Failed to start CI/CD server:', error.message);
    });
    
    // Give server time to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('✅ CI/CD Integration Server is running!');
  }

  displayUsageInfo() {
    console.log('\n🎉 CI/CD Integration System is ready!');
    console.log('\n📋 Next Steps:');
    console.log('');
    
    if (this.config.GITHUB_TOKEN) {
      console.log('1️⃣  Register a repository:');
      console.log(`   curl -X POST http://localhost:${this.config.CICD_PORT}/api/repositories/register \\`);
      console.log('     -H "Content-Type: application/json" \\');
      console.log('     -d \'{"owner":"your-username","repo":"your-repo"}\'');
      console.log('');
    }
    
    console.log('2️⃣  Access the dashboard:');
    console.log(`   ${this.config.DASHBOARD_URL || 'http://localhost:3000'}`);
    console.log('');
    
    if (this.config.PUBLIC_URL) {
      console.log('3️⃣  Webhook endpoint for GitHub:');
      console.log(`   ${this.config.PUBLIC_URL}/api/webhooks/github`);
      console.log('');
    }
    
    console.log('4️⃣  API endpoints available:');
    console.log(`   • GET  http://localhost:${this.config.CICD_PORT}/api/health`);
    console.log(`   • GET  http://localhost:${this.config.CICD_PORT}/api/dashboard`);
    console.log(`   • GET  http://localhost:${this.config.CICD_PORT}/api/builds`);
    console.log(`   • GET  http://localhost:${this.config.CICD_PORT}/api/deployments`);
    console.log(`   • GET  http://localhost:${this.config.CICD_PORT}/api/metrics/overview`);
    console.log('');
    
    console.log('5️⃣  WebSocket connection:');
    console.log(`   ws://localhost:${this.config.CICD_PORT}/ws/cicd`);
    console.log('');
    
    console.log('📚 For integration with Makora and SOLPRISM:');
    console.log('   1. Add webhook URL to your GitHub repository settings');
    console.log('   2. Configure deployment tokens in .env.cicd');
    console.log('   3. Use the API endpoints to trigger builds and monitor status');
    console.log('');
    
    console.log('🔧 Configuration file: .env.cicd');
    console.log('📝 Edit this file to update API tokens and settings');
    console.log('');
    
    console.log('🆘 Support:');
    console.log('   • Health check: curl http://localhost:' + this.config.CICD_PORT + '/api/health');
    console.log('   • Logs: Check the server console for real-time information');
    console.log('   • Issues: The system logs detailed information about webhook events');
    
    this.rl.close();
  }
}

// Run the setup
if (require.main === module) {
  const starter = new CICDSystemStarter();
  starter.start().catch(console.error);
}

module.exports = CICDSystemStarter;