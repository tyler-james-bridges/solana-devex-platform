/**
 * Core types for @solana-devex/sdk
 */

// API Response
export interface APIResponse<T> {
  success: boolean;
  data: T | null;
  error?: string;
  timestamp?: string;
}

// CPI Debugging Types
export interface CPIAccount {
  pubkey: string;
  name?: string;
  isSigner: boolean;
  isWritable: boolean;
  beforeBalance?: number;
  afterBalance?: number;
  dataChange?: boolean;
  dataSize?: number;
  rentExemption?: boolean;
}

export interface CPIFlowStep {
  id: string;
  program: string;
  programId: string;
  instruction: string;
  depth: number;
  accounts: CPIAccount[];
  success: boolean;
  error?: string;
  computeUnits: number;
  gasEfficiency: 'optimal' | 'good' | 'poor';
  suggestedOptimizations?: string[];
}

export interface TransactionError {
  type: 'account_balance_mismatch' | 'realloc_constraint' | 'program_error' | 'compute_budget' | 'rent_violation' | 'account_size_exceeded' | 'authority_mismatch';
  severity: 'critical' | 'warning' | 'info';
  instruction: number;
  programId: string;
  message: string;
  suggestedFix: string;
  codeExample?: string;
  documentation?: string;
  estimatedFixTime?: string;
}

export interface TransactionPerformance {
  computeUnitsUsed: number;
  computeUnitsRequested: number;
  fee: number;
  slot: number;
  computeEfficiency: number;
  gasOptimization: string;
}

export interface TransactionMetadata {
  blockTime: string;
  confirmations: number;
  programsInvolved: string[];
  accountsModified: number;
  totalInstructions: number;
}

export interface DebugResult {
  signature: string;
  status: 'analyzing' | 'success' | 'error' | 'not-found';
  cpiFlow?: CPIFlowStep[];
  errors?: TransactionError[];
  performance?: TransactionPerformance;
  metadata?: TransactionMetadata;
}

// Network
export interface NetworkMetrics {
  slot: number;
  blockHeight: number;
  latency: number;
  tps: number;
  status: 'healthy' | 'degraded' | 'down';
  health: boolean;
  timestamp: string;
}

// RPC Types
export interface RpcTransactionDetails {
  signature: string;
  slot: number;
  blockTime: number | null;
  meta: {
    err: any;
    fee: number;
    preBalances: number[];
    postBalances: number[];
    innerInstructions?: any[];
    logMessages?: string[];
    computeUnitsConsumed?: number;
  };
  transaction: {
    message: {
      accountKeys: any[];
      header: {
        numRequiredSignatures: number;
        numReadonlySignedAccounts: number;
        numReadonlyUnsignedAccounts: number;
      };
      instructions: any[];
      recentBlockhash: string;
    };
    signatures: string[];
  };
}

// Configuration
export interface SolanaDevExConfig {
  apiUrl?: string;
  rpcEndpoint?: string;
  apiKey?: string;
  timeout?: number;
  retryAttempts?: number;
  enableCaching?: boolean;
}

// Errors
export class SolanaDevExError extends Error {
  public readonly code: string;
  public readonly statusCode?: number;

  constructor(message: string, code: string, statusCode?: number) {
    super(message);
    this.name = 'SolanaDevExError';
    this.code = code;
    this.statusCode = statusCode;
  }
}

export class NetworkError extends SolanaDevExError {
  constructor(message: string, statusCode?: number) {
    super(message, 'NETWORK_ERROR', statusCode);
    this.name = 'NetworkError';
  }
}

export class ValidationError extends SolanaDevExError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class AuthenticationError extends SolanaDevExError {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthenticationError';
  }
}
