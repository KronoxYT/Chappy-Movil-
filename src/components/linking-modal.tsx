'use client'

import { useState, useEffect } from 'react'
import { useAppStore } from '@/lib/store'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { 
  QrCode, 
  Keyboard, 
  Link2, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  RefreshCw,
  Clock,
  Scan,
  Monitor,
  Smartphone
} from 'lucide-react'

interface LinkingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onLinked?: (nodeId: string) => void
}

export function LinkingModal({ open, onOpenChange, onLinked }: LinkingModalProps) {
  const [code, setCode] = useState<string | null>(null)
  const [expiresAt, setExpiresAt] = useState<Date | null>(null)
  const [manualCode, setManualCode] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [timeLeft, setTimeLeft] = useState<number>(0)

  // Generate new code
  const generateCode = async () => {
    setIsGenerating(true)
    setError(null)
    
    try {
      const response = await fetch('/api/linking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'both', expiresIn: 300 })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setCode(data.code)
        setExpiresAt(new Date(data.expiresAt))
        setSuccess('Code generated! Use it on your PC to link.')
      } else {
        setError(data.error || 'Failed to generate code')
      }
    } catch (err) {
      setError('Failed to generate code')
    } finally {
      setIsGenerating(false)
    }
  }

  // Copy code to clipboard
  const copyCode = async () => {
    if (code) {
      await navigator.clipboard.writeText(code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  // Link with manual code
  const linkWithCode = async () => {
    if (!manualCode.trim()) return
    
    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/nodes/link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: manualCode.toUpperCase() })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setSuccess(`Node "${data.node?.name || 'Unknown'}" linked successfully!`)
        setManualCode('')
        setTimeout(() => {
          onOpenChange(false)
          onLinked?.(data.nodeId)
        }, 1500)
      } else {
        setError(data.error || 'Failed to link node')
      }
    } catch (err) {
      setError('Failed to link node')
    } finally {
      setIsLoading(false)
    }
  }

  // Timer countdown
  useEffect(() => {
    if (!expiresAt) return
    
    const interval = setInterval(() => {
      const now = new Date()
      const diff = Math.max(0, Math.floor((expiresAt.getTime() - now.getTime()) / 1000))
      setTimeLeft(diff)
      
      if (diff === 0) {
        setCode(null)
        setExpiresAt(null)
        setError('Code expired. Generate a new one.')
      }
    }, 1000)
    
    return () => clearInterval(interval)
  }, [expiresAt])

  // Generate code on open
  useEffect(() => {
    if (open && !code) {
      generateCode()
    }
    if (!open) {
      setCode(null)
      setExpiresAt(null)
      setError(null)
      setSuccess(null)
      setManualCode('')
    }
  }, [open])

  // QR Code URL (using QR server API)
  const qrUrl = code 
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
        JSON.stringify({ code, type: 'chappi-link', server: window.location.origin })
      )}`
    : null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg bg-card border-border">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <Link2 className="w-5 h-5 text-primary" />
            Link New Node
          </DialogTitle>
          <DialogDescription>
            Connect a PC to your Chappi network using QR code or manual entry
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="qr" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="qr" className="flex items-center gap-2">
              <QrCode className="w-4 h-4" />
              QR Code
            </TabsTrigger>
            <TabsTrigger value="manual" className="flex items-center gap-2">
              <Keyboard className="w-4 h-4" />
              Manual Code
            </TabsTrigger>
          </TabsList>

          {/* QR Code Tab */}
          <TabsContent value="qr" className="space-y-4 mt-4">
            <Card className="bg-muted/30 border-border">
              <CardContent className="pt-6 flex flex-col items-center">
                {isGenerating ? (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-primary" />
                  </div>
                ) : code ? (
                  <>
                    <div className="bg-white p-4 rounded-lg mb-4">
                      <img 
                        src={qrUrl!} 
                        alt="QR Code" 
                        className="w-48 h-48"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl font-mono font-bold tracking-wider">{code}</span>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={copyCode}
                      >
                        {copied ? (
                          <CheckCircle2 className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      <span>
                        {timeLeft > 0 
                          ? `Expires in ${Math.floor(timeLeft / 60)}:${(timeLeft % 60).toString().padStart(2, '0')}`
                          : 'Expired'
                        }
                      </span>
                    </div>
                  </>
                ) : (
                  <div className="w-48 h-48 flex items-center justify-center">
                    <AlertCircle className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Instructions */}
            <div className="bg-muted/20 rounded-lg p-4 space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Monitor className="w-4 h-4 text-primary" />
                On your PC:
              </h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>Run the Chappi Agent script</li>
                <li>Scan the QR code or enter the code manually</li>
                <li>Wait for confirmation message</li>
              </ol>
            </div>

            <Button 
              variant="outline" 
              className="w-full"
              onClick={generateCode}
              disabled={isGenerating}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isGenerating && "animate-spin")} />
              Generate New Code
            </Button>
          </TabsContent>

          {/* Manual Code Tab */}
          <TabsContent value="manual" className="space-y-4 mt-4">
            <Card className="bg-muted/30 border-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Enter Linking Code</CardTitle>
                <CardDescription>
                  Type the 8-character code displayed on your PC
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="XXXXXXXX"
                    maxLength={8}
                    className="font-mono text-center text-lg tracking-widest"
                  />
                  <Button 
                    onClick={linkWithCode}
                    disabled={manualCode.length !== 8 || isLoading}
                  >
                    {isLoading ? (
                      <RefreshCw className="w-4 h-4 animate-spin" />
                    ) : (
                      <Link2 className="w-4 h-4" />
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Instructions */}
            <div className="bg-muted/20 rounded-lg p-4 space-y-2">
              <h4 className="font-medium flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-primary" />
                From your PC's perspective:
              </h4>
              <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                <li>The PC generates a linking code</li>
                <li>Enter that code here to link it</li>
                <li>The PC will be added to your network</li>
              </ol>
            </div>
          </TabsContent>
        </Tabs>

        {/* Status Messages */}
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-destructive text-sm">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}
        
        {success && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-success/10 border border-success/30 text-success text-sm">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {success}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
