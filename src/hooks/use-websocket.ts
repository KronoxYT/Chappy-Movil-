'use client'

import { useEffect, useRef, useCallback, useState } from 'react'
import { useAppStore, Node, SystemMetric, ChatMessage, TrainingTask, NodeLog } from '@/lib/store'
import { io, Socket } from 'socket.io-client'

// Demo data for when WebSocket is not available
const DEMO_NODES: Node[] = [
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
    linkedAt: new Date()
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
    isLinked: true
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
    processes: ['chappi-worker'],
    lastHeartbeat: new Date(),
    isLinked: true
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
    processes: [],
    lastHeartbeat: new Date(),
    isLinked: true
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
    isLinked: true
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
    isLinked: false
  }
]

export function useWebSocket() {
  const socketRef = useRef<Socket | null>(null)
  const [isDemo, setIsDemo] = useState(false)
  const demoIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  const {
    authToken,
    setConnectionStatus,
    setSystemStatus,
    setNodes,
    updateNode,
    addMetric,
    addChatMessage,
    setTrainingTask,
    updateTrainingProgress,
    addNodeLog,
    addNotification,
    isConnected
  } = useAppStore()

  // Random variation helper
  const randomVariation = (value: number, range: number): number => 
    Math.max(0, Math.min(100, value + (Math.random() - 0.5) * range * 2))

  // Start demo mode
  const startDemoMode = useCallback(() => {
    console.log('Starting demo mode...')
    setIsDemo(true)
    setConnectionStatus(true, false, null)
    setSystemStatus('online')
    setNodes(DEMO_NODES)
    addNotification({ type: 'info', message: 'Running in demo mode - data is simulated' })
    
    // Update metrics periodically
    demoIntervalRef.current = setInterval(() => {
      // Update node metrics
      setNodes(DEMO_NODES.map(node => ({
        ...node,
        cpuUsage: node.status === 'online' ? randomVariation(node.cpuUsage, 5) : node.cpuUsage,
        ramUsage: node.status === 'online' ? randomVariation(node.ramUsage, 3) : node.ramUsage,
        gpuUsage: node.status === 'online' && node.gpuModel ? randomVariation(node.gpuUsage, 8) : node.gpuUsage,
        lastHeartbeat: node.status === 'online' ? new Date() : node.lastHeartbeat
      })))
      
      // Add system metric
      const onlineNodes = DEMO_NODES.filter(n => n.status === 'online')
      const metric: SystemMetric = {
        timestamp: new Date(),
        totalCpu: onlineNodes.reduce((s, n) => s + n.cpuUsage, 0) / onlineNodes.length,
        totalRam: onlineNodes.reduce((s, n) => s + n.ramUsage, 0) / onlineNodes.length,
        avgGpu: onlineNodes.filter(n => n.gpuUsage > 0).reduce((s, n) => s + n.gpuUsage, 0) / 3,
        activeNodes: onlineNodes.length,
        totalNodes: DEMO_NODES.length,
        networkLoad: Math.random() * 100
      }
      addMetric(metric)
    }, 2000)
  }, [setConnectionStatus, setSystemStatus, setNodes, addMetric, addNotification])

  // Stop demo mode
  const stopDemoMode = useCallback(() => {
    if (demoIntervalRef.current) {
      clearInterval(demoIntervalRef.current)
      demoIntervalRef.current = null
    }
    setIsDemo(false)
  }, [])

  const connect = useCallback(() => {
    if (socketRef.current?.connected || isDemo) return
    
    setConnectionStatus(false, true, null)
    
    try {
      let socketUrl: string
      let socketOpts: any
      
      if (typeof window !== 'undefined') {
        const isLocalhost = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1'
        
        if (isLocalhost) {
          socketUrl = 'http://localhost:3003'
          socketOpts = {
            transports: ['polling', 'websocket'],
            auth: { token: authToken }
          }
        } else {
          const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:'
          socketUrl = `${protocol}//${window.location.host}`
          socketOpts = {
            transports: ['polling', 'websocket'],
            query: { XTransformPort: '3003' },
            auth: { token: authToken }
          }
        }
        console.log('Attempting WebSocket connection:', socketUrl)
      } else {
        socketUrl = 'http://localhost:3003'
        socketOpts = { auth: { token: authToken } }
      }
      
      const socket = io(socketUrl, socketOpts)
      socketRef.current = socket

      // Timeout for demo mode fallback
      const demoTimeout = setTimeout(() => {
        if (!socket.connected) {
          console.log('WebSocket connection timeout, switching to demo mode')
          socket.disconnect()
          startDemoMode()
        }
      }, 5000)

      socket.on('connect', () => {
        clearTimeout(demoTimeout)
        console.log('WebSocket connected')
        setConnectionStatus(true, false, null)
        addNotification({ type: 'success', message: 'Connected to Chappi Network' })
      })

      socket.on('disconnect', (reason) => {
        console.log('WebSocket disconnected:', reason)
        setConnectionStatus(false, false, `Disconnected: ${reason}`)
        setSystemStatus('offline')
      })

      socket.on('connect_error', (error) => {
        console.error('WebSocket connect error:', error.message)
        clearTimeout(demoTimeout)
        socket.disconnect()
        startDemoMode()
      })

      // System events
      socket.on('system:status', (data: { status: 'online' | 'degraded' | 'offline' }) => {
        setSystemStatus(data.status)
      })

      socket.on('system:metric', (data: any) => {
        addMetric({ ...data, timestamp: new Date(data.timestamp) })
      })

      socket.on('nodes:list', (nodes: any[]) => {
        setNodes(nodes.map((n) => ({
          ...n,
          lastHeartbeat: n.lastHeartbeat ? new Date(n.lastHeartbeat) : null
        })))
      })

      socket.on('node:update', (data: any) => {
        updateNode(data.id, {
          ...data,
          lastHeartbeat: data.lastHeartbeat ? new Date(data.lastHeartbeat) : undefined
        })
      })

      socket.on('node:log', (data: any) => {
        addNodeLog({ ...data, timestamp: new Date(data.timestamp) })
      })

      socket.on('chat:message', (data: any) => {
        addChatMessage({ ...data, timestamp: new Date(data.timestamp) })
      })

      socket.on('training:status', (data: any) => {
        setTrainingTask({
          ...data,
          startedAt: data.startedAt ? new Date(data.startedAt) : null,
          completedAt: data.completedAt ? new Date(data.completedAt) : null
        })
      })

      socket.on('training:progress', (data: any) => {
        updateTrainingProgress(data)
      })

    } catch (error: any) {
      console.error('Failed to connect:', error)
      startDemoMode()
    }
  }, [authToken, isDemo, setConnectionStatus, setSystemStatus, setNodes, updateNode, addMetric, addChatMessage, setTrainingTask, updateTrainingProgress, addNodeLog, addNotification, startDemoMode])

  const disconnect = useCallback(() => {
    stopDemoMode()
    socketRef.current?.disconnect()
    socketRef.current = null
    setConnectionStatus(false, false, null)
  }, [stopDemoMode, setConnectionStatus])

  // Emit helpers
  const emit = useCallback((event: string, data: any) => {
    if (isDemo) {
      console.log('Demo mode: simulating', event, data)
      
      // Simulate responses in demo mode
      if (event === 'chat:send') {
        setTimeout(() => {
          const responses = [
            "I've analyzed the network status. All systems are operating within normal parameters.",
            "The current training progress shows promising results. Loss is decreasing steadily.",
            "I recommend increasing the batch size to optimize GPU utilization.",
            "Node Gamma is experiencing degraded performance. I suggest running diagnostics.",
            "Memory consolidation complete. All conversations have been backed up.",
            "The distributed inference pipeline is now active across 3 nodes."
          ]
          addChatMessage({
            id: `msg-${Date.now()}`,
            role: 'assistant',
            content: responses[Math.floor(Math.random() * responses.length)],
            timestamp: new Date()
          })
        }, 1000)
      }
      return
    }
    
    socketRef.current?.emit(event, data)
  }, [isDemo, addChatMessage])

  const sendChatMessage = useCallback((content: string) => {
    addChatMessage({
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date()
    })
    emit('chat:send', { content })
  }, [emit, addChatMessage])

  const startTraining = useCallback(() => {
    if (isDemo) {
      setTrainingTask({
        id: 'training-1',
        name: 'Chappi Model Training',
        status: 'running',
        progress: 0,
        currentEpoch: 0,
        totalEpochs: 100,
        loss: 2.5,
        accuracy: 0.5,
        learningRate: 0.001,
        batchSize: 32,
        startedAt: new Date(),
        completedAt: null
      })
    }
    emit('training:start', {})
  }, [isDemo, setTrainingTask, emit])

  const pauseTraining = useCallback(() => emit('training:pause', {}), [emit])
  const stopTraining = useCallback(() => {
    if (isDemo) {
      setTrainingTask(null)
    }
    emit('training:stop', {})
  }, [isDemo, setTrainingTask, emit])
  
  const updateTrainingConfig = useCallback((config: any) => emit('training:config', config), [emit])
  const controlNode = useCallback((nodeId: string, action: string) => {
    if (isDemo) {
      updateNode(nodeId, { status: action === 'power_on' ? 'online' : action === 'power_off' ? 'offline' : 'online' })
      addNotification({ type: 'success', message: `Node ${action} command sent` })
    }
    emit('node:control', { nodeId, action })
  }, [isDemo, updateNode, addNotification, emit])
  
  const executeCommand = useCallback((nodeId: string, command: string) => {
    if (isDemo) {
      addNodeLog({
        id: `log-${Date.now()}`,
        nodeId,
        level: 'info',
        message: `Command executed: ${command}`,
        timestamp: new Date()
      })
    }
    emit('node:command', { nodeId, command })
  }, [isDemo, addNodeLog, emit])
  
  const generateLinkingCode = useCallback(() => {
    if (isDemo) {
      const code = Math.random().toString(36).substring(2, 6).toUpperCase() + 
                   Math.random().toString(36).substring(2, 6).toUpperCase()
      addNotification({ type: 'success', message: `Demo linking code: ${code}` })
    }
    emit('linking:generate', { type: 'qr', expiresIn: 300 })
  }, [isDemo, addNotification, emit])
  
  const validateLinkingCode = useCallback((code: string, data: any) => emit('linking:validate', { code, ...data }), [emit])

  useEffect(() => {
    if (authToken && !isConnected && !isDemo) {
      // Use setTimeout to avoid synchronous setState in effect
      const timer = setTimeout(() => connect(), 0)
      return () => {
        clearTimeout(timer)
        disconnect()
      }
    }
  }, [authToken, isConnected, isDemo, connect, disconnect])

  return {
    connect,
    disconnect,
    sendChatMessage,
    startTraining,
    pauseTraining,
    stopTraining,
    updateTrainingConfig,
    controlNode,
    executeCommand,
    generateLinkingCode,
    validateLinkingCode,
    isDemo
  }
}
