const fs = require('fs-extra');
const path = require('path');
const yaml = require('yaml');
const { getEnvironmentsDir } = require('./config-loader');

class EnvironmentManager {
  constructor() {
    this.environmentsDir = getEnvironmentsDir();
  }

  async createEnvironment(name, options = {}) {
    const envFile = path.join(this.environmentsDir, `${name}.yaml`);
    
    if (await fs.pathExists(envFile)) {
      throw new Error(`Environment '${name}' already exists`);
    }

    const environment = {
      name,
      port: parseInt(options.port) || 8899,
      reset: options.reset || false,
      cloneAccounts: options.cloneAccount ? [options.cloneAccount] : [],
      accountsDir: options.accountsDir || null,
      description: options.description || `Test environment: ${name}`,
      created: new Date().toISOString(),
      customFlags: options.customFlags || [],
      programs: options.programs || [],
      setupScripts: options.setupScripts || [],
      teardownScripts: options.teardownScripts || []
    };

    await fs.ensureDir(this.environmentsDir);
    const envYaml = yaml.stringify(environment);
    await fs.writeFile(envFile, envYaml);

    console.log(`Environment '${name}' created at: ${envFile}`);
    return environment;
  }

  async listEnvironments() {
    await fs.ensureDir(this.environmentsDir);
    
    const files = await fs.readdir(this.environmentsDir);
    const environments = [];

    for (const file of files) {
      if (path.extname(file) === '.yaml' || path.extname(file) === '.yml') {
        try {
          const envPath = path.join(this.environmentsDir, file);
          const content = await fs.readFile(envPath, 'utf8');
          const env = yaml.parse(content);
          env.running = await this.isEnvironmentRunning(env.name);
          environments.push(env);
        } catch (error) {
          console.warn(`Failed to load environment ${file}: ${error.message}`);
        }
      }
    }

    return environments.sort((a, b) => a.name.localeCompare(b.name));
  }

  async getEnvironment(name) {
    const envFile = path.join(this.environmentsDir, `${name}.yaml`);
    
    if (!(await fs.pathExists(envFile))) {
      // Return default environment if specific one doesn't exist
      if (name === 'development' || name === 'default') {
        return this.createDefaultEnvironment();
      }
      return null;
    }

    try {
      const content = await fs.readFile(envFile, 'utf8');
      return yaml.parse(content);
    } catch (error) {
      console.error(`Failed to load environment '${name}': ${error.message}`);
      return null;
    }
  }

  async updateEnvironment(name, updates) {
    const envFile = path.join(this.environmentsDir, `${name}.yaml`);
    
    if (!(await fs.pathExists(envFile))) {
      throw new Error(`Environment '${name}' not found`);
    }

    try {
      const content = await fs.readFile(envFile, 'utf8');
      const environment = yaml.parse(content);
      
      // Merge updates
      Object.assign(environment, updates);
      environment.updated = new Date().toISOString();
      
      const envYaml = yaml.stringify(environment);
      await fs.writeFile(envFile, envYaml);
      
      return environment;
    } catch (error) {
      throw new Error(`Failed to update environment '${name}': ${error.message}`);
    }
  }

  async deleteEnvironment(name) {
    const envFile = path.join(this.environmentsDir, `${name}.yaml`);
    
    if (!(await fs.pathExists(envFile))) {
      throw new Error(`Environment '${name}' not found`);
    }

    // Check if environment is running
    if (await this.isEnvironmentRunning(name)) {
      throw new Error(`Cannot delete running environment '${name}'. Stop the validator first.`);
    }

    await fs.remove(envFile);
    console.log(`Environment '${name}' deleted`);
  }

  async switchEnvironment(name) {
    const environment = await this.getEnvironment(name);
    if (!environment) {
      throw new Error(`Environment '${name}' not found`);
    }

    // Update current environment marker
    const currentEnvFile = path.join(this.environmentsDir, '.current');
    await fs.writeFile(currentEnvFile, name);
    
    return environment;
  }

  async getCurrentEnvironment() {
    const currentEnvFile = path.join(this.environmentsDir, '.current');
    
    try {
      if (await fs.pathExists(currentEnvFile)) {
        const name = (await fs.readFile(currentEnvFile, 'utf8')).trim();
        return await this.getEnvironment(name);
      }
    } catch (error) {
      console.log('Failed to load current environment:', error.message);
    }
    
    // Default to development environment
    return await this.getEnvironment('development');
  }

  async cloneEnvironment(sourceName, targetName, options = {}) {
    const sourceEnv = await this.getEnvironment(sourceName);
    if (!sourceEnv) {
      throw new Error(`Source environment '${sourceName}' not found`);
    }

    const targetFile = path.join(this.environmentsDir, `${targetName}.yaml`);
    if (await fs.pathExists(targetFile)) {
      throw new Error(`Target environment '${targetName}' already exists`);
    }

    const clonedEnv = { ...sourceEnv };
    clonedEnv.name = targetName;
    clonedEnv.port = options.port || (sourceEnv.port + 100); // Offset port
    clonedEnv.created = new Date().toISOString();
    clonedEnv.description = options.description || `Cloned from ${sourceName}`;
    delete clonedEnv.updated;

    const envYaml = yaml.stringify(clonedEnv);
    await fs.writeFile(targetFile, envYaml);

    console.log(`Environment '${targetName}' cloned from '${sourceName}'`);
    return clonedEnv;
  }

  async addAccountToEnvironment(envName, accountPubkey, options = {}) {
    const environment = await this.getEnvironment(envName);
    if (!environment) {
      throw new Error(`Environment '${envName}' not found`);
    }

    if (!environment.cloneAccounts) {
      environment.cloneAccounts = [];
    }

    if (!environment.cloneAccounts.includes(accountPubkey)) {
      environment.cloneAccounts.push(accountPubkey);
      await this.updateEnvironment(envName, environment);
      console.log(`Account ${accountPubkey} added to environment '${envName}'`);
    } else {
      console.log(`Account ${accountPubkey} already exists in environment '${envName}'`);
    }
  }

  async removeAccountFromEnvironment(envName, accountPubkey) {
    const environment = await this.getEnvironment(envName);
    if (!environment) {
      throw new Error(`Environment '${envName}' not found`);
    }

    if (environment.cloneAccounts) {
      const index = environment.cloneAccounts.indexOf(accountPubkey);
      if (index > -1) {
        environment.cloneAccounts.splice(index, 1);
        await this.updateEnvironment(envName, environment);
        console.log(`Account ${accountPubkey} removed from environment '${envName}'`);
      } else {
        console.log(`Account ${accountPubkey} not found in environment '${envName}'`);
      }
    }
  }

  async isEnvironmentRunning(name) {
    // This would check if the validator is currently running with this environment
    // For now, we'll implement a simple check
    try {
      const { loadConfig } = require('./config-loader');
      const config = await loadConfig();
      const ValidatorManager = require('./validator-manager');
      const validatorManager = new ValidatorManager(config);
      const status = await validatorManager.getStatus();
      
      return status.running && status.environment === name;
    } catch (error) {
      return false;
    }
  }

  createDefaultEnvironment() {
    return {
      name: 'development',
      port: 8899,
      reset: false,
      cloneAccounts: [],
      accountsDir: null,
      description: 'Default development environment',
      customFlags: [],
      programs: [],
      setupScripts: [],
      teardownScripts: []
    };
  }

  async exportEnvironment(name, outputPath) {
    const environment = await this.getEnvironment(name);
    if (!environment) {
      throw new Error(`Environment '${name}' not found`);
    }

    const exportData = {
      ...environment,
      exportedAt: new Date().toISOString(),
      version: '1.0'
    };

    await fs.writeFile(outputPath, yaml.stringify(exportData));
    console.log(`Environment '${name}' exported to: ${outputPath}`);
  }

  async importEnvironment(importPath, name = null) {
    if (!(await fs.pathExists(importPath))) {
      throw new Error(`Import file not found: ${importPath}`);
    }

    const content = await fs.readFile(importPath, 'utf8');
    const importedEnv = yaml.parse(content);

    const envName = name || importedEnv.name || 'imported-' + Date.now();
    const targetFile = path.join(this.environmentsDir, `${envName}.yaml`);

    if (await fs.pathExists(targetFile)) {
      throw new Error(`Environment '${envName}' already exists`);
    }

    // Clean up the imported environment
    delete importedEnv.exportedAt;
    delete importedEnv.version;
    importedEnv.name = envName;
    importedEnv.imported = new Date().toISOString();

    const envYaml = yaml.stringify(importedEnv);
    await fs.writeFile(targetFile, envYaml);

    console.log(`Environment '${envName}' imported from: ${importPath}`);
    return importedEnv;
  }
}

module.exports = EnvironmentManager;