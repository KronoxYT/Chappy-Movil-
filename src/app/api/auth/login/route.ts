import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { nanoid } from 'nanoid'

export async function POST(request: NextRequest) {
  try {
    const { apiKey } = await request.json()
    
    if (!apiKey) {
      return NextResponse.json(
        { success: false, error: 'API key is required' },
        { status: 400 }
      )
    }
    
    // Check if the API key matches any user
    let user = await db.user.findFirst({
      where: { apiKey }
    })
    
    // If no user with this API key, create a default admin user
    // This is for demo purposes - in production you'd validate against a real auth system
    if (!user && apiKey === 'chappi-admin-key') {
      user = await db.user.create({
        data: {
          email: 'admin@chappi.local',
          name: 'Chappi Admin',
          apiKey: 'chappi-admin-key',
          role: 'admin'
        }
      })
    }
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Invalid API key' },
        { status: 401 }
      )
    }
    
    // Generate a session token
    const token = nanoid(32)
    
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      }
    })
    
  } catch (error) {
    console.error('Auth error:', error)
    return NextResponse.json(
      { success: false, error: 'Authentication failed' },
      { status: 500 }
    )
  }
}
