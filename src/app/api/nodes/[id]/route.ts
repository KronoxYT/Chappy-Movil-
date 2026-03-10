import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    const node = await db.node.findUnique({
      where: { id },
      include: {
        nodeLogs: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      }
    })
    
    if (!node) {
      return NextResponse.json({ error: 'Node not found' }, { status: 404 })
    }
    
    // Parse processes and hardware profile
    const parsedNode = {
      ...node,
      processes: node.processes ? JSON.parse(node.processes) : [],
      lastHeartbeat: node.lastHeartbeat?.toISOString(),
      linkedAt: node.linkedAt?.toISOString()
    }
    
    return NextResponse.json(parsedNode)
    
  } catch (error) {
    console.error('Fetch node error:', error)
    return NextResponse.json({ error: 'Failed to fetch node' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Delete node logs first
    await db.nodeLog.deleteMany({
      where: { nodeId: id }
    })
    
    // Delete linking codes
    await db.linkingCode.deleteMany({
      where: { nodeId: id }
    })
    
    // Delete node
    await db.node.delete({
      where: { id }
    })
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Delete node error:', error)
    return NextResponse.json({ error: 'Failed to delete node' }, { status: 500 })
  }
}
