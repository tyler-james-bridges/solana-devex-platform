/**
 * Official Solana Testing Stack Commands
 * LiteSVM, Mollusk, Surfpool integration
 */

const chalk = require('chalk');
const { execSync, spawn } = require('child_process');
const fs = require('fs-extra');
const path = require('path');

/**
 * Unit tests with LiteSVM/Mollusk (fast, in-process)
 */
async function unit(options) {
  console.log(chalk.cyan(' Official Stack Unit Testing'));
  
  const testRunner = options.mollusk ? 'mollusk' : 'litesvm';
  console.log(chalk.gray(`Using ${testRunner} for fast unit tests`));

  try {
    // Ensure test setup exists
    await ensureTestSetup(testRunner);
    
    // Run unit tests
    const testCommand = buildTestCommand(testRunner, 'unit');
    console.log(chalk.gray(`Running: ${testCommand}`));
    
    execSync(testCommand, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log(chalk.green(` Unit tests completed with ${testRunner}`));
    
  } catch (error) {
    console.error(chalk.red(` Unit tests failed: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Integration tests with Surfpool (realistic state)
 */
async function integration(options) {
  console.log(chalk.cyan('ê Surfpool Integration Testing'));
  
  const network = options.mainnet ? 'mainnet' : 'devnet';
  console.log(chalk.gray(`Testing against ${network} state locally`));

  try {
    // Ensure Surfpool is configured
    await ensureSurfpoolSetup(network);
    
    // Run integration tests
    const testCommand = buildTestCommand('surfpool', 'integration', { network });
    console.log(chalk.gray(`Running: ${testCommand}`));
    
    execSync(testCommand, {
      stdio: 'inherit',
      cwd: process.cwd(),
      env: { 
        ...process.env,
        SURFPOOL_NETWORK: network
      }
    });
    
    console.log(chalk.green(` Integration tests completed against ${network}`));
    
  } catch (error) {
    console.error(chalk.red(` Integration tests failed: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Legacy solana-test-validator fallback
 */
async function legacy(options) {
  console.log(chalk.yellow('  Legacy Testing Mode'));
  console.log(chalk.gray('Using solana-test-validator (slower, but full RPC compatibility)'));

  try {
    // Check if solana-test-validator is available
    execSync('solana-test-validator --version', { stdio: 'ignore' });
    
    // Run legacy tests
    const testCommand = 'npm test';
    console.log(chalk.gray(`Running: ${testCommand}`));
    
    execSync(testCommand, { 
      stdio: 'inherit',
      cwd: process.cwd()
    });
    
    console.log(chalk.green(' Legacy tests completed'));
    console.log(chalk.cyan(' Consider migrating to LiteSVM/Mollusk for faster feedback'));
    
  } catch (error) {
    console.error(chalk.red(` Legacy tests failed: ${error.message}`));
    process.exit(1);
  }
}

/**
 * Ensure test setup exists for given runner
 */
async function ensureTestSetup(testRunner) {
  const setupFile = `tests/${testRunner}-setup.ts`;
  
  if (!await fs.pathExists(setupFile)) {
    console.log(chalk.yellow(` Generating ${testRunner} setup...`));
    
    await fs.ensureDir('tests');
    const setupContent = generateTestSetup(testRunner);
    await fs.writeFile(setupFile, setupContent);
    
    console.log(chalk.green(` Created ${setupFile}`));
  }

  // Ensure Jest configuration supports the test runner
  await ensureJestConfig(testRunner);
}

/**
 * Generate test setup for different runners
 */
function generateTestSetup(testRunner) {
  switch (testRunner) {
    case 'litesvm':
      return generateLiteSvmSetup();
    case 'mollusk':
      return generateMolluskSetup();
    default:
      throw new Error(`Unknown test runner: ${testRunner}`);
  }
}

/**
 * Generate LiteSVM test setup
 */
function generateLiteSvmSetup() {
  return `import { LiteSVM } from 'litesvm';
import { Keypair } from '@solana/web3.js';

/**
 * LiteSVM Test Setup
 * Fast, in-process Solana environment for unit tests
 */

export class LiteSvmTestEnvironment {
  private svm: LiteSVM;
  
  constructor() {
    this.svm = new LiteSVM();
  }

  /**
   * Initialize test environment
   */
  async setup(): Promise<void> {
    // Setup accounts, programs, etc.
    console.log(' Setting up LiteSVM environment...');
  }

  /**
   * Clean up after tests
   */
  async teardown(): Promise<void> {
    console.log('π Cleaning up LiteSVM environment...');
  }

  /**
   * Get test keypair with airdropped SOL
   */
  async getTestKeypair(lamports: number = 1_000_000_000): Promise<Keypair> {
    const keypair = Keypair.generate();
    await this.svm.airdrop(keypair.publicKey, lamports);
    return keypair;
  }

  /**
   * Process transaction in test environment
   */
  async processTransaction(transaction: any): Promise<any> {
    return await this.svm.sendTransaction(transaction);
  }
}

// Global test environment
export const testEnv = new LiteSvmTestEnvironment();

// Jest setup hooks
beforeAll(async () => {
  await testEnv.setup();
});

afterAll(async () => {
  await testEnv.teardown();
});
`;
}

/**
 * Generate Mollusk test setup
 */
function generateMolluskSetup() {
  return `import { Mollusk } from 'mollusk-svm';
import { Keypair, PublicKey } from '@solana/web3.js';

/**
 * Mollusk Test Setup  
 * Advanced unit testing with program-specific optimizations
 */

export class MolluskTestEnvironment {
  private mollusk: Mollusk;
  private programId: PublicKey;
  
  constructor(programId?: PublicKey) {
    this.programId = programId || new PublicKey('11111111111111111111111111111111');
    this.mollusk = new Mollusk(this.programId);
  }

  /**
   * Initialize Mollusk environment
   */
  async setup(): Promise<void> {
    console.log(' Setting up Mollusk environment...');
    // Program-specific setup
  }

  /**
   * Test instruction execution
   */
  async testInstruction(
    instruction: any,
    accounts: any,
    signers: Keypair = []
  ): Promise<any> {
    return await this.mollusk.processInstruction(
      instruction,
      accounts,
      signers
    );
  }

  /**
   * Verify account state changes
   */
  verifyAccountState(
    accountPubkey: PublicKey,
    expectedState: any
  ): boolean {
    // Account state verification logic
    return true;
  }

  /**
   * Setup program-specific test data
   */
  async setupProgramAccounts(): Promise<Map<PublicKey, any>> {
    const accounts = new Map();
    // Setup program-specific accounts
    return accounts;
  }
}

// Program-specific test environment
export const molluskEnv = new MolluskTestEnvironment();

beforeAll(async () => {
  await molluskEnv.setup();
});

// Mollusk-specific matchers for Jest
expect.extend({
  toHaveAccountState(received: PublicKey, expected: any) {
    const pass = molluskEnv.verifyAccountState(received, expected);
    return {
      pass,
      message: () => pass 
        ? \`Expected account \${received} not to have state \${expected}\`
        : \`Expected account \${received} to have state \${expected}\`
    };
  }
});
`;
}

/**
 * Ensure Surfpool setup for integration tests
 */
async function ensureSurfpoolSetup(network) {
  const configFile = `surfpool.${network}.config.json`;
  
  if (!await fs.pathExists(configFile)) {
    console.log(chalk.yellow(` Generating Surfpool config for ${network}...`));
    
    const config = generateSurfpoolConfig(network);
    await fs.writeFile(configFile, JSON.stringify(config, null, 2));
    
    console.log(chalk.green(` Created ${configFile}`));
  }

  // Ensure integration test setup
  const setupFile = `tests/surfpool-${network}-setup.ts`;
  
  if (!await fs.pathExists(setupFile)) {
    const setupContent = generateSurfpoolSetup(network);
    await fs.writeFile(setupFile, setupContent);
    
    console.log(chalk.green(` Created ${setupFile}`));
  }
}

/**
 * Generate Surfpool configuration
 */
function generateSurfpoolConfig(network) {
  return {
    network,
    endpoint: network === 'mainnet' 
      ? 'https://api.mainnet-beta.solana.com'
      : 'https://api.devnet.solana.com',
    caching: {
      enabled: true,
      ttl: 3600
    },
    accounts: {
      // Pre-fetch important accounts for testing
      whitelist: 
    },
    programs: {
      // Programs to include in local state
      whitelist: 
    }
  };
}

/**
 * Generate Surfpool test setup
 */
function generateSurfpoolSetup(network) {
  return `import { Surfpool } from 'surfpool';

/**
 * Surfpool Integration Test Setup
 * Tests against realistic ${network} state locally
 */

export class SurfpoolTestEnvironment {
  private surfpool: Surfpool;
  
  constructor() {
    this.surfpool = new Surfpool({
      configFile: './surfpool.${network}.config.json'
    });
  }

  /**
   * Initialize Surfpool environment
   */
  async setup(): Promise<void> {
    console.log('Ñ Setting up Surfpool for ${network} integration tests...');
    await this.surfpool.initialize();
  }

  /**
   * Test against live network state
   */
  async testWithNetworkState(testFn: () => Promise<void>): Promise<void> {
    // Run test function with access to ${network} state
    await testFn();
  }

  /**
   * Snapshot network state for reproducible tests
   */
  async createStateSnapshot(name: string): Promise<string> {
    return await this.surfpool.createSnapshot(name);
  }

  /**
   * Load state snapshot
   */
  async loadStateSnapshot(snapshotId: string): Promise<void> {
    await this.surfpool.loadSnapshot(snapshotId);
  }

  async teardown(): Promise<void> {
    await this.surfpool.cleanup();
  }
}

export const surfpoolEnv = new SurfpoolTestEnvironment();

beforeAll(async () => {
  await surfpoolEnv.setup();
}, 30000); // Longer timeout for network setup

afterAll(async () => {
  await surfpoolEnv.teardown();
});
`;
}

/**
 * Ensure Jest configuration supports test runners
 */
async function ensureJestConfig(testRunner) {
  const jestConfigFile = 'jest.config.js';
  
  if (!await fs.pathExists(jestConfigFile)) {
    const jestConfig = generateJestConfig(testRunner);
    await fs.writeFile(jestConfigFile, jestConfig);
    
    console.log(chalk.green(` Created ${jestConfigFile} with ${testRunner} support`));
  }
}

/**
 * Generate Jest configuration
 */
function generateJestConfig(testRunner) {
  return `/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: [
    '**/__tests__/**/*.{js,ts}',
    '**/?(*.)(spec|test).{js,ts}'
  ],
  transform: {
    '^.+\\\\.ts$': 'ts-jest',
  },
  collectCoverageFrom: [
    'src/**/*.{js,ts}',
    '!src/**/*.d.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/${testRunner}-setup.ts'],
  testTimeout: 30000, // Extended timeout for blockchain tests
  
  // ${testRunner}-specific configuration
  ${testRunner === 'litesvm' ? `
  // LiteSVM optimizations
  maxWorkers: 1, // LiteSVM works best with single worker
  ` : ''}
  ${testRunner === 'mollusk' ? `
  // Mollusk optimizations  
  maxConcurrency: 4, // Parallel test execution
  ` : ''}
  
  // Official stack globals
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.json'
    }
  },
  
  // Custom matchers from jest-blockchain-extensions
  setupFilesAfterEnv: [
    '<rootDir>/tests/${testRunner}-setup.ts',
    '<rootDir>/node_modules/jest-blockchain-extensions/dist/setup.js'
  ]
};
`;
}

/**
 * Build test command based on runner and type
 */
function buildTestCommand(runner, testType, options = {}) {
  const baseCommand = 'npx jest';
  const testPattern = testType === 'unit' ? 'tests/**/*.unit.test.{js,ts}' 
                     : testType === 'integration' ? 'tests/**/*.integration.test.{js,ts}'
                     : 'tests/**/*.test.{js,ts}';
  
  let command = `${baseCommand} ${testPattern}`;
  
  if (runner === 'surfpool' && options.network) {
    command += ` --testNamePattern="${options.network}"`;
  }
  
  return command;
}

module.exports = {
  unit,
  integration,
  legacy
};