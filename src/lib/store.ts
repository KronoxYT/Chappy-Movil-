import { create } from 'zustand'

export interface Node {
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
  // Extended fields
  hardwareProfile?: string | null
  cpuModel?: string | null
  cpuCores?: number | null
  cpuThreads?: number | null
  cpuMaxFreq?: number | null
  cpuCurrentFreq?: number | null
  gpuMemory?: number | null
  diskTotal?: number | null
  diskUsed?: number | null
  diskType?: string | null
  osInfo?: string | null
  hostname?: string | null
  macAddress?: string | null
  isLinked?: boolean
  linkedAt?: Date | null
}

export interface SystemMetric {
  timestamp: Date
  totalCpu: number
  totalRam: number
  avgGpu: number
  activeNodes: number
  totalNodes: number
  networkLoad: number
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface Conversation {
  id: string
  title: string | null
  messages: ChatMessage[]
  createdAt: Date
  updatedAt: Date
}

export interface TrainingTask {
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

export interface NodeLog {
  id: string
  nodeId: string
  level: 'info' | 'warning' | 'error'
  message: string
  timestamp: Date
}

export interface LinkingCode {
  id: string
  code: string
  type: 'manual' | 'qr'
  status: 'pending' | 'used' | 'expired'
  expiresAt: Date
  nodeId?: string
}

interface AppState {
  // Auth
  isAuthenticated: boolean
  authToken: string | null
  setAuthToken: (token: string | null) => void
  
  // Connection
  isConnected: boolean
  isConnecting: boolean
  connectionError: string | null
  setConnectionStatus: (connected: boolean, connecting?: boolean, error?: string | null) => void
  
  // View
  activeView: 'dashboard' | 'nodes' | 'ai-control' | 'memory'
  setActiveView: (view: 'dashboard' | 'nodes' | 'ai-control' | 'memory') => void
  
  // System
  systemStatus: 'online' | 'degraded' | 'offline'
  setSystemStatus: (status: 'online' | 'degraded' | 'offline') => void
  
  // Nodes
  nodes: Node[]
  setNodes: (nodes: Node[]) => void
  updateNode: (id: string, updates: Partial<Node>) => void
  addNode: (node: Node) => void
  removeNode: (id: string) => void
  selectedNodeId: string | null
  setSelectedNodeId: (id: string | null) => void
  
  // Metrics
  metrics: SystemMetric[]
  addMetric: (metric: SystemMetric) => void
  
  // Chat
  chatMessages: ChatMessage[]
  addChatMessage: (message: ChatMessage) => void
  clearChat: () => void
  
  // Conversations
  conversations: Conversation[]
  setConversations: (conversations: Conversation[]) => void
  selectedConversationId: string | null
  setSelectedConversationId: (id: string | null) => void
  
  // Training
  trainingTask: TrainingTask | null
  setTrainingTask: (task: TrainingTask | null) => void
  updateTrainingProgress: (progress: Partial<TrainingTask>) => void
  
  // Node Logs
  nodeLogs: NodeLog[]
  addNodeLog: (log: NodeLog) => void
  
  // Settings
  websocketUrl: string
  setWebsocketUrl: (url: string) => void
  notifications: { id: string; type: 'info' | 'warning' | 'error' | 'success'; message: string; timestamp: Date }[]
  addNotification: (notification: Omit<AppState['notifications'][0], 'id' | 'timestamp'>) => void
  removeNotification: (id: string) => void
  
  // Linking
  linkingCodes: LinkingCode[]
  addLinkingCode: (code: LinkingCode) => void
  updateLinkingCode: (code: string, updates: Partial<LinkingCode>) => void
}

export const useAppStore = create<AppState>((set) => ({
  // Auth
  isAuthenticated: false,
  authToken: null,
  setAuthToken: (token) => set({ authToken: token, isAuthenticated: !!token }),
  
  // Connection
  isConnected: false,
  isConnecting: false,
  connectionError: null,
  setConnectionStatus: (connected, connecting = false, error = null) => 
    set({ isConnected: connected, isConnecting: connecting, connectionError: error }),
  
  // View
  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view }),
  
  // System
  systemStatus: 'offline',
  setSystemStatus: (status) => set({ systemStatus: status }),
  
  // Nodes
  nodes: [],
  setNodes: (nodes) => set({ nodes }),
  updateNode: (id, updates) => set((state) => ({
    nodes: state.nodes.map((node) => 
      node.id === id ? { ...node, ...updates } : node
    )
  })),
  addNode: (node) => set((state) => ({
    nodes: [...state.nodes, node]
  })),
  removeNode: (id) => set((state) => ({
    nodes: state.nodes.filter(n => n.id !== id)
  })),
  selectedNodeId: null,
  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  
  // Metrics
  metrics: [],
  addMetric: (metric) => set((state) => ({
    metrics: [...state.metrics.slice(-60), metric]
  })),
  
  // Chat
  chatMessages: [],
  addChatMessage: (message) => set((state) => ({
    chatMessages: [...state.chatMessages, message]
  })),
  clearChat: () => set({ chatMessages: [] }),
  
  // Conversations
  conversations: [],
  setConversations: (conversations) => set({ conversations }),
  selectedConversationId: null,
  setSelectedConversationId: (id) => set({ selectedConversationId: id }),
  
  // Training
  trainingTask: null,
  setTrainingTask: (task) => set({ trainingTask: task }),
  updateTrainingProgress: (progress) => set((state) => ({
    trainingTask: state.trainingTask ? { ...state.trainingTask, ...progress } : null
  })),
  
  // Node Logs
  nodeLogs: [],
  addNodeLog: (log) => set((state) => ({
    nodeLogs: [...state.nodeLogs.slice(-100), log]
  })),
  
  // Settings
  websocketUrl: 'ws://localhost:3003',
  setWebsocketUrl: (url) => set({ websocketUrl: url }),
  notifications: [],
  addNotification: (notification) => set((state) => ({
    notifications: [...state.notifications, { 
      ...notification, 
      id: Date.now().toString(), 
      timestamp: new Date() 
    }]
  })),
  removeNotification: (id) => set((state) => ({
    notifications: state.notifications.filter((n) => n.id !== id)
  })),
  
  // Linking
  linkingCodes: [],
  addLinkingCode: (code) => set((state) => ({
    linkingCodes: [...state.linkingCodes, code]
  })),
  updateLinkingCode: (code, updates) => set((state) => ({
    linkingCodes: state.linkingCodes.map((c) => 
      c.code === code ? { ...c, ...updates } : c
    )
  }))
}))
