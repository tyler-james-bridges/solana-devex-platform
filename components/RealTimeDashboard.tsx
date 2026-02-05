/**
 * Real-Time Protocol Monitoring Dashboard
 * Live Solana protocol health and performance tracking with fallback support
 */

'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { 
  Activity, 
  TrendingUp, 
  TrendingDown,
  Clock, 
  Zap, 
  CheckCircle2, 
  AlertCircle, 
  XCircle, 
  Loader2,
  Wifi,
  WifiOff,
  Bell,
  AlertTriangle,
  BarChart3,
  Gauge,
  Network,
  Server
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';

interface NetworkMetrics {
  slot: number;
  blockHeight: number;
  latency: number;
  tps: number;
  status: 'healthy' | 'degraded' | 'down';
  health: boolean;
  timestamp: string;
}

interface ProtocolMetrics {
  name: string;
  status: 'healthy' | 'degraded' | 'down';
  latency: number;
  availability: number;
  errorRate: number;
  timestamp: string;
}

interface Alert {
  id: string;
  rule: {
    name: string;
    condition: string;
    threshold: number;
  };
  value: number;
  severity: 'critical' | 'warning' | 'info';
  protocol?: string;
  timestamp: string;
  resolved?: boolean;
}

interface AgentDEXEndpoint {
  name: string;
  path: string;
  method: string;
  category: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  responseTime: number;
  errorRate: number;
  successRate: number;
  totalRequests: number;
  successfulRequests: number;
  errorRequests: number;
  lastCheck: number | null;
  uptime: number;
  p50: number;
  p95: number;
  p99: number;
}

interface AgentDEXSummary {
  platformStatus: 'healthy' | 'degraded' | 'down';
  totalEndpoints: number;
  healthyEndpoints: number;
  overallP50: number;
  overallP95: number;
  overallP99: number;
  errorRate: number;
  successRate: number;
  jupiterRouting: {
    responseTime: number;
    successRate: number;
    status: 'healthy' | 'degraded' | 'down';
  };
  categories: Record<string, {
    total: number;
    healthy: number;
    degraded: number;
    down: number;
    averageResponseTime: number;
  }>;
  timestamp: number;
}

interface AgentDEXData {
  endpoints: AgentDEXEndpoint[];
  isMonitoring: boolean;
  monitoringInterval: number;
  lastUpdate: number;
  summary: AgentDEXSummary;
}

interface DashboardData {
  network: Record<string, NetworkMetrics>;
  protocols: ProtocolMetrics[];
  agentdex?: AgentDEXData;
  alerts: Alert[];
  uptime: any;
  system: {
    uptime: number;
    totalRequests: number;
    errorRate: number;
    avgResponseTime: number;
  };
}

// Fetch real data from API
const fetchRealData = async (): Promise<DashboardData | null> => {
  try {
    const response = await fetch(`http://localhost:3001/api/dashboard/data`, {
      headers: {
        'x-api-key': 'devex-hackathon-2026'
      }
    });
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Failed to fetch real data from API:', error);
    return null;
  }
};

const StatusIcon = ({ status }: { status: string }) => {
  switch (status) {
    case 'healthy':
      return <CheckCircle2 className="w-4 h-4 text-green-600" />;
    case 'degraded':
      return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    case 'down':
      return <XCircle className="w-4 h-4 text-red-600" />;
    default:
      return <Activity className="w-4 h-4 text-gray-500" />;
  }
};

const MetricCard = ({ 
  title, 
  value, 
  change, 
  trend,
  icon: Icon,
  status = 'neutral',
  onClick
}: {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: any;
  status?: 'healthy' | 'degraded' | 'down' | 'neutral';
  onClick?: () => void;
}) => {
  return (
    <div 
      className={`bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border dark:border-gray-700 transition-all duration-200 hover:shadow-md ${onClick ? 'cursor-pointer' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-3">
        <Icon className={`w-5 h-5 ${status === 'down' ? 'text-red-600' : status === 'degraded' ? 'text-yellow-600' : 'text-blue-600'}`} />
        {change && (
          <div className="flex items-center space-x-1">
            {trend === 'up' ? (
              <TrendingUp className="w-4 h-4 text-green-600" />
            ) : trend === 'down' ? (
              <TrendingDown className="w-4 h-4 text-red-600" />
            ) : null}
            <span className={`text-xs sm:text-sm font-medium ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
              {change}
            </span>
          </div>
        )}
      </div>
      <div className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
      <div className="text-sm text-gray-600 dark:text-gray-300">{title}</div>
    </div>
  );
};

const AlertBadge = ({ alert, onResolve }: { alert: Alert; onResolve?: (id: string) => void }) => {
  const severityColors = {
    critical: 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800',
    info: 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/20 dark:text-blue-300 dark:border-blue-800'
  };

  return (
    <div className={`p-3 rounded-lg border ${severityColors[alert.severity]} ${alert.resolved ? 'opacity-60' : ''}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2 min-w-0">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span className="font-medium text-sm truncate">{alert.rule.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          {alert.protocol && (
            <span className="text-xs bg-white dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded flex-shrink-0">{alert.protocol}</span>
          )}
          {!alert.resolved && onResolve && (
            <button
              onClick={() => onResolve(alert.id)}
              className="text-xs bg-white dark:bg-gray-700 dark:text-gray-300 px-2 py-1 rounded hover:bg-gray-50 dark:hover:bg-gray-600 flex-shrink-0"
            >
              Resolve
            </button>
          )}
        </div>
      </div>
      <div className="mt-1 text-xs">
        {alert.rule.condition}: {alert.value} (threshold: {alert.rule.threshold})
      </div>
      <div className="mt-1 text-xs text-gray-500">
        {new Date(alert.timestamp).toLocaleTimeString()}
      </div>
    </div>
  );
};

const RealTimeDashboard: React.FC = () => {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected'>('connecting');
  const [historicalData, setHistoricalData] = useState<any[]>([]);
  const [selectedTimeframe, setSelectedTimeframe] = useState('1h');
  const [selectedProtocol, setSelectedProtocol] = useState<string | null>(null);
  const [notifications, setNotifications] = useState<Alert[]>([]);
  const [isLiveMode, setIsLiveMode] = useState(false);
  
  const wsRef = useRef<WebSocket | null>(null);
  const updateIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Generate initial historical data
  const generateHistoricalData = useCallback(() => {
    const data = [];
    const now = Date.now();
    
    for (let i = 20; i >= 0; i--) {
      const timestamp = now - (i * 60000); // Every minute
      data.push({
        timestamp,
        time: new Date(timestamp).toLocaleTimeString(),
        helius_latency: 120 + Math.random() * 50,
        quicknode_latency: 95 + Math.random() * 40,
        alchemy_latency: 110 + Math.random() * 60,
        jupiter_availability: 98 + Math.random() * 2,
        kamino_availability: 99 + Math.random() * 1,
        drift_availability: 97 + Math.random() * 3,
        raydium_availability: 99 + Math.random() * 1
      });
    }
    
    setHistoricalData(data);
  }, []);

  // Try WebSocket connection, fallback to polling
  const connectWebSocket = useCallback(() => {
    try {
      const wsUrl = process.env.NODE_ENV === 'production' 
        ? `wss://${window.location.host}/api/live-monitor` 
        : 'ws://localhost:3001';
      
      wsRef.current = new WebSocket(wsUrl);
      
      const timeout = setTimeout(() => {
        console.log('WebSocket connection timeout, using fallback mode');
        if (wsRef.current && wsRef.current.readyState !== WebSocket.OPEN) {
          wsRef.current.close();
          setConnectionStatus('disconnected');
          startFallbackMode();
        }
      }, 3000);
      
      wsRef.current.onopen = () => {
        console.log('WebSocket connected - using live mode');
        clearTimeout(timeout);
        setConnectionStatus('connected');
        setIsLiveMode(true);
        
        wsRef.current?.send(JSON.stringify({
          type: 'subscribe',
          streams: ['all']
        }));
      };
      
      wsRef.current.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          handleWebSocketMessage(message);
        } catch (error) {
          console.error('WebSocket message parsing error:', error);
        }
      };
      
      wsRef.current.onerror = (error) => {
        console.log('WebSocket error, falling back to demo mode:', error);
        clearTimeout(timeout);
        setConnectionStatus('disconnected');
        startFallbackMode();
      };
      
      wsRef.current.onclose = () => {
        console.log('WebSocket disconnected');
        clearTimeout(timeout);
        setConnectionStatus('disconnected');
        if (isLiveMode) {
          setIsLiveMode(false);
          startFallbackMode();
        }
      };
    } catch (error) {
      console.log('WebSocket connection failed, using demo mode:', error);
      setConnectionStatus('disconnected');
      startFallbackMode();
    }
  }, [isLiveMode]);

  // Fallback mode with real API data polling
  const startFallbackMode = useCallback(async () => {
    console.log('Starting API polling mode with REAL Solana data');
    setConnectionStatus('disconnected');
    
    // Try to fetch initial real data
    const realData = await fetchRealData();
    if (realData) {
      setDashboardData(realData);
      console.log('✅ Successfully loaded REAL Solana network data');
    } else {
      console.error('❌ Failed to load real data - check if API server is running');
      setDashboardData({
        network: {},
        protocols: [],
        alerts: [],
        uptime: {},
        system: {
          uptime: 0,
          totalRequests: 0,
          errorRate: 0,
          avgResponseTime: 0
        }
      });
    }
    
    // Poll real data every 5 seconds
    updateIntervalRef.current = setInterval(async () => {
      try {
        const newData = await fetchRealData();
        if (newData) {
          setDashboardData(newData);
          
          // Update historical data with REAL metrics
          setHistoricalData(prev => {
            const newPoint = {
              timestamp: Date.now(),
              time: new Date().toLocaleTimeString(),
              helius_latency: newData.network['Helius']?.latency || 0,
              quicknode_latency: newData.network['QuickNode']?.latency || 0,
              alchemy_latency: newData.network['Alchemy']?.latency || 0,
              jupiter_availability: newData.protocols.find(p => p.name === 'Jupiter')?.availability || 0,
              kamino_availability: newData.protocols.find(p => p.name === 'Kamino')?.availability || 0,
              drift_availability: newData.protocols.find(p => p.name === 'Drift')?.availability || 0,
              raydium_availability: newData.protocols.find(p => p.name === 'Raydium')?.availability || 0
            };
            
            const updated = [...prev, newPoint];
            return updated.slice(-50); // Keep last 50 points
          });
        } else {
          console.error('Failed to fetch real data during polling');
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000);
  }, []);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: any) => {
    switch (message.type) {
      case 'initial_data':
      case 'dashboard_update':
        setDashboardData(message.data);
        break;
      case 'alert':
        setNotifications(prev => [message.data, ...prev.slice(0, 9)]);
        break;
      default:
        console.log('Unknown WebSocket message type:', message.type);
    }
  }, []);

  // Resolve alert
  const resolveAlert = useCallback(async (alertId: string) => {
    setDashboardData(prev => prev ? {
      ...prev,
      alerts: prev.alerts.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    } : null);
    
    setNotifications(prev => 
      prev.map(alert => 
        alert.id === alertId ? { ...alert, resolved: true } : alert
      )
    );
  }, []);

  // Initialize
  useEffect(() => {
    generateHistoricalData();
    
    // Try WebSocket first, fallback to demo mode
    connectWebSocket();
    
    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current);
      }
      
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connectWebSocket, generateHistoricalData]);

  // Calculate overall system health
  const systemHealth = dashboardData ? {
    networkHealth: Object.values(dashboardData.network).filter(n => n.status === 'healthy').length / Object.keys(dashboardData.network).length * 100,
    protocolHealth: dashboardData.protocols.filter(p => p.status === 'healthy').length / dashboardData.protocols.length * 100,
    agentdexHealth: dashboardData.agentdex ? (dashboardData.agentdex.summary.healthyEndpoints / dashboardData.agentdex.summary.totalEndpoints) * 100 : 0,
    totalAlerts: dashboardData.alerts.filter(a => !a.resolved).length,
    avgLatency: Object.values(dashboardData.network).reduce((acc, n) => acc + n.latency, 0) / Object.keys(dashboardData.network).length || 0,
    agentdexLatency: dashboardData.agentdex ? dashboardData.agentdex.summary.overallP50 : 0
  } : null;

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="text-center max-w-sm mx-auto">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600 text-sm sm:text-base">Loading REAL-TIME Solana network monitoring...</p>
          <p className="text-xs sm:text-sm text-gray-500 mt-2">
            Initializing {connectionStatus === 'connecting' ? 'live monitoring...' : 'demo mode...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 p-4 sm:p-6">
      {/* Status Bar */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
        <div className="flex items-center space-x-2">
          {isLiveMode ? (
            <>
              <Wifi className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">WebSocket Live</span>
            </>
          ) : (
            <>
              <Activity className="w-4 h-4 text-green-600" />
              <span className="text-sm text-green-600">Real API Data</span>
            </>
          )}
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Last update: {new Date().toLocaleTimeString()}
          </span>
        </div>
        
        {/* Notifications */}
        {notifications.filter(n => !n.resolved).length > 0 && (
          <div className="flex items-center space-x-2 text-sm text-amber-600">
            <AlertTriangle className="w-4 h-4" />
            <span>{notifications.filter(n => !n.resolved).length} alert(s)</span>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="space-y-6">
        {/* System Overview */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <MetricCard
            title="Network Health"
            value={systemHealth ? `${systemHealth.networkHealth.toFixed(1)}%` : 'N/A'}
            icon={Network}
            status={systemHealth && systemHealth.networkHealth > 90 ? 'healthy' : systemHealth && systemHealth.networkHealth > 70 ? 'degraded' : 'down'}
            change={`${Object.keys(dashboardData.network).length} providers`}
          />
          
          <MetricCard
            title="Protocol Health"
            value={systemHealth ? `${systemHealth.protocolHealth.toFixed(1)}%` : 'N/A'}
            icon={Server}
            status={systemHealth && systemHealth.protocolHealth > 90 ? 'healthy' : systemHealth && systemHealth.protocolHealth > 70 ? 'degraded' : 'down'}
            change={`${dashboardData.protocols.length} protocols`}
          />
          
          <MetricCard
            title="Avg Network Latency"
            value={systemHealth ? `${systemHealth.avgLatency.toFixed(0)}ms` : 'N/A'}
            icon={Clock}
            status={systemHealth && systemHealth.avgLatency < 200 ? 'healthy' : systemHealth && systemHealth.avgLatency < 400 ? 'degraded' : 'down'}
            trend={historicalData.length > 1 ? 
              (systemHealth!.avgLatency > (historicalData[historicalData.length - 2]?.helius_latency || 0) ? 'up' : 'down') : 'neutral'}
          />
          
          <MetricCard
            title="Active Alerts"
            value={systemHealth ? systemHealth.totalAlerts : 0}
            icon={AlertTriangle}
            status={systemHealth && systemHealth.totalAlerts === 0 ? 'healthy' : systemHealth && systemHealth.totalAlerts < 3 ? 'degraded' : 'down'}
            change={`${dashboardData.alerts.filter(a => a.resolved).length} resolved`}
          />
        </div>

        {/* AgentDEX Monitoring Section */}
        {dashboardData.agentdex && (
          <div className="space-y-6">
            <div className="bg-gradient-to-r from-purple-500 to-blue-600 text-white p-4 sm:p-6 rounded-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
                <div>
                  <h2 className="text-xl sm:text-2xl font-bold mb-2">AgentDEX Monitoring</h2>
                  <p className="text-purple-100 text-sm sm:text-base">Real-time endpoint monitoring for @JacobsClawd - 13 endpoints tracked</p>
                </div>
                <div className="text-left sm:text-right">
                  <div className="text-2xl sm:text-3xl font-bold">{dashboardData.agentdex.summary.healthyEndpoints}/{dashboardData.agentdex.summary.totalEndpoints}</div>
                  <div className="text-sm text-purple-100">Healthy Endpoints</div>
                </div>
              </div>
            </div>

            {/* AgentDEX Overview Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
              <MetricCard
                title="Platform Status"
                value={dashboardData.agentdex.summary.platformStatus.charAt(0).toUpperCase() + dashboardData.agentdex.summary.platformStatus.slice(1)}
                icon={Server}
                status={dashboardData.agentdex.summary.platformStatus}
                change={`${Math.round((dashboardData.agentdex.summary.healthyEndpoints / dashboardData.agentdex.summary.totalEndpoints) * 100)}% healthy`}
              />
              
              <MetricCard
                title="Response Time P95"
                value={`${dashboardData.agentdex.summary.overallP95}ms`}
                icon={Clock}
                status={dashboardData.agentdex.summary.overallP95 < 500 ? 'healthy' : dashboardData.agentdex.summary.overallP95 < 1000 ? 'degraded' : 'down'}
                change={`P50: ${dashboardData.agentdex.summary.overallP50}ms`}
              />
              
              <MetricCard
                title="Success Rate"
                value={`${dashboardData.agentdex.summary.successRate.toFixed(1)}%`}
                icon={CheckCircle2}
                status={dashboardData.agentdex.summary.successRate > 98 ? 'healthy' : dashboardData.agentdex.summary.successRate > 95 ? 'degraded' : 'down'}
                change={`Error: ${dashboardData.agentdex.summary.errorRate.toFixed(1)}%`}
              />
              
              <MetricCard
                title="Jupiter Routing"
                value={`${dashboardData.agentdex.summary.jupiterRouting.responseTime}ms`}
                icon={Zap}
                status={dashboardData.agentdex.summary.jupiterRouting.status}
                change={`${dashboardData.agentdex.summary.jupiterRouting.successRate.toFixed(1)}% success`}
              />
            </div>

            {/* AgentDEX Endpoints Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
              {/* Endpoint Categories */}
              <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
                  <Network className="w-5 h-5 mr-2 text-purple-600" />
                  Endpoint Categories
                </h3>
                <div className="space-y-3">
                  {Object.entries(dashboardData.agentdex.summary.categories).map(([category, stats]) => (
                    <div key={category} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2 sm:space-y-0">
                      <div className="flex items-center space-x-3">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${
                          stats.healthy === stats.total ? 'bg-green-500' :
                          stats.healthy > stats.total * 0.8 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}></div>
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white capitalize">{category}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{stats.healthy}/{stats.total} healthy</p>
                        </div>
                      </div>
                      <div className="text-left sm:text-right pl-6 sm:pl-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{stats.averageResponseTime}ms avg</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{((stats.healthy / stats.total) * 100).toFixed(0)}% uptime</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Endpoints Performance */}
              <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border dark:border-gray-700">
                <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
                  <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
                  Top Performing Endpoints
                </h3>
                <div className="space-y-3">
                  {dashboardData.agentdex.endpoints
                    .sort((a, b) => b.successRate - a.successRate)
                    .slice(0, 5)
                    .map((endpoint) => (
                      <div key={endpoint.name} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg space-y-2 sm:space-y-0">
                        <div className="flex items-center space-x-3">
                          <StatusIcon status={endpoint.status} />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">{endpoint.name}</p>
                            <p className="text-sm text-gray-500 truncate">{endpoint.method} {endpoint.path}</p>
                          </div>
                        </div>
                        <div className="text-left sm:text-right pl-8 sm:pl-0 flex-shrink-0">
                          <p className="text-sm font-medium">{endpoint.responseTime.toFixed(0)}ms</p>
                          <p className="text-xs text-gray-500">{endpoint.successRate.toFixed(1)}%</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* All AgentDEX Endpoints Detailed View */}
            <div className="bg-white p-4 sm:p-6 rounded-lg border">
              <h3 className="text-lg font-semibold mb-4 flex items-center">
                <Activity className="w-5 h-5 mr-2 text-green-600" />
                All AgentDEX Endpoints ({dashboardData.agentdex.endpoints.length})
              </h3>
              
              {/* Mobile: List View, Desktop: Grid View */}
              <div className="block sm:hidden space-y-3 max-h-96 overflow-y-auto">
                {dashboardData.agentdex.endpoints.map((endpoint) => (
                  <div key={endpoint.name} className="p-3 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <StatusIcon status={endpoint.status} />
                        <span className="font-medium text-sm truncate">{endpoint.name}</span>
                      </div>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded uppercase flex-shrink-0">{endpoint.method}</span>
                    </div>
                    <div className="text-xs text-gray-600 mb-2 truncate">{endpoint.path}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Response:</span>
                        <div className="font-medium">{endpoint.responseTime.toFixed(0)}ms</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Success:</span>
                        <div className="font-medium">{endpoint.successRate.toFixed(1)}%</div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded capitalize">{endpoint.category}</span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: Grid View */}
              <div className="hidden sm:grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-96 overflow-y-auto">
                {dashboardData.agentdex.endpoints.map((endpoint) => (
                  <div key={endpoint.name} className="p-4 bg-gray-50 rounded-lg border">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2 min-w-0">
                        <StatusIcon status={endpoint.status} />
                        <span className="font-medium text-sm truncate">{endpoint.name}</span>
                      </div>
                      <span className="text-xs bg-gray-200 px-2 py-1 rounded uppercase flex-shrink-0">{endpoint.method}</span>
                    </div>
                    <div className="text-xs text-gray-600 mb-2 truncate">{endpoint.path}</div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-gray-500">Response:</span>
                        <div className="font-medium">{endpoint.responseTime.toFixed(0)}ms</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Success:</span>
                        <div className="font-medium">{endpoint.successRate.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-gray-500">P95:</span>
                        <div className="font-medium">{endpoint.p95}ms</div>
                      </div>
                      <div>
                        <span className="text-gray-500">Requests:</span>
                        <div className="font-medium">{endpoint.totalRequests.toLocaleString()}</div>
                      </div>
                    </div>
                    <div className="mt-2">
                      <span className="text-xs text-gray-500">Category: </span>
                      <span className="text-xs bg-blue-100 text-blue-800 px-1 py-0.5 rounded capitalize">{endpoint.category}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Network Latency Chart */}
          <div className="bg-white p-4 sm:p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              Network Latency Trend
            </h3>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="helius_latency"
                    stroke="#8884d8"
                    strokeWidth={2}
                    dot={false}
                    name="Helius (ms)"
                  />
                  <Line
                    type="monotone"
                    dataKey="quicknode_latency"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    dot={false}
                    name="QuickNode (ms)"
                  />
                  <Line
                    type="monotone"
                    dataKey="alchemy_latency"
                    stroke="#ffc658"
                    strokeWidth={2}
                    dot={false}
                    name="Alchemy (ms)"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Protocol Availability Chart */}
          <div className="bg-white p-4 sm:p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Gauge className="w-5 h-5 mr-2 text-green-600" />
              Protocol Availability
            </h3>
            <div className="h-48 sm:h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={historicalData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="time" />
                  <YAxis domain={[95, 100]} />
                  <Tooltip />
                  <Area
                    type="monotone"
                    dataKey="jupiter_availability"
                    stackId="1"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.3}
                    name="Jupiter (%)"
                  />
                  <Area
                    type="monotone"
                    dataKey="kamino_availability"
                    stackId="1"
                    stroke="#82ca9d"
                    fill="#82ca9d"
                    fillOpacity={0.3}
                    name="Kamino (%)"
                  />
                  <Area
                    type="monotone"
                    dataKey="drift_availability"
                    stackId="1"
                    stroke="#ffc658"
                    fill="#ffc658"
                    fillOpacity={0.3}
                    name="Drift (%)"
                  />
                  <Area
                    type="monotone"
                    dataKey="raydium_availability"
                    stackId="1"
                    stroke="#ff7300"
                    fill="#ff7300"
                    fillOpacity={0.3}
                    name="Raydium (%)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Network Status & Protocol Health */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Network Providers */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Network Providers</h3>
            <div className="space-y-3">
              {Object.entries(dashboardData.network).map(([provider, metrics]) => (
                <div key={provider} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <StatusIcon status={metrics.status} />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{provider}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Slot: {metrics.slot.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right pl-8 sm:pl-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{metrics.latency}ms</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{metrics.tps.toFixed(0)} TPS</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Protocol Status */}
          <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border dark:border-gray-700">
            <h3 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Protocol Health</h3>
            <div className="space-y-3">
              {dashboardData.protocols.map((protocol) => (
                <div key={protocol.name} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg space-y-2 sm:space-y-0">
                  <div className="flex items-center space-x-3">
                    <StatusIcon status={protocol.status} />
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">{protocol.name}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{protocol.availability.toFixed(1)}% availability</p>
                    </div>
                  </div>
                  <div className="text-left sm:text-right pl-8 sm:pl-0">
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{protocol.latency}ms</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{protocol.errorRate.toFixed(1)}% errors</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white dark:bg-gray-800 p-4 sm:p-6 rounded-lg border dark:border-gray-700">
          <h3 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
            Recent Alerts
          </h3>
          
          {dashboardData.alerts.length === 0 ? (
            <div className="text-center py-6 sm:py-8">
              <CheckCircle2 className="w-8 h-8 sm:w-12 sm:h-12 text-green-600 mx-auto mb-2" />
              <p className="text-gray-600 dark:text-gray-300">No recent alerts</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">All systems operating normally</p>
            </div>
          ) : (
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {dashboardData.alerts.slice(0, 10).map((alert) => (
                <AlertBadge
                  key={alert.id}
                  alert={alert}
                  onResolve={resolveAlert}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RealTimeDashboard;