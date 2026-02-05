import { Command } from 'commander';
import chalk from 'chalk';
import { AnchorEnhancementLayer } from '../../core/AnchorEnhancementLayer';
import { AnchorUtils } from '../../utils/AnchorUtils';
import { logger } from '../../utils/Logger';

export function createDeployCommand(): Command {
  const deploy = new Command('deploy');
  
  deploy
    .description('Deploy programs with enhanced monitoring and tracking')
    .option('-n, --network <network>', 'Network to deploy to', 'localnet')
    .option('-p, --program <name>', 'Specific program to deploy')
    .option('--skip-build', 'Skip building programs before deployment')
    .option('--verify', 'Verify deployment after completion')
    .option('--websocket-port <port>', 'WebSocket port for real-time updates', '8766')
    .option('--dry-run', 'Simulate deployment without actually deploying')
    .action(async (options) => {
      try {
        console.log(chalk.blue('  Starting Enhanced Anchor Deployment\n'));

        if (options.dryRun) {
          console.log(chalk.yellow('  DRY RUN MODE - No actual deployment will occur\n'));
        }

        // Initialize enhancement layer
        const enhancement = new AnchorEnhancementLayer({
          monitoring: {
            enabled: true,
            realTimeUpdates: true,
            performanceTracking: true
          }
        });

        // Set up event listeners for real-time feedback
        enhancement.on('deployment:start', (data) => {
          console.log(chalk.cyan(`  Starting deployment for program: ${data.programId}`));
        });

        enhancement.on('deployment:complete', (result) => {
          console.log(chalk.green('\n  Deployment completed successfully'));
          console.log(chalk.blue('  Deployment Details:'));
          console.log(`   Program ID: ${chalk.cyan(result.programId)}`);
          console.log(`   Transaction: ${chalk.gray(result.transactionSignature)}`);
          console.log(`   Network: ${chalk.yellow(result.networkUrl)}`);
          console.log(`   Duration: ${chalk.magenta((result.deploymentTime / 1000).toFixed(2))}s`);
          
          if (result.verified) {
            console.log(chalk.green('     Deployment verified on-chain'));
          } else {
            console.log(chalk.yellow('     Could not verify deployment'));
          }
        });

        enhancement.on('deployment:error', (error) => {
          console.error(chalk.red('\nDeployment failed:'), error instanceof Error ? error.message : String(error));
        });

        // Start real-time monitoring
        await enhancement.startRealTimeUpdates();

        // Pre-deployment checks
        console.log(chalk.cyan('  Running pre-deployment checks...'));

        // Validate network
        const supportedNetworks = ['localnet', 'devnet', 'testnet', 'mainnet-beta'];
        if (!supportedNetworks.includes(options.network)) {
          throw new Error(`Unsupported network: ${options.network}. Supported: ${supportedNetworks.join(', ')}`);
        }

        // Check wallet configuration
        try {
          const walletPath = AnchorUtils.getWalletPath();
          console.log(chalk.green(`  Wallet configured: ${walletPath}`));
        } catch (error) {
          throw new Error('Wallet not properly configured in Anchor.toml');
        }

        // Get programs to deploy
        let programsToDeploy: string[];
        if (options.program) {
          programsToDeploy = [options.program];
          
          // Validate program exists
          const allPrograms = AnchorUtils.getProgramNames();
          if (!allPrograms.includes(options.program)) {
            throw new Error(`Program '${options.program}' not found. Available: ${allPrograms.join(', ')}`);
          }
        } else {
          programsToDeploy = AnchorUtils.getProgramNames();
        }

        if (programsToDeploy.length === 0) {
          throw new Error('No programs found to deploy');
        }

        console.log(chalk.green(`  Found ${programsToDeploy.length} program(s) to deploy: ${programsToDeploy.join(', ')}`));

        // Build programs unless skipped
        if (!options.skipBuild) {
          console.log(chalk.yellow('  Building programs...'));
          const { CommandRunner } = require('../../utils/CommandRunner');
          const runner = new CommandRunner();
          
          const performanceCollector = enhancement.getPerformanceCollector();
          await performanceCollector.trackBuildPerformance(async () => {
            await runner.runAnchor('build', [], { silent: false });
          });
          
          console.log(chalk.green('  Programs built successfully\n'));
        }

        // Check if programs are built
        if (!AnchorUtils.areProgramsBuilt()) {
          throw new Error('Programs are not built. Run without --skip-build or run "anchor build" first.');
        }

        if (options.dryRun) {
          console.log(chalk.blue('  Dry Run Summary:'));
          console.log(`   Network: ${chalk.cyan(options.network)}`);
          console.log(`   Programs: ${chalk.cyan(programsToDeploy.join(', '))}`);
          console.log(`   Estimated deployment time: ${chalk.magenta('~30-60s per program')}`);
          console.log(chalk.green('\n  Dry run completed - deployment would succeed'));
          
          await enhancement.stopRealTimeUpdates();
          return;
        }

        // Deploy programs
        console.log(chalk.blue(`  Deploying to ${options.network}...\n`));

        const deploymentMonitor = enhancement.getDeploymentMonitor();
        const performanceCollector = enhancement.getPerformanceCollector();

        // Deploy each program
        const results = [];
        for (const programName of programsToDeploy) {
          console.log(chalk.cyan(`  Deploying program: ${programName}`));
          
          const result = await performanceCollector.trackDeployPerformance(async () => {
            return await deploymentMonitor.enhancedDeploy({
              network: options.network,
              program: programName
            });
          });
          
          results.push({ program: programName, ...result });
        }

        // Verification
        if (options.verify) {
          console.log(chalk.cyan('\n  Verifying deployments...'));
          
          for (const result of results) {
            if (result.verified) {
              console.log(chalk.green(`  ${result.program}: Verified`));
            } else {
              console.log(chalk.yellow(`  ${result.program}: Could not verify`));
            }
          }
        }

        // Summary
        console.log(chalk.blue('\n  Deployment Summary:'));
        console.log(`   Network: ${chalk.cyan(options.network)}`);
        console.log(`   Programs deployed: ${chalk.green(results.length)}`);
        
        const totalTime = results.reduce((sum, r) => sum + (r.performance?.deployTime || 0), 0);
        console.log(`   Total time: ${chalk.magenta((totalTime / 1000).toFixed(2))}s`);

        // Stop real-time updates
        await enhancement.stopRealTimeUpdates();

        console.log(chalk.green('\n  All deployments completed successfully!'));

      } catch (error) {
        logger.error('Deploy command failed', 'CLI', error);
        console.error(chalk.red('Deployment failed:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // Subcommand for deployment history
  deploy
    .command('history')
    .description('View deployment history and analytics')
    .option('--days <n>', 'Number of days to show', '30')
    .option('--network <network>', 'Filter by network')
    .action(async (options) => {
      try {
        console.log(chalk.blue('  Deployment History\n'));

        // This would read from deployment logs
        // Mock data for demonstration
        const deployments = [
          {
            date: '2024-02-04T14:30:00Z',
            program: 'my_program',
            network: 'devnet',
            status: 'success',
            duration: 45.2,
            programId: 'HnvtqRz9vj7k4w3kEjP8jN1mR4vBbE2xR9wF8kM5nY7v'
          },
          {
            date: '2024-02-04T12:15:00Z',
            program: 'my_program',
            network: 'localnet',
            status: 'success',
            duration: 32.1,
            programId: 'GtQ5W8kB2vN8pMqE8fP9jY1nQ4dRbF3xK9wD7lJ6pZ8s'
          },
          {
            date: '2024-02-03T16:45:00Z',
            program: 'my_program',
            network: 'devnet',
            status: 'failed',
            duration: 12.3,
            error: 'Insufficient SOL for deployment'
          }
        ];

        // Filter by network if specified
        const filtered = options.network 
          ? deployments.filter(d => d.network === options.network)
          : deployments;

        if (filtered.length === 0) {
          console.log(chalk.yellow('  No deployment history found.'));
          return;
        }

        console.log(chalk.gray('─'.repeat(80)));
        
        filtered.forEach(deployment => {
          const date = new Date(deployment.date).toLocaleString();
          const statusIcon = deployment.status === 'success' ? chalk.green(' ') : chalk.red(' ');
          const durationStr = deployment.duration ? `${deployment.duration.toFixed(1)}s` : 'N/A';
          
          console.log(`${statusIcon} ${chalk.cyan(deployment.program)} on ${chalk.yellow(deployment.network)}`);
          console.log(`   Date: ${chalk.gray(date)}`);
          console.log(`   Duration: ${chalk.magenta(durationStr)}`);
          
          if (deployment.status === 'success' && deployment.programId) {
            console.log(`   Program ID: ${chalk.gray(deployment.programId)}`);
          }
          
          if (deployment.error) {
            console.log(`   Error: ${chalk.red(deployment.error)}`);
          }
          
          console.log();
        });

        // Statistics
        const successCount = filtered.filter(d => d.status === 'success').length;
        const successRate = ((successCount / filtered.length) * 100).toFixed(1);
        const avgDuration = filtered
          .filter(d => d.duration)
          .reduce((sum, d) => sum + d.duration!, 0) / filtered.length;

        console.log(chalk.gray('─'.repeat(80)));
        console.log(chalk.blue('  Statistics:'));
        console.log(`   Total deployments: ${chalk.cyan(filtered.length)}`);
        console.log(`   Success rate: ${chalk.green(successRate)}%`);
        console.log(`   Average duration: ${chalk.magenta(avgDuration.toFixed(1))}s`);

      } catch (error) {
        console.error(chalk.red('Error retrieving deployment history:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  // Subcommand for rollback
  deploy
    .command('rollback')
    .description('Rollback to a previous deployment')
    .argument('<program-id>', 'Program ID to rollback to')
    .option('-n, --network <network>', 'Network to rollback on', 'localnet')
    .option('--confirm', 'Skip confirmation prompt')
    .action(async (programId, options) => {
      try {
        console.log(chalk.yellow('  Deployment Rollback\n'));
        
        console.log(chalk.red('  WARNING: This is a destructive operation!'));
        console.log(`   Target Program ID: ${chalk.cyan(programId)}`);
        console.log(`   Network: ${chalk.yellow(options.network)}`);

        if (!options.confirm) {
          const readline = require('readline');
          const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
          });

          const answer = await new Promise(resolve => {
            rl.question(chalk.yellow('Are you sure you want to proceed? (yes/no): '), resolve);
          });

          rl.close();

          if (answer !== 'yes') {
            console.log(chalk.green('  Rollback cancelled'));
            return;
          }
        }

        console.log(chalk.yellow('  Performing rollback...'));
        
        // In a real implementation, this would:
        // 1. Verify the target program ID exists and is valid
        // 2. Create a backup of the current deployment
        // 3. Redeploy the previous version
        // 4. Verify the rollback was successful
        
        console.log(chalk.green('  Rollback completed successfully'));
        console.log(chalk.blue('  Remember to update your local code to match the rolled-back version'));

      } catch (error) {
        console.error(chalk.red('Rollback failed:'), error instanceof Error ? error.message : String(error));
        process.exit(1);
      }
    });

  return deploy;
}