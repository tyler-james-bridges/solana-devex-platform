const WebSocket = require('ws')
const http = require('http')
const express = require('express')

class CollaborationWebSocketServer {
  constructor() {
    this.app = express()
    this.server = http.createServer(this.app)
    this.wss = new WebSocket.Server({ 
      server: this.server,
      path: '/ws/collaboration'
    })
    
    this.clients = new Set()
    this.agentTeams = []
    this.projectMetrics = []
    this.deployments = []
    this.resources = {
      cpu: 0, memory: 0, network: 0, storage: 0,
      blockchain: { rpc: 0, tps: 0, slot: 0 }
    }
    this.debugSessions = []
    
    this.setupWebSocket()
    this.initializeMockData()
    this.startDataSimulation()
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('New client connected to collaboration dashboard')
      this.clients.add(ws)
      
      // Send initial data
      this.sendToClient(ws, 'agent_teams', this.agentTeams)
      this.sendToClient(ws, 'project_metrics', this.projectMetrics)
      this.sendToClient(ws, 'deployments', this.deployments)
      this.sendToClient(ws, 'resources', this.resources)
      this.sendToClient(ws, 'debug_sessions', this.debugSessions)
      
      ws.on('close', () => {
        console.log('Client disconnected from collaboration dashboard')
        this.clients.delete(ws)
      })
      
      ws.on('error', (error) => {
        console.error('WebSocket error:', error)
        this.clients.delete(ws)
      })
    })
  }

  sendToClient(ws, type, payload) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type, payload }))
    }
  }

  broadcast(type, payload) {
    const message = JSON.stringify({ type, payload })
    this.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message)
      }
    })
  }

  initializeMockData() {
    // Initialize agent teams
    this.agentTeams = [
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
      },
      {
        id: 'team-4',
        name: 'Infrastructure Bots',
        project: 'Cross-Chain Bridge',
        status: 'active',
        members: ['Agent-Kappa', 'Agent-Lambda'],
        currentTask: 'Optimizing bridge transaction fees',
        progress: 62,
        lastUpdate: new Date().toISOString()
      },
      {
        id: 'team-5',
        name: 'DeFi Analytics Squad',
        project: 'Yield Farming Dashboard',
        status: 'idle',
        members: ['Agent-Mu', 'Agent-Nu', 'Agent-Xi'],
        currentTask: 'Waiting for API integration approval',
        progress: 30,
        lastUpdate: new Date().toISOString()
      }
    ]

    // Initialize project metrics
    this.projectMetrics = [
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
      },
      {
        id: 'proj-4',
        name: 'Cross-Chain Bridge',
        deployments: 15,
        successRate: 92.3,
        avgBuildTime: 6.7,
        testsRun: 543,
        testsPassed: 521,
        coverage: 89.1,
        uptime: 99.2
      },
      {
        id: 'proj-5',
        name: 'Yield Farming Dashboard',
        deployments: 8,
        successRate: 87.5,
        avgBuildTime: 2.9,
        testsRun: 234,
        testsPassed: 219,
        coverage: 75.6,
        uptime: 97.8
      }
    ]

    // Initialize deployments
    this.deployments = [
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
      },
      {
        id: 'deploy-3',
        project: 'Cross-Chain Bridge',
        environment: 'devnet',
        status: 'testing',
        progress: 85,
        startTime: new Date(Date.now() - 180000).toISOString(),
        logs: [
          'Running integration tests...',
          'Validating bridge functionality...',
          'Testing cross-chain transfers...'
        ]
      }
    ]

    // Initialize resources
    this.resources = {
      cpu: 67,
      memory: 78,
      network: 45,
      storage: 52,
      blockchain: {
        rpc: 234,
        tps: 1847,
        slot: 247891203
      }
    }

    // Initialize debug sessions
    this.debugSessions = [
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
      },
      {
        id: 'debug-3',
        project: 'Cross-Chain Bridge',
        severity: 'critical',
        title: 'Bridge validation failure',
        description: 'Bridge failing to validate transactions from Ethereum',
        assignedTo: ['Agent-Kappa', 'Agent-Lambda'],
        status: 'investigating',
        createdAt: new Date(Date.now() - 900000).toISOString()
      }
    ]
  }

  startDataSimulation() {
    // Update agent teams every 5 seconds
    setInterval(() => {
      this.updateAgentTeams()
      this.broadcast('agent_teams', this.agentTeams)
    }, 5000)

    // Update project metrics every 10 seconds
    setInterval(() => {
      this.updateProjectMetrics()
      this.broadcast('project_metrics', this.projectMetrics)
    }, 10000)

    // Update deployments every 3 seconds
    setInterval(() => {
      this.updateDeployments()
      this.broadcast('deployments', this.deployments)
    }, 3000)

    // Update resources every 2 seconds
    setInterval(() => {
      this.updateResources()
      this.broadcast('resources', this.resources)
    }, 2000)

    // Update debug sessions every 15 seconds
    setInterval(() => {
      this.updateDebugSessions()
      this.broadcast('debug_sessions', this.debugSessions)
    }, 15000)

    // Simulate new deployments occasionally
    setInterval(() => {
      if (Math.random() < 0.3) { // 30% chance every 30 seconds
        this.createNewDeployment()
        this.broadcast('deployments', this.deployments)
      }
    }, 30000)

    // Simulate new debug sessions occasionally
    setInterval(() => {
      if (Math.random() < 0.2) { // 20% chance every 45 seconds
        this.createNewDebugSession()
        this.broadcast('debug_sessions', this.debugSessions)
      }
    }, 45000)
  }

  updateAgentTeams() {
    this.agentTeams.forEach(team => {
      // Update progress for active teams
      if (team.status === 'active' && team.progress < 100) {
        team.progress += Math.random() * 3
        team.progress = Math.min(team.progress, 100)
        team.lastUpdate = new Date().toISOString()
      }

      // Randomly change status
      if (Math.random() < 0.1) { // 10% chance
        const statuses = ['active', 'idle', 'debugging', 'deploying']
        team.status = statuses[Math.floor(Math.random() * statuses.length)]
        team.lastUpdate = new Date().toISOString()
      }

      // Update tasks occasionally
      if (Math.random() < 0.05) { // 5% chance
        const tasks = [
          'Implementing smart contract logic',
          'Running integration tests',
          'Optimizing transaction efficiency',
          'Debugging runtime issues',
          'Deploying to testnet',
          'Code review and security audit',
          'Performance optimization',
          'UI/UX improvements'
        ]
        team.currentTask = tasks[Math.floor(Math.random() * tasks.length)]
        team.lastUpdate = new Date().toISOString()
      }
    })
  }

  updateProjectMetrics() {
    this.projectMetrics.forEach(project => {
      // Simulate small changes in metrics
      if (Math.random() < 0.3) { // 30% chance
        project.deployments += Math.random() < 0.5 ? 1 : 0
        project.successRate += (Math.random() - 0.5) * 0.5
        project.successRate = Math.max(85, Math.min(99.9, project.successRate))
        project.avgBuildTime += (Math.random() - 0.5) * 0.2
        project.avgBuildTime = Math.max(1, Math.min(10, project.avgBuildTime))
        project.testsRun += Math.floor(Math.random() * 10)
        project.testsPassed = Math.floor(project.testsRun * (project.successRate / 100))
        project.coverage += (Math.random() - 0.5) * 1
        project.coverage = Math.max(70, Math.min(95, project.coverage))
        project.uptime += (Math.random() - 0.5) * 0.1
        project.uptime = Math.max(95, Math.min(100, project.uptime))
      }
    })
  }

  updateDeployments() {
    this.deployments.forEach(deployment => {
      if (deployment.status === 'building' || deployment.status === 'testing') {
        deployment.progress += Math.random() * 5
        deployment.progress = Math.min(deployment.progress, 100)
        
        if (deployment.progress >= 100) {
          deployment.status = Math.random() < 0.9 ? 'success' : 'failed'
          deployment.logs.push(
            deployment.status === 'success' 
              ? 'Deployment completed successfully' 
              : 'Deployment failed - check logs'
          )
        } else {
          // Add random log entries
          if (Math.random() < 0.3) {
            const logEntries = [
              'Compiling contracts...',
              'Running tests...',
              'Uploading to IPFS...',
              'Validating program accounts...',
              'Checking security constraints...',
              'Optimizing bytecode...'
            ]
            deployment.logs.push(logEntries[Math.floor(Math.random() * logEntries.length)])
          }
        }
      }
    })

    // Remove completed deployments after some time
    this.deployments = this.deployments.filter(deployment => {
      if (deployment.status === 'success' || deployment.status === 'failed') {
        const age = Date.now() - new Date(deployment.startTime).getTime()
        return age < 300000 // Keep for 5 minutes
      }
      return true
    })
  }

  updateResources() {
    // Simulate realistic resource fluctuations
    this.resources.cpu += (Math.random() - 0.5) * 10
    this.resources.cpu = Math.max(20, Math.min(95, this.resources.cpu))
    
    this.resources.memory += (Math.random() - 0.5) * 8
    this.resources.memory = Math.max(30, Math.min(90, this.resources.memory))
    
    this.resources.network += (Math.random() - 0.5) * 15
    this.resources.network = Math.max(10, Math.min(80, this.resources.network))
    
    this.resources.storage += (Math.random() - 0.5) * 2
    this.resources.storage = Math.max(30, Math.min(85, this.resources.storage))

    // Blockchain metrics
    this.resources.blockchain.rpc += (Math.random() - 0.5) * 50
    this.resources.blockchain.rpc = Math.max(100, Math.min(500, this.resources.blockchain.rpc))
    
    this.resources.blockchain.tps += (Math.random() - 0.5) * 200
    this.resources.blockchain.tps = Math.max(1000, Math.min(3000, this.resources.blockchain.tps))
    
    this.resources.blockchain.slot += Math.floor(Math.random() * 3) + 1 // Slots increase
  }

  updateDebugSessions() {
    this.debugSessions.forEach(session => {
      // Randomly update status
      if (Math.random() < 0.2) { // 20% chance
        if (session.status === 'open') {
          session.status = 'investigating'
        } else if (session.status === 'investigating' && Math.random() < 0.3) {
          session.status = 'resolved'
        }
      }
    })

    // Remove resolved sessions after some time
    this.debugSessions = this.debugSessions.filter(session => {
      if (session.status === 'resolved') {
        const age = Date.now() - new Date(session.createdAt).getTime()
        return age < 600000 // Keep resolved sessions for 10 minutes
      }
      return true
    })
  }

  createNewDeployment() {
    const projects = ['DeFi Lending Platform', 'Creator Economy Hub', 'P2E Racing Game', 'Cross-Chain Bridge', 'Yield Farming Dashboard']
    const environments = ['devnet', 'testnet', 'mainnet']
    
    const newDeployment = {
      id: `deploy-${Date.now()}`,
      project: projects[Math.floor(Math.random() * projects.length)],
      environment: environments[Math.floor(Math.random() * environments.length)],
      status: 'pending',
      progress: 0,
      startTime: new Date().toISOString(),
      logs: ['Initializing deployment...']
    }

    this.deployments.push(newDeployment)

    // Start the deployment process
    setTimeout(() => {
      const deployment = this.deployments.find(d => d.id === newDeployment.id)
      if (deployment) {
        deployment.status = 'building'
        deployment.logs.push('Starting build process...')
      }
    }, 2000)
  }

  createNewDebugSession() {
    const projects = ['DeFi Lending Platform', 'Creator Economy Hub', 'P2E Racing Game', 'Cross-Chain Bridge', 'Yield Farming Dashboard']
    const severities = ['low', 'medium', 'high', 'critical']
    const agents = ['Agent-Alpha', 'Agent-Beta', 'Agent-Gamma', 'Agent-Delta', 'Agent-Epsilon', 'Agent-Zeta']
    
    const issues = [
      {
        title: 'Memory leak in token processing',
        description: 'Token processing module showing gradual memory increase'
      },
      {
        title: 'RPC timeout errors',
        description: 'Intermittent RPC timeouts causing transaction failures'
      },
      {
        title: 'Smart contract gas optimization',
        description: 'Contract execution exceeding expected gas limits'
      },
      {
        title: 'Database connection pooling issue',
        description: 'Connection pool exhaustion during high load'
      },
      {
        title: 'Cross-chain message validation',
        description: 'Messages from other chains failing validation checks'
      }
    ]

    const issue = issues[Math.floor(Math.random() * issues.length)]
    
    const newSession = {
      id: `debug-${Date.now()}`,
      project: projects[Math.floor(Math.random() * projects.length)],
      severity: severities[Math.floor(Math.random() * severities.length)],
      title: issue.title,
      description: issue.description,
      assignedTo: [agents[Math.floor(Math.random() * agents.length)]],
      status: 'open',
      createdAt: new Date().toISOString()
    }

    this.debugSessions.push(newSession)
  }

  start(port = 3001) {
    this.server.listen(port, () => {
      console.log(`Collaboration WebSocket server running on port ${port}`)
    })
  }
}

module.exports = CollaborationWebSocketServer

// Start the server if this file is run directly
if (require.main === module) {
  const server = new CollaborationWebSocketServer()
  server.start()
}