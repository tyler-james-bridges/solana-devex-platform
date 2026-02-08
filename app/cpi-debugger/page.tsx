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

// Real mainnet transaction signatures for each example category
const debugExamples: DebugExample[] = [
  {
    id: 'jupiter-swap',
    title: 'Jupiter DEX Swap',
    description: 'Real Jupiter aggregator swap with multi-hop routing across Solana DEXes',
    signature: '4qRefbKfE4hqE4at89J3sEuZw5azdJNWMBoCNbPfiwBTGmuuT9gxpSMaV5F7mXehpKoKAgissZT32ZBVDjQ3uphv',
    category: 'defi-protocols',
    difficulty: 'beginner',
    tags: ['jupiter', 'swap', 'dex']
  },
  {
    id: 'jupiter-failed',
    title: 'Failed DEX Swap',
    description: 'Jupiter swap that failed on-chain -- inspect the error and CPI trace',
    signature: '4C3tBZCGuiVBEvti7HMcVHCVPAXjRtxeNKnPmBDHNcSAzSaNMDdg8MRN1RuESWpVHRtDhtjAZWzJwVJqmfDUS3Pk',
    category: 'common-errors',
    difficulty: 'intermediate',
    tags: ['jupiter', 'error', 'failed-tx']
  },
  {
    id: 'raydium-amm',
    title: 'Raydium AMM Swap',
    description: 'Raydium automated market maker swap with liquidity pool interaction',
    signature: '5KSSXcvFCi3HHbgDJkbMz3mwwtzkvVjv78Qik9JUfx9Xkgca7AZBQqBBaVYVocRY1zKBVH4xic7FwWDvnsCqHwYD',
    category: 'defi-protocols',
    difficulty: 'intermediate',
    tags: ['raydium', 'amm', 'liquidity-pool']
  },
  {
    id: 'marinade-stake',
    title: 'Marinade Liquid Staking',
    description: 'SOL staking via Marinade Finance liquid staking protocol',
    signature: '5jd2Ep9rkKJTb9HZRsk7ZfA71K9Z5thzdkK16e21VCtsF6ppCaPBtS8vZKusf48vCfLmLi656n99KEWBZS65VkXr',
    category: 'advanced-patterns',
    difficulty: 'beginner',
    tags: ['staking', 'marinade', 'liquid-staking']
  },
  {
    id: 'metaplex-nft',
    title: 'Metaplex NFT Operation',
    description: 'NFT metadata update or transfer via Metaplex Token Metadata program',
    signature: '2FQrCPh3vXsfaja5DBSmDUvQWuagnpAoJsR6U5yGffdLCmp4RC58wxo3wM5GNEomr2SXkVs45wJeXaCMSv8Er6pN',
    category: 'advanced-patterns',
    difficulty: 'intermediate',
    tags: ['nft', 'metaplex', 'metadata']
  },
  {
    id: 'drift-perps',
    title: 'Drift Perpetuals Trade',
    description: 'Perpetual futures position on Drift Protocol with margin and settlement',
    signature: '4rkqcnobwgj5XjYZ1SF1TR6rynizd3d18ry22zN8ugcL8iS1a64Tt2vGow8ZMecQz3rgQ7FuUroRakD2nXfv1995',
    category: 'defi-protocols',
    difficulty: 'advanced',
    tags: ['drift', 'perpetuals', 'margin']
  },
  {
    id: 'multi-hop-failed',
    title: 'Multi-Hop Routing Failure',
    description: 'Complex multi-hop swap that failed mid-route -- trace the CPI chain to find the break point',
    signature: '32qyvRCYuZU4oapu5Q2Javp6HRdhTmSZN8bXPxGTGGYz1rzT8yYDxrjbtHK86Rooz4w2QyC33AVoFwHbhrX5jbR5',
    category: 'common-errors',
    difficulty: 'advanced',
    tags: ['routing', 'multi-hop', 'cpi-trace']
  },
  {
    id: 'raydium-lp',
    title: 'Raydium LP Position',
    description: 'Adding or removing liquidity from a Raydium AMM pool',
    signature: 'thFtERBem3GUVuuSewRFJ4BWYzH3GZXuJNriRN8FXNWnE4QzDpsq9pgX8msuvmARkbs6nrVk6gMN1LoETv2rM2Z',
    category: 'defi-protocols',
    difficulty: 'intermediate',
    tags: ['raydium', 'liquidity', 'lp']
  }
];

const CPIDebuggerPage: React.FC = () => {
  const [transactionSignature, setTransactionSignature] = useState('');
  const [debuggerResult, setDebuggerResult] = useState<TransactionDebugger | null>(null);
  const [isDebugging, setIsDebugging] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  // Single-purpose page: transaction debugging only

  // Analyze transaction for debugging
  const analyzeTransaction = useCallback(async (signature: string) => {
    if (!signature.trim()) return;
    
    setIsDebugging(true);
    setDebuggerResult(null);

    // Show initial analysis status
    setDebuggerResult({
      signature,
      status: 'analyzing'
    });

    try {
      // Call our real API endpoint
      const response = await fetch('/api/debug-transaction', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ signature }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || `HTTP ${response.status}`);
      }

      if (result.success && result.data) {
        // Successfully got real transaction data
        setDebuggerResult(result.data);
      } else {
        // API returned error but valid response
        setDebuggerResult({
          signature,
          status: 'error',
          errors: [{
            type: 'program_error',
            severity: 'critical',
            instruction: 0,
            programId: 'System',
            message: result.error || 'Failed to fetch transaction data',
            suggestedFix: 'Verify the transaction signature is correct and the transaction exists on the Solana network',
            estimatedFixTime: '5-10 minutes'
          }]
        });
      }
    } catch (error) {
      console.warn('RPC call failed, falling back to demo data:', error);
      
      // Graceful degradation - fall back to demo data if RPC fails
      const isErrorExample = signature.includes('Error') || signature.includes('Err');
      const isOptimizedExample = signature.includes('Optimal') || signature.includes('Optim');
      
      const fallbackResult: TransactionDebugger = {
        signature,
        status: 'success',
        performance: {
          computeUnitsUsed: isOptimizedExample ? 125450 : 289750,
          computeUnitsRequested: isOptimizedExample ? 150000 : 300000,
          fee: isOptimizedExample ? 3500 : 8000,
          slot: 175890125,
          computeEfficiency: isOptimizedExample ? 83.6 : 96.6,
          gasOptimization: `${isOptimizedExample ? 'Excellent - Well optimized' : 'Good - Some optimization opportunities'} (Demo data - RPC unavailable)`
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
            message: 'Account reallocation constraint violation (Demo data - RPC unavailable)',
            suggestedFix: 'Implement PDA chunking pattern to split large data across multiple accounts',
            estimatedFixTime: '2-4 hours',
            documentation: 'https://docs.rs/anchor-lang/latest/anchor_lang/accounts/account/struct.Account.html#account-reallocation'
          }
        ] : []
      };

      setDebuggerResult(fallbackResult);
    }

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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 p-4 sm:p-6">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-2">
          CPI Debugger
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Advanced Cross-Program Invocation debugging and error analysis.
        </p>

      </div>

      {/* Transaction Debugger */}
      {(
        <>
          {/* Debug Interface */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 overflow-hidden mb-6">
          {/* Debug Controls */}
          <div className="bg-gray-50 dark:bg-gray-800 p-6 border-b dark:border-gray-700">
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
                      
                      <div className="bg-blue-50 dark:bg-gray-800 p-4 rounded-lg border border-blue-200 dark:border-gray-700">
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
                                  ? 'border-green-200 dark:border-gray-700' 
                                  : 'border-red-200 dark:border-gray-700'
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
                                <div className="mb-4 p-4 bg-red-50 dark:bg-gray-800 border border-red-200 dark:border-gray-700 rounded-lg">
                                  <div className="flex items-center space-x-2 mb-2">
                                    <XCircle className="w-5 h-5 text-red-600" />
                                    <span className="font-semibold text-red-800 dark:text-red-200">Error Details</span>
                                  </div>
                                  <p className="text-red-700 dark:text-red-300 text-sm">{step.error}</p>
                                </div>
                              )}

                              {step.suggestedOptimizations && step.suggestedOptimizations.length > 0 && (
                                <div className="mb-4 p-4 bg-yellow-50 dark:bg-gray-800 border border-yellow-200 dark:border-gray-700 rounded-lg">
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
                                                  <span className="px-2 py-1 bg-blue-100 dark:bg-gray-800/30 text-blue-800 dark:text-blue-200 rounded text-xs font-medium">
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
                              ? 'border-red-200 dark:border-gray-700' 
                              : error.severity === 'warning'
                              ? 'border-yellow-200 dark:border-gray-700'
                              : 'border-blue-200 dark:border-gray-700'
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
                                    : 'bg-blue-100 text-blue-800 dark:bg-gray-800/30 dark:text-blue-200'
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
                                ? 'bg-red-50 dark:bg-gray-800' 
                                : error.severity === 'warning'
                                ? 'bg-yellow-50 dark:bg-gray-800'
                                : 'bg-blue-50 dark:bg-gray-800'
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
                            <div className="bg-green-50 dark:bg-gray-800 p-4 rounded-lg mb-4">
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
                              <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-gray-800 rounded-lg border border-blue-200 dark:border-gray-700">
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
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700">
          <div className="p-6 border-b dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Eye className="w-7 h-7 mr-3 text-blue-600" />
                Debug Examples & Learning Hub
              </h2>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Real mainnet transactions</span>
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
                    className="group bg-white dark:bg-gray-800 p-5 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200 cursor-pointer"
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
                          className="px-2 py-1 bg-blue-100 dark:bg-gray-800/30 text-blue-800 dark:text-blue-200 rounded text-xs font-medium"
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
          </>
        )}
      </div>
  );
};

export default CPIDebuggerPage;