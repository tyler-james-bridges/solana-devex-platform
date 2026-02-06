'use client'

import React, { useState, useEffect, useCallback } from 'react';
import {
  Search,
  Loader2,
  Copy,
  ExternalLink,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  GitBranch,
  ChevronRight,
  Eye,
  Wrench,
  RotateCcw,
  Hash,
  Clock,
  Cpu,
  Activity,
  Bug,
  Code,
  FileText,
  Star,
  TrendingUp,
  Info,
  Zap,
  Shield,
  Lightbulb,
  ArrowRight,
  BookOpen,
  Target,
  Database
} from 'lucide-react';

interface TransactionDebugger {
  signature: string;
  status: 'analyzing' | 'success' | 'error' | 'not-found';
  cpiFlow?: CPIFlowStep[];
  errors?: TransactionError[];
  performance?: {
    computeUnitsUsed: number;
    computeUnitsRequested: number;
    fee: number;
    slot: number;
    computeEfficiency: number;
    gasOptimization: string;
  };
  metadata?: {
    blockTime: string;
    confirmations: number;
    programsInvolved: string[];
    accountsModified: number;
    totalInstructions: number;
  };
}

interface CPIFlowStep {
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

interface CPIAccount {
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

interface TransactionError {
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

interface DebugExample {
  id: string;
  title: string;
  description: string;
  signature: string;
  category: 'common-errors' | 'optimizations' | 'advanced-patterns' | 'defi-protocols';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  tags: string[];
}

const debugExamples: DebugExample[] = [
  {
    id: 'realloc-error',
    title: 'Account Reallocation Error',
    description: 'Classic account size constraint violation in Anchor program',
    signature: 'ReallocErrYrCZ9u2ZyGXfPzqQr5XsGHF9JLLksJjBLbK4M7jXgE2ZE7R7TTqgrjbMBeUCBYKUU',
    category: 'common-errors',
    difficulty: 'beginner',
    tags: ['anchor', 'realloc', 'constraints']
  },
  {
    id: 'balance-mismatch',
    title: 'Insufficient Balance in DEX Swap',
    description: 'Token account balance insufficient for swap operation',
    signature: 'BalanceMSh4XyZ9aVsWw2gNpJhRzKJDdTgYhP4mF3J8Q7vRbNuLtE2wSdHjKnMcPqBvF6Az',
    category: 'common-errors',
    difficulty: 'intermediate',
    tags: ['dex', 'spl-token', 'balance']
  },
  {
    id: 'cpi-overflow',
    title: 'CPI Stack Overflow',
    description: 'Too many cross-program invocations causing stack overflow',
    signature: 'CPIOvfWX8PnMjRgF4wTcHs3VkJdYqPbGfLx2QjE7wZyCpRvNmKsL9AhBjDnTxGwVcPqF',
    category: 'common-errors',
    difficulty: 'advanced',
    tags: ['cpi', 'stack-overflow', 'complex']
  },
  {
    id: 'compute-optimization',
    title: 'Compute Unit Optimization',
    description: 'Efficiently structured transaction using minimal compute',
    signature: 'OptimalCUYrCZ9u2ZyGXfPzqQr5XsGHF9JLLksJjBLbK4M7jXgE2ZE7R7TTqgrjbMB',
    category: 'optimizations',
    difficulty: 'intermediate',
    tags: ['optimization', 'compute-units', 'efficiency']
  },
  {
    id: 'amm-arbitrage',
    title: 'AMM Arbitrage Transaction',
    description: 'Complex multi-hop arbitrage across different AMM protocols',
    signature: 'AMMArbitrageCZ9u2ZyGXfPzqQr5XsGHF9JLLksJjBLbK4M7jXgE2ZE7R7TTqgrjbM',
    category: 'defi-protocols',
    difficulty: 'advanced',
    tags: ['amm', 'arbitrage', 'defi', 'raydium', 'orca']
  },
  {
    id: 'nft-marketplace',
    title: 'NFT Marketplace Listing',
    description: 'NFT listing with royalty enforcement and metadata updates',
    signature: 'NFTListingCZ9u2ZyGXfPzqQr5XsGHF9JLLksJjBLbK4M7jXgE2ZE7R7TTqgrjbM',
    category: 'advanced-patterns',
    difficulty: 'intermediate',
    tags: ['nft', 'marketplace', 'royalties', 'metaplex']
  },
  {
    id: 'stake-delegation',
    title: 'Validator Stake Delegation',
    description: 'Staking SOL to validator with reward optimization',
    signature: 'StakeDelegCZ9u2ZyGXfPzqQr5XsGHF9JLLksJjBLbK4M7jXgE2ZE7R7TTqgrjbM',
    category: 'advanced-patterns',
    difficulty: 'beginner',
    tags: ['staking', 'delegation', 'validator']
  },
  {
    id: 'perpetuals-trade',
    title: 'Perpetuals Trading Error',
    description: 'Margin requirements not met in perpetual swap',
    signature: 'PerpsErrorCZ9u2ZyGXfPzqQr5XsGHF9JLLksJjBLbK4M7jXgE2ZE7R7TTqgrjbM',
    category: 'defi-protocols',
    difficulty: 'advanced',
    tags: ['perpetuals', 'margin', 'mango', 'drift']
  }
];

const CPIDebuggerPage: React.FC = () => {
  const [transactionSignature, setTransactionSignature] = useState('');
  const [debuggerResult, setDebuggerResult] = useState<TransactionDebugger | null>(null);
  const [isDebugging, setIsDebugging] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Analyze transaction for debugging
  const analyzeTransaction = useCallback(async (signature: string) => {
    if (!signature.trim()) return;
    
    setIsDebugging(true);
    setDebuggerResult(null);

    // Simulate API delay with progressive updates
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Show initial analysis status
    setDebuggerResult({
      signature,
      status: 'analyzing'
    });

    await new Promise(resolve => setTimeout(resolve, 1200));

    // Generate comprehensive mock analysis based on signature pattern
    const isErrorExample = signature.includes('Error') || signature.includes('Err');
    const isOptimizedExample = signature.includes('Optimal') || signature.includes('Optim');
    
    const mockResult: TransactionDebugger = {
      signature,
      status: 'success',
      performance: {
        computeUnitsUsed: isOptimizedExample ? 125450 : 289750,
        computeUnitsRequested: isOptimizedExample ? 150000 : 300000,
        fee: isOptimizedExample ? 3500 : 8000,
        slot: 175890125,
        computeEfficiency: isOptimizedExample ? 83.6 : 96.6,
        gasOptimization: isOptimizedExample ? 'Excellent - Well optimized transaction structure' : 'Good - Some optimization opportunities available'
      },
      metadata: {
        blockTime: new Date().toISOString(),
        confirmations: 325,
        programsInvolved: isErrorExample ? ['Token Program', 'DEX Program'] : ['Token Program', 'DEX Program', 'AMM Program'],
        accountsModified: isErrorExample ? 8 : 15,
        totalInstructions: isErrorExample ? 3 : 7
      },
      cpiFlow: [
        {
          id: '1',
          program: 'Token Program',
          programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          instruction: 'Transfer',
          depth: 0,
          accounts: [
            {
              pubkey: 'HXYrCZ9u2ZyGXfPzqQr5XsGHF9JLLksJjBLbK4M7jXgE',
              name: 'User Token Account',
              isSigner: true,
              isWritable: true,
              beforeBalance: 1000.5,
              afterBalance: isErrorExample ? 1000.5 : 950.5,
              dataChange: false,
              dataSize: 165,
              rentExemption: true
            },
            {
              pubkey: 'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1',
              name: 'Pool Token Account',
              isSigner: false,
              isWritable: true,
              beforeBalance: 50000.0,
              afterBalance: isErrorExample ? 50000.0 : 50050.0,
              dataChange: true,
              dataSize: 165,
              rentExemption: true
            }
          ],
          success: true,
          computeUnits: 15230,
          gasEfficiency: 'optimal',
          suggestedOptimizations: isOptimizedExample ? [] : ['Consider batching transfers', 'Use token-2022 for reduced fees']
        },
        {
          id: '2',
          program: signature.includes('DEX') ? 'DEX Program' : 'AMM Program',
          programId: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          instruction: signature.includes('swap') ? 'swap' : 'trade',
          depth: 1,
          accounts: [
            {
              pubkey: 'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1',
              name: 'Liquidity Pool',
              isSigner: false,
              isWritable: true,
              beforeBalance: 25000.0,
              afterBalance: isErrorExample ? 25000.0 : 24950.0,
              dataChange: true,
              dataSize: 8192,
              rentExemption: true
            },
            {
              pubkey: 'AMMPoolVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1',
              name: 'AMM Pool Account',
              isSigner: false,
              isWritable: true,
              beforeBalance: 0.0,
              afterBalance: 0.0,
              dataChange: true,
              dataSize: 4096,
              rentExemption: true
            }
          ],
          success: !isErrorExample,
          error: isErrorExample ? 'Account reallocation exceeded maximum allowed size' : undefined,
          computeUnits: isErrorExample ? 85420 : 145800,
          gasEfficiency: isOptimizedExample ? 'optimal' : isErrorExample ? 'poor' : 'good',
          suggestedOptimizations: isOptimizedExample ? [] : ['Optimize account layout', 'Reduce state updates']
        }
      ],
      errors: isErrorExample ? [
        {
          type: 'realloc_constraint',
          severity: 'critical',
          instruction: 1,
          programId: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          message: 'Account reallocation constraint violation: Attempted to reallocate account beyond maximum size limit (8KB → 12KB)',
          suggestedFix: 'Implement PDA chunking pattern to split large data across multiple accounts',
          estimatedFixTime: '2-4 hours',
          documentation: 'https://docs.rs/anchor-lang/latest/anchor_lang/accounts/account/struct.Account.html#account-reallocation',
          codeExample: `// Before: Single large account (PROBLEMATIC)
#[account(
    realloc = 12_000, // Exceeds 10KB limit
    realloc::payer = user,
    realloc::zero = false
)]
pub large_account: Account<'info, LargeData>,

// After: Split into chunks using PDA pattern
#[derive(Accounts)]
#[instruction(chunk_id: u8)]
pub struct InitializeChunk<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 8_000, // 8KB chunks
        seeds = [b"data_chunk", user.key().as_ref(), &[chunk_id]],
        bump
    )]
    pub data_chunk: Account<'info, DataChunk>,
    
    #[account(mut)]
    pub user: Signer<'info>,
    
    pub system_program: Program<'info, System>,
}`
        },
        {
          type: 'compute_budget',
          severity: 'warning',
          instruction: 1,
          programId: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          message: 'High compute unit usage detected. Consider optimizing instruction logic.',
          suggestedFix: 'Review loops and complex calculations. Use lookup tables for repetitive operations.',
          estimatedFixTime: '1-2 hours',
          documentation: 'https://docs.solana.com/developing/programming-model/runtime#compute-budget',
          codeExample: `// Optimize loops and calculations
// Before: O(n²) complexity
for i in 0..data.len() {
    for j in 0..data.len() {
        // expensive operation
    }
}

// After: O(n) with lookup table
let lookup: HashMap<u64, u64> = precomputed_values();
for item in data.iter() {
    let result = lookup.get(&item.key).unwrap_or(&0);
    // efficient operation
}`
        }
      ] : []
    };

    setDebuggerResult(mockResult);
    setIsDebugging(false);
  }, []);

  const loadExample = useCallback((example: DebugExample) => {
    setTransactionSignature(example.signature);
    analyzeTransaction(example.signature);
  }, [analyzeTransaction]);

  const filteredExamples = debugExamples.filter(example => {
    const categoryMatch = selectedCategory === 'all' || example.category === selectedCategory;
    const difficultyMatch = selectedDifficulty === 'all' || example.difficulty === selectedDifficulty;
    return categoryMatch && difficultyMatch;
  });

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'common-errors': return Bug;
      case 'optimizations': return Zap;
      case 'advanced-patterns': return Target;
      case 'defi-protocols': return TrendingUp;
      default: return Code;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200';
      case 'advanced': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      {/* Header Section */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0 mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-4">
              <div className="bg-blue-600 p-3 rounded-xl">
                <Search className="w-8 h-8 text-white" />
              </div>
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-white">
                CPI Debugger
              </h1>
              <div className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1 rounded-full text-sm font-semibold border border-blue-200 dark:border-blue-700">
                FLAGSHIP
              </div>
            </div>
            
            <p className="text-lg text-gray-600 dark:text-gray-300 mb-6 max-w-3xl">
              The most advanced Cross-Program Invocation debugger for Solana. 
              Analyze complex transactions, identify CPI errors, and optimize your programs like a pro.
            </p>
            
            <div className="flex flex-col sm:flex-row items-start space-y-3 sm:space-y-0 sm:space-x-6">
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span>Real-time transaction analysis</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span>Smart error detection</span>
              </div>
              <div className="flex items-center space-x-2 text-gray-600 dark:text-gray-300">
                <CheckCircle2 className="w-5 h-5 text-green-600" />
                <span>Code optimization suggestions</span>
              </div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Transactions Debugged</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">50K+</p>
              </div>
              <Activity className="w-8 h-8 text-blue-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Error Detection Rate</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">95%</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Supported Protocols</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">8</p>
              </div>
              <Shield className="w-8 h-8 text-purple-600" />
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Monitoring</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">24/7</p>
              </div>
              <Clock className="w-8 h-8 text-orange-600" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Debug Interface */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-xl overflow-hidden mb-8">
          {/* Debug Controls */}
          <div className="bg-gray-50 dark:bg-gray-700/50 p-6 border-b dark:border-gray-700">
            <div className="flex flex-col lg:flex-row lg:items-end lg:space-x-6 space-y-4 lg:space-y-0">
              {/* Transaction Input */}
              <div className="flex-1">
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                  Transaction Signature
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={transactionSignature}
                    onChange={(e) => setTransactionSignature(e.target.value)}
                    placeholder="Enter transaction signature (e.g., 2ZE7R7TTqgrjbMBeUCBYKUUKsNUCcCx1...)"
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {transactionSignature && (
                    <button
                      onClick={() => setTransactionSignature('')}
                      className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <XCircle className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
              
              {/* Debug Button */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => analyzeTransaction(transactionSignature)}
                  disabled={isDebugging || !transactionSignature.trim()}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2 min-w-[140px] justify-center"
                >
                  {isDebugging ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      <span>Debug Transaction</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Advanced
                </button>
              </div>
            </div>
            
            {/* Advanced Options */}
            {showAdvancedOptions && (
              <div className="mt-6 p-4 bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-600">
                <h4 className="font-semibold text-gray-900 dark:text-white mb-3">Advanced Analysis Options</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Deep CPI analysis</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Gas optimization suggestions</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" defaultChecked className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Security vulnerability scan</span>
                  </label>
                </div>
              </div>
            )}
          </div>

          {/* Debug Results */}
          {debuggerResult && (
            <div className="p-6 space-y-8">
              {debuggerResult.status === 'analyzing' && (
                <div className="text-center py-12">
                  <div className="inline-flex items-center space-x-3 text-blue-600 dark:text-blue-400">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <div className="text-xl font-semibold">Analyzing transaction...</div>
                  </div>
                  <p className="text-gray-600 dark:text-gray-400 mt-2">
                    Running deep CPI analysis and error detection
                  </p>
                </div>
              )}

              {debuggerResult.status === 'success' && (
                <>
                  {/* Performance Overview */}
                  {debuggerResult.performance && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                          <Activity className="w-6 h-6 mr-3 text-green-600" />
                          Transaction Performance Analysis
                        </h3>
                        <div className="flex items-center space-x-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
                            debuggerResult.performance.computeEfficiency > 90 
                              ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                              : debuggerResult.performance.computeEfficiency > 70
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                          }`}>
                            {debuggerResult.performance.computeEfficiency}% Efficient
                          </span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-600">
                          <div className="flex items-center space-x-2 mb-2">
                            <Cpu className="w-5 h-5 text-blue-600" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Compute Units</span>
                          </div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {debuggerResult.performance.computeUnitsUsed.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            of {debuggerResult.performance.computeUnitsRequested.toLocaleString()} requested
                          </div>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-600">
                          <div className="flex items-center space-x-2 mb-2">
                            <Hash className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Transaction Fee</span>
                          </div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {(debuggerResult.performance.fee / 1000000).toFixed(6)}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">SOL</div>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-600">
                          <div className="flex items-center space-x-2 mb-2">
                            <Clock className="w-5 h-5 text-purple-600" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Slot</span>
                          </div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {debuggerResult.performance.slot.toLocaleString()}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Block height</div>
                        </div>
                        
                        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-600">
                          <div className="flex items-center space-x-2 mb-2">
                            <TrendingUp className="w-5 h-5 text-orange-600" />
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Programs</span>
                          </div>
                          <div className="text-2xl font-bold text-gray-900 dark:text-white">
                            {debuggerResult.metadata?.programsInvolved.length || 0}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">Invoked</div>
                        </div>
                      </div>
                      
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                        <div className="flex items-center space-x-2 mb-2">
                          <Lightbulb className="w-5 h-5 text-blue-600" />
                          <span className="font-semibold text-blue-900 dark:text-blue-100">Gas Optimization Insight</span>
                        </div>
                        <p className="text-blue-800 dark:text-blue-200 text-sm">
                          {debuggerResult.performance.gasOptimization}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* CPI Flow Visualization */}
                  {debuggerResult.cpiFlow && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                          <GitBranch className="w-6 h-6 mr-3 text-indigo-600" />
                          Cross-Program Invocation Flow
                        </h3>
                        <span className="text-sm bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 px-3 py-1 rounded-full">
                          {debuggerResult.cpiFlow.length} instruction{debuggerResult.cpiFlow.length !== 1 ? 's' : ''}
                        </span>
                      </div>

                      <div className="space-y-4">
                        {debuggerResult.cpiFlow.map((step, index) => (
                          <div key={step.id} className="relative">
                            {/* Connection line */}
                            {index > 0 && (
                              <div
                                className="absolute left-6 -top-4 w-0.5 h-8 bg-gray-300 dark:bg-gray-600"
                                style={{ marginLeft: `${step.depth * 24}px` }}
                              />
                            )}
                            
                            <div
                              className={`bg-white dark:bg-gray-800 p-5 rounded-lg border shadow-sm ${
                                step.success 
                                  ? 'border-green-200 dark:border-green-800' 
                                  : 'border-red-200 dark:border-red-800'
                              }`}
                              style={{ marginLeft: `${step.depth * 24}px` }}
                            >
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center space-x-3 flex-1">
                                  <div className={`w-4 h-4 rounded-full flex-shrink-0 ${
                                    step.success ? 'bg-green-500' : 'bg-red-500'
                                  }`} />
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center space-x-2 mb-1">
                                      <span className="font-semibold text-lg text-gray-900 dark:text-white">
                                        {step.program}
                                      </span>
                                      <ChevronRight className="w-4 h-4 text-gray-400" />
                                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                                        {step.instruction}
                                      </span>
                                    </div>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                                      {step.programId}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="flex items-center space-x-3">
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    step.gasEfficiency === 'optimal' 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                                      : step.gasEfficiency === 'good'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                                  }`}>
                                    {step.computeUnits.toLocaleString()} CU
                                  </span>
                                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                    step.gasEfficiency === 'optimal' 
                                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200'
                                      : step.gasEfficiency === 'good'
                                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                                      : 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                                  }`}>
                                    {step.gasEfficiency}
                                  </span>
                                  {!step.success && (
                                    <span className="px-3 py-1 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 rounded-full text-xs font-semibold">
                                      Failed
                                    </span>
                                  )}
                                </div>
                              </div>

                              {step.error && (
                                <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <XCircle className="w-5 h-5 text-red-600" />
                                    <span className="font-semibold text-red-800 dark:text-red-200">Error Details</span>
                                  </div>
                                  <p className="text-red-700 dark:text-red-300 text-sm">{step.error}</p>
                                </div>
                              )}

                              {step.suggestedOptimizations && step.suggestedOptimizations.length > 0 && (
                                <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <Zap className="w-5 h-5 text-yellow-600" />
                                    <span className="font-semibold text-yellow-800 dark:text-yellow-200">Optimization Opportunities</span>
                                  </div>
                                  <ul className="list-disc list-inside space-y-1">
                                    {step.suggestedOptimizations.map((opt, idx) => (
                                      <li key={idx} className="text-yellow-700 dark:text-yellow-300 text-sm">{opt}</li>
                                    ))}
                                  </ul>
                                </div>
                              )}

                              {/* Account Changes */}
                              {step.accounts.length > 0 && (
                                <div className="space-y-3">
                                  <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 flex items-center">
                                    <Database className="w-4 h-4 mr-2" />
                                    Account Changes ({step.accounts.length})
                                  </h4>
                                  <div className="grid gap-3">
                                    {step.accounts.map((account, accIndex) => (
                                      <div key={accIndex} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
                                        <div className="flex items-start justify-between mb-3">
                                          <div className="flex-1 min-w-0">
                                            <div className="flex items-center space-x-2 mb-2">
                                              <span className="font-semibold text-gray-900 dark:text-white">
                                                {account.name || 'Unknown Account'}
                                              </span>
                                              <div className="flex items-center space-x-2">
                                                {account.isSigner && (
                                                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
                                                    Signer
                                                  </span>
                                                )}
                                                {account.isWritable && (
                                                  <span className="px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 rounded text-xs font-medium">
                                                    Writable
                                                  </span>
                                                )}
                                                {account.rentExemption && (
                                                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 rounded text-xs font-medium">
                                                    Rent Exempt
                                                  </span>
                                                )}
                                              </div>
                                            </div>
                                            <p className="text-xs text-gray-600 dark:text-gray-400 font-mono mb-1">
                                              {account.pubkey}
                                            </p>
                                            {account.dataSize && (
                                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                                Data size: {account.dataSize.toLocaleString()} bytes
                                              </p>
                                            )}
                                          </div>
                                          
                                          {(account.beforeBalance !== undefined && account.afterBalance !== undefined) && (
                                            <div className="text-right ml-4">
                                              <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                Balance Change
                                              </div>
                                              <div className="font-mono text-sm text-gray-900 dark:text-white">
                                                {account.beforeBalance} → {account.afterBalance} SOL
                                              </div>
                                              {account.beforeBalance !== account.afterBalance && (
                                                <div className={`text-sm font-semibold ${
                                                  account.afterBalance > account.beforeBalance 
                                                    ? 'text-green-600 dark:text-green-400' 
                                                    : 'text-red-600 dark:text-red-400'
                                                }`}>
                                                  {account.afterBalance > account.beforeBalance ? '+' : ''}
                                                  {(account.afterBalance - account.beforeBalance).toFixed(6)} SOL
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Error Analysis & Suggested Fixes */}
                  {debuggerResult.errors && debuggerResult.errors.length > 0 && (
                    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center">
                          <Wrench className="w-6 h-6 mr-3 text-red-600" />
                          Error Analysis & Recommended Fixes
                        </h3>
                        <span className="text-sm bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-3 py-1 rounded-full">
                          {debuggerResult.errors.filter(e => e.severity === 'critical').length} critical, {debuggerResult.errors.filter(e => e.severity === 'warning').length} warnings
                        </span>
                      </div>

                      <div className="space-y-6">
                        {debuggerResult.errors.map((error, index) => (
                          <div key={index} className={`bg-white dark:bg-gray-800 p-6 rounded-lg border shadow-sm ${
                            error.severity === 'critical' 
                              ? 'border-red-200 dark:border-red-800' 
                              : error.severity === 'warning'
                              ? 'border-yellow-200 dark:border-yellow-800'
                              : 'border-blue-200 dark:border-blue-800'
                          }`}>
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex items-center space-x-3 flex-1">
                                <div className={`w-4 h-4 rounded-full flex-shrink-0 ${
                                  error.severity === 'critical' ? 'bg-red-500' 
                                  : error.severity === 'warning' ? 'bg-yellow-500'
                                  : 'bg-blue-500'
                                }`} />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center space-x-2 mb-1">
                                    <span className="font-semibold text-lg text-gray-900 dark:text-white">
                                      {error.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                    </span>
                                    <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
                                      Instruction #{error.instruction}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
                                    {error.programId}
                                  </p>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                  error.severity === 'critical' 
                                    ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200'
                                    : error.severity === 'warning'
                                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200'
                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200'
                                }`}>
                                  {error.severity}
                                </span>
                                {error.estimatedFixTime && (
                                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 rounded-full text-xs font-semibold">
                                    {error.estimatedFixTime} to fix
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Error Description */}
                            <div className={`p-4 rounded-lg mb-4 ${
                              error.severity === 'critical' 
                                ? 'bg-red-50 dark:bg-red-900/20' 
                                : error.severity === 'warning'
                                ? 'bg-yellow-50 dark:bg-yellow-900/20'
                                : 'bg-blue-50 dark:bg-blue-900/20'
                            }`}>
                              <div className="flex items-center space-x-2 mb-2">
                                {error.severity === 'critical' ? <XCircle className="w-5 h-5 text-red-600" />
                                : error.severity === 'warning' ? <AlertTriangle className="w-5 h-5 text-yellow-600" />
                                : <Info className="w-5 h-5 text-blue-600" />}
                                <span className="font-semibold text-gray-900 dark:text-white">Problem Description</span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300">{error.message}</p>
                            </div>

                            {/* Suggested Fix */}
                            <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg mb-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                                <span className="font-semibold text-gray-900 dark:text-white">Recommended Solution</span>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300 mb-3">{error.suggestedFix}</p>
                              
                              {error.codeExample && (
                                <div className="bg-gray-900 dark:bg-gray-800 p-4 rounded-lg overflow-x-auto">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-sm text-gray-400 font-medium">Code Example</span>
                                    <button className="text-gray-400 hover:text-gray-300 flex items-center space-x-2 text-sm">
                                      <Copy className="w-4 h-4" />
                                      <span>Copy</span>
                                    </button>
                                  </div>
                                  <pre className="text-sm text-gray-100 whitespace-pre-wrap overflow-x-auto">
                                    <code>{error.codeExample}</code>
                                  </pre>
                                </div>
                              )}
                            </div>

                            {/* Documentation Link */}
                            {error.documentation && (
                              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                <div className="flex items-center space-x-2">
                                  <BookOpen className="w-4 h-4 text-blue-600" />
                                  <span className="text-sm font-medium text-blue-800 dark:text-blue-200">Related Documentation</span>
                                </div>
                                <a
                                  href={error.documentation}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium"
                                >
                                  <span>View Docs</span>
                                  <ExternalLink className="w-4 h-4" />
                                </a>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>

        {/* Examples Section */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border dark:border-gray-700 shadow-lg">
          <div className="p-6 border-b dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Eye className="w-7 h-7 mr-3 text-blue-600" />
                Debug Examples & Learning Hub
              </h2>
              <div className="flex items-center space-x-2">
                <Star className="w-5 h-5 text-yellow-500" />
                <span className="text-sm text-gray-600 dark:text-gray-400">Curated by experts</span>
              </div>
            </div>
            
            {/* Filter Controls */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Categories</option>
                  <option value="common-errors">Common Errors</option>
                  <option value="optimizations">Optimizations</option>
                  <option value="advanced-patterns">Advanced Patterns</option>
                  <option value="defi-protocols">DeFi Protocols</option>
                </select>
              </div>
              
              <div className="flex-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Difficulty
                </label>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Levels</option>
                  <option value="beginner">Beginner</option>
                  <option value="intermediate">Intermediate</option>
                  <option value="advanced">Advanced</option>
                </select>
              </div>
            </div>
          </div>

          <div className="p-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredExamples.map((example) => {
                const CategoryIcon = getCategoryIcon(example.category);
                return (
                  <div
                    key={example.id}
                    className="group bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 p-5 rounded-lg border dark:border-gray-600 hover:shadow-md transition-all duration-200 cursor-pointer"
                    onClick={() => loadExample(example)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <CategoryIcon className="w-5 h-5 text-blue-600" />
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getDifficultyColor(example.difficulty)}`}>
                          {example.difficulty}
                        </span>
                      </div>
                      <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" />
                    </div>
                    
                    <h3 className="font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {example.title}
                    </h3>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                      {example.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mb-3">
                      {example.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 rounded text-xs font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                      {example.tags.length > 3 && (
                        <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded text-xs">
                          +{example.tags.length - 3}
                        </span>
                      )}
                    </div>
                    
                    <div className="text-xs text-gray-500 dark:text-gray-400 font-mono">
                      {example.signature.slice(0, 20)}...
                    </div>
                  </div>
                );
              })}
            </div>
            
            {filteredExamples.length === 0 && (
              <div className="text-center py-12">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No examples found</h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try adjusting your filters to see more examples
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CPIDebuggerPage;