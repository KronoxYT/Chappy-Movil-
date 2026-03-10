'use client'

import { useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { useWebSocket } from '@/hooks/use-websocket'
import { LoginScreen } from '@/components/login-screen'
import { Sidebar } from '@/components/sidebar'
import { Dashboard } from '@/components/dashboard'
import { NodesView } from '@/components/nodes-view'
import { AIControl } from '@/components/ai-control'
import { MemoryView } from '@/components/memory-view'
import { Toaster } from '@/components/ui/toaster'
import { cn } from '@/lib/utils'

export default function ChappiApp() {
  const { isAuthenticated, activeView, notifications, removeNotification } = useAppStore()
  const { connect, disconnect } = useWebSocket()

  // Auto-remove notifications
  useEffect(() => {
    notifications.forEach((n) => {
      setTimeout(() => removeNotification(n.id), 5000)
    })
  }, [notifications, removeNotification])

  // Connect to WebSocket on mount
  useEffect(() => {
    if (isAuthenticated) {
      connect()
    }
    return () => disconnect()
  }, [isAuthenticated])

  // Handle URL view parameter (for PWA shortcuts)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const view = params.get('view') as 'dashboard' | 'nodes' | 'ai-control' | 'memory' | null
    if (view && ['dashboard', 'nodes', 'ai-control', 'memory'].includes(view)) {
      useAppStore.getState().setActiveView(view)
    }
  }, [])

  if (!isAuthenticated) {
    return <LoginScreen />
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar (desktop & mobile drawer) */}
      <Sidebar />
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto grid-bg hex-pattern md:ml-0 pt-14 md:pt-0 pb-16 md:pb-0">
        {activeView === 'dashboard' && <Dashboard />}
        {activeView === 'nodes' && <NodesView />}
        {activeView === 'ai-control' && <AIControl />}
        {activeView === 'memory' && <MemoryView />}
      </main>
      
      {/* Notifications Toast */}
      <div className="fixed bottom-20 md:bottom-4 right-4 z-50 space-y-2 pointer-events-none">
        {notifications.map((n) => (
          <div
            key={n.id}
            className={cn(
              "px-4 py-3 rounded-lg shadow-lg border backdrop-blur-sm animate-fade-in-up max-w-sm pointer-events-auto",
              n.type === 'success' && "bg-success/10 border-success/30 text-success",
              n.type === 'error' && "bg-destructive/10 border-destructive/30 text-destructive",
              n.type === 'warning' && "bg-warning/10 border-warning/30 text-warning",
              n.type === 'info' && "bg-primary/10 border-primary/30 text-primary"
            )}
          >
            <p className="text-sm">{n.message}</p>
          </div>
        ))}
      </div>
      
      <Toaster />
    </div>
  )
}
