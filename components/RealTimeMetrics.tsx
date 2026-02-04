'use client'

import { useState, useEffect } from 'react'
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'
import { TrendingUp, TrendingDown, Activity, Zap } from 'lucide-react'

interface MetricPoint {
  timestamp: string
  value: number
}

interface RealTimeMetricsProps {
  type: 'cpu' | 'memory' | 'network' | 'tps' | 'deployments'
  data: MetricPoint[]
  currentValue: number
  label: string
  color: string
  unit?: string
}

export default function RealTimeMetrics({ 
  type, 
  data, 
  currentValue, 
  label, 
  color,
  unit = '%'
}: RealTimeMetricsProps) {
  const [trend, setTrend] = useState<'up' | 'down' | 'stable'>('stable')
  const [changePercent, setChangePercent] = useState(0)

  useEffect(() => {
    if (data.length >= 2) {
      const recent = data[data.length - 1].value
      const previous = data[data.length - 2].value
      const change = ((recent - previous) / previous) * 100
      
      setChangePercent(Math.abs(change))
      
      if (change > 2) {
        setTrend('up')
      } else if (change < -2) {
        setTrend('down')
      } else {
        setTrend('stable')
      }
    }
  }, [data])

  const getTrendIcon = () => {
    switch (trend) {
      case 'up':
        return <TrendingUp className="w-4 h-4 text-green-500" />
      case 'down':
        return <TrendingDown className="w-4 h-4 text-red-500" />
      default:
        return <Activity className="w-4 h-4 text-gray-500" />
    }
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up':
        return 'text-green-500'
      case 'down':
        return 'text-red-500'
      default:
        return 'text-gray-500'
    }
  }

  const formatValue = (value: number) => {
    if (type === 'tps') {
      return value.toLocaleString()
    }
    return `${Math.round(value)}${unit}`
  }

  const getChartComponent = () => {
    const chartData = data.slice(-20) // Show last 20 points
    
    switch (type) {
      case 'deployments':
        return (
          <ResponsiveContainer width="100%" height={80}>
            <BarChart data={chartData}>
              <Bar dataKey="value" fill={color} radius={[2, 2, 0, 0]} />
              <Tooltip 
                formatter={(value) => [formatValue(Number(value)), label]}
                labelFormatter={(label) => `Time: ${label}`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
            </BarChart>
          </ResponsiveContainer>
        )
      
      case 'cpu':
      case 'memory':
      case 'network':
        return (
          <ResponsiveContainer width="100%" height={80}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id={`gradient-${type}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={color} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                strokeWidth={2}
                fill={`url(#gradient-${type})`}
                dot={false}
              />
              <Tooltip 
                formatter={(value) => [formatValue(Number(value)), label]}
                labelFormatter={(label) => `Time: ${label}`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        )
      
      default:
        return (
          <ResponsiveContainer width="100%" height={80}>
            <LineChart data={chartData}>
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke={color} 
                strokeWidth={2}
                dot={false}
              />
              <Tooltip 
                formatter={(value) => [formatValue(Number(value)), label]}
                labelFormatter={(label) => `Time: ${label}`}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e5e7eb',
                  borderRadius: '6px',
                  fontSize: '12px'
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        )
    }
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-900">{label}</h3>
        <div className="flex items-center space-x-1">
          {getTrendIcon()}
          <span className={`text-xs font-medium ${getTrendColor()}`}>
            {trend === 'stable' ? '±0%' : `${changePercent.toFixed(1)}%`}
          </span>
        </div>
      </div>
      
      <div className="mb-3">
        <div className="flex items-baseline space-x-2">
          <span className="text-2xl font-bold text-gray-900">
            {formatValue(currentValue)}
          </span>
          {type === 'tps' && (
            <span className="text-xs text-gray-500 flex items-center">
              <Zap className="w-3 h-3 mr-1" />
              TPS
            </span>
          )}
        </div>
      </div>
      
      <div className="h-20">
        {getChartComponent()}
      </div>
      
      <div className="mt-2 text-xs text-gray-500 text-center">
        Last 20 data points
      </div>
    </div>
  )
}