/**
 * Anchor Program Development Commands (Official Stack Default)
 */

const chalk = require('chalk');
const { execSync } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

/**
 * Main anchor command handler
 */
async function main(options = {}) {
  console.log(chalk.cyan('Anchor Program Development (Official Stack Default)'));
  
  try {
    // Check if we're in an Anchor workspace
    const anchorToml = path.join(process.cwd(), 'Anchor.toml');
    if (!fs.existsSync(anchorToml)) {
      console.log(chalk.yellow('No Anchor.toml found. Initialize Anchor workspace first:'));
      console.log(chalk.gray('  anchor init my-program'));
      return;
    }

    if (options.build) {
      await buildPrograms();
    } else if (options.test) {
      await runTests();
    } else if (options.deploy) {
      await deployPrograms();
    } else {
      await showStatus();
    }

  } catch (error) {
    console.error(chalk.red(` Anchor command failed: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Build Anchor programs
 */
async function buildPrograms() {
  console.log(chalk.blue(' Building Anchor programs...'));
  
  try {
    execSync('anchor build', { stdio: 'inherit' });
    console.log(chalk.green(' Programs built successfully'));
    
    // Generate TypeScript client
    console.log(chalk.blue(' Generating TypeScript client...'));
    execSync('anchor idl parse --file target/idl/*.json --out app/src/idl/', { stdio: 'inherit' });
    
  } catch (error) {
    console.error(chalk.red('Build failed:', error.message));
    throw error;
  }
}

/**
 * Run Anchor tests with official stack integration
 */
async function runTests() {
  console.log(chalk.blue(' Running Anchor tests...'));
  
  try {
    // Check for LiteSVM integration
    const hasLiteSVM = fs.existsSync(path.join(process.cwd(), 'tests-litesvm'));
    
    if (hasLiteSVM) {
      console.log(chalk.cyan(' Using LiteSVM for fast testing...'));
      execSync('npm run test:litesvm', { stdio: 'inherit' });
    } else {
      console.log(chalk.yellow(' Using standard Anchor testing...'));
      execSync('anchor test', { stdio: 'inherit' });
    }
    
    console.log(chalk.green(' Tests completed'));
    
  } catch (error) {
    console.error(chalk.red('Tests failed:', error.message));
    throw error;
  }
}

/**
 * Deploy programs to cluster
 */
async function deployPrograms() {
  console.log(chalk.blue(' Deploying Anchor programs...'));
  
  try {
    // Build first
    await buildPrograms();
    
    // Deploy
    execSync('anchor deploy', { stdio: 'inherit' });
    console.log(chalk.green(' Programs deployed successfully'));
    
    // Update IDL
    console.log(chalk.blue(' Updating on-chain IDL...'));
    execSync('anchor idl upload --filepath target/idl/*.json', { stdio: 'inherit' });
    
  } catch (error) {
    console.error(chalk.red('Deployment failed:', error.message));
    throw error;
  }
}

/**
 * Show Anchor workspace status
 */
async function showStatus() {
  console.log(chalk.cyan(' Anchor Workspace Status'));
  
  try {
    const anchorToml = path.join(process.cwd(), 'Anchor.toml');
    const config = fs.readFileSync(anchorToml, 'utf8');
    
    console.log(chalk.gray('Configuration:'));
    console.log(config);
    
    // Show programs
    const programsDir = path.join(process.cwd(), 'programs');
    if (fs.existsSync(programsDir)) {
      const programs = fs.readdirSync(programsDir);
      console.log(chalk.blue(`\\n Programs (${programs.length}):`));
      programs.forEach(program => {
        console.log(chalk.gray(`  - ${program}`));
      });
    }
    
    // Show available commands
    console.log(chalk.cyan('\\n Available commands:'));
    console.log(chalk.gray('  solana-devex anchor --build    # Build programs'));
    console.log(chalk.gray('  solana-devex anchor --test     # Run tests'));
    console.log(chalk.gray('  solana-devex anchor --deploy   # Deploy to cluster'));
    
  } catch (error) {
    console.error(chalk.red('Status check failed:', error.message));
  }
}

module.exports = {
  main,
  buildPrograms,
  runTests,
  deployPrograms
};