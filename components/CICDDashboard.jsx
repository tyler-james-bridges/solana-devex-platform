/**
 * Real-time CI/CD Dashboard Component
 * Live monitoring of builds, deployments, and tests
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Activity, 
  CheckCircle, 
  XCircle, 
  Clock, 
  GitBranch, 
  Zap, 
  AlertCircle,
  RefreshCw,
  ExternalLink,
  Play,
  Pause,
  Settings,
  TrendingUp,
  Users,
  Server,
  Database
} from 'lucide-react';

const CICDDashboard = () => {
  const [activeBuilds, setActiveBuilds] = useState([]);
  const [recentDeployments, setRecentDeployments] = useState([]);
  const [metrics, setMetrics] = useState({
    builds: { total: 0, successful: 0, failed: 0, successRate: 0 },
    deployments: { total: 0, successful: 0, successRate: 0 }
  });
  const [isConnected, setIsConnected] = useState(false);
  const [selectedBuild, setSelectedBuild] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const wsRef = useRef(null);

  useEffect(() => {
    // Connect to WebSocket
    const connectWebSocket = () => {
      const ws = new WebSocket(`ws://${window.location.host}/ws/cicd`);
      
      ws.onopen = () => {
        console.log('Connected to CI/CD WebSocket');
        setIsConnected(true);
      };
      
      ws.onmessage = (event) => {
        const { type, data } = JSON.parse(event.data);
        handleWebSocketMessage(type, data);
      };
      
      ws.onclose = () => {
        console.log('CI/CD WebSocket connection closed');
        setIsConnected(false);
        
        // Reconnect after 5 seconds
        if (autoRefresh) {
          setTimeout(connectWebSocket, 5000);
        }
      };
      
      ws.onerror = (error) => {
        console.error('CI/CD WebSocket error:', error);
        setIsConnected(false);
      };
      
      wsRef.current = ws;
    };

    connectWebSocket();
    loadInitialData();

    return () => {
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [autoRefresh]);

  const handleWebSocketMessage = (type, data) => {
    switch (type) {
      case 'status':
        setActiveBuilds(data.activeBuilds || []);
        setRecentDeployments(data.recentDeployments || []);
        break;
      
      case 'build_started':
      case 'pr_build_started':
        setActiveBuilds(prev => {
          const index = prev.findIndex(b => b.id === data.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = data;
            return updated;
          }
          return [data, ...prev];
        });
        break;
      
      case 'build_updated':
        setActiveBuilds(prev => 
          prev.map(build => build.id === data.id ? data : build)
        );
        break;
      
      case 'build_completed':
        setActiveBuilds(prev => 
          prev.map(build => build.id === data.id ? data : build)
        );
        // Auto-remove completed builds after 30 seconds
        setTimeout(() => {
          setActiveBuilds(prev => prev.filter(b => b.id !== data.id));
        }, 30000);
        break;
      
      case 'deployment_created':
      case 'deployment_updated':
        setRecentDeployments(prev => {
          const index = prev.findIndex(d => d.id === data.id);
          if (index >= 0) {
            const updated = [...prev];
            updated[index] = data;
            return updated;
          }
          return [data, ...prev].slice(0, 10);
        });
        break;
      
      case 'vercel_deployment':
      case 'railway_deployment':
      case 'heroku_deployment':
        // Handle external deployment updates
        setRecentDeployments(prev => {
          const existing = prev.find(d => d.id === data.id);
          if (!existing) {
            return [data, ...prev].slice(0, 10);
          }
          return prev.map(d => d.id === data.id ? { ...d, ...data } : d);
        });
        break;
    }
  };

  const loadInitialData = async () => {
    try {
      const [dashboardResponse, metricsResponse] = await Promise.all([
        fetch('/api/dashboard'),
        fetch('/api/metrics/overview')
      ]);
      
      if (dashboardResponse.ok) {
        const dashboardData = await dashboardResponse.json();
        setActiveBuilds(dashboardData.activeBuilds || []);
        setRecentDeployments(dashboardData.recentDeployments || []);
      }
      
      if (metricsResponse.ok) {
        const metricsData = await metricsResponse.json();
        setMetrics(metricsData);
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
      case 'failure':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'pending':
      case 'running':
        return <Clock className="w-5 h-5 text-yellow-500 animate-spin" />;
      default:
        return <AlertCircle className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStageStatus = (stage, status) => {
    const baseClasses = "px-2 py-1 rounded-md text-xs font-medium";
    
    switch (status) {
      case 'success':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      case 'running':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'pending':
        return `${baseClasses} bg-gray-100 text-gray-600`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-600`;
    }
  };

  const formatDuration = (start, end) => {
    if (!start) return '';
    const startTime = new Date(start);
    const endTime = end ? new Date(end) : new Date();
    const duration = Math.floor((endTime - startTime) / 1000);
    
    if (duration < 60) return `${duration}s`;
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  };

  const retryBuild = async (buildId) => {
    try {
      const response = await fetch(`/api/builds/${buildId}/retry`, {
        method: 'POST'
      });
      
      if (response.ok) {
        console.log('Build retry initiated');
      }
    } catch (error) {
      console.error('Failed to retry build:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Activity className="w-8 h-8 text-blue-500" />
              CI/CD Dashboard
            </h1>
            <p className="text-gray-600 mt-1">Real-time pipeline monitoring and deployment tracking</p>
          </div>
          
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium ${
              isConnected ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-500' : 'bg-red-500'
              }`} />
              {isConnected ? 'Connected' : 'Disconnected'}
            </div>
            
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium ${
                autoRefresh ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
              }`}
            >
              {autoRefresh ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              Auto-refresh
            </button>
            
            <button
              onClick={loadInitialData}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Builds</p>
              <p className="text-2xl font-bold text-gray-900">{activeBuilds.length}</p>
            </div>
            <Server className="w-8 h-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Build Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.builds.successRate.toFixed(1)}%</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Deployments</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.deployments.total}</p>
            </div>
            <Zap className="w-8 h-8 text-purple-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Deploy Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">{metrics.deployments.successRate.toFixed(1)}%</p>
            </div>
            <CheckCircle className="w-8 h-8 text-emerald-500" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Active Builds */}
        <div className="xl:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-500" />
                Active Builds
                <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded-full text-xs">
                  {activeBuilds.length}
                </span>
              </h2>
            </div>
            
            <div className="p-6">
              {activeBuilds.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Server className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No active builds</p>
                  <p className="text-sm">Builds will appear here when triggered</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {activeBuilds.map((build) => (
                    <div
                      key={build.id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => setSelectedBuild(build)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          {getStatusIcon(build.status)}
                          <div>
                            <h3 className="font-medium text-gray-900 flex items-center gap-2">
                              {build.repository}
                              {build.pullRequest && (
                                <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-xs">
                                  PR #{build.pullRequest.number}
                                </span>
                              )}
                            </h3>
                            <p className="text-sm text-gray-600 flex items-center gap-1 mt-1">
                              <GitBranch className="w-4 h-4" />
                              {build.branch} • {build.commit.message.substring(0, 50)}...
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              by {build.commit.author} • {formatDuration(build.startedAt, build.completedAt)}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          {build.status === 'failed' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                retryBuild(build.id);
                              }}
                              className="text-xs bg-blue-500 text-white px-2 py-1 rounded hover:bg-blue-600"
                            >
                              Retry
                            </button>
                          )}
                          {build.pullRequest?.url && (
                            <a
                              href={build.pullRequest.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                              className="text-gray-400 hover:text-gray-600"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      </div>

                      {/* Build Stages */}
                      <div className="mt-4 flex items-center gap-2">
                        {Object.entries(build.stages).map(([stage, status]) => (
                          <span key={stage} className={getStageStatus(stage, status)}>
                            {stage}
                          </span>
                        ))}
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-500 ${
                            build.status === 'success'
                              ? 'bg-green-500'
                              : build.status === 'failed'
                              ? 'bg-red-500'
                              : 'bg-blue-500'
                          }`}
                          style={{
                            width: `${
                              build.status === 'pending'
                                ? Object.values(build.stages).filter(s => s === 'success').length * 33
                                : build.status === 'success'
                                ? 100
                                : 75
                            }%`
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Deployments */}
        <div className="xl:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-purple-500" />
                Recent Deployments
              </h2>
            </div>
            
            <div className="p-6">
              {recentDeployments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p>No recent deployments</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentDeployments.map((deployment) => (
                    <div
                      key={deployment.id}
                      className="flex items-start justify-between p-3 border border-gray-100 rounded-lg"
                    >
                      <div className="flex items-start gap-3">
                        {getStatusIcon(deployment.status)}
                        <div>
                          <h4 className="font-medium text-gray-900 text-sm">
                            {deployment.name || deployment.repository}
                          </h4>
                          <p className="text-xs text-gray-600 mt-1">
                            {deployment.environment} • {deployment.source}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(deployment.createdAt || deployment.updatedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>

                      {deployment.url && (
                        <a
                          href={deployment.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Build Details Modal */}
      {selectedBuild && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-900">
                  Build Details - {selectedBuild.repository}
                </h2>
                <button
                  onClick={() => setSelectedBuild(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="w-6 h-6" />
                </button>
              </div>
            </div>

            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">Build Information</h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Status:</span>
                      <div className="flex items-center gap-2 mt-1">
                        {getStatusIcon(selectedBuild.status)}
                        <span className="capitalize">{selectedBuild.status}</span>
                      </div>
                    </div>
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <p className="mt-1">{formatDuration(selectedBuild.startedAt, selectedBuild.completedAt)}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Branch:</span>
                      <p className="mt-1">{selectedBuild.branch}</p>
                    </div>
                    <div>
                      <span className="text-gray-600">Author:</span>
                      <p className="mt-1">{selectedBuild.commit.author}</p>
                    </div>
                  </div>
                </div>

                {selectedBuild.logs && selectedBuild.logs.length > 0 && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Build Logs</h3>
                    <div className="bg-gray-900 text-green-400 p-4 rounded-lg text-sm font-mono max-h-64 overflow-y-auto">
                      {selectedBuild.logs.map((log, index) => (
                        <div key={index} className="mb-1">
                          <span className="text-gray-500">
                            [{new Date(log.timestamp).toLocaleTimeString()}]
                          </span>
                          <span className={`ml-2 ${
                            log.level === 'error' ? 'text-red-400' : 
                            log.level === 'success' ? 'text-green-400' : 
                            log.level === 'warning' ? 'text-yellow-400' : 'text-white'
                          }`}>
                            {log.message}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {selectedBuild.testResults && (
                  <div>
                    <h3 className="font-medium text-gray-900 mb-2">Test Results</h3>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div className="text-center p-3 bg-gray-50 rounded">
                        <p className="text-lg font-bold text-gray-900">{selectedBuild.testResults.total}</p>
                        <p className="text-gray-600">Total</p>
                      </div>
                      <div className="text-center p-3 bg-green-50 rounded">
                        <p className="text-lg font-bold text-green-600">{selectedBuild.testResults.passed}</p>
                        <p className="text-gray-600">Passed</p>
                      </div>
                      <div className="text-center p-3 bg-red-50 rounded">
                        <p className="text-lg font-bold text-red-600">{selectedBuild.testResults.failed}</p>
                        <p className="text-gray-600">Failed</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CICDDashboard;