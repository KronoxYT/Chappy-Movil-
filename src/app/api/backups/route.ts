import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const backups = await db.memoryBackup.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10
    })
    
    return NextResponse.json(backups)
  } catch (error) {
    console.error('Fetch backups error:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { type, cloudService } = await request.json()
    
    // Calculate approximate memory size
    const conversations = await db.conversation.count()
    const messages = await db.conversationMessage.count()
    const size = (conversations * 0.5 + messages * 0.1) // Rough estimate in MB
    
    const backup = await db.memoryBackup.create({
      data: {
        type: type || 'manual',
        size,
        status: 'completed',
        cloudService: cloudService || 'Local Storage'
      }
    })
    
    return NextResponse.json(backup)
  } catch (error) {
    console.error('Create backup error:', error)
    return NextResponse.json({ error: 'Failed to create backup' }, { status: 500 })
  }
}
