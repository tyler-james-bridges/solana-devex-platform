'use client'

import { useState } from 'react'
import { 
  GitBranch, 
  Play, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Loader2, 
  Rocket,
  TestTube,
  Shield,
  Globe
} from 'lucide-react'

interface DeploymentStatus {
  id: string
  project: string
  environment: string
  status: 'pending' | 'building' | 'testing' | 'deploying' | 'success' | 'failed'
  progress: number
  startTime: string
  logs: string[]
}

interface PipelineStage {
  id: string
  name: string
  icon: React.ReactNode
  status: 'pending' | 'running' | 'success' | 'failed' | 'skipped'
  duration?: number
}

interface DeploymentPipelineProps {
  deployment: DeploymentStatus
  onViewLogs?: (deployment: DeploymentStatus) => void
}

export default function DeploymentPipeline({ deployment, onViewLogs }: DeploymentPipelineProps) {
  const [showLogs, setShowLogs] = useState(false)

  const getStages = (deployment: DeploymentStatus): PipelineStage[] => {
    const stages: PipelineStage[] = [
      {
        id: 'build',
        name: 'Build',
        icon: <GitBranch className="w-4 h-4" />,
        status: 'pending'
      },
      {
        id: 'test',
        name: 'Test',
        icon: <TestTube className="w-4 h-4" />,
        status: 'pending'
      },
      {
        id: 'security',
        name: 'Security',
        icon: <Shield className="w-4 h-4" />,
        status: 'pending'
      },
      {
        id: 'deploy',
        name: 'Deploy',
        icon: <Rocket className="w-4 h-4" />,
        status: 'pending'
      }
    ]

    // Update stage statuses based on deployment status and progress
    const progress = deployment.progress

    if (deployment.status === 'failed') {
      if (progress < 25) {
        stages[0].status = 'failed'
      } else if (progress < 50) {
        stages[0].status = 'success'
        stages[1].status = 'failed'
      } else if (progress < 75) {
        stages[0].status = 'success'
        stages[1].status = 'success'
        stages[2].status = 'failed'
      } else {
        stages[0].status = 'success'
        stages[1].status = 'success'
        stages[2].status = 'success'
        stages[3].status = 'failed'
      }
    } else if (deployment.status === 'success') {
      stages.forEach(stage => stage.status = 'success')
    } else {
      // In progress
      if (progress >= 25) stages[0].status = 'success'
      else if (deployment.status === 'building') stages[0].status = 'running'

      if (progress >= 50) stages[1].status = 'success'
      else if (progress > 25 && deployment.status === 'testing') stages[1].status = 'running'

      if (progress >= 75) stages[2].status = 'success'
      else if (progress > 50) stages[2].status = 'running'

      if (progress >= 100) stages[3].status = 'success'
      else if (progress > 75 && deployment.status === 'deploying') stages[3].status = 'running'
    }

    return stages
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />
      case 'building':
      case 'testing':
      case 'deploying':
        return <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-400" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'text-green-600 bg-green-50 border-green-200'
      case 'failed':
        return 'text-red-600 bg-red-50 border-red-200'
      case 'building':
      case 'testing':
      case 'deploying':
        return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'pending':
        return 'text-gray-600 bg-gray-50 border-gray-200'
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200'
    }
  }

  const getStageStatusColor = (status: string) => {
    switch (status) {
      case 'success':
        return 'border-green-500 bg-green-50 text-green-700'
      case 'failed':
        return 'border-red-500 bg-red-50 text-red-700'
      case 'running':
        return 'border-blue-500 bg-blue-50 text-blue-700'
      case 'pending':
        return 'border-gray-300 bg-gray-50 text-gray-500'
      default:
        return 'border-gray-300 bg-gray-50 text-gray-500'
    }
  }

  const getStageIcon = (stage: PipelineStage) => {
    if (stage.status === 'running') {
      return <Loader2 className="w-4 h-4 animate-spin" />
    }
    if (stage.status === 'success') {
      return <CheckCircle className="w-4 h-4" />
    }
    if (stage.status === 'failed') {
      return <XCircle className="w-4 h-4" />
    }
    return stage.icon
  }

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime)
    const now = new Date()
    const diff = Math.floor((now.getTime() - start.getTime()) / 1000)
    
    if (diff < 60) return `${diff}s`
    if (diff < 3600) return `${Math.floor(diff / 60)}m`
    return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`
  }

  const stages = getStages(deployment)

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-900">{deployment.project}</h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-sm text-gray-600">{deployment.environment}</span>
            <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(deployment.status)}`}>
              {deployment.status.toUpperCase()}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <div className="text-right">
            <div className="text-sm font-medium text-gray-900">
              {Math.round(deployment.progress)}%
            </div>
            <div className="text-xs text-gray-500">
              {formatDuration(deployment.startTime)}
            </div>
          </div>
          {getStatusIcon(deployment.status)}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
            style={{ width: `${deployment.progress}%` }}
          />
        </div>
      </div>

      {/* Pipeline Stages */}
      <div className="mb-6">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Pipeline Stages</h4>
        <div className="flex items-center space-x-2">
          {stages.map((stage, index) => (
            <div key={stage.id} className="flex items-center">
              <div className={`flex items-center space-x-2 px-3 py-2 rounded-lg border-2 ${getStageStatusColor(stage.status)}`}>
                {getStageIcon(stage)}
                <span className="text-sm font-medium">{stage.name}</span>
              </div>
              {index < stages.length - 1 && (
                <div className="mx-2 w-8 h-0.5 bg-gray-300" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => setShowLogs(!showLogs)}
          className="text-sm text-blue-600 hover:text-blue-800 font-medium"
        >
          {showLogs ? 'Hide Logs' : 'View Logs'}
        </button>
        
        <div className="flex space-x-2">
          {deployment.status === 'failed' && (
            <button className="text-sm text-white bg-red-600 hover:bg-red-700 px-3 py-1 rounded">
              Retry
            </button>
          )}
          {(deployment.status === 'building' || deployment.status === 'testing') && (
            <button className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded border">
              Cancel
            </button>
          )}
          <button 
            onClick={() => onViewLogs && onViewLogs(deployment)}
            className="text-sm text-gray-600 hover:text-gray-800 px-3 py-1 rounded border"
          >
            Details
          </button>
        </div>
      </div>

      {/* Logs Section */}
      {showLogs && (
        <div className="mt-4 border-t pt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Logs</h4>
          <div className="bg-gray-900 text-green-400 rounded p-3 max-h-32 overflow-y-auto">
            {deployment.logs.slice(-5).map((log, index) => (
              <div key={index} className="text-xs font-mono mb-1">
                <span className="text-gray-500">
                  {new Date().toLocaleTimeString()}
                </span>
                {' '}
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}