'use client'

import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  Cpu, 
  HardDrive, 
  Monitor, 
  Activity, 
  Server, 
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  XCircle
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart
} from 'recharts'
import { useMemo } from 'react'

// StatCard component moved outside render
const StatCard = ({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color,
  progress 
}: { 
  title: string
  value: string | number
  subtitle?: string
  icon: React.ElementType
  color: string
  progress?: number
}) => (
  <Card className="bg-card/50 border-border card-hover glow-border-cyan">
    <CardHeader className="flex flex-row items-center justify-between pb-2">
      <CardTitle className="text-sm font-medium text-muted-foreground">
        {title}
      </CardTitle>
      <div className={cn("p-2 rounded-lg", color)}>
        <Icon className="w-4 h-4" />
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold text-foreground">{value}</div>
      {subtitle && (
        <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
      )}
      {progress !== undefined && (
        <Progress 
          value={progress} 
          className="mt-2 h-1.5" 
        />
      )}
    </CardContent>
  </Card>
)

export function Dashboard() {
  const { nodes, metrics, systemStatus } = useAppStore()

  const onlineNodes = nodes.filter(n => n.status === 'online').length
  const offlineNodes = nodes.filter(n => n.status === 'offline').length
  const degradedNodes = nodes.filter(n => n.status === 'degraded').length

  // Calculate aggregate metrics
  const totalCpu = nodes.reduce((sum, n) => sum + n.cpuUsage, 0) / (nodes.length || 1)
  const totalRam = nodes.reduce((sum, n) => sum + n.ramUsage, 0) / (nodes.length || 1)
  const avgGpu = nodes.filter(n => n.gpuUsage > 0).reduce((sum, n) => sum + n.gpuUsage, 0) / (nodes.filter(n => n.gpuUsage > 0).length || 1)
  const totalRamGB = nodes.reduce((sum, n) => sum + n.totalRam, 0)

  // Use useMemo for chart data
  const chartData = useMemo(() => {
    return metrics.slice(-60).map((m) => ({
      time: new Date(m.timestamp).toLocaleTimeString(),
      cpu: m.totalCpu,
      ram: m.totalRam,
      gpu: m.avgGpu,
      load: m.networkLoad
    }))
  }, [metrics])

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">System Dashboard</h1>
          <p className="text-muted-foreground mt-1">Real-time monitoring of Chappi AI Network</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex items-center gap-2 px-4 py-2 rounded-lg border",
            systemStatus === 'online' && "border-success/50 bg-success/10",
            systemStatus === 'degraded' && "border-warning/50 bg-warning/10",
            systemStatus === 'offline' && "border-destructive/50 bg-destructive/10"
          )}>
            {systemStatus === 'online' && <CheckCircle2 className="w-5 h-5 text-success" />}
            {systemStatus === 'degraded' && <AlertTriangle className="w-5 h-5 text-warning" />}
            {systemStatus === 'offline' && <XCircle className="w-5 h-5 text-destructive" />}
            <span className={cn(
              "font-medium",
              systemStatus === 'online' && "text-success",
              systemStatus === 'degraded' && "text-warning",
              systemStatus === 'offline' && "text-destructive"
            )}>
              System {systemStatus.toUpperCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Active Nodes"
          value={`${onlineNodes}/${nodes.length}`}
          subtitle={`${offlineNodes} offline • ${degradedNodes} degraded`}
          icon={Server}
          color="bg-primary/20 text-primary"
          progress={nodes.length > 0 ? (onlineNodes / nodes.length) * 100 : 0}
        />
        <StatCard
          title="CPU Usage"
          value={`${totalCpu.toFixed(1)}%`}
          subtitle="Aggregate across network"
          icon={Cpu}
          color="bg-chart-2/20 text-chart-2"
          progress={totalCpu}
        />
        <StatCard
          title="RAM Usage"
          value={`${totalRam.toFixed(1)}%`}
          subtitle={`${totalRamGB.toFixed(1)} GB total`}
          icon={HardDrive}
          color="bg-chart-3/20 text-chart-3"
          progress={totalRam}
        />
        <StatCard
          title="GPU Usage"
          value={`${(avgGpu || 0).toFixed(1)}%`}
          subtitle="Average across nodes"
          icon={Monitor}
          color="bg-chart-4/20 text-chart-4"
          progress={avgGpu || 0}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Network Load Chart */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Network Load
            </CardTitle>
            <CardDescription>Real-time workload over the last 60 seconds</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorLoad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="oklch(0.75 0.15 195)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="oklch(0.75 0.15 195)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.03 250)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="oklch(0.65 0.02 250)" 
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="oklch(0.65 0.02 250)" 
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'oklch(0.12 0.015 250)',
                      border: '1px solid oklch(0.25 0.03 250)',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: 'oklch(0.95 0.02 250)' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="load" 
                    stroke="oklch(0.75 0.15 195)" 
                    strokeWidth={2}
                    fillOpacity={1} 
                    fill="url(#colorLoad)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Resource Usage Chart */}
        <Card className="bg-card/50 border-border">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Resource Usage
            </CardTitle>
            <CardDescription>CPU, RAM, and GPU utilization over time</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.03 250)" />
                  <XAxis 
                    dataKey="time" 
                    stroke="oklch(0.65 0.02 250)" 
                    fontSize={10}
                    tickLine={false}
                  />
                  <YAxis 
                    stroke="oklch(0.65 0.02 250)" 
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(value) => `${value}%`}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'oklch(0.12 0.015 250)',
                      border: '1px solid oklch(0.25 0.03 250)',
                      borderRadius: '8px'
                    }}
                    labelStyle={{ color: 'oklch(0.95 0.02 250)' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="cpu" 
                    stroke="oklch(0.65 0.2 150)" 
                    strokeWidth={2}
                    dot={false}
                    name="CPU"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="ram" 
                    stroke="oklch(0.7 0.18 280)" 
                    strokeWidth={2}
                    dot={false}
                    name="RAM"
                  />
                  <Line 
                    type="monotone" 
                    dataKey="gpu" 
                    stroke="oklch(0.75 0.2 50)" 
                    strokeWidth={2}
                    dot={false}
                    name="GPU"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-center gap-6 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'oklch(0.65 0.2 150)' }} />
                <span className="text-xs text-muted-foreground">CPU</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'oklch(0.7 0.18 280)' }} />
                <span className="text-xs text-muted-foreground">RAM</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: 'oklch(0.75 0.2 50)' }} />
                <span className="text-xs text-muted-foreground">GPU</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Node Overview Grid */}
      <Card className="bg-card/50 border-border">
        <CardHeader>
          <CardTitle className="text-lg">Node Overview</CardTitle>
          <CardDescription>Quick status of all nodes in the network</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {nodes.map((node) => (
              <div 
                key={node.id}
                className={cn(
                  "p-3 rounded-lg border transition-all cursor-pointer hover:scale-105",
                  node.status === 'online' && "border-success/50 bg-success/5",
                  node.status === 'offline' && "border-destructive/50 bg-destructive/5",
                  node.status === 'degraded' && "border-warning/50 bg-warning/5"
                )}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    node.status === 'online' && "status-online",
                    node.status === 'offline' && "status-offline",
                    node.status === 'degraded' && "status-degraded"
                  )} />
                  <span className="text-xs font-medium truncate">{node.name}</span>
                </div>
                <div className="text-xs text-muted-foreground truncate">{node.ipAddress}</div>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">CPU</span>
                    <span>{node.cpuUsage.toFixed(0)}%</span>
                  </div>
                  <Progress value={node.cpuUsage} className="h-1" />
                </div>
              </div>
            ))}
            
            {nodes.length === 0 && (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                <Server className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No nodes connected</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
