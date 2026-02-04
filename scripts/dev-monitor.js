#!/usr/bin/env node

/**
 * Solana Development Monitor CLI
 * Easy setup and management of the development monitoring dashboard
 */

const { program } = require('commander');
const { spawn, exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const chalk = require('chalk');

// Package info
const packageJson = require('../package.json');

program
  .name('solana-dev-monitor')
  .description('CLI for Solana Development Monitoring Dashboard')
  .version(packageJson.version);

// Global options
program
  .option('-v, --verbose', 'Enable verbose logging')
  .option('--config <path>', 'Path to config file', './dev-monitor.config.json');

// Start command
program
  .command('start')
  .description('Start the development monitoring dashboard')
  .option('-p, --port <port>', 'Dashboard port', '3000')
  .option('--api-port <port>', 'API server port', '3006')
  .option('--ws-port <port>', 'WebSocket port', '3007')
  .option('--validator-port <port>', 'Test validator RPC port', '8899')
  .option('--no-validator', 'Don\'t start test validator automatically')
  .option('--no-browser', 'Don\'t open browser automatically')
  .option('--watch <paths>', 'Additional paths to watch for changes', collectPaths, [])
  .action(async (options) => {
    console.log(chalk.blue.bold('🚀 Starting Solana Development Monitor'));
    console.log(chalk.gray(`Dashboard: http://localhost:${options.port}/dev-monitor`));
    console.log(chalk.gray(`API Server: http://localhost:${options.apiPort}`));
    console.log(chalk.gray(`WebSocket: ws://localhost:${options.wsPort}`));
    
    try {
      // Load config
      const config = await loadConfig(options.config);
      const mergedConfig = { ...config, ...options };
      
      // Check prerequisites
      await checkPrerequisites();
      
      // Start services
      const services = await startServices(mergedConfig);
      
      // Setup graceful shutdown
      setupShutdown(services);
      
      console.log(chalk.green.bold('✅ Development monitor started successfully!'));
      
      if (!options.noBrowser) {
        setTimeout(() => openBrowser(`http://localhost:${options.port}/dev-monitor`), 2000);
      }
      
      // Keep process alive
      process.stdin.setRawMode(true);
      process.stdin.resume();
      console.log(chalk.yellow('\nPress Ctrl+C to stop all services'));
      
    } catch (error) {
      console.error(chalk.red.bold('❌ Failed to start development monitor:'), error.message);
      process.exit(1);
    }
  });

// Stop command
program
  .command('stop')
  .description('Stop all monitoring services')
  .action(async () => {
    console.log(chalk.blue.bold('🛑 Stopping development monitor services...'));
    
    try {
      await stopServices();
      console.log(chalk.green.bold('✅ All services stopped'));
    } catch (error) {
      console.error(chalk.red.bold('❌ Error stopping services:'), error.message);
      process.exit(1);
    }
  });

// Status command
program
  .command('status')
  .description('Check status of monitoring services')
  .action(async () => {
    console.log(chalk.blue.bold('📊 Service Status'));
    
    const services = [
      { name: 'Dashboard', port: 3000 },
      { name: 'API Server', port: 3006 },
      { name: 'WebSocket Server', port: 3007 },
      { name: 'Test Validator', port: 8899 }
    ];
    
    for (const service of services) {
      const status = await checkServiceStatus(service.port);
      const icon = status ? '🟢' : '🔴';
      const statusText = status ? 'Running' : 'Stopped';
      console.log(`${icon} ${service.name}: ${statusText} (port ${service.port})`);
    }
  });

// Setup command
program
  .command('setup')
  .description('Setup development monitoring for a project')
  .option('--project-path <path>', 'Project path', process.cwd())
  .action(async (options) => {
    console.log(chalk.blue.bold('⚙️ Setting up development monitoring'));
    
    try {
      const projectPath = path.resolve(options.projectPath);
      await setupProject(projectPath);
      console.log(chalk.green.bold('✅ Setup completed!'));
    } catch (error) {
      console.error(chalk.red.bold('❌ Setup failed:'), error.message);
      process.exit(1);
    }
  });

// Config command
program
  .command('config')
  .description('Manage configuration')
  .option('--init', 'Initialize default config')
  .option('--show', 'Show current config')
  .option('--edit', 'Edit config file')
  .action(async (options) => {
    if (options.init) {
      await initConfig();
      console.log(chalk.green.bold('✅ Config initialized'));
    } else if (options.show) {
      const config = await loadConfig();
      console.log(chalk.blue.bold('📋 Current Configuration:'));
      console.log(JSON.stringify(config, null, 2));
    } else if (options.edit) {
      await editConfig();
    } else {
      console.log(chalk.yellow('Use --init, --show, or --edit'));
    }
  });

// Utility functions
function collectPaths(value, previous) {
  return previous.concat([value]);
}

async function loadConfig(configPath = './dev-monitor.config.json') {
  try {
    const configFile = await fs.readFile(configPath, 'utf8');
    return JSON.parse(configFile);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return getDefaultConfig();
    }
    throw error;
  }
}

function getDefaultConfig() {
  return {
    dashboard: {
      port: 3000,
      autoOpen: true
    },
    api: {
      port: 3006,
      cors: true
    },
    websocket: {
      port: 3007
    },
    validator: {
      port: 8899,
      wsPort: 8900,
      autoStart: true,
      resetOnStart: true
    },
    monitoring: {
      watchPaths: ['./programs', './tests'],
      accountsToWatch: [],
      alertThresholds: {
        memoryUsage: 80,
        cpuUsage: 90,
        blockTime: 1000
      }
    },
    integrations: {
      anchor: true,
      git: true,
      slack: false,
      discord: false
    }
  };
}

async function initConfig() {
  const configPath = './dev-monitor.config.json';
  const config = getDefaultConfig();
  
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  console.log(chalk.green(`Config created at ${configPath}`));
}

async function checkPrerequisites() {
  const requirements = [
    { name: 'node', command: 'node --version' },
    { name: 'solana', command: 'solana --version' },
    { name: 'anchor', command: 'anchor --version', optional: true }
  ];
  
  for (const req of requirements) {
    try {
      await execPromise(req.command);
      console.log(chalk.green(`✅ ${req.name} found`));
    } catch (error) {
      if (req.optional) {
        console.log(chalk.yellow(`⚠️ ${req.name} not found (optional)`));
      } else {
        throw new Error(`${req.name} is required but not found`);
      }
    }
  }
}

async function startServices(config) {
  const services = {};
  
  console.log(chalk.blue('🔧 Starting services...'));
  
  // Start API server
  console.log(chalk.gray('Starting API server...'));
  services.api = spawn('node', [path.join(__dirname, '../api/dev-monitor-server.js')], {
    stdio: config.verbose ? 'inherit' : 'pipe',
    env: { 
      ...process.env, 
      PORT: config.apiPort,
      WS_PORT: config.wsPort
    }
  });
  
  services.api.on('error', (error) => {
    console.error(chalk.red('API server error:'), error);
  });
  
  // Wait for API server to start
  await new Promise((resolve) => setTimeout(resolve, 2000));
  
  // Start test validator if enabled
  if (config.validator !== false) {
    console.log(chalk.gray('Starting test validator...'));
    const validatorArgs = [
      '--ledger', './test-ledger',
      '--rpc-port', config.validatorPort || '8899',
      '--ws-port', config.validator?.wsPort || '8900',
      '--bind-address', '0.0.0.0'
    ];
    
    if (config.validator?.resetOnStart !== false) {
      validatorArgs.push('--reset');
    }
    
    services.validator = spawn('solana-test-validator', validatorArgs, {
      stdio: config.verbose ? 'inherit' : 'pipe'
    });
    
    services.validator.on('error', (error) => {
      console.warn(chalk.yellow('Test validator error:'), error.message);
    });
    
    // Wait for validator to start
    await new Promise((resolve) => setTimeout(resolve, 5000));
  }
  
  // Start Next.js dashboard
  console.log(chalk.gray('Starting dashboard...'));
  services.dashboard = spawn('npm', ['run', 'dev'], {
    stdio: config.verbose ? 'inherit' : 'pipe',
    env: { 
      ...process.env, 
      PORT: config.port || '3000'
    },
    cwd: path.resolve(__dirname, '..')
  });
  
  services.dashboard.on('error', (error) => {
    console.error(chalk.red('Dashboard error:'), error);
  });
  
  return services;
}

async function stopServices() {
  // Kill processes by port
  const ports = [3000, 3006, 3007, 8899, 8900];
  
  for (const port of ports) {
    try {
      await killProcessOnPort(port);
    } catch (error) {
      console.warn(chalk.yellow(`Warning: Could not kill process on port ${port}`));
    }
  }
}

async function killProcessOnPort(port) {
  try {
    const { stdout } = await execPromise(`lsof -ti:${port}`);
    const pids = stdout.trim().split('\n').filter(pid => pid);
    
    for (const pid of pids) {
      await execPromise(`kill -9 ${pid}`);
    }
  } catch (error) {
    // Process not found on port
  }
}

async function checkServiceStatus(port) {
  try {
    await execPromise(`lsof -ti:${port}`);
    return true;
  } catch (error) {
    return false;
  }
}

async function setupProject(projectPath) {
  console.log(chalk.blue(`Setting up monitoring for: ${projectPath}`));
  
  // Check if it's an Anchor project
  const anchorTomlPath = path.join(projectPath, 'Anchor.toml');
  let isAnchorProject = false;
  
  try {
    await fs.access(anchorTomlPath);
    isAnchorProject = true;
    console.log(chalk.green('✅ Anchor project detected'));
  } catch {
    console.log(chalk.yellow('⚠️ Not an Anchor project'));
  }
  
  // Create dev monitor config
  const config = getDefaultConfig();
  
  if (isAnchorProject) {
    config.monitoring.watchPaths = ['./programs', './tests', './app'];
    config.integrations.anchor = true;
  } else {
    config.monitoring.watchPaths = ['./src', './tests'];
    config.integrations.anchor = false;
  }
  
  const configPath = path.join(projectPath, 'dev-monitor.config.json');
  await fs.writeFile(configPath, JSON.stringify(config, null, 2));
  
  console.log(chalk.green(`Config created: ${configPath}`));
  
  // Add to .gitignore
  const gitignorePath = path.join(projectPath, '.gitignore');
  try {
    let gitignore = await fs.readFile(gitignorePath, 'utf8');
    if (!gitignore.includes('test-ledger')) {
      gitignore += '\n# Solana Dev Monitor\ntest-ledger/\ndev-monitor.log\n';
      await fs.writeFile(gitignorePath, gitignore);
      console.log(chalk.green('✅ Updated .gitignore'));
    }
  } catch {
    // Create .gitignore
    const gitignoreContent = `# Solana Dev Monitor
test-ledger/
dev-monitor.log
`;
    await fs.writeFile(gitignorePath, gitignoreContent);
    console.log(chalk.green('✅ Created .gitignore'));
  }
  
  // Create NPM script
  try {
    const packageJsonPath = path.join(projectPath, 'package.json');
    const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf8'));
    
    if (!packageJson.scripts) packageJson.scripts = {};
    packageJson.scripts['dev:monitor'] = 'npx solana-dev-monitor start';
    
    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(chalk.green('✅ Added npm script: npm run dev:monitor'));
  } catch {
    console.log(chalk.yellow('⚠️ Could not update package.json'));
  }
}

function setupShutdown(services) {
  const shutdown = () => {
    console.log(chalk.blue('\n🛑 Shutting down services...'));
    
    Object.values(services).forEach(service => {
      if (service && service.kill) {
        service.kill('SIGTERM');
      }
    });
    
    setTimeout(() => {
      console.log(chalk.green('✅ Goodbye!'));
      process.exit(0);
    }, 2000);
  };
  
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
}

function openBrowser(url) {
  const start = process.platform === 'darwin' ? 'open' :
                process.platform === 'win32' ? 'start' : 'xdg-open';
  
  exec(`${start} ${url}`, (error) => {
    if (error) {
      console.log(chalk.yellow(`Could not open browser. Visit: ${url}`));
    }
  });
}

async function editConfig() {
  const editor = process.env.EDITOR || 'vim';
  const configPath = './dev-monitor.config.json';
  
  spawn(editor, [configPath], { stdio: 'inherit' }).on('close', () => {
    console.log(chalk.green('Config updated'));
  });
}

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

// Run CLI
program.parse();

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}