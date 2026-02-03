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
  const iconClass = "w-4 h-4"
  
  switch (status) {
    case 'passed':
    case 'success':
    case 'healthy':
      return <CheckCircle2 className={`${iconClass} text-green-600`} />
    case 'running':
      return <Loader2 className={`${iconClass} text-blue-600 animate-spin`} />
    case 'failed':
    case 'down':
      return <XCircle className={`${iconClass} text-red-600`} />
    case 'degraded':
      return <AlertCircle className={`${iconClass} text-yellow-600`} />
    default:
      return <Activity className={`${iconClass} text-gray-500`} />
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
  <div className="metric-card">
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
      <Icon className="w-5 h-5 text-blue-600" />
      {change && (
        <span className={`${
          trend === 'up' ? 'metric-change-positive' : 
          trend === 'down' ? 'metric-change-negative' : 'text-gray-500'
        }`}>
          {change}
        </span>
      )}
    </div>
    <div className="metric-value">{value}</div>
    <div className="metric-label">{title}</div>
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header className="header">
        <div className="dashboard-container">
          <div className="header-content">
            <div className="logo">
              <div className="logo-icon">
                <div style={{ width: '16px', height: '16px', background: 'white', borderRadius: '2px' }}></div>
              </div>
              <div>
                <div className="logo-text">Solana DevEx</div>
                <div style={{ fontSize: '12px', color: '#6b7280' }}>Platform</div>
              </div>
            </div>
            
            <div className="status-badges">
              <span className="status-success">Live</span>
              <span className="status-info">#25</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ flex: 1 }}>
        <div className="dashboard-container" style={{ paddingTop: '2rem', paddingBottom: '2rem' }}>
          <div className="space-y-6">
            {/* Header Section */}
            <div className="space-y-2">
              <h1 className="typography-h1">Development Environment</h1>
              <p className="typography-body" style={{ maxWidth: '768px' }}>
                Complete testing, deployment, and monitoring platform for Solana applications. 
                Built for autonomous agents and professional development teams.
              </p>
            </div>

            {/* Metrics Grid */}
            <div className="dashboard-grid grid-cols-2 md:grid-cols-4">
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

            {/* Test Results and Protocol Health */}
            <div className="dashboard-grid grid-cols-1 lg:grid-cols-2">
              {/* Test Results */}
              <div className="card">
                <div className="card-header">
                  <h2 className="card-title">Recent Tests</h2>
                  <p className="card-description">
                    Latest protocol integration tests and their status
                  </p>
                </div>
                <div className="card-content">
                  <div className="space-y-3">
                    {testResults.map((test) => (
                      <div key={test.id} className="item-card">
                        <div className="item-card-content">
                          <StatusIcon status={test.status} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 500, fontSize: '14px', color: '#111827' }} className="truncate">
                              {test.name}
                            </p>
                            <div className="item-card-meta">
                              <span style={{ fontWeight: 500 }}>{test.protocol}</span>
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
                        <div className="item-card-actions">
                          <div className={`status-indicator ${
                            test.status === 'passed' ? 'status-success' :
                            test.status === 'failed' ? 'status-error' :
                            test.status === 'running' ? 'status-info' : 'status-neutral'
                          }`}>
                            {test.status}
                          </div>
                          {test.duration > 0 && (
                            <p className="typography-caption">{test.duration.toFixed(1)}s</p>
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
                  <div className="space-y-3">
                    {protocols.map((protocol) => (
                      <div key={protocol.name} className="item-card">
                        <div className="item-card-content">
                          <StatusIcon status={protocol.status} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 500, fontSize: '14px', color: '#111827' }}>
                              {protocol.name}
                            </p>
                            <p className="typography-caption">
                              Last check: {protocol.lastCheck}
                            </p>
                          </div>
                        </div>
                        <div className="item-card-actions">
                          <div className={`status-indicator ${
                            protocol.status === 'healthy' ? 'status-success' :
                            protocol.status === 'degraded' ? 'status-warning' :
                            protocol.status === 'down' ? 'status-error' : 'status-neutral'
                          }`}>
                            {protocol.status}
                          </div>
                          <p className="typography-caption">
                            {protocol.latency > 0 ? `${protocol.latency}ms` : '—'} • {protocol.successRate.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* CI/CD Pipelines */}
            <div className="card">
              <div className="card-header">
                <h2 className="card-title">CI/CD Pipelines</h2>
                <p className="card-description">
                  Deployment status and progress tracking
                </p>
              </div>
              <div className="card-content">
                <div className="space-y-4">
                  {deployments.map((deployment) => (
                    <div key={deployment.id}>
                      <div className="item-card">
                        <div className="item-card-content">
                          <StatusIcon status={deployment.status} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontWeight: 500, fontSize: '14px', color: '#111827' }} className="truncate">
                              {deployment.name}
                            </p>
                            <div className="item-card-meta">
                              <span style={{ 
                                padding: '2px 8px', 
                                background: '#f3f4f6', 
                                borderRadius: '4px', 
                                fontSize: '11px',
                                border: '1px solid #e5e7eb'
                              }}>
                                {deployment.environment}
                              </span>
                              <span>•</span>
                              <span>{deployment.stage}</span>
                              <span>•</span>
                              <span>{deployment.startedAt}</span>
                            </div>
                          </div>
                        </div>
                        <div className="item-card-actions">
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
                        <div style={{ marginTop: '12px', paddingLeft: '8px', paddingRight: '8px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span className="typography-caption">Progress</span>
                            <span className="typography-caption">{Math.round(deployment.progress)}%</span>
                          </div>
                          <div className="progress-bar">
                            <div 
                              className="progress-indicator"
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
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="footer">
        <div className="dashboard-container">
          <div className="footer-content">
            <div className="footer-grid">
              <div className="footer-section">
                <h4>Platform</h4>
                <ul>
                  <li><a href="#">Dashboard</a></li>
                  <li><a href="#">Testing</a></li>
                  <li><a href="#">CI/CD</a></li>
                  <li><a href="#">Monitoring</a></li>
                </ul>
              </div>
              
              <div className="footer-section">
                <h4>Integrations</h4>
                <ul>
                  <li><a href="#">Jupiter</a></li>
                  <li><a href="#">Kamino</a></li>
                  <li><a href="#">Drift</a></li>
                  <li><a href="#">Raydium</a></li>
                </ul>
              </div>
              
              <div className="footer-section">
                <h4>Resources</h4>
                <ul>
                  <li><a href="https://github.com/tyler-james-bridges/solana-devex-platform" target="_blank" rel="noopener">GitHub</a></li>
                  <li><a href="#">Documentation</a></li>
                  <li><a href="#">API Reference</a></li>
                  <li><a href="#">Support</a></li>
                </ul>
              </div>
              
              <div className="footer-section">
                <h4>Project</h4>
                <ul>
                  <li><a href="https://colosseum.com/agent-hackathon" target="_blank" rel="noopener">Hackathon</a></li>
                  <li><a href="#">Agent #25</a></li>
                  <li><a href="#">Built by onchain-devex</a></li>
                </ul>
              </div>
            </div>
            
            <div className="footer-bottom">
              <p>© 2026 Solana DevEx Platform. Built by onchain-devex agent.</p>
              <p>Powered by Solana • Built for Agents</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}