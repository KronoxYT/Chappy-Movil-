'use client'

import { useState, useEffect } from 'react'
import { useAppStore, Node } from '@/lib/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { 
  Server, 
  Power, 
  RotateCcw, 
  MoreVertical,
  Wifi,
  WifiOff,
  AlertTriangle,
  Cpu,
  HardDrive,
  Monitor,
  Clock,
  Plus,
  Link2
} from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LinkingModal } from '@/components/linking-modal'
import { NodeHardwareProfile } from '@/components/node-hardware-profile'

// Extended node type with hardware profile
interface ExtendedNode extends Node {
  hardwareProfile?: string | null
  cpuModel?: string | null
  cpuCores?: number | null
  cpuThreads?: number | null
  cpuMaxFreq?: number | null
  gpuMemory?: number | null
  osInfo?: string | null
  hostname?: string | null
  macAddress?: string | null
  isLinked?: boolean
  linkedAt?: string | null
}

export function NodesView() {
  const { 
    nodes, 
    selectedNodeId, 
    setSelectedNodeId, 
    controlNode,
    executeCommand,
    isConnected 
  } = useAppStore()
  
  const [commandInput, setCommandInput] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [linkingModalOpen, setLinkingModalOpen] = useState(false)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)
  const [selectedNodeData, setSelectedNodeData] = useState<ExtendedNode | null>(null)

  const fetchNodeDetails = async (nodeId: string) => {
    try {
      const response = await fetch(`/api/nodes/${nodeId}`)
      if (response.ok) {
        const data = await response.json()
        setSelectedNodeData(data)
      }
    } catch (error) {
      console.error('Failed to fetch node details:', error)
    }
  }

  const handleControl = async (action: 'power_on' | 'power_off' | 'restart') => {
    if (!selectedNodeId) return
    controlNode(selectedNodeId, action)
  }

  const handleExecuteCommand = async () => {
    if (!selectedNodeId || !commandInput.trim()) return
    setIsExecuting(true)
    executeCommand(selectedNodeId, commandInput)
    setCommandInput('')
    setTimeout(() => setIsExecuting(false), 500)
  }

  const handleNodeClick = (nodeId: string) => {
    setSelectedNodeId(nodeId)
    setDetailDialogOpen(true)
    fetchNodeDetails(nodeId)
  }

  const NodeCard = ({ node }: { node: Node }) => (
    <Card 
      className={cn(
        "bg-card/50 border-border card-hover cursor-pointer transition-all",
        selectedNodeId === node.id && "glow-border-cyan ring-1 ring-primary/50"
      )}
      onClick={() => handleNodeClick(node.id)}
    >
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              node.status === 'online' && "bg-success/10",
              node.status === 'offline' && "bg-destructive/10",
              node.status === 'degraded' && "bg-warning/10"
            )}>
              {node.status === 'online' && <Wifi className="w-5 h-5 text-success" />}
              {node.status === 'offline' && <WifiOff className="w-5 h-5 text-destructive" />}
              {node.status === 'degraded' && <AlertTriangle className="w-5 h-5 text-warning" />}
            </div>
            <div>
              <CardTitle className="text-base flex items-center gap-2">
                {node.name}
                {'isLinked' in node && node.isLinked && (
                  <Link2 className="w-3 h-3 text-primary" />
                )}
              </CardTitle>
              <CardDescription className="text-xs font-mono">{node.ipAddress}</CardDescription>
            </div>
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => controlNode(node.id, 'power_on')}>
                <Power className="w-4 h-4 mr-2" /> Power On
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => controlNode(node.id, 'power_off')}>
                <Power className="w-4 h-4 mr-2" /> Power Off
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => controlNode(node.id, 'restart')}>
                <RotateCcw className="w-4 h-4 mr-2" /> Restart Service
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3">
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
        </div>
        
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Cpu className="w-3 h-3" />
              <span>CPU</span>
            </div>
            <Progress value={node.cpuUsage} className="h-1.5" />
            <span className="font-mono">{node.cpuUsage.toFixed(1)}%</span>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <HardDrive className="w-3 h-3" />
              <span>RAM</span>
            </div>
            <Progress value={node.ramUsage} className="h-1.5" />
            <span className="font-mono">{node.ramUsage.toFixed(1)}%</span>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Monitor className="w-3 h-3" />
              <span>GPU</span>
            </div>
            <Progress value={node.gpuUsage} className="h-1.5" />
            <span className="font-mono">{node.gpuUsage.toFixed(1)}%</span>
          </div>
        </div>
        
        {node.processes && node.processes.length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground mb-1">Processes ({node.processes.length})</p>
            <div className="flex flex-wrap gap-1">
              {node.processes.slice(0, 3).map((proc, i) => (
                <Badge key={i} variant="secondary" className="text-xs">
                  {proc}
                </Badge>
              ))}
              {node.processes.length > 3 && (
                <Badge variant="secondary" className="text-xs">
                  +{node.processes.length - 3}
                </Badge>
              )}
            </div>
          </div>
        )}
        
        {node.lastHeartbeat && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Clock className="w-3 h-3" />
            <span>Last seen: {new Date(node.lastHeartbeat).toLocaleTimeString()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )

  return (
    <div className="p-6 space-y-6 animate-fade-in-up">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Node Management</h1>
          <p className="text-muted-foreground mt-1">Control and monitor individual nodes in the network</p>
        </div>
        
        <Button 
          onClick={() => setLinkingModalOpen(true)}
          className="gap-2"
        >
          <Plus className="w-4 h-4" />
          Link New Node
        </Button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-4 gap-4">
        <Card className="bg-success/10 border-success/30">
          <CardContent className="pt-4 flex items-center gap-3">
            <Wifi className="w-8 h-8 text-success" />
            <div>
              <p className="text-2xl font-bold text-success">
                {nodes.filter(n => n.status === 'online').length}
              </p>
              <p className="text-xs text-muted-foreground">Online</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-warning/10 border-warning/30">
          <CardContent className="pt-4 flex items-center gap-3">
            <AlertTriangle className="w-8 h-8 text-warning" />
            <div>
              <p className="text-2xl font-bold text-warning">
                {nodes.filter(n => n.status === 'degraded').length}
              </p>
              <p className="text-xs text-muted-foreground">Degraded</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-destructive/10 border-destructive/30">
          <CardContent className="pt-4 flex items-center gap-3">
            <WifiOff className="w-8 h-8 text-destructive" />
            <div>
              <p className="text-2xl font-bold text-destructive">
                {nodes.filter(n => n.status === 'offline').length}
              </p>
              <p className="text-xs text-muted-foreground">Offline</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-primary/10 border-primary/30">
          <CardContent className="pt-4 flex items-center gap-3">
            <Link2 className="w-8 h-8 text-primary" />
            <div>
              <p className="text-2xl font-bold text-primary">
                {nodes.filter(n => 'isLinked' in n && n.isLinked).length}
              </p>
              <p className="text-xs text-muted-foreground">Linked</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Nodes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nodes.map((node) => (
          <NodeCard key={node.id} node={node} />
        ))}
        
        {nodes.length === 0 && (
          <div className="col-span-full text-center py-12">
            <Server className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-muted-foreground">No nodes detected in the network</p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => setLinkingModalOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Link your first node
            </Button>
          </div>
        )}
      </div>

      {/* Linking Modal */}
      <LinkingModal 
        open={linkingModalOpen} 
        onOpenChange={setLinkingModalOpen}
        onLinked={(nodeId) => {
          fetchNodeDetails(nodeId)
        }}
      />

      {/* Node Detail Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Server className="w-5 h-5 text-primary" />
              Node Details
            </DialogTitle>
            <DialogDescription>
              Complete hardware profile and system information
            </DialogDescription>
          </DialogHeader>
          
          <ScrollArea className="max-h-[70vh] pr-4">
            {selectedNodeData ? (
              <NodeHardwareProfile node={{
                ...selectedNodeData,
                lastHeartbeat: selectedNodeData.lastHeartbeat ? new Date(selectedNodeData.lastHeartbeat) : null,
                linkedAt: selectedNodeData.linkedAt ? new Date(selectedNodeData.linkedAt) : null
              }} />
            ) : (
              <div className="text-center py-8">
                <Server className="w-12 h-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">Select a node to view details</p>
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}
