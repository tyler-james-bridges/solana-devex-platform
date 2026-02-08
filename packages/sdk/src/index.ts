/**
 * @solana-devex/sdk
 * TypeScript SDK for the Solana DevEx Platform
 * 
 * @version 0.1.0
 * @license MIT
 */

// Main client - API access to onchain-devex.tools
export { SolanaDevExClient } from './client';

// Direct Solana RPC utilities (no platform dependency)
export { 
  SolanaRpcClient,
  getTransactionDetails,
  parseTransactionForCPI,
  analyzeTransactionErrors,
  getNetworkHealth
} from './rpc';

// Types
export type {
  // Config
  SolanaDevExConfig,

  // API
  APIResponse,

  // CPI Debugging
  CPIAccount,
  CPIFlowStep,
  TransactionError,
  TransactionPerformance,
  TransactionMetadata,
  DebugResult,

  // Security
  SecurityReport,

  // RPC
  RpcTransactionDetails,
  NetworkMetrics,
} from './types';

// Error classes
export {
  SolanaDevExError,
  NetworkError,
  AuthenticationError,
  ValidationError
} from './types';
