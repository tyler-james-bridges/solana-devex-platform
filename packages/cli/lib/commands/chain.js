const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs-extra');
const path = require('path');
const inquirer = require('inquirer');
const { loadConfig } = require('../utils/config');

class ChainCommand {
  constructor(globalOpts = {}) {
    this.globalOpts = globalOpts;
    this.config = null;
  }

  async initializeConfig() {
    this.config = await loadConfig(this.globalOpts.config);
  }

  async deploy(options = {}) {
    try {
      await this.initializeConfig();
      
      console.log(chalk.bold.blue('🌐 Cross-Chain Deployment'));
      console.log(chalk.gray('Deploy to multiple blockchain networks\n'));
      
      const chains = this.parseChains(options.chains);
      
      // Validate chain support
      await this.validateChains(chains);
      
      // Load cross-chain configuration
      const chainConfig = await this.loadChainConfig(options.config);
      
      const spinner = ora('Preparing cross-chain deployment...').start();
      
      const deploymentResults = [];
      
      for (const chain of chains) {
        spinner.text = `Deploying to ${chain}...`;
        
        try {
          const result = await this.deployToChain(chain, chainConfig, options);
          deploymentResults.push(result);
          
          if (result.success) {
            spinner.text = `✅ ${chain} deployment completed`;
          } else {
            spinner.text = `❌ ${chain} deployment failed`;
          }
          
        } catch (error) {
          deploymentResults.push({
            chain,
            success: false,
            error: error.message
          });
        }
        
        // Brief pause between deployments
        await this.sleep(1000);
      }
      
      spinner.succeed(chalk.green('Cross-chain deployment completed!'));
      
      this.displayDeploymentSummary(deploymentResults);
      
    } catch (error) {
      console.error(chalk.red('\n❌ Cross-chain deployment failed:'), error.message);
      if (this.globalOpts.verbose) {
        console.error(error.stack);
      }
    }
  }

  parseChains(chainsOption) {
    const defaultChains = ['solana'];
    
    if (!chainsOption) {
      return defaultChains;
    }
    
    return chainsOption.split(',').map(c => c.trim().toLowerCase());
  }

  async validateChains(chains) {
    const supportedChains = {
      solana: {
        name: 'Solana',
        description: 'High-performance blockchain',
        supported: true
      },
      ethereum: {
        name: 'Ethereum',
        description: 'Smart contract platform',
        supported: false // Not implemented yet
      },
      polygon: {
        name: 'Polygon',
        description: 'Ethereum scaling solution',
        supported: false // Not implemented yet
      },
      arbitrum: {
        name: 'Arbitrum',
        description: 'Ethereum Layer 2',
        supported: false // Not implemented yet
      },
      optimism: {
        name: 'Optimism',
        description: 'Ethereum Layer 2',
        supported: false // Not implemented yet
      },
      bsc: {
        name: 'Binance Smart Chain',
        description: 'BNB blockchain',
        supported: false // Not implemented yet
      }
    };
    
    console.log(chalk.bold('🔍 Validating target chains...'));
    
    for (const chain of chains) {
      const chainInfo = supportedChains[chain];
      
      if (!chainInfo) {
        throw new Error(`Unknown chain: ${chain}. Supported: ${Object.keys(supportedChains).join(', ')}`);
      }
      
      if (!chainInfo.supported) {
        console.log(chalk.yellow(`⚠️  ${chainInfo.name} support is coming soon!`));
        console.log(chalk.gray(`   ${chainInfo.description}`));
        throw new Error(`${chainInfo.name} deployment not yet supported`);
      }
      
      console.log(chalk.green(`✅ ${chainInfo.name} - ${chainInfo.description}`));
    }
    
    console.log('');
  }

  async loadChainConfig(configPath) {
    if (configPath && await fs.pathExists(configPath)) {
      try {
        return await fs.readJSON(configPath);
      } catch (error) {
        throw new Error(`Failed to load chain config: ${error.message}`);
      }
    }
    
    // Return default chain configuration
    return {
      solana: {
        networks: {
          devnet: {
            rpcUrl: 'https://api.devnet.solana.com',
            explorer: 'https://explorer.solana.com'
          },
          testnet: {
            rpcUrl: 'https://api.testnet.solana.com',
            explorer: 'https://explorer.solana.com'
          },
          mainnet: {
            rpcUrl: 'https://api.mainnet-beta.solana.com',
            explorer: 'https://explorer.solana.com'
          }
        }
      },
      ethereum: {
        networks: {
          goerli: {
            rpcUrl: 'https://goerli.infura.io/v3/YOUR_API_KEY',
            explorer: 'https://goerli.etherscan.io'
          },
          sepolia: {
            rpcUrl: 'https://sepolia.infura.io/v3/YOUR_API_KEY',
            explorer: 'https://sepolia.etherscan.io'
          },
          mainnet: {
            rpcUrl: 'https://mainnet.infura.io/v3/YOUR_API_KEY',
            explorer: 'https://etherscan.io'
          }
        }
      }
    };
  }

  async deployToChain(chain, chainConfig, options) {
    const startTime = Date.now();
    
    switch (chain) {
      case 'solana':
        return this.deployToSolana(chainConfig.solana, options);
      
      case 'ethereum':
        return this.deployToEthereum(chainConfig.ethereum, options);
      
      default:
        throw new Error(`Deployment to ${chain} not implemented`);
    }
  }

  async deployToSolana(solanaConfig, options) {
    try {
      // Use existing Solana deployment logic
      const DeployCommand = require('./deploy');
      const deployCmd = new DeployCommand(this.globalOpts);
      
      // Deploy to Solana using existing deploy command
      await deployCmd.execute({
        network: 'devnet', // Default to devnet for cross-chain
        ...options
      });
      
      return {
        chain: 'solana',
        success: true,
        network: 'devnet',
        explorer: `${solanaConfig.networks.devnet.explorer}/address`,
        duration: 0 // Would be calculated in real implementation
      };
      
    } catch (error) {
      return {
        chain: 'solana',
        success: false,
        error: error.message
      };
    }
  }

  async deployToEthereum(ethereumConfig, options) {
    // Placeholder for Ethereum deployment
    // This would integrate with Hardhat, Truffle, or Foundry
    
    console.log(chalk.yellow('🚧 Ethereum deployment coming soon!'));
    
    return {
      chain: 'ethereum',
      success: false,
      error: 'Ethereum deployment not yet implemented'
    };
  }

  async setupBridge(options = {}) {
    try {
      console.log(chalk.bold.blue('🌉 Cross-Chain Bridge Setup'));
      console.log(chalk.gray('Configure cross-chain communication\n'));
      
      const { from, to } = await this.promptForBridgeChains(options);
      
      console.log(chalk.blue(`Setting up bridge: ${from} ↔ ${to}`));
      
      // Validate bridge support
      const supportedBridges = this.getSupportedBridges();
      const bridgeKey = `${from}-${to}`;
      const reverseBridgeKey = `${to}-${from}`;
      
      if (!supportedBridges[bridgeKey] && !supportedBridges[reverseBridgeKey]) {
        throw new Error(`Bridge between ${from} and ${to} is not supported yet`);
      }
      
      const bridgeConfig = supportedBridges[bridgeKey] || supportedBridges[reverseBridgeKey];
      
      console.log(chalk.green('\n✅ Bridge Configuration:'));
      console.log(chalk.cyan(`Protocol: ${bridgeConfig.protocol}`));
      console.log(chalk.cyan(`Type: ${bridgeConfig.type}`));
      console.log(chalk.gray(`Description: ${bridgeConfig.description}`));
      
      // Create bridge configuration file
      await this.createBridgeConfig(from, to, bridgeConfig);
      
      console.log(chalk.bold('\n📋 Next Steps:'));
      console.log('1. Deploy contracts on both chains');
      console.log('2. Configure bridge parameters');
      console.log('3. Test cross-chain transactions');
      console.log('4. Monitor bridge operations');
      
    } catch (error) {
      console.error(chalk.red('❌ Bridge setup failed:'), error.message);
    }
  }

  async promptForBridgeChains(options) {
    const chains = ['solana', 'ethereum', 'polygon', 'arbitrum', 'optimism'];
    
    if (options.from && options.to) {
      return { from: options.from, to: options.to };
    }
    
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'from',
        message: 'Source chain:',
        choices: chains,
        default: 'solana'
      },
      {
        type: 'list',
        name: 'to',
        message: 'Destination chain:',
        choices: chains.filter(c => c !== 'solana'), // Exclude same as source
        default: 'ethereum'
      }
    ]);
    
    return answers;
  }

  getSupportedBridges() {
    return {
      'solana-ethereum': {
        protocol: 'Wormhole',
        type: 'Token Bridge',
        description: 'Cross-chain token transfers via Wormhole protocol'
      },
      'solana-polygon': {
        protocol: 'Wormhole',
        type: 'Token Bridge',
        description: 'Cross-chain token transfers via Wormhole protocol'
      },
      'ethereum-polygon': {
        protocol: 'Polygon PoS Bridge',
        type: 'Native Bridge',
        description: 'Official Polygon bridge for asset transfers'
      }
    };
  }

  async createBridgeConfig(from, to, bridgeConfig) {
    const configDir = path.join(process.cwd(), 'bridge-config');
    await fs.ensureDir(configDir);
    
    const config = {
      bridge: {
        from,
        to,
        protocol: bridgeConfig.protocol,
        type: bridgeConfig.type,
        createdAt: new Date().toISOString()
      },
      contracts: {
        [from]: {
          bridge: null, // To be filled after deployment
          token: null
        },
        [to]: {
          bridge: null, // To be filled after deployment
          token: null
        }
      },
      parameters: {
        confirmations: from === 'ethereum' ? 12 : 32,
        fees: {
          base: 0.001,
          percentage: 0.1
        }
      }
    };
    
    const configPath = path.join(configDir, `${from}-${to}-bridge.json`);
    await fs.writeJSON(configPath, config, { spaces: 2 });
    
    console.log(chalk.green(`\n📄 Bridge config created: ${configPath}`));
  }

  async status() {
    try {
      console.log(chalk.bold.blue('📊 Cross-Chain Status'));
      console.log('━'.repeat(40));
      
      // Check for existing deployments
      const deployments = await this.loadDeploymentHistory();
      
      if (deployments.length === 0) {
        console.log(chalk.yellow('⚠️  No cross-chain deployments found'));
        console.log(chalk.gray('Run `solana-devex chain deploy` to get started'));
        return;
      }
      
      // Display deployment status
      deployments.forEach(deployment => {
        const status = deployment.success ? 
          chalk.green('✅ ACTIVE') : 
          chalk.red('❌ FAILED');
        
        console.log(`${status} ${chalk.bold(deployment.chain)}`);
        console.log(`   Network: ${deployment.network || 'unknown'}`);
        
        if (deployment.programId || deployment.contractAddress) {
          console.log(`   Address: ${deployment.programId || deployment.contractAddress}`);
        }
        
        if (deployment.explorer) {
          console.log(`   Explorer: ${deployment.explorer}`);
        }
        
        console.log('');
      });
      
      // Check bridge status
      const bridges = await this.loadBridgeStatus();
      
      if (bridges.length > 0) {
        console.log(chalk.bold.blue('🌉 Bridge Status'));
        console.log('━'.repeat(40));
        
        bridges.forEach(bridge => {
          console.log(`${chalk.cyan('Bridge:')} ${bridge.from} ↔ ${bridge.to}`);
          console.log(`${chalk.cyan('Protocol:')} ${bridge.protocol}`);
          console.log(`${chalk.cyan('Status:')} ${bridge.status}`);
          console.log('');
        });
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Failed to get status:'), error.message);
    }
  }

  async loadDeploymentHistory() {
    try {
      const historyPath = path.join(process.cwd(), '.solana-devex', 'deployment-history.json');
      
      if (await fs.pathExists(historyPath)) {
        return await fs.readJSON(historyPath);
      }
      
      return [];
    } catch {
      return [];
    }
  }

  async loadBridgeStatus() {
    try {
      const bridgeDir = path.join(process.cwd(), 'bridge-config');
      
      if (!(await fs.pathExists(bridgeDir))) {
        return [];
      }
      
      const configFiles = await fs.readdir(bridgeDir);
      const bridges = [];
      
      for (const file of configFiles) {
        if (file.endsWith('.json')) {
          const configPath = path.join(bridgeDir, file);
          const config = await fs.readJSON(configPath);
          
          bridges.push({
            from: config.bridge.from,
            to: config.bridge.to,
            protocol: config.bridge.protocol,
            status: 'Configured' // Would check actual status
          });
        }
      }
      
      return bridges;
    } catch {
      return [];
    }
  }

  displayDeploymentSummary(results) {
    console.log(chalk.bold('\n🌐 Cross-Chain Deployment Summary'));
    console.log('━'.repeat(50));
    
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    
    console.log(chalk.blue(`Total Chains: ${total}`));
    console.log(chalk.green(`Successful: ${successful}`));
    console.log(chalk.red(`Failed: ${total - successful}`));
    console.log('');
    
    results.forEach(result => {
      const status = result.success ? 
        chalk.green('✅ SUCCESS') : 
        chalk.red('❌ FAILED');
      
      console.log(`${status} ${chalk.bold(result.chain.toUpperCase())}`);
      
      if (result.success) {
        if (result.network) {
          console.log(`   Network: ${result.network}`);
        }
        if (result.programId || result.contractAddress) {
          console.log(`   Address: ${result.programId || result.contractAddress}`);
        }
        if (result.explorer) {
          console.log(`   Explorer: ${result.explorer}`);
        }
      } else {
        console.log(chalk.red(`   Error: ${result.error}`));
      }
      
      console.log('');
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = ChainCommand;