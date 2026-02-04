// Main library exports
const ValidatorManager = require('./validator-manager');
const EnvironmentManager = require('./environment-manager');
const PerformanceCollector = require('./performance-collector');
const MonitoringServer = require('./monitoring-server');
const { loadConfig, saveConfig, createDefaultConfig } = require('./config-loader');

module.exports = {
  ValidatorManager,
  EnvironmentManager,
  PerformanceCollector,
  MonitoringServer,
  loadConfig,
  saveConfig,
  createDefaultConfig
};