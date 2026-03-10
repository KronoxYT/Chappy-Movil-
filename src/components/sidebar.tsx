'use client'

import { useAppStore } from '@/lib/store'
import { cn } from '@/lib/utils'
import { 
  LayoutDashboard, 
  Server, 
  Brain, 
  Database, 
  Settings,
  Wifi,
  WifiOff,
  LogOut,
  Zap,
  Menu
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { useState } from 'react'

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'nodes', label: 'Nodes', icon: Server },
  { id: 'ai-control', label: 'AI Control', icon: Brain },
  { id: 'memory', label: 'Memory', icon: Database },
] as const

// Navigation button component (outside main component)
function NavButton({ 
  item, 
  isActive, 
  onClick 
}: { 
  item: typeof navItems[number]
  isActive: boolean
  onClick: () => void 
}) {
  const Icon = item.icon
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all",
        isActive 
          ? "bg-primary/10 text-primary glow-border-cyan" 
          : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
      )}
    >
      <Icon className="w-5 h-5" />
      {item.label}
    </button>
  )
}

// Mobile navigation button component
function MobileNavButton({ 
  item, 
  isActive, 
  onClick 
}: { 
  item: typeof navItems[number]
  isActive: boolean
  onClick: () => void 
}) {
  const Icon = item.icon
  
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex flex-col items-center justify-center py-2 px-3 rounded-lg transition-all relative",
        isActive ? "text-primary" : "text-muted-foreground"
      )}
    >
      <Icon className="w-5 h-5" />
      <span className="text-[10px] mt-1 font-medium">{item.label}</span>
      {isActive && (
        <div className="absolute bottom-1 w-1 h-1 rounded-full bg-primary" />
      )}
    </button>
  )
}

export function Sidebar() {
  const { 
    activeView, 
    setActiveView, 
    systemStatus, 
    isConnected,
    nodes,
    setAuthToken
  } = useAppStore()
  
  const [isOpen, setIsOpen] = useState(false)

  const onlineNodes = nodes.filter(n => n.status === 'online').length
  const totalNodes = nodes.length

  const handleNavClick = (view: typeof activeView) => {
    setActiveView(view)
    setIsOpen(false)
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 h-screen bg-card/50 border-r border-border flex-col backdrop-blur-sm">
        {/* Logo */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center glow-cyan">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="font-bold text-lg glow-text-cyan text-primary">CHAPPI</h1>
              <p className="text-xs text-muted-foreground">AI Network Control</p>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Network</span>
            <div className="flex items-center gap-2">
              {isConnected ? (
                <Wifi className="w-4 h-4 text-success" />
              ) : (
                <WifiOff className="w-4 h-4 text-destructive" />
              )}
              <span className={cn(
                "text-xs font-medium",
                isConnected ? "text-success" : "text-destructive"
              )}>
                {isConnected ? 'Connected' : 'Offline'}
              </span>
            </div>
          </div>
          
          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">Status</span>
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs",
                systemStatus === 'online' && "border-success text-success",
                systemStatus === 'degraded' && "border-warning text-warning",
                systemStatus === 'offline' && "border-destructive text-destructive"
              )}
            >
              {systemStatus.toUpperCase()}
            </Badge>
          </div>

          <div className="flex items-center justify-between mt-2">
            <span className="text-xs text-muted-foreground">Nodes</span>
            <span className="text-xs font-medium">
              <span className="text-success">{onlineNodes}</span>
              <span className="text-muted-foreground">/{totalNodes}</span>
            </span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-2 space-y-1">
          {navItems.map((item) => (
            <NavButton
              key={item.id}
              item={item}
              isActive={activeView === item.id}
              onClick={() => handleNavClick(item.id)}
            />
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border space-y-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
          >
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground hover:text-destructive"
            onClick={() => setAuthToken(null)}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Disconnect
          </Button>
        </div>
      </aside>

      {/* Mobile Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-card/80 backdrop-blur-sm border-b border-border z-50 flex items-center justify-between px-4">
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <Menu className="w-5 h-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72 p-0 bg-card border-border">
            <div className="flex flex-col h-full">
              {/* Logo */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center glow-cyan">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h1 className="font-bold text-lg text-primary">CHAPPI</h1>
                    <p className="text-xs text-muted-foreground">AI Network Control</p>
                  </div>
                </div>
              </div>

              {/* Status */}
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">Network</span>
                  <div className="flex items-center gap-2">
                    {isConnected ? (
                      <Wifi className="w-4 h-4 text-success" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-destructive" />
                    )}
                    <span className={cn(
                      "text-xs font-medium",
                      isConnected ? "text-success" : "text-destructive"
                    )}>
                      {isConnected ? 'Connected' : 'Offline'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-2 space-y-1">
                {navItems.map((item) => (
                  <NavButton
                    key={item.id}
                    item={item}
                    isActive={activeView === item.id}
                    onClick={() => handleNavClick(item.id)}
                  />
                ))}
              </nav>

              {/* Footer */}
              <div className="p-4 border-t border-border">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start text-muted-foreground hover:text-destructive"
                  onClick={() => setAuthToken(null)}
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Disconnect
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>

        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold text-primary">CHAPPI</span>
        </div>

        <div className="flex items-center gap-2">
          <div className={cn(
            "w-2 h-2 rounded-full",
            isConnected ? "bg-success" : "bg-destructive"
          )} />
        </div>
      </div>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-16 bg-card/90 backdrop-blur-sm border-t border-border z-50 flex items-center justify-around px-2">
        {navItems.map((item) => (
          <MobileNavButton
            key={item.id}
            item={item}
            isActive={activeView === item.id}
            onClick={() => setActiveView(item.id)}
          />
        ))}
      </nav>
    </>
  )
}
