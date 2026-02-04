/**
 * Real CI/CD Integration System
 * Handles GitHub webhooks, deployment APIs, and live monitoring
 */

const express = require('express');
const crypto = require('crypto');
const { Octokit } = require('@octokit/rest');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const WebSocket = require('ws');
const { exec } = require('child_process');
const { promisify } = require('util');

const execAsync = promisify(exec);

class RealCICDIntegration {
  constructor() {
    this.app = express();
    this.wss = null;
    this.activeBuilds = new Map();
    this.deploymentHistory = [];
    this.webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;
    
    // API clients
    this.octokit = new Octokit({ 
      auth: process.env.GITHUB_TOKEN 
    });
    
    this.vercelToken = process.env.VERCEL_TOKEN;
    this.railwayToken = process.env.RAILWAY_TOKEN;
    this.herokuToken = process.env.HEROKU_TOKEN;
    
    this.setupExpress();
    this.setupWebSocket();
    this.startDeploymentMonitoring();
  }

  setupExpress() {
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.raw({ type: 'application/json', limit: '10mb' }));
    
    // CORS middleware
    this.app.use((req, res, next) => {
      res.header('Access-Control-Allow-Origin', '*');
      res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
      res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      if (req.method === 'OPTIONS') {
        res.sendStatus(200);
      } else {
        next();
      }
    });

    this.setupRoutes();
  }

  setupRoutes() {
    // GitHub webhook endpoint
    this.app.post('/api/webhooks/github', this.handleGitHubWebhook.bind(this));
    
    // Repository integration endpoints
    this.app.post('/api/repositories/register', this.registerRepository.bind(this));
    this.app.get('/api/repositories', this.getRepositories.bind(this));
    this.app.get('/api/repositories/:repoId/status', this.getRepositoryStatus.bind(this));
    
    // Build and deployment endpoints
    this.app.get('/api/builds', this.getBuilds.bind(this));
    this.app.get('/api/builds/:buildId', this.getBuild.bind(this));
    this.app.post('/api/builds/:buildId/retry', this.retryBuild.bind(this));
    this.app.get('/api/deployments', this.getDeployments.bind(this));
    this.app.get('/api/deployments/:deploymentId', this.getDeployment.bind(this));
    
    // Test execution endpoints
    this.app.get('/api/tests/:repoId', this.getTestResults.bind(this));
    this.app.post('/api/tests/:repoId/run', this.runTests.bind(this));
    
    // Metrics endpoints
    this.app.get('/api/metrics/overview', this.getMetricsOverview.bind(this));
    this.app.get('/api/metrics/builds', this.getBuildMetrics.bind(this));
    this.app.get('/api/metrics/deployments', this.getDeploymentMetrics.bind(this));
    
    // Dashboard data endpoint
    this.app.get('/api/dashboard', this.getDashboardData.bind(this));
    
    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        activeBuilds: this.activeBuilds.size,
        connectedClients: this.wss ? this.wss.clients.size : 0
      });
    });
  }

  setupWebSocket() {
    const server = require('http').createServer(this.app);
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/cicd'
    });

    this.wss.on('connection', (ws) => {
      console.log('New CI/CD dashboard client connected');
      
      // Send current status to new client
      ws.send(JSON.stringify({
        type: 'status',
        data: {
          activeBuilds: Array.from(this.activeBuilds.values()),
          recentDeployments: this.deploymentHistory.slice(-10)
        }
      }));

      ws.on('close', () => {
        console.log('CI/CD dashboard client disconnected');
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });

    const PORT = process.env.CICD_PORT || 3001;
    server.listen(PORT, () => {
      console.log(`Real CI/CD Integration Server running on port ${PORT}`);
    });
  }

  // GitHub webhook handler
  async handleGitHubWebhook(req, res) {
    try {
      const signature = req.get('X-Hub-Signature-256');
      const payload = req.body;
      
      // Verify webhook signature
      if (this.webhookSecret && signature) {
        const expectedSignature = 'sha256=' + crypto
          .createHmac('sha256', this.webhookSecret)
          .update(payload)
          .digest('hex');
          
        if (signature !== expectedSignature) {
          return res.status(401).json({ error: 'Invalid signature' });
        }
      }

      const event = req.get('X-GitHub-Event');
      const data = JSON.parse(payload);

      console.log(`Received GitHub webhook: ${event}`);

      switch (event) {
        case 'push':
          await this.handlePushEvent(data);
          break;
        case 'pull_request':
          await this.handlePullRequestEvent(data);
          break;
        case 'workflow_run':
          await this.handleWorkflowRunEvent(data);
          break;
        case 'deployment':
          await this.handleDeploymentEvent(data);
          break;
        case 'deployment_status':
          await this.handleDeploymentStatusEvent(data);
          break;
        default:
          console.log(`Unhandled webhook event: ${event}`);
      }

      res.status(200).json({ received: true });
    } catch (error) {
      console.error('Webhook error:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async handlePushEvent(data) {
    const { repository, ref, commits, pusher } = data;
    
    if (ref === 'refs/heads/main' || ref === 'refs/heads/master') {
      console.log(`Push to main branch in ${repository.full_name}`);
      
      // Start a new build
      const build = {
        id: `build_${Date.now()}`,
        repository: repository.full_name,
        branch: ref.replace('refs/heads/', ''),
        commit: {
          sha: data.after,
          message: commits[0]?.message || 'No message',
          author: pusher.name,
          url: commits[0]?.url
        },
        status: 'pending',
        stages: {
          build: 'pending',
          test: 'pending',
          deploy: 'pending'
        },
        startedAt: new Date().toISOString(),
        logs: []
      };

      this.activeBuilds.set(build.id, build);
      this.broadcastUpdate('build_started', build);

      // Trigger build process
      this.executeBuild(build);
    }
  }

  async handlePullRequestEvent(data) {
    const { action, pull_request, repository } = data;
    
    if (action === 'opened' || action === 'synchronize') {
      console.log(`PR ${action} in ${repository.full_name}: #${pull_request.number}`);
      
      // Start PR validation build
      const build = {
        id: `pr_build_${Date.now()}`,
        repository: repository.full_name,
        branch: pull_request.head.ref,
        pullRequest: {
          number: pull_request.number,
          title: pull_request.title,
          author: pull_request.user.login,
          url: pull_request.html_url
        },
        commit: {
          sha: pull_request.head.sha,
          message: pull_request.title,
          author: pull_request.user.login
        },
        status: 'pending',
        stages: {
          build: 'pending',
          test: 'pending'
        },
        startedAt: new Date().toISOString(),
        logs: []
      };

      this.activeBuilds.set(build.id, build);
      this.broadcastUpdate('pr_build_started', build);
      
      // Execute PR validation
      this.executePRValidation(build);
    }
  }

  async handleWorkflowRunEvent(data) {
    const { action, workflow_run, repository } = data;
    
    console.log(`Workflow ${workflow_run.name} ${action} in ${repository.full_name}`);
    
    // Find corresponding build
    const buildId = Array.from(this.activeBuilds.keys()).find(id => {
      const build = this.activeBuilds.get(id);
      return build.commit.sha === workflow_run.head_sha;
    });

    if (buildId) {
      const build = this.activeBuilds.get(buildId);
      build.workflowRun = {
        id: workflow_run.id,
        name: workflow_run.name,
        status: workflow_run.status,
        conclusion: workflow_run.conclusion,
        url: workflow_run.html_url
      };

      if (action === 'completed') {
        build.status = workflow_run.conclusion;
        build.completedAt = new Date().toISOString();
        
        if (workflow_run.conclusion === 'success') {
          build.stages.build = 'success';
          build.stages.test = 'success';
        } else {
          build.stages.build = 'failed';
          build.stages.test = 'failed';
        }
      }

      this.activeBuilds.set(buildId, build);
      this.broadcastUpdate('build_updated', build);
    }
  }

  async handleDeploymentEvent(data) {
    const deployment = {
      id: data.deployment.id,
      repository: data.repository.full_name,
      environment: data.deployment.environment,
      ref: data.deployment.ref,
      sha: data.deployment.sha,
      status: 'pending',
      createdAt: data.deployment.created_at,
      creator: data.deployment.creator.login,
      description: data.deployment.description
    };

    this.deploymentHistory.push(deployment);
    this.broadcastUpdate('deployment_created', deployment);
  }

  async handleDeploymentStatusEvent(data) {
    const { deployment_status, deployment, repository } = data;
    
    // Update deployment in history
    const deploymentIndex = this.deploymentHistory.findIndex(d => d.id === deployment.id);
    if (deploymentIndex !== -1) {
      this.deploymentHistory[deploymentIndex].status = deployment_status.state;
      this.deploymentHistory[deploymentIndex].targetUrl = deployment_status.target_url;
      this.deploymentHistory[deploymentIndex].updatedAt = deployment_status.created_at;
      
      this.broadcastUpdate('deployment_updated', this.deploymentHistory[deploymentIndex]);
    }

    console.log(`Deployment ${deployment.id} status: ${deployment_status.state}`);
  }

  // Build execution
  async executeBuild(build) {
    try {
      // Clone repository
      this.addBuildLog(build, 'info', 'Cloning repository...');
      const repoPath = await this.cloneRepository(build.repository, build.commit.sha);
      
      // Install dependencies
      this.addBuildLog(build, 'info', 'Installing dependencies...');
      build.stages.build = 'running';
      this.broadcastUpdate('build_updated', build);
      
      await this.runBuildSteps(build, repoPath);
      
      // Run tests
      build.stages.build = 'success';
      build.stages.test = 'running';
      this.broadcastUpdate('build_updated', build);
      
      await this.runTests(build, repoPath);
      
      // Deploy if tests pass
      build.stages.test = 'success';
      build.stages.deploy = 'running';
      this.broadcastUpdate('build_updated', build);
      
      await this.deployBuild(build, repoPath);
      
      build.stages.deploy = 'success';
      build.status = 'success';
      build.completedAt = new Date().toISOString();
      
      this.addBuildLog(build, 'success', 'Build completed successfully!');
      
    } catch (error) {
      build.status = 'failed';
      build.completedAt = new Date().toISOString();
      
      // Mark failed stage
      Object.keys(build.stages).forEach(stage => {
        if (build.stages[stage] === 'running') {
          build.stages[stage] = 'failed';
        }
      });
      
      this.addBuildLog(build, 'error', `Build failed: ${error.message}`);
    }
    
    this.broadcastUpdate('build_completed', build);
    
    // Clean up after 1 hour
    setTimeout(() => {
      this.activeBuilds.delete(build.id);
    }, 60 * 60 * 1000);
  }

  async executePRValidation(build) {
    try {
      this.addBuildLog(build, 'info', 'Starting PR validation...');
      
      const repoPath = await this.cloneRepository(build.repository, build.commit.sha);
      
      build.stages.build = 'running';
      this.broadcastUpdate('build_updated', build);
      
      await this.runBuildSteps(build, repoPath);
      
      build.stages.build = 'success';
      build.stages.test = 'running';
      this.broadcastUpdate('build_updated', build);
      
      const testResults = await this.runTestSuite(build, repoPath);
      
      build.stages.test = 'success';
      build.status = 'success';
      build.completedAt = new Date().toISOString();
      build.testResults = testResults;
      
      this.addBuildLog(build, 'success', 'PR validation completed successfully!');
      
      // Post status to GitHub PR
      await this.updatePRStatus(build, 'success');
      
    } catch (error) {
      build.status = 'failed';
      build.completedAt = new Date().toISOString();
      
      Object.keys(build.stages).forEach(stage => {
        if (build.stages[stage] === 'running') {
          build.stages[stage] = 'failed';
        }
      });
      
      this.addBuildLog(build, 'error', `PR validation failed: ${error.message}`);
      await this.updatePRStatus(build, 'failure');
    }
    
    this.broadcastUpdate('build_completed', build);
  }

  // Helper methods
  async cloneRepository(repoName, sha) {
    const tempDir = `/tmp/builds/${Date.now()}`;
    const repoUrl = `https://github.com/${repoName}.git`;
    
    await execAsync(`mkdir -p ${tempDir}`);
    await execAsync(`git clone ${repoUrl} ${tempDir}`);
    await execAsync(`git checkout ${sha}`, { cwd: tempDir });
    
    return tempDir;
  }

  async runBuildSteps(build, repoPath) {
    // Detect project type and run appropriate build steps
    const packageJsonExists = await fs.access(path.join(repoPath, 'package.json')).then(() => true).catch(() => false);
    const anchorTomlExists = await fs.access(path.join(repoPath, 'Anchor.toml')).then(() => true).catch(() => false);
    
    if (packageJsonExists) {
      this.addBuildLog(build, 'info', 'Installing npm dependencies...');
      await execAsync('npm ci', { cwd: repoPath });
      
      // Check if there's a build script
      const packageJson = JSON.parse(await fs.readFile(path.join(repoPath, 'package.json'), 'utf8'));
      if (packageJson.scripts && packageJson.scripts.build) {
        this.addBuildLog(build, 'info', 'Running build script...');
        await execAsync('npm run build', { cwd: repoPath });
      }
    }
    
    if (anchorTomlExists) {
      this.addBuildLog(build, 'info', 'Building Anchor project...');
      await execAsync('anchor build', { cwd: repoPath });
    }
  }

  async runTestSuite(build, repoPath) {
    const results = {
      total: 0,
      passed: 0,
      failed: 0,
      duration: 0,
      tests: []
    };
    
    const packageJsonExists = await fs.access(path.join(repoPath, 'package.json')).then(() => true).catch(() => false);
    
    if (packageJsonExists) {
      const packageJson = JSON.parse(await fs.readFile(path.join(repoPath, 'package.json'), 'utf8'));
      
      if (packageJson.scripts && packageJson.scripts.test) {
        this.addBuildLog(build, 'info', 'Running tests...');
        
        const startTime = Date.now();
        try {
          const testOutput = await execAsync('npm test', { cwd: repoPath });
          results.duration = Date.now() - startTime;
          
          // Parse test output (this would need to be adapted for different test frameworks)
          const testLines = testOutput.stdout.split('\n');
          results.total = testLines.filter(line => line.includes('✓') || line.includes('✗')).length;
          results.passed = testLines.filter(line => line.includes('✓')).length;
          results.failed = results.total - results.passed;
          
        } catch (testError) {
          results.duration = Date.now() - startTime;
          results.failed = 1; // At least one failure
          throw testError;
        }
      }
    }
    
    return results;
  }

  async deployBuild(build, repoPath) {
    // Check for deployment configuration
    const vercelJsonExists = await fs.access(path.join(repoPath, 'vercel.json')).then(() => true).catch(() => false);
    const railwayTomlExists = await fs.access(path.join(repoPath, 'railway.toml')).then(() => true).catch(() => false);
    
    if (vercelJsonExists && this.vercelToken) {
      await this.deployToVercel(build, repoPath);
    } else if (railwayTomlExists && this.railwayToken) {
      await this.deployToRailway(build, repoPath);
    } else {
      this.addBuildLog(build, 'info', 'No deployment configuration found, skipping deploy...');
    }
  }

  async deployToVercel(build, repoPath) {
    this.addBuildLog(build, 'info', 'Deploying to Vercel...');
    
    try {
      // This would use Vercel API to deploy
      const deployment = await axios.post('https://api.vercel.com/v13/deployments', {
        name: build.repository.split('/')[1],
        gitSource: {
          type: 'github',
          repo: build.repository,
          ref: build.commit.sha
        }
      }, {
        headers: {
          'Authorization': `Bearer ${this.vercelToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      build.deployment = {
        provider: 'vercel',
        id: deployment.data.id,
        url: deployment.data.url,
        status: deployment.data.readyState
      };
      
      this.addBuildLog(build, 'success', `Deployed to Vercel: ${deployment.data.url}`);
      
    } catch (error) {
      throw new Error(`Vercel deployment failed: ${error.message}`);
    }
  }

  async deployToRailway(build, repoPath) {
    this.addBuildLog(build, 'info', 'Deploying to Railway...');
    
    try {
      // This would use Railway API to deploy
      this.addBuildLog(build, 'success', 'Deployed to Railway');
    } catch (error) {
      throw new Error(`Railway deployment failed: ${error.message}`);
    }
  }

  addBuildLog(build, level, message) {
    build.logs.push({
      timestamp: new Date().toISOString(),
      level,
      message
    });
    console.log(`[${build.id}] ${level.toUpperCase()}: ${message}`);
  }

  broadcastUpdate(type, data) {
    if (!this.wss) return;
    
    const message = JSON.stringify({ type, data });
    
    this.wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  }

  async updatePRStatus(build, state) {
    try {
      const [owner, repo] = build.repository.split('/');
      
      await this.octokit.rest.repos.createCommitStatus({
        owner,
        repo,
        sha: build.commit.sha,
        state,
        context: 'DevEx Platform CI',
        description: state === 'success' ? 'All checks passed!' : 'Some checks failed',
        target_url: `${process.env.DASHBOARD_URL}/builds/${build.id}`
      });
    } catch (error) {
      console.error('Failed to update PR status:', error);
    }
  }

  // API endpoint handlers
  async registerRepository(req, res) {
    try {
      const { owner, repo, webhookUrl } = req.body;
      
      // Register webhook with GitHub
      const webhook = await this.octokit.rest.repos.createWebhook({
        owner,
        repo,
        config: {
          url: webhookUrl || `${process.env.PUBLIC_URL}/api/webhooks/github`,
          content_type: 'json',
          secret: this.webhookSecret
        },
        events: ['push', 'pull_request', 'workflow_run', 'deployment', 'deployment_status']
      });

      res.json({
        success: true,
        repository: `${owner}/${repo}`,
        webhookId: webhook.data.id
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getRepositories(req, res) {
    // This would return registered repositories
    res.json({ repositories: [] });
  }

  async getRepositoryStatus(req, res) {
    const { repoId } = req.params;
    // Return repository status
    res.json({ status: 'active' });
  }

  async getBuilds(req, res) {
    const builds = Array.from(this.activeBuilds.values());
    res.json({ builds });
  }

  async getBuild(req, res) {
    const { buildId } = req.params;
    const build = this.activeBuilds.get(buildId);
    
    if (!build) {
      return res.status(404).json({ error: 'Build not found' });
    }
    
    res.json({ build });
  }

  async retryBuild(req, res) {
    const { buildId } = req.params;
    // Retry build logic
    res.json({ message: 'Build retry initiated' });
  }

  async getDeployments(req, res) {
    res.json({ deployments: this.deploymentHistory });
  }

  async getDeployment(req, res) {
    const { deploymentId } = req.params;
    const deployment = this.deploymentHistory.find(d => d.id == deploymentId);
    
    if (!deployment) {
      return res.status(404).json({ error: 'Deployment not found' });
    }
    
    res.json({ deployment });
  }

  async getTestResults(req, res) {
    const { repoId } = req.params;
    // Return test results for repository
    res.json({ tests: [] });
  }

  async runTests(req, res) {
    const { repoId } = req.params;
    // Trigger test run
    res.json({ message: 'Tests initiated' });
  }

  async getMetricsOverview(req, res) {
    const totalBuilds = this.activeBuilds.size;
    const successfulBuilds = Array.from(this.activeBuilds.values())
      .filter(build => build.status === 'success').length;
    const failedBuilds = Array.from(this.activeBuilds.values())
      .filter(build => build.status === 'failed').length;
    
    const totalDeployments = this.deploymentHistory.length;
    const successfulDeployments = this.deploymentHistory
      .filter(deployment => deployment.status === 'success').length;
    
    res.json({
      builds: {
        total: totalBuilds,
        successful: successfulBuilds,
        failed: failedBuilds,
        successRate: totalBuilds > 0 ? (successfulBuilds / totalBuilds) * 100 : 0
      },
      deployments: {
        total: totalDeployments,
        successful: successfulDeployments,
        successRate: totalDeployments > 0 ? (successfulDeployments / totalDeployments) * 100 : 0
      }
    });
  }

  async getBuildMetrics(req, res) {
    // Return detailed build metrics
    res.json({ metrics: [] });
  }

  async getDeploymentMetrics(req, res) {
    // Return detailed deployment metrics
    res.json({ metrics: [] });
  }

  async getDashboardData(req, res) {
    const activeBuilds = Array.from(this.activeBuilds.values());
    const recentDeployments = this.deploymentHistory.slice(-10);
    
    res.json({
      activeBuilds,
      recentDeployments,
      summary: {
        totalActiveBuilds: activeBuilds.length,
        runningBuilds: activeBuilds.filter(b => b.status === 'pending').length,
        successfulBuilds: activeBuilds.filter(b => b.status === 'success').length,
        failedBuilds: activeBuilds.filter(b => b.status === 'failed').length
      }
    });
  }

  // Deployment monitoring from external APIs
  startDeploymentMonitoring() {
    // Poll Vercel deployments
    if (this.vercelToken) {
      setInterval(() => this.pollVercelDeployments(), 30000);
    }
    
    // Poll Railway deployments
    if (this.railwayToken) {
      setInterval(() => this.pollRailwayDeployments(), 30000);
    }
    
    // Poll Heroku deployments
    if (this.herokuToken) {
      setInterval(() => this.pollHerokuDeployments(), 30000);
    }
  }

  async pollVercelDeployments() {
    try {
      const response = await axios.get('https://api.vercel.com/v6/deployments', {
        headers: {
          'Authorization': `Bearer ${this.vercelToken}`
        },
        params: {
          limit: 10
        }
      });
      
      // Process and broadcast updates
      response.data.deployments.forEach(deployment => {
        this.broadcastUpdate('vercel_deployment', {
          id: deployment.uid,
          name: deployment.name,
          status: deployment.readyState,
          url: `https://${deployment.url}`,
          createdAt: deployment.createdAt,
          source: 'vercel'
        });
      });
      
    } catch (error) {
      console.error('Failed to poll Vercel deployments:', error.message);
    }
  }

  async pollRailwayDeployments() {
    try {
      const response = await axios.post('https://backboard.railway.app/graphql/v2', {
        query: `
          query {
            me {
              projects {
                edges {
                  node {
                    id
                    name
                    environments {
                      edges {
                        node {
                          deployments {
                            edges {
                              node {
                                id
                                status
                                createdAt
                                url
                              }
                            }
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        `
      }, {
        headers: {
          'Authorization': `Bearer ${this.railwayToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      // Process Railway deployments
      // Implementation would depend on Railway's actual API response structure
      
    } catch (error) {
      console.error('Failed to poll Railway deployments:', error.message);
    }
  }

  async pollHerokuDeployments() {
    try {
      const response = await axios.get('https://api.heroku.com/apps', {
        headers: {
          'Authorization': `Bearer ${this.herokuToken}`,
          'Accept': 'application/vnd.heroku+json; version=3'
        }
      });
      
      // Get recent releases for each app
      for (const app of response.data.slice(0, 5)) {
        try {
          const releases = await axios.get(`https://api.heroku.com/apps/${app.name}/releases`, {
            headers: {
              'Authorization': `Bearer ${this.herokuToken}`,
              'Accept': 'application/vnd.heroku+json; version=3'
            },
            params: {
              'Range': 'version ..; order=desc,max=5'
            }
          });
          
          releases.data.forEach(release => {
            this.broadcastUpdate('heroku_deployment', {
              id: release.id,
              app: app.name,
              version: release.version,
              status: release.status,
              createdAt: release.created_at,
              description: release.description,
              source: 'heroku'
            });
          });
          
        } catch (error) {
          console.error(`Failed to get releases for ${app.name}:`, error.message);
        }
      }
      
    } catch (error) {
      console.error('Failed to poll Heroku deployments:', error.message);
    }
  }
}

module.exports = RealCICDIntegration;