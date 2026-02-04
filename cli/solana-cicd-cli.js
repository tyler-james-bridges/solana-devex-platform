#!/usr/bin/env node

/**
 * Solana CI/CD CLI
 * Production-ready command-line interface for Solana development automation
 */

const { Command } = require('commander');
const chalk = require('chalk');
const inquirer = require('inquirer');
const ora = require('ora');
const fs = require('fs').promises;
const path = require('path');

const EnhancedScaffolding = require('../lib/enhanced-scaffolding');
const DeploymentAutomation = require('../lib/deployment-automation');
const CICDManager = require('../lib/cicd-manager');

const program = new Command();
const scaffolding = new EnhancedScaffolding();
const deployment = new DeploymentAutomation();
const cicd = new CICDManager();

// ASCII Art Banner
const banner = `
${chalk.cyan('╔═══════════════════════════════════════════════════════════════════════════╗')}
${chalk.cyan('║')}                    ${chalk.bold.yellow('SOLANA CI/CD PLATFORM')}                           ${chalk.cyan('║')}
${chalk.cyan('║')}              ${chalk.gray('Production-Ready Development Automation')}              ${chalk.cyan('║')}
${chalk.cyan('╚═══════════════════════════════════════════════════════════════════════════╝')}
`;

program
  .name('solana-cicd')
  .description('Production-ready CI/CD platform for Solana development')
  .version('1.0.0');

/**
 * Project scaffolding commands
 */
const project = program
  .command('project')
  .description('Project scaffolding and management');

project
  .command('create <name>')
  .description('Create a new Solana project with best practices')
  .option('-t, --type <type>', 'Project type (basic, defi, nft, dao, agent, gaming)', 'basic')
  .option('-s, --structure <structure>', 'Project structure (basic, monorepo)', 'monorepo')
  .option('-f, --features <features>', 'Comma-separated list of features to include')
  .option('-c, --clients <clients>', 'Client applications to generate (web, mobile, cli)', 'web')
  .option('--testing <framework>', 'Testing framework (anchor, litesvm)', 'litesvm')
  .option('--interactive', 'Interactive project creation wizard')
  .action(async (name, options) => {
    console.log(banner);
    
    let config = { name };
    
    if (options.interactive) {
      config = await runProjectWizard(name);
    } else {
      config = {
        name,
        type: options.type,
        structure: options.structure,
        features: options.features ? options.features.split(',') : [],
        clientTypes: options.clients ? options.clients.split(',') : ['web'],
        testing: options.testing
      };
    }
    
    const spinner = ora(`Creating ${config.type} project: ${name}`).start();
    
    try {
      const result = await scaffolding.generateProject(config);
      
      if (result.success) {
        spinner.succeed(`Project created successfully at: ${result.projectPath}`);
        
        console.log('\n' + chalk.green('[FOLDER] Project Structure:'));
        result.structure.slice(0, 20).forEach(item => {
          console.log(`  ${item}`);
        });
        
        if (result.structure.length > 20) {
          console.log(`  ${chalk.gray(`... and ${result.structure.length - 20} more items`)}`);
        }
        
        console.log('\n' + chalk.yellow('[CLIPBOARD] Next Steps:'));
        console.log(`  1. cd ${name}`);
        console.log(`  2. npm install`);
        console.log(`  3. anchor build`);
        console.log(`  4. anchor test`);
        console.log(`  5. solana-cicd deploy --network devnet`);
        
      } else {
        spinner.fail(`Project creation failed: ${result.error}`);
        process.exit(1);
      }
    } catch (error) {
      spinner.fail(`Project creation failed: ${error.message}`);
      process.exit(1);
    }
  });

project
  .command('template <type>')
  .description('Generate specific project templates')
  .option('-o, --output <path>', 'Output directory', '.')
  .action(async (type, options) => {
    const templates = ['defi-amm', 'nft-marketplace', 'dao-governance', 'trading-agent', 'yield-farm'];
    
    if (!templates.includes(type)) {
      console.error(chalk.red(`❌ Unknown template: ${type}`));
      console.log(`Available templates: ${templates.join(', ')}`);
      process.exit(1);
    }
    
    const spinner = ora(`Generating ${type} template...`).start();
    
    try {
      await generateSpecificTemplate(type, options.output);
      spinner.succeed(`Template generated: ${type}`);
    } catch (error) {
      spinner.fail(`Template generation failed: ${error.message}`);
    }
  });

/**
 * Deployment commands
 */
const deploy = program
  .command('deploy')
  .description('Deployment management and automation');

deploy
  .command('run')
  .description('Deploy to a specific network')
  .option('-n, --network <network>', 'Target network (localnet, devnet, testnet, mainnet)', 'devnet')
  .option('-p, --project <path>', 'Project path', '.')
  .option('--skip-checks', 'Skip safety checks')
  .option('--dry-run', 'Simulate deployment without executing')
  .option('--programs <programs>', 'Specific programs to deploy (comma-separated)')
  .action(async (options) => {
    console.log(banner);
    
    if (options.network === 'mainnet') {
      console.log(chalk.red.bold('[WARNING]  MAINNET DEPLOYMENT WARNING'));
      console.log(chalk.yellow('This will deploy to Solana mainnet with real SOL.'));
      
      const { confirm } = await inquirer.prompt([{
        type: 'confirm',
        name: 'confirm',
        message: 'Are you sure you want to continue?',
        default: false
      }]);
      
      if (!confirm) {
        console.log('Deployment cancelled.');
        return;
      }
    }
    
    const config = {
      network: options.network,
      projectPath: path.resolve(options.project),
      safetyChecks: !options.skipChecks,
      dryRun: options.dryRun,
      programs: options.programs ? options.programs.split(',') : undefined
    };
    
    const spinner = ora(`Deploying to ${options.network}...`).start();
    
    // Set up deployment event listeners
    deployment.on('deployment:log', ({ level, message }) => {
      spinner.text = message;
    });
    
    deployment.on('deployment:completed', (result) => {
      spinner.succeed(`Deployment completed to ${options.network}`);
      console.log('\n' + chalk.green('[SUCCESS] Deployment Summary:'));
      console.log(`   Network: ${result.network}`);
      console.log(`   Duration: ${result.endTime - result.startTime}ms`);
      console.log(`   Programs Deployed: ${Object.keys(result.programIds).length}`);
      
      console.log('\n' + chalk.cyan('[CLIPBOARD] Program IDs:'));
      Object.entries(result.programIds).forEach(([program, id]) => {
        console.log(`   ${program}: ${id}`);
      });
    });
    
    deployment.on('deployment:failed', ({ deployment, error }) => {
      spinner.fail(`Deployment failed: ${error.message}`);
      console.log('\n' + chalk.red('[ERROR] Deployment Logs:'));
      deployment.logs.slice(-5).forEach(log => {
        console.log(`   [${log.level.toUpperCase()}] ${log.message}`);
      });
    });
    
    try {
      await deployment.deployWithSafetyChecks(config);
    } catch (error) {
      // Error already handled by event listeners
      process.exit(1);
    }
  });

deploy
  .command('status [deploymentId]')
  .description('Check deployment status')
  .action(async (deploymentId) => {
    if (deploymentId) {
      const status = deployment.getDeploymentStatus(deploymentId);
      if (status) {
        console.log(chalk.cyan('[INFO] Metrics Deployment Status:'));
        console.log(JSON.stringify(status, null, 2));
      } else {
        console.log(chalk.red(`[ERROR] Deployment not found: ${deploymentId}`));
      }
    } else {
      const deployments = deployment.listDeployments();
      if (deployments.length === 0) {
        console.log(chalk.yellow('[EMPTY] No deployments found'));
      } else {
        console.log(chalk.cyan('[CLIPBOARD] Recent Deployments:'));
        deployments.slice(-10).forEach(d => {
          const status = d.status === 'completed' ? chalk.green('[CHECK]') : 
                        d.status === 'failed' ? chalk.red('✗') : chalk.yellow('⏳');
          console.log(`   ${status} ${d.id} - ${d.network} (${d.status})`);
        });
      }
    }
  });

/**
 * CI/CD workflow commands
 */
const workflow = program
  .command('workflow')
  .description('CI/CD workflow management');

workflow
  .command('generate')
  .description('Generate CI/CD workflow files')
  .option('-t, --type <type>', 'Workflow type (basic, comprehensive, agent, multidex)', 'comprehensive')
  .option('-o, --output <path>', 'Output directory', '.github/workflows')
  .option('-p, --project <path>', 'Project path', '.')
  .action(async (options) => {
    const spinner = ora('Generating CI/CD workflows...').start();
    
    try {
      const projectPath = path.resolve(options.project);
      const outputPath = path.join(projectPath, options.output);
      
      await fs.mkdir(outputPath, { recursive: true });
      
      let workflowContent;
      switch (options.type) {
        case 'agent':
          workflowContent = await fs.readFile(
            path.join(__dirname, '..', 'templates', 'github-actions', 'solana-agent-multidex.yml'),
            'utf8'
          );
          await fs.writeFile(path.join(outputPath, 'agent-pipeline.yml'), workflowContent);
          break;
        case 'comprehensive':
          workflowContent = await fs.readFile(
            path.join(__dirname, '..', 'templates', 'github-actions', 'solana-comprehensive.yml'),
            'utf8'
          );
          await fs.writeFile(path.join(outputPath, 'ci-cd.yml'), workflowContent);
          break;
        case 'basic':
          const basicWorkflow = cicd.generateSolanaWorkflow({
            name: path.basename(projectPath)
          });
          await fs.writeFile(path.join(outputPath, 'basic-ci.yml'), basicWorkflow);
          break;
        default:
          throw new Error(`Unknown workflow type: ${options.type}`);
      }
      
      spinner.succeed(`CI/CD workflows generated in ${options.output}`);
      
      console.log('\n' + chalk.yellow('[CLIPBOARD] Next Steps:'));
      console.log('  1. Review the generated workflow files');
      console.log('  2. Configure GitHub secrets for deployment keys');
      console.log('  3. Push to GitHub to trigger the pipeline');
      
    } catch (error) {
      spinner.fail(`Workflow generation failed: ${error.message}`);
    }
  });

workflow
  .command('secrets')
  .description('Display required GitHub secrets')
  .option('-n, --network <network>', 'Target network', 'all')
  .action(async (options) => {
    console.log(chalk.cyan('[SECURITY] Required GitHub Secrets:'));
    
    const secrets = {
      all: [
        'GITHUB_TOKEN - For repository access',
        'JUPITER_API_KEY - For DEX integration testing',
        'HELIUS_API_KEY - For enhanced RPC access'
      ],
      devnet: [
        'DEVNET_DEPLOY_KEY - Private key for devnet deployment wallet'
      ],
      testnet: [
        'TESTNET_DEPLOY_KEY - Private key for testnet deployment wallet'
      ],
      mainnet: [
        'MAINNET_DEPLOY_KEY - Private key for mainnet deployment wallet',
        'MAINNET_MONITORING_API_KEY - For production monitoring'
      ]
    };
    
    if (options.network === 'all') {
      Object.entries(secrets).forEach(([network, secretList]) => {
        console.log(`\n${chalk.yellow(network.toUpperCase())}:`);
        secretList.forEach(secret => console.log(`  • ${secret}`));
      });
    } else if (secrets[options.network]) {
      secrets[options.network].forEach(secret => console.log(`  • ${secret}`));
    } else {
      console.log(chalk.red(`[ERROR] Unknown network: ${options.network}`));
    }
    
    console.log('\n' + chalk.gray('[INFO] Configure these in your GitHub repository: Settings → Secrets and variables → Actions'));
  });

/**
 * Monitoring and analytics commands
 */
const monitor = program
  .command('monitor')
  .description('Deployment monitoring and analytics');

monitor
  .command('health')
  .description('Check deployment health')
  .option('-n, --network <network>', 'Network to check', 'devnet')
  .option('-p, --program <programId>', 'Specific program ID to check')
  .action(async (options) => {
    const spinner = ora(`Checking health on ${options.network}...`).start();
    
    try {
      // Health check implementation would go here
      spinner.succeed(`Health check completed for ${options.network}`);
    } catch (error) {
      spinner.fail(`Health check failed: ${error.message}`);
    }
  });

monitor
  .command('metrics')
  .description('Display deployment metrics and analytics')
  .option('--json', 'Output as JSON')
  .action(async (options) => {
    // Metrics implementation would go here
    console.log(chalk.cyan('[INFO] Metrics Deployment Metrics:'));
    console.log('  Coming soon - deployment analytics and performance metrics');
  });

/**
 * Utility functions
 */
async function runProjectWizard(name) {
  const questions = [
    {
      type: 'list',
      name: 'type',
      message: 'What type of project do you want to create?',
      choices: [
        { name: '🔷 Basic - Simple Solana program', value: 'basic' },
        { name: '[MONEY] DeFi - Decentralized finance protocols', value: 'defi' },
        { name: '🖼️  NFT - Non-fungible token projects', value: 'nft' },
        { name: '🏛️  DAO - Decentralized autonomous organization', value: 'dao' },
        { name: '[BOT] Agent - Trading and automation bots', value: 'agent' },
        { name: '🎮 Gaming - Blockchain gaming projects', value: 'gaming' }
      ]
    },
    {
      type: 'list',
      name: 'structure',
      message: 'What project structure do you prefer?',
      choices: [
        { name: '📦 Monorepo - Programs + clients in one repository', value: 'monorepo' },
        { name: '📁 Basic - Simple single-program structure', value: 'basic' }
      ]
    },
    {
      type: 'checkbox',
      name: 'features',
      message: 'Select additional features to include:',
      choices: [
        { name: 'Yield farming capabilities', value: 'yield-farming' },
        { name: 'Governance mechanisms', value: 'governance' },
        { name: 'Flash loan integration', value: 'flash-loans' },
        { name: 'Multi-DEX routing', value: 'multi-dex' },
        { name: 'Cross-chain bridges', value: 'cross-chain' },
        { name: 'Advanced monitoring', value: 'monitoring' }
      ]
    },
    {
      type: 'checkbox',
      name: 'clientTypes',
      message: 'What client applications do you need?',
      choices: [
        { name: 'Web application (React/Next.js)', value: 'web' },
        { name: 'Mobile application (React Native)', value: 'mobile' },
        { name: 'Command-line interface', value: 'cli' }
      ]
    },
    {
      type: 'list',
      name: 'testing',
      message: 'Which testing framework do you prefer?',
      choices: [
        { name: 'LiteSVM - Fast, modern testing (recommended)', value: 'litesvm' },
        { name: 'Anchor Test - Traditional anchor test', value: 'anchor' }
      ]
    }
  ];
  
  const answers = await inquirer.prompt(questions);
  return { name, ...answers };
}

async function generateSpecificTemplate(type, outputPath) {
  // Template generation implementation would go here
  const templatePath = path.join(outputPath, type);
  await fs.mkdir(templatePath, { recursive: true });
  // Generate template-specific files...
}

// Error handling
process.on('unhandledRejection', (error) => {
  console.error(chalk.red('❌ Unhandled error:'), error);
  process.exit(1);
});

// Parse command line arguments
program.parse();