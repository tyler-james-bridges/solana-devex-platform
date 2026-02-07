/**
 * Guardian Security Integration Types
 * 
 * Type definitions for Guardian's 17-agent security swarm on Solana
 * Features: Token scanner, honeypot detection, whale tracking, threat feeds
 */

export interface TokenScanResult {
  /** Risk score from 0-100 (0 = safest, 100 = highest risk) */
  riskScore: number;
  
  /** Human-readable risk classification */
  riskLevel: 'safe' | 'low' | 'medium' | 'high' | 'critical';
  
  /** Security flags detected */
  flags: SecurityFlag[];
  
  /** Detailed scan results */
  details: {
    mintAddress: string;
    tokenName: string;
    tokenSymbol: string;
    supply: {
      total: number;
      circulating: number;
    };
    holder: {
      count: number;
      topHolders: TokenHolder[];
    };
    liquidity: {
      totalValue: number;
      pools: LiquidityPool[];
    };
    metadata: {
      verified: boolean;
      freezeAuthority: string | null;
      mintAuthority: string | null;
    };
    scanTimestamp: Date;
    scanId: string;
  };
}

export interface SecurityFlag {
  type: 'honeypot' | 'rug_pull' | 'mint_authority' | 'freeze_authority' | 'low_liquidity' | 'whale_concentration' | 'suspicious_transactions';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence?: string;
}

export interface TokenHolder {
  address: string;
  percentage: number;
  balance: number;
  isKnownEntity: boolean;
  entityType?: 'exchange' | 'treasury' | 'team' | 'whale' | 'unknown';
}

export interface LiquidityPool {
  dex: string;
  pairAddress: string;
  liquidity: number;
  volume24h: number;
}

export interface HoneypotResult {
  /** Whether the address is identified as a honeypot */
  isHoneypot: boolean;
  
  /** Confidence level of honeypot detection */
  confidence: number; // 0-100
  
  /** Warning messages for potential issues */
  warnings: HoneypotWarning[];
  
  /** Analysis details */
  analysis: {
    address: string;
    contractType: 'token' | 'program' | 'unknown';
    buyTax: number | null;
    sellTax: number | null;
    canSell: boolean;
    canBuy: boolean;
    transferRestrictions: string[];
    blacklistCheck: boolean;
    ownershipRenounced: boolean;
    scanTimestamp: Date;
    scanId: string;
  };
}

export interface HoneypotWarning {
  type: 'high_tax' | 'transfer_restrictions' | 'ownership_not_renounced' | 'blacklist_function' | 'suspicious_code' | 'failed_transaction';
  severity: 'low' | 'medium' | 'high';
  message: string;
  details?: string;
}

export interface WhaleActivity {
  /** Target wallet address */
  wallet: string;
  
  /** Recent significant transactions */
  recentTransactions: WhaleTransaction[];
  
  /** Current holdings summary */
  holdings: {
    totalValue: number; // in USD
    solBalance: number;
    topTokens: WalletHolding[];
  };
  
  /** Active alerts for this whale */
  alerts: WhaleAlert[];
  
  /** Whale classification and metrics */
  metrics: {
    walletAge: number; // days
    transactionCount: number;
    averageTransactionValue: number;
    riskScore: number; // 0-100
    classification: 'trader' | 'hodler' | 'defi_user' | 'suspicious' | 'exchange';
    lastActive: Date;
  };
  
  scanTimestamp: Date;
  scanId: string;
}

export interface WhaleTransaction {
  signature: string;
  timestamp: Date;
  type: 'transfer' | 'swap' | 'stake' | 'unstake' | 'nft_trade';
  value: number; // in USD
  tokens: {
    tokenIn?: string;
    tokenOut?: string;
    amountIn?: number;
    amountOut?: number;
  };
  impact: 'market_moving' | 'significant' | 'notable' | 'minor';
}

export interface WalletHolding {
  tokenAddress: string;
  tokenName: string;
  tokenSymbol: string;
  balance: number;
  valueUsd: number;
  percentage: number; // percentage of total portfolio
}

export interface WhaleAlert {
  id: string;
  type: 'large_transfer' | 'new_position' | 'liquidation' | 'unusual_activity' | 'market_impact';
  severity: 'low' | 'medium' | 'high';
  description: string;
  timestamp: Date;
  relatedTransaction?: string;
  estimatedMarketImpact?: number;
}

export interface ThreatAlert {
  /** Unique alert identifier */
  id: string;
  
  /** Type of threat detected */
  type: 'exploit' | 'rug_pull' | 'flash_loan_attack' | 'governance_attack' | 'bridge_exploit' | 'oracle_manipulation' | 'suspicious_contract' | 'phishing';
  
  /** Threat severity level */
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  
  /** Human-readable threat description */
  description: string;
  
  /** When the threat was detected */
  timestamp: Date;
  
  /** Programs/contracts affected by this threat */
  affectedPrograms: string[];
  
  /** Additional threat intelligence */
  intelligence: {
    source: string; // which Guardian agent detected this
    confidence: number; // 0-100
    falsePositiveRate: number; // estimated 0-100
    relatedThreats: string[]; // related alert IDs
    mitigationSteps: string[];
    estimatedImpact: 'low' | 'medium' | 'high' | 'critical';
    indicators: ThreatIndicator[];
  };
  
  /** Status of the alert */
  status: 'active' | 'investigating' | 'resolved' | 'false_positive';
}

export interface ThreatIndicator {
  type: 'suspicious_transaction' | 'unusual_pattern' | 'known_malicious_address' | 'code_signature' | 'behavioral_anomaly';
  value: string;
  description: string;
}

export interface SecurityReport {
  /** Program ID being analyzed */
  programId: string;
  
  /** Overall risk assessment */
  overallRisk: {
    score: number; // 0-100
    level: 'safe' | 'low' | 'medium' | 'high' | 'critical';
    summary: string;
  };
  
  /** Detailed vulnerability analysis */
  vulnerabilities: Vulnerability[];
  
  /** Security recommendations */
  recommendations: SecurityRecommendation[];
  
  /** Code analysis results */
  codeAnalysis: {
    instructionCount: number;
    complexityScore: number;
    hasUpgradeAuthority: boolean;
    upgradeAuthority: string | null;
    codeSize: number;
    lastUpdate: Date;
    auditedBy: string[];
  };
  
  /** Runtime security metrics */
  runtimeMetrics: {
    totalTransactions: number;
    failedTransactions: number;
    successRate: number;
    averageComputeUsage: number;
    maxComputeUsage: number;
    suspiciousActivityCount: number;
  };
  
  /** Compliance and standards */
  compliance: {
    securityStandards: ComplianceCheck[];
    bestPractices: BestPracticeCheck[];
  };
  
  scanTimestamp: Date;
  scanId: string;
  scanDuration: number; // milliseconds
  guardianAgentsInvolved: string[];
}

export interface Vulnerability {
  id: string;
  type: 'reentrancy' | 'integer_overflow' | 'unauthorized_access' | 'improper_validation' | 'resource_exhaustion' | 'privilege_escalation' | 'data_exposure';
  severity: 'info' | 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  impact: string;
  location?: {
    instruction?: number;
    function?: string;
    line?: number;
  };
  recommendation: string;
  cweId?: string; // Common Weakness Enumeration ID
  exploitability: number; // 0-100
  references?: string[];
}

export interface SecurityRecommendation {
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'security' | 'performance' | 'maintainability' | 'compliance';
  title: string;
  description: string;
  implementation: string;
  estimatedEffort: 'low' | 'medium' | 'high';
  impactOnSecurity: number; // 0-100
}

export interface ComplianceCheck {
  standard: string; // e.g., "SOL-001", "OWASP-TOP10"
  status: 'compliant' | 'non_compliant' | 'partially_compliant' | 'not_applicable';
  description: string;
  details?: string;
}

export interface BestPracticeCheck {
  practice: string;
  implemented: boolean;
  importance: 'low' | 'medium' | 'high';
  description: string;
  recommendation?: string;
}

// Guardian API Configuration Types
export interface GuardianConfig {
  apiEndpoint: string;
  apiKey: string;
  timeout: number;
  retryAttempts: number;
  enableRealTimeAlerts: boolean;
  agentPriority: 'speed' | 'accuracy' | 'comprehensive';
}

// API Response wrapper
export interface GuardianApiResponse<T> {
  success: boolean;
  data: T;
  metadata: {
    requestId: string;
    timestamp: Date;
    processingTime: number;
    agentsInvolved: string[];
    creditsUsed: number;
  };
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}