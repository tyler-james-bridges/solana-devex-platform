'use client'

import { useState, useEffect, useRef } from 'react'
import { 
  Users, 
  Activity, 
  Rocket, 
  Server, 
  Bug,
  Clock,
  Zap,
  GitBranch,
  Globe,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Play,
  Pause,
  RefreshCw
} from 'lucide-react'
import AgentTeamCard from '@/components/AgentTeamCard'
import RealTimeMetrics from '@/components/RealTimeMetrics'
import DeploymentPipeline from '@/components/DeploymentPipeline'

interface AgentTeam {
  id: string
  name: string
  project: string
  status: 'active' | 'idle' | 'debugging' | 'deploying'
  members: string[]
  currentTask: string
  progress: number
  lastUpdate: string
}

interface ProjectMetrics {
  id: string
  name: string
  deployments: number
  successRate: number
  avgBuildTime: number
  testsRun: number
  testsPassed: number
  coverage: number
  uptime: number
}

interface DeploymentStatus {
  id: string
  project: string
  environment: string
  status: 'pending' | 'building' | 'testing' | 'deploying' | 'success' | 'failed'
  progress: number
  startTime: string
  logs: string[]
}

interface ResourceMetrics {
  cpu: number
  memory: number
  network: number
  storage: number
  blockchain: {
    rpc: number
    tps: number
    slot: number
  }
}

interface DebugSession {
  id: string
  project: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  assignedTo: string[]
  status: 'open' | 'investigating' | 'resolved'
  createdAt: string
}

export default function CollaborationDashboard() {
  const [agentTeams, setAgentTeams] = useState<AgentTeam[]>([])
  const [projectMetrics, setProjectMetrics] = useState<ProjectMetrics[]>([])
  const [deployments, setDeployments] = useState<DeploymentStatus[]>([])
  const [resources, setResources] = useState<ResourceMetrics>({
    cpu: 0, memory: 0, network: 0, storage: 0,
    blockchain: { rpc: 0, tps: 0, slot: 0 }
  })
  const [debugSessions, setDebugSessions] = useState<DebugSession[]>([])
  const [isLive, setIsLive] = useState(true)
  const [metricsData, setMetricsData] = useState<{[key: string]: any[]}>({
    cpu: [], memory: [], network: [], tps: [], deployments: []
  })
  const wsRef = useRef<WebSocket | null>(null)

  useEffect(() => {
    // Initialize WebSocket connection for real-time updates
    const connectWebSocket = () => {
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? 'wss://onchain-devex.tools/ws/collaboration'
        : 'ws://localhost:3001/ws/collaboration'
      const ws = new WebSocket(wsUrl)
      
      ws.onopen = () => {
        console.log('Connected to collaboration dashboard')
        setIsLive(true)
      }
      
      ws.onmessage = (event) => {
        const data = JSON.parse(event.data)
        
        switch (data.type) {
          case 'agent_teams':
            setAgentTeams(data.payload)
            break
          case 'project_metrics':
            setProjectMetrics(data.payload)
            break
          case 'deployments':
            setDeployments(data.payload)
            break
          case 'resources':
            setResources(data.payload)
            break
          case 'debug_sessions':
            setDebugSessions(data.payload)
            break
          case 'metrics_update':
            setMetricsData(prev => ({
              ...prev,
              [data.metricType]: [...prev[data.metricType].slice(-19), {
                timestamp: new Date().toLocaleTimeString(),
                value: data.payload
              }]
            }))
            break
        }
      }
      
      ws.onclose = () => {
        console.log('Disconnected from collaboration dashboard')
        setIsLive(false)
        // Reconnect after 3 seconds
        setTimeout(connectWebSocket, 3000)
      }
      
      wsRef.current = ws
    }

    connectWebSocket()

    // Initialize with mock data for demo
    initializeMockData()

    return () => {
      if (wsRef.current) {
        wsRef.current.close()
      }
    }
  }, [])

  const initializeMockData = () => {
    // Mock agent teams
    setAgentTeams([
      {
        id: 'team-1',
        name: 'Solana Core Agents',
        project: 'DeFi Lending Platform',
        status: 'active',
        members: ['Agent-Alpha', 'Agent-Beta', 'Agent-Gamma'],
        currentTask: 'Implementing liquidity pool smart contracts',
        progress: 75,
        lastUpdate: new Date().toISOString()
      },
      {
        id: 'team-2',
        name: 'NFT Marketplace Crew',
        project: 'Creator Economy Hub',
        status: 'deploying',
        members: ['Agent-Delta', 'Agent-Epsilon'],
        currentTask: 'Deploying to testnet',
        progress: 90,
        lastUpdate: new Date().toISOString()
      },
      {
        id: 'team-3',
        name: 'Gaming Protocol Team',
        project: 'P2E Racing Game',
        status: 'debugging',
        members: ['Agent-Zeta', 'Agent-Eta', 'Agent-Theta', 'Agent-Iota'],
        currentTask: 'Debugging transaction batching issue',
        progress: 45,
        lastUpdate: new Date().toISOString()
      }
    ])

    // Mock project metrics
    setProjectMetrics([
      {
        id: 'proj-1',
        name: 'DeFi Lending Platform',
        deployments: 47,
        successRate: 94.5,
        avgBuildTime: 4.2,
        testsRun: 1247,
        testsPassed: 1198,
        coverage: 87.3,
        uptime: 99.8
      },
      {
        id: 'proj-2',
        name: 'Creator Economy Hub',
        deployments: 23,
        successRate: 96.1,
        avgBuildTime: 3.8,
        testsRun: 876,
        testsPassed: 842,
        coverage: 91.2,
        uptime: 99.9
      },
      {
        id: 'proj-3',
        name: 'P2E Racing Game',
        deployments: 31,
        successRate: 89.7,
        avgBuildTime: 5.1,
        testsRun: 2103,
        testsPassed: 1987,
        coverage: 83.4,
        uptime: 98.7
      }
    ])

    // Mock deployments
    setDeployments([
      {
        id: 'deploy-1',
        project: 'DeFi Lending Platform',
        environment: 'testnet',
        status: 'building',
        progress: 60,
        startTime: new Date(Date.now() - 300000).toISOString(),
        logs: [
          'Building smart contracts...',
          'Running security checks...',
          'Compiling programs...'
        ]
      },
      {
        id: 'deploy-2',
        project: 'Creator Economy Hub',
        environment: 'mainnet',
        status: 'success',
        progress: 100,
        startTime: new Date(Date.now() - 600000).toISOString(),
        logs: [
          'Build completed successfully',
          'All tests passed',
          'Deployed to mainnet'
        ]
      }
    ])

    // Mock resources
    setResources({
      cpu: 67,
      memory: 78,
      network: 45,
      storage: 52,
      blockchain: {
        rpc: 234,
        tps: 1847,
        slot: 247891203
      }
    })

    // Mock debug sessions
    setDebugSessions([
      {
        id: 'debug-1',
        project: 'P2E Racing Game',
        severity: 'high',
        title: 'Transaction batching timeout',
        description: 'Multiple transactions failing due to batching timeout in racing module',
        assignedTo: ['Agent-Zeta', 'Agent-Eta'],
        status: 'investigating',
        createdAt: new Date(Date.now() - 1800000).toISOString()
      },
      {
        id: 'debug-2',
        project: 'DeFi Lending Platform',
        severity: 'medium',
        title: 'Interest rate calculation drift',
        description: 'Small discrepancies in interest rate calculations over time',
        assignedTo: ['Agent-Alpha'],
        status: 'open',
        createdAt: new Date(Date.now() - 3600000).toISOString()
      }
    ])
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': case 'success': case 'resolved': return 'text-green-500'
      case 'debugging': case 'investigating': case 'failed': return 'text-red-500'
      case 'deploying': case 'building': case 'pending': return 'text-yellow-500'
      case 'idle': case 'open': return 'text-gray-500'
      default: return 'text-gray-500'
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200'
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200'
      case 'medium': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200'
      default: return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Solana DevEx Collaboration Hub
            </h1>
            <p className="text-gray-600">
              Real-time monitoring of agent teams, projects, and deployments
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <div className={`flex items-center space-x-2 ${isLive ? 'text-green-500' : 'text-red-500'}`}>
              <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
              <span className="text-sm font-medium">{isLive ? 'LIVE' : 'DISCONNECTED'}</span>
            </div>
            <button
              onClick={() => setIsLive(!isLive)}
              className="flex items-center space-x-2 px-3 py-1 rounded-lg bg-gray-200 hover:bg-gray-300 transition-colors"
            >
              {isLive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span className="text-sm">{isLive ? 'Pause' : 'Resume'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-12 gap-6">
        {/* Agent Teams - Left Column */}
        <div className="col-span-4">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Users className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold text-gray-900">Agent Teams</h2>
              <span className="text-sm text-gray-500">({agentTeams.length} active)</span>
            </div>

            <div className="space-y-3">
              {agentTeams.map((team) => (
                <AgentTeamCard 
                  key={team.id} 
                  team={team}
                  onClick={(team) => console.log('Team clicked:', team.name)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Center Column - Metrics & Deployments */}
        <div className="col-span-5 space-y-6">
          {/* Project Metrics */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Activity className="w-5 h-5 text-green-500" />
              <h2 className="text-lg font-semibold text-gray-900">Project Performance</h2>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {projectMetrics.map((project) => (
                <div key={project.id} className="border rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2 text-sm">{project.name}</h3>
                  
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Success Rate</span>
                      <span className="font-medium text-green-600">{project.successRate}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Deployments</span>
                      <span className="font-medium">{project.deployments}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Avg Build</span>
                      <span className="font-medium">{project.avgBuildTime}min</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Coverage</span>
                      <span className="font-medium">{project.coverage}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Uptime</span>
                      <span className="font-medium text-green-600">{project.uptime}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Real-time Deployments */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Rocket className="w-5 h-5 text-purple-500" />
              <h2 className="text-lg font-semibold text-gray-900">Live Deployments</h2>
            </div>

            <div className="space-y-4">
              {deployments.map((deployment) => (
                <DeploymentPipeline 
                  key={deployment.id} 
                  deployment={deployment}
                  onViewLogs={(deployment) => console.log('View logs for:', deployment.project)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Resources & Debug */}
        <div className="col-span-3 space-y-6">
          {/* Resource Monitoring */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Server className="w-5 h-5 text-orange-500" />
              <h2 className="text-lg font-semibold text-gray-900">Resources</h2>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">CPU</span>
                  <span className="font-medium">{resources.cpu}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${resources.cpu}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Memory</span>
                  <span className="font-medium">{resources.memory}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${resources.memory}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Network</span>
                  <span className="font-medium">{resources.network}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${resources.network}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-600">Storage</span>
                  <span className="font-medium">{resources.storage}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${resources.storage}%` }}
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <h3 className="text-sm font-medium text-gray-900 mb-3">Blockchain Metrics</h3>
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-gray-500">RPC Calls/sec</span>
                    <span className="font-medium">{resources.blockchain.rpc}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">TPS</span>
                    <span className="font-medium">{resources.blockchain.tps}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Current Slot</span>
                    <span className="font-medium">{resources.blockchain.slot.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Debug Sessions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center space-x-3 mb-6">
              <Bug className="w-5 h-5 text-red-500" />
              <h2 className="text-lg font-semibold text-gray-900">Debug Sessions</h2>
            </div>

            <div className="space-y-3">
              {debugSessions.map((session) => (
                <div key={session.id} className={`border rounded-lg p-3 ${getSeverityColor(session.severity)}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium uppercase">{session.severity}</span>
                    <span className={`text-xs ${getStatusColor(session.status)}`}>
                      {session.status}
                    </span>
                  </div>
                  
                  <h3 className="font-medium text-sm mb-1">{session.title}</h3>
                  <p className="text-xs text-gray-600 mb-2">{session.description}</p>
                  
                  <div className="text-xs space-y-1">
                    <div>
                      <span className="text-gray-500">Project:</span> {session.project}
                    </div>
                    <div>
                      <span className="text-gray-500">Assigned:</span> {session.assignedTo.join(', ')}
                    </div>
                    <div className="text-gray-400">
                      {new Date(session.createdAt).toLocaleString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}