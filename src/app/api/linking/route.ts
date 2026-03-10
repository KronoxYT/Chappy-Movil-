import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

// Generate a new linking code
export async function POST(request: NextRequest) {
  try {
    const { type = 'manual', expiresIn = 300 } = await request.json() // 5 min default
    
    const code = nanoid(8).toUpperCase()
    const expiresAt = new Date(Date.now() + expiresIn * 1000)
    
    const linkingCode = await db.linkingCode.create({
      data: {
        code,
        type,
        status: 'pending',
        expiresAt
      }
    })
    
    return NextResponse.json({
      success: true,
      code: linkingCode.code,
      type: linkingCode.type,
      expiresAt: linkingCode.expiresAt.toISOString()
    })
    
  } catch (error) {
    console.error('Generate code error:', error)
    return NextResponse.json({ error: 'Failed to generate code' }, { status: 500 })
  }
}

// List all pending codes
export async function GET() {
  try {
    const codes = await db.linkingCode.findMany({
      where: { status: 'pending' },
      include: { node: true },
      orderBy: { createdAt: 'desc' }
    })
    
    return NextResponse.json(codes)
  } catch (error) {
    console.error('Fetch codes error:', error)
    return NextResponse.json([], { status: 500 })
  }
}
