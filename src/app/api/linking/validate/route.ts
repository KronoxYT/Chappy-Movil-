import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'

// Validate a linking code (used by PC agent)
export async function POST(request: NextRequest) {
  try {
    const { code, hostname, ip, mac, hardwareProfile } = await request.json()
    
    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 })
    }
    
    // Find the linking code
    const linkingCode = await db.linkingCode.findUnique({
      where: { code: code.toUpperCase() }
    })
    
    if (!linkingCode) {
      return NextResponse.json({ error: 'Invalid code' }, { status: 404 })
    }
    
    if (linkingCode.status === 'used') {
      return NextResponse.json({ error: 'Code already used' }, { status: 400 })
    }
    
    if (linkingCode.status === 'expired' || new Date() > linkingCode.expiresAt) {
      await db.linkingCode.update({
        where: { id: linkingCode.id },
        data: { status: 'expired' }
      })
      return NextResponse.json({ error: 'Code expired' }, { status: 400 })
    }
    
    // Parse hardware profile if provided
    const profile = hardwareProfile || {}
    
    // Create or update node
    const nodeToken = nanoid(32)
    const existingNode = await db.node.findFirst({
      where: { macAddress: mac }
    })
    
    let node
    if (existingNode) {
      // Update existing node
      node = await db.node.update({
        where: { id: existingNode.id },
        data: {
          name: hostname || existingNode.name,
          ipAddress: ip || existingNode.ipAddress,
          macAddress: mac,
          status: 'online',
          token: nodeToken,
          isLinked: true,
          linkedAt: new Date(),
          lastHeartbeat: new Date(),
          hardwareProfile: JSON.stringify(profile),
          cpuModel: profile.cpu?.modelo,
          cpuCores: profile.cpu?.nucleos_fisicos,
          cpuThreads: profile.cpu?.hilos_logicos,
          cpuMaxFreq: profile.cpu?.frecuencia_max_mhz,
          cpuCurrentFreq: profile.cpu?.frecuencia_actual_mhz,
          gpuModel: profile.gpu?.GPU_0?.nombre || profile.gpu?.modelo,
          gpuMemory: profile.gpu?.GPU_0?.memoria_total_mb,
          totalRam: profile.ram?.total_gb,
          osInfo: profile.acceso?.sistema_operativo,
          hostname: hostname
        }
      })
    } else {
      // Create new node
      node = await db.node.create({
        data: {
          name: hostname || `Node-${code}`,
          ipAddress: ip || '0.0.0.0',
          macAddress: mac,
          status: 'online',
          token: nodeToken,
          isLinked: true,
          linkedAt: new Date(),
          lastHeartbeat: new Date(),
          hardwareProfile: JSON.stringify(profile),
          cpuModel: profile.cpu?.modelo,
          cpuCores: profile.cpu?.nucleos_fisicos,
          cpuThreads: profile.cpu?.hilos_logicos,
          cpuMaxFreq: profile.cpu?.frecuencia_max_mhz,
          cpuCurrentFreq: profile.cpu?.frecuencia_actual_mhz,
          gpuModel: profile.gpu?.GPU_0?.nombre || profile.gpu?.modelo,
          gpuMemory: profile.gpu?.GPU_0?.memoria_total_mb,
          totalRam: profile.ram?.total_gb,
          osInfo: profile.acceso?.sistema_operativo,
          hostname: hostname,
          processes: JSON.stringify(profile.processes || [])
        }
      })
    }
    
    // Mark code as used
    await db.linkingCode.update({
      where: { id: linkingCode.id },
      data: {
        status: 'used',
        usedAt: new Date(),
        nodeId: node.id
      }
    })
    
    return NextResponse.json({
      success: true,
      nodeId: node.id,
      token: nodeToken,
      message: `Node ${node.name} linked successfully`
    })
    
  } catch (error) {
    console.error('Validate code error:', error)
    return NextResponse.json({ error: 'Validation failed' }, { status: 500 })
  }
}
