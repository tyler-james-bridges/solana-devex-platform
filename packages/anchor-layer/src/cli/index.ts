#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import boxen from 'boxen';
import { AnchorEnhancementLayer } from '../core/AnchorEnhancementLayer';
import { AnchorUtils } from '../utils/AnchorUtils';
import { logger, LogLevel } from '../utils/Logger';
import { createTestCommand } from './commands/test';
import { createDeployCommand } from './commands/deploy';
// import { createMonitorCommand } from './commands/monitor';
// import { createInitCommand } from './commands/init';
// import { createDashboardCommand } from './commands/dashboard';

const program = new Command();

// ASCII art banner
const banner = `
╔═══════════════════════════════════════╗
║     Anchor Enhancement Layer CLI      ║
║   Enhanced testing & monitoring for   ║
║         Anchor Framework              ║
╚═══════════════════════════════════════╝
`;

program
  .name('anchor-enhance')
  .description('Enhanced testing utilities and monitoring integration for Anchor Framework projects')
  .version('1.0.0')
  .option('-v, --verbose', 'Enable verbose logging')
  .option('-q, --quiet', 'Enable quiet mode (errors only)')
  .option('--no-color', 'Disable colored output')
  .hook('preAction', (thisCommand) => {
    const options = thisCommand.opts();
    
    // Set log level based on options
    if (options.quiet) {
      logger.setLevel(LogLevel.ERROR);
    } else if (options.verbose) {
      logger.setLevel(LogLevel.DEBUG);
    }

    // Disable colors if requested
    if (!options.color) {
      process.env.FORCE_COLOR = '0';
    }

    // Show banner unless in quiet mode
    if (!options.quiet) {
      console.log(chalk.cyan(banner));
    }

    // Validate Anchor workspace
    if (!AnchorUtils.isAnchorWorkspace() && !['init', 'help'].includes(thisCommand.name())) {
      console.error(chalk.red('❌ Error: Not in an Anchor workspace directory'));
      console.error(chalk.yellow('💡 Run this command from an Anchor project directory or use "anchor-enhance init" to create one'));
      process.exit(1);
    }
  });

// Add commands
program.addCommand(createTestCommand());
program.addCommand(createDeployCommand());
// program.addCommand(createMonitorCommand());
// program.addCommand(createInitCommand());
// program.addCommand(createDashboardCommand());

// Status command
program
  .command('status')
  .description('Show Anchor project status and enhancement layer information')
  .action(async () => {
    try {
      console.log(chalk.blue('📊 Anchor Enhancement Layer Status\n'));

      // Workspace validation
      const validation = AnchorUtils.validateWorkspace();
      if (validation.valid) {
        console.log(chalk.green('✅ Anchor workspace: Valid'));
      } else {
        console.log(chalk.red('❌ Anchor workspace: Issues found'));
        validation.issues.forEach(issue => {
          console.log(chalk.yellow(`   ⚠️  ${issue}`));
        });
      }

      // Program information
      const programNames = AnchorUtils.getProgramNames();
      console.log(chalk.blue(`\n📦 Programs (${programNames.length}):`));
      
      if (programNames.length === 0) {
        console.log(chalk.yellow('   No programs found'));
      } else {
        programNames.forEach(name => {
          const hasIdl = AnchorUtils.hasIdl(name);
          const status = hasIdl ? chalk.green('✅ Built') : chalk.yellow('⏳ Not built');
          console.log(`   ${name}: ${status}`);
        });
      }

      // Network information
      const network = AnchorUtils.getCurrentNetwork();
      const clusterUrl = AnchorUtils.getClusterUrl();
      console.log(chalk.blue(`\n🌐 Network:`));
      console.log(`   Cluster: ${chalk.cyan(network)}`);
      console.log(`   URL: ${chalk.gray(clusterUrl)}`);

      // Test files
      const testFiles = AnchorUtils.getTestFiles();
      console.log(chalk.blue(`\n🧪 Test Files (${testFiles.length}):`));
      if (testFiles.length === 0) {
        console.log(chalk.yellow('   No test files found'));
      } else {
        testFiles.slice(0, 5).forEach(file => {
          const relativePath = require('path').relative(process.cwd(), file);
          console.log(`   ${chalk.gray(relativePath)}`);
        });
        if (testFiles.length > 5) {
          console.log(chalk.gray(`   ... and ${testFiles.length - 5} more`));
        }
      }

      // Enhancement layer features
      console.log(chalk.blue('\n⚡ Enhancement Features:'));
      console.log(`   ${chalk.green('✅')} Real-time test results`);
      console.log(`   ${chalk.green('✅')} Deployment monitoring`);
      console.log(`   ${chalk.green('✅')} Performance tracking`);
      console.log(`   ${chalk.green('✅')} VS Code integration`);

    } catch (error) {
      console.error(chalk.red('❌ Error checking status:'), error);
      process.exit(1);
    }
  });

// Clean command
program
  .command('clean')
  .description('Clean build artifacts and caches')
  .option('--deep', 'Perform deep clean including node_modules and target directories')
  .action(async (options) => {
    try {
      console.log(chalk.blue('🧹 Cleaning Anchor project...'));

      const CommandRunner = require('../utils/CommandRunner').CommandRunner;
      const runner = new CommandRunner();

      // Basic clean
      await runner.runAnchor('clean');
      console.log(chalk.green('✅ Anchor build artifacts cleaned'));

      if (options.deep) {
        console.log(chalk.yellow('🚨 Performing deep clean...'));
        
        // Remove node_modules
        const fs = require('fs');
        const path = require('path');
        
        const nodeModulesPath = path.join(process.cwd(), 'node_modules');
        if (fs.existsSync(nodeModulesPath)) {
          console.log('   Removing node_modules...');
          fs.rmSync(nodeModulesPath, { recursive: true, force: true });
        }

        // Remove target directory
        const targetPath = path.join(process.cwd(), 'target');
        if (fs.existsSync(targetPath)) {
          console.log('   Removing target directory...');
          fs.rmSync(targetPath, { recursive: true, force: true });
        }

        // Remove .anchor directory
        const anchorPath = path.join(process.cwd(), '.anchor');
        if (fs.existsSync(anchorPath)) {
          console.log('   Removing .anchor directory...');
          fs.rmSync(anchorPath, { recursive: true, force: true });
        }

        console.log(chalk.green('✅ Deep clean completed'));
        console.log(chalk.yellow('💡 Run "npm install" and "anchor build" to rebuild'));
      }

    } catch (error) {
      console.error(chalk.red('❌ Error during clean:'), error);
      process.exit(1);
    }
  });

// Doctor command - diagnose issues
program
  .command('doctor')
  .description('Diagnose common issues and provide fixes')
  .action(async () => {
    console.log(chalk.blue('🔬 Running Anchor Enhancement Layer diagnostics...\n'));

    const issues: string[] = [];
    const fixes: string[] = [];

    try {
      // Check Anchor installation
      const { CommandRunner } = require('../utils/CommandRunner');
      const runner = new CommandRunner();
      
      try {
        await runner.run('anchor', ['--version'], { timeout: 5000 });
        console.log(chalk.green('✅ Anchor CLI is installed'));
      } catch (error) {
        issues.push('Anchor CLI not found');
        fixes.push('Install Anchor: https://www.anchor-lang.com/docs/installation');
      }

      // Check Rust installation
      try {
        await runner.run('cargo', ['--version'], { timeout: 5000 });
        console.log(chalk.green('✅ Rust is installed'));
      } catch (error) {
        issues.push('Rust not found');
        fixes.push('Install Rust: https://rustup.rs/');
      }

      // Check Solana installation
      try {
        await runner.run('solana', ['--version'], { timeout: 5000 });
        console.log(chalk.green('✅ Solana CLI is installed'));
      } catch (error) {
        issues.push('Solana CLI not found');
        fixes.push('Install Solana: https://docs.solana.com/cli/install-solana-cli-tools');
      }

      // Check Node.js version
      const nodeVersion = process.version;
      const majorVersion = parseInt(nodeVersion.slice(1));
      if (majorVersion >= 16) {
        console.log(chalk.green(`✅ Node.js version: ${nodeVersion}`));
      } else {
        issues.push(`Node.js version ${nodeVersion} is too old`);
        fixes.push('Update Node.js to version 16 or higher');
      }

      // Check workspace structure
      const validation = AnchorUtils.validateWorkspace();
      if (validation.valid) {
        console.log(chalk.green('✅ Anchor workspace structure is valid'));
      } else {
        validation.issues.forEach(issue => {
          issues.push(`Workspace: ${issue}`);
        });
        fixes.push('Run "anchor init <project-name>" to create a new workspace');
      }

      // Check if programs are buildable
      if (validation.valid) {
        const programNames = AnchorUtils.getProgramNames();
        let buildablePrograms = 0;
        
        for (const programName of programNames) {
          try {
            const programPath = `programs/${programName}`;
            const fs = require('fs');
            
            if (fs.existsSync(`${programPath}/Cargo.toml`)) {
              buildablePrograms++;
            }
          } catch (error) {
            // Ignore individual program errors
          }
        }
        
        if (buildablePrograms > 0) {
          console.log(chalk.green(`✅ ${buildablePrograms} buildable programs found`));
        } else if (programNames.length > 0) {
          issues.push('Programs found but none appear buildable');
          fixes.push('Check program Cargo.toml files');
        }
      }

      // Summary
      console.log('\n' + '─'.repeat(50));
      
      if (issues.length === 0) {
        console.log(boxen(
          chalk.green('🎉 All checks passed! Your environment is ready for enhanced Anchor development.'),
          { padding: 1, borderColor: 'green' }
        ));
      } else {
        console.log(chalk.red(`❌ Found ${issues.length} issue(s):\n`));
        
        issues.forEach((issue, index) => {
          console.log(chalk.red(`   ${index + 1}. ${issue}`));
        });
        
        console.log(chalk.yellow('\n💡 Suggested fixes:\n'));
        
        fixes.forEach((fix, index) => {
          console.log(chalk.yellow(`   ${index + 1}. ${fix}`));
        });
      }

    } catch (error) {
      console.error(chalk.red('❌ Error during diagnostics:'), error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();

// If no command provided, show help
if (!process.argv.slice(2).length) {
  program.outputHelp();
}