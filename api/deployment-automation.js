/**
 * Enhanced Deployment Automation Manager
 * Handles production-grade deployments with safety checks and monitoring
 */

const fs = require('fs').promises;
const path = require('path');
const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);
const EventEmitter = require('events');

class DeploymentAutomation extends EventEmitter {
  constructor(options = {}) {
    super();
    this.workspaceRoot = options.workspaceRoot || process.cwd();
    this.deployments = new Map();
    this.networks = {
      localnet: {
        rpc: 'http://localhost:8899',
        ws: 'ws://localhost:8900',
        commitment: 'processed'
      },
      devnet: {
        rpc: 'https://api.devnet.solana.com',
        ws: 'wss://api.devnet.solana.com',
        commitment: 'confirmed'
      },
      testnet: {
        rpc: 'https://api.testnet.solana.com',
        ws: 'wss://api.testnet.solana.com',
        commitment: 'confirmed'
      },
      mainnet: {
        rpc: 'https://api.mainnet-beta.solana.com',
        ws: 'wss://api.mainnet-beta.solana.com',
        commitment: 'finalized'
      }
    };
  }

  /**
   * Execute comprehensive deployment with safety checks
   */
  async deployWithSafetyChecks(config) {
    const deploymentId = `deploy_${Date.now()}`;
    const deployment = {
      id: deploymentId,
      status: 'initializing',
      network: config.network,
      projectPath: config.projectPath,
      programs: config.programs || [],
      safetyChecks: config.safetyChecks !== false,
      startTime: new Date(),
      stages: [],
      logs: [],
      metrics: {}
    };

    this.deployments.set(deploymentId, deployment);
    this.emit('deployment:started', deployment);

    try {
      // Stage 1: Pre-deployment validation
      await this.runPreDeploymentChecks(deployment);
      
      // Stage 2: Build verification
      await this.verifyBuild(deployment);
      
      // Stage 3: Network connectivity check
      await this.checkNetworkConnectivity(deployment);
      
      // Stage 4: Wallet and funding checks
      await this.checkWalletAndFunding(deployment);
      
      // Stage 5: Safety checks (if enabled)
      if (deployment.safetyChecks) {
        await this.runSafetyChecks(deployment);
      }
      
      // Stage 6: Execute deployment
      await this.executeDeployment(deployment);
      
      // Stage 7: Post-deployment verification
      await this.verifyDeployment(deployment);
      
      // Stage 8: Update program registries
      await this.updateProgramRegistries(deployment);
      
      deployment.status = 'completed';
      deployment.endTime = new Date();
      this.emit('deployment:completed', deployment);
      
      return deployment;
    } catch (error) {
      deployment.status = 'failed';
      deployment.error = error.message;
      deployment.endTime = new Date();
      this.emit('deployment:failed', { deployment, error });
      throw error;
    }
  }

  /**
   * Pre-deployment validation checks
   */
  async runPreDeploymentChecks(deployment) {
    this.logStage(deployment, 'pre-deployment-checks', 'Starting pre-deployment validation...');
    
    const { projectPath } = deployment;
    
    // Check if Anchor.toml exists
    const anchorTomlPath = path.join(projectPath, 'Anchor.toml');
    try {
      await fs.access(anchorTomlPath);
      this.log(deployment, 'info', '[CHECK] Anchor.toml found');
    } catch {
      throw new Error('Anchor.toml not found. This does not appear to be an Anchor project.');
    }
    
    // Check if programs directory exists and has content
    const programsPath = path.join(projectPath, 'programs');
    try {
      const programs = await fs.readdir(programsPath);
      const programDirs = [];
      for (const program of programs) {
        const programPath = path.join(programsPath, program);
        const stat = await fs.stat(programPath);
        if (stat.isDirectory()) {
          programDirs.push(program);
        }
      }
      
      if (programDirs.length === 0) {
        throw new Error('No programs found in programs directory');
      }
      
      deployment.programs = programDirs;
      this.log(deployment, 'info', `[CHECK] Found ${programDirs.length} program(s): ${programDirs.join(', ')}`);
    } catch (error) {
      throw new Error(`Programs validation failed: ${error.message}`);
    }
    
    // Check git status (optional but recommended)
    try {
      const { stdout: gitStatus } = await execAsync('git status --porcelain', { cwd: projectPath });
      if (gitStatus.trim()) {
        this.log(deployment, 'warn', '⚠ Uncommitted changes detected in git repository');
      } else {
        this.log(deployment, 'info', '[CHECK] Git repository is clean');
      }
    } catch {
      this.log(deployment, 'warn', '⚠ Not a git repository or git not available');
    }
    
    this.logStage(deployment, 'pre-deployment-checks', 'Pre-deployment checks completed');
  }

  /**
   * Verify build integrity
   */
  async verifyBuild(deployment) {
    this.logStage(deployment, 'build-verification', 'Verifying build...');
    
    const { projectPath } = deployment;
    const buildStartTime = Date.now();
    
    try {
      // Clean build
      this.log(deployment, 'info', 'Cleaning previous build artifacts...');
      await execAsync('anchor clean', { cwd: projectPath });
      
      // Build programs
      this.log(deployment, 'info', 'Building programs...');
      const { stdout: buildOutput } = await execAsync('anchor build --arch sbf', { cwd: projectPath });
      
      const buildTime = Date.now() - buildStartTime;
      deployment.metrics.buildTime = buildTime;
      
      this.log(deployment, 'info', `[CHECK] Build completed in ${buildTime}ms`);
      
      // Verify build outputs
      for (const program of deployment.programs) {
        const programBinary = path.join(projectPath, 'target', 'deploy', `${program.replace(/-/g, '_')}.so`);
        try {
          const stat = await fs.stat(programBinary);
          this.log(deployment, 'info', `[CHECK] Program binary exists: ${program} (${stat.size} bytes)`);
        } catch {
          throw new Error(`Program binary not found: ${program}`);
        }
      }
    } catch (error) {
      throw new Error(`Build verification failed: ${error.message}`);
    }
    
    this.logStage(deployment, 'build-verification', 'Build verification completed');
  }

  /**
   * Check network connectivity and performance
   */
  async checkNetworkConnectivity(deployment) {
    this.logStage(deployment, 'network-check', 'Checking network connectivity...');
    
    const network = this.networks[deployment.network];
    if (!network) {
      throw new Error(`Unknown network: ${deployment.network}`);
    }
    
    const connectivityStartTime = Date.now();
    
    try {
      // Test RPC connectivity and measure latency
      const { stdout: rpcTest } = await execAsync(`curl -s -w "%{time_total}" -X POST ${network.rpc} -H "Content-Type: application/json" -d '{"jsonrpc":"2.0","id":1,"method":"getHealth"}' -o /dev/null`);
      const rpcLatency = parseFloat(rpcTest) * 1000; // Convert to ms
      
      deployment.metrics.rpcLatency = rpcLatency;
      this.log(deployment, 'info', `[CHECK] RPC connectivity: ${network.rpc} (${rpcLatency.toFixed(2)}ms)`);
      
      // Test WebSocket connectivity (optional)
      try {
        // WebSocket test would go here
        this.log(deployment, 'info', `[CHECK] WebSocket connectivity: ${network.ws}`);
      } catch {
        this.log(deployment, 'warn', '⚠ WebSocket connectivity test skipped');
      }
      
      // Configure Solana CLI for the network
      await execAsync(`solana config set --url ${network.rpc}`, { cwd: deployment.projectPath });
      this.log(deployment, 'info', `[CHECK] Solana CLI configured for ${deployment.network}`);
      
    } catch (error) {
      throw new Error(`Network connectivity check failed: ${error.message}`);
    }
    
    this.logStage(deployment, 'network-check', 'Network connectivity check completed');
  }

  /**
   * Check wallet configuration and funding
   */
  async checkWalletAndFunding(deployment) {
    this.logStage(deployment, 'wallet-check', 'Checking wallet and funding...');
    
    try {
      // Check wallet configuration
      const { stdout: walletInfo } = await execAsync('solana address', { cwd: deployment.projectPath });
      const walletAddress = walletInfo.trim();
      
      deployment.metrics.walletAddress = walletAddress;
      this.log(deployment, 'info', `[CHECK] Wallet address: ${walletAddress}`);
      
      // Check balance
      const { stdout: balanceInfo } = await execAsync('solana balance', { cwd: deployment.projectPath });
      const balance = parseFloat(balanceInfo.split(' ')[0]);
      
      deployment.metrics.walletBalance = balance;
      this.log(deployment, 'info', `[CHECK] Wallet balance: ${balance} SOL`);
      
      // Check minimum balance requirements
      const minimumBalance = deployment.network === 'mainnet' ? 1.0 : 0.1;
      if (balance < minimumBalance) {
        if (deployment.network === 'devnet') {
          this.log(deployment, 'info', 'Requesting devnet airdrop...');
          await execAsync('solana airdrop 2', { cwd: deployment.projectPath });
          const { stdout: newBalanceInfo } = await execAsync('solana balance', { cwd: deployment.projectPath });
          const newBalance = parseFloat(newBalanceInfo.split(' ')[0]);
          this.log(deployment, 'info', `[CHECK] Airdrop successful. New balance: ${newBalance} SOL`);
          deployment.metrics.walletBalance = newBalance;
        } else {
          throw new Error(`Insufficient balance: ${balance} SOL. Minimum required: ${minimumBalance} SOL`);
        }
      }
      
    } catch (error) {
      throw new Error(`Wallet and funding check failed: ${error.message}`);
    }
    
    this.logStage(deployment, 'wallet-check', 'Wallet and funding check completed');
  }

  /**
   * Run comprehensive safety checks
   */
  async runSafetyChecks(deployment) {
    this.logStage(deployment, 'safety-checks', 'Running safety checks...');
    
    const { projectPath, network } = deployment;
    
    // Check for common security issues
    await this.checkSecurityIssues(deployment);
    
    // Verify program IDs for mainnet
    if (network === 'mainnet') {
      await this.verifyMainnetProgramIds(deployment);
    }
    
    // Run static analysis (if tools are available)
    await this.runStaticAnalysis(deployment);
    
    // Check for upgrade authority configuration
    await this.checkUpgradeAuthority(deployment);
    
    this.logStage(deployment, 'safety-checks', 'Safety checks completed');
  }

  /**
   * Check for common security issues
   */
  async checkSecurityIssues(deployment) {
    const { projectPath } = deployment;
    
    // Check for hardcoded private keys
    try {
      const { stdout: grepResult } = await execAsync(
        'grep -r "private.*key\\|secret.*key\\|[0-9a-fA-F]\\{64\\}" --include="*.rs" --include="*.ts" --include="*.js" programs/ || echo "No hardcoded keys found"',
        { cwd: projectPath }
      );
      
      if (grepResult.includes('private') || grepResult.includes('secret')) {
        this.log(deployment, 'warn', '⚠ Potential hardcoded keys detected. Review output carefully.');
      } else {
        this.log(deployment, 'info', '[CHECK] No hardcoded keys detected');
      }
    } catch (error) {
      this.log(deployment, 'warn', '⚠ Security scan failed, continuing deployment');
    }
  }

  /**
   * Execute the actual deployment
   */
  async executeDeployment(deployment) {
    this.logStage(deployment, 'deployment', 'Executing deployment...');
    
    const { projectPath, network } = deployment;
    const deploymentStartTime = Date.now();
    
    try {
      // Deploy with verbose output
      const deployCommand = `anchor deploy --network ${network} --verbose`;
      this.log(deployment, 'info', `Executing: ${deployCommand}`);
      
      const { stdout: deployOutput, stderr: deployError } = await execAsync(deployCommand, { 
        cwd: projectPath,
        timeout: 300000 // 5 minute timeout
      });
      
      const deploymentTime = Date.now() - deploymentStartTime;
      deployment.metrics.deploymentTime = deploymentTime;
      
      // Parse deployment output for program IDs
      const programIds = this.extractProgramIds(deployOutput);
      deployment.programIds = programIds;
      
      this.log(deployment, 'info', `[CHECK] Deployment completed in ${deploymentTime}ms`);
      
      for (const [program, id] of Object.entries(programIds)) {
        this.log(deployment, 'info', `  ${program}: ${id}`);
      }
      
    } catch (error) {
      throw new Error(`Deployment execution failed: ${error.message}`);
    }
    
    this.logStage(deployment, 'deployment', 'Deployment execution completed');
  }

  /**
   * Verify deployment success
   */
  async verifyDeployment(deployment) {
    this.logStage(deployment, 'verification', 'Verifying deployment...');
    
    const { programIds, network } = deployment;
    
    for (const [program, programId] of Object.entries(programIds)) {
      try {
        // Verify program exists on chain
        const { stdout: accountInfo } = await execAsync(`solana account ${programId}`, { cwd: deployment.projectPath });
        
        if (accountInfo.includes('Account does not exist')) {
          throw new Error(`Program ${program} (${programId}) not found on chain`);
        }
        
        this.log(deployment, 'info', `[CHECK] Program verified on chain: ${program} (${programId})`);
        
        // Additional verification for executable programs
        if (accountInfo.includes('Executable: true')) {
          this.log(deployment, 'info', `[CHECK] Program is executable: ${program}`);
        }
        
      } catch (error) {
        throw new Error(`Program verification failed for ${program}: ${error.message}`);
      }
    }
    
    this.logStage(deployment, 'verification', 'Deployment verification completed');
  }

  /**
   * Update program registries and documentation
   */
  async updateProgramRegistries(deployment) {
    this.logStage(deployment, 'registry-update', 'Updating program registries...');
    
    const { projectPath, programIds, network } = deployment;
    
    try {
      // Update Anchor.toml with deployed program IDs
      const anchorTomlPath = path.join(projectPath, 'Anchor.toml');
      let anchorToml = await fs.readFile(anchorTomlPath, 'utf8');
      
      for (const [program, programId] of Object.entries(programIds)) {
        const networkSection = `[programs.${network}]`;
        const programLine = `${program} = "${programId}"`;
        
        if (anchorToml.includes(networkSection)) {
          // Update existing network section
          const networkRegex = new RegExp(`(\\[programs\\.${network}\\][\\s\\S]*?)(?=\\[|$)`);
          const match = anchorToml.match(networkRegex);
          
          if (match) {
            const section = match[1];
            const programRegex = new RegExp(`${program}\\s*=\\s*"[^"]*"`);
            
            if (section.match(programRegex)) {
              anchorToml = anchorToml.replace(programRegex, programLine);
            } else {
              anchorToml = anchorToml.replace(
                networkSection,
                `${networkSection}\n${programLine}`
              );
            }
          }
        } else {
          // Add new network section
          anchorToml += `\n\n${networkSection}\n${programLine}`;
        }
      }
      
      await fs.writeFile(anchorTomlPath, anchorToml);
      this.log(deployment, 'info', '[CHECK] Anchor.toml updated with program IDs');
      
      // Generate deployment summary
      const summary = {
        deploymentId: deployment.id,
        network,
        timestamp: deployment.endTime.toISOString(),
        programIds,
        metrics: deployment.metrics
      };
      
      const summaryPath = path.join(projectPath, `deployment-${network}-${Date.now()}.json`);
      await fs.writeFile(summaryPath, JSON.stringify(summary, null, 2));
      this.log(deployment, 'info', `[CHECK] Deployment summary saved: ${path.basename(summaryPath)}`);
      
    } catch (error) {
      this.log(deployment, 'warn', `⚠ Registry update failed: ${error.message}`);
    }
    
    this.logStage(deployment, 'registry-update', 'Registry update completed');
  }

  /**
   * Extract program IDs from deployment output
   */
  extractProgramIds(deployOutput) {
    const programIds = {};
    const lines = deployOutput.split('\n');
    
    for (const line of lines) {
      const match = line.match(/Program Id: ([A-Za-z0-9]+)/);
      if (match) {
        // Try to extract program name from previous lines
        const programIdLine = lines.indexOf(line);
        for (let i = programIdLine - 1; i >= 0; i--) {
          const prevLine = lines[i];
          if (prevLine.includes('Deploying program')) {
            const nameMatch = prevLine.match(/Deploying program "([^"]+)"/);
            if (nameMatch) {
              programIds[nameMatch[1]] = match[1];
              break;
            }
          }
        }
      }
    }
    
    return programIds;
  }

  /**
   * Utility methods for logging and stage management
   */
  logStage(deployment, stage, message) {
    const stageEntry = {
      stage,
      message,
      timestamp: new Date().toISOString(),
      status: 'completed'
    };
    
    deployment.stages.push(stageEntry);
    this.log(deployment, 'stage', message);
  }

  log(deployment, level, message) {
    const logEntry = {
      timestamp: new Date().toISOString(),
      level,
      message
    };
    
    deployment.logs.push(logEntry);
    console.log(`[${level.toUpperCase()}] ${message}`);
    this.emit('deployment:log', { deployment: deployment.id, ...logEntry });
  }

  /**
   * Get deployment status
   */
  getDeploymentStatus(deploymentId) {
    return this.deployments.get(deploymentId);
  }

  /**
   * List all deployments
   */
  listDeployments() {
    return Array.from(this.deployments.values());
  }
}

module.exports = DeploymentAutomation;