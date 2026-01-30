import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { resolveJobToDropletId } from '@/lib/resolve-job'
import { prisma } from '@/lib/prisma'

/** DigitalOcean image slugs (droplet OS) -> Docker Hub image:tag for runner containers */
const DO_IMAGE_SLUG_TO_DOCKER: Record<string, string> = {
  'ubuntu-25-10-x64': 'ubuntu:25.10',
  'ubuntu-25-04-x64': 'ubuntu:25.04',
  'ubuntu-24-04-x64': 'ubuntu:24.04',
  'ubuntu-22-04-x64': 'ubuntu:22.04',
  'debian-12-x64': 'debian:12',
  'centos-9-x64': 'centos:9',
}

function dropletImageToDockerImage(slug: string | null | undefined): string {
  const s = slug?.trim()
  if (!s) return 'ubuntu:22.04'
  return DO_IMAGE_SLUG_TO_DOCKER[s] ?? s
}

/**
 * GET /api/jobs/:id/config
 * Returns job configuration for a droplet.
 * :id can be droplet ID or name. Called by runner (no auth) and by UI (auth optional).
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

    // Determine if GPU based on size slug
    const isGpu = droplet.size.startsWith('gpu-')

    // droplet.image is the DO OS slug (e.g. ubuntu-22-04-x64); map to Docker image for the runner
    let dockerImage = dropletImageToDockerImage(droplet.image) || 'ubuntu:22.04'
    let dockerCommand = 'python train.py'

    // Try to extract docker image from userInput
    const dockerImageMatch = droplet.userInput.match(/docker[:\s]+([^\s]+)/i) ||
                             droplet.userInput.match(/image[:\s]+([^\s]+)/i) ||
                             droplet.userInput.match(/run[:\s]+([^\s]+)/i)

    if (dockerImageMatch) {
      dockerImage = dockerImageMatch[1]
    }

    // Try to extract command from userInput
    const commandMatch = droplet.userInput.match(/command[:\s]+(.+)/i) ||
                         droplet.userInput.match(/run[:\s]+.+\s+(.+)/i)

    if (commandMatch) {
      dockerCommand = commandMatch[1].trim()
    }

    const config = {
      bootstrap: {
        scripts: ['base_setup'],
      },
      runtime: {
        docker: {
          image: dockerImage,
          command: dockerCommand,
          gpu: isGpu,
        },
      },
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error('Error fetching job config:', error)
    return NextResponse.json(
      { error: 'Failed to fetch job config' },
      { status: 500 }
    )
  }
}
