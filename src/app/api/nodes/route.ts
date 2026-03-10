import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

export async function GET() {
  try {
    const nodes = await db.node.findMany({
      orderBy: { name: 'asc' }
    })
    
    return NextResponse.json(nodes.map(node => ({
      ...node,
      processes: node.processes ? JSON.parse(node.processes) : [],
      lastHeartbeat: node.lastHeartbeat?.toISOString()
    })))
  } catch (error) {
    console.error('Fetch nodes error:', error)
    return NextResponse.json([], { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, ipAddress, totalRam, gpuModel } = await request.json()
    
    const node = await db.node.create({
      data: {
        name,
        ipAddress,
        status: 'offline',
        totalRam: totalRam || 16,
        gpuModel
      }
    })
    
    return NextResponse.json(node)
  } catch (error) {
    console.error('Create node error:', error)
    return NextResponse.json({ error: 'Failed to create node' }, { status: 500 })
  }
}
