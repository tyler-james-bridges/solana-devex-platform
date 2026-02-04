/**
 * Solana Development Tooling Integrations
 * Utilities to integrate with anchor, solana-test-validator, and other dev tools
 */

const { exec, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const WebSocket = require('ws');

class SolanaToolingIntegration {
  constructor() {
    this.validatorProcess = null;
    this.rpcEndpoint = 'http://localhost:8899';
    this.wsEndpoint = 'ws://localhost:8900';
    this.validatorWebSocket = null;
  }

  // Test Validator Management
  async startTestValidator(options = {}) {
    const defaultOptions = {
      ledgerPath: './test-ledger',
      rpcPort: 8899,
      wsPort: 8900,
      resetLedger: true,
      quiet: false,
      log: true,
      cloneAccounts: [],
      programs: []
    };

    const config = { ...defaultOptions, ...options };
    
    if (this.validatorProcess) {
      throw new Error('Test validator is already running');
    }

    // Build command arguments
    const args = [
      '--ledger', config.ledgerPath,
      '--rpc-port', config.rpcPort.toString(),
      '--ws-port', config.wsPort.toString(),
      '--bind-address', '0.0.0.0'
    ];

    if (config.resetLedger) args.push('--reset');
    if (config.quiet) args.push('--quiet');
    if (config.log) args.push('--log', path.join(config.ledgerPath, 'validator.log'));

    // Add clone accounts
    config.cloneAccounts.forEach(account => {
      args.push('--clone', account);
    });

    // Add custom programs
    config.programs.forEach(program => {
      args.push('--bpf-program', program.id, program.path);
    });

    return new Promise((resolve, reject) => {
      this.validatorProcess = spawn('solana-test-validator', args, {
        stdio: config.quiet ? 'pipe' : 'inherit'
      });

      this.validatorProcess.on('spawn', () => {
        console.log('🚀 Test validator started');
        
        // Wait for validator to be ready
        this.waitForValidatorReady()
          .then(() => {
            this.setupValidatorWebSocket();
            resolve({ status: 'started', pid: this.validatorProcess.pid });
          })
          .catch(reject);
      });

      this.validatorProcess.on('error', (error) => {
        console.error('❌ Failed to start validator:', error);
        this.validatorProcess = null;
        reject(error);
      });

      this.validatorProcess.on('exit', (code, signal) => {
        console.log(`📴 Validator exited with code ${code}, signal ${signal}`);
        this.validatorProcess = null;
      });
    });
  }

  async stopTestValidator() {
    if (!this.validatorProcess) {
      throw new Error('Test validator is not running');
    }

    if (this.validatorWebSocket) {
      this.validatorWebSocket.close();
      this.validatorWebSocket = null;
    }

    return new Promise((resolve) => {
      this.validatorProcess.on('exit', () => {
        console.log('🛑 Test validator stopped');
        this.validatorProcess = null;
        resolve({ status: 'stopped' });
      });

      this.validatorProcess.kill('SIGTERM');
      
      // Force kill after 10 seconds if graceful shutdown fails
      setTimeout(() => {
        if (this.validatorProcess) {
          this.validatorProcess.kill('SIGKILL');
        }
      }, 10000);
    });
  }

  async getValidatorStatus() {
    if (!this.validatorProcess) {
      return { running: false };
    }

    try {
      const health = await this.rpcCall('getHealth');
      const slot = await this.rpcCall('getSlot');
      const blockHeight = await this.rpcCall('getBlockHeight');
      const version = await this.rpcCall('getVersion');
      
      return {
        running: true,
        healthy: health === 'ok',
        slot,
        blockHeight,
        version,
        pid: this.validatorProcess.pid
      };
    } catch (error) {
      return {
        running: true,
        healthy: false,
        error: error.message
      };
    }
  }

  async waitForValidatorReady(maxWaitMs = 30000) {
    const startTime = Date.now();
    
    while (Date.now() - startTime < maxWaitMs) {
      try {
        const health = await this.rpcCall('getHealth');
        if (health === 'ok') {
          return true;
        }
      } catch (error) {
        // Still waiting
      }
      
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    throw new Error('Validator failed to become ready within timeout');
  }

  setupValidatorWebSocket() {
    try {
      this.validatorWebSocket = new WebSocket(this.wsEndpoint);
      
      this.validatorWebSocket.on('open', () => {
        console.log('📡 Connected to validator WebSocket');
        
        // Subscribe to slot updates
        this.validatorWebSocket.send(JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'slotSubscribe'
        }));
      });

      this.validatorWebSocket.on('message', (data) => {
        const message = JSON.parse(data.toString());
        if (message.method === 'slotNotification') {
          // Handle slot updates
          this.onSlotUpdate && this.onSlotUpdate(message.params);
        }
      });

      this.validatorWebSocket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    } catch (error) {
      console.warn('Failed to setup validator WebSocket:', error);
    }
  }

  // Anchor Project Management
  async discoverAnchorProjects(searchPaths = ['./']) {
    const projects = [];

    for (const searchPath of searchPaths) {
      try {
        const entries = await fs.readdir(searchPath, { withFileTypes: true });
        
        for (const entry of entries) {
          if (entry.isDirectory()) {
            const projectPath = path.join(searchPath, entry.name);
            const anchorTomlPath = path.join(projectPath, 'Anchor.toml');
            
            try {
              await fs.access(anchorTomlPath);
              const project = await this.analyzeAnchorProject(projectPath);
              if (project) {
                projects.push(project);
              }
            } catch {
              // Not an Anchor project
            }
          }
        }
      } catch (error) {
        console.warn(`Error scanning ${searchPath}:`, error);
      }
    }

    return projects;
  }

  async analyzeAnchorProject(projectPath) {
    try {
      const anchorTomlPath = path.join(projectPath, 'Anchor.toml');
      const packageJsonPath = path.join(projectPath, 'package.json');
      
      // Read Anchor.toml
      const anchorToml = await fs.readFile(anchorTomlPath, 'utf8');
      const programs = this.parseAnchorPrograms(anchorToml, projectPath);
      
      // Check if package.json exists for TypeScript client
      let hasTypeScriptClient = false;
      try {
        await fs.access(packageJsonPath);
        hasTypeScriptClient = true;
      } catch {
        // No TypeScript client
      }

      // Check for test files
      const tests = await this.findTestFiles(projectPath);
      
      // Get git information
      const gitInfo = await this.getGitInfo(projectPath);
      
      return {
        name: path.basename(projectPath),
        path: projectPath,
        programs,
        hasTypeScriptClient,
        tests,
        gitInfo,
        lastAnalyzed: new Date().toISOString()
      };
    } catch (error) {
      console.error(`Error analyzing Anchor project at ${projectPath}:`, error);
      return null;
    }
  }

  parseAnchorPrograms(anchorToml, projectPath) {
    const programs = [];
    
    // Parse [programs.{network}] sections
    const programSections = anchorToml.match(/\[programs\.[^\]]+\][\s\S]*?(?=\n\[|\n\s*$)/g) || [];
    
    for (const section of programSections) {
      const networkMatch = section.match(/\[programs\.([^\]]+)\]/);
      const network = networkMatch ? networkMatch[1] : 'localnet';
      
      const programLines = section.split('\n').slice(1);
      for (const line of programLines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
          const [name, id] = trimmed.split('=').map(s => s.trim().replace(/"/g, ''));
          if (name && id) {
            programs.push({
              name,
              programId: id,
              network,
              idlPath: path.join(projectPath, 'target', 'idl', `${name}.json`),
              binaryPath: path.join(projectPath, 'target', 'deploy', `${name}.so`),
              sourcePath: path.join(projectPath, 'programs', name)
            });
          }
        }
      }
    }

    return programs;
  }

  async findTestFiles(projectPath) {
    const tests = [];
    const testsDir = path.join(projectPath, 'tests');
    
    try {
      const testFiles = await fs.readdir(testsDir);
      
      for (const file of testFiles) {
        if (file.endsWith('.ts') || file.endsWith('.js')) {
          const testPath = path.join(testsDir, file);
          const stats = await fs.stat(testPath);
          
          tests.push({
            file,
            path: testPath,
            lastModified: stats.mtime.toISOString(),
            size: stats.size
          });
        }
      }
    } catch {
      // No tests directory
    }

    return tests;
  }

  async getGitInfo(projectPath) {
    try {
      const { stdout: branch } = await this.execPromise('git rev-parse --abbrev-ref HEAD', { cwd: projectPath });
      const { stdout: commit } = await this.execPromise('git rev-parse --short HEAD', { cwd: projectPath });
      const { stdout: status } = await this.execPromise('git status --porcelain', { cwd: projectPath });
      
      return {
        branch: branch.trim(),
        commit: commit.trim(),
        hasUncommittedChanges: status.trim().length > 0,
        status: status.trim()
      };
    } catch (error) {
      return {
        branch: 'unknown',
        commit: 'unknown',
        hasUncommittedChanges: false,
        error: error.message
      };
    }
  }

  // Anchor Commands
  async buildAnchorProject(projectPath, options = {}) {
    const args = ['build'];
    
    if (options.verifiable) args.push('--verifiable');
    if (options.arch) args.push('--arch', options.arch);
    
    try {
      const { stdout, stderr } = await this.execPromise(`anchor ${args.join(' ')}`, { 
        cwd: projectPath,
        maxBuffer: 1024 * 1024 * 10 // 10MB buffer for large outputs
      });
      
      return {
        success: true,
        stdout,
        stderr,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        timestamp: new Date().toISOString()
      };
    }
  }

  async testAnchorProject(projectPath, options = {}) {
    const args = ['test'];
    
    if (options.skipBuild) args.push('--skip-build');
    if (options.skipDeploy) args.push('--skip-deploy');
    if (options.testFile) args.push(options.testFile);
    
    try {
      const { stdout, stderr } = await this.execPromise(`anchor ${args.join(' ')}`, { 
        cwd: projectPath,
        maxBuffer: 1024 * 1024 * 10
      });
      
      // Parse test results
      const results = this.parseTestOutput(stdout);
      
      return {
        success: true,
        results,
        stdout,
        stderr,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        results: this.parseTestOutput(error.stdout || ''),
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        timestamp: new Date().toISOString()
      };
    }
  }

  async deployAnchorProject(projectPath, network = 'localnet', options = {}) {
    // Set Solana config for network
    await this.setSolanaNetwork(network);
    
    const args = ['deploy'];
    if (options.programId) args.push('--program-id', options.programId);
    
    try {
      const { stdout, stderr } = await this.execPromise(`anchor ${args.join(' ')}`, {
        cwd: projectPath,
        maxBuffer: 1024 * 1024 * 10
      });
      
      // Parse deployment results
      const deployments = this.parseDeploymentOutput(stdout);
      
      return {
        success: true,
        deployments,
        network,
        stdout,
        stderr,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        stdout: error.stdout || '',
        stderr: error.stderr || '',
        timestamp: new Date().toISOString()
      };
    }
  }

  parseTestOutput(output) {
    const results = {
      passing: 0,
      failing: 0,
      pending: 0,
      tests: []
    };

    // Parse Mocha-style test output
    const passMatch = output.match(/(\d+) passing/);
    const failMatch = output.match(/(\d+) failing/);
    const pendingMatch = output.match(/(\d+) pending/);

    if (passMatch) results.passing = parseInt(passMatch[1]);
    if (failMatch) results.failing = parseInt(failMatch[1]);
    if (pendingMatch) results.pending = parseInt(pendingMatch[1]);

    // Parse individual test results
    const testMatches = output.match(/✓|×|⁃\s+.+/g) || [];
    for (const match of testMatches) {
      const status = match.startsWith('✓') ? 'pass' : 
                    match.startsWith('×') ? 'fail' : 'pending';
      const name = match.substring(2).trim();
      
      results.tests.push({ name, status });
    }

    return results;
  }

  parseDeploymentOutput(output) {
    const deployments = [];
    
    // Parse program deployment lines
    const programMatches = output.match(/Program Id: (\w+)/g) || [];
    const signatureMatches = output.match(/Signature: (\w+)/g) || [];
    
    for (let i = 0; i < programMatches.length; i++) {
      const programId = programMatches[i].replace('Program Id: ', '');
      const signature = signatureMatches[i] ? signatureMatches[i].replace('Signature: ', '') : null;
      
      deployments.push({
        programId,
        signature,
        timestamp: new Date().toISOString()
      });
    }
    
    return deployments;
  }

  // RPC Utilities
  async rpcCall(method, params = []) {
    const response = await fetch(this.rpcEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: Math.floor(Math.random() * 1000000),
        method,
        params
      })
    });

    const data = await response.json();
    
    if (data.error) {
      throw new Error(`RPC Error: ${data.error.message}`);
    }
    
    return data.result;
  }

  async getAccountInfo(address) {
    return this.rpcCall('getAccountInfo', [address, { encoding: 'base64' }]);
  }

  async getBalance(address) {
    const lamports = await this.rpcCall('getBalance', [address]);
    return lamports / 1000000000; // Convert to SOL
  }

  async getRecentTransactions(address, limit = 10) {
    const signatures = await this.rpcCall('getSignaturesForAddress', [address, { limit }]);
    const transactions = [];
    
    for (const sig of signatures) {
      try {
        const tx = await this.rpcCall('getTransaction', [
          sig.signature, 
          { encoding: 'json', maxSupportedTransactionVersion: 0 }
        ]);
        
        if (tx) {
          transactions.push({
            signature: sig.signature,
            slot: sig.slot,
            timestamp: sig.blockTime ? new Date(sig.blockTime * 1000).toISOString() : null,
            status: sig.err ? 'failed' : 'success',
            fee: tx.meta?.fee || 0,
            computeUnitsUsed: tx.meta?.computeUnitsConsumed || 0
          });
        }
      } catch (error) {
        console.warn(`Failed to get transaction ${sig.signature}:`, error);
      }
    }
    
    return transactions;
  }

  // Network Management
  async setSolanaNetwork(network) {
    const networkUrls = {
      localnet: 'http://localhost:8899',
      devnet: 'https://api.devnet.solana.com',
      testnet: 'https://api.testnet.solana.com',
      mainnet: 'https://api.mainnet-beta.solana.com'
    };

    const url = networkUrls[network];
    if (!url) {
      throw new Error(`Unknown network: ${network}`);
    }

    try {
      await this.execPromise(`solana config set --url ${url}`);
      this.rpcEndpoint = url;
      return { network, url };
    } catch (error) {
      throw new Error(`Failed to set network to ${network}: ${error.message}`);
    }
  }

  async getCurrentNetwork() {
    try {
      const { stdout } = await this.execPromise('solana config get');
      const urlMatch = stdout.match(/RPC URL: (.+)/);
      
      if (urlMatch) {
        const url = urlMatch[1].trim();
        
        if (url.includes('localhost') || url.includes('127.0.0.1')) return 'localnet';
        if (url.includes('devnet')) return 'devnet';
        if (url.includes('testnet')) return 'testnet';
        if (url.includes('mainnet')) return 'mainnet';
        
        return url; // Return full URL if not recognized
      }
      
      return 'unknown';
    } catch (error) {
      console.warn('Failed to get current network:', error);
      return 'unknown';
    }
  }

  // Utility methods
  execPromise(command, options = {}) {
    return new Promise((resolve, reject) => {
      exec(command, options, (error, stdout, stderr) => {
        if (error) {
          error.stdout = stdout;
          error.stderr = stderr;
          reject(error);
        } else {
          resolve({ stdout, stderr });
        }
      });
    });
  }

  // Event handlers (can be overridden)
  onSlotUpdate(slotInfo) {
    // Override this to handle slot updates
    console.log('Slot update:', slotInfo);
  }

  onValidatorExit(code, signal) {
    // Override this to handle validator exit
    console.log('Validator exited:', code, signal);
  }
}

module.exports = { SolanaToolingIntegration };