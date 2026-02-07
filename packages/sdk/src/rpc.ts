/**
 * Solana RPC Utilities - Standalone wrappers for direct blockchain interaction
 * These functions provide direct access to Solana RPC functionality without requiring platform APIs
 */

import { Connection, PublicKey, ParsedTransactionWithMeta, VersionedTransactionResponse } from '@solana/web3.js';
import { 
  CPIFlowStep, 
  CPIAccount, 
  TransactionError, 
  TransactionPerformance, 
  RpcTransactionDetails,
  NetworkError,
  ValidationError 
} from './types';

// Known program mappings for better display names
const KNOWN_PROGRAMS: Record<string, string> = {
  'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA': 'Token Program',
  'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL': 'Associated Token Program',
  'ComputeBudget111111111111111111111111111111': 'Compute Budget Program',
  '11111111111111111111111111111111': 'System Program',
  'BPFLoaderUpgradeab1e11111111111111111111111': 'BPF Upgradeable Loader',
  'Vote111111111111111111111111111111111111111': 'Vote Program',
  'Stake11111111111111111111111111111111111111': 'Stake Program',
  'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1': 'Dex Program',
  '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM': 'AMM Program',
  '675kPX9MHTjS2zt1qfr1NYHuzeLXfQM9H24wFSUt1Mp8': 'Raydium AMM Program',
  'EhpADApTrarMJx1rMHj8SBgaTKMCvvzM27RBBe8S9xwL': 'Raydium CLMM Program',
  'whirLbMiicVdio4qvUfM5KAg6Ct8VwpYzGff3uctyCc': 'Orca Whirlpools Program'
};

// Known error patterns for transaction analysis
const ERROR_PATTERNS: Array<{
  pattern: RegExp;
  type: TransactionError['type'];
  severity: TransactionError['severity'];
  getDetails: (match: RegExpMatchArray) => Partial<TransactionError>;
}> = [
  {
    pattern: /insufficient.*balance/i,
    type: 'account_balance_mismatch',
    severity: 'critical',
    getDetails: () => ({
      message: 'Account has insufficient balance for the requested operation',
      suggestedFix: 'Ensure the account has enough SOL or tokens before executing the transaction',
      estimatedFixTime: '5-10 minutes',
      documentation: 'https://docs.solana.com/developing/programming-model/accounts#account-balance'
    })
  },
  {
    pattern: /realloc.*constraint/i,
    type: 'realloc_constraint',
    severity: 'critical',
    getDetails: () => ({
      message: 'Account reallocation exceeded maximum allowed size limit',
      suggestedFix: 'Implement PDA chunking pattern to split large data across multiple accounts',
      estimatedFixTime: '2-4 hours',
      documentation: 'https://docs.rs/anchor-lang/latest/anchor_lang/accounts/account/struct.Account.html#account-reallocation'
    })
  },
  {
    pattern: /compute.*budget.*exceeded/i,
    type: 'compute_budget',
    severity: 'warning',
    getDetails: () => ({
      message: 'Transaction exceeded the compute budget limit',
      suggestedFix: 'Optimize instruction logic or request additional compute units',
      estimatedFixTime: '1-2 hours',
      documentation: 'https://docs.solana.com/developing/programming-model/runtime#compute-budget'
    })
  }
];

/**
 * Standalone Solana RPC client for direct blockchain access
 */
export class SolanaRpcClient {
  private connection: Connection;

  constructor(rpcEndpoint?: string) {
    const endpoint = rpcEndpoint || 'https://api.mainnet-beta.solana.com';
    this.connection = new Connection(endpoint, 'confirmed');
  }

  /**
   * Get detailed transaction information including parsed instructions
   */
  async getTransactionDetails(signature: string): Promise<ParsedTransactionWithMeta | null> {
    this.validateSignature(signature);
    
    try {
      const transaction = await this.connection.getParsedTransaction(signature, {
        maxSupportedTransactionVersion: 0,
        commitment: 'confirmed'
      });
      
      return transaction;
    } catch (error) {
      throw new NetworkError(
        `Failed to fetch transaction: ${error instanceof Error ? error.message : 'Unknown error'}`,
        error instanceof Error && 'status' in error ? (error as any).status : undefined
      );
    }
  }

  /**
   * Parse transaction to extract CPI flow and instruction hierarchy
   */
  parseTransactionForCPI(transaction: ParsedTransactionWithMeta): CPIFlowStep[] {
    if (!transaction?.transaction?.message?.instructions) {
      return [];
    }

    const cpiFlow: CPIFlowStep[] = [];
    let instructionId = 0;

    // Process top-level instructions
    transaction.transaction.message.instructions.forEach((instruction, index) => {
      const step = this.createCPIStep(instruction, index, 0, transaction);
      if (step) {
        cpiFlow.push(step);
        instructionId++;
      }

      // Process inner instructions (CPI calls)
      if (transaction.meta?.innerInstructions) {
        const innerInstruction = transaction.meta.innerInstructions.find(
          inner => inner.index === index
        );
        
        if (innerInstruction) {
          innerInstruction.instructions.forEach((inner) => {
            const innerStep = this.createCPIStep(inner, instructionId++, 1, transaction);
            if (innerStep) {
              cpiFlow.push(innerStep);
            }
          });
        }
      }
    });

    return cpiFlow;
  }

  /**
   * Analyze transaction for errors and provide detailed diagnostics
   */
  analyzeTransactionErrors(transaction: ParsedTransactionWithMeta): TransactionError[] {
    const errors: TransactionError[] = [];
    
    if (!transaction.meta) {
      return errors;
    }

    // Check for transaction-level errors
    if (transaction.meta.err) {
      const errorString = JSON.stringify(transaction.meta.err);
      
      // Match against known error patterns
      for (const pattern of ERROR_PATTERNS) {
        const match = errorString.match(pattern.pattern);
        if (match) {
          const details = pattern.getDetails(match);
          errors.push({
            type: pattern.type,
            severity: pattern.severity,
            instruction: 0,
            programId: 'System',
            message: details.message || `Transaction failed: ${errorString}`,
            suggestedFix: details.suggestedFix || 'Review transaction parameters and retry',
            ...details
          });
        }
      }
    }

    // Check for high compute usage
    const computeUnitsConsumed = transaction.meta.computeUnitsConsumed || 0;
    if (computeUnitsConsumed > 800000) {
      errors.push({
        type: 'compute_budget',
        severity: 'warning',
        instruction: 0,
        programId: 'System',
        message: `High compute usage detected: ${computeUnitsConsumed.toLocaleString()} units`,
        suggestedFix: 'Consider optimizing instruction logic or splitting into multiple transactions',
        estimatedFixTime: '1-3 hours',
        documentation: 'https://docs.solana.com/developing/programming-model/runtime#compute-budget'
      });
    }

    return errors;
  }

  /**
   * Calculate compute metrics and efficiency scores
   */
  calculatePerformanceMetrics(transaction: ParsedTransactionWithMeta): TransactionPerformance {
    const meta = transaction.meta;
    const computeUnitsConsumed = meta?.computeUnitsConsumed || 0;
    const fee = meta?.fee || 0;
    const slot = transaction.slot || 0;
    
    // Estimate requested compute units
    const estimatedRequested = Math.max(computeUnitsConsumed * 1.2, 200000);
    
    // Calculate efficiency
    const efficiency = estimatedRequested > 0 ? (computeUnitsConsumed / estimatedRequested) * 100 : 0;
    
    let optimizationMessage: string;
    if (efficiency > 90) {
      optimizationMessage = 'Excellent - Highly optimized transaction with minimal compute waste';
    } else if (efficiency > 70) {
      optimizationMessage = 'Good - Well structured transaction with some optimization opportunities';
    } else if (efficiency > 50) {
      optimizationMessage = 'Moderate - Transaction could benefit from optimization';
    } else {
      optimizationMessage = 'Poor - Significant optimization needed to improve efficiency';
    }

    return {
      computeUnitsUsed: computeUnitsConsumed,
      computeUnitsRequested: Math.round(estimatedRequested),
      fee,
      slot,
      computeEfficiency: Math.round(efficiency * 10) / 10,
      gasOptimization: optimizationMessage
    };
  }

  /**
   * Get current network health and performance metrics
   */
  async getNetworkHealth(): Promise<{
    slot: number;
    blockHeight: number;
    latency: number;
    status: 'healthy' | 'degraded' | 'down';
  }> {
    try {
      const startTime = Date.now();
      const slot = await this.connection.getSlot();
      const blockHeight = await this.connection.getBlockHeight();
      const latency = Date.now() - startTime;

      let status: 'healthy' | 'degraded' | 'down';
      if (latency < 500) {
        status = 'healthy';
      } else if (latency < 2000) {
        status = 'degraded';
      } else {
        status = 'down';
      }

      return {
        slot,
        blockHeight,
        latency,
        status
      };
    } catch (error) {
      throw new NetworkError(
        `Failed to get network health: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Validate transaction signature format
   */
  private validateSignature(signature: string): void {
    if (!signature || typeof signature !== 'string') {
      throw new ValidationError('Transaction signature is required and must be a string');
    }

    if (signature.length < 80 || signature.length > 100) {
      throw new ValidationError('Invalid transaction signature format');
    }
  }

  /**
   * Create a CPI step from an instruction (internal helper)
   */
  private createCPIStep(
    instruction: any,
    id: number,
    depth: number,
    transaction: ParsedTransactionWithMeta
  ): CPIFlowStep | null {
    try {
      let programId: string;
      let instructionType: string;
      let accounts: CPIAccount[] = [];

      if ('programId' in instruction) {
        programId = instruction.programId.toString();
        
        if ('parsed' in instruction) {
          instructionType = instruction.parsed?.type || 'unknown';
          accounts = this.extractAccountsFromParsed(instruction, transaction);
        } else {
          instructionType = 'unknown';
          accounts = this.extractAccountsFromPartial(instruction, transaction);
        }
      } else {
        // Compiled instruction
        const accountKeys = transaction.transaction.message.accountKeys || [];
        if (accountKeys[instruction.programIdIndex]) {
          programId = accountKeys[instruction.programIdIndex].toString();
          instructionType = 'compiled';
          accounts = this.extractAccountsFromCompiled(instruction, transaction);
        } else {
          return null;
        }
      }

      const programName = KNOWN_PROGRAMS[programId] || 'Unknown Program';
      const success = !transaction.meta?.err;
      const computeUnits = this.estimateComputeUnits(instructionType, accounts.length);
      
      return {
        id: id.toString(),
        program: programName,
        programId,
        instruction: instructionType,
        depth,
        accounts,
        success,
        error: success ? undefined : this.getInstructionError(transaction),
        computeUnits,
        gasEfficiency: this.assessGasEfficiency(computeUnits, accounts.length),
        suggestedOptimizations: this.getSuggestedOptimizations(instructionType, accounts.length)
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract accounts from parsed instruction (internal helper)
   */
  private extractAccountsFromParsed(instruction: any, transaction: ParsedTransactionWithMeta): CPIAccount[] {
    const accounts: CPIAccount[] = [];
    
    if (instruction.parsed?.info) {
      const info = instruction.parsed.info;
      const accountFields = ['account', 'source', 'destination', 'authority', 'mint', 'owner'];
      
      for (const field of accountFields) {
        if (info[field] && typeof info[field] === 'string') {
          try {
            const pubkey = info[field];
            const accountInfo = this.getAccountInfo(pubkey, transaction);
            accounts.push({
              pubkey,
              name: this.getAccountName(field),
              isSigner: accountInfo.isSigner,
              isWritable: accountInfo.isWritable,
              dataChange: true,
              rentExemption: true
            });
          } catch (error) {
            // Skip invalid pubkeys
          }
        }
      }
    }

    return accounts;
  }

  /**
   * Extract accounts from partially decoded instruction (internal helper)
   */
  private extractAccountsFromPartial(instruction: any, transaction: ParsedTransactionWithMeta): CPIAccount[] {
    if (!instruction.accounts) return [];
    
    return instruction.accounts.map((pubkey: any, index: number) => {
      const accountInfo = this.getAccountInfo(pubkey.toString(), transaction);
      return {
        pubkey: pubkey.toString(),
        name: `Account ${index + 1}`,
        isSigner: accountInfo.isSigner,
        isWritable: accountInfo.isWritable,
        dataChange: accountInfo.isWritable,
        rentExemption: true
      };
    });
  }

  /**
   * Extract accounts from compiled instruction (internal helper)
   */
  private extractAccountsFromCompiled(instruction: any, transaction: ParsedTransactionWithMeta): CPIAccount[] {
    const accountKeys = transaction.transaction.message.accountKeys || [];
    
    return instruction.accounts.map((accountIndex: number, index: number) => {
      const pubkey = accountKeys[accountIndex]?.toString() || '';
      const accountInfo = this.getAccountInfo(pubkey, transaction);
      
      return {
        pubkey,
        name: `Account ${index + 1}`,
        isSigner: accountInfo.isSigner,
        isWritable: accountInfo.isWritable,
        dataChange: accountInfo.isWritable,
        rentExemption: true
      };
    });
  }

  /**
   * Get account metadata from transaction (internal helper)
   */
  private getAccountInfo(pubkey: string, transaction: ParsedTransactionWithMeta): {
    isSigner: boolean;
    isWritable: boolean;
  } {
    const accountKeys = transaction.transaction.message.accountKeys || [];
    const index = accountKeys.findIndex(key => key.toString() === pubkey);
    
    if (index === -1) {
      return { isSigner: false, isWritable: false };
    }

    // Conservative assumptions for parsed transactions
    const numRequiredSignatures = 1;
    const numReadonlyUnsignedAccounts = Math.max(0, accountKeys.length - 5);

    return {
      isSigner: index < numRequiredSignatures,
      isWritable: index < accountKeys.length - numReadonlyUnsignedAccounts
    };
  }

  /**
   * Get friendly account name (internal helper)
   */
  private getAccountName(role: string): string {
    const roleNames: Record<string, string> = {
      account: 'Target Account',
      source: 'Source Account',
      destination: 'Destination Account',
      authority: 'Authority Account',
      mint: 'Token Mint',
      owner: 'Owner Account'
    };
    
    return roleNames[role] || 'Account';
  }

  /**
   * Get instruction error message (internal helper)
   */
  private getInstructionError(transaction: ParsedTransactionWithMeta): string {
    if (transaction.meta?.err) {
      return JSON.stringify(transaction.meta.err);
    }
    return 'Unknown error';
  }

  /**
   * Estimate compute units for instruction (internal helper)
   */
  private estimateComputeUnits(instructionType: string, accountCount: number): number {
    const baseUnits: Record<string, number> = {
      'transfer': 2300,
      'createAccount': 5000,
      'createIdempotent': 6000,
      'initialize': 8000,
      'swap': 25000,
      'stake': 15000,
      'unknown': 10000,
      'compiled': 15000
    };

    const base = baseUnits[instructionType] || baseUnits['unknown'];
    const accountMultiplier = Math.max(1, Math.floor(accountCount / 3));
    
    return base * accountMultiplier;
  }

  /**
   * Assess gas efficiency (internal helper)
   */
  private assessGasEfficiency(computeUnits: number, accountCount: number): 'optimal' | 'good' | 'poor' {
    const ratio = computeUnits / Math.max(1, accountCount);
    
    if (ratio < 5000) return 'optimal';
    if (ratio < 15000) return 'good';
    return 'poor';
  }

  /**
   * Get optimization suggestions (internal helper)
   */
  private getSuggestedOptimizations(instructionType: string, accountCount: number): string[] {
    const optimizations: string[] = [];
    
    if (accountCount > 10) {
      optimizations.push('Consider reducing the number of accounts in single instruction');
    }
    
    if (instructionType === 'swap') {
      optimizations.push('Use direct routes to minimize CPI calls');
      optimizations.push('Consider batching multiple swaps');
    }
    
    if (instructionType === 'unknown' || instructionType === 'compiled') {
      optimizations.push('Use parsed instructions for better debugging');
    }

    return optimizations;
  }
}

// Convenience functions for direct usage
export async function getTransactionDetails(signature: string, rpcEndpoint?: string): Promise<ParsedTransactionWithMeta | null> {
  const client = new SolanaRpcClient(rpcEndpoint);
  return client.getTransactionDetails(signature);
}

export function parseTransactionForCPI(transaction: ParsedTransactionWithMeta): CPIFlowStep[] {
  const client = new SolanaRpcClient();
  return client.parseTransactionForCPI(transaction);
}

export function analyzeTransactionErrors(transaction: ParsedTransactionWithMeta): TransactionError[] {
  const client = new SolanaRpcClient();
  return client.analyzeTransactionErrors(transaction);
}

export async function getNetworkHealth(rpcEndpoint?: string) {
  const client = new SolanaRpcClient(rpcEndpoint);
  return client.getNetworkHealth();
}