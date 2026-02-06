/**
 * Real-Time Solana Development Monitoring Dashboard
 * Focused on development workflows, test validators, deployments, and developer tooling
 */

'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Terminal,
  GitCommit,
  Zap,
  Database,
  Code,
  Activity,
  Clock,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
  Square,
  RefreshCw,
  Settings,
  FileText,
  Folder,
  Users,
  CreditCard,
  TrendingUp,
  TrendingDown,
  Monitor,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Hash,
  Box,
  Cpu,
  HardDrive,
  Network,
  Timer,
  Bug,
  TestTube,
  Package,
  Anchor,
  Search,
  GitBranch,
  Layers,
  Eye,
  Wrench,
  RotateCcw,
  ChevronRight,
  Copy,
  ExternalLink
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface TestValidatorMetrics {
  isRunning: boolean;
  slot: number;
  blockHeight: number;
  programsLoaded: number;
  accountsLoaded: number;
  memoryUsage: number;
  cpuUsage: number;
  diskUsage: number;
  transactionThroughput: number;
  avgBlockTime: number;
  lastBlockTime: string;
  errors: string[];
  warnings: string[];
  startTime: string;
  uptime: number;
}

interface AnchorProject {
  name: string;
  path: string;
  programs: AnchorProgram[];
  lastBuild: string;
  buildStatus: 'success' | 'failed' | 'building' | 'unknown';
  testResults: TestResult[];
  deployments: Deployment[];
}

interface AnchorProgram {
  name: string;
  programId: string;
  idlPath: string;
  binaryPath: string;
  lastModified: string;
  size: number;
  deployed: boolean;
  network: string;
}

interface TestResult {
  testFile: string;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  lastRun: string;
  status: 'passed' | 'failed' | 'running';
  failures: TestFailure[];
}

interface TestFailure {
  test: string;
  error: string;
  file: string;
  line: number;
}

interface Deployment {
  programId: string;
  programName: string;
  network: 'localnet' | 'devnet' | 'testnet' | 'mainnet';
  txSignature: string;
  timestamp: string;
  status: 'pending' | 'confirmed' | 'finalized' | 'failed';
  slot: number;
  codeVersion: string;
  upgradeAuthority?: string;
}

interface WatchedAccount {
  address: string;
  name: string;
  type: 'program' | 'pda' | 'user' | 'token';
  balance: number;
  lamports: number;
  owner: string;
  executable: boolean;
  dataSize: number;
  lastUpdated: string;
  changes: AccountChange[];
}

interface AccountChange {
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: string;
  slot: number;
  txSignature?: string;
}

interface Transaction {
  signature: string;
  slot: number;
  timestamp: string;
  status: 'confirmed' | 'finalized' | 'failed';
  fee: number;
  programInstructions: ProgramInstruction[];
  accounts: string[];
  logs: string[];
  computeUnitsUsed: number;
}

interface ProgramInstruction {
  programId: string;
  programName?: string;
  instruction: string;
  accounts: string[];
  data: string;
}

interface DeveloperMetrics {
  testValidator: TestValidatorMetrics;
  anchorProjects: AnchorProject[];
  watchedAccounts: WatchedAccount[];
  recentTransactions: Transaction[];
  rpcMetrics: {
    endpoint: string;
    latency: number;
    requestCount: number;
    errorCount: number;
    successRate: number;
  };
  systemMetrics: {
    cpuUsage: number;
    memoryUsage: number;
    diskUsage: number;
    networkIO: { in: number; out: number };
  };
  alerts: DevAlert[];
}

interface DevAlert {
  id: string;
  type: 'validator' | 'build' | 'test' | 'deployment' | 'account' | 'transaction';
  severity: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  source?: string;
}

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
}

interface CPIAccount {
  pubkey: string;
  name?: string;
  isSigner: boolean;
  isWritable: boolean;
  beforeBalance?: number;
  afterBalance?: number;
  dataChange?: boolean;
}

interface TransactionError {
  type: 'account_balance_mismatch' | 'realloc_constraint' | 'program_error' | 'compute_budget';
  severity: 'critical' | 'warning';
  instruction: number;
  programId: string;
  message: string;
  suggestedFix: string;
  codeExample?: string;
}

const StatusBadge = ({ status, type }: { status: string; type?: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': case 'passed': case 'confirmed': case 'finalized': case 'running': case 'deployed':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-200 dark:border-green-800';
      case 'failed': case 'error':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-200 dark:border-red-800';
      case 'building': case 'pending': case 'deploying':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/30 dark:text-yellow-200 dark:border-yellow-800';
      case 'unknown': case 'skipped': case 'not deployed':
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-200 dark:border-blue-800';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'success': case 'passed': case 'confirmed': case 'finalized': case 'deployed':
        return <CheckCircle2 className="w-3 h-3 flex-shrink-0" />;
      case 'failed': case 'error':
        return <XCircle className="w-3 h-3 flex-shrink-0" />;
      case 'building': case 'pending': case 'running':
        return <Loader2 className="w-3 h-3 animate-spin flex-shrink-0" />;
      default:
        return <Activity className="w-3 h-3 flex-shrink-0" />;
    }
  };

  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border min-w-0 ${getStatusColor(status)}`}>
      {getIcon()}
      <span className="capitalize truncate">{status}</span>
    </div>
  );
};

const MetricCard = ({
  title,
  value,
  change,
  trend,
  icon: Icon,
  status = 'neutral',
  onClick,
  subtitle
}: {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: any;
  status?: 'healthy' | 'degraded' | 'down' | 'neutral';
  onClick?: () => void;
  subtitle?: string;
}) => {
  return (
    <div
      className={`bg-white dark:bg-gray-800 p-3 sm:p-4 lg:p-4 rounded-lg border dark:border-gray-700 transition-all duration-200 hover:shadow-md min-h-[120px] sm:min-h-[140px] flex flex-col justify-between ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start justify-between mb-2 sm:mb-3">
        <Icon className={`w-5 h-5 sm:w-6 sm:h-6 flex-shrink-0 ${status === 'down' ? 'text-red-600' : status === 'degraded' ? 'text-yellow-600' : 'text-blue-600'}`} />
        {change && (
          <div className="flex items-center space-x-1 min-w-0 ml-2">
            {trend === 'up' ? (
              <ArrowUpRight className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 flex-shrink-0" />
            ) : trend === 'down' ? (
              <ArrowDownRight className="w-3 h-3 sm:w-4 sm:h-4 text-red-600 flex-shrink-0" />
            ) : null}
            <span className={`text-xs sm:text-sm font-medium truncate ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'}`}>
              {change}
            </span>
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white mb-1 leading-tight break-words">{value}</div>
        <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">{title}</div>
        {subtitle && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-tight">
            {subtitle}
          </div>
        )}
      </div>
    </div>
  );
};

const DevMonitorDashboard: React.FC = () => {
  const [devMetrics, setDevMetrics] = useState<DeveloperMetrics | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [wsConnection, setWsConnection] = useState<WebSocket | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [transactionSignature, setTransactionSignature] = useState('');
  const [debuggerResult, setDebuggerResult] = useState<TransactionDebugger | null>(null);
  const [isDebugging, setIsDebugging] = useState(false);

  // Mock data for demonstration - in real implementation, this would come from WebSocket or API
  const generateMockData = useCallback((): DeveloperMetrics => {
    const now = Date.now();
    return {
      testValidator: {
        isRunning: true,
        slot: 157890123 + Math.floor(Math.random() * 100),
        blockHeight: 157890123 + Math.floor(Math.random() * 100),
        programsLoaded: 12,
        accountsLoaded: 1247,
        memoryUsage: 65 + Math.random() * 15,
        cpuUsage: 25 + Math.random() * 30,
        diskUsage: 45.7,
        transactionThroughput: 2500 + Math.random() * 500,
        avgBlockTime: 400 + Math.random() * 100,
        lastBlockTime: new Date(now - Math.random() * 5000).toISOString(),
        errors: [],
        warnings: ['High memory usage detected'],
        startTime: new Date(now - 3600000).toISOString(),
        uptime: 3600
      },
      anchorProjects: [
        {
          name: 'dex-protocol',
          path: './programs/dex',
          programs: [
            {
              name: 'dex_program',
              programId: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
              idlPath: './target/idl/dex_program.json',
              binaryPath: './target/deploy/dex_program.so',
              lastModified: new Date(now - Math.random() * 86400000).toISOString(),
              size: 245760,
              deployed: true,
              network: 'localnet'
            }
          ],
          lastBuild: new Date(now - Math.random() * 3600000).toISOString(),
          buildStatus: 'success',
          testResults: [
            {
              testFile: 'tests/dex_test.ts',
              passed: 15,
              failed: 0,
              skipped: 2,
              duration: 4.2,
              lastRun: new Date(now - Math.random() * 1800000).toISOString(),
              status: 'passed',
              failures: []
            }
          ],
          deployments: [
            {
              programId: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
              programName: 'dex_program',
              network: 'localnet',
              txSignature: '2ZE7R7TTqgrjbMBeUCBYKUUKsNUCcCx1CnXdVmf4at8jkFsjRKnXKdtVfGKQ4cJY5ufg9CfW6ZTgJa9z2BELojA9',
              timestamp: new Date(now - Math.random() * 7200000).toISOString(),
              status: 'finalized',
              slot: 157890100 + Math.floor(Math.random() * 100),
              codeVersion: 'v1.2.3',
              upgradeAuthority: '8YQE7xwHhKKRNTwLG6QkGN3CKLRpPJhf5Y6bKyZhQT5o'
            }
          ]
        },
        {
          name: 'nft-marketplace',
          path: './programs/marketplace',
          programs: [
            {
              name: 'marketplace',
              programId: 'HXYrCZ9u2ZyGXfPzqQr5XsGHF9JLLksJjBLbK4M7jXgE',
              idlPath: './target/idl/marketplace.json',
              binaryPath: './target/deploy/marketplace.so',
              lastModified: new Date(now - Math.random() * 86400000).toISOString(),
              size: 189440,
              deployed: false,
              network: 'localnet'
            }
          ],
          lastBuild: new Date(now - Math.random() * 3600000).toISOString(),
          buildStatus: 'building',
          testResults: [],
          deployments: []
        }
      ],
      watchedAccounts: [
        {
          address: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          name: 'DEX Program',
          type: 'program',
          balance: 0,
          lamports: 2039280,
          owner: 'BPFLoaderUpgradeab1e11111111111111111111111',
          executable: true,
          dataSize: 245760,
          lastUpdated: new Date(now - Math.random() * 300000).toISOString(),
          changes: []
        },
        {
          address: 'HXYrCZ9u2ZyGXfPzqQr5XsGHF9JLLksJjBLbK4M7jXgE',
          name: 'User Wallet',
          type: 'user',
          balance: 10.5,
          lamports: 10500000000,
          owner: '11111111111111111111111111111111',
          executable: false,
          dataSize: 0,
          lastUpdated: new Date(now - Math.random() * 60000).toISOString(),
          changes: [
            {
              field: 'balance',
              oldValue: 10.0,
              newValue: 10.5,
              timestamp: new Date(now - Math.random() * 30000).toISOString(),
              slot: 157890120,
              txSignature: '2ZE7R7TTqgrjbMBeUCBYKUUKsNUCcCx1CnXdVmf4at8jkFsjRKnXKdtVfGKQ4cJY5ufg9CfW6ZTgJa9z2BELojA9'
            }
          ]
        }
      ],
      recentTransactions: [
        {
          signature: '2ZE7R7TTqgrjbMBeUCBYKUUKsNUCcCx1CnXdVmf4at8jkFsjRKnXKdtVfGKQ4cJY5ufg9CfW6ZTgJa9z2BELojA9',
          slot: 157890120,
          timestamp: new Date(now - Math.random() * 300000).toISOString(),
          status: 'confirmed',
          fee: 5000,
          programInstructions: [
            {
              programId: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
              programName: 'dex_program',
              instruction: 'swap',
              accounts: ['HXYrCZ9u2ZyGXfPzqQr5XsGHF9JLLksJjBLbK4M7jXgE'],
              data: 'AQNZBw=='
            }
          ],
          accounts: ['HXYrCZ9u2ZyGXfPzqQr5XsGHF9JLLksJjBLbK4M7jXgE'],
          logs: [
            'Program 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM invoke [1]',
            'Program log: Instruction: Swap',
            'Program 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM consumed 32547 compute units',
            'Program 9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM success'
          ],
          computeUnitsUsed: 32547
        }
      ],
      rpcMetrics: {
        endpoint: 'http://localhost:8899',
        latency: 5 + Math.random() * 15,
        requestCount: 12547,
        errorCount: 23,
        successRate: 99.8
      },
      systemMetrics: {
        cpuUsage: 25 + Math.random() * 30,
        memoryUsage: 65 + Math.random() * 15,
        diskUsage: 45.7,
        networkIO: {
          in: 125 + Math.random() * 50,
          out: 89 + Math.random() * 30
        }
      },
      alerts: [
        {
          id: '1',
          type: 'validator',
          severity: 'warning',
          title: 'High Memory Usage',
          message: 'Test validator memory usage is above 80%',
          timestamp: new Date(now - Math.random() * 300000).toISOString(),
          resolved: false,
          source: 'solana-test-validator'
        }
      ]
    };
  }, []);

  // Connect to development monitoring WebSocket
  const connectDevWebSocket = useCallback(() => {
    try {
      const ws = new WebSocket('ws://localhost:3006'); // Development monitoring WebSocket

      ws.onopen = () => {
        console.log('Connected to development monitoring WebSocket');
        setConnectionStatus('connected');
        setWsConnection(ws);
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        setDevMetrics(data);
      };

      ws.onerror = () => {
        console.log('WebSocket error, using mock data');
        setConnectionStatus('disconnected');
        startMockMode();
      };

      ws.onclose = () => {
        console.log('WebSocket closed');
        setConnectionStatus('disconnected');
        setWsConnection(null);
      };
    } catch (error) {
      console.log('WebSocket connection failed, using mock data');
      setConnectionStatus('disconnected');
      startMockMode();
    }
  }, []);

  // Start mock mode for demonstration
  const startMockMode = useCallback(() => {
    setDevMetrics(generateMockData());

    if (autoRefresh) {
      const interval = setInterval(() => {
        setDevMetrics(generateMockData());

        // Update historical data
        setHistoricalData(prev => {
          const newPoint = {
            timestamp: Date.now(),
            time: new Date().toLocaleTimeString(),
            slot: 157890123 + Math.floor(Math.random() * 100),
            tps: 2500 + Math.random() * 500,
            memory: 65 + Math.random() * 15,
            cpu: 25 + Math.random() * 30,
            latency: 5 + Math.random() * 15
          };

          return [...prev.slice(-49), newPoint];
        });
      }, 2000);

      return () => clearInterval(interval);
    }
  }, [generateMockData, autoRefresh]);

  // Control test validator
  const controlValidator = useCallback(async (action: 'start' | 'stop' | 'restart') => {
    try {
      const response = await fetch('http://localhost:3006/api/validator/control', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action })
      });

      if (!response.ok) {
        console.log(`Validator ${action} command sent (mock mode)`);
      }
    } catch (error) {
      console.log(`Validator ${action} command sent (mock mode)`);
    }
  }, []);

  // Build Anchor project
  const buildProject = useCallback(async (projectName: string) => {
    try {
      const response = await fetch('http://localhost:3006/api/anchor/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: projectName })
      });

      if (!response.ok) {
        console.log(`Building project ${projectName} (mock mode)`);
      }
    } catch (error) {
      console.log(`Building project ${projectName} (mock mode)`);
    }
  }, []);

  // Deploy program
  const deployProgram = useCallback(async (projectName: string, network: string) => {
    try {
      const response = await fetch('http://localhost:3006/api/anchor/deploy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ project: projectName, network })
      });

      if (!response.ok) {
        console.log(`Deploying ${projectName} to ${network} (mock mode)`);
      }
    } catch (error) {
      console.log(`Deploying ${projectName} to ${network} (mock mode)`);
    }
  }, []);

  // Analyze transaction for debugging
  const analyzeTransaction = useCallback(async (signature: string) => {
    if (!signature.trim()) return;
    
    setIsDebugging(true);
    setDebuggerResult(null);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock transaction analysis results
    const mockResult: TransactionDebugger = {
      signature,
      status: 'success',
      performance: {
        computeUnitsUsed: 187450,
        computeUnitsRequested: 200000,
        fee: 5000,
        slot: 157890125
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
              name: 'User Wallet',
              isSigner: true,
              isWritable: true,
              beforeBalance: 10.5,
              afterBalance: 10.0,
              dataChange: false
            }
          ],
          success: true,
          computeUnits: 15230
        },
        {
          id: '2',
          program: 'DEX Program',
          programId: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          instruction: 'swap',
          depth: 1,
          accounts: [
            {
              pubkey: 'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1',
              name: 'Pool Account',
              isSigner: false,
              isWritable: true,
              beforeBalance: 1000.0,
              afterBalance: 999.5,
              dataChange: true
            }
          ],
          success: true,
          computeUnits: 45800
        },
        {
          id: '3',
          program: 'System Program',
          programId: '11111111111111111111111111111111',
          instruction: 'CreateAccount',
          depth: 2,
          accounts: [
            {
              pubkey: 'EKJHMYYQcqBKsJxr1XRSR9h1dJb7Q2KE7Qmc2bPgJZmr',
              name: 'New PDA',
              isSigner: false,
              isWritable: true,
              beforeBalance: 0,
              afterBalance: 2.039280,
              dataChange: true
            }
          ],
          success: false,
          error: 'Account reallocation exceeded maximum allowed size',
          computeUnits: 25420
        }
      ],
      errors: [
        {
          type: 'realloc_constraint',
          severity: 'critical',
          instruction: 2,
          programId: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          message: 'Account reallocation constraint violation: Attempted to reallocate account beyond maximum size limit (10KB → 15KB)',
          suggestedFix: 'Reduce account data size or split data across multiple accounts using PDA derivation patterns',
          codeExample: `// Instead of large single account
#[account(
    realloc = 15_000,
    realloc::payer = user,
    realloc::zero = false
)]

// Use PDA pattern for larger data
#[derive(Accounts)]
pub struct SplitData<'info> {
    #[account(
        init,
        payer = user,
        space = 8 + 8_000, // First chunk
        seeds = [b"data", user.key().as_ref(), &[0]],
        bump
    )]
    pub data_chunk_0: Account<'info, DataChunk>,
}`
        },
        {
          type: 'account_balance_mismatch',
          severity: 'warning',
          instruction: 1,
          programId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
          message: 'Account balance insufficient for transaction. Required: 0.6 SOL, Available: 0.5 SOL',
          suggestedFix: 'Ensure sufficient account balance before transaction or implement balance checking in your program logic',
          codeExample: `// Add balance check in instruction
require!(
    ctx.accounts.user_wallet.lamports() >= required_amount,
    ErrorCode::InsufficientBalance
);`
        }
      ]
    };

    setDebuggerResult(mockResult);
    setIsDebugging(false);
  }, []);

  // Generate initial historical data
  useEffect(() => {
    const data = [];
    const now = Date.now();

    for (let i = 20; i >= 0; i--) {
      const timestamp = now - (i * 10000);
      const date = new Date(timestamp);
      // Use shorter time format for mobile compatibility
      const timeString = date.toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit',
        hour12: false 
      });
      data.push({
        timestamp,
        time: timeString,
        slot: 157890100 + i,
        tps: 2500 + Math.random() * 500,
        memory: 60 + Math.random() * 20,
        cpu: 20 + Math.random() * 40,
        latency: 5 + Math.random() * 15
      });
    }

    setHistoricalData(data);
  }, []);

  // Detect mobile screen size
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Initialize
  useEffect(() => {
    connectDevWebSocket();

    return () => {
      if (wsConnection) {
        wsConnection.close();
      }
    };
  }, [connectDevWebSocket]);

  if (!devMetrics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Terminal className="w-12 h-12 text-blue-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Solana Development Monitor</h2>
          <p className="text-gray-600 mb-4">Initializing development monitoring dashboard...</p>
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 p-3 sm:p-4 lg:p-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg mb-4 sm:mb-6">
        <div className="p-4 sm:px-6 sm:py-4">
          <div className="space-y-4 lg:space-y-0 lg:flex lg:items-center lg:justify-between">
            {/* Title and Status */}
            <div className="min-w-0 flex-1">
              <div className="flex items-center space-x-2 sm:space-x-3">
                <Terminal className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600 flex-shrink-0" />
                <div className="min-w-0 flex-1">
                  <h1 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white truncate">
                    Solana Development Monitor
                  </h1>
                  <div className="flex items-center space-x-2 mt-1">
                    <p className="text-sm text-gray-600 dark:text-gray-300 hidden sm:inline">
                      Real-time monitoring for Solana development workflows
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-300 sm:hidden">
                      Dev monitoring
                    </p>
                    <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium whitespace-nowrap ${
                      connectionStatus === 'connected' 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    }`}>
                      {connectionStatus === 'connected' ? '🔴 Live' : '📊 Demo'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="flex flex-col space-y-3 sm:space-y-0 sm:flex-row sm:items-center sm:space-x-3">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => controlValidator('restart')}
                  className="flex-1 sm:flex-none px-3 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2 min-w-0"
                >
                  <RefreshCw className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden xs:inline">Restart Validator</span>
                  <span className="xs:hidden">Restart</span>
                </button>

                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`flex-1 sm:flex-none px-3 py-2 rounded-md text-sm font-medium transition-colors flex items-center justify-center space-x-2 min-w-0 ${
                    autoRefresh 
                      ? 'bg-green-600 text-white hover:bg-green-700' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-600 dark:text-gray-200 dark:hover:bg-gray-500'
                  }`}
                >
                  <Activity className="w-4 h-4 flex-shrink-0" />
                  <span className="hidden xs:inline">Auto Refresh</span>
                  <span className="xs:hidden">Auto</span>
                </button>
              </div>

              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 text-center sm:text-left whitespace-nowrap">
                Last update: {new Date().toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit',
                  ...(isMobile ? {} : { second: '2-digit' })
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* System Overview */}
        <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          <MetricCard
            title="Test Validator"
            value={devMetrics.testValidator.isRunning ? 'Running' : 'Stopped'}
            icon={Zap}
            status={devMetrics.testValidator.isRunning ? 'healthy' : 'down'}
            change={`Slot ${devMetrics.testValidator.slot.toLocaleString()}`}
            subtitle={`${Math.round(devMetrics.testValidator.uptime / 60)}m uptime`}
          />

          <MetricCard
            title="Transaction Throughput"
            value={`${Math.round(devMetrics.testValidator.transactionThroughput)} TPS`}
            icon={Activity}
            status={devMetrics.testValidator.transactionThroughput > 2000 ? 'healthy' : 'degraded'}
            change={`${devMetrics.testValidator.avgBlockTime.toFixed(0)}ms avg block`}
            trend="up"
          />

          <MetricCard
            title="RPC Latency"
            value={`${devMetrics.rpcMetrics.latency.toFixed(1)}ms`}
            icon={Clock}
            status={devMetrics.rpcMetrics.latency < 20 ? 'healthy' : devMetrics.rpcMetrics.latency < 50 ? 'degraded' : 'down'}
            change={`${devMetrics.rpcMetrics.successRate.toFixed(1)}% success`}
            trend="down"
          />

          <MetricCard
            title="Active Projects"
            value={devMetrics.anchorProjects.length}
            icon={Package}
            status="neutral"
            change={`${devMetrics.anchorProjects.filter(p => p.buildStatus === 'success').length} built`}
            subtitle={`${devMetrics.anchorProjects.reduce((acc, p) => acc + p.programs.length, 0)} programs total`}
          />
        </div>

        {/* Test Validator Status */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border dark:border-gray-700">
          <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-semibold flex items-center text-gray-900 dark:text-white">
              <Monitor className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-blue-600 flex-shrink-0" />
              <span className="truncate">Test Validator Status</span>
            </h2>

            <div className="flex items-center space-x-2 sm:space-x-3">
              <button
                onClick={() => controlValidator('start')}
                disabled={devMetrics.testValidator.isRunning}
                className="flex-1 sm:flex-none px-3 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
              >
                <Play className="w-4 h-4 flex-shrink-0" />
                <span>Start</span>
              </button>

              <button
                onClick={() => controlValidator('stop')}
                disabled={!devMetrics.testValidator.isRunning}
                className="flex-1 sm:flex-none px-3 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2"
              >
                <Square className="w-4 h-4 flex-shrink-0" />
                <span>Stop</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg border dark:border-gray-600">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Block Height</div>
              <div className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white truncate">{devMetrics.testValidator.blockHeight.toLocaleString()}</div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg border dark:border-gray-600">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Programs</div>
              <div className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">{devMetrics.testValidator.programsLoaded}</div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg border dark:border-gray-600">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Accounts</div>
              <div className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white truncate">{devMetrics.testValidator.accountsLoaded.toLocaleString()}</div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg border dark:border-gray-600">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">CPU Usage</div>
              <div className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">{devMetrics.testValidator.cpuUsage.toFixed(1)}%</div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg border dark:border-gray-600">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Memory</div>
              <div className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">{devMetrics.testValidator.memoryUsage.toFixed(1)}%</div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg border dark:border-gray-600">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Disk Usage</div>
              <div className="text-sm sm:text-lg font-semibold text-gray-900 dark:text-white">{devMetrics.testValidator.diskUsage.toFixed(1)} GB</div>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="h-48 sm:h-64 lg:h-72">
            <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4 text-gray-900 dark:text-white">Performance Metrics</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart 
                data={historicalData} 
                margin={{ 
                  top: 5, 
                  right: 5, 
                  left: 5, 
                  bottom: isMobile ? 35 : 25 
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="time" 
                  angle={isMobile ? -90 : -45}
                  textAnchor="end"
                  height={isMobile ? 50 : 60}
                  interval={isMobile ? 'preserveStartEnd' : 0}
                  fontSize={isMobile ? 8 : 10}
                  tick={{ fontSize: isMobile ? 8 : 10 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  fontSize={isMobile ? 8 : 10}
                  tick={{ fontSize: isMobile ? 8 : 10 }}
                  stroke="#6b7280"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: isMobile ? '12px' : '14px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="tps" 
                  stroke="#3b82f6" 
                  strokeWidth={isMobile ? 1.5 : 2} 
                  dot={false} 
                  name="TPS" 
                />
                <Line 
                  type="monotone" 
                  dataKey="latency" 
                  stroke="#10b981" 
                  strokeWidth={isMobile ? 1.5 : 2} 
                  dot={false} 
                  name="Latency (ms)" 
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Warnings and Errors */}
          {(devMetrics.testValidator.warnings.length > 0 || devMetrics.testValidator.errors.length > 0) && (
            <div className="mt-6 space-y-2">
              {devMetrics.testValidator.errors.map((error, idx) => (
                <div key={idx} className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <XCircle className="w-4 h-4 text-red-600" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              ))}
              {devMetrics.testValidator.warnings.map((warning, idx) => (
                <div key={idx} className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-yellow-600" />
                  <span className="text-sm text-yellow-800">{warning}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Anchor Projects */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center text-gray-900 dark:text-white">
            <Anchor className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-orange-600 flex-shrink-0" />
            <span className="truncate">Anchor Projects</span>
          </h2>

          <div className="space-y-4 sm:space-y-6">
            {devMetrics.anchorProjects.map((project) => (
              <div key={project.name} className="bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4">
                <div className="space-y-3 sm:space-y-0 sm:flex sm:items-start sm:justify-between sm:gap-4 mb-4">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <Folder className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-base sm:text-lg text-gray-900 dark:text-white truncate">{project.name}</h3>
                      <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 truncate">{project.path}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 sm:gap-3">
                    <StatusBadge status={project.buildStatus} />
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => buildProject(project.name)}
                        className="px-2 sm:px-3 py-1.5 bg-blue-600 text-white rounded-md text-xs sm:text-sm font-medium hover:bg-blue-700 transition-colors"
                      >
                        Build
                      </button>
                      <button
                        onClick={() => deployProgram(project.name, 'localnet')}
                        className="px-2 sm:px-3 py-1.5 bg-green-600 text-white rounded-md text-xs sm:text-sm font-medium hover:bg-green-700 transition-colors"
                      >
                        Deploy
                      </button>
                    </div>
                  </div>
                </div>

                {/* Programs and Test Results */}
                <div className="space-y-4 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4 mb-4">
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">Programs ({project.programs.length})</h4>
                    <div className="space-y-2 sm:space-y-3">
                      {project.programs.map((program) => (
                        <div key={program.name} className="bg-white dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-600 overflow-hidden">
                          <div className="space-y-2 sm:space-y-0 sm:flex sm:items-start sm:gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">{program.name}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 font-mono truncate break-all">{program.programId}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{(program.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right flex-shrink-0">
                              <StatusBadge status={program.deployed ? 'deployed' : 'not deployed'} />
                              <p className="text-xs text-gray-500 dark:text-gray-400 sm:mt-1">{program.network}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">Test Results</h4>
                    <div className="space-y-2 sm:space-y-3">
                      {project.testResults.length > 0 ? project.testResults.map((test) => (
                        <div key={test.testFile} className="bg-white dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-600">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{test.testFile.replace('tests/', '')}</p>
                            <StatusBadge status={test.status} />
                          </div>
                          <div className="text-xs text-gray-600 dark:text-gray-400 space-x-2">
                            <span className="text-green-600 dark:text-green-400">{test.passed} passed</span>
                            <span className="text-red-600 dark:text-red-400">{test.failed} failed</span>
                            <span className="text-gray-500 dark:text-gray-400">{test.skipped} skipped</span>
                          </div>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{test.duration}s runtime</p>
                        </div>
                      )) : (
                        <div className="bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg border dark:border-gray-600 text-center">
                          <TestTube className="w-6 h-6 sm:w-8 sm:h-8 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
                          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">No tests run yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Deployments */}
                {project.deployments.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">Recent Deployments</h4>
                    <div className="space-y-2 sm:space-y-3">
                      {project.deployments.slice(0, 3).map((deployment) => (
                        <div key={deployment.txSignature} className="bg-white dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-600 overflow-hidden">
                          <div className="space-y-2 sm:space-y-0 sm:flex sm:items-start sm:gap-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 dark:text-white truncate">{deployment.programName}</p>
                              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{deployment.network} • Slot {deployment.slot.toLocaleString()}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate break-all">{deployment.txSignature}</p>
                            </div>
                            <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right flex-shrink-0">
                              <StatusBadge status={deployment.status} />
                              <p className="text-xs text-gray-500 dark:text-gray-400 sm:mt-1">{deployment.codeVersion}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Transaction Debugger */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 flex items-center text-gray-900 dark:text-white">
            <Search className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-600 flex-shrink-0" />
            <span className="truncate">Transaction Debugger</span>
            <span className="ml-2 text-xs bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">
              CPI Error Analysis
            </span>
          </h2>

          <div className="mb-6">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Debug complex CPI transactions and identify account balance mismatches, realloc constraints, and other Anchor program errors.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
                <input
                  type="text"
                  value={transactionSignature}
                  onChange={(e) => setTransactionSignature(e.target.value)}
                  placeholder="Enter transaction signature (e.g., 2ZE7R7TTqgrjbMBeUCBYKUUKsNUCcCx1...)"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                />
              </div>
              <button
                onClick={() => analyzeTransaction(transactionSignature)}
                disabled={isDebugging || !transactionSignature.trim()}
                className="px-4 py-2 bg-purple-600 text-white rounded-md text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center space-x-2 sm:min-w-[120px]"
              >
                {isDebugging ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
                    <span>Analyzing...</span>
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4 flex-shrink-0" />
                    <span>Debug Tx</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {debuggerResult && (
            <div className="space-y-6">
              {/* Transaction Overview */}
              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <div className="flex items-center space-x-3">
                    <StatusBadge status={debuggerResult.status} />
                    <span className="text-sm font-medium text-gray-900 dark:text-white">
                      Transaction Analysis Complete
                    </span>
                  </div>
                  <button className="flex items-center space-x-2 text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300">
                    <Copy className="w-4 h-4" />
                    <span>Copy Signature</span>
                  </button>
                </div>
                
                {debuggerResult.performance && (
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-600">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Compute Units Used</div>
                      <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                        {debuggerResult.performance.computeUnitsUsed.toLocaleString()}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        of {debuggerResult.performance.computeUnitsRequested.toLocaleString()} requested
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-600">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Transaction Fee</div>
                      <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                        {(debuggerResult.performance.fee / 1000000).toFixed(6)} SOL
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {debuggerResult.performance.fee.toLocaleString()} lamports
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-600">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Slot</div>
                      <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                        {debuggerResult.performance.slot.toLocaleString()}
                      </div>
                    </div>
                    
                    <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border dark:border-gray-600">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">CPI Depth</div>
                      <div className="text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
                        {Math.max(...(debuggerResult.cpiFlow?.map(step => step.depth + 1) || [0]))} levels
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* CPI Flow Visualization */}
              {debuggerResult.cpiFlow && (
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <GitBranch className="w-5 h-5 mr-2 text-indigo-600 flex-shrink-0" />
                      Cross-Program Invocation Flow
                    </h3>
                    <span className="text-xs bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-200 px-2 py-1 rounded">
                      {debuggerResult.cpiFlow.length} instructions
                    </span>
                  </div>

                  <div className="space-y-3">
                    {debuggerResult.cpiFlow.map((step, index) => (
                      <div key={step.id} className="relative">
                        {/* Connection line */}
                        {index > 0 && (
                          <div
                            className="absolute left-6 -top-3 w-0.5 h-6 bg-gray-300 dark:bg-gray-600"
                            style={{ marginLeft: `${step.depth * 20}px` }}
                          ></div>
                        )}
                        
                        <div
                          className={`bg-white dark:bg-gray-800 p-3 sm:p-4 rounded-lg border ${
                            step.success 
                              ? 'border-green-200 dark:border-green-800' 
                              : 'border-red-200 dark:border-red-800'
                          }`}
                          style={{ marginLeft: `${step.depth * 20}px` }}
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                                step.success ? 'bg-green-500' : 'bg-red-500'
                              }`}></div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center space-x-2 flex-wrap gap-1">
                                  <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">
                                    {step.program}
                                  </span>
                                  <ChevronRight className="w-3 h-3 text-gray-400" />
                                  <span className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                                    {step.instruction}
                                  </span>
                                </div>
                                <p className="text-xs text-gray-600 dark:text-gray-400 font-mono truncate">
                                  {step.programId}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3 flex-shrink-0">
                              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                {step.computeUnits.toLocaleString()} CU
                              </span>
                              {!step.success && step.error && (
                                <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                                  Error
                                </span>
                              )}
                            </div>
                          </div>

                          {step.error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-lg mb-3">
                              <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-1">Error Details</p>
                              <p className="text-xs text-red-700 dark:text-red-300">{step.error}</p>
                            </div>
                          )}

                          {/* Account changes */}
                          {step.accounts.length > 0 && (
                            <div className="space-y-2">
                              <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wide">
                                Account Changes ({step.accounts.length})
                              </h4>
                              <div className="space-y-2">
                                {step.accounts.slice(0, 3).map((account, accIndex) => (
                                  <div key={accIndex} className="bg-gray-50 dark:bg-gray-700 p-2 rounded border dark:border-gray-600">
                                    <div className="flex items-start justify-between">
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center space-x-2 mb-1">
                                          <span className="text-xs font-medium text-gray-900 dark:text-white">
                                            {account.name || 'Unknown Account'}
                                          </span>
                                          <div className="flex items-center space-x-1">
                                            {account.isSigner && (
                                              <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded">
                                                Signer
                                              </span>
                                            )}
                                            {account.isWritable && (
                                              <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-1.5 py-0.5 rounded">
                                                Writable
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 font-mono truncate">
                                          {account.pubkey}
                                        </p>
                                      </div>
                                      
                                      {(account.beforeBalance !== undefined && account.afterBalance !== undefined) && (
                                        <div className="text-right ml-2 flex-shrink-0">
                                          <div className="text-xs text-gray-600 dark:text-gray-400">
                                            {account.beforeBalance} → {account.afterBalance} SOL
                                          </div>
                                          {account.beforeBalance !== account.afterBalance && (
                                            <div className={`text-xs font-medium ${
                                              account.afterBalance > account.beforeBalance 
                                                ? 'text-green-600 dark:text-green-400' 
                                                : 'text-red-600 dark:text-red-400'
                                            }`}>
                                              {account.afterBalance > account.beforeBalance ? '+' : ''}
                                              {(account.afterBalance - account.beforeBalance).toFixed(6)}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                ))}
                                {step.accounts.length > 3 && (
                                  <div className="text-xs text-gray-500 dark:text-gray-400 text-center py-1">
                                    +{step.accounts.length - 3} more accounts
                                  </div>
                                )}
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
                <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border dark:border-gray-600">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white flex items-center">
                      <Wrench className="w-5 h-5 mr-2 text-red-600 flex-shrink-0" />
                      Error Analysis & Fixes
                    </h3>
                    <span className="text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                      {debuggerResult.errors.filter(e => e.severity === 'critical').length} critical
                    </span>
                  </div>

                  <div className="space-y-4">
                    {debuggerResult.errors.map((error, index) => (
                      <div key={index} className={`bg-white dark:bg-gray-800 p-4 rounded-lg border ${
                        error.severity === 'critical' 
                          ? 'border-red-200 dark:border-red-800' 
                          : 'border-yellow-200 dark:border-yellow-800'
                      }`}>
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-3">
                          <div className="flex items-center space-x-3 min-w-0 flex-1">
                            <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                              error.severity === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                            }`}></div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2 flex-wrap gap-1 mb-1">
                                <span className="font-medium text-sm text-gray-900 dark:text-white">
                                  {error.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </span>
                                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded">
                                  Instruction #{error.instruction}
                                </span>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-400 font-mono truncate">
                                {error.programId}
                              </p>
                            </div>
                          </div>
                          
                          <button className="flex items-center space-x-2 text-xs text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex-shrink-0">
                            <ExternalLink className="w-3 h-3" />
                            <span>View in Explorer</span>
                          </button>
                        </div>

                        <div className="space-y-3">
                          <div className={`p-3 rounded-lg ${
                            error.severity === 'critical' 
                              ? 'bg-red-50 dark:bg-red-900/20' 
                              : 'bg-yellow-50 dark:bg-yellow-900/20'
                          }`}>
                            <p className="text-sm text-gray-900 dark:text-white font-medium mb-1">Error Details</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{error.message}</p>
                          </div>

                          <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                            <p className="text-sm text-gray-900 dark:text-white font-medium mb-1 flex items-center">
                              <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" />
                              Suggested Fix
                            </p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 mb-3">{error.suggestedFix}</p>
                            
                            {error.codeExample && (
                              <div className="bg-gray-900 dark:bg-gray-800 p-3 rounded-lg overflow-x-auto">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-xs text-gray-400">Code Example</span>
                                  <button className="text-xs text-gray-400 hover:text-gray-300 flex items-center space-x-1">
                                    <Copy className="w-3 h-3" />
                                    <span>Copy</span>
                                  </button>
                                </div>
                                <pre className="text-xs text-gray-100 whitespace-pre-wrap">
                                  <code>{error.codeExample}</code>
                                </pre>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Quick Actions */}
          <div className="mt-6 p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
            <h3 className="text-sm font-semibold text-purple-900 dark:text-purple-100 mb-2 flex items-center">
              <Eye className="w-4 h-4 mr-2" />
              Common Debug Scenarios
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
              <button 
                onClick={() => setTransactionSignature('2ZE7R7TTqgrjbMBeUCBYKUUKsNUCcCx1CnXdVmf4at8jkFsjRKnXKdtVfGKQ4cJY5ufg9CfW6ZTgJa9z2BELojA9')}
                className="text-left p-2 bg-white dark:bg-purple-900/30 rounded border border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/40 transition-colors"
              >
                <div className="font-medium text-purple-900 dark:text-purple-100">Realloc Error</div>
                <div className="text-purple-700 dark:text-purple-300">Account size constraint violation</div>
              </button>
              
              <button 
                onClick={() => setTransactionSignature('4XyZ9aVsWw2gNpJhRzKJDdTgYhP4mF3J8Q7vRbNuLtE2wSdHjKnMcPqBvF6AzLrT8wGxPy4mJ9nKqWcVbNfDhPaE')}
                className="text-left p-2 bg-white dark:bg-purple-900/30 rounded border border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/40 transition-colors"
              >
                <div className="font-medium text-purple-900 dark:text-purple-100">Balance Mismatch</div>
                <div className="text-purple-700 dark:text-purple-300">Insufficient account balance</div>
              </button>
              
              <button 
                onClick={() => setTransactionSignature('8PnMjRgF4wTcHs3VkJdYqPbGfLx2QjE7wZyCpRvNmKsL9AhBjDnTxGwVcPqFyMrE6bNjKdHqXwScVaLpJhRtMzF4')}
                className="text-left p-2 bg-white dark:bg-purple-900/30 rounded border border-purple-200 dark:border-purple-700 hover:bg-purple-50 dark:hover:bg-purple-900/40 transition-colors"
              >
                <div className="font-medium text-purple-900 dark:text-purple-100">CPI Overflow</div>
                <div className="text-purple-700 dark:text-purple-300">Too many cross-program calls</div>
              </button>
            </div>
          </div>
        </div>

        {/* Watched Accounts & Recent Transactions */}
        <div className="space-y-4 sm:space-y-6 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-6 overflow-hidden">
          {/* Watched Accounts */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border dark:border-gray-700 overflow-hidden">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
              <Wallet className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-purple-600 flex-shrink-0" />
              <span className="truncate">Watched Accounts</span>
            </h2>

            <div className="space-y-3 sm:space-y-4">
              {devMetrics.watchedAccounts.map((account) => (
                <div
                  key={account.address}
                  className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 cursor-pointer overflow-hidden transition-colors"
                  onClick={() => setSelectedAccount(account.address)}
                >
                  <div className="space-y-2 sm:space-y-0 sm:flex sm:items-start sm:gap-3 mb-2">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                        account.type === 'program' ? 'bg-blue-500' :
                        account.type === 'user' ? 'bg-green-500' :
                        account.type === 'token' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}></div>
                      <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-white truncate">{account.name}</span>
                      <span className="text-xs bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded capitalize flex-shrink-0">{account.type}</span>
                    </div>
                    <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right flex-shrink-0">
                      <p className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">{account.balance} SOL</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{account.lamports.toLocaleString()} lamports</p>
                    </div>
                  </div>

                  <div className="w-full overflow-hidden">
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-mono truncate">{account.address}</p>
                  </div>

                  {account.changes.length > 0 && (
                    <div className="mt-2 text-xs">
                      <span className="text-green-600 dark:text-green-400">
                        {account.changes.length} recent change{account.changes.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border dark:border-gray-700 overflow-hidden">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
              <Hash className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-indigo-600 flex-shrink-0" />
              <span className="truncate">Recent Transactions</span>
            </h2>

            <div className="space-y-3 sm:space-y-4">
              {devMetrics.recentTransactions.map((tx) => (
                <div key={tx.signature} className="border border-gray-200 dark:border-gray-600 rounded-lg p-3 sm:p-4 bg-gray-50 dark:bg-gray-700 overflow-hidden">
                  <div className="space-y-2 sm:space-y-0 sm:flex sm:items-start sm:gap-3 mb-2">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <StatusBadge status={tx.status} />
                      <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">Slot {tx.slot.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center justify-between sm:flex-col sm:items-end sm:text-right flex-shrink-0">
                      <p className="text-xs sm:text-sm font-medium text-gray-900 dark:text-white">{(tx.fee / 1000000).toFixed(6)} SOL fee</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{tx.computeUnitsUsed.toLocaleString()} CU</p>
                    </div>
                  </div>

                  <div className="w-full overflow-hidden mb-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400 font-mono truncate">{tx.signature}</p>
                  </div>

                  <div className="space-y-2">
                    {tx.programInstructions.map((instruction, idx) => (
                      <div key={idx} className="text-xs bg-white dark:bg-gray-800 p-2 rounded border dark:border-gray-600">
                        <span className="font-medium text-gray-900 dark:text-white">{instruction.programName || 'Unknown Program'}</span>
                        <span className="text-gray-600 dark:text-gray-400 ml-2">{instruction.instruction}</span>
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {new Date(tx.timestamp).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      ...(!isMobile ? { year: 'numeric', second: '2-digit' } : {})
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Metrics Chart */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border dark:border-gray-700">
          <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
            <Cpu className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-green-600 flex-shrink-0" />
            <span className="truncate">System Performance</span>
          </h2>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
            <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg border dark:border-gray-600">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">CPU Usage</div>
              <div className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">{devMetrics.systemMetrics.cpuUsage.toFixed(1)}%</div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg border dark:border-gray-600">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Memory Usage</div>
              <div className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">{devMetrics.systemMetrics.memoryUsage.toFixed(1)}%</div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg border dark:border-gray-600">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Network In</div>
              <div className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">{devMetrics.systemMetrics.networkIO.in.toFixed(0)} <span className="text-sm">MB/s</span></div>
            </div>

            <div className="bg-gray-50 dark:bg-gray-700 p-3 sm:p-4 rounded-lg border dark:border-gray-600">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-1">Network Out</div>
              <div className="text-lg sm:text-xl lg:text-2xl font-semibold text-gray-900 dark:text-white">{devMetrics.systemMetrics.networkIO.out.toFixed(0)} <span className="text-sm">MB/s</span></div>
            </div>
          </div>

          <div className="h-48 sm:h-64 lg:h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart 
                data={historicalData} 
                margin={{ 
                  top: 5, 
                  right: 5, 
                  left: 5, 
                  bottom: isMobile ? 35 : 25 
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis 
                  dataKey="time" 
                  angle={isMobile ? -90 : -45}
                  textAnchor="end"
                  height={isMobile ? 50 : 60}
                  interval={isMobile ? 'preserveStartEnd' : 0}
                  fontSize={isMobile ? 8 : 10}
                  tick={{ fontSize: isMobile ? 8 : 10 }}
                  stroke="#6b7280"
                />
                <YAxis 
                  domain={[0, 100]} 
                  fontSize={isMobile ? 8 : 10}
                  tick={{ fontSize: isMobile ? 8 : 10 }}
                  stroke="#6b7280"
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '0.5rem',
                    fontSize: isMobile ? '12px' : '14px'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  stackId="1"
                  stroke="#3b82f6"
                  fill="#3b82f6"
                  fillOpacity={0.3}
                  name="CPU %"
                />
                <Area
                  type="monotone"
                  dataKey="memory"
                  stackId="1"
                  stroke="#10b981"
                  fill="#10b981"
                  fillOpacity={0.3}
                  name="Memory %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts */}
        {devMetrics.alerts.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border dark:border-gray-700">
            <h2 className="text-lg sm:text-xl font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
              <Bug className="w-5 h-5 sm:w-6 sm:h-6 mr-2 text-red-600 flex-shrink-0" />
              <span className="truncate">Development Alerts</span>
            </h2>

            <div className="space-y-3 sm:space-y-4">
              {devMetrics.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className={`p-3 sm:p-4 rounded-lg border ${
                    alert.severity === 'critical' 
                      ? 'bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800' :
                    alert.severity === 'warning' 
                      ? 'bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800' :
                    'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
                  }`}
                >
                  <div className="space-y-2 sm:space-y-0 sm:flex sm:items-start sm:justify-between">
                    <div className="flex items-center space-x-2 flex-1 min-w-0">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 ${
                        alert.severity === 'critical' ? 'bg-red-600' :
                        alert.severity === 'warning' ? 'bg-yellow-600' :
                        'bg-blue-600'
                      }`}></div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center space-x-2 flex-wrap gap-1">
                          <span className="font-medium text-sm sm:text-base text-gray-900 dark:text-white">{alert.title}</span>
                          {alert.source && (
                            <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded flex-shrink-0">{alert.source}</span>
                          )}
                        </div>
                        <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 mt-1">{alert.message}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:flex-col sm:items-end sm:space-y-2 flex-shrink-0">
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(alert.timestamp).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                          ...(!isMobile ? { second: '2-digit' } : {})
                        })}
                      </span>
                      {!alert.resolved && (
                        <button
                          className="text-xs bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                          onClick={() => {
                            // Resolve alert logic
                          }}
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DevMonitorDashboard;