/**
 * Project CI/CD Setup Helper
 * Quickly integrate existing projects with the CI/CD system
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const axios = require('axios');

const execAsync = promisify(exec);

class ProjectCICDSetup {
  constructor(projectPath, options = {}) {
    this.projectPath = path.resolve(projectPath);
    this.cicdServerUrl = options.cicdServerUrl || 'http://localhost:3001';
    this.webhookUrl = options.webhookUrl || `${this.cicdServerUrl}/api/webhooks/github`;
    this.dashboardUrl = options.dashboardUrl || 'http://localhost:3000';
  }

  /**
   * Set up CI/CD for an existing project
   */
  async setupProject() {
    console.log(`🔧 Setting up CI/CD for project at: ${this.projectPath}`);
    
    try {
      // Detect project type
      const projectInfo = await this.detectProjectType();
      console.log(`📦 Detected project type: ${projectInfo.type}`);
      
      // Create CI/CD configuration
      await this.createCICDConfig(projectInfo);
      
      // Generate GitHub Actions workflow
      await this.generateGitHubWorkflow(projectInfo);
      
      // Add CI/CD scripts to package.json
      await this.updatePackageScripts(projectInfo);
      
      // Create webhook configuration guide
      await this.createWebhookGuide(projectInfo);
      
      console.log('✅ CI/CD setup completed!');
      this.displayInstructions(projectInfo);
      
    } catch (error) {
      console.error('❌ CI/CD setup failed:', error.message);
      throw error;
    }
  }

  async detectProjectType() {
    const files = await fs.readdir(this.projectPath);
    
    const projectInfo = {
      type: 'unknown',
      hasPackageJson: files.includes('package.json'),
      hasAnchorToml: files.includes('Anchor.toml'),
      hasCargoToml: files.includes('Cargo.toml'),
      hasNextConfig: files.includes('next.config.js') || files.includes('next.config.ts'),
      hasVercelJson: files.includes('vercel.json'),
      hasRailwayToml: files.includes('railway.toml'),
      packages: [],
      workspaces: []
    };

    // Check for package.json to get more info
    if (projectInfo.hasPackageJson) {
      try {
        const packageJson = JSON.parse(
          await fs.readFile(path.join(this.projectPath, 'package.json'), 'utf8')
        );
        projectInfo.name = packageJson.name;
        projectInfo.workspaces = packageJson.workspaces || [];
        
        // Check for multiple packages (like Makora)
        if (projectInfo.workspaces.length > 0) {
          projectInfo.type = 'monorepo';
          projectInfo.packages = await this.discoverPackages();
        }
      } catch (error) {
        console.warn('Could not read package.json:', error.message);
      }
    }

    // Determine specific project type
    if (projectInfo.hasAnchorToml) {
      projectInfo.type = projectInfo.type === 'monorepo' ? 'solana-monorepo' : 'solana';
    } else if (projectInfo.hasNextConfig) {
      projectInfo.type = projectInfo.type === 'monorepo' ? 'nextjs-monorepo' : 'nextjs';
    } else if (projectInfo.hasPackageJson) {
      projectInfo.type = projectInfo.type === 'monorepo' ? 'nodejs-monorepo' : 'nodejs';
    }

    return projectInfo;
  }

  async discoverPackages() {
    const packages = [];
    
    try {
      // Look for packages in common locations
      const commonDirs = ['packages', 'apps', 'libs', 'components'];
      
      for (const dir of commonDirs) {
        const dirPath = path.join(this.projectPath, dir);
        
        try {
          const subDirs = await fs.readdir(dirPath);
          for (const subDir of subDirs) {
            const packagePath = path.join(dirPath, subDir);
            const packageJsonPath = path.join(packagePath, 'package.json');
            
            try {
              await fs.access(packageJsonPath);
              const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
              packages.push({
                name: packageJson.name,
                path: path.relative(this.projectPath, packagePath),
                scripts: packageJson.scripts || {}
              });
            } catch {
              // Not a package
            }
          }
        } catch {
          // Directory doesn't exist
        }
      }
    } catch (error) {
      console.warn('Error discovering packages:', error.message);
    }
    
    return packages;
  }

  async createCICDConfig(projectInfo) {
    const config = {
      project: {
        name: projectInfo.name || path.basename(this.projectPath),
        type: projectInfo.type,
        path: this.projectPath
      },
      cicd: {
        serverUrl: this.cicdServerUrl,
        webhookUrl: this.webhookUrl,
        dashboardUrl: this.dashboardUrl
      },
      build: {
        nodeVersion: '18',
        commands: this.generateBuildCommands(projectInfo),
        testCommands: this.generateTestCommands(projectInfo),
        deployCommands: this.generateDeployCommands(projectInfo)
      },
      environments: ['development', 'staging', 'production'],
      notifications: {
        discord: process.env.DISCORD_WEBHOOK_URL || '',
        slack: process.env.SLACK_WEBHOOK_URL || ''
      }
    };

    const configPath = path.join(this.projectPath, '.cicd-config.json');
    await fs.writeFile(configPath, JSON.stringify(config, null, 2));
    
    console.log(`✅ Created CI/CD config: ${configPath}`);
    return config;
  }

  generateBuildCommands(projectInfo) {
    const commands = [];
    
    if (projectInfo.hasPackageJson) {
      commands.push('npm ci');
      
      if (projectInfo.type.includes('monorepo')) {
        commands.push('npm run build --workspaces');
      } else {
        commands.push('npm run build');
      }
    }
    
    if (projectInfo.hasAnchorToml) {
      commands.push('anchor build');
    }
    
    return commands;
  }

  generateTestCommands(projectInfo) {
    const commands = [];
    
    if (projectInfo.hasPackageJson) {
      if (projectInfo.type.includes('monorepo')) {
        commands.push('npm run test --workspaces');
      } else {
        commands.push('npm test');
      }
    }
    
    if (projectInfo.hasAnchorToml) {
      commands.push('anchor test --skip-local-validator');
    }
    
    return commands;
  }

  generateDeployCommands(projectInfo) {
    const commands = [];
    
    if (projectInfo.hasVercelJson) {
      commands.push('vercel --prod');
    }
    
    if (projectInfo.hasAnchorToml) {
      commands.push('anchor deploy --network mainnet');
    }
    
    return commands;
  }

  async generateGitHubWorkflow(projectInfo) {
    const workflow = this.createWorkflowTemplate(projectInfo);
    
    // Create .github/workflows directory
    const workflowDir = path.join(this.projectPath, '.github', 'workflows');
    await fs.mkdir(workflowDir, { recursive: true });
    
    const workflowPath = path.join(workflowDir, 'cicd.yml');
    await fs.writeFile(workflowPath, workflow);
    
    console.log(`✅ Created GitHub workflow: ${workflowPath}`);
  }

  createWorkflowTemplate(projectInfo) {
    return `name: CI/CD Pipeline

on:
  push:
    branches: [ main, master, develop ]
  pull_request:
    branches: [ main, master ]

env:
  NODE_VERSION: 18
  CICD_WEBHOOK: ${this.webhookUrl}

jobs:
  build-and-test:
    name: Build and Test
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: \${{ env.NODE_VERSION }}
        cache: 'npm'
    
${projectInfo.hasAnchorToml ? `    - name: Setup Rust
      uses: actions-rs/toolchain@v1
      with:
        toolchain: stable
        override: true
    
    - name: Install Anchor
      run: npm install -g @coral-xyz/anchor-cli
` : ''}
    - name: Install dependencies
      run: npm ci
    
    - name: Run linting
      run: npm run lint --if-present
    
    - name: Run type checking
      run: npm run type-check --if-present
    
    - name: Build project
      run: |
${projectInfo.type.includes('monorepo') ? '        npm run build --workspaces' : '        npm run build --if-present'}
${projectInfo.hasAnchorToml ? '        anchor build' : ''}
    
    - name: Run tests
      run: |
${projectInfo.type.includes('monorepo') ? '        npm run test --workspaces' : '        npm test --if-present'}
${projectInfo.hasAnchorToml ? '        anchor test --skip-local-validator --skip-deploy' : ''}
    
    - name: Notify CI/CD System
      if: always()
      run: |
        curl -X POST \${{ env.CICD_WEBHOOK }} \\
          -H "Content-Type: application/json" \\
          -H "X-GitHub-Event: workflow_run" \\
          -d '{
            "action": "completed",
            "workflow_run": {
              "id": "\${{ github.run_id }}",
              "name": "\${{ github.workflow }}",
              "status": "completed",
              "conclusion": "\${{ job.status }}",
              "head_sha": "\${{ github.sha }}",
              "html_url": "https://github.com/\${{ github.repository }}/actions/runs/\${{ github.run_id }}"
            },
            "repository": {
              "full_name": "\${{ github.repository }}"
            }
          }' || true

  deploy-staging:
    name: Deploy to Staging
    runs-on: ubuntu-latest
    needs: build-and-test
    if: github.ref == 'refs/heads/develop'
    environment: staging
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Deploy to staging
      run: |
        echo "Deploy to staging environment"
        # Add your staging deployment commands here
${projectInfo.hasVercelJson ? '        # vercel --token ${{ secrets.VERCEL_TOKEN }}' : ''}

  deploy-production:
    name: Deploy to Production
    runs-on: ubuntu-latest
    needs: build-and-test
    if: github.ref == 'refs/heads/main' || github.ref == 'refs/heads/master'
    environment: production
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v4
    
    - name: Deploy to production
      run: |
        echo "Deploy to production environment"
        # Add your production deployment commands here
${projectInfo.hasVercelJson ? '        # vercel --prod --token ${{ secrets.VERCEL_TOKEN }}' : ''}
${projectInfo.hasAnchorToml ? '        # anchor deploy --network mainnet' : ''}
`;
  }

  async updatePackageScripts(projectInfo) {
    if (!projectInfo.hasPackageJson) return;
    
    const packageJsonPath = path.join(this.projectPath, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    
    // Add CI/CD related scripts
    packageJson.scripts = packageJson.scripts || {};
    
    const cicdScripts = {
      'cicd:status': `curl ${this.cicdServerUrl}/api/dashboard`,
      'cicd:builds': `curl ${this.cicdServerUrl}/api/builds`,
      'cicd:deployments': `curl ${this.cicdServerUrl}/api/deployments`,
      'cicd:health': `curl ${this.cicdServerUrl}/api/health`
    };
    
    // Only add scripts that don't exist
    Object.entries(cicdScripts).forEach(([script, command]) => {
      if (!packageJson.scripts[script]) {
        packageJson.scripts[script] = command;
      }
    });
    
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log('✅ Added CI/CD scripts to package.json');
  }

  async createWebhookGuide(projectInfo) {
    const guide = `# CI/CD Integration Guide

This project has been configured to work with the Solana DevEx Platform CI/CD system.

## Quick Start

1. **GitHub Webhook Setup:**
   - Go to your repository settings on GitHub
   - Navigate to "Settings" → "Webhooks"
   - Click "Add webhook"
   - Set the Payload URL to: \`${this.webhookUrl}\`
   - Set Content type to: \`application/json\`
   - Select "Send me everything" or choose specific events:
     - Push events
     - Pull request events
     - Deployment events
   - Add the webhook

2. **Environment Variables:**
   Add these to your repository secrets (Settings → Secrets → Actions):
   \`\`\`
   VERCEL_TOKEN=your_vercel_token (if using Vercel)
   RAILWAY_TOKEN=your_railway_token (if using Railway)
   HEROKU_TOKEN=your_heroku_token (if using Heroku)
   DEVNET_WALLET_PRIVATE_KEY=your_solana_wallet (if deploying Solana programs)
   \`\`\`

3. **Dashboard Access:**
   - View builds and deployments: ${this.dashboardUrl}
   - API status: ${this.cicdServerUrl}/api/health
   - Metrics: ${this.cicdServerUrl}/api/metrics/overview

## Project Configuration

- **Type:** ${projectInfo.type}
- **Packages:** ${projectInfo.packages.length} packages detected
- **Has Anchor:** ${projectInfo.hasAnchorToml ? 'Yes' : 'No'}
- **Has Vercel:** ${projectInfo.hasVercelJson ? 'Yes' : 'No'}

## Available Scripts

Run these commands to interact with the CI/CD system:

\`\`\`bash
npm run cicd:status      # Check CI/CD dashboard
npm run cicd:builds      # View recent builds
npm run cicd:deployments # View deployments
npm run cicd:health      # Check system health
\`\`\`

## Monitoring

The system provides real-time monitoring of:
- Build status and logs
- Test results
- Deployment status across platforms
- Performance metrics

## Integration Endpoints

- **Webhook:** ${this.webhookUrl}
- **API Base:** ${this.cicdServerUrl}/api
- **WebSocket:** ${this.cicdServerUrl.replace('http', 'ws')}/ws/cicd

## Troubleshooting

1. **Webhook not triggering:**
   - Check GitHub webhook delivery logs
   - Verify the webhook URL is accessible
   - Ensure the CI/CD server is running

2. **Build failures:**
   - Check the dashboard for detailed logs
   - Verify all required secrets are set
   - Ensure dependencies are correctly specified

3. **Deployment issues:**
   - Verify deployment platform tokens
   - Check platform-specific configuration files
   - Review deployment logs in the dashboard

For more help, check the CI/CD system logs or contact the development team.
`;

    const guidePath = path.join(this.projectPath, 'CICD_SETUP.md');
    await fs.writeFile(guidePath, guide);
    
    console.log(`✅ Created setup guide: ${guidePath}`);
  }

  displayInstructions(projectInfo) {
    console.log('\n🎉 CI/CD Integration Setup Complete!');
    console.log('\n📋 Next Steps:');
    console.log('');
    console.log('1️⃣  Set up GitHub webhook:');
    console.log(`   - Go to your repository settings`);
    console.log(`   - Add webhook: ${this.webhookUrl}`);
    console.log('');
    console.log('2️⃣  Configure secrets in GitHub:');
    console.log('   - Add deployment platform tokens');
    console.log('   - Add wallet keys for Solana deployments (if applicable)');
    console.log('');
    console.log('3️⃣  View your CI/CD dashboard:');
    console.log(`   ${this.dashboardUrl}`);
    console.log('');
    console.log('4️⃣  Test the integration:');
    console.log('   - Make a commit to trigger the pipeline');
    console.log('   - Watch the build progress in the dashboard');
    console.log('');
    console.log(`📚 Read the full guide: ${path.join(this.projectPath, 'CICD_SETUP.md')}`);
    console.log(`⚙️  Configuration file: ${path.join(this.projectPath, '.cicd-config.json')}`);
    console.log('');
    
    if (projectInfo.type.includes('monorepo')) {
      console.log('🏗️  Monorepo detected:');
      console.log(`   - ${projectInfo.packages.length} packages will be built and tested`);
      console.log('   - Each package will be processed individually');
      console.log('');
    }
  }

  /**
   * Register this project with the CI/CD system
   */
  async registerWithCICD(owner, repo) {
    try {
      const response = await axios.post(`${this.cicdServerUrl}/api/repositories/register`, {
        owner,
        repo,
        webhookUrl: this.webhookUrl
      });

      if (response.data.success) {
        console.log(`✅ Registered ${owner}/${repo} with CI/CD system`);
        return response.data;
      }
    } catch (error) {
      console.error('❌ Failed to register with CI/CD system:', error.message);
      throw error;
    }
  }
}

// CLI usage
if (require.main === module) {
  const projectPath = process.argv[2] || process.cwd();
  const cicdServerUrl = process.argv[3] || 'http://localhost:3001';
  
  const setup = new ProjectCICDSetup(projectPath, { cicdServerUrl });
  setup.setupProject().catch(console.error);
}

module.exports = ProjectCICDSetup;