'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
import { useAppStore } from '@/lib/store'
import { useWebSocket } from '@/hooks/use-websocket'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Slider } from '@/components/ui/slider'
import { cn } from '@/lib/utils'
import { 
  Brain, 
  Send, 
  Play, 
  Pause, 
  Square, 
  Settings, 
  Bot,
  User,
  TrendingUp,
  TrendingDown,
  Zap
} from 'lucide-react'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'

export function AIControl() {
  const { 
    chatMessages, 
    trainingTask, 
    addChatMessage,
    isConnected 
  } = useAppStore()
  
  const { 
    sendChatMessage, 
    startTraining, 
    pauseTraining, 
    stopTraining, 
    updateTrainingConfig 
  } = useWebSocket()
  
  const [messageInput, setMessageInput] = useState('')
  const [learningRate, setLearningRate] = useState(0.001)
  const [batchSize, setBatchSize] = useState(32)
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)
  
  // Use useMemo for progress data
  const progressData = useMemo(() => {
    if (!trainingTask || trainingTask.loss === null || trainingTask.accuracy === null) {
      return []
    }
    
    return [{
      epoch: trainingTask.currentEpoch, 
      loss: trainingTask.loss, 
      accuracy: trainingTask.accuracy * 100 
    }]
  }, [trainingTask])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [chatMessages])

  const handleSendMessage = () => {
    if (!messageInput.trim()) return
    
    addChatMessage({
      id: Date.now().toString(),
      role: 'user',
      content: messageInput,
      timestamp: new Date()
    })
    
    sendChatMessage(messageInput)
    setMessageInput('')
    
    // Simulate AI typing
    setIsTyping(true)
    setTimeout(() => setIsTyping(false), 1500)
  }

  const handleStartTraining = () => {
    updateTrainingConfig({ learningRate, batchSize })
    startTraining()
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in-up h-[calc(100vh-2rem)] flex flex-col">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">AI Control Center</h1>
        <p className="text-muted-foreground mt-1">Interact with Chappi and manage training tasks</p>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-0">
        {/* Chat Interface */}
        <Card className="lg:col-span-2 bg-card/50 border-border flex flex-col min-h-0">
          <CardHeader className="pb-3 flex-shrink-0">
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-primary" />
              Chat with Chappi
            </CardTitle>
            <CardDescription>Direct communication with the AI instance</CardDescription>
          </CardHeader>
          
          <CardContent className="flex-1 flex flex-col min-h-0 p-4 pt-0">
            {/* Messages */}
            <ScrollArea className="flex-1 pr-4" ref={scrollRef}>
              <div className="space-y-4">
                {chatMessages.length === 0 && (
                  <div className="text-center py-8">
                    <Brain className="w-16 h-16 mx-auto mb-4 text-primary/50" />
                    <p className="text-muted-foreground">Start a conversation with Chappi</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ask about system status, request tasks, or explore capabilities
                    </p>
                  </div>
                )}
                
                {chatMessages.map((msg) => (
                  <div 
                    key={msg.id}
                    className={cn(
                      "flex gap-3 animate-fade-in-up",
                      msg.role === 'user' && "flex-row-reverse"
                    )}
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      msg.role === 'user' ? "bg-primary/20" : "bg-chart-2/20"
                    )}>
                      {msg.role === 'user' ? (
                        <User className="w-4 h-4 text-primary" />
                      ) : (
                        <Bot className="w-4 h-4 text-chart-2" />
                      )}
                    </div>
                    
                    <div className={cn(
                      "flex-1 max-w-[80%] p-3 rounded-lg",
                      msg.role === 'user' 
                        ? "bg-primary/10 text-foreground" 
                        : "bg-muted/50 text-foreground"
                    )}>
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
                
                {isTyping && (
                  <div className="flex gap-3 animate-fade-in-up">
                    <div className="w-8 h-8 rounded-lg bg-chart-2/20 flex items-center justify-center">
                      <Bot className="w-4 h-4 text-chart-2" />
                    </div>
                    <div className="bg-muted/50 p-3 rounded-lg">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
            
            {/* Input */}
            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
              <Input
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                placeholder="Send a message to Chappi..."
                className="flex-1"
                disabled={!isConnected}
              />
              <Button 
                onClick={handleSendMessage}
                disabled={!messageInput.trim() || !isConnected}
              >
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Training Controls */}
        <div className="space-y-4 flex flex-col min-h-0">
          {/* Training Status */}
          <Card className="bg-card/50 border-border flex-shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Zap className="w-5 h-5 text-primary" />
                Training Status
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Badge 
                  variant="outline"
                  className={cn(
                    trainingTask?.status === 'running' && "border-success text-success",
                    trainingTask?.status === 'paused' && "border-warning text-warning",
                    trainingTask?.status === 'completed' && "border-primary text-primary",
                    trainingTask?.status === 'error' && "border-destructive text-destructive",
                    (!trainingTask || trainingTask.status === 'idle') && "border-muted-foreground text-muted-foreground"
                  )}
                >
                  {(trainingTask?.status || 'IDLE').toUpperCase()}
                </Badge>
                
                {trainingTask?.startedAt && (
                  <span className="text-xs text-muted-foreground">
                    Started {new Date(trainingTask.startedAt).toLocaleTimeString()}
                  </span>
                )}
              </div>
              
              {trainingTask && trainingTask.status !== 'idle' && (
                <>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-mono">
                        {trainingTask.currentEpoch}/{trainingTask.totalEpochs} epochs
                      </span>
                    </div>
                    <Progress value={trainingTask.progress} className="h-2" />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {trainingTask.loss !== null && (
                      <div className="p-2 rounded-lg bg-muted/50 text-center">
                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                          <TrendingDown className="w-3 h-3" />
                          <span>Loss</span>
                        </div>
                        <span className="text-lg font-bold text-chart-3">
                          {trainingTask.loss.toFixed(4)}
                        </span>
                      </div>
                    )}
                    
                    {trainingTask.accuracy !== null && (
                      <div className="p-2 rounded-lg bg-muted/50 text-center">
                        <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground">
                          <TrendingUp className="w-3 h-3" />
                          <span>Accuracy</span>
                        </div>
                        <span className="text-lg font-bold text-chart-2">
                          {(trainingTask.accuracy * 100).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {/* Control Buttons */}
              <div className="flex gap-2">
                {!trainingTask || trainingTask.status === 'idle' || trainingTask.status === 'completed' || trainingTask.status === 'error' ? (
                  <Button 
                    onClick={handleStartTraining}
                    className="flex-1"
                    disabled={!isConnected}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    Start Training
                  </Button>
                ) : trainingTask.status === 'running' ? (
                  <>
                    <Button 
                      onClick={pauseTraining}
                      variant="outline"
                      className="flex-1"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Pause
                    </Button>
                    <Button 
                      onClick={stopTraining}
                      variant="destructive"
                      className="flex-1"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Stop
                    </Button>
                  </>
                ) : (
                  <>
                    <Button 
                      onClick={handleStartTraining}
                      className="flex-1"
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Resume
                    </Button>
                    <Button 
                      onClick={stopTraining}
                      variant="destructive"
                      className="flex-1"
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Stop
                    </Button>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Parameters */}
          <Card className="bg-card/50 border-border flex-shrink-0">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <Settings className="w-5 h-5 text-primary" />
                Parameters
              </CardTitle>
              <CardDescription>Adjust model training settings</CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Learning Rate</span>
                  <span className="font-mono">{learningRate.toExponential(2)}</span>
                </div>
                <Slider
                  value={[Math.log10(learningRate)]}
                  onValueChange={(v) => setLearningRate(Math.pow(10, v[0]))}
                  min={-5}
                  max={-1}
                  step={0.1}
                  className="py-2"
                />
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Batch Size</span>
                  <span className="font-mono">{batchSize}</span>
                </div>
                <Slider
                  value={[batchSize]}
                  onValueChange={(v) => setBatchSize(v[0])}
                  min={8}
                  max={128}
                  step={8}
                  className="py-2"
                />
              </div>
            </CardContent>
          </Card>

          {/* Progress Chart */}
          {progressData.length > 0 && (
            <Card className="bg-card/50 border-border flex-1 min-h-[200px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Training Progress</CardTitle>
              </CardHeader>
              <CardContent className="p-2 pt-0">
                <div className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={progressData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="oklch(0.25 0.03 250)" />
                      <XAxis dataKey="epoch" stroke="oklch(0.65 0.02 250)" fontSize={10} />
                      <YAxis stroke="oklch(0.65 0.02 250)" fontSize={10} />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'oklch(0.12 0.015 250)',
                          border: '1px solid oklch(0.25 0.03 250)',
                          borderRadius: '8px'
                        }}
                      />
                      <Line type="monotone" dataKey="loss" stroke="oklch(0.7 0.18 280)" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="accuracy" stroke="oklch(0.65 0.2 150)" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
