import '../src/index'; // This automatically extends Jest with our matchers
import { initializeTestEnvironment } from '../src/utils/connection';

// Global test setup
beforeAll(async () => {
  // Initialize test environment
  const testContext = initializeTestEnvironment({
    endpoint: process.env.SOLANA_RPC_URL || 'http://localhost:8899',
    cluster: 'localnet',
    commitment: 'confirmed',
  });

  // Wait for validator to be ready if using localnet
  if (testContext.cluster === 'localnet') {
    try {
      await testContext.connection.getSlot();
      console.log('  Local validator is ready');
    } catch (error) {
      console.warn('   Local validator may not be running. Some tests might fail.');
      console.warn('Start a local validator with: solana-test-validator');
    }
  }
}, 30000);

// Global test timeout for blockchain operations
jest.setTimeout(30000);