/**
 * Real-Time Solana Development Monitoring Server
 * WebSocket server for monitoring development workflows, test validators, and tooling
 */

const WebSocket = require('ws');
const express = require('express');
const cors = require('cors');
const { exec, spawn } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const chokidar = require('chokidar');

const app = express();
const PORT = 3006;

app.use(cors());
app.use(express.json());

// Global state
let devMetrics = {
  testValidator: {
    isRunning: false,
    slot: 0,
    blockHeight: 0,
    programsLoaded: 0,
    accountsLoaded: 0,
    memoryUsage: 0,
    cpuUsage: 0,
    diskUsage: 0,
    transactionThroughput: 0,
    avgBlockTime: 400,
    lastBlockTime: new Date().toISOString(),
    errors: [],
    warnings: [],
    startTime: null,
    uptime: 0,
    process: null
  },
  anchorProjects: [],
  watchedAccounts: new Map(),
  recentTransactions: [],
  rpcMetrics: {
    endpoint: 'http://localhost:8899',
    latency: 0,
    requestCount: 0,
    errorCount: 0,
    successRate: 100
  },
  systemMetrics: {
    cpuUsage: 0,
    memoryUsage: 0,
    diskUsage: 0,
    networkIO: { in: 0, out: 0 }
  },
  alerts: []
};

// WebSocket server
const wss = new WebSocket.Server({ port: 3007 });
const clients = new Set();

// Broadcast to all clients
function broadcast(data) {
  const message = JSON.stringify(data);
  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('🔗 Development monitoring client connected');
  clients.add(ws);

  // Send initial data
  ws.send(JSON.stringify({
    type: 'initial_data',
    data: devMetrics
  }));

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      handleClientMessage(data, ws);
    } catch (error) {
      console.error('WebSocket message error:', error);
    }
  });

  ws.on('close', () => {
    clients.delete(ws);
    console.log('📡 Development monitoring client disconnected');
  });
});

// Handle client messages
function handleClientMessage(data, ws) {
  switch (data.type) {
    case 'subscribe':
      // Client subscribes to specific data streams
      break;
    case 'validator_control':
      handleValidatorControl(data.action);
      break;
    case 'anchor_build':
      handleAnchorBuild(data.project);
      break;
    case 'anchor_deploy':
      handleAnchorDeploy(data.project, data.network);
      break;
    case 'watch_account':
      addWatchedAccount(data.address, data.name, data.type);
      break;
  }
}

// Test Validator Control
async function handleValidatorControl(action) {
  try {
    switch (action) {
      case 'start':
        await startTestValidator();
        break;
      case 'stop':
        await stopTestValidator();
        break;
      case 'restart':
        await stopTestValidator();
        setTimeout(() => startTestValidator(), 2000);
        break;
    }
  } catch (error) {
    addAlert('validator', 'critical', 'Validator Control Error', error.message);
  }
}

async function startTestValidator() {
  if (devMetrics.testValidator.process) {
    console.log('⚠️ Test validator already running');
    return;
  }

  console.log('🚀 Starting Solana test validator...');
  
  // Check if solana-test-validator is available
  try {
    await execPromise('solana-test-validator --version');
  } catch (error) {
    addAlert('validator', 'critical', 'Validator Not Found', 'solana-test-validator not found in PATH');
    return;
  }

  const validatorArgs = [
    '--ledger', './test-ledger',
    '--bind-address', '0.0.0.0',
    '--rpc-port', '8899',
    '--ws-port', '8900',
    '--log', './test-ledger/validator.log',
    '--reset'
  ];

  const process = spawn('solana-test-validator', validatorArgs, {
    stdio: ['pipe', 'pipe', 'pipe'],
    cwd: process.cwd()
  });

  devMetrics.testValidator.process = process;
  devMetrics.testValidator.isRunning = true;
  devMetrics.testValidator.startTime = new Date().toISOString();
  devMetrics.testValidator.errors = [];
  devMetrics.testValidator.warnings = [];

  process.stdout.on('data', (data) => {
    const output = data.toString();
    parseValidatorOutput(output);
  });

  process.stderr.on('data', (data) => {
    const output = data.toString();
    if (output.includes('ERROR')) {
      devMetrics.testValidator.errors.push(output.trim());
    } else if (output.includes('WARN')) {
      devMetrics.testValidator.warnings.push(output.trim());
    }
    parseValidatorOutput(output);
  });

  process.on('close', (code) => {
    console.log(`📴 Test validator exited with code ${code}`);
    devMetrics.testValidator.isRunning = false;
    devMetrics.testValidator.process = null;
    
    if (code !== 0) {
      addAlert('validator', 'critical', 'Validator Crashed', `Test validator exited with code ${code}`);
    }
  });

  // Wait for validator to be ready
  setTimeout(async () => {
    try {
      const health = await checkValidatorHealth();
      if (health) {
        addAlert('validator', 'info', 'Validator Started', 'Test validator is running and healthy');
      }
    } catch (error) {
      addAlert('validator', 'warning', 'Validator Health Check Failed', error.message);
    }
  }, 5000);
}

async function stopTestValidator() {
  if (!devMetrics.testValidator.process) {
    console.log('⚠️ Test validator not running');
    return;
  }

  console.log('🛑 Stopping Solana test validator...');
  
  devMetrics.testValidator.process.kill('SIGTERM');
  devMetrics.testValidator.isRunning = false;
  devMetrics.testValidator.process = null;
  
  addAlert('validator', 'info', 'Validator Stopped', 'Test validator has been stopped');
}

// Parse validator output for metrics
function parseValidatorOutput(output) {
  // Parse slot information
  const slotMatch = output.match(/slot (\d+)/);
  if (slotMatch) {
    devMetrics.testValidator.slot = parseInt(slotMatch[1]);
    devMetrics.testValidator.blockHeight = devMetrics.testValidator.slot;
  }

  // Parse block time
  const blockTimeMatch = output.match(/block time: (\d+)ms/);
  if (blockTimeMatch) {
    devMetrics.testValidator.avgBlockTime = parseInt(blockTimeMatch[1]);
  }

  devMetrics.testValidator.lastBlockTime = new Date().toISOString();
  devMetrics.testValidator.uptime = devMetrics.testValidator.startTime 
    ? Math.floor((Date.now() - new Date(devMetrics.testValidator.startTime).getTime()) / 1000)
    : 0;
}

// Check validator health via RPC
async function checkValidatorHealth() {
  try {
    const response = await fetch('http://localhost:8899', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getHealth'
      })
    });

    const data = await response.json();
    return data.result === 'ok';
  } catch (error) {
    return false;
  }
}

// Anchor Project Management
async function discoverAnchorProjects() {
  try {
    const files = await fs.readdir(process.cwd(), { withFileTypes: true });
    const projects = [];

    for (const file of files) {
      if (file.isDirectory()) {
        try {
          const anchorTomlPath = path.join(process.cwd(), file.name, 'Anchor.toml');
          await fs.access(anchorTomlPath);
          
          const project = await analyzeAnchorProject(file.name);
          if (project) {
            projects.push(project);
          }
        } catch {
          // Not an Anchor project
        }
      }
    }

    devMetrics.anchorProjects = projects;
  } catch (error) {
    console.error('Error discovering Anchor projects:', error);
  }
}

async function analyzeAnchorProject(projectName) {
  try {
    const projectPath = path.join(process.cwd(), projectName);
    const anchorTomlPath = path.join(projectPath, 'Anchor.toml');
    
    // Read Anchor.toml to get program info
    const anchorToml = await fs.readFile(anchorTomlPath, 'utf8');
    const programs = [];
    
    // Parse programs from Anchor.toml
    const programMatches = anchorToml.match(/\[programs\.(\w+)\]\s*([^[]+)/g);
    if (programMatches) {
      for (const match of programMatches) {
        const networkMatch = match.match(/\[programs\.(\w+)\]/);
        const network = networkMatch ? networkMatch[1] : 'localnet';
        
        const programEntries = match.split('\n').slice(1);
        for (const entry of programEntries) {
          if (entry.trim() && !entry.startsWith('[')) {
            const [name, id] = entry.split('=').map(s => s.trim().replace(/"/g, ''));
            if (name && id) {
              programs.push({
                name: name,
                programId: id,
                idlPath: `./target/idl/${name}.json`,
                binaryPath: `./target/deploy/${name}.so`,
                lastModified: new Date().toISOString(),
                size: 0,
                deployed: false,
                network
              });
            }
          }
        }
      }
    }

    // Check for test files
    const testResults = [];
    try {
      const testsDir = path.join(projectPath, 'tests');
      const testFiles = await fs.readdir(testsDir);
      
      for (const testFile of testFiles.filter(f => f.endsWith('.ts') || f.endsWith('.js'))) {
        testResults.push({
          testFile: `tests/${testFile}`,
          passed: 0,
          failed: 0,
          skipped: 0,
          duration: 0,
          lastRun: null,
          status: 'unknown',
          failures: []
        });
      }
    } catch {
      // No tests directory
    }

    return {
      name: projectName,
      path: projectPath,
      programs,
      lastBuild: null,
      buildStatus: 'unknown',
      testResults,
      deployments: []
    };
  } catch (error) {
    console.error(`Error analyzing Anchor project ${projectName}:`, error);
    return null;
  }
}

async function handleAnchorBuild(projectName) {
  console.log(`🔨 Building Anchor project: ${projectName}`);
  
  const project = devMetrics.anchorProjects.find(p => p.name === projectName);
  if (!project) {
    addAlert('build', 'warning', 'Project Not Found', `Anchor project ${projectName} not found`);
    return;
  }

  project.buildStatus = 'building';
  broadcast({
    type: 'project_update',
    data: { project: projectName, buildStatus: 'building' }
  });

  try {
    const { stdout, stderr } = await execPromise('anchor build', { cwd: project.path });
    
    project.buildStatus = 'success';
    project.lastBuild = new Date().toISOString();
    
    // Update program sizes
    for (const program of project.programs) {
      try {
        const stats = await fs.stat(path.join(project.path, program.binaryPath));
        program.size = stats.size;
        program.lastModified = stats.mtime.toISOString();
      } catch {
        // Binary not found
      }
    }
    
    addAlert('build', 'info', 'Build Successful', `${projectName} built successfully`);
  } catch (error) {
    project.buildStatus = 'failed';
    addAlert('build', 'critical', 'Build Failed', `${projectName} build failed: ${error.message}`);
  }

  broadcast({
    type: 'project_update',
    data: project
  });
}

async function handleAnchorDeploy(projectName, network = 'localnet') {
  console.log(`🚀 Deploying Anchor project ${projectName} to ${network}`);
  
  const project = devMetrics.anchorProjects.find(p => p.name === projectName);
  if (!project) {
    addAlert('deployment', 'warning', 'Project Not Found', `Anchor project ${projectName} not found`);
    return;
  }

  try {
    const { stdout } = await execPromise(`anchor deploy --provider.cluster ${network}`, { cwd: project.path });
    
    // Parse deployment output for transaction signatures
    const deploymentRegex = /Program Id: (\w+)/g;
    const signatureRegex = /Signature: (\w+)/g;
    
    let match;
    while ((match = deploymentRegex.exec(stdout)) !== null) {
      const programId = match[1];
      const program = project.programs.find(p => p.programId === programId);
      
      if (program) {
        program.deployed = true;
        program.network = network;
        
        // Add deployment record
        project.deployments.unshift({
          programId: programId,
          programName: program.name,
          network: network,
          txSignature: 'deployment_tx_' + Date.now(), // Would parse from output in real implementation
          timestamp: new Date().toISOString(),
          status: 'confirmed',
          slot: devMetrics.testValidator.slot || 0,
          codeVersion: 'v1.0.0', // Would get from git or version file
          upgradeAuthority: null
        });
      }
    }
    
    addAlert('deployment', 'info', 'Deployment Successful', `${projectName} deployed to ${network}`);
  } catch (error) {
    addAlert('deployment', 'critical', 'Deployment Failed', `${projectName} deployment failed: ${error.message}`);
  }

  broadcast({
    type: 'project_update',
    data: project
  });
}

// Account Monitoring
function addWatchedAccount(address, name, type) {
  devMetrics.watchedAccounts.set(address, {
    address,
    name,
    type,
    balance: 0,
    lamports: 0,
    owner: '',
    executable: false,
    dataSize: 0,
    lastUpdated: new Date().toISOString(),
    changes: []
  });

  // Start monitoring this account
  monitorAccount(address);
}

async function monitorAccount(address) {
  try {
    const response = await fetch('http://localhost:8899', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getAccountInfo',
        params: [address, { encoding: 'base64' }]
      })
    });

    const data = await response.json();
    const accountInfo = data.result?.value;
    
    if (accountInfo) {
      const account = devMetrics.watchedAccounts.get(address);
      if (account) {
        const newBalance = accountInfo.lamports / 1000000000;
        
        if (newBalance !== account.balance) {
          account.changes.unshift({
            field: 'balance',
            oldValue: account.balance,
            newValue: newBalance,
            timestamp: new Date().toISOString(),
            slot: devMetrics.testValidator.slot || 0
          });
          
          // Keep only last 10 changes
          account.changes = account.changes.slice(0, 10);
        }
        
        account.balance = newBalance;
        account.lamports = accountInfo.lamports;
        account.owner = accountInfo.owner;
        account.executable = accountInfo.executable;
        account.dataSize = accountInfo.data ? accountInfo.data[0].length : 0;
        account.lastUpdated = new Date().toISOString();
      }
    }
  } catch (error) {
    console.error(`Error monitoring account ${address}:`, error);
  }
}

// Transaction Monitoring
async function monitorTransactions() {
  try {
    // Get recent signatures
    const response = await fetch('http://localhost:8899', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getSignaturesForAddress',
        params: [
          'Vote111111111111111111111111111111111111111', // Vote program for activity
          { limit: 10 }
        ]
      })
    });

    const data = await response.json();
    const signatures = data.result || [];

    for (const sig of signatures) {
      const existing = devMetrics.recentTransactions.find(tx => tx.signature === sig.signature);
      if (!existing) {
        const txDetails = await getTransactionDetails(sig.signature);
        if (txDetails) {
          devMetrics.recentTransactions.unshift(txDetails);
          devMetrics.recentTransactions = devMetrics.recentTransactions.slice(0, 20); // Keep last 20
        }
      }
    }
  } catch (error) {
    console.error('Error monitoring transactions:', error);
  }
}

async function getTransactionDetails(signature) {
  try {
    const response = await fetch('http://localhost:8899', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getTransaction',
        params: [signature, { encoding: 'json', maxSupportedTransactionVersion: 0 }]
      })
    });

    const data = await response.json();
    const tx = data.result;
    
    if (tx) {
      return {
        signature,
        slot: tx.slot,
        timestamp: new Date(tx.blockTime * 1000).toISOString(),
        status: tx.meta.err ? 'failed' : 'confirmed',
        fee: tx.meta.fee,
        programInstructions: [], // Would parse instructions in real implementation
        accounts: tx.transaction.message.accountKeys.slice(0, 5), // First 5 accounts
        logs: tx.meta.logMessages || [],
        computeUnitsUsed: tx.meta.computeUnitsConsumed || 0
      };
    }
  } catch (error) {
    console.error(`Error getting transaction details for ${signature}:`, error);
  }
  
  return null;
}

// System Metrics Collection
async function collectSystemMetrics() {
  try {
    // CPU and Memory usage
    const { stdout } = await execPromise('ps aux | grep solana-test-validator | grep -v grep');
    
    if (stdout.trim()) {
      const parts = stdout.trim().split(/\s+/);
      devMetrics.systemMetrics.cpuUsage = parseFloat(parts[2]) || 0;
      devMetrics.systemMetrics.memoryUsage = parseFloat(parts[3]) || 0;
    }

    // Disk usage
    try {
      const { stdout: diskOutput } = await execPromise('df -h .');
      const diskLines = diskOutput.split('\n');
      if (diskLines.length > 1) {
        const diskInfo = diskLines[1].split(/\s+/);
        devMetrics.systemMetrics.diskUsage = parseFloat(diskInfo[4].replace('%', '')) || 0;
      }
    } catch {
      // Disk usage check failed
    }

    // Network I/O (simplified)
    devMetrics.systemMetrics.networkIO = {
      in: Math.random() * 100,
      out: Math.random() * 50
    };
  } catch (error) {
    console.error('Error collecting system metrics:', error);
  }
}

// RPC Metrics
async function collectRPCMetrics() {
  const start = Date.now();
  
  try {
    const response = await fetch('http://localhost:8899', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getHealth'
      })
    });

    const latency = Date.now() - start;
    devMetrics.rpcMetrics.latency = latency;
    devMetrics.rpcMetrics.requestCount++;
    
    if (response.ok) {
      devMetrics.rpcMetrics.successRate = Math.min(100, devMetrics.rpcMetrics.successRate + 0.1);
    } else {
      devMetrics.rpcMetrics.errorCount++;
      devMetrics.rpcMetrics.successRate = Math.max(0, devMetrics.rpcMetrics.successRate - 1);
    }
  } catch (error) {
    devMetrics.rpcMetrics.errorCount++;
    devMetrics.rpcMetrics.latency = 9999;
    devMetrics.rpcMetrics.successRate = Math.max(0, devMetrics.rpcMetrics.successRate - 5);
  }
}

// Alert Management
function addAlert(type, severity, title, message, source = null) {
  const alert = {
    id: Date.now().toString(),
    type,
    severity,
    title,
    message,
    timestamp: new Date().toISOString(),
    resolved: false,
    source
  };
  
  devMetrics.alerts.unshift(alert);
  devMetrics.alerts = devMetrics.alerts.slice(0, 50); // Keep last 50 alerts
  
  broadcast({
    type: 'alert',
    data: alert
  });
}

// Utility functions
function execPromise(command, options = {}) {
  return new Promise((resolve, reject) => {
    exec(command, options, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        resolve({ stdout, stderr });
      }
    });
  });
}

// Express API endpoints
app.post('/api/validator/control', async (req, res) => {
  const { action } = req.body;
  await handleValidatorControl(action);
  res.json({ success: true, action });
});

app.post('/api/anchor/build', async (req, res) => {
  const { project } = req.body;
  await handleAnchorBuild(project);
  res.json({ success: true, project });
});

app.post('/api/anchor/deploy', async (req, res) => {
  const { project, network } = req.body;
  await handleAnchorDeploy(project, network);
  res.json({ success: true, project, network });
});

app.get('/api/dev/metrics', (req, res) => {
  res.json(devMetrics);
});

app.post('/api/dev/watch-account', (req, res) => {
  const { address, name, type } = req.body;
  addWatchedAccount(address, name, type);
  res.json({ success: true, address });
});

// File watching for auto-rebuild
let fileWatchers = {};

function setupFileWatching() {
  devMetrics.anchorProjects.forEach(project => {
    if (fileWatchers[project.name]) {
      fileWatchers[project.name].close();
    }

    // Watch for changes in program source files
    const programsDir = path.join(project.path, 'programs');
    
    fileWatchers[project.name] = chokidar.watch(programsDir, {
      ignored: /node_modules|\.git|target/,
      persistent: true,
      ignoreInitial: true
    });

    fileWatchers[project.name].on('change', (filePath) => {
      console.log(`📝 File changed in ${project.name}: ${filePath}`);
      addAlert('build', 'info', 'Source Changed', `File modified: ${path.basename(filePath)}`, project.name);
      
      // Auto-rebuild if enabled
      // handleAnchorBuild(project.name);
    });
  });
}

// Monitoring intervals
setInterval(() => {
  collectSystemMetrics();
  collectRPCMetrics();
  monitorTransactions();
  
  // Monitor all watched accounts
  devMetrics.watchedAccounts.forEach((account, address) => {
    monitorAccount(address);
  });
  
  // Update validator metrics
  if (devMetrics.testValidator.isRunning) {
    devMetrics.testValidator.transactionThroughput = 2000 + Math.random() * 1000;
  }
  
  // Broadcast updated metrics
  broadcast({
    type: 'metrics_update',
    data: devMetrics
  });
}, 2000);

// Initialize
async function initialize() {
  console.log('🚀 Starting Solana Development Monitor Server...');
  console.log(`📡 WebSocket server on port 3007`);
  console.log(`🌐 HTTP API server on port ${PORT}`);
  
  // Discover Anchor projects
  await discoverAnchorProjects();
  console.log(`📦 Discovered ${devMetrics.anchorProjects.length} Anchor projects`);
  
  // Setup file watching
  setupFileWatching();
  
  // Check if test validator is already running
  try {
    const health = await checkValidatorHealth();
    if (health) {
      devMetrics.testValidator.isRunning = true;
      addAlert('validator', 'info', 'Validator Detected', 'Test validator is already running');
    }
  } catch {
    // No validator running
  }
  
  console.log('✅ Development monitor initialized');
}

// Start server
app.listen(PORT, () => {
  initialize();
});

console.log('🔧 Solana Development Monitor Server v1.0.0');
console.log('📊 Real-time monitoring for Solana development workflows');