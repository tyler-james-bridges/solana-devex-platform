'use client'

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Activity, 
  GitBranch, 
  Rocket, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  XCircle,
  Zap,
  Server,
  Globe,
  Play,
  Pause
} from 'lucide-react';

interface AgentTeam {
  id: string;
  name: string;
  project: string;
  status: 'active' | 'idle' | 'deploying';
  members: number;
  currentTask: string;
  progress: number;
}

interface ProjectMetrics {
  name: string;
  deployments: number;
  successRate: number;
  testsRun: number;
  coverage: number;
  status: 'building' | 'testing' | 'deployed' | 'failed';
}

const CollaborationPage: React.FC = () => {
  const [teams] = useState<AgentTeam[]>([
    {
      id: '1',
      name: 'Solana Core Agents',
      project: 'DeFi Lending Platform',
      status: 'active',
      members: 3,
      currentTask: 'Implementing liquidity pool smart contracts',
      progress: 75
    },
    {
      id: '2', 
      name: 'NFT Marketplace Crew',
      project: 'Creator Economy Hub',
      status: 'deploying',
      members: 2,
      currentTask: 'Deploying to testnet',
      progress: 90
    },
    {
      id: '3',
      name: 'Gaming Protocol',
      project: 'P2E Rayting Game', 
      status: 'idle',
      members: 4,
      currentTask: 'Code review and testing',
      progress: 45
    }
  ]);

  const [projects] = useState<ProjectMetrics[]>([
    {
      name: 'DeFi Lending Platform',
      deployments: 12,
      successRate: 94.8,
      testsRun: 1847,
      coverage: 91.2,
      status: 'building'
    },
    {
      name: 'Creator Economy Hub',
      deployments: 8,
      successRate: 87.5,
      testsRun: 1203,
      coverage: 88.6,
      status: 'testing'
    },
    {
      name: 'P2E Rayting Game',
      deployments: 15,
      successRate: 96.9,
      testsRun: 2156,
      coverage: 94.1,
      status: 'deployed'
    }
  ]);

  const [resources] = useState({
    cpu: 67,
    memory: 78,
    network: 45,
    storage: 52
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'deploying': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'idle': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'building': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'testing': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'deployed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <Activity className="w-4 h-4" />;
      case 'deploying': return <Rocket className="w-4 h-4" />;
      case 'idle': return <Pause className="w-4 h-4" />;
      case 'building': return <GitBranch className="w-4 h-4" />;
      case 'testing': return <CheckCircle className="w-4 h-4" />;
      case 'deployed': return <CheckCircle className="w-4 h-4" />;
      case 'failed': return <XCircle className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 p-4 sm:p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 mb-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
              Solana DevEx Collaboration Hub
            </h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Real-time monitoring of agent teams, projects, and deployments
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span className="text-sm font-medium text-red-600">DISCONNECTED</span>
            <button className="ml-2 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors">
              Resume
            </button>
          </div>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Agent Teams</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {teams.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {teams.filter(t => t.status === 'active').length} active
              </p>
            </div>
            <Users className="w-8 h-8 text-blue-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Projects</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {projects.length}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {projects.filter(p => p.status === 'deployed').length} deployed
              </p>
            </div>
            <GitBranch className="w-8 h-8 text-green-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Deployments</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {projects.reduce((sum, p) => sum + p.deployments, 0)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">total</p>
            </div>
            <Rocket className="w-8 h-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border dark:border-gray-700">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Success Rate</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {((projects.reduce((sum, p) => sum + p.successRate, 0) / projects.length) || 0).toFixed(1)}%
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">average</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </div>
        </div>
      </div>

      {/* Agent Teams */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Users className="w-5 h-5 mr-2 text-blue-600" />
          Agent Teams
        </h2>
        <div className="space-y-4">
          {teams.map((team) => (
            <div key={team.id} className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between space-y-3 sm:space-y-0 mb-4">
                <div className="flex-1">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {team.name}
                    </h3>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(team.status)}`}>
                      {getStatusIcon(team.status)}
                      <span className="ml-1 capitalize">{team.status}</span>
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{team.project}</p>
                  <p className="text-sm text-gray-700 dark:text-gray-300">{team.currentTask}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    {team.members} member{team.members !== 1 ? 's' : ''}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    9:06 PM
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Progress</span>
                  <span className="font-medium text-gray-900 dark:text-white">{team.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${team.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Project Performance */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Activity className="w-5 h-5 mr-2 text-green-600" />
          Project Performance
        </h2>
        <div className="space-y-4">
          {projects.map((project, index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 mb-4">
                <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                    {project.name}
                  </h3>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium border ${getStatusColor(project.status)}`}>
                    {getStatusIcon(project.status)}
                    <span className="ml-1 capitalize">{project.status}</span>
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Deployments</p>
                  <p className="font-medium text-gray-900 dark:text-white">{project.deployments}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Success Rate</p>
                  <p className="font-medium text-gray-900 dark:text-white">{project.successRate}%</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Tests Run</p>
                  <p className="font-medium text-gray-900 dark:text-white">{project.testsRun.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Coverage</p>
                  <p className="font-medium text-gray-900 dark:text-white">{project.coverage}%</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* System Resources */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Server className="w-5 h-5 mr-2 text-orange-600" />
          System Resources
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">CPU</span>
                <span className="font-medium text-gray-900 dark:text-white">{resources.cpu}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${resources.cpu}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Memory</span>
                <span className="font-medium text-gray-900 dark:text-white">{resources.memory}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: `${resources.memory}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Network</span>
                <span className="font-medium text-gray-900 dark:text-white">{resources.network}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: `${resources.network}%` }}></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600 dark:text-gray-400">Storage</span>
                <span className="font-medium text-gray-900 dark:text-white">{resources.storage}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: `${resources.storage}%` }}></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Blockchain Metrics */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Globe className="w-5 h-5 mr-2 text-purple-600" />
          Blockchain Metrics
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4 sm:p-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">234</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">RPC Calls/sec</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">1847</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">TPS</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">247,891,203</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Current Slot</p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Deployments */}
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <Rocket className="w-5 h-5 mr-2 text-purple-600" />
          Live Deployments
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4 sm:p-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full animate-pulse"></div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">DeFi Lending Platform</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">testnet</p>
                </div>
              </div>
              <span className="px-3 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium rounded-full">
                BUILDING
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Debug Sessions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
          <AlertTriangle className="w-5 h-5 mr-2 text-amber-600" />
          Debug Sessions
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-4 sm:p-6">
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            </div>
            <p className="text-gray-600 dark:text-gray-400 mb-2">Investigating transaction batching timeout in trading module</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">Multiple transaction failing state due to batching timeout</p>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Project: DeFi Lending Platform</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CollaborationPage;