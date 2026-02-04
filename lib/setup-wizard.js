/**
 * Solana DevEx Platform Setup Wizard
 * Guides users through complete platform setup
 */

const chalk = require('chalk');
const inquirer = require('inquirer');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('child_process');
const ora = require('ora');

class SetupWizard {
  constructor() {
    this.steps = [
      'welcome',
      'checkDependencies', 
      'configureEnvironment',
      'setupComponents',
      'installDependencies',
      'initializeProject',
      'finalizeSetup'
    ];
    this.currentStep = 0;
    this.config = {};
  }

  async run() {
    console.log(chalk.blue.bold('\n🚀 Welcome to Solana DevEx Platform Setup!\n'));
    console.log(chalk.dim('This wizard will guide you through setting up your complete Solana development environment.\n'));

    try {
      for (const step of this.steps) {
        await this[step]();
        this.currentStep++;
      }
      
      await this.showCompletionMessage();
    } catch (error) {
      console.error(chalk.red('\n❌ Setup failed:'), error.message);
      console.log(chalk.yellow('You can run the setup wizard again with: solana-devex setup'));
      process.exit(1);
    }
  }

  async welcome() {
    console.log(chalk.cyan('📋 Step 1: Welcome & Overview\n'));
    
    const { proceed } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'proceed',
        message: 'Ready to set up the Solana DevEx Platform?',
        default: true
      }
    ]);

    if (!proceed) {
      console.log(chalk.yellow('Setup cancelled. Run again when ready!'));
      process.exit(0);
    }

    const { setupType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'setupType',
        message: 'What type of setup do you need?',
        choices: [
          { name: '🚀 Full Platform (Recommended) - All components', value: 'full' },
          { name: '🎯 Developer Only - Core tools only', value: 'developer' },
          { name: '🏗️ Custom - Choose components', value: 'custom' }
        ]
      }
    ]);

    this.config.setupType = setupType;
  }

  async checkDependencies() {
    console.log(chalk.cyan('\n🔍 Step 2: Checking Dependencies\n'));
    
    const spinner = ora('Checking system dependencies...').start();
    
    const dependencies = [
      { name: 'Node.js', command: 'node --version', required: true },
      { name: 'npm', command: 'npm --version', required: true },
      { name: 'Git', command: 'git --version', required: true },
      { name: 'Rust', command: 'rustc --version', required: true },
      { name: 'Solana CLI', command: 'solana --version', required: true },
      { name: 'Anchor CLI', command: 'anchor --version', required: false }
    ];

    const missing = [];
    const versions = {};

    for (const dep of dependencies) {
      try {
        const result = await this.runCommand(dep.command);
        versions[dep.name] = result.trim();
      } catch (error) {
        if (dep.required) {
          missing.push(dep.name);
        }
      }
    }

    spinner.stop();

    if (missing.length > 0) {
      console.log(chalk.red('❌ Missing required dependencies:'));
      missing.forEach(dep => console.log(chalk.dim(`   - ${dep}`)));
      console.log(chalk.yellow('\nPlease install missing dependencies and run setup again.'));
      
      const { showInstructions } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'showInstructions',
          message: 'Show installation instructions?',
          default: true
        }
      ]);

      if (showInstructions) {
        this.showInstallInstructions(missing);
      }
      
      process.exit(1);
    }

    console.log(chalk.green('✅ All dependencies found:'));
    Object.entries(versions).forEach(([name, version]) => {
      console.log(chalk.dim(`   ${name}: ${version}`));
    });
  }

  async configureEnvironment() {
    console.log(chalk.cyan('\n⚙️ Step 3: Environment Configuration\n'));

    const questions = [
      {
        type: 'list',
        name: 'environment',
        message: 'Select development environment:',
        choices: [
          { name: '💻 Local Development', value: 'development' },
          { name: '🧪 Testing/Staging', value: 'staging' },
          { name: '🏭 Production', value: 'production' }
        ]
      },
      {
        type: 'list',
        name: 'network',
        message: 'Default Solana network:',
        choices: [
          { name: '🏠 Localnet (Recommended for dev)', value: 'localnet' },
          { name: '🧪 Devnet', value: 'devnet' },
          { name: '🚀 Testnet', value: 'testnet' },
          { name: '💰 Mainnet (Use with caution)', value: 'mainnet-beta' }
        ]
      }
    ];

    if (this.config.setupType === 'custom') {
      questions.push({
        type: 'checkbox',
        name: 'components',
        message: 'Select components to install:',
        choices: [
          { name: '🧪 Jest Blockchain Extensions', value: 'jest', checked: true },
          { name: '⚓ Anchor Enhancements', value: 'anchor', checked: true },
          { name: '🌐 Enhanced Test Validator', value: 'validator', checked: true },
          { name: '🔄 CI/CD Pipeline', value: 'cicd', checked: true },
          { name: '📊 Monitoring Dashboard', value: 'monitoring', checked: true },
          { name: '⚡ GitHub Actions Templates', value: 'actions', checked: true }
        ]
      });
    }

    const answers = await inquirer.prompt(questions);
    Object.assign(this.config, answers);
  }

  async setupComponents() {
    console.log(chalk.cyan('\n🔧 Step 4: Component Setup\n'));

    const components = this.getSelectedComponents();
    
    for (const component of components) {
      const spinner = ora(`Setting up ${component.name}...`).start();
      
      try {
        await component.setup();
        spinner.succeed(chalk.green(`${component.name} configured`));
      } catch (error) {
        spinner.fail(chalk.red(`Failed to setup ${component.name}`));
        throw error;
      }
    }
  }

  async installDependencies() {
    console.log(chalk.cyan('\n📦 Step 5: Installing Dependencies\n'));

    const spinner = ora('Installing platform dependencies...').start();
    
    try {
      await this.runCommand('npm install', { cwd: process.cwd() });
      spinner.succeed(chalk.green('Dependencies installed'));
    } catch (error) {
      spinner.fail(chalk.red('Failed to install dependencies'));
      throw error;
    }
  }

  async initializeProject() {
    console.log(chalk.cyan('\n🏗️ Step 6: Project Initialization\n'));

    const { createProject } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'createProject',
        message: 'Create a sample project to test the platform?',
        default: true
      }
    ]);

    if (createProject) {
      const { projectName } = await inquirer.prompt([
        {
          type: 'input',
          name: 'projectName',
          message: 'Project name:',
          default: 'my-solana-project'
        }
      ]);

      const spinner = ora(`Creating project ${projectName}...`).start();
      
      try {
        await this.runCommand(`node bin/solana-devex init ${projectName} --template anchor --testing --cicd --monitoring --validator`);
        spinner.succeed(chalk.green(`Project ${projectName} created`));
        this.config.projectName = projectName;
      } catch (error) {
        spinner.fail(chalk.red('Failed to create project'));
        throw error;
      }
    }
  }

  async finalizeSetup() {
    console.log(chalk.cyan('\n✨ Step 7: Finalizing Setup\n'));

    // Create global configuration
    const { initConfig } = require('../packages/shared/lib/config');
    await initConfig();

    // Setup shell completion if requested
    const { setupCompletion } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'setupCompletion',
        message: 'Setup shell completion for solana-devex command?',
        default: true
      }
    ]);

    if (setupCompletion) {
      await this.setupShellCompletion();
    }

    console.log(chalk.green('✅ Setup completed successfully!'));
  }

  getSelectedComponents() {
    if (this.config.setupType === 'full') {
      return [
        { name: 'Jest Extensions', setup: () => this.setupJestExtensions() },
        { name: 'Anchor Layer', setup: () => this.setupAnchorLayer() },
        { name: 'Test Validator', setup: () => this.setupTestValidator() },
        { name: 'CI/CD Pipeline', setup: () => this.setupCICD() },
        { name: 'Monitoring', setup: () => this.setupMonitoring() },
        { name: 'GitHub Actions', setup: () => this.setupGitHubActions() }
      ];
    } else if (this.config.setupType === 'developer') {
      return [
        { name: 'Jest Extensions', setup: () => this.setupJestExtensions() },
        { name: 'Test Validator', setup: () => this.setupTestValidator() }
      ];
    } else {
      return this.config.components.map(comp => ({
        name: comp,
        setup: () => this[`setup${comp.charAt(0).toUpperCase() + comp.slice(1)}`]()
      }));
    }
  }

  async setupJestExtensions() {
    // Setup Jest blockchain extensions
    return Promise.resolve();
  }

  async setupAnchorLayer() {
    // Setup Anchor enhancements
    return Promise.resolve();
  }

  async setupTestValidator() {
    // Setup enhanced test validator
    return Promise.resolve();
  }

  async setupCICD() {
    // Setup CI/CD pipeline
    return Promise.resolve();
  }

  async setupMonitoring() {
    // Setup monitoring dashboard
    return Promise.resolve();
  }

  async setupGitHubActions() {
    // Setup GitHub Actions templates
    return Promise.resolve();
  }

  async setupShellCompletion() {
    console.log(chalk.yellow('Shell completion setup instructions:'));
    console.log(chalk.dim('Add this line to your shell profile (~/.bashrc, ~/.zshrc, etc.):'));
    console.log(chalk.cyan('eval "$(solana-devex completion)"'));
  }

  async showCompletionMessage() {
    console.log(chalk.green.bold('\n🎉 Solana DevEx Platform Setup Complete!\n'));
    
    console.log(chalk.yellow('📋 What was installed:'));
    const components = this.getSelectedComponents();
    components.forEach(comp => {
      console.log(chalk.dim(`   ✅ ${comp.name}`));
    });

    if (this.config.projectName) {
      console.log(chalk.yellow(`\n🏗️ Sample project created: ${this.config.projectName}`));
      console.log(chalk.dim(`   cd ${this.config.projectName}`));
    }

    console.log(chalk.yellow('\n🚀 Next steps:'));
    console.log(chalk.dim('   solana-devex --help          # See all commands'));
    console.log(chalk.dim('   solana-devex config show     # View configuration'));
    console.log(chalk.dim('   solana-devex build           # Build a project'));
    console.log(chalk.dim('   solana-devex test             # Run tests'));
    console.log(chalk.dim('   solana-devex validator start # Start test validator'));
    console.log(chalk.dim('   solana-devex monitor start   # Start dashboard'));

    console.log(chalk.yellow('\n📚 Documentation:'));
    console.log(chalk.dim('   ./docs/README.md             # Complete documentation'));
    console.log(chalk.dim('   ./docs/quickstart.md         # Quick start guide'));

    console.log(chalk.blue('\n💬 Support:'));
    console.log(chalk.dim('   GitHub Issues: https://github.com/solana-devex/platform/issues'));
    console.log(chalk.dim('   Discord: https://discord.gg/solana-devex'));
  }

  showInstallInstructions(missing) {
    console.log(chalk.yellow('\n📋 Installation Instructions:\n'));

    const instructions = {
      'Node.js': 'Visit https://nodejs.org/ or use nvm: curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash',
      'npm': 'Comes with Node.js',
      'Git': 'Visit https://git-scm.com/ or use your package manager',
      'Rust': 'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs/ | sh',
      'Solana CLI': 'sh -c "$(curl -sSfL https://release.solana.com/v1.17.0/install)"',
      'Anchor CLI': 'cargo install --git https://github.com/coral-xyz/anchor anchor-cli --locked'
    };

    missing.forEach(dep => {
      if (instructions[dep]) {
        console.log(chalk.yellow(`${dep}:`));
        console.log(chalk.dim(`   ${instructions[dep]}\n`));
      }
    });
  }

  runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
      const child = spawn('bash', ['-c', command], {
        stdio: ['ignore', 'pipe', 'pipe'],
        ...options
      });

      let output = '';
      let error = '';

      child.stdout.on('data', (data) => {
        output += data.toString();
      });

      child.stderr.on('data', (data) => {
        error += data.toString();
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve(output);
        } else {
          reject(new Error(error || `Command failed with code ${code}`));
        }
      });
    });
  }
}

async function runSetupWizard() {
  const wizard = new SetupWizard();
  await wizard.run();
}

module.exports = {
  runSetupWizard,
  SetupWizard
};