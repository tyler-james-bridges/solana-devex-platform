const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs-extra');
const path = require('path');
const { 
  Connection, 
  PublicKey, 
  SystemProgram, 
  Transaction,
  sendAndConfirmTransaction,
  Keypair,
  LAMPORTS_PER_SOL 
} = require('@solana/web3.js');
const { loadConfig } = require('../utils/config');

class CastCommand {
  constructor(globalOpts = {}) {
    this.globalOpts = globalOpts;
    this.config = null;
    this.connection = null;
  }

  async initializeConfig() {
    this.config = await loadConfig(this.globalOpts.config);
  }

  async initializeConnection(rpcUrl) {
    if (!rpcUrl) {
      // Use default or config RPC URL
      rpcUrl = this.config?.networks?.devnet?.rpcUrl || 'http://localhost:8899';
    }
    
    this.connection = new Connection(rpcUrl, 'confirmed');
    
    // Test connection
    try {
      await this.connection.getVersion();
    } catch (error) {
      throw new Error(`Failed to connect to RPC endpoint: ${rpcUrl}`);
    }
  }

  async getBalance(address, options = {}) {
    try {
      await this.initializeConfig();
      await this.initializeConnection(options.rpcUrl);
      
      const spinner = ora('Fetching account balance...').start();
      
      const publicKey = new PublicKey(address);
      const balance = await this.connection.getBalance(publicKey);
      
      spinner.succeed();
      
      const solBalance = balance / LAMPORTS_PER_SOL;
      
      console.log(chalk.bold('\n  Account Balance'));
      console.log('━'.repeat(30));
      console.log(chalk.cyan(`Address: ${address}`));
      console.log(chalk.green(`Balance: ${solBalance} SOL`));
      console.log(chalk.gray(`Lamports: ${balance}`));
      
    } catch (error) {
      console.error(chalk.red('  Failed to get balance:'), error.message);
    }
  }

  async getAccount(address, options = {}) {
    try {
      await this.initializeConfig();
      await this.initializeConnection(options.rpcUrl);
      
      const spinner = ora('Fetching account info...').start();
      
      const publicKey = new PublicKey(address);
      const accountInfo = await this.connection.getAccountInfo(publicKey);
      
      spinner.succeed();
      
      if (!accountInfo) {
        console.log(chalk.yellow('   Account not found or has no data'));
        return;
      }
      
      const balance = accountInfo.lamports / LAMPORTS_PER_SOL;
      
      if (options.json) {
        const result = {
          address,
          lamports: accountInfo.lamports,
          sol: balance,
          owner: accountInfo.owner.toString(),
          executable: accountInfo.executable,
          rentEpoch: accountInfo.rentEpoch,
          dataLength: accountInfo.data.length
        };
        
        console.log(JSON.stringify(result, null, 2));
        return;
      }
      
      console.log(chalk.bold('\n  Account Information'));
      console.log('━'.repeat(40));
      console.log(chalk.cyan(`Address:     ${address}`));
      console.log(chalk.green(`Balance:     ${balance} SOL`));
      console.log(chalk.blue(`Owner:       ${accountInfo.owner.toString()}`));
      console.log(chalk.yellow(`Executable:  ${accountInfo.executable}`));
      console.log(chalk.gray(`Rent Epoch:  ${accountInfo.rentEpoch}`));
      console.log(chalk.gray(`Data Length: ${accountInfo.data.length} bytes`));
      
      if (accountInfo.data.length > 0 && accountInfo.data.length <= 1024) {
        console.log(chalk.bold('\n  Account Data (hex):'));
        console.log(accountInfo.data.toString('hex'));
      }
      
    } catch (error) {
      console.error(chalk.red('  Failed to get account:'), error.message);
    }
  }

  async callInstruction(program, instruction, options = {}) {
    try {
      await this.initializeConfig();
      await this.initializeConnection(options.rpcUrl);
      
      console.log(chalk.blue('  Calling program instruction...'));
      console.log(chalk.gray(`Program: ${program}`));
      console.log(chalk.gray(`Instruction: ${instruction}`));
      
      // Parse arguments
      const args = options.args ? JSON.parse(options.args) : [];
      const accounts = options.accounts ? JSON.parse(options.accounts) : [];
      
      // This is a simplified implementation
      // In a real scenario, you'd need to properly serialize instruction data
      // based on the program's IDL
      
      console.log(chalk.yellow('   Instruction calling requires program IDL'));
      console.log(chalk.gray('Implement with Anchor IDL parsing for full functionality'));
      
    } catch (error) {
      console.error(chalk.red('  Failed to call instruction:'), error.message);
    }
  }

  async sendSol(toAddress, amount, options = {}) {
    try {
      await this.initializeConfig();
      await this.initializeConnection(options.rpcUrl);
      
      const spinner = ora('Preparing SOL transfer...').start();
      
      // Load keypair
      const keypairPath = options.keypair || this.getDefaultKeypairPath();
      const keypair = await this.loadKeypair(keypairPath);
      
      const fromPubkey = keypair.publicKey;
      const toPubkey = new PublicKey(toAddress);
      const lamports = Math.round(parseFloat(amount) * LAMPORTS_PER_SOL);
      
      spinner.text = 'Creating transaction...';
      
      // Create transfer transaction
      const transaction = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey,
          lamports
        })
      );
      
      spinner.text = 'Sending transaction...';
      
      // Send and confirm transaction
      const signature = await sendAndConfirmTransaction(
        this.connection,
        transaction,
        [keypair]
      );
      
      spinner.succeed(chalk.green('  SOL transfer completed!'));
      
      console.log(chalk.bold('\n  Transfer Details'));
      console.log('━'.repeat(40));
      console.log(chalk.cyan(`From:      ${fromPubkey.toString()}`));
      console.log(chalk.cyan(`To:        ${toAddress}`));
      console.log(chalk.green(`Amount:    ${amount} SOL`));
      console.log(chalk.blue(`Signature: ${signature}`));
      
      // Show transaction link
      const explorerUrl = this.getExplorerUrl(signature);
      if (explorerUrl) {
        console.log(chalk.gray(`Explorer:  ${explorerUrl}`));
      }
      
    } catch (error) {
      console.error(chalk.red('  Failed to send SOL:'), error.message);
    }
  }

  async deployProgram(programPath, options = {}) {
    try {
      await this.initializeConfig();
      await this.initializeConnection(options.rpcUrl);
      
      const spinner = ora('Deploying program...').start();
      
      // Resolve program path
      const resolvedPath = path.resolve(programPath);
      
      if (!(await fs.pathExists(resolvedPath))) {
        throw new Error(`Program file not found: ${resolvedPath}`);
      }
      
      // Load keypair for deployment
      const keypairPath = options.keypair || this.getDefaultKeypairPath();
      const deployerKeypair = await this.loadKeypair(keypairPath);
      
      // Load or generate program keypair
      let programKeypair;
      if (options.keypair) {
        programKeypair = await this.loadKeypair(options.keypair);
      } else {
        programKeypair = Keypair.generate();
        console.log(chalk.yellow('Generated new program keypair'));
      }
      
      spinner.text = 'Reading program binary...';
      
      const programData = await fs.readFile(resolvedPath);
      
      console.log(chalk.blue('\n  Program Deployment'));
      console.log('━'.repeat(40));
      console.log(chalk.cyan(`Program:   ${path.basename(resolvedPath)}`));
      console.log(chalk.cyan(`Size:      ${(programData.length / 1024).toFixed(1)}KB`));
      console.log(chalk.cyan(`Deployer:  ${deployerKeypair.publicKey.toString()}`));
      console.log(chalk.green(`Program ID: ${programKeypair.publicKey.toString()}`));
      
      // TODO: Implement actual program deployment
      // This would typically use Solana CLI or implement the deployment logic
      console.log(chalk.yellow('\n   Use `solana program deploy` for actual deployment'));
      console.log(chalk.gray(`Command: solana program deploy ${resolvedPath} --program-id ${programKeypair.publicKey.toString()}`));
      
      spinner.succeed(chalk.green('Deployment preparation completed!'));
      
    } catch (error) {
      console.error(chalk.red('  Failed to deploy program:'), error.message);
    }
  }

  async loadKeypair(keypairPath) {
    try {
      if (!(await fs.pathExists(keypairPath))) {
        throw new Error(`Keypair file not found: ${keypairPath}`);
      }
      
      const keypairData = await fs.readJSON(keypairPath);
      const secretKey = new Uint8Array(keypairData);
      
      return Keypair.fromSecretKey(secretKey);
      
    } catch (error) {
      if (error.message.includes('not found')) {
        throw error;
      }
      throw new Error(`Failed to load keypair: ${error.message}`);
    }
  }

  getDefaultKeypairPath() {
    const home = process.env.HOME || process.env.USERPROFILE;
    return path.join(home, '.config', 'solana', 'id.json');
  }

  getExplorerUrl(signature) {
    // Determine network from connection endpoint
    const endpoint = this.connection.rpcEndpoint;
    
    if (endpoint.includes('devnet')) {
      return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
    } else if (endpoint.includes('testnet')) {
      return `https://explorer.solana.com/tx/${signature}?cluster=testnet`;
    } else if (endpoint.includes('localhost')) {
      return null; // No explorer for localhost
    } else {
      return `https://explorer.solana.com/tx/${signature}`;
    }
  }

  // Additional utility methods for cast operations
  async getSlot(options = {}) {
    try {
      await this.initializeConnection(options.rpcUrl);
      
      const slot = await this.connection.getSlot();
      console.log(chalk.cyan(`Current slot: ${slot}`));
      
    } catch (error) {
      console.error(chalk.red('  Failed to get slot:'), error.message);
    }
  }

  async getBlockHeight(options = {}) {
    try {
      await this.initializeConnection(options.rpcUrl);
      
      const blockHeight = await this.connection.getBlockHeight();
      console.log(chalk.cyan(`Block height: ${blockHeight}`));
      
    } catch (error) {
      console.error(chalk.red('  Failed to get block height:'), error.message);
    }
  }

  async getClusterNodes(options = {}) {
    try {
      await this.initializeConnection(options.rpcUrl);
      
      const spinner = ora('Fetching cluster nodes...').start();
      
      const clusterNodes = await this.connection.getClusterNodes();
      
      spinner.succeed();
      
      console.log(chalk.bold('\n  Cluster Nodes'));
      console.log('━'.repeat(50));
      
      clusterNodes.forEach((node, index) => {
        console.log(chalk.cyan(`${index + 1}. ${node.pubkey}`));
        if (node.gossip) {
          console.log(chalk.gray(`   Gossip: ${node.gossip}`));
        }
        if (node.rpc) {
          console.log(chalk.gray(`   RPC: ${node.rpc}`));
        }
        console.log('');
      });
      
    } catch (error) {
      console.error(chalk.red('  Failed to get cluster nodes:'), error.message);
    }
  }

  async getVersion(options = {}) {
    try {
      await this.initializeConnection(options.rpcUrl);
      
      const version = await this.connection.getVersion();
      
      console.log(chalk.bold('\n  Solana Version'));
      console.log('━'.repeat(30));
      console.log(chalk.cyan(`Solana Core: ${version['solana-core']}`));
      if (version['feature-set']) {
        console.log(chalk.gray(`Feature Set: ${version['feature-set']}`));
      }
      
    } catch (error) {
      console.error(chalk.red('  Failed to get version:'), error.message);
    }
  }

  async getPerformanceSamples(options = {}) {
    try {
      await this.initializeConnection(options.rpcUrl);
      
      const spinner = ora('Fetching performance samples...').start();
      
      const samples = await this.connection.getRecentPerformanceSamples(10);
      
      spinner.succeed();
      
      console.log(chalk.bold('\n  Performance Samples'));
      console.log('━'.repeat(50));
      
      samples.forEach((sample, index) => {
        console.log(chalk.cyan(`Sample ${index + 1}:`));
        console.log(chalk.gray(`  Slot: ${sample.slot}`));
        console.log(chalk.gray(`  TPS: ${sample.numTransactions / sample.samplePeriodSecs}`));
        console.log(chalk.gray(`  Transactions: ${sample.numTransactions}`));
        console.log('');
      });
      
    } catch (error) {
      console.error(chalk.red('  Failed to get performance samples:'), error.message);
    }
  }
}

module.exports = CastCommand;