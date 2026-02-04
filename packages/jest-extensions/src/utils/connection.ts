import { Connection, Commitment, Cluster, clusterApiUrl } from '@solana/web3.js';
import type { BlockchainTestContext } from '../types/blockchain';

/**
 * Default test configuration
 */
export const DEFAULT_TEST_CONFIG = {
  commitment: 'confirmed' as Commitment,
  cluster: 'localnet' as const,
  endpoint: 'http://localhost:8899',
  timeout: 30000,
};

/**
 * Global test context for sharing connection across tests
 */
let globalTestContext: BlockchainTestContext | null = null;

/**
 * Initialize blockchain test environment
 */
export function initializeTestEnvironment(config: {
  endpoint?: string;
  cluster?: 'mainnet-beta' | 'testnet' | 'devnet' | 'localnet';
  commitment?: Commitment;
} = {}): BlockchainTestContext {
  const {
    endpoint = DEFAULT_TEST_CONFIG.endpoint,
    cluster = DEFAULT_TEST_CONFIG.cluster,
    commitment = DEFAULT_TEST_CONFIG.commitment,
  } = config;

  // Use cluster URL for non-local clusters
  const connectionUrl = cluster === 'localnet' ? endpoint : clusterApiUrl(cluster as Cluster);
  
  const connection = new Connection(connectionUrl, commitment);
  
  const context: BlockchainTestContext = {
    connection,
    commitment,
    cluster,
  };

  globalTestContext = context;
  return context;
}

/**
 * Get the current test context, initializing if necessary
 */
export function getTestContext(): BlockchainTestContext {
  if (!globalTestContext) {
    return initializeTestEnvironment();
  }
  return globalTestContext;
}

/**
 * Set up test environment for Jest
 */
export function setupTestEnvironment(
  endpoint: string = DEFAULT_TEST_CONFIG.endpoint,
  commitment: Commitment = DEFAULT_TEST_CONFIG.commitment
): void {
  beforeAll(async () => {
    initializeTestEnvironment({ endpoint, commitment });
  });

  afterAll(async () => {
    globalTestContext = null;
  });
}

/**
 * Create a connection for testing
 */
export function createTestConnection(
  endpoint: string = DEFAULT_TEST_CONFIG.endpoint,
  commitment: Commitment = DEFAULT_TEST_CONFIG.commitment
): Connection {
  return new Connection(endpoint, commitment);
}

/**
 * Wait for test validator to be ready
 */
export async function waitForValidator(
  connection: Connection,
  timeoutMs: number = 30000
): Promise<boolean> {
  const startTime = Date.now();
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      await connection.getSlot();
      return true;
    } catch (error) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
  }
  
  return false;
}

/**
 * Airdrop SOL for testing (only works on devnet/testnet/localnet)
 */
export async function airdrop(
  connection: Connection,
  publicKey: string,
  lamports: number = 1e9 // 1 SOL
): Promise<string> {
  const signature = await connection.requestAirdrop(
    typeof publicKey === 'string' ? new (await import('@solana/web3.js')).PublicKey(publicKey) : publicKey,
    lamports
  );
  
  await connection.confirmTransaction(signature, 'confirmed');
  return signature;
}

/**
 * Check if running on local validator
 */
export function isLocalValidator(endpoint: string = DEFAULT_TEST_CONFIG.endpoint): boolean {
  return endpoint.includes('localhost') || endpoint.includes('127.0.0.1');
}

/**
 * Get cluster from endpoint
 */
export function getClusterFromEndpoint(endpoint: string): string {
  if (endpoint.includes('localhost') || endpoint.includes('127.0.0.1')) {
    return 'localnet';
  }
  if (endpoint.includes('devnet')) {
    return 'devnet';
  }
  if (endpoint.includes('testnet')) {
    return 'testnet';
  }
  if (endpoint.includes('mainnet')) {
    return 'mainnet-beta';
  }
  return 'unknown';
}