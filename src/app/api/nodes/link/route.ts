import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Link a node from the app (using code from PC)
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json()
    
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }
    
    // Find pending node with this code (PC already sent data)
    const linkingCode = await db.linkingCode.findUnique({
      where: { code: code.toUpperCase() },
      include: { node: true }
    })
    
    if (!linkingCode) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 404 })
    }
    
    if (linkingCode.status === 'used' && linkingCode.node) {
      // Node already linked, return success
      return NextResponse.json({
        success: true,
        nodeId: linkingCode.node.id,
        node: linkingCode.node
      })
    }
    
    if (linkingCode.status === 'expired' || new Date() > linkingCode.expiresAt) {
      return NextResponse.json({ error: 'Code expired' }, { status: 400 })
    }
    
    // If node exists but not yet confirmed, update status
    if (linkingCode.node) {
      const updatedNode = await db.node.update({
        where: { id: linkingCode.node.id },
        data: {
          isLinked: true,
          linkedAt: new Date(),
          status: 'online'
        }
      })
      
      await db.linkingCode.update({
        where: { id: linkingCode.id },
        data: { status: 'used', usedAt: new Date() }
      })
      
      return NextResponse.json({
        success: true,
        nodeId: updatedNode.id,
        node: updatedNode
      })
    }
    
    return NextResponse.json({ error: 'No node associated with this code' }, { status: 400 })
    
  } catch (error) {
    console.error('Link node error:', error)
    return NextResponse.json({ error: 'Failed to link node' }, { status: 500 })
  }
}
