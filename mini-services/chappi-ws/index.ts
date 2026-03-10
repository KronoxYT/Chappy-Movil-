import { Server } from 'socket.io'
import { createServer } from 'http'
import { randomUUID } from 'crypto'

const PORT = 3003

// Extended node interface with hardware profile
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
  }
  discos?: Record<string, any>
  gpu?: Record<string, any> | { modelo?: string }
  acceso?: {
    usuario?: string
    dominio?: string
    es_administrador?: boolean
    sistema_operativo?: string
    uptime_sesion?: string
  }
}

interface Node {
  id: string
  name: string
  ipAddress: string
  status: 'online' | 'offline' | 'degraded'
  cpuUsage: number
  ramUsage: number
  gpuUsage: number
  totalRam: number
  gpuModel: string | null
  processes: string[]
  lastHeartbeat: Date | null
  token?: string
  hardwareProfile?: HardwareProfile
  cpuModel?: string
  cpuCores?: number
  cpuThreads?: number
  cpuMaxFreq?: number
  cpuCurrentFreq?: number
  gpuMemory?: number
  osInfo?: string
  hostname?: string
  macAddress?: string
  isLinked?: boolean
  linkedAt?: Date | null
}

interface TrainingTask {
  id: string
  name: string
  status: 'idle' | 'running' | 'paused' | 'completed' | 'error'
  progress: number
  currentEpoch: number
  totalEpochs: number
  loss: number | null
  accuracy: number | null
  learningRate: number
  batchSize: number
  startedAt: Date | null
  completedAt: Date | null
}

interface LinkingCode {
  code: string
  type: 'manual' | 'qr'
  status: 'pending' | 'used' | 'expired'
  nodeId?: string
  expiresAt: Date
  createdAt: Date
}

// In-memory storage
const nodes: Map<string, Node> = new Map()
const linkingCodes: Map<string, LinkingCode> = new Map()

// Initialize with demo nodes
const initNodes: Node[] = [
  {
    id: 'node-1',
    name: 'Chappi-Master',
    ipAddress: '192.168.1.100',
    status: 'online',
    cpuUsage: 45,
    ramUsage: 62,
    gpuUsage: 78,
    totalRam: 64,
    gpuModel: 'NVIDIA RTX 4090',
    processes: ['chappi-core', 'model-server', 'api-gateway'],
    lastHeartbeat: new Date(),
    cpuModel: 'Intel Core i9-13900K',
    cpuCores: 24,
    cpuThreads: 32,
    cpuMaxFreq: 5800,
    gpuMemory: 24576,
    osInfo: 'Windows 11 Pro',
    hostname: 'CHAPPI-MASTER',
    isLinked: true,
    linkedAt: new Date(),
    hardwareProfile: {
      cpu: { modelo: 'Intel Core i9-13900K', nucleos_fisicos: 24, hilos_logicos: 32, frecuencia_max_mhz: 5800 },
      ram: { total_gb: 64, uso_porcentaje: 62 },
      gpu: { GPU_0: { nombre: 'NVIDIA RTX 4090', memoria_total_mb: 24576 } },
      acceso: { usuario: 'Admin', es_administrador: true, sistema_operativo: 'Windows 11 Pro' }
    }
  },
  {
    id: 'node-2',
    name: 'Worker-Alpha',
    ipAddress: '192.168.1.101',
    status: 'online',
    cpuUsage: 32,
    ramUsage: 45,
    gpuUsage: 85,
    totalRam: 32,
    gpuModel: 'NVIDIA RTX 3080',
    processes: ['chappi-worker', 'data-processor'],
    lastHeartbeat: new Date(),
    cpuModel: 'AMD Ryzen 9 5900X',
    cpuCores: 12,
    cpuThreads: 24,
    cpuMaxFreq: 4700,
    gpuMemory: 10240,
    osInfo: 'Windows 11 Pro',
    hostname: 'WORKER-ALPHA',
    isLinked: true,
    linkedAt: new Date()
  },
  {
    id: 'node-3',
    name: 'Worker-Beta',
    ipAddress: '192.168.1.102',
    status: 'online',
    cpuUsage: 28,
    ramUsage: 38,
    gpuUsage: 92,
    totalRam: 32,
    gpuModel: 'NVIDIA RTX 3080',
    processes: ['chappi-worker', 'inference-engine'],
    lastHeartbeat: new Date(),
    cpuModel: 'Intel Core i7-12700K',
    cpuCores: 12,
    cpuThreads: 20,
    cpuMaxFreq: 5000,
    gpuMemory: 10240,
    osInfo: 'Windows 11 Pro',
    hostname: 'WORKER-BETA',
    isLinked: true,
    linkedAt: new Date()
  },
  {
    id: 'node-4',
    name: 'Worker-Gamma',
    ipAddress: '192.168.1.103',
    status: 'degraded',
    cpuUsage: 15,
    ramUsage: 22,
    gpuUsage: 0,
    totalRam: 16,
    gpuModel: 'NVIDIA GTX 1080',
    processes: ['chappi-worker'],
    lastHeartbeat: new Date(),
    cpuModel: 'Intel Core i5-10400',
    cpuCores: 6,
    cpuThreads: 12,
    cpuMaxFreq: 4300,
    gpuMemory: 8192,
    osInfo: 'Windows 10 Pro',
    hostname: 'WORKER-GAMMA',
    isLinked: true,
    linkedAt: new Date()
  },
  {
    id: 'node-5',
    name: 'Storage-Node',
    ipAddress: '192.168.1.104',
    status: 'online',
    cpuUsage: 8,
    ramUsage: 35,
    gpuUsage: 0,
    totalRam: 128,
    gpuModel: null,
    processes: ['storage-service', 'backup-manager'],
    lastHeartbeat: new Date(),
    cpuModel: 'AMD EPYC 7302P',
    cpuCores: 16,
    cpuThreads: 32,
    cpuMaxFreq: 3000,
    osInfo: 'Windows Server 2022',
    hostname: 'STORAGE-NODE',
    isLinked: true,
    linkedAt: new Date()
  },
  {
    id: 'node-6',
    name: 'Worker-Delta',
    ipAddress: '192.168.1.105',
    status: 'offline',
    cpuUsage: 0,
    ramUsage: 0,
    gpuUsage: 0,
    totalRam: 32,
    gpuModel: 'NVIDIA RTX 3070',
    processes: [],
    lastHeartbeat: null,
    cpuModel: 'AMD Ryzen 7 5800X',
    cpuCores: 8,
    cpuThreads: 16,
    cpuMaxFreq: 4700,
    gpuMemory: 8192,
    osInfo: 'Windows 11 Pro',
    hostname: 'WORKER-DELTA',
    isLinked: false
  }
]

initNodes.forEach(node => nodes.set(node.id, node))

// Training task state
let trainingTask: TrainingTask = {
  id: 'training-1',
  name: 'Chappi Model Training',
  status: 'idle',
  progress: 0,
  currentEpoch: 0,
  totalEpochs: 100,
  loss: null,
  accuracy: null,
  learningRate: 0.001,
  batchSize: 32,
  startedAt: null,
  completedAt: null
}

// Create HTTP server and Socket.IO
const httpServer = createServer()
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
    credentials: true
  },
  allowEIO3: true,
  transports: ['websocket', 'polling']
})

// Helper functions
function randomVariation(value: number, range: number): number {
  return Math.max(0, Math.min(100, value + (Math.random() - 0.5) * range * 2))
}

function updateNodeMetrics(): void {
  nodes.forEach((node) => {
    if (node.status === 'online') {
      node.cpuUsage = randomVariation(node.cpuUsage, 5)
      node.ramUsage = randomVariation(node.ramUsage, 3)
      if (node.gpuModel) {
        node.gpuUsage = randomVariation(node.gpuUsage, 8)
      }
      node.lastHeartbeat = new Date()
    } else if (node.status === 'degraded') {
      node.cpuUsage = randomVariation(node.cpuUsage, 2)
      node.ramUsage = randomVariation(node.ramUsage, 1)
      node.gpuUsage = 0
    }
  })
}

function getSystemMetric() {
  const onlineNodes = Array.from(nodes.values()).filter(n => n.status === 'online')
  const totalCpu = onlineNodes.reduce((sum, n) => sum + n.cpuUsage, 0) / (onlineNodes.length || 1)
  const totalRam = onlineNodes.reduce((sum, n) => sum + n.ramUsage, 0) / (onlineNodes.length || 1)
  const gpuNodes = onlineNodes.filter(n => n.gpuUsage > 0)
  const avgGpu = gpuNodes.reduce((sum, n) => sum + n.gpuUsage, 0) / (gpuNodes.length || 1)
  
  return {
    timestamp: new Date(),
    totalCpu,
    totalRam,
    avgGpu,
    activeNodes: onlineNodes.length,
    totalNodes: nodes.size,
    networkLoad: (totalCpu + avgGpu) / 2
  }
}

function generateLinkingCode(): string {
  return Math.random().toString(36).substring(2, 6).toUpperCase() + 
         Math.random().toString(36).substring(2, 6).toUpperCase()
}

// AI response simulation
const aiResponses = [
  "I've analyzed the network status. All systems are operating within normal parameters.",
  "The current training progress shows promising results. Loss is decreasing steadily.",
  "I recommend increasing the batch size to optimize GPU utilization on Worker nodes.",
  "Node Gamma is experiencing degraded performance. I suggest running diagnostics.",
  "Memory consolidation complete. All conversations have been backed up successfully.",
  "The distributed inference pipeline is now active across 3 nodes.",
  "I've detected an anomaly in the data preprocessing stage. Investigating...",
  "Training checkpoint saved. You can safely pause and resume later.",
  "Network latency has improved by 15% after the last optimization cycle.",
  "All worker nodes have synchronized their model weights successfully."
]

function getRandomAIResponse(): string {
  return aiResponses[Math.floor(Math.random() * aiResponses.length)]
}

// Convert nodes map to array
function getNodesArray() {
  return Array.from(nodes.values()).map(n => ({
    ...n,
    lastHeartbeat: n.lastHeartbeat?.toISOString(),
    linkedAt: n.linkedAt?.toISOString(),
    hardwareProfile: n.hardwareProfile ? JSON.stringify(n.hardwareProfile) : null
  }))
}

// Connection handling
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id}`)
  
  // Send initial data
  socket.emit('system:status', { status: 'online' })
  socket.emit('nodes:list', getNodesArray())
  socket.emit('training:status', {
    ...trainingTask,
    startedAt: trainingTask.startedAt?.toISOString(),
    completedAt: trainingTask.completedAt?.toISOString()
  })
  
  // ==================== LINKING ====================
  
  socket.on('linking:generate', (data: { type?: 'manual' | 'qr', expiresIn?: number }) => {
    const code = generateLinkingCode()
    const expiresIn = data.expiresIn || 300
    
    const linkingCode: LinkingCode = {
      code,
      type: data.type || 'qr',
      status: 'pending',
      expiresAt: new Date(Date.now() + expiresIn * 1000),
      createdAt: new Date()
    }
    
    linkingCodes.set(code, linkingCode)
    
    socket.emit('linking:generated', {
      code,
      type: linkingCode.type,
      expiresAt: linkingCode.expiresAt.toISOString()
    })
    
    console.log(`Generated linking code: ${code}`)
  })
  
  socket.on('linking:validate', (data: {
    code: string
    hostname?: string
    ip?: string
    mac?: string
    hardwareProfile?: HardwareProfile
  }) => {
    const linkingCode = linkingCodes.get(data.code.toUpperCase())
    
    if (!linkingCode) {
      socket.emit('linking:error', { error: 'Invalid code' })
      return
    }
    
    if (linkingCode.status !== 'pending') {
      socket.emit('linking:error', { error: 'Code already used or expired' })
      return
    }
    
    if (new Date() > linkingCode.expiresAt) {
      linkingCode.status = 'expired'
      socket.emit('linking:error', { error: 'Code expired' })
      return
    }
    
    // Create new node
    const nodeId = `node-${randomUUID().substring(0, 8)}`
    const profile = data.hardwareProfile || {}
    const token = randomUUID()
    
    const newNode: Node = {
      id: nodeId,
      name: data.hostname || `Node-${nodeId}`,
      ipAddress: data.ip || '0.0.0.0',
      status: 'online',
      cpuUsage: profile.cpu?.uso_actual_porcentaje || 0,
      ramUsage: profile.ram?.uso_porcentaje || 0,
      gpuUsage: 0,
      totalRam: profile.ram?.total_gb || 0,
      gpuModel: null,
      processes: [],
      lastHeartbeat: new Date(),
      token,
      hardwareProfile: profile,
      cpuModel: profile.cpu?.modelo,
      cpuCores: profile.cpu?.nucleos_fisicos,
      cpuThreads: profile.cpu?.hilos_logicos,
      cpuMaxFreq: profile.cpu?.frecuencia_max_mhz,
      osInfo: profile.acceso?.sistema_operativo,
      hostname: data.hostname,
      macAddress: data.mac,
      isLinked: true,
      linkedAt: new Date()
    }
    
    nodes.set(nodeId, newNode)
    
    // Update linking code
    linkingCode.status = 'used'
    linkingCode.nodeId = nodeId
    
    // Notify all clients
    io.emit('node:linked', {
      nodeId,
      node: { ...newNode, lastHeartbeat: newNode.lastHeartbeat?.toISOString(), linkedAt: newNode.linkedAt?.toISOString() }
    })
    
    socket.emit('linking:success', {
      nodeId,
      token,
      message: `Node ${newNode.name} linked successfully`
    })
    
    console.log(`Node linked: ${newNode.name} (${nodeId})`)
  })
  
  // ==================== CHAT ====================
  
  socket.on('chat:send', (data: { content: string }) => {
    socket.emit('chat:message', {
      id: `msg-${Date.now()}`,
      role: 'user',
      content: data.content,
      timestamp: new Date().toISOString()
    })
    
    setTimeout(() => {
      socket.emit('chat:message', {
        id: `msg-${Date.now() + 1}`,
        role: 'assistant',
        content: getRandomAIResponse(),
        timestamp: new Date().toISOString()
      })
    }, 1000 + Math.random() * 1500)
  })
  
  // ==================== TRAINING ====================
  
  socket.on('training:start', () => {
    trainingTask.status = 'running'
    trainingTask.startedAt = new Date()
    trainingTask.progress = 0
    trainingTask.currentEpoch = 0
    
    io.emit('training:status', {
      ...trainingTask,
      startedAt: trainingTask.startedAt.toISOString()
    })
  })
  
  socket.on('training:pause', () => {
    trainingTask.status = 'paused'
    io.emit('training:status', trainingTask)
  })
  
  socket.on('training:stop', () => {
    trainingTask.status = 'idle'
    trainingTask.progress = 0
    trainingTask.currentEpoch = 0
    trainingTask.loss = null
    trainingTask.accuracy = null
    trainingTask.startedAt = null
    
    io.emit('training:status', trainingTask)
  })
  
  socket.on('training:config', (data: { learningRate?: number; batchSize?: number }) => {
    if (data.learningRate) trainingTask.learningRate = data.learningRate
    if (data.batchSize) trainingTask.batchSize = data.batchSize
    io.emit('training:status', trainingTask)
  })
  
  // ==================== NODE CONTROL ====================
  
  socket.on('node:control', (data: { nodeId: string; action: string }) => {
    const node = nodes.get(data.nodeId)
    if (node) {
      if (data.action === 'power_on') {
        node.status = 'online'
        node.lastHeartbeat = new Date()
        node.cpuUsage = 15
        node.ramUsage = 25
      } else if (data.action === 'power_off') {
        node.status = 'offline'
        node.cpuUsage = 0
        node.ramUsage = 0
        node.gpuUsage = 0
        node.lastHeartbeat = null
      } else if (data.action === 'restart') {
        node.status = 'online'
        node.cpuUsage = 10
        node.ramUsage = 20
        node.lastHeartbeat = new Date()
      }
      
      io.emit('node:update', {
        id: node.id,
        status: node.status,
        cpuUsage: node.cpuUsage,
        ramUsage: node.ramUsage,
        gpuUsage: node.gpuUsage,
        lastHeartbeat: node.lastHeartbeat?.toISOString()
      })
      
      io.emit('node:log', {
        id: `log-${Date.now()}`,
        nodeId: node.id,
        level: 'info',
        message: `Node ${data.action} command executed`,
        timestamp: new Date().toISOString()
      })
    }
  })
  
  socket.on('node:command', (data: { nodeId: string; command: string }) => {
    setTimeout(() => {
      io.emit('node:log', {
        id: `log-${Date.now()}`,
        nodeId: data.nodeId,
        level: 'info',
        message: `Command executed: ${data.command}`,
        timestamp: new Date().toISOString()
      })
    }, 500)
  })
  
  // ==================== HEARTBEAT ====================
  
  socket.on('node:heartbeat', (data: { nodeId: string; token: string; metrics: any }) => {
    const node = nodes.get(data.nodeId)
    if (node && node.token === data.token) {
      node.lastHeartbeat = new Date()
      node.cpuUsage = data.metrics?.cpu || node.cpuUsage
      node.ramUsage = data.metrics?.ram || node.ramUsage
      node.gpuUsage = data.metrics?.gpu || node.gpuUsage
      node.status = 'online'
    }
  })
  
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`)
  })
})

// Periodic updates
setInterval(() => {
  updateNodeMetrics()
  io.emit('system:metric', getSystemMetric())
  
  nodes.forEach((node) => {
    io.emit('node:update', {
      id: node.id,
      cpuUsage: node.cpuUsage,
      ramUsage: node.ramUsage,
      gpuUsage: node.gpuUsage,
      lastHeartbeat: node.lastHeartbeat?.toISOString()
    })
  })
}, 2000)

// Training progress simulation
setInterval(() => {
  if (trainingTask.status === 'running') {
    trainingTask.currentEpoch++
    trainingTask.progress = (trainingTask.currentEpoch / trainingTask.totalEpochs) * 100
    
    const progress = trainingTask.currentEpoch / trainingTask.totalEpochs
    trainingTask.loss = 2.5 * Math.exp(-3 * progress) + 0.1 * Math.random()
    trainingTask.accuracy = 0.5 + 0.45 * (1 - Math.exp(-3 * progress)) + 0.02 * Math.random()
    
    if (trainingTask.currentEpoch >= trainingTask.totalEpochs) {
      trainingTask.status = 'completed'
      trainingTask.completedAt = new Date()
      trainingTask.progress = 100
    }
    
    io.emit('training:progress', {
      progress: trainingTask.progress,
      currentEpoch: trainingTask.currentEpoch,
      loss: trainingTask.loss,
      accuracy: trainingTask.accuracy,
      status: trainingTask.status,
      completedAt: trainingTask.completedAt?.toISOString()
    })
  }
}, 500)

// Cleanup expired linking codes
setInterval(() => {
  const now = new Date()
  linkingCodes.forEach((code, key) => {
    if (code.status === 'pending' && now > code.expiresAt) {
      code.status = 'expired'
    }
  })
}, 60000)

// Start server
httpServer.listen(PORT, () => {
  console.log(`Chappi WebSocket Service running on port ${PORT}`)
  console.log(`Features: Node Linking (QR/Manual), Hardware Profiles, Real-time Metrics`)
})
