const chalk = require('chalk');
const ora = require('ora');
const fs = require('fs-extra');
const path = require('path');
const { spawn } = require('cross-spawn');
const chokidar = require('chokidar');
const { loadConfig } = require('../utils/config');
const { findAnchorWorkspace, validatePrograms } = require('../utils/workspace');

class BuildCommand {
  constructor(globalOpts = {}) {
    this.globalOpts = globalOpts;
    this.config = null;
  }

  async execute(options = {}) {
    try {
      await this.initializeConfig();
      
      if (options.watch) {
        return this.watch();
      }
      
      const spinner = ora('Building Solana programs...').start();
      
      // Validate workspace
      const workspace = await this.validateWorkspace();
      
      // Parse programs to build
      const programs = this.parsePrograms(options.programs);
      
      // Build programs
      const buildResults = await this.buildPrograms(programs, options, spinner);
      
      // Verify if requested
      if (options.verify) {
        spinner.text = 'Verifying programs...';
        await this.verifyPrograms(buildResults);
      }
      
      spinner.succeed(chalk.green('Build completed successfully!'));
      
      this.displayBuildSummary(buildResults);
      
    } catch (error) {
      console.error(chalk.red('\n❌ Build failed:'), error.message);
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

  parsePrograms(programsOption) {
    if (!programsOption) {
      return null; // Build all programs
    }
    
    return programsOption.split(',').map(p => p.trim()).filter(Boolean);
  }

  async buildPrograms(programs, options, spinner) {
    const buildResults = [];
    const workspace = await this.validateWorkspace();
    
    if (options.parallel && programs && programs.length > 1) {
      // Build in parallel
      const buildPromises = programs.map(program => 
        this.buildSingleProgram(program, options, workspace)
      );
      
      const results = await Promise.allSettled(buildPromises);
      
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          buildResults.push(result.value);
        } else {
          buildResults.push({
            program: programs[index],
            success: false,
            error: result.reason.message
          });
        }
      });
    } else {
      // Build sequentially
      if (programs) {
        for (const program of programs) {
          const result = await this.buildSingleProgram(program, options, workspace);
          buildResults.push(result);
          
          if (!result.success) {
            throw new Error(`Build failed for program: ${program}`);
          }
        }
      } else {
        // Build all programs using Anchor
        const result = await this.buildAllPrograms(options, workspace);
        buildResults.push(result);
      }
    }
    
    return buildResults;
  }

  async buildSingleProgram(program, options, workspace) {
    const startTime = Date.now();
    
    try {
      const args = ['build'];
      
      if (options.release) {
        args.push('--verifiable');
      }
      
      // Add program-specific flags
      args.push('--program', program);
      
      const result = await this.runAnchorCommand(args, workspace);
      
      const duration = Date.now() - startTime;
      
      return {
        program,
        success: true,
        duration,
        output: result.output,
        binarySize: await this.getBinarySize(program, workspace)
      };
    } catch (error) {
      return {
        program,
        success: false,
        error: error.message,
        duration: Date.now() - startTime
      };
    }
  }

  async buildAllPrograms(options, workspace) {
    const startTime = Date.now();
    
    try {
      const args = ['build'];
      
      if (options.release) {
        args.push('--verifiable');
      }
      
      const result = await this.runAnchorCommand(args, workspace);
      
      const duration = Date.now() - startTime;
      const programs = await this.getBuiltPrograms(workspace);
      
      return {
        program: 'all',
        success: true,
        duration,
        output: result.output,
        programs: programs.length,
        binarySize: await this.getTotalBinarySize(programs, workspace)
      };
    } catch (error) {
      return {
        program: 'all',
        success: false,
        error: error.message,
        duration: Date.now() - startTime
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
        output += data.toString();
        if (this.globalOpts.verbose) {
          process.stdout.write(data);
        }
      });

      child.stderr.on('data', (data) => {
        errorOutput += data.toString();
        if (this.globalOpts.verbose) {
          process.stderr.write(data);
        }
      });

      child.on('close', (code) => {
        if (code === 0) {
          resolve({ output, code });
        } else {
          reject(new Error(`Anchor command failed (exit code ${code}):\n${errorOutput}`));
        }
      });

      child.on('error', (error) => {
        reject(new Error(`Failed to spawn anchor command: ${error.message}`));
      });
    });
  }

  async getBinarySize(program, workspace) {
    try {
      const binaryPath = path.join(workspace, 'target', 'deploy', `${program}.so`);
      const stats = await fs.stat(binaryPath);
      return stats.size;
    } catch {
      return null;
    }
  }

  async getTotalBinarySize(programs, workspace) {
    let totalSize = 0;
    
    for (const program of programs) {
      const size = await this.getBinarySize(program, workspace);
      if (size) {
        totalSize += size;
      }
    }
    
    return totalSize;
  }

  async getBuiltPrograms(workspace) {
    try {
      const deployDir = path.join(workspace, 'target', 'deploy');
      const files = await fs.readdir(deployDir);
      return files.filter(f => f.endsWith('.so')).map(f => f.replace('.so', ''));
    } catch {
      return [];
    }
  }

  async verifyPrograms(buildResults) {
    for (const result of buildResults) {
      if (result.success) {
        try {
          // TODO: Implement program verification
          result.verified = true;
        } catch (error) {
          result.verified = false;
          result.verificationError = error.message;
        }
      }
    }
  }

  displayBuildSummary(buildResults) {
    console.log(chalk.bold('\n📊 Build Summary'));
    console.log('━'.repeat(50));
    
    buildResults.forEach(result => {
      const status = result.success ? 
        chalk.green('✅ SUCCESS') : 
        chalk.red('❌ FAILED');
      
      const programName = result.program === 'all' ? 
        `All Programs (${result.programs} total)` : 
        result.program;
      
      console.log(`${status} ${chalk.bold(programName)}`);
      console.log(`   Duration: ${result.duration}ms`);
      
      if (result.binarySize) {
        const sizeKB = (result.binarySize / 1024).toFixed(1);
        console.log(`   Size: ${sizeKB}KB`);
      }
      
      if (result.verified !== undefined) {
        const verifyStatus = result.verified ? 
          chalk.green('✅ Verified') : 
          chalk.yellow('⚠️  Not verified');
        console.log(`   Verification: ${verifyStatus}`);
      }
      
      if (result.error) {
        console.log(chalk.red(`   Error: ${result.error}`));
      }
      
      console.log('');
    });
  }

  async watch() {
    console.log(chalk.blue('👀 Watching for file changes...'));
    console.log(chalk.gray('Press Ctrl+C to stop\n'));
    
    const workspace = await this.validateWorkspace();
    let isBuilding = false;
    
    const watcher = chokidar.watch([
      path.join(workspace, 'programs/**/*.rs'),
      path.join(workspace, 'Anchor.toml'),
      path.join(workspace, 'Cargo.toml')
    ], {
      ignored: /target/,
      persistent: true,
      ignoreInitial: true
    });

    const rebuild = async (changedFile) => {
      if (isBuilding) return;
      
      isBuilding = true;
      
      console.log(chalk.yellow(`\n📝 File changed: ${path.relative(workspace, changedFile)}`));
      
      try {
        await this.execute({ watch: false });
        console.log(chalk.green('✅ Rebuild completed'));
      } catch (error) {
        console.log(chalk.red('❌ Rebuild failed'));
      } finally {
        isBuilding = false;
      }
      
      console.log(chalk.blue('\n👀 Watching for changes...'));
    };

    watcher.on('change', rebuild);
    watcher.on('add', rebuild);
    
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n⏹️  Stopping file watcher...'));
      watcher.close();
      process.exit(0);
    });
  }

  async clean(options = {}) {
    const spinner = ora('Cleaning build artifacts...').start();
    
    try {
      const workspace = await this.validateWorkspace();
      
      if (options.all || !options.cache) {
        // Clean target directory
        const targetDir = path.join(workspace, 'target');
        if (await fs.pathExists(targetDir)) {
          await fs.remove(targetDir);
          spinner.text = 'Removed target directory';
        }
      }
      
      if (options.cache || options.all) {
        // Clean Cargo cache
        await this.runAnchorCommand(['clean'], workspace);
      }
      
      spinner.succeed(chalk.green('Clean completed!'));
      
    } catch (error) {
      spinner.fail(chalk.red('Clean failed'));
      throw error;
    }
  }
}

module.exports = BuildCommand;