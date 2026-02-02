'use client'

import { useState, useEffect } from 'react'
import { Activity, CheckCircle, AlertTriangle, XCircle, TrendingUp, Code, Zap, Shield } from 'lucide-react'

interface TestResult {
  id: string
  name: string
  status: 'passed' | 'failed' | 'running'
  protocol: string
  duration: number
  timestamp: string
}

interface ProtocolHealth {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  latency: number
  successRate: number
  lastCheck: string
}

interface PipelineStatus {
  id: string
  name: string
  status: 'success' | 'running' | 'failed'
  stage: string
  progress: number
  lastRun: string
}

export default function Dashboard() {
  const [testResults, setTestResults] = useState<TestResult[]>([
    {
      id: '1',
      name: 'Jupiter Swap Integration',
      status: 'passed',
      protocol: 'Jupiter',
      duration: 1.2,
      timestamp: '2 min ago'
    },
    {
      id: '2', 
      name: 'Kamino Lending Test',
      status: 'running',
      protocol: 'Kamino',
      duration: 0,
      timestamp: 'Running...'
    },
    {
      id: '3',
      name: 'Drift Position Management',
      status: 'passed',
      protocol: 'Drift',
      duration: 2.1,
      timestamp: '5 min ago'
    },
    {
      id: '4',
      name: 'Raydium Liquidity Check',
      status: 'failed',
      protocol: 'Raydium',
      duration: 0.8,
      timestamp: '1 min ago'
    }
  ])

  const [protocolHealth, setProtocolHealth] = useState<ProtocolHealth[]>([
    {
      name: 'Jupiter',
      status: 'healthy',
      latency: 145,
      successRate: 99.8,
      lastCheck: 'Just now'
    },
    {
      name: 'Kamino',
      status: 'healthy', 
      latency: 89,
      successRate: 99.2,
      lastCheck: '30s ago'
    },
    {
      name: 'Drift',
      status: 'degraded',
      latency: 420,
      successRate: 94.5,
      lastCheck: '1m ago'
    },
    {
      name: 'Raydium',
      status: 'down',
      latency: 0,
      successRate: 0,
      lastCheck: '5m ago'
    }
  ])

  const [pipelines, setPipelines] = useState<PipelineStatus[]>([
    {
      id: '1',
      name: 'Trading Bot v2.1',
      status: 'success',
      stage: 'Deployed to Mainnet',
      progress: 100,
      lastRun: '1 hour ago'
    },
    {
      id: '2',
      name: 'Yield Optimizer',
      status: 'running',
      stage: 'Testing on Devnet',
      progress: 65,
      lastRun: 'Running now'
    },
    {
      id: '3',
      name: 'DeFi Dashboard',
      status: 'failed',
      stage: 'Build Failed',
      progress: 20,
      lastRun: '30 min ago'
    }
  ])

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'passed':
      case 'success':
      case 'healthy':
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case 'running':
        return <Activity className="w-4 h-4 text-blue-500 animate-pulse" />
      case 'failed':
      case 'down':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'degraded':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getStatusClass = (status: string) => {
    switch (status) {
      case 'passed':
      case 'success':
      case 'healthy':
        return 'status-success'
      case 'running':
        return 'status-info'
      case 'failed':
      case 'down':
        return 'status-error'
      case 'degraded':
        return 'status-warning'
      default:
        return 'status-info'
    }
  }

  // Simulate real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      // Update test results
      setTestResults(prev => prev.map(test => 
        test.status === 'running' 
          ? { ...test, status: Math.random() > 0.3 ? 'passed' : 'failed' as any, duration: Math.random() * 3, timestamp: 'Just now' }
          : test
      ))
      
      // Update protocol health
      setProtocolHealth(prev => prev.map(protocol => ({
        ...protocol,
        latency: protocol.status === 'down' ? 0 : Math.floor(Math.random() * 200) + 50,
        successRate: protocol.status === 'down' ? 0 : Math.random() * 5 + 95,
        lastCheck: 'Just now'
      })))
      
      // Update pipeline progress
      setPipelines(prev => prev.map(pipeline => 
        pipeline.status === 'running'
          ? { ...pipeline, progress: Math.min(pipeline.progress + Math.random() * 10, 100) }
          : pipeline
      ))
    }, 3000)

    return () => clearInterval(interval)
  }, [])

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">DevEx Dashboard</h1>
        <p className="mt-2 text-gray-600">
          Complete visibility into your Solana development pipeline
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="dashboard-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Code className="h-8 w-8 text-blue-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Tests</p>
              <p className="text-2xl font-semibold text-gray-900">
                {testResults.filter(t => t.status === 'running').length}
              </p>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Shield className="h-8 w-8 text-green-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Success Rate</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round((testResults.filter(t => t.status === 'passed').length / testResults.length) * 100)}%
              </p>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Zap className="h-8 w-8 text-yellow-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Latency</p>
              <p className="text-2xl font-semibold text-gray-900">
                {Math.round(protocolHealth.reduce((acc, p) => acc + p.latency, 0) / protocolHealth.length)}ms
              </p>
            </div>
          </div>
        </div>

        <div className="dashboard-card">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <TrendingUp className="h-8 w-8 text-purple-500" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Deployments</p>
              <p className="text-2xl font-semibold text-gray-900">
                {pipelines.filter(p => p.status === 'success').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        {/* Test Results */}
        <div className="dashboard-card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Results</h2>
          <div className="space-y-4">
            {testResults.map((test) => (
              <div key={test.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(test.status)}
                  <div>
                    <p className="font-medium text-gray-900">{test.name}</p>
                    <p className="text-sm text-gray-500">{test.protocol} • {test.timestamp}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`status-indicator ${getStatusClass(test.status)}`}>
                    {test.status}
                  </span>
                  {test.duration > 0 && (
                    <p className="text-xs text-gray-500 mt-1">{test.duration.toFixed(1)}s</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Protocol Health */}
        <div className="dashboard-card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Protocol Health</h2>
          <div className="space-y-4">
            {protocolHealth.map((protocol) => (
              <div key={protocol.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(protocol.status)}
                  <div>
                    <p className="font-medium text-gray-900">{protocol.name}</p>
                    <p className="text-sm text-gray-500">Last check: {protocol.lastCheck}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`status-indicator ${getStatusClass(protocol.status)}`}>
                    {protocol.status}
                  </span>
                  <div className="text-xs text-gray-500 mt-1">
                    {protocol.latency > 0 && <span>{protocol.latency}ms • </span>}
                    {protocol.successRate.toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CI/CD Pipelines */}
      <div className="dashboard-card">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">CI/CD Pipelines</h2>
        <div className="space-y-4">
          {pipelines.map((pipeline) => (
            <div key={pipeline.id} className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(pipeline.status)}
                  <div>
                    <p className="font-medium text-gray-900">{pipeline.name}</p>
                    <p className="text-sm text-gray-500">{pipeline.stage} • {pipeline.lastRun}</p>
                  </div>
                </div>
                <span className={`status-indicator ${getStatusClass(pipeline.status)}`}>
                  {pipeline.status}
                </span>
              </div>
              {pipeline.status === 'running' && (
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-1000" 
                    style={{ width: `${pipeline.progress}%` }}
                  ></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Agent Status */}
      <div className="mt-8 text-center text-gray-500">
        <p className="text-sm">
          🤖 Autonomous DevEx Platform • Built by onchain-devex agent for Colosseum Hackathon
        </p>
        <p className="text-xs mt-1">
          Last updated: {new Date().toLocaleTimeString()} • All systems operational
        </p>
      </div>
    </div>
  )
}