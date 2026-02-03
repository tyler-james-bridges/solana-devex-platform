'use client'

import { useState, useEffect } from 'react'
import { Activity, TrendingUp, Clock, Zap, CheckCircle2, AlertCircle, XCircle, Loader2 } from 'lucide-react'

interface SystemMetrics {
  testsRun: number
  successRate: number
  avgLatency: number
  activeDeployments: number
  totalDeployments: number
  healthyProtocols: number
}

interface TestResult {
  id: string
  name: string
  status: 'passed' | 'failed' | 'running'
  protocol: string
  duration: number
  timestamp: string
  latency?: number
}

interface ProtocolStatus {
  name: string
  status: 'healthy' | 'degraded' | 'down'
  latency: number
  successRate: number
  lastCheck: string
}

interface Deployment {
  id: string
  name: string
  environment: string
  status: 'success' | 'running' | 'failed'
  progress: number
  stage: string
  startedAt: string
}

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'passed':
    case 'success':
    case 'healthy':
      return <CheckCircle2 className="h-4 w-4 text-green-400" />
    case 'running':
      return <Loader2 className="h-4 w-4 text-blue-400 animate-spin" />
    case 'failed':
    case 'down':
      return <XCircle className="h-4 w-4 text-red-400" />
    case 'degraded':
      return <AlertCircle className="h-4 w-4 text-yellow-400" />
    default:
      return <Activity className="h-4 w-4 text-gray-400" />
  }
}

const MetricCard = ({ 
  title, 
  value, 
  change, 
  icon: Icon,
  trend
}: {
  title: string
  value: string | number
  change?: string
  icon: any
  trend?: 'up' | 'down' | 'neutral'
}) => (
  <div className="metric-card group">
    <div className="flex items-center justify-between mb-3">
      <Icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
      {change && (
        <span className={`metric-change ${trend === 'up' ? 'metric-change-positive' : trend === 'down' ? 'metric-change-negative' : 'text-muted-foreground'}`}>
          {change}
        </span>
      )}
    </div>
    <div>
      <div className="metric-value">{value}</div>
      <div className="metric-label mt-1">{title}</div>
    </div>
  </div>
)

export default function Dashboard() {
  const [metrics, setMetrics] = useState<SystemMetrics>({
    testsRun: 247,
    successRate: 94.8,
    avgLatency: 156,
    activeDeployments: 3,
    totalDeployments: 12,
    healthyProtocols: 3
  })

  const [testResults, setTestResults] = useState<TestResult[]>([
    {
      id: '1',
      name: 'Jupiter V6 Swap Integration',
      status: 'passed',
      protocol: 'Jupiter',
      duration: 1.8,
      timestamp: '2 min ago',
      latency: 145
    },
    {
      id: '2', 
      name: 'Kamino Lending Pool Validation',
      status: 'running',
      protocol: 'Kamino',
      duration: 0,
      timestamp: 'Running now'
    },
    {
      id: '3',
      name: 'Drift Perpetuals Position Test',
      status: 'passed',
      protocol: 'Drift',
      duration: 2.1,
      timestamp: '5 min ago',
      latency: 280
    },
    {
      id: '4',
      name: 'Raydium AMM Liquidity Check',
      status: 'failed',
      protocol: 'Raydium',
      duration: 0.8,
      timestamp: '1 min ago',
      latency: 0
    }
  ])

  const [protocols, setProtocols] = useState<ProtocolStatus[]>([
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

  const [deployments, setDeployments] = useState<Deployment[]>([
    {
      id: '1',
      name: 'Trading Agent v3.2',
      environment: 'mainnet',
      status: 'success',
      progress: 100,
      stage: 'Deployed',
      startedAt: '2h ago'
    },
    {
      id: '2',
      name: 'Yield Optimizer v2.1',
      environment: 'testnet',
      status: 'running',
      progress: 78,
      stage: 'Deploying',
      startedAt: '20m ago'
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
    <div className="dashboard-container py-8 space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="typography-h1">DevEx Platform</h1>
        <p className="typography-body text-muted-foreground max-w-2xl">
          Complete development environment for Solana applications. Monitor tests, deployments, and protocol health in real-time.
        </p>
      </div>

      {/* Metrics Grid */}
      <div className="dashboard-grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Tests Run"
          value={metrics.testsRun}
          change="+12 today"
          icon={Activity}
          trend="up"
        />
        <MetricCard
          title="Success Rate"
          value={`${metrics.successRate}%`}
          change="-0.2%"
          icon={CheckCircle2}
          trend="down"
        />
        <MetricCard
          title="Avg Latency"
          value={`${metrics.avgLatency}ms`}
          change="+5ms"
          icon={Clock}
          trend="down"
        />
        <MetricCard
          title="Active Deployments"
          value={metrics.activeDeployments}
          change={`${metrics.totalDeployments} total`}
          icon={Zap}
          trend="neutral"
        />
      </div>

      <div className="dashboard-grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Test Results */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Recent Tests</h2>
            <p className="card-description">
              Latest protocol integration tests and their status
            </p>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {testResults.map((test) => (
                <div key={test.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-border/60 transition-colors">
                  <div className="flex items-center space-x-3">
                    <StatusIcon status={test.status} />
                    <div className="space-y-1">
                      <p className="typography-body font-medium">{test.name}</p>
                      <div className="flex items-center space-x-2 text-xs text-muted-foreground">
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
                  <div className="text-right">
                    <div className={`status-indicator ${
                      test.status === 'passed' ? 'status-success' :
                      test.status === 'failed' ? 'status-error' :
                      test.status === 'running' ? 'status-info' : 'status-neutral'
                    }`}>
                      {test.status}
                    </div>
                    {test.duration > 0 && (
                      <p className="typography-caption mt-1">{test.duration.toFixed(1)}s</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Protocol Health */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Protocol Health</h2>
            <p className="card-description">
              Real-time status and performance metrics
            </p>
          </div>
          <div className="card-content">
            <div className="space-y-4">
              {protocols.map((protocol) => (
                <div key={protocol.name} className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-border/60 transition-colors">
                  <div className="flex items-center space-x-3">
                    <StatusIcon status={protocol.status} />
                    <div className="space-y-1">
                      <p className="typography-body font-medium">{protocol.name}</p>
                      <p className="typography-caption">
                        Last check: {protocol.lastCheck}
                      </p>
                    </div>
                  </div>
                  <div className="text-right space-y-1">
                    <div className={`status-indicator ${
                      protocol.status === 'healthy' ? 'status-success' :
                      protocol.status === 'degraded' ? 'status-warning' :
                      protocol.status === 'down' ? 'status-error' : 'status-neutral'
                    }`}>
                      {protocol.status}
                    </div>
                    <div className="typography-caption">
                      {protocol.latency > 0 ? `${protocol.latency}ms` : '—'} • {protocol.successRate.toFixed(1)}%
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Deployments */}
      <div className="card">
        <div className="card-header">
          <h2 className="card-title">CI/CD Pipelines</h2>
          <p className="card-description">
            Deployment status and progress tracking
          </p>
        </div>
        <div className="card-content">
          <div className="space-y-6">
            {deployments.map((deployment) => (
              <div key={deployment.id} className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <StatusIcon status={deployment.status} />
                    <div className="space-y-1">
                      <p className="typography-body font-medium">{deployment.name}</p>
                      <div className="flex items-center space-x-2 typography-caption">
                        <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-secondary text-secondary-foreground">
                          {deployment.environment}
                        </span>
                        <span>•</span>
                        <span>{deployment.stage}</span>
                        <span>•</span>
                        <span>{deployment.startedAt}</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={`status-indicator ${
                      deployment.status === 'success' ? 'status-success' :
                      deployment.status === 'failed' ? 'status-error' :
                      deployment.status === 'running' ? 'status-info' : 'status-neutral'
                    }`}>
                      {deployment.status}
                    </div>
                  </div>
                </div>
                {deployment.status === 'running' && (
                  <div className="space-y-2">
                    <div className="flex justify-between typography-caption">
                      <span>Progress</span>
                      <span>{Math.round(deployment.progress)}%</span>
                    </div>
                    <div className="progress-bar">
                      <div 
                        className="progress-indicator bg-primary transition-all duration-1000" 
                        style={{ width: `${deployment.progress}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-center py-8 border-t border-border">
        <p className="typography-caption">
          Autonomous DevEx Platform • Agent #25 • Colosseum Hackathon 2026
        </p>
        <p className="typography-caption mt-1">
          Last updated: {new Date().toLocaleTimeString()} • All systems operational
        </p>
      </div>
    </div>
  )
}