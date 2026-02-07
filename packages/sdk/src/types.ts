/**
 * Core types for the Solana DevEx Platform SDK
 * These types match the platform's internal components and API responses
 */

// Base API Response Types
export interface APIResponse<T> {
  success: boolean;
  data: T | null;
  error?: string;
  timestamp?: string;
}

// CPI Flow and Transaction Analysis Types
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

// Debug Result Types
export interface DebugResult {
  signature: string;
  status: 'analyzing' | 'success' | 'error' | 'not-found';
  cpiFlow?: CPIFlowStep[];
  errors?: TransactionError[];
  performance?: TransactionPerformance;
  metadata?: TransactionMetadata;
}

// Simulation Types
export interface AccountChange {
  account: string;
  type: 'balance' | 'data' | 'ownership' | 'creation';
  before: string;
  after: string;
  impact: 'low' | 'medium' | 'high';
}

export interface Risk {
  type: 'high_value_transfer' | 'authority_change' | 'program_upgrade' | 'account_closure' | 'suspicious_activity';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  mitigation: string;
}

export interface Optimization {
  type: 'compute_reduction' | 'fee_optimization' | 'account_consolidation' | 'instruction_batching';
  description: string;
  potentialSaving: string;
  codeExample?: string;
}

export interface SafetyCheck {
  name: string;
  status: 'passed' | 'warning' | 'failed';
  description: string;
  details?: string;
}

export interface GasEstimate {
  minFee: number;
  maxFee: number;
  recommendedFee: number;
  priorityFee?: number;
}

export interface SimulationData {
  wouldSucceed: boolean;
  estimatedComputeUnits: number;
  estimatedFee: number;
  accountChanges: AccountChange[];
  programsInvolved: string[];
  cpiCalls: number;
  risks: Risk[];
  optimizations: Optimization[];
}

export interface SimulationResult {
  id: string;
  status: 'running' | 'success' | 'warning' | 'error';
  timestamp: Date;
  simulation: SimulationData;
  safetyChecks: SafetyCheck[];
  gasEstimate: GasEstimate;
}

// Protocol Health Types
export interface NetworkMetrics {
  slot: number;
  blockHeight: number;
  latency: number;
  tps: number;
  status: 'healthy' | 'degraded' | 'down';
  health: boolean;
  timestamp: string;
}

export interface ProtocolMetrics {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  availability: number;
  errorRate: number;
  timestamp: string;
}

export interface ProtocolHealth {
  protocol: string;
  status: 'healthy' | 'degraded' | 'down';
  uptime: number;
  latency: number;
  errorRate: number;
  lastCheck: string;
  metrics: {
    averageResponseTime: number;
    successRate: number;
    totalRequests: number;
    failedRequests: number;
  };
  alerts?: Alert[];
}

export interface Alert {
  id: string;
  rule: {
    name: string;
    condition: string;
    threshold: number;
  };
  value: number;
  severity: 'critical' | 'warning' | 'info';
  protocol?: string;
  timestamp: string;
  resolved?: boolean;
}

// Security Analysis Types
export interface SecurityVulnerability {
  type: 'authority_bypass' | 'integer_overflow' | 'reentrancy' | 'uninitialized_account' | 'missing_signer_check';
  severity: 'critical' | 'high' | 'medium' | 'low';
  location: string;
  description: string;
  recommendation: string;
  codeExample?: string;
  references?: string[];
}

export interface SecurityReport {
  programId: string;
  scanTimestamp: string;
  overallRisk: 'critical' | 'high' | 'medium' | 'low';
  vulnerabilities: SecurityVulnerability[];
  summary: {
    totalIssues: number;
    criticalIssues: number;
    highIssues: number;
    mediumIssues: number;
    lowIssues: number;
  };
  recommendations: string[];
  complianceScore: number;
}

// Platform Metrics Types
export interface EndpointMetrics {
  name: string;
  path: string;
  method: string;
  status: 'healthy' | 'degraded' | 'down';
  responseTime: number;
  errorRate: number;
  successRate: number;
  totalRequests: number;
  p50: number;
  p95: number;
  p99: number;
}

export interface PlatformMetrics {
  timestamp: string;
  overall: {
    status: 'healthy' | 'degraded' | 'down';
    uptime: number;
    totalRequests: number;
    errorRate: number;
    averageResponseTime: number;
  };
  endpoints: EndpointMetrics[];
  network: NetworkMetrics;
  protocols: ProtocolMetrics[];
  system: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkTraffic: number;
  };
}

// Configuration Types
export interface SolanaDevExConfig {
  apiUrl?: string;
  rpcEndpoint?: string;
  apiKey?: string;
  timeout?: number;
  retryAttempts?: number;
  enableCaching?: boolean;
}

// RPC Utilities Types
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

// Error Types
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