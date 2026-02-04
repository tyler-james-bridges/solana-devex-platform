'use client'

import { useState } from 'react'
import { Users, ChevronDown, ChevronUp, Clock, Zap, GitBranch } from 'lucide-react'

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

interface AgentTeamCardProps {
  team: AgentTeam
  onClick?: (team: AgentTeam) => void
  expanded?: boolean
}

export default function AgentTeamCard({ team, onClick, expanded = false }: AgentTeamCardProps) {
  const [isExpanded, setIsExpanded] = useState(expanded)

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-500 bg-green-50 border-green-200'
      case 'debugging': return 'text-red-500 bg-red-50 border-red-200'
      case 'deploying': return 'text-yellow-500 bg-yellow-50 border-yellow-200'
      case 'idle': return 'text-gray-500 bg-gray-50 border-gray-200'
      default: return 'text-gray-500 bg-gray-50 border-gray-200'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Zap className="w-3 h-3" />
      case 'debugging': return <GitBranch className="w-3 h-3" />
      case 'deploying': return <Clock className="w-3 h-3" />
      case 'idle': return <Users className="w-3 h-3" />
      default: return <Users className="w-3 h-3" />
    }
  }

  const handleCardClick = () => {
    if (onClick) {
      onClick(team)
    } else {
      setIsExpanded(!isExpanded)
    }
  }

  return (
    <div 
      className="border rounded-lg hover:bg-gray-50 transition-all duration-200 cursor-pointer"
      onClick={handleCardClick}
    >
      {/* Main Card Content */}
      <div className="p-4">
        <div className="flex items-center justify-between mb-2">
          <h3 className="font-medium text-gray-900 text-sm">{team.name}</h3>
          <div className="flex items-center space-x-2">
            <span className={`text-xs px-2 py-1 rounded-full border ${getStatusColor(team.status)}`}>
              <div className="flex items-center space-x-1">
                {getStatusIcon(team.status)}
                <span className="font-medium">{team.status.toUpperCase()}</span>
              </div>
            </span>
            {isExpanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </div>
        
        <p className="text-xs text-gray-600 mb-3 font-medium">{team.project}</p>
        
        <div className="text-xs text-gray-500 mb-3">
          <span className="font-medium">Current Task:</span> {team.currentTask}
        </div>
        
        {/* Progress Bar */}
        <div className="mb-3">
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Progress</span>
            <span>{Math.round(team.progress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div 
              className="bg-blue-500 h-1.5 rounded-full transition-all duration-500"
              style={{ width: `${team.progress}%` }}
            />
          </div>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <div className="text-gray-500">
            {team.members.length} member{team.members.length !== 1 ? 's' : ''}
          </div>
          <div className="text-gray-400">
            {new Date(team.lastUpdate).toLocaleTimeString()}
          </div>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t bg-gray-50/50 p-4 space-y-3">
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Team Members</h4>
            <div className="flex flex-wrap gap-1">
              {team.members.map((member, index) => (
                <span 
                  key={index} 
                  className="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded-full"
                >
                  {member}
                </span>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="text-xs font-medium text-gray-700 mb-2">Activity Timeline</h4>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-gray-600">Task started: {team.currentTask}</span>
                <span className="text-gray-400 ml-auto">
                  {new Date(team.lastUpdate).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span className="text-gray-600">Status updated to {team.status}</span>
                <span className="text-gray-400 ml-auto">
                  {new Date(Date.now() - 300000).toLocaleTimeString()}
                </span>
              </div>
              <div className="flex items-center space-x-2 text-xs">
                <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                <span className="text-gray-600">Team synchronized with project</span>
                <span className="text-gray-400 ml-auto">
                  {new Date(Date.now() - 600000).toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>

          <div className="flex justify-between pt-2">
            <button className="text-xs text-blue-600 hover:text-blue-800 font-medium">
              View Details
            </button>
            <button className="text-xs text-gray-600 hover:text-gray-800 font-medium">
              Contact Team
            </button>
          </div>
        </div>
      )}
    </div>
  )
}