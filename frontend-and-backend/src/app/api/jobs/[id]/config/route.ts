import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { resolveJobToDropletId } from '@/lib/resolve-job'
import { prisma } from '@/lib/prisma'
import { generateWorkloadScript } from '@/lib/workload-script'

const PYTHON_BACKEND_URL =
  process.env.PYTHON_BACKEND_URL ||
  process.env.NEXT_PUBLIC_API_URL ||
  'http://localhost:8000'

/**
 * GET /api/jobs/:id/config
 * Returns a shell script to run on the droplet. The script is generated from the
 * job's configuration and uses an LLM to suggest relevant Docker images.
 * :id can be droplet ID or droplet name. Called by runner (no auth) and by UI (auth optional).
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    const { id: jobId } = await params

    const resolved = await resolveJobToDropletId(jobId, userId ? { userId } : undefined)
    if (!resolved) {
      return NextResponse.json(
        { error: 'Droplet not found' },
        { status: 404 }
      )
    }

    const droplet = await prisma.droplet.findUnique({
      where: { dropletId: resolved.dropletId },
    })
    if (!droplet) {
      return NextResponse.json(
        { error: 'Droplet not found' },
        { status: 404 }
      )
    }

    const isGpu = droplet.size.startsWith('gpu-')
    const envTypeRaw = (droplet as { envType?: string | null }).envType
    const envTypes = envTypeRaw
      ? envTypeRaw.split(',').map((s: string) => s.trim()).filter(Boolean)
      : undefined

    // Call Python backend to get workloads (one per env type, e.g. nodejs and bun -> 2 workloads)
    let workloads: { image: string; command: string }[] = []

    try {
      const suggestRes = await fetch(`${PYTHON_BACKEND_URL}/suggest-docker-config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_input: droplet.userInput,
          is_gpu: isGpu,
          env_type: envTypeRaw ?? undefined,
          env_types: envTypes,
        }),
      })

      if (suggestRes.ok) {
        const data = await suggestRes.json()
        workloads = data.workloads ?? (data.image ? [{ image: data.image, command: data.command || 'python -c "print(\'Hello\')"' }] : [])
      }
      if (workloads.length === 0) {
        workloads = [{
          image: isGpu ? 'pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime' : 'python:3.11-slim',
          command: isGpu ? 'python -c "import torch; print(torch.__version__)"' : 'python -c "print(\'Hello\')"',
        }]
      }
    } catch (fetchError) {
      console.error('Failed to fetch Docker suggestion from Python backend:', fetchError)
      workloads = [{
        image: isGpu ? 'pytorch/pytorch:2.1.0-cuda12.1-cudnn8-runtime' : 'python:3.11-slim',
        command: isGpu ? 'python -c "import torch; print(torch.__version__)"' : 'python -c "print(\'Hello\')"',
      }]
    }

    const script = generateWorkloadScript({
      workloads,
      gpu: isGpu,
    })

    return new NextResponse(script, {
      headers: {
        'Content-Type': 'application/x-sh',
      },
    })
  } catch (error) {
    console.error('Error fetching job config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job config' },
      { status: 500 }
    )
  }
}
