import { EventEmitter } from 'events';
import { Program } from '@coral-xyz/anchor';
import { Connection, PublicKey, TransactionSignature } from '@solana/web3.js';
import { spawn, ChildProcess } from 'child_process';
import { WebSocketServer } from 'ws';
import chalk from 'chalk';
import ora from 'ora';
import { performance } from 'perf_hooks';

export interface DeploymentStatus {
  programId: PublicKey;
  status: 'pending' | 'deploying' | 'deployed' | 'failed' | 'verifying';
  transactionSignature?: TransactionSignature;
  deploymentTime?: number;
  networkUrl?: string;
  error?: string;
  size?: number;
  fees?: number;
}

export interface DeploymentResult {
  programId: PublicKey;
  transactionSignature: TransactionSignature;
  deploymentTime: number;
  networkUrl: string;
  size: number;
  fees: number;
  verified: boolean;
}

export interface MonitoringConfig {
  enabled?: boolean;
  realTimeUpdates?: boolean;
  performanceTracking?: boolean;
  websocketPort?: number;
  verifyDeployment?: boolean;
}

export class DeploymentMonitor extends EventEmitter {
  private config: MonitoringConfig;
  private wsServer?: WebSocketServer;
  private deploymentProcess?: ChildProcess;
  private activeDeployments = new Map<string, DeploymentStatus>();
  private connection?: Connection;
  private spinner: any;

  constructor(config: MonitoringConfig = {}) {
    super();
    this.config = {
      enabled: true,
      realTimeUpdates: true,
      performanceTracking: true,
      websocketPort: 8766,
      verifyDeployment: true,
      ...config
    };
  }

  public setConnection(connection: Connection): void {
    this.connection = connection;
  }

  public async monitorDeployment(program: Program | string, options: any = {}): Promise<DeploymentResult> {
    const programId = typeof program === 'string' ? program : program.programId.toString();
    
    this.emit('deployment:start', { programId });
    
    const startTime = performance.now();
    this.spinner = ora('Deploying program with enhanced monitoring...').start();

    const deploymentStatus: DeploymentStatus = {
      programId: new PublicKey(programId),
      status: 'pending',
      networkUrl: options.network || 'devnet'
    };

    this.activeDeployments.set(programId, deploymentStatus);
    this.broadcastDeploymentUpdate(deploymentStatus);

    try {
      const result = await this.executeAnchorDeploy(programId, options);
      
      const endTime = performance.now();
      const deploymentTime = endTime - startTime;

      this.spinner.succeed(chalk.green('Program deployed successfully'));
      
      const finalResult: DeploymentResult = {
        programId: new PublicKey(programId),
        transactionSignature: result.transactionSignature,
        deploymentTime,
        networkUrl: deploymentStatus.networkUrl!,
        size: result.size,
        fees: result.fees,
        verified: result.verified
      };

      this.activeDeployments.delete(programId);
      this.emit('deployment:complete', finalResult);
      
      return finalResult;
    } catch (error) {
      this.spinner.fail(chalk.red('Deployment failed'));
      
      deploymentStatus.status = 'failed';
      deploymentStatus.error = error instanceof Error ? error.message : String(error);
      this.broadcastDeploymentUpdate(deploymentStatus);
      
      this.activeDeployments.delete(programId);
      this.emit('deployment:error', error);
      throw error;
    }
  }

  private async executeAnchorDeploy(programId: string, options: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const args = ['deploy'];
      
      if (options.network) {
        args.push('--provider.cluster', options.network);
      }
      
      if (options.program) {
        args.push('--program-name', options.program);
      }

      this.deploymentProcess = spawn('anchor', args, {
        stdio: ['inherit', 'pipe', 'pipe'],
        env: { ...process.env, FORCE_COLOR: '1' }
      });

      let outputBuffer = '';
      let errorBuffer = '';

      this.deploymentProcess.stdout?.on('data', (data) => {
        const output = data.toString();
        outputBuffer += output;
        
        // Parse deployment progress
        this.parseDeploymentOutput(output, programId);
        
        // Emit real-time updates if enabled
        if (this.config.realTimeUpdates) {
          this.emit('deployment:output', output);
          this.broadcastDeploymentProgress(output);
        }
      });

      this.deploymentProcess.stderr?.on('data', (data) => {
        const error = data.toString();
        errorBuffer += error;
        this.emit('deployment:error:output', error);
      });

      this.deploymentProcess.on('close', async (code) => {
        if (code === 0) {
          try {
            const result = await this.parseDeploymentResult(outputBuffer, programId);
            resolve(result);
          } catch (parseError) {
            reject(parseError);
          }
        } else {
          reject(new Error(`Deployment process exited with code ${code}: ${errorBuffer}`));
        }
      });

      this.deploymentProcess.on('error', (error) => {
        reject(error);
      });
    });
  }

  private parseDeploymentOutput(output: string, programId: string): void {
    const deployment = this.activeDeployments.get(programId);
    if (!deployment) return;

    const lines = output.split('\n');
    
    for (const line of lines) {
      // Parse different deployment stages
      if (line.includes('Building program')) {
        deployment.status = 'deploying';
        if (this.spinner) this.spinner.text = 'Building program...';
      } else if (line.includes('Deploying program')) {
        deployment.status = 'deploying';
        if (this.spinner) this.spinner.text = 'Deploying to network...';
      } else if (line.includes('Deploy success')) {
        deployment.status = 'deployed';
        if (this.spinner) this.spinner.text = 'Deployment successful!';
      } else if (line.includes('Program Id:')) {
        const match = line.match(/Program Id:\s+([A-Za-z0-9]+)/);
        if (match) {
          deployment.programId = new PublicKey(match[1]);
        }
      } else if (line.includes('Signature:')) {
        const match = line.match(/Signature:\s+([A-Za-z0-9]+)/);
        if (match) {
          deployment.transactionSignature = match[1] as TransactionSignature;
        }
      }
    }

    this.activeDeployments.set(programId, deployment);
    this.broadcastDeploymentUpdate(deployment);
  }

  private async parseDeploymentResult(output: string, programId: string): Promise<any> {
    // Extract deployment information from anchor deploy output
    const signatureMatch = output.match(/Signature:\s+([A-Za-z0-9]+)/);
    const programIdMatch = output.match(/Program Id:\s+([A-Za-z0-9]+)/);
    
    if (!signatureMatch || !programIdMatch) {
      throw new Error('Could not parse deployment result');
    }

    const result = {
      transactionSignature: signatureMatch[1] as TransactionSignature,
      programId: new PublicKey(programIdMatch[1]),
      size: 0, // Would be extracted from build output
      fees: 0, // Would be calculated from transaction
      verified: false
    };

    // Verify deployment if enabled
    if (this.config.verifyDeployment && this.connection) {
      try {
        const deployment = this.activeDeployments.get(programId);
        if (deployment) {
          deployment.status = 'verifying';
          if (this.spinner) this.spinner.text = 'Verifying deployment...';
          this.broadcastDeploymentUpdate(deployment);
        }

        const accountInfo = await this.connection.getAccountInfo(result.programId);
        result.verified = accountInfo !== null && accountInfo.executable;
        
        if (accountInfo) {
          result.size = accountInfo.data.length;
        }
      } catch (error) {
        console.warn(chalk.yellow('Deployment verification failed:', error));
      }
    }

    return result;
  }

  private broadcastDeploymentUpdate(status: DeploymentStatus): void {
    if (this.wsServer && this.config.realTimeUpdates) {
      this.wsServer.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: 'deployment:update',
            data: status,
            timestamp: Date.now()
          }));
        }
      });
    }
  }

  private broadcastDeploymentProgress(output: string): void {
    if (this.wsServer) {
      this.wsServer.clients.forEach(client => {
        if (client.readyState === client.OPEN) {
          client.send(JSON.stringify({
            type: 'deployment:progress',
            data: output,
            timestamp: Date.now()
          }));
        }
      });
    }
  }

  public async startRealTimeMonitoring(): Promise<void> {
    if (this.wsServer) return;

    this.wsServer = new WebSocketServer({ port: this.config.websocketPort });
    
    this.wsServer.on('connection', (ws) => {
      console.log(chalk.blue('Client connected for real-time deployment monitoring'));
      
      ws.send(JSON.stringify({
        type: 'connected',
        message: 'Real-time deployment monitoring enabled'
      }));

      // Send current deployment status
      ws.send(JSON.stringify({
        type: 'deployment:status',
        data: Array.from(this.activeDeployments.values())
      }));

      ws.on('close', () => {
        console.log(chalk.yellow('Client disconnected from deployment monitoring'));
      });
    });

    console.log(chalk.green(`Real-time deployment monitoring started on port ${this.config.websocketPort}`));
  }

  public async stopRealTimeMonitoring(): Promise<void> {
    if (this.wsServer) {
      this.wsServer.close();
      this.wsServer = undefined;
      console.log(chalk.yellow('Real-time deployment monitoring stopped'));
    }
  }

  public getActiveDeployments(): DeploymentStatus[] {
    return Array.from(this.activeDeployments.values());
  }

  public stopCurrentDeployment(): void {
    if (this.deploymentProcess) {
      this.deploymentProcess.kill('SIGTERM');
      this.deploymentProcess = undefined;
      if (this.spinner) {
        this.spinner.stop();
      }
    }
  }

  // Enhanced deploy command wrapper
  public async enhancedDeploy(options: any = {}): Promise<DeploymentResult> {
    console.log(chalk.blue('🚀 Starting Enhanced Anchor Deployment'));
    
    // Pre-deployment checks
    await this.runPreDeploymentChecks();
    
    // Monitor the deployment
    const result = await this.monitorDeployment('auto-detected', options);
    
    // Post-deployment validation
    await this.runPostDeploymentValidation(result);
    
    return result;
  }

  private async runPreDeploymentChecks(): Promise<void> {
    console.log(chalk.cyan('Running pre-deployment checks...'));
    
    // Check if Anchor.toml exists
    const fs = require('fs');
    if (!fs.existsSync('Anchor.toml')) {
      throw new Error('Anchor.toml not found. Are you in an Anchor workspace?');
    }
    
    // Check if programs are built
    if (!fs.existsSync('target')) {
      console.log(chalk.yellow('Building programs first...'));
      await this.executeAnchorBuild();
    }
    
    console.log(chalk.green('✓ Pre-deployment checks passed'));
  }

  private async executeAnchorBuild(): Promise<void> {
    return new Promise((resolve, reject) => {
      const buildProcess = spawn('anchor', ['build'], {
        stdio: 'inherit',
        env: process.env
      });

      buildProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`Build failed with exit code ${code}`));
        }
      });
    });
  }

  private async runPostDeploymentValidation(result: DeploymentResult): Promise<void> {
    console.log(chalk.cyan('Running post-deployment validation...'));
    
    if (result.verified) {
      console.log(chalk.green('✓ Program deployment verified on-chain'));
    } else {
      console.log(chalk.yellow('⚠ Could not verify program deployment'));
    }
    
    console.log(chalk.blue(`📊 Deployment Summary:`));
    console.log(chalk.white(`  Program ID: ${result.programId}`));
    console.log(chalk.white(`  Transaction: ${result.transactionSignature}`));
    console.log(chalk.white(`  Network: ${result.networkUrl}`));
    console.log(chalk.white(`  Time: ${(result.deploymentTime / 1000).toFixed(2)}s`));
    if (result.size > 0) {
      console.log(chalk.white(`  Size: ${result.size} bytes`));
    }
  }
}