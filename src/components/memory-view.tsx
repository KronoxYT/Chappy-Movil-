'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'
import { 
  Database, 
  Search, 
  Cloud, 
  MessageSquare, 
  Calendar,
  Clock,
  RefreshCw,
  Download,
  Trash2,
  FileText,
  CheckCircle2,
  AlertCircle
} from 'lucide-react'

interface StoredConversation {
  id: string
  title: string | null
  createdAt: string
  updatedAt: string
  messages: {
    id: string
    role: string
    content: string
    createdAt: string
  }[]
}

interface Backup {
  id: string
  type: string
  size: number
  status: string
  cloudService: string | null
  createdAt: string
}

export function MemoryView() {
  const { conversations, setConversations, addNotification, isConnected } = useAppStore()
  
  const [searchQuery, setSearchQuery] = useState('')
  const [storedConversations, setStoredConversations] = useState<StoredConversation[]>([])
  const [backups, setBackups] = useState<Backup[]>([])
  const [selectedConversation, setSelectedConversation] = useState<StoredConversation | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isBackingUp, setIsBackingUp] = useState(false)

  // Fetch conversations from API
  useEffect(() => {
    if (isConnected) {
      fetchConversations()
      fetchBackups()
    }
  }, [isConnected])

  const fetchConversations = async () => {
    try {
      const response = await fetch('/api/conversations')
      if (response.ok) {
        const data = await response.json()
        setStoredConversations(data)
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error)
    }
  }

  const fetchBackups = async () => {
    try {
      const response = await fetch('/api/backups')
      if (response.ok) {
        const data = await response.json()
        setBackups(data)
      }
    } catch (error) {
      console.error('Failed to fetch backups:', error)
    }
  }

  const handleBackup = async () => {
    setIsBackingUp(true)
    try {
      const response = await fetch('/api/backups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'manual' })
      })
      
      if (response.ok) {
        addNotification({ type: 'success', message: 'Backup initiated successfully' })
        fetchBackups()
      } else {
        addNotification({ type: 'error', message: 'Backup failed' })
      }
    } catch (error) {
      addNotification({ type: 'error', message: 'Backup failed' })
    } finally {
      setIsBackingUp(false)
    }
  }

  const handleDeleteConversation = async (id: string) => {
    try {
      const response = await fetch(`/api/conversations/${id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        addNotification({ type: 'success', message: 'Conversation deleted' })
        fetchConversations()
      }
    } catch (error) {
      addNotification({ type: 'error', message: 'Failed to delete conversation' })
    }
  }

  // Filter conversations based on search
  const filteredConversations = storedConversations.filter(conv => {
    if (!searchQuery) return true
    const query = searchQuery.toLowerCase()
    return (
      (conv.title?.toLowerCase().includes(query)) ||
      conv.messages.some(m => m.content.toLowerCase().includes(query))
    )
  })

  return (
    <div className="p-6 space-y-6 animate-fade-in-up h-[calc(100vh-2rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Memory System</h1>
          <p className="text-muted-foreground mt-1">Explore and manage Chappi's persistent memory</p>
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => { fetchConversations(); fetchBackups(); }}
            disabled={isLoading}
          >
            <RefreshCw className={cn("w-4 h-4 mr-2", isLoading && "animate-spin")} />
            Refresh
          </Button>
          
          <Button
            onClick={handleBackup}
            disabled={isBackingUp || !isConnected}
          >
            <Cloud className="w-4 h-4 mr-2" />
            {isBackingUp ? 'Backing up...' : 'Backup to Cloud'}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-card/50 border-border">
          <CardContent className="pt-4 flex items-center gap-3">
            <MessageSquare className="w-10 h-10 text-primary" />
            <div>
              <p className="text-2xl font-bold">{storedConversations.length}</p>
              <p className="text-xs text-muted-foreground">Conversations</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 border-border">
          <CardContent className="pt-4 flex items-center gap-3">
            <FileText className="w-10 h-10 text-chart-2" />
            <div>
              <p className="text-2xl font-bold">
                {storedConversations.reduce((sum, c) => sum + c.messages.length, 0)}
              </p>
              <p className="text-xs text-muted-foreground">Total Messages</p>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-card/50 border-border">
          <CardContent className="pt-4 flex items-center gap-3">
            <Database className="w-10 h-10 text-chart-3" />
            <div>
              <p className="text-2xl font-bold">{backups.length}</p>
              <p className="text-xs text-muted-foreground">Backups</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Conversations List */}
        <Card className="bg-card/50 border-border flex flex-col min-h-0">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Database className="w-5 h-5 text-primary" />
              Saved Conversations
            </CardTitle>
            
            {/* Search */}
            <div className="relative mt-2">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search conversations..."
                className="pl-9"
              />
            </div>
          </CardHeader>
          
          <CardContent className="flex-1 p-0 min-h-0">
            <ScrollArea className="h-full px-4 pb-4">
              <div className="space-y-2">
                {filteredConversations.map((conv) => (
                  <div
                    key={conv.id}
                    onClick={() => setSelectedConversation(conv)}
                    className={cn(
                      "p-3 rounded-lg border cursor-pointer transition-all hover:bg-muted/50",
                      selectedConversation?.id === conv.id 
                        ? "border-primary/50 bg-primary/5" 
                        : "border-border"
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium truncate">
                          {conv.title || `Conversation ${conv.id.slice(0, 8)}`}
                        </h4>
                        <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                          <Calendar className="w-3 h-3" />
                          <span>{new Date(conv.createdAt).toLocaleDateString()}</span>
                          <Badge variant="secondary" className="text-xs">
                            {conv.messages.length} msgs
                          </Badge>
                        </div>
                      </div>
                      
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleDeleteConversation(conv.id)
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))}
                
                {filteredConversations.length === 0 && (
                  <div className="text-center py-8">
                    <Database className="w-12 h-12 mx-auto mb-2 text-muted-foreground/50" />
                    <p className="text-muted-foreground text-sm">
                      {searchQuery ? 'No conversations found' : 'No conversations saved'}
                    </p>
                  </div>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Conversation Detail */}
        <Card className="lg:col-span-2 bg-card/50 border-border flex flex-col min-h-0">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="text-lg">
              {selectedConversation 
                ? selectedConversation.title || `Conversation ${selectedConversation.id.slice(0, 8)}`
                : 'Select a conversation'
              }
            </CardTitle>
            {selectedConversation && (
              <CardDescription>
                {new Date(selectedConversation.createdAt).toLocaleString()}
              </CardDescription>
            )}
          </CardHeader>
          
          <CardContent className="flex-1 min-h-0">
            {selectedConversation ? (
              <ScrollArea className="h-full pr-4">
                <div className="space-y-4">
                  {selectedConversation.messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={cn(
                        "flex gap-3",
                        msg.role === 'user' && "flex-row-reverse"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                        msg.role === 'user' ? "bg-primary/20" : "bg-chart-2/20"
                      )}>
                        {msg.role === 'user' ? '👤' : '🤖'}
                      </div>
                      
                      <div className={cn(
                        "flex-1 max-w-[80%] p-3 rounded-lg",
                        msg.role === 'user' 
                          ? "bg-primary/10" 
                          : "bg-muted/50"
                      )}>
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        <span className="text-xs text-muted-foreground mt-1 block">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {new Date(msg.createdAt).toLocaleTimeString()}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="h-full flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground/50" />
                  <p className="text-muted-foreground">Select a conversation to view</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Backups Section */}
      <Card className="bg-card/50 border-border">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Cloud className="w-5 h-5 text-primary" />
            Backup History
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {backups.slice(0, 4).map((backup) => (
              <div
                key={backup.id}
                className="p-3 rounded-lg border border-border bg-muted/30"
              >
                <div className="flex items-center gap-2 mb-2">
                  {backup.status === 'completed' ? (
                    <CheckCircle2 className="w-4 h-4 text-success" />
                  ) : backup.status === 'error' ? (
                    <AlertCircle className="w-4 h-4 text-destructive" />
                  ) : (
                    <RefreshCw className="w-4 h-4 text-warning animate-spin" />
                  )}
                  <Badge variant="secondary" className="text-xs">
                    {backup.type}
                  </Badge>
                </div>
                
                <div className="text-sm">
                  <p className="font-medium">{backup.size.toFixed(2)} MB</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(backup.createdAt).toLocaleString()}
                  </p>
                  {backup.cloudService && (
                    <p className="text-xs text-muted-foreground mt-1">
                      → {backup.cloudService}
                    </p>
                  )}
                </div>
              </div>
            ))}
            
            {backups.length === 0 && (
              <div className="col-span-full text-center py-4">
                <Cloud className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
                <p className="text-sm text-muted-foreground">No backups yet</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
