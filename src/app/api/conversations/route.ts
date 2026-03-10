import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const conversations = await db.conversation.findMany({
      include: {
        messages: {
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { updatedAt: 'desc' }
    })
    
    return NextResponse.json(conversations)
  } catch (error) {
    console.error('Fetch conversations error:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { title, userId } = await request.json()
    
    const conversation = await db.conversation.create({
      data: {
        title: title || 'New Conversation',
        userId: userId || 'default-user'
      }
    })
    
    return NextResponse.json(conversation)
  } catch (error) {
    console.error('Create conversation error:', error)
    return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
  }
}
