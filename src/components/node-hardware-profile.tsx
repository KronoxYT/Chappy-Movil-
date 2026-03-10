'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { 
  Cpu, 
  HardDrive, 
  Monitor, 
  Server,
  MemoryStick,
  User,
  Shield,
  Settings
} from 'lucide-react'

interface HardwareProfile {
  timestamp?: string
  hostname?: string
  ip_local?: string
  cpu?: {
    modelo?: string
    fabricante?: string
    nucleos_fisicos?: number
    hilos_logicos?: number
    frecuencia_max_mhz?: number
    frecuencia_actual_mhz?: number
    uso_actual_porcentaje?: number
    cache_l2_kb?: number | string
    cache_l3_kb?: number | string
    arquitectura?: string
  }
  ram?: {
    total_gb?: number
    usado_gb?: number
    libre_gb?: number
    uso_porcentaje?: number
    disponible_gb?: number
  }
  discos?: Record<string, {
    nombre?: string
    total_gb?: number
    usado_gb?: number
    libre_gb?: number
    uso_porcentaje?: number
    tipo?: string
    sistema_archivos?: string
  }>
  gpu?: Record<string, {
    nombre?: string
    fabricante?: string
    memoria_total_mb?: number | string
    driver_version?: string
    status?: string
    uso_porcentaje?: number | string
  }> | { modelo?: string; memoria?: string }
  acceso?: {
    usuario?: string
    dominio?: string
    es_administrador?: boolean
    uptime_sesion?: string
    sistema_operativo?: string
    nombre_computadora?: string
    privilegios_elevados?: string
  }
}

interface NodeData {
  id: string
  name: string
  ipAddress: string
  status: string
  hardwareProfile?: string | null
  cpuModel?: string | null
  cpuCores?: number | null
  cpuThreads?: number | null
  cpuMaxFreq?: number | null
  cpuCurrentFreq?: number | null
  cpuUsage: number
  gpuModel?: string | null
  gpuMemory?: number | null
  gpuUsage: number
  totalRam?: number | null
  ramUsage: number
  osInfo?: string | null
  hostname?: string | null
  macAddress?: string | null
  isLinked: boolean
  linkedAt?: Date | null
}

// Components defined outside render
const SectionCard = ({ 
  title, 
  icon: Icon, 
  color, 
  children 
}: { 
  title: string
  icon: React.ElementType
  color: string
  children: React.ReactNode
}) => (
  <Card className="bg-card/50 border-border">
    <CardHeader className="pb-3">
      <CardTitle className={cn("text-lg flex items-center gap-2", color)}>
        <Icon className="w-5 h-5" />
        {title}
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-3">
      {children}
    </CardContent>
  </Card>
)

const MetricRow = ({ label, value, unit = '' }: { label: string; value?: string | number | null; unit?: string }) => (
  <div className="flex justify-between items-center text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-mono">
      {value !== null && value !== undefined ? `${value}${unit}` : 'N/A'}
    </span>
  </div>
)

const ProgressBar = ({ label, value, color = 'primary' }: { label: string; value: number; color?: string }) => (
  <div className="space-y-1">
    <div className="flex justify-between text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-mono">{value.toFixed(1)}%</span>
    </div>
    <Progress 
      value={value} 
      className={cn(
        "h-2",
        color === 'primary' && "[&>div]:bg-primary",
        color === 'success' && "[&>div]:bg-success",
        color === 'warning' && "[&>div]:bg-warning",
        color === 'danger' && "[&>div]:bg-destructive"
      )}
    />
  </div>
)

const QuickStatCard = ({ icon: Icon, label, value, color }: { 
  icon: React.ElementType
  label: string
  value: string | number
  color: string
}) => (
  <Card className="bg-card/30 p-3">
    <div className="flex items-center gap-2 mb-1">
      <Icon className={cn("w-4 h-4", color)} />
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
    <span className="text-xl font-bold">{value}</span>
  </Card>
)

export function NodeHardwareProfile({ node }: { node: NodeData }) {
  // Parse hardware profile
  let profile: HardwareProfile = {}
  try {
    if (node.hardwareProfile) {
      profile = JSON.parse(node.hardwareProfile)
    }
  } catch (e) {
    console.error('Failed to parse hardware profile')
  }

  // Calculate health score
  const healthScore = Math.round(
    (100 - node.cpuUsage) * 0.4 + 
    (100 - node.ramUsage) * 0.3 + 
    (100 - node.gpuUsage) * 0.3
  )

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border">
        <div className="flex items-center gap-3">
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            node.status === 'online' ? "bg-success/20" : "bg-destructive/20"
          )}>
            <Server className={cn(
              "w-6 h-6",
              node.status === 'online' ? "text-success" : "text-destructive"
            )} />
          </div>
          <div>
            <h3 className="text-lg font-bold">{node.name}</h3>
            <p className="text-sm text-muted-foreground font-mono">{node.ipAddress}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge 
            variant="outline"
            className={cn(
              node.status === 'online' && "border-success text-success",
              node.status === 'offline' && "border-destructive text-destructive",
              node.status === 'degraded' && "border-warning text-warning"
            )}
          >
            {node.status.toUpperCase()}
          </Badge>
          {node.isLinked && (
            <Badge className="bg-primary/20 text-primary border-primary/50">
              <Shield className="w-3 h-3 mr-1" />
              Linked
            </Badge>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-4 gap-3">
        <QuickStatCard icon={Cpu} label="CPU" value={`${node.cpuUsage.toFixed(0)}%`} color="text-chart-2" />
        <QuickStatCard icon={MemoryStick} label="RAM" value={`${node.ramUsage.toFixed(0)}%`} color="text-chart-3" />
        <QuickStatCard icon={Monitor} label="GPU" value={`${node.gpuUsage.toFixed(0)}%`} color="text-chart-4" />
        <QuickStatCard icon={Server} label="Score" value={healthScore} color="text-primary" />
      </div>

      {/* Detailed Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* CPU Details */}
        <SectionCard title="CPU" icon={Cpu} color="text-chart-2">
          <MetricRow label="Model" value={profile.cpu?.modelo || node.cpuModel} />
          <MetricRow label="Cores / Threads" value={`${profile.cpu?.nucleos_fisicos || node.cpuCores || '-'}/${profile.cpu?.hilos_logicos || node.cpuThreads || '-'}`} />
          <MetricRow label="Max Frequency" value={profile.cpu?.frecuencia_max_mhz || node.cpuMaxFreq} unit=" MHz" />
          <MetricRow label="Current Frequency" value={profile.cpu?.frecuencia_actual_mhz || node.cpuCurrentFreq} unit=" MHz" />
          <MetricRow label="Architecture" value={profile.cpu?.arquitectura} />
          <ProgressBar 
            label="Usage" 
            value={profile.cpu?.uso_actual_porcentaje || node.cpuUsage} 
            color={node.cpuUsage > 80 ? 'danger' : node.cpuUsage > 60 ? 'warning' : 'success'}
          />
        </SectionCard>

        {/* RAM Details */}
        <SectionCard title="Memory" icon={MemoryStick} color="text-chart-3">
          <MetricRow label="Total" value={profile.ram?.total_gb || node.totalRam} unit=" GB" />
          <MetricRow label="Used" value={profile.ram?.usado_gb} unit=" GB" />
          <MetricRow label="Free" value={profile.ram?.libre_gb} unit=" GB" />
          <MetricRow label="Available" value={profile.ram?.disponible_gb} unit=" GB" />
          <ProgressBar 
            label="Usage" 
            value={profile.ram?.uso_porcentaje || node.ramUsage}
            color={node.ramUsage > 80 ? 'danger' : node.ramUsage > 60 ? 'warning' : 'success'}
          />
        </SectionCard>

        {/* GPU Details */}
        <SectionCard title="GPU" icon={Monitor} color="text-chart-4">
          {profile.gpu && !('modelo' in profile.gpu) ? (
            Object.entries(profile.gpu).map(([id, gpu]) => (
              <div key={id} className="space-y-2 pb-2 border-b border-border last:border-0">
                <MetricRow label="Name" value={gpu.nombre} />
                <MetricRow label="Memory" value={gpu.memoria_total_mb} unit=" MB" />
                <MetricRow label="Driver" value={gpu.driver_version} />
                <MetricRow label="Status" value={gpu.status} />
              </div>
            ))
          ) : (
            <>
              <MetricRow label="Model" value={node.gpuModel || (profile.gpu as { modelo?: string })?.modelo} />
              <MetricRow label="Memory" value={node.gpuMemory} unit=" MB" />
              <ProgressBar 
                label="Usage" 
                value={node.gpuUsage}
                color={node.gpuUsage > 90 ? 'danger' : node.gpuUsage > 70 ? 'warning' : 'success'}
              />
            </>
          )}
        </SectionCard>

        {/* Storage Details */}
        <SectionCard title="Storage" icon={HardDrive} color="text-chart-5">
          {profile.discos ? (
            Object.entries(profile.discos).map(([letter, disk]) => (
              <div key={letter} className="space-y-2 pb-3 border-b border-border last:border-0">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{letter} {disk.nombre}</span>
                  <Badge variant="outline" className="text-xs">{disk.tipo}</Badge>
                </div>
                <MetricRow label="Total" value={disk.total_gb} unit=" GB" />
                <MetricRow label="Used" value={disk.usado_gb} unit=" GB" />
                <ProgressBar 
                  label="Usage" 
                  value={disk.uso_porcentaje || 0}
                  color={(disk.uso_porcentaje || 0) > 90 ? 'danger' : (disk.uso_porcentaje || 0) > 70 ? 'warning' : 'success'}
                />
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-sm">No disk information available</p>
          )}
        </SectionCard>

        {/* System Info */}
        <SectionCard title="System" icon={Settings} color="text-primary">
          <MetricRow label="Hostname" value={profile.hostname || node.hostname} />
          <MetricRow label="IP Address" value={profile.ip_local || node.ipAddress} />
          <MetricRow label="MAC Address" value={node.macAddress} />
          <MetricRow label="OS" value={profile.acceso?.sistema_operativo || node.osInfo} />
          <MetricRow label="Domain" value={profile.acceso?.dominio} />
          <MetricRow label="Uptime" value={profile.acceso?.uptime_sesion} />
        </SectionCard>

        {/* Access Info */}
        <SectionCard title="Access" icon={User} color="text-warning">
          <MetricRow label="User" value={profile.acceso?.usuario} />
          <div className="flex justify-between items-center text-sm">
            <span className="text-muted-foreground">Administrator</span>
            <Badge variant={profile.acceso?.es_administrador ? "default" : "secondary"}>
              {profile.acceso?.es_administrador ? 'Yes' : 'No'}
            </Badge>
          </div>
          <MetricRow label="Privileges" value={profile.acceso?.privilegios_elevados} />
          <MetricRow label="Computer Name" value={profile.acceso?.nombre_computadora} />
          {node.linkedAt && (
            <MetricRow label="Linked At" value={new Date(node.linkedAt).toLocaleString()} />
          )}
        </SectionCard>
      </div>
    </div>
  )
}
