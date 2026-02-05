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
  Anchor
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

const StatusBadge = ({ status, type }: { status: string; type?: string }) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': case 'passed': case 'confirmed': case 'finalized': case 'running':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': case 'error':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'building': case 'pending': case 'deploying':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'unknown': case 'skipped':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  const getIcon = () => {
    switch (status) {
      case 'success': case 'passed': case 'confirmed': case 'finalized':
        return <CheckCircle2 className="w-3 h-3" />;
      case 'failed': case 'error':
        return <XCircle className="w-3 h-3" />;
      case 'building': case 'pending': case 'running':
        return <Loader2 className="w-3 h-3 animate-spin" />;
      default:
        return <Activity className="w-3 h-3" />;
    }
  };

  return (
    <div className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(status)}`}>
      {getIcon()}
      <span className="capitalize">{status}</span>
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
      className={`bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700 transition-all duration-200 hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-2">
        <Icon className={`w-5 h-5 ${status === 'down' ? 'text-red-600' : status === 'degraded' ? 'text-yellow-600' : 'text-blue-600'}`} />
        {change && (
          <div className="flex items-center space-x-1">
            {trend === 'up' ? (
              <ArrowUpRight className="w-4 h-4 text-green-600" />
            ) : trend === 'down' ? (
              <ArrowDownRight className="w-4 h-4 text-red-600" />
            ) : null}
            <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500 dark:text-gray-400'}`}>
              {change}
            </span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
      <div className="text-sm text-gray-600 dark:text-gray-400">{title}</div>
      {subtitle && <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">{subtitle}</div>}
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

  // Generate initial historical data
  useEffect(() => {
    const data = [];
    const now = Date.now();
    
    for (let i = 20; i >= 0; i--) {
      const timestamp = now - (i * 10000);
      data.push({
        timestamp,
        time: new Date(timestamp).toLocaleTimeString(),
        slot: 157890100 + i,
        tps: 2500 + Math.random() * 500,
        memory: 60 + Math.random() * 20,
        cpu: 20 + Math.random() * 40,
        latency: 5 + Math.random() * 15
      });
    }
    
    setHistoricalData(data);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 p-4 sm:p-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg mb-6">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                <Terminal className="w-8 h-8 mr-3 text-blue-600" />
                Solana Development Monitor
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1">
                Real-time monitoring for Solana development workflows
                <span className={`ml-3 text-sm px-2 py-1 rounded ${
                  connectionStatus === 'connected' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}>
                  {connectionStatus === 'connected' ? '🔴 Live' : '📊 Demo Mode'}
                </span>
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => controlValidator('restart')}
                  className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center space-x-1"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Restart Validator</span>
                </button>
                
                <button
                  onClick={() => setAutoRefresh(!autoRefresh)}
                  className={`px-3 py-1 rounded text-sm flex items-center space-x-1 ${
                    autoRefresh ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  <Activity className="w-4 h-4" />
                  <span>Auto Refresh</span>
                </button>
              </div>
              
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Last update: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold flex items-center text-gray-900 dark:text-white">
              <Monitor className="w-6 h-6 mr-2 text-blue-600" />
              Test Validator Status
            </h2>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => controlValidator('start')}
                disabled={devMetrics.testValidator.isRunning}
                className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <Play className="w-4 h-4" />
                <span>Start</span>
              </button>
              
              <button
                onClick={() => controlValidator('stop')}
                disabled={!devMetrics.testValidator.isRunning}
                className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-1"
              >
                <Square className="w-4 h-4" />
                <span>Stop</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">Block Height</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{devMetrics.testValidator.blockHeight.toLocaleString()}</div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">Programs Loaded</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{devMetrics.testValidator.programsLoaded}</div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">Accounts</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{devMetrics.testValidator.accountsLoaded.toLocaleString()}</div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">CPU Usage</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{devMetrics.testValidator.cpuUsage.toFixed(1)}%</div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">Memory Usage</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{devMetrics.testValidator.memoryUsage.toFixed(1)}%</div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">Disk Usage</div>
              <div className="text-lg font-semibold text-gray-900 dark:text-white">{devMetrics.testValidator.diskUsage.toFixed(1)} GB</div>
            </div>
          </div>

          {/* Performance Chart */}
          <div className="h-64">
            <h3 className="text-lg font-medium mb-4 text-gray-900 dark:text-white">Performance Metrics</h3>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="tps" stroke="#8884d8" strokeWidth={2} dot={false} name="TPS" />
                <Line type="monotone" dataKey="latency" stroke="#82ca9d" strokeWidth={2} dot={false} name="Latency (ms)" />
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
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-6 flex items-center text-gray-900 dark:text-white">
            <Anchor className="w-6 h-6 mr-2 text-orange-600" />
            Anchor Projects
          </h2>
          
          <div className="space-y-6">
            {devMetrics.anchorProjects.map((project) => (
              <div key={project.name} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <Folder className="w-5 h-5 text-gray-600" />
                    <div>
                      <h3 className="font-semibold text-lg">{project.name}</h3>
                      <p className="text-sm text-gray-600">{project.path}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <StatusBadge status={project.buildStatus} />
                    <button
                      onClick={() => buildProject(project.name)}
                      className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                    >
                      Build
                    </button>
                    <button
                      onClick={() => deployProgram(project.name, 'localnet')}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Deploy
                    </button>
                  </div>
                </div>

                {/* Programs */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
                  <div>
                    <h4 className="font-medium mb-2">Programs ({project.programs.length})</h4>
                    <div className="space-y-2">
                      {project.programs.map((program) => (
                        <div key={program.name} className="bg-gray-50 p-3 rounded">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium">{program.name}</p>
                              <p className="text-xs text-gray-600">{program.programId}</p>
                              <p className="text-xs text-gray-500">{(program.size / 1024).toFixed(1)} KB</p>
                            </div>
                            <div className="text-right">
                              <StatusBadge status={program.deployed ? 'deployed' : 'not deployed'} />
                              <p className="text-xs text-gray-500 mt-1">{program.network}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Test Results</h4>
                    <div className="space-y-2">
                      {project.testResults.length > 0 ? project.testResults.map((test) => (
                        <div key={test.testFile} className="bg-gray-50 p-3 rounded">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-sm">{test.testFile.replace('tests/', '')}</p>
                            <StatusBadge status={test.status} />
                          </div>
                          <div className="text-xs text-gray-600">
                            <span className="text-green-600">{test.passed} passed</span> • 
                            <span className="text-red-600 ml-1">{test.failed} failed</span> • 
                            <span className="text-gray-500 ml-1">{test.skipped} skipped</span>
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{test.duration}s runtime</p>
                        </div>
                      )) : (
                        <div className="bg-gray-50 p-3 rounded text-center">
                          <TestTube className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600">No tests run yet</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Recent Deployments */}
                {project.deployments.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2">Recent Deployments</h4>
                    <div className="space-y-2">
                      {project.deployments.slice(0, 3).map((deployment) => (
                        <div key={deployment.txSignature} className="bg-gray-50 p-3 rounded">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-sm">{deployment.programName}</p>
                              <p className="text-xs text-gray-600">{deployment.network} • Slot {deployment.slot.toLocaleString()}</p>
                              <p className="text-xs text-gray-500 font-mono">{deployment.txSignature.slice(0, 32)}...</p>
                            </div>
                            <div className="text-right">
                              <StatusBadge status={deployment.status} />
                              <p className="text-xs text-gray-500 mt-1">{deployment.codeVersion}</p>
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

        {/* Watched Accounts & Recent Transactions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Watched Accounts */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
              <Wallet className="w-6 h-6 mr-2 text-purple-600" />
              Watched Accounts
            </h2>
            
            <div className="space-y-4">
              {devMetrics.watchedAccounts.map((account) => (
                <div 
                  key={account.address} 
                  className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                  onClick={() => setSelectedAccount(account.address)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        account.type === 'program' ? 'bg-blue-500' :
                        account.type === 'user' ? 'bg-green-500' :
                        account.type === 'token' ? 'bg-yellow-500' : 'bg-gray-500'
                      }`}></div>
                      <span className="font-medium">{account.name}</span>
                      <span className="text-xs bg-gray-100 px-2 py-1 rounded capitalize">{account.type}</span>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{account.balance} SOL</p>
                      <p className="text-xs text-gray-500">{account.lamports.toLocaleString()} lamports</p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600 font-mono">{account.address}</p>
                  
                  {account.changes.length > 0 && (
                    <div className="mt-2 text-xs">
                      <span className="text-green-600">
                        {account.changes.length} recent change{account.changes.length !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
              <Hash className="w-6 h-6 mr-2 text-indigo-600" />
              Recent Transactions
            </h2>
            
            <div className="space-y-4">
              {devMetrics.recentTransactions.map((tx) => (
                <div key={tx.signature} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <StatusBadge status={tx.status} />
                      <span className="text-sm text-gray-600">Slot {tx.slot.toLocaleString()}</span>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{(tx.fee / 1000000).toFixed(6)} SOL fee</p>
                      <p className="text-xs text-gray-500">{tx.computeUnitsUsed.toLocaleString()} CU</p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-600 font-mono mb-2">{tx.signature.slice(0, 32)}...</p>
                  
                  <div className="space-y-1">
                    {tx.programInstructions.map((instruction, idx) => (
                      <div key={idx} className="text-xs bg-gray-50 p-2 rounded">
                        <span className="font-medium">{instruction.programName || 'Unknown Program'}</span>
                        <span className="text-gray-600 ml-2">{instruction.instruction}</span>
                      </div>
                    ))}
                  </div>
                  
                  <p className="text-xs text-gray-500 mt-2">
                    {new Date(tx.timestamp).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* System Metrics Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
            <Cpu className="w-6 h-6 mr-2 text-green-600" />
            System Performance
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">CPU Usage</div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">{devMetrics.systemMetrics.cpuUsage.toFixed(1)}%</div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">Memory Usage</div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">{devMetrics.systemMetrics.memoryUsage.toFixed(1)}%</div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">Network In</div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">{devMetrics.systemMetrics.networkIO.in.toFixed(0)} MB/s</div>
            </div>
            
            <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
              <div className="text-sm text-gray-600 dark:text-gray-400">Network Out</div>
              <div className="text-2xl font-semibold text-gray-900 dark:text-white">{devMetrics.systemMetrics.networkIO.out.toFixed(0)} MB/s</div>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historicalData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Area
                  type="monotone"
                  dataKey="cpu"
                  stackId="1"
                  stroke="#8884d8"
                  fill="#8884d8"
                  fillOpacity={0.3}
                  name="CPU %"
                />
                <Area
                  type="monotone"
                  dataKey="memory"
                  stackId="1"
                  stroke="#82ca9d"
                  fill="#82ca9d"
                  fillOpacity={0.3}
                  name="Memory %"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Alerts */}
        {devMetrics.alerts.length > 0 && (
          <div className="bg-white dark:bg-gray-800 p-6 rounded-lg border dark:border-gray-700">
            <h2 className="text-xl font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
              <Bug className="w-6 h-6 mr-2 text-red-600" />
              Development Alerts
            </h2>
            
            <div className="space-y-3">
              {devMetrics.alerts.map((alert) => (
                <div 
                  key={alert.id}
                  className={`p-4 rounded-lg border ${
                    alert.severity === 'critical' ? 'bg-red-50 border-red-200' :
                    alert.severity === 'warning' ? 'bg-yellow-50 border-yellow-200' :
                    'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className={`w-2 h-2 rounded-full ${
                        alert.severity === 'critical' ? 'bg-red-600' :
                        alert.severity === 'warning' ? 'bg-yellow-600' :
                        'bg-blue-600'
                      }`}></div>
                      <span className="font-medium">{alert.title}</span>
                      {alert.source && (
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">{alert.source}</span>
                      )}
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">
                        {new Date(alert.timestamp).toLocaleTimeString()}
                      </span>
                      {!alert.resolved && (
                        <button
                          className="text-xs bg-white px-2 py-1 rounded hover:bg-gray-50"
                          onClick={() => {
                            // Resolve alert logic
                          }}
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mt-1">{alert.message}</p>
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