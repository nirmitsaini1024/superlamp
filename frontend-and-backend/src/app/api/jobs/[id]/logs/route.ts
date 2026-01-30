import { NextRequest, NextResponse } from 'next/server'
import { resolveJobToDropletId } from '@/lib/resolve-job'
import { appendLog } from '@/lib/job-logs-store'

/**
 * POST /api/jobs/:id/logs
 * Accepts log lines from the droplet runner (no auth - called by runner on droplet).
 * :id can be droplet ID (number) or droplet name.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: jobId } = await params
    if (!jobId) {
      return NextResponse.json({ error: 'Job ID required' }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const line = typeof body?.line === 'string' ? body.line : String(body?.line ?? '')
    if (line === '') {
      return NextResponse.json({ ok: true })
    }

    const resolved = await resolveJobToDropletId(jobId)
    if (!resolved) {
      console.log('[POST /api/jobs/:id/logs] job not found', { jobId, linePreview: line.slice(0, 60) })
      return NextResponse.json({ error: 'Job not found' }, { status: 404 })
    }

    console.log('[POST /api/jobs/:id/logs] from droplet', { jobId, dropletId: resolved.dropletId, line: line.slice(0, 80) })
    appendLog(resolved.dropletId, line)
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error appending job log:', error)
    return NextResponse.json({ error: 'Failed to append log' }, { status: 500 })
  }
}
