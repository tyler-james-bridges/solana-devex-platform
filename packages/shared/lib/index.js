/**
 * Shared Package - Main Entry Point
 * Common utilities and configuration used across all platform components
 */

const { getConfig, initConfig, showConfig, Config, DEFAULT_CONFIG } = require('./config');

module.exports = {
  // Configuration system
  getConfig,
  initConfig,
  showConfig,
  Config,
  DEFAULT_CONFIG,

  // Shared utilities (to be implemented as needed)
  utils: {
    // Common utility functions can be added here
    validateSolanaAddress: (address) => {
      // Basic validation - can be enhanced
      return typeof address === 'string' && address.length >= 32;
    },
    
    formatBalance: (balance) => {
      return (balance / 1e9).toFixed(4) + ' SOL';
    },
    
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms))
  }
};