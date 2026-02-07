#!/usr/bin/env node

/**
 * Platform management utilities for Solana DevEx Platform
 */

const { spawn } = require('child_process');
const chalk = require('chalk');
const path = require('path');

/**
 * Setup platform environment
 */
function setup() {
    console.log(chalk.cyan('Setting up Solana DevEx Platform...'));
    
    // Run the main setup script
    const setupProcess = spawn('npm', ['run', 'setup'], {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
    });
    
    setupProcess.on('close', (code) => {
        if (code === 0) {
            console.log(chalk.green('✅ Platform setup completed successfully'));
        } else {
            console.error(chalk.red('❌ Platform setup failed'));
            process.exit(code);
        }
    });
}

/**
 * Start monitoring dashboard
 */
function monitor() {
    console.log(chalk.cyan('Starting monitoring dashboard...'));
    
    // Run the monitoring script
    const monitorProcess = spawn('npm', ['run', 'dev:monitor'], {
        stdio: 'inherit',
        cwd: path.join(__dirname, '..')
    });
    
    monitorProcess.on('close', (code) => {
        if (code === 0) {
            console.log(chalk.green('✅ Monitoring dashboard started'));
        } else {
            console.error(chalk.red('❌ Failed to start monitoring dashboard'));
            process.exit(code);
        }
    });
}

/**
 * Configure platform settings
 */
function config() {
    console.log(chalk.cyan('Opening platform configuration...'));
    console.log(chalk.yellow('Configuration management coming soon!'));
    console.log(chalk.gray('For now, please edit .env files manually.'));
}

module.exports = {
    setup,
    monitor,
    config
};