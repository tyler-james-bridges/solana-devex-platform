/**
 * Solana DevEx Platform SDK
 * TypeScript SDK for interacting with the Solana DevEx Platform
 * 
 * @version 0.1.0
 * @author Solana DevEx Platform Team
 * @license MIT
 */

// Export the main client
export { SolanaDevExClient } from './client';

// Export RPC utilities
export { 
  SolanaRpcClient,
  getTransactionDetails,
  parseTransactionForCPI,
  analyzeTransactionErrors,
  getNetworkHealth
} from './rpc';

// Export all types
export type {
  // Configuration
  SolanaDevExConfig,

  // API Response Types
  APIResponse,

  // Core CPI and Transaction Types
  CPIAccount,
  CPIFlowStep,
  TransactionError,
  TransactionPerformance,
  TransactionMetadata,
  DebugResult,

  // Simulation Types
  AccountChange,
  Risk,
  Optimization,
  SafetyCheck,
  GasEstimate,
  SimulationData,
  SimulationResult,

  // Platform Health and Monitoring
  NetworkMetrics,
  ProtocolMetrics,
  ProtocolHealth,
  Alert,

  // Security Analysis
  SecurityVulnerability,
  SecurityReport,

  // Platform Metrics
  EndpointMetrics,
  PlatformMetrics,

  // RPC Utilities
  RpcTransactionDetails,

  // Error Types
  SolanaDevExError,
  NetworkError,
  ValidationError,
  AuthenticationError
} from './types';

// Version information
export const SDK_VERSION = '0.1.0';

// Default configuration constants
export const DEFAULT_API_URL = 'https://onchain-devex.tools';
export const DEFAULT_RPC_ENDPOINT = 'https://api.mainnet-beta.solana.com';

// Import the client class for use in convenience functions
import { SolanaDevExClient } from './client';
import type { SolanaDevExConfig, DebugResult, SimulationResult, ProtocolHealth, SecurityReport, PlatformMetrics } from './types';

/**
 * Create a new SolanaDevExClient with optional configuration
 * @param config - Optional configuration overrides
 * @returns SolanaDevExClient instance
 */
export function createClient(config?: SolanaDevExConfig): SolanaDevExClient {
  return new SolanaDevExClient(config);
}

/**
 * Quick start helper to debug a transaction
 * @param signature - Transaction signature to debug
 * @param config - Optional SDK configuration
 * @returns Promise<DebugResult>
 */
export async function debugTransaction(
  signature: string, 
  config?: SolanaDevExConfig
): Promise<DebugResult> {
  const client = new SolanaDevExClient(config);
  return client.debugTransaction(signature);
}

/**
 * Quick start helper to simulate a transaction
 * @param txData - Transaction data (base58 encoded)
 * @param config - Optional SDK configuration
 * @returns Promise<SimulationResult>
 */
export async function simulateTransaction(
  txData: string,
  config?: SolanaDevExConfig
): Promise<SimulationResult> {
  const client = new SolanaDevExClient(config);
  return client.simulateTransaction(txData);
}

/**
 * Quick start helper to check protocol health
 * @param config - Optional SDK configuration
 * @returns Promise<ProtocolHealth[]>
 */
export async function getProtocolHealth(
  config?: SolanaDevExConfig
): Promise<ProtocolHealth[]> {
  const client = new SolanaDevExClient(config);
  return client.getProtocolHealth();
}

/**
 * Quick start helper to run security scan
 * @param programId - Program ID to scan
 * @param config - Optional SDK configuration
 * @returns Promise<SecurityReport>
 */
export async function runSecurityScan(
  programId: string,
  config?: SolanaDevExConfig
): Promise<SecurityReport> {
  const client = new SolanaDevExClient(config);
  return client.runSecurityScan(programId);
}

/**
 * Quick start helper to get platform metrics
 * @param config - Optional SDK configuration
 * @returns Promise<PlatformMetrics>
 */
export async function getPlatformMetrics(
  config?: SolanaDevExConfig
): Promise<PlatformMetrics> {
  const client = new SolanaDevExClient(config);
  return client.getMetrics();
}

// Re-export for backward compatibility and convenience
export default SolanaDevExClient;