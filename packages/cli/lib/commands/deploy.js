const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('cross-spawn');
const { loadConfig } = require('../utils/config');
const { findAnchorWorkspace } = require('../utils/workspace');
const { Connection, PublicKey } = require('@solana/web3.js');
const toml = require('toml');

class DeployCommand {
  constructor(globalOpts = {}) {
    this.globalOpts = globalOpts;
    this.config = null;
    this.deploymentResults = [];
  }

  async execute(options = {}) {
    try {
      await this.initializeConfig();
      
      const spinner = ora('Initializing deployment...').start();
      
      // Validate workspace and requirements
      const workspace = await this.validateWorkspace();
      await this.validateDeploymentRequirements(options, spinner);
      
      if (options.dryRun) {
        spinner.text = 'Performing dry run...';
        const dryRunResults = await this.performDryRun(options, workspace);
        spinner.succeed(chalk.green('Dry run completed successfully!'));
        this.displayDryRunResults(dryRunResults);
        return;
      }
      
      // Handle multi-network broadcast
      if (options.broadcast) {
        return this.handleBroadcast(options, workspace, spinner);
      }
      
      // Single network deployment
      const network = this.resolveNetwork(options.network);
      const deploymentResult = await this.deployToNetwork(network, options, workspace, spinner);
      
      // Verify if requested
      if (options.verify && deploymentResult.success) {
        spinner.text = 'Verifying deployment...';
        await this.verifyDeployment(deploymentResult, network);
      }
      
      spinner.succeed(chalk.green('Deployment completed successfully!'));
      
      this.displayDeploymentSummary([deploymentResult]);
      
    } catch (error) {
      console.error(chalk.red('\n  Deployment failed:'), error.message);
      if (this.globalOpts.verbose) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  }

  async initializeConfig() {
    this.config = await loadConfig(this.globalOpts.config);
  }

  async validateWorkspace() {
    const workspacePath = await findAnchorWorkspace();
    if (!workspacePath) {
      throw new Error('No Anchor workspace found. Run this command in an Anchor project directory.');
    }
    
    return workspacePath;
  }

  async validateDeploymentRequirements(options, spinner) {
    spinner.text = 'Validating deployment requirements...';
    
    // Check if programs are built
    const workspace = await this.validateWorkspace();
    const deployDir = path.join(workspace, 'target', 'deploy');
    
    if (!(await fs.pathExists(deployDir))) {
      throw new Error('No deployment artifacts found. Run `solana-devex build` first.');
    }
    
    const programFiles = await fs.readdir(deployDir);
    const soFiles = programFiles.filter(f => f.endsWith('.so'));
    
    if (soFiles.length === 0) {
      throw new Error('No program binaries found. Run `solana-devex build` first.');
    }
    
    // Check keypair
    if (options.keypair) {
      if (!(await fs.pathExists(options.keypair))) {
        throw new Error(`Keypair file not found: ${options.keypair}`);
      }
    }
    
    // Validate network configuration
    const network = this.resolveNetwork(options.network);
    if (!network.rpcUrl) {
      throw new Error(`Invalid network configuration for: ${options.network}`);
    }
  }

  resolveNetwork(networkName) {
    const networks = {
      devnet: {
        name: 'devnet',
        rpcUrl: 'https://api.devnet.solana.com',
        wsUrl: 'wss://api.devnet.solana.com',
        cluster: 'devnet'
      },
      testnet: {
        name: 'testnet',
        rpcUrl: 'https://api.testnet.solana.com',
        wsUrl: 'wss://api.testnet.solana.com',
        cluster: 'testnet'
      },
      mainnet: {
        name: 'mainnet-beta',
        rpcUrl: 'https://api.mainnet-beta.solana.com',
        wsUrl: 'wss://api.mainnet-beta.solana.com',
        cluster: 'mainnet-beta'
      }
    };
    
    const network = networks[networkName];
    if (!network) {
      throw new Error(`Unknown network: ${networkName}`);
    }
    
    // Override with config if available
    if (this.config && this.config.networks && this.config.networks[networkName]) {
      Object.assign(network, this.config.networks[networkName]);
    }
    
    return network;
  }

  async deployToNetwork(network, options, workspace, spinner) {
    const startTime = Date.now();
    
    try {
      spinner.text = `Deploying to ${network.name}...`;
      
      // Get programs to deploy
      const programs = await this.getPrograms(options.program, workspace);
      
      const deploymentResult = {
        network: network.name,
        success: false,
        programs: [],
        duration: 0,
        transactionSignatures: [],
        errors: []
      };
      
      // Deploy each program
      for (const program of programs) {
        const programResult = await this.deployProgram(
          program, 
          network, 
          options, 
          workspace, 
          spinner
        );
        
        deploymentResult.programs.push(programResult);
        
        if (programResult.signature) {
          deploymentResult.transactionSignatures.push(programResult.signature);
        }
        
        if (!programResult.success) {
          deploymentResult.errors.push(programResult.error);
        }
      }
      
      deploymentResult.success = deploymentResult.programs.every(p => p.success);
      deploymentResult.duration = Date.now() - startTime;
      
      return deploymentResult;
      
    } catch (error) {
      return {
        network: network.name,
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        programs: [],
        transactionSignatures: [],
        errors: [error.message]
      };
    }
  }

  async getPrograms(programOption, workspace) {
    const deployDir = path.join(workspace, 'target', 'deploy');
    const programFiles = await fs.readdir(deployDir);
    const soFiles = programFiles.filter(f => f.endsWith('.so'));
    
    if (programOption) {
      // Deploy specific program
      const programFile = `${programOption}.so`;
      if (!soFiles.includes(programFile)) {
        throw new Error(`Program not found: ${programOption}`);
      }
      return [programOption];
    }
    
    // Deploy all programs
    return soFiles.map(f => f.replace('.so', ''));
  }

  async deployProgram(programName, network, options, workspace, spinner) {
    const startTime = Date.now();
    
    try {
      spinner.text = `Deploying ${programName} to ${network.name}...`;
      
      // Build deploy command
      const args = ['deploy'];
      
      // Add network/cluster
      args.push('--provider.cluster', network.cluster);
      
      // Add keypair if specified
      if (options.keypair) {
        args.push('--provider.wallet', options.keypair);
      }
      
      // Add specific program
      args.push('--program', programName);
      
      // Add upgrade flag if needed
      if (options.upgrade) {
        args.push('--upgrade');
      }
      
      // Add gas limit if specified
      if (options.gasLimit) {
        args.push('--compute-unit-limit', options.gasLimit);
      }
      
      const result = await this.runAnchorCommand(args, workspace);
      
      // Parse deployment result
      const programId = this.extractProgramId(result.output, programName);
      const signature = this.extractSignature(result.output);
      
      return {
        program: programName,
        success: true,
        programId,
        signature,
        duration: Date.now() - startTime,
        network: network.name
      };
      
    } catch (error) {
      return {
        program: programName,
        success: false,
        error: error.message,
        duration: Date.now() - startTime,
        network: network.name
      };
    }
  }

  async runAnchorCommand(args, cwd) {
    return new Promise((resolve, reject) => {
      const child = spawn('anchor', args, {
        cwd,
        stdio: 'pipe',
        env: { ...process.env }
      });

      let output = '';
      let errorOutput = '';

      child.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        if (this.globalOpts.verbose) {
          process.stdout.write(text);
        }
      });

      child.stderr.on('data', (data) => {
        const text = data.toString();
        errorOutput += text;
        if (this.globalOpts.verbose) {
          process.stderr.write(text);
        }
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ output, code });
        } else {
          reject(new Error(`Anchor deploy failed (exit code ${code}):\n${errorOutput}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to spawn anchor command: ${error.message}`));
      });
    });
  }

  extractProgramId(output, programName) {
    // Extract program ID from anchor deploy output
    const programIdRegex = new RegExp(`Program ${programName} (\\w+)`, 'i');
    const match = output.match(programIdRegex);
    
    if (match) {
      return match[1];
    }
    
    // Fallback: look for any program ID in output
    const genericMatch = output.match(/Program ID: (\w+)/);
    return genericMatch ? genericMatch[1] : null;
  }

  extractSignature(output) {
    // Extract transaction signature from output
    const signatureMatch = output.match(/Signature: (\w+)/);
    return signatureMatch ? signatureMatch[1] : null;
  }

  async performDryRun(options, workspace) {
    const network = this.resolveNetwork(options.network);
    const programs = await this.getPrograms(options.program, workspace);
    
    const dryRunResults = {
      network: network.name,
      programs: [],
      estimatedCost: 0
    };
    
    for (const program of programs) {
      const programPath = path.join(workspace, 'target', 'deploy', `${program}.so`);
      const stats = await fs.stat(programPath);
      
      // Estimate deployment cost (simplified)
      const estimatedCost = Math.ceil(stats.size / 1024) * 0.001; // ~0.001 SOL per KB
      
      dryRunResults.programs.push({
        name: program,
        size: stats.size,
        estimatedCost
      });
      
      dryRunResults.estimatedCost += estimatedCost;
    }
    
    return dryRunResults;
  }

  async handleBroadcast(options, workspace, spinner) {
    const networks = ['devnet', 'testnet']; // Configurable broadcast networks
    
    if (options.network === 'mainnet') {
      networks.push('mainnet');
    }
    
    const deploymentResults = [];
    
    for (const networkName of networks) {
      spinner.text = `Broadcasting to ${networkName}...`;
      
      const network = this.resolveNetwork(networkName);
      const result = await this.deployToNetwork(network, options, workspace, spinner);
      
      deploymentResults.push(result);
      
      if (!result.success && options.bail) {
        break;
      }
    }
    
    spinner.succeed(chalk.green('Broadcast deployment completed!'));
    this.displayDeploymentSummary(deploymentResults);
    
    return deploymentResults;
  }

  async verifyDeployment(deploymentResult, network) {
    try {
      const connection = new Connection(network.rpcUrl, 'confirmed');
      
      for (const program of deploymentResult.programs) {
        if (program.success && program.programId) {
          const programId = new PublicKey(program.programId);
          const accountInfo = await connection.getAccountInfo(programId);
          
          if (accountInfo) {
            program.verified = true;
            program.verificationDetails = {
              executable: accountInfo.executable,
              owner: accountInfo.owner.toString(),
              dataLength: accountInfo.data.length
            };
          } else {
            program.verified = false;
            program.verificationError = 'Program account not found';
          }
        }
      }
    } catch (error) {
      console.warn(chalk.yellow('   Verification failed:'), error.message);
    }
  }

  async verify(options = {}) {
    try {
      const spinner = ora('Verifying deployed programs...').start();
      
      const network = this.resolveNetwork(options.network);
      const connection = new Connection(network.rpcUrl, 'confirmed');
      
      if (options.program) {
        // Verify specific program
        const result = await this.verifyProgramAddress(options.program, connection);
        spinner.succeed(chalk.green('Program verification completed!'));
        console.log(this.formatVerificationResult(result));
      } else {
        // Verify all deployed programs
        const workspace = await this.validateWorkspace();
        const deployedPrograms = await this.getDeployedPrograms(workspace);
        
        const results = [];
        for (const programId of deployedPrograms) {
          const result = await this.verifyProgramAddress(programId, connection);
          results.push(result);
        }
        
        spinner.succeed(chalk.green('Verification completed!'));
        results.forEach(result => console.log(this.formatVerificationResult(result)));
      }
      
    } catch (error) {
      console.error(chalk.red('  Verification failed:'), error.message);
    }
  }

  async verifyProgramAddress(programAddress, connection) {
    try {
      const programId = new PublicKey(programAddress);
      const accountInfo = await connection.getAccountInfo(programId);
      
      return {
        programId: programAddress,
        verified: !!accountInfo,
        executable: accountInfo?.executable || false,
        owner: accountInfo?.owner?.toString(),
        dataLength: accountInfo?.data?.length || 0
      };
    } catch (error) {
      return {
        programId: programAddress,
        verified: false,
        error: error.message
      };
    }
  }

  async getDeployedPrograms(workspace) {
    // This would read from deployment state or config
    // For now, return empty array
    return [];
  }

  formatVerificationResult(result) {
    const status = result.verified ? 
      chalk.green('  VERIFIED') : 
      chalk.red('  NOT FOUND');
    
    let output = `${status} ${result.programId}`;
    
    if (result.verified) {
      output += `\n  Executable: ${result.executable}`;
      output += `\n  Owner: ${result.owner}`;
      output += `\n  Size: ${result.dataLength} bytes`;
    } else if (result.error) {
      output += `\n  Error: ${result.error}`;
    }
    
    return output;
  }

  displayDryRunResults(results) {
    console.log(chalk.bold('\n  Deployment Dry Run'));
    console.log('━'.repeat(50));
    
    console.log(chalk.blue(`Network: ${results.network}`));
    console.log(chalk.blue(`Programs: ${results.programs.length}`));
    
    results.programs.forEach(program => {
      const sizeKB = (program.size / 1024).toFixed(1);
      console.log(`\n  ${chalk.bold(program.name)}`);
      console.log(`   Size: ${sizeKB}KB`);
      console.log(`   Est. Cost: ${program.estimatedCost.toFixed(4)} SOL`);
    });
    
    console.log(chalk.bold(`\n  Total Estimated Cost: ${results.estimatedCost.toFixed(4)} SOL`));
    console.log('');
  }

  displayDeploymentSummary(deploymentResults) {
    console.log(chalk.bold('\n  Deployment Summary'));
    console.log('━'.repeat(50));
    
    deploymentResults.forEach(result => {
      const status = result.success ? 
        chalk.green('  SUCCESS') : 
        chalk.red('  FAILED');
      
      console.log(`${status} ${chalk.bold(result.network)}`);
      console.log(`   Duration: ${result.duration}ms`);
      console.log(`   Programs: ${result.programs.length}`);
      
      if (result.transactionSignatures.length > 0) {
        console.log(`   Transactions: ${result.transactionSignatures.length}`);
      }
      
      // Show program details
      result.programs.forEach(program => {
        const programStatus = program.success ? ' ' : ' ';
        console.log(`   ${programStatus} ${program.program}`);
        
        if (program.programId) {
          console.log(chalk.gray(`      Program ID: ${program.programId}`));
        }
        
        if (program.verified !== undefined) {
          const verifyStatus = program.verified ? 
            chalk.green('  Verified') : 
            chalk.yellow('   Not verified');
          console.log(`      Verification: ${verifyStatus}`);
        }
        
        if (program.error) {
          console.log(chalk.red(`      Error: ${program.error}`));
        }
      });
      
      console.log('');
    });
  }
}

module.exports = DeployCommand;