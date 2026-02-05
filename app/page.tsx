'use client'

import { useState, useEffect } from 'react'
import { Activity, CheckCircle2, Clock, Zap, CheckCircle, XCircle, Clock3, AlertCircle } from 'lucide-react'

interface TestResult {
  id: string
  name: string
  protocol: string
  status: 'passed' | 'failed' | 'running' | 'pending'
  timestamp: string
  duration: number
  latency?: number
}

interface Protocol {
  name: string
  status: 'healthy' | 'degraded' | 'down' | 'unknown'
  lastCheck: string
  latency: number
  successRate: number
}

interface Deployment {
  id: string
  name: string
  environment: 'mainnet' | 'devnet' | 'localnet'
  status: 'success' | 'failed' | 'running' | 'pending'
  progress: number
  stage: string
  startedAt: string
}

interface Metrics {
  testsRun: number
  successRate: number
  avgLatency: number
  activeDeployments: number
  totalDeployments: number
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'passed':
    case 'success':
    case 'healthy':
      return <CheckCircle className="w-4 h-4 text-green-500" />
    case 'failed':
    case 'down':
      return <XCircle className="w-4 h-4 text-red-500" />
    case 'running':
      return <Clock3 className="w-4 h-4 text-blue-500" />
    case 'degraded':
      return <AlertCircle className="w-4 h-4 text-yellow-500" />
    case 'pending':
    default:
      return <Clock className="w-4 h-4 text-gray-500" />
  }
}

export default function HomePage() {
  const [metrics, setMetrics] = useState<Metrics>({
    testsRun: 1247,
    successRate: 98.7,
    avgLatency: 156,
    activeDeployments: 12,
    totalDeployments: 847
  })

  const [testResults] = useState<TestResult[]>([
    {
      id: '1',
      name: 'Jupiter Swap Integration',
      protocol: 'Jupiter',
      status: 'passed',
      timestamp: '2m ago',
      duration: 2.3,
      latency: 145
    },
    {
      id: '2',
      name: 'Kamino Lending Flow',
      protocol: 'Kamino',
      status: 'running',
      timestamp: 'now',
      duration: 0,
      latency: 0
    },
    {
      id: '3',
      name: 'Drift Perpetuals Test',
      protocol: 'Drift',
      status: 'failed',
      timestamp: '5m ago',
      duration: 1.8,
      latency: 892
    },
    {
      id: '4',
      name: 'Raydium LP Position',
      protocol: 'Raydium',
      status: 'passed',
      timestamp: '8m ago',
      duration: 3.1,
      latency: 203
    }
  ])

  const [protocols] = useState<Protocol[]>([
    {
      name: 'Jupiter Aggregator',
      status: 'healthy',
      lastCheck: '30s ago',
      latency: 142,
      successRate: 99.2
    },
    {
      name: 'Kamino Finance',
      status: 'healthy',
      lastCheck: '45s ago',
      latency: 198,
      successRate: 98.1
    },
    {
      name: 'Drift Protocol',
      status: 'degraded',
      lastCheck: '1m ago',
      latency: 567,
      successRate: 94.3
    },
    {
      name: 'Raydium AMM',
      status: 'healthy',
      lastCheck: '20s ago',
      latency: 178,
      successRate: 99.7
    }
  ])

  const [deployments, setDeployments] = useState<Deployment[]>([
    {
      id: '1',
      name: 'Trading Bot v2.1',
      environment: 'mainnet',
      status: 'running',
      progress: 67,
      stage: 'Deployment',
      startedAt: '12m ago'
    },
    {
      id: '2',
      name: 'Liquidity Monitor',
      environment: 'devnet',
      status: 'success',
      progress: 100,
      stage: 'Complete',
      startedAt: '25m ago'
    },
    {
      id: '3',
      name: 'Analytics Dashboard',
      environment: 'devnet',
      status: 'failed',
      progress: 45,
      stage: 'Testing',
      startedAt: '40m ago'
    }
  ])

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update running deployments
      setDeployments(prev => prev.map(dep => 
        dep.status === 'running' 
          ? { ...dep, progress: Math.min(dep.progress + Math.random() * 5, 100) }
          : dep
      ))
      
      // Update metrics slightly
      setMetrics(prev => ({
        ...prev,
        avgLatency: Math.floor(prev.avgLatency + (Math.random() - 0.5) * 10),
        successRate: Number((prev.successRate + (Math.random() - 0.5) * 0.1).toFixed(1))
      }))
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 p-4 sm:p-6">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Development Environment
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Complete testing, deployment, and monitoring platform for Solana applications. 
              Built for autonomous agents and professional development teams.
            </p>
          </div>
          
          <div className="flex items-center space-x-2">
            <a 
              href="/dashboard" 
              className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
            >
              Real-Time Dashboard
            </a>
            <span className="text-sm font-medium text-green-600">Live</span>
            <span className="text-sm font-medium text-blue-600">#25</span>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Tests Run</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.testsRun}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                +12 today
              </p>
            </div>
            <Activity className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.successRate}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                -0.2%
              </p>
            </div>
            <CheckCircle2 className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Avg Latency</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.avgLatency}ms
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                +5ms
              </p>
            </div>
            <Clock className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Deployments</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {metrics.activeDeployments}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {metrics.totalDeployments} total
              </p>
            </div>
            <Zap className="w-8 h-8 text-orange-600" />
          </div>
        </div>
      </div>

      {/* Test Results and Protocol Health */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6 mb-6">
        {/* Test Results */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border dark:border-gray-700">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Recent Tests</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Latest protocol integration tests and their status
            </p>
          </div>
          <div className="space-y-3">
            {testResults.map((test) => (
              <div key={test.id} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <StatusIcon status={test.status} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {test.name}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span className="font-medium">{test.protocol}</span>
                        <span>•</span>
                        <span>{test.timestamp}</span>
                        {test.latency && test.latency > 0 && (
                          <>
                            <span>•</span>
                            <span>{test.latency}ms</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                      test.status === 'passed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700' :
                      test.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700' :
                      test.status === 'running' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700' : 
                      'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-500'
                    }`}>
                      {test.status}
                    </span>
                    {test.duration > 0 && (
                      <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {test.duration.toFixed(1)}s
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Protocol Health */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border dark:border-gray-700">
          <div className="mb-4">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Protocol Health</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Real-time status and performance metrics
            </p>
          </div>
          <div className="space-y-3">
            {protocols.map((protocol) => (
              <div key={protocol.name} className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <StatusIcon status={protocol.status} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {protocol.name}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Last check: {protocol.lastCheck}
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                      protocol.status === 'healthy' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700' :
                      protocol.status === 'degraded' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border-yellow-200 dark:border-yellow-700' :
                      protocol.status === 'down' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700' : 
                      'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-500'
                    }`}>
                      {protocol.status}
                    </span>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {protocol.latency > 0 ? `${protocol.latency}ms` : '—'} • {protocol.successRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CI/CD Pipelines */}
      <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border dark:border-gray-700 mb-6">
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">CI/CD Pipelines</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Deployment status and progress tracking
          </p>
        </div>
        <div className="space-y-4">
          {deployments.map((deployment) => (
            <div key={deployment.id} className="space-y-3">
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    <StatusIcon status={deployment.status} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm text-gray-900 dark:text-white truncate">
                        {deployment.name}
                      </p>
                      <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                        <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded text-xs font-medium text-gray-700 dark:text-gray-200">
                          {deployment.environment}
                        </span>
                        <span>•</span>
                        <span>{deployment.stage}</span>
                        <span>•</span>
                        <span>{deployment.startedAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${
                      deployment.status === 'success' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700' :
                      deployment.status === 'failed' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700' :
                      deployment.status === 'running' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-700' : 
                      'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-500'
                    }`}>
                      {deployment.status}
                    </span>
                  </div>
                </div>
              </div>
              
              {deployment.status === 'running' && (
                <div className="bg-gray-100 dark:bg-gray-600 rounded-lg p-3 border border-gray-200 dark:border-gray-500">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-xs font-medium text-gray-600 dark:text-gray-400">Progress</span>
                    <span className="text-xs font-semibold text-gray-900 dark:text-gray-100">{Math.round(deployment.progress)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${deployment.progress}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-8 rounded-lg">
        <div className="p-4 sm:p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-6">
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Platform</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Dashboard</a></li>
                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Testing</a></li>
                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">CI/CD</a></li>
                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Monitoring</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Integrations</h4>
              <ul className="space-y-2">
                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Jupiter</a></li>
                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Kamino</a></li>
                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Drift</a></li>
                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Raydium</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Resources</h4>
              <ul className="space-y-2">
                <li><a href="https://github.com/tyler-james-bridges/solana-devex-platform" target="_blank" rel="noopener" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">GitHub</a></li>
                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Documentation</a></li>
                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">API Reference</a></li>
                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Support</a></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">Project</h4>
              <ul className="space-y-2">
                <li><a href="https://colosseum.com/agent-hackathon" target="_blank" rel="noopener" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Hackathon</a></li>
                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Agent #25</a></li>
                <li><a href="#" className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">Built by onchain-devex</a></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-200 dark:border-gray-700 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
            <p className="text-sm text-gray-600 dark:text-gray-400">© 2026 Solana DevEx Platform. Built by onchain-devex agent.</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Powered by Solana • Built for Agents</p>
          </div>
        </div>
      </footer>
    </div>
  )
}