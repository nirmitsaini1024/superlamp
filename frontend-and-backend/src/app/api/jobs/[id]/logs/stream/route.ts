import { NextRequest } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { resolveJobToDropletId } from '@/lib/resolve-job'
import { getLines, subscribe } from '@/lib/job-logs-store'

/**
 * GET /api/jobs/:id/logs/stream
 * SSE stream of log lines for the job (droplet). :id should be droplet ID.
 * Requires auth; only the droplet owner can subscribe.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth()
  if (!userId) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { id: jobId } = await params
  if (!jobId) {
    return new Response(JSON.stringify({ error: 'Job ID required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const resolved = await resolveJobToDropletId(jobId, { userId })
  if (!resolved) {
    return new Response(JSON.stringify({ error: 'Job not found' }), {
      status: 404,
      headers: { 'Content-Type': 'application/json' },
    })
  }

  const { dropletId } = resolved
  console.log('[logs/stream] client connected', { jobId, dropletId })

  const HEARTBEAT_INTERVAL_MS = 15_000 // keep proxies (e.g. dev tunnels) from timing out idle SSE

  const stream = new ReadableStream({
    start(controller) {
      const encoder = new TextEncoder()

      function send(line: string) {
        try {
          console.log('[logs/stream]', dropletId, line)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ line })}\n\n`))
        } catch {
          // client may have closed
        }
      }

      for (const line of getLines(dropletId)) {
        send(line)
      }

      const unsubscribe = subscribe(dropletId, send)

      // Heartbeat: send SSE comment every 15s so gateways don't 504 timeout idle connections
      const heartbeat = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': heartbeat\n\n'))
        } catch {
          clearInterval(heartbeat)
        }
      }, HEARTBEAT_INTERVAL_MS)

      request.signal.addEventListener('abort', () => {
        clearInterval(heartbeat)
        unsubscribe()
        try {
          controller.close()
        } catch {
          // already closed
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  })
}
