/**
 * onchain-devex
 * TypeScript SDK for CPI debugging on Solana
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
  SolanaDevExConfig,
  APIResponse,
  CPIAccount,
  CPIFlowStep,
  TransactionError,
  TransactionPerformance,
  TransactionMetadata,
  DebugResult,
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
