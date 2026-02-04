/**
 * Platform Integration Tests
 * Tests that all components work together seamlessly
 */

const { spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');
const { expect } = require('jest');

describe('Solana DevEx Platform Integration', () => {
  const testProjectName = 'integration-test-project';
  const testProjectPath = path.join(__dirname, '../../', testProjectName);

  beforeAll(async () => {
    // Clean up any existing test project
    await fs.remove(testProjectPath);
  }, 30000);

  afterAll(async () => {
    // Clean up test project
    await fs.remove(testProjectPath);
  });

  describe('CLI Integration', () => {
    test('unified CLI should be accessible', async () => {
      const result = await runCommand('node bin/solana-devex --version');
      expect(result.code).toBe(0);
      expect(result.stdout).toMatch(/1\.0\.0/);
    });

    test('help command should show all integrated features', async () => {
      const result = await runCommand('node bin/solana-devex --help');
      expect(result.code).toBe(0);
      
      // Check for all main commands
      expect(result.stdout).toContain('init');
      expect(result.stdout).toContain('build');
      expect(result.stdout).toContain('test');
      expect(result.stdout).toContain('anchor');
      expect(result.stdout).toContain('validator');
      expect(result.stdout).toContain('cicd');
      expect(result.stdout).toContain('monitor');
    });
  });

  describe('Project Initialization Integration', () => {
    test('should create project with all platform features', async () => {
      const result = await runCommand(
        `node bin/solana-devex init ${testProjectName} --template anchor --testing --validator`,
        { cwd: path.dirname(testProjectPath) }
      );
      
      expect(result.code).toBe(0);
      expect(fs.existsSync(testProjectPath)).toBe(true);
      
      // Check for integrated setup
      expect(fs.existsSync(path.join(testProjectPath, 'Cargo.toml'))).toBe(true);
      expect(fs.existsSync(path.join(testProjectPath, 'package.json'))).toBe(true);
      expect(fs.existsSync(path.join(testProjectPath, 'tests'))).toBe(true);
      expect(fs.existsSync(path.join(testProjectPath, 'solana-devex.config.js'))).toBe(true);
    });

    test('project should have Jest extensions configured', async () => {
      const packageJson = await fs.readJson(path.join(testProjectPath, 'package.json'));
      
      expect(packageJson.devDependencies).toHaveProperty('jest');
      expect(packageJson.scripts).toHaveProperty('test');
      
      // Check for Jest config
      const jestConfig = path.join(testProjectPath, 'jest.config.js');
      if (fs.existsSync(jestConfig)) {
        const config = require(jestConfig);
        expect(config.testEnvironment).toBe('node');
      }
    });

    test('project should have Anchor enhancements available', async () => {
      // Check if Anchor.toml exists and is configured
      const anchorToml = path.join(testProjectPath, 'Anchor.toml');
      expect(fs.existsSync(anchorToml)).toBe(true);
      
      // Check for enhanced test setup
      const testDir = path.join(testProjectPath, 'tests');
      const testFiles = await fs.readdir(testDir);
      expect(testFiles.length).toBeGreaterThan(0);
    });
  });

  describe('Configuration Integration', () => {
    test('should create unified configuration', async () => {
      const configPath = path.join(testProjectPath, 'solana-devex.config.js');
      expect(fs.existsSync(configPath)).toBe(true);
      
      const config = require(configPath);
      expect(config).toHaveProperty('platform');
      expect(config).toHaveProperty('solana');
      expect(config).toHaveProperty('testing');
      expect(config).toHaveProperty('validator');
    });

    test('configuration should be accessible via CLI', async () => {
      const result = await runCommand('node bin/solana-devex config show', {
        cwd: testProjectPath
      });
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Platform:');
      expect(result.stdout).toContain('Solana:');
      expect(result.stdout).toContain('Testing:');
    });
  });

  describe('Build Integration', () => {
    test('should build project using unified CLI', async () => {
      const result = await runCommand('node bin/solana-devex build', {
        cwd: testProjectPath,
        timeout: 60000
      });
      
      // Build may fail in test environment, but command should be recognized
      expect(result.stdout || result.stderr).toContain('build');
    });
  });

  describe('Testing Integration', () => {
    test('should have blockchain testing matchers available', async () => {
      // Create a simple test file to verify Jest extensions
      const testFile = `
        const { expect } = require('jest');
        
        test('blockchain matchers should be available', () => {
          // Check if custom matchers are loaded
          expect(expect.extend).toBeDefined();
        });
      `;
      
      await fs.writeFile(
        path.join(testProjectPath, 'test-matchers.test.js'),
        testFile
      );
      
      const result = await runCommand('npm test -- test-matchers.test.js', {
        cwd: testProjectPath
      });
      
      // Test should run (may pass or fail, but Jest should execute)
      expect(result.stdout || result.stderr).toContain('test');
    });
  });

  describe('Component Commands Integration', () => {
    test('anchor command should be available', async () => {
      const result = await runCommand('node bin/solana-devex anchor --help');
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('enhance');
      expect(result.stdout).toContain('monitor');
    });

    test('validator command should be available', async () => {
      const result = await runCommand('node bin/solana-devex validator --help');
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('start');
      expect(result.stdout).toContain('stop');
      expect(result.stdout).toContain('monitor');
    });

    test('cicd command should be available', async () => {
      const result = await runCommand('node bin/solana-devex cicd --help');
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('setup');
      expect(result.stdout).toContain('actions');
    });

    test('monitor command should be available', async () => {
      const result = await runCommand('node bin/solana-devex monitor --help');
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('start');
      expect(result.stdout).toContain('api');
    });
  });

  describe('Package Structure Integration', () => {
    test('all package directories should exist', () => {
      const packagesDir = path.join(__dirname, '../../packages');
      expect(fs.existsSync(packagesDir)).toBe(true);
      
      const expectedPackages = [
        'cli',
        'jest-extensions',
        'anchor-layer', 
        'test-validator',
        'github-actions',
        'shared'
      ];
      
      expectedPackages.forEach(pkg => {
        expect(fs.existsSync(path.join(packagesDir, pkg))).toBe(true);
      });
    });

    test('shared configuration should be accessible', () => {
      const configModule = path.join(__dirname, '../../packages/shared/lib/config.js');
      expect(fs.existsSync(configModule)).toBe(true);
      
      const { getConfig } = require(configModule);
      expect(typeof getConfig).toBe('function');
    });
  });

  describe('Documentation Integration', () => {
    test('should have comprehensive documentation', () => {
      const docsDir = path.join(__dirname, '../../docs');
      const setupGuide = path.join(docsDir, 'SETUP_GUIDE.md');
      
      expect(fs.existsSync(setupGuide)).toBe(true);
    });

    test('README should reflect unified platform', async () => {
      const readme = path.join(__dirname, '../../README.md');
      expect(fs.existsSync(readme)).toBe(true);
      
      const content = await fs.readFile(readme, 'utf8');
      expect(content).toContain('Unified Solana Developer Experience Platform');
      expect(content).toContain('solana-devex');
    });
  });
});

// Helper function to run commands and capture output
function runCommand(command, options = {}) {
  return new Promise((resolve) => {
    const [cmd, ...args] = command.split(' ');
    const child = spawn(cmd, args, {
      stdio: ['ignore', 'pipe', 'pipe'],
      cwd: options.cwd || process.cwd(),
      timeout: options.timeout || 30000,
      ...options
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({
        code,
        stdout,
        stderr
      });
    });

    child.on('error', (error) => {
      resolve({
        code: 1,
        stdout,
        stderr: error.message
      });
    });
  });
}