import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const dropletId = parseInt(id)
    if (isNaN(dropletId)) {
      return NextResponse.json(
        { error: 'Invalid droplet ID' },
        { status: 400 }
      )
    }

    // Find the droplet and verify ownership
    const droplet = await prisma.droplet.findUnique({
      where: {
        dropletId: dropletId
      }
    })

    if (!droplet) {
      return NextResponse.json(
        { error: 'Droplet not found' },
        { status: 404 }
      )
    }

    if (droplet.userId !== userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      )
    }

    // Don't allow extending deleted/expired droplets
    if (droplet.isDeleted) {
      return NextResponse.json(
        { error: 'Cannot extend expiration for deleted droplets' },
        { status: 400 }
      )
    }

    // Extend expiration by 10 minutes
    const currentExpiration = droplet.expirationTime || new Date()
    const newExpiration = new Date(currentExpiration)
    newExpiration.setMinutes(newExpiration.getMinutes() + 10)

    // Update droplet
    const updatedDroplet = await prisma.droplet.update({
      where: {
        dropletId: dropletId
      },
      data: {
        expirationTime: newExpiration
      }
    })

    return NextResponse.json({
      message: 'Expiration time extended by 10 minutes',
      droplet: updatedDroplet,
      expirationTime: updatedDroplet.expirationTime
    })
  } catch (error) {
    console.error('Error extending expiration:', error)
    return NextResponse.json(
      { error: 'Failed to extend expiration' },
      { status: 500 }
    )
  }
}

