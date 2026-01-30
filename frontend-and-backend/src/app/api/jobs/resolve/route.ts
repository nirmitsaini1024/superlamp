import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/jobs/resolve?name=xxx
 * Resolve droplet name to droplet ID (no auth - called by runner on droplet).
 * Returns { jobId: number }. Runner uses this as job id for config and logs.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const name = searchParams.get('name')
  if (!name?.trim()) {
    return NextResponse.json({ error: 'name required' }, { status: 400 })
  }

  const droplet = await prisma.droplet.findFirst({
    where: { dropletName: name.trim() },
    select: { dropletId: true },
  })
  if (!droplet) {
    return NextResponse.json({ error: 'Job not found' }, { status: 404 })
  }

  return NextResponse.json({ jobId: droplet.dropletId })
}
