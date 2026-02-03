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

interface DashboardData {
  network: Record<string, NetworkMetrics>;
  protocols: ProtocolMetrics[];
  alerts: Alert[];
  uptime: any;
  system: {
    uptime: number;
    totalRequests: number;
    errorRate: number;
    avgResponseTime: number;
  };
}

// Mock data for demonstration
const generateMockData = (): DashboardData => {
  const now = new Date().toISOString();
  
  return {
    network: {
      'Helius': {
        slot: 285947123 + Math.floor(Math.random() * 1000),
        blockHeight: 285947123,
        latency: 120 + Math.floor(Math.random() * 50),
        tps: 2800 + Math.floor(Math.random() * 500),
        status: Math.random() > 0.9 ? 'degraded' : 'healthy',
        health: Math.random() > 0.1,
        timestamp: now
      },
      'QuickNode': {
        slot: 285947123 + Math.floor(Math.random() * 1000),
        blockHeight: 285947123,
        latency: 95 + Math.floor(Math.random() * 40),
        tps: 2900 + Math.floor(Math.random() * 600),
        status: Math.random() > 0.95 ? 'degraded' : 'healthy',
        health: Math.random() > 0.05,
        timestamp: now
      },
      'Alchemy': {
        slot: 285947123 + Math.floor(Math.random() * 1000),
        blockHeight: 285947123,
        latency: 110 + Math.floor(Math.random() * 60),
        tps: 2750 + Math.floor(Math.random() * 400),
        status: 'healthy',
        health: true,
        timestamp: now
      }
    },
    protocols: [
      {
        name: 'Jupiter',
        status: Math.random() > 0.9 ? 'degraded' : 'healthy',
        latency: 180 + Math.floor(Math.random() * 80),
        availability: 98.5 + Math.random() * 1.4,
        errorRate: Math.random() * 0.5,
        timestamp: now
      },
      {
        name: 'Kamino',
        status: 'healthy',
        latency: 220 + Math.floor(Math.random() * 100),
        availability: 99.2 + Math.random() * 0.7,
        errorRate: Math.random() * 0.3,
        timestamp: now
      },
      {
        name: 'Drift',
        status: Math.random() > 0.95 ? 'degraded' : 'healthy',
        latency: 160 + Math.floor(Math.random() * 70),
        availability: 97.8 + Math.random() * 2.0,
        errorRate: Math.random() * 0.8,
        timestamp: now
      },
      {
        name: 'Raydium',
        status: 'healthy',
        latency: 140 + Math.floor(Math.random() * 50),
        availability: 99.1 + Math.random() * 0.8,
        errorRate: Math.random() * 0.4,
        timestamp: now
      }
    ],
    alerts: Math.random() > 0.7 ? [
      {
        id: 'alert-' + Date.now(),
        rule: {
          name: 'High Latency Warning',
          condition: 'latency > 500ms',
          threshold: 500
        },
        value: 520 + Math.floor(Math.random() * 100),
        severity: 'warning' as const,
        protocol: 'Jupiter',
        timestamp: now,
        resolved: false
      }
    ] : [],
    uptime: {},
    system: {
      uptime: Date.now() - (1000 * 60 * 60 * 24 * 30), // 30 days
      totalRequests: 1250000 + Math.floor(Math.random() * 50000),
      errorRate: Math.random() * 2,
      avgResponseTime: 180 + Math.floor(Math.random() * 40)
    }
  };
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
  const statusColors = {
    healthy: 'border-green-200 bg-green-50',
    degraded: 'border-yellow-200 bg-yellow-50',
    down: 'border-red-200 bg-red-50',
    neutral: 'border-gray-200 bg-white'
  };

  return (
    <div 
      className={`p-6 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${statusColors[status]} ${onClick ? 'cursor-pointer' : ''}`}
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
            <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
              {change}
            </span>
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-sm text-gray-600">{title}</div>
    </div>
  );
};

const AlertBadge = ({ alert, onResolve }: { alert: Alert; onResolve?: (id: string) => void }) => {
  const severityColors = {
    critical: 'bg-red-100 text-red-800 border-red-200',
    warning: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    info: 'bg-blue-100 text-blue-800 border-blue-200'
  };

  return (
    <div className={`p-3 rounded-lg border ${severityColors[alert.severity]} ${alert.resolved ? 'opacity-60' : ''}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <AlertTriangle className="w-4 h-4" />
          <span className="font-medium text-sm">{alert.rule.name}</span>
        </div>
        <div className="flex items-center space-x-2">
          {alert.protocol && (
            <span className="text-xs bg-white px-2 py-1 rounded">{alert.protocol}</span>
          )}
          {!alert.resolved && onResolve && (
            <button
              onClick={() => onResolve(alert.id)}
              className="text-xs bg-white px-2 py-1 rounded hover:bg-gray-50"
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

  // Fallback mode with mock data updates
  const startFallbackMode = useCallback(() => {
    console.log('Starting demo mode with simulated data');
    setConnectionStatus('disconnected');
    
    // Set initial data
    setDashboardData(generateMockData());
    
    // Update data every 5 seconds with slight variations
    updateIntervalRef.current = setInterval(() => {
      const newData = generateMockData();
      setDashboardData(newData);
      
      // Update historical data
      setHistoricalData(prev => {
        const newPoint = {
          timestamp: Date.now(),
          time: new Date().toLocaleTimeString(),
          helius_latency: newData.network['Helius']?.latency || 120,
          quicknode_latency: newData.network['QuickNode']?.latency || 95,
          alchemy_latency: newData.network['Alchemy']?.latency || 110,
          jupiter_availability: newData.protocols.find(p => p.name === 'Jupiter')?.availability || 98,
          kamino_availability: newData.protocols.find(p => p.name === 'Kamino')?.availability || 99,
          drift_availability: newData.protocols.find(p => p.name === 'Drift')?.availability || 97,
          raydium_availability: newData.protocols.find(p => p.name === 'Raydium')?.availability || 99
        };
        
        const updated = [...prev, newPoint];
        return updated.slice(-50); // Keep last 50 points
      });
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
    totalAlerts: dashboardData.alerts.filter(a => !a.resolved).length,
    avgLatency: Object.values(dashboardData.network).reduce((acc, n) => acc + n.latency, 0) / Object.keys(dashboardData.network).length || 0
  } : null;

  if (!dashboardData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading real-time monitoring dashboard...</p>
          <p className="text-sm text-gray-500 mt-2">
            Initializing {connectionStatus === 'connecting' ? 'live monitoring...' : 'demo mode...'}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Real-Time Protocol Monitor</h1>
              <p className="text-gray-600">
                Live Solana network and protocol health tracking
                {!isLiveMode && (
                  <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                    Demo Mode - Simulated Data
                  </span>
                )}
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Connection Status */}
              <div className="flex items-center space-x-2">
                {isLiveMode ? (
                  <>
                    <Wifi className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">Live Data</span>
                  </>
                ) : (
                  <>
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span className="text-sm text-blue-600">Demo Mode</span>
                  </>
                )}
              </div>
              
              {/* Notifications */}
              <div className="relative">
                <Bell className="w-5 h-5 text-gray-600" />
                {notifications.filter(n => !n.resolved).length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                    {notifications.filter(n => !n.resolved).length}
                  </span>
                )}
              </div>
              
              {/* Last Update */}
              <div className="text-sm text-gray-500">
                Last update: {new Date().toLocaleTimeString()}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* System Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Network Latency Chart */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <BarChart3 className="w-5 h-5 mr-2 text-blue-600" />
              Network Latency Trend
            </h3>
            <div className="h-64">
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
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Gauge className="w-5 h-5 mr-2 text-green-600" />
              Protocol Availability
            </h3>
            <div className="h-64">
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Network Providers */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Network Providers</h3>
            <div className="space-y-4">
              {Object.entries(dashboardData.network).map(([provider, metrics]) => (
                <div key={provider} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <StatusIcon status={metrics.status} />
                    <div>
                      <p className="font-medium text-gray-900">{provider}</p>
                      <p className="text-sm text-gray-500">Slot: {metrics.slot.toLocaleString()}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{metrics.latency}ms</p>
                    <p className="text-xs text-gray-500">{metrics.tps.toFixed(0)} TPS</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Protocol Status */}
          <div className="bg-white p-6 rounded-lg border">
            <h3 className="text-lg font-semibold mb-4">Protocol Health</h3>
            <div className="space-y-4">
              {dashboardData.protocols.map((protocol) => (
                <div key={protocol.name} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <StatusIcon status={protocol.status} />
                    <div>
                      <p className="font-medium text-gray-900">{protocol.name}</p>
                      <p className="text-sm text-gray-500">{protocol.availability.toFixed(1)}% availability</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">{protocol.latency}ms</p>
                    <p className="text-xs text-gray-500">{protocol.errorRate.toFixed(1)}% errors</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Alerts */}
        <div className="bg-white p-6 rounded-lg border">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <AlertTriangle className="w-5 h-5 mr-2 text-yellow-600" />
            Recent Alerts
          </h3>
          
          {dashboardData.alerts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
              <p className="text-gray-600">No recent alerts</p>
              <p className="text-sm text-gray-500">All systems operating normally</p>
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