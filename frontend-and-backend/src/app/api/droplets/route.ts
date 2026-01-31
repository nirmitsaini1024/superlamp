import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Try to find droplets for this user
        // Handle both old format (Clerk ID as string) and new format (ObjectID)
        let droplets: any[] = []

        try {
            // First try with the current user ID (Clerk ID)
            // Include both active and deleted droplets (deleted ones will be marked as expired in UI)
            droplets = await prisma.droplet.findMany({
                where: {
                    userId: userId
                },
                orderBy: {
                    createdAt: 'desc'
                }
            })
        } catch (objectIdError) {
            // If that fails due to ObjectID error, return empty array
            console.log('No droplets found for user:', userId)
            droplets = []
        }

        return NextResponse.json({
            droplets,
            count: droplets.length,
            message: droplets.length === 0 ? 'No droplets found' : 'Droplets retrieved successfully'
        })
    } catch (error) {
        console.error('Error fetching droplets:', error)
        return NextResponse.json(
            {
                error: 'Failed to fetch droplets',
                droplets: [],
                count: 0
            },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const {
            dropletId,
            dropletName,
            dropletStatus,
            region,
            size,
            image,
            ipAddress,
            projectName,
            userInput,
            envType,
            costPerHour,
            durationMinutes
        } = body

        console.log(`[API] Saving droplet to database:`, {
            dropletId,
            dropletName,
            dropletStatus,
            userId
        });

        // Calculate expiration time
        // Default: 30 minutes, min: 1 minute, max: 60 minutes
        let expirationMinutes = 30
        if (durationMinutes !== undefined && durationMinutes !== null) {
            expirationMinutes = Math.max(1, Math.min(60, parseInt(String(durationMinutes)) || 30))
        }
        
        const expirationTime = new Date()
        expirationTime.setMinutes(expirationTime.getMinutes() + expirationMinutes)

        // Verify droplet exists in DigitalOcean before saving (to catch ID mismatches)
        const digitalOceanToken = process.env.DIGITALOCEAN_API_TOKEN
        if (digitalOceanToken) {
            try {
                const verifyResponse = await fetch(
                    `https://api.digitalocean.com/v2/droplets/${dropletId}`,
                    {
                        headers: {
                            'Authorization': `Bearer ${digitalOceanToken}`,
                            'Content-Type': 'application/json'
                        }
                    }
                )
                
                if (verifyResponse.ok) {
                    const verifyData = await verifyResponse.json()
                    const actualDroplet = verifyData.droplet
                    console.log(`[API] Verified droplet exists in DigitalOcean:`, {
                        storedId: dropletId,
                        actualId: actualDroplet.id,
                        name: actualDroplet.name,
                        status: actualDroplet.status
                    })
                    
                    // Warn if ID mismatch
                    if (actualDroplet.id !== parseInt(dropletId)) {
                        console.warn(`[API] ⚠️ ID MISMATCH! Database will store: ${dropletId}, but DigitalOcean has: ${actualDroplet.id}`)
                    }
                } else {
                    console.warn(`[API] ⚠️ Could not verify droplet ${dropletId} in DigitalOcean: ${verifyResponse.status} - This might indicate an ID mismatch!`)
                }
            } catch (verifyError) {
                console.error('[API] Error verifying droplet in DigitalOcean:', verifyError)
            }
        }

        // Check if droplet already exists
        const existingDroplet = await prisma.droplet.findUnique({
            where: {
                dropletId: dropletId
            }
        })

        if (existingDroplet) {
            // Update existing droplet
            const updatedDroplet = await prisma.droplet.update({
                where: {
                    dropletId: dropletId
                },
                data: {
                    dropletStatus,
                    ipAddress,
                    updatedAt: new Date()
                }
            })
            return NextResponse.json({ droplet: updatedDroplet })
        }

        // Create new droplet record
        const droplet = await prisma.droplet.create({
            data: {
                userId: userId,
                dropletId,
                dropletName,
                dropletStatus,
                region,
                size,
                image,
                ipAddress,
                projectName,
                userInput,
                envType: envType ?? null,
                costPerHour,
                expirationTime
            }
        })

    return NextResponse.json({ droplet })
  } catch (error) {
    console.error('Error creating/updating droplet:', error)
    return NextResponse.json(
      { error: 'Failed to create/update droplet' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const dropletId = searchParams.get('dropletId')
    
    if (!dropletId) {
      return NextResponse.json(
        { error: 'Droplet ID is required' },
        { status: 400 }
      )
    }

    // Delete the droplet from DigitalOcean API directly
    try {
      const digitalOceanToken = process.env.DIGITALOCEAN_API_TOKEN
      if (!digitalOceanToken) {
        return NextResponse.json(
          { 
            error: 'DigitalOcean API token not configured',
            details: 'Please set the DIGITALOCEAN_API_TOKEN environment variable in your server configuration.'
          },
          { status: 500 }
        )
      }

      const deleteResponse = await fetch(`https://api.digitalocean.com/v2/droplets/${dropletId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${digitalOceanToken}`,
          'Content-Type': 'application/json'
        }
      })

      if (!deleteResponse.ok) {
        if (deleteResponse.status === 404) {
          // Droplet not found, but we'll still delete from our database
          console.log(`Droplet ${dropletId} not found in DigitalOcean, proceeding with database cleanup`)
        } else if (deleteResponse.status === 401) {
          const errorData = await deleteResponse.json().catch(() => ({}))
          return NextResponse.json(
            { 
              error: 'DigitalOcean API authentication failed',
              details: errorData.message || 'Unable to authenticate with DigitalOcean API. Please check that your DIGITALOCEAN_API_TOKEN is valid and has not expired.',
              help: 'To fix this: 1) Verify your token at https://cloud.digitalocean.com/account/api/tokens 2) Ensure the token has read/write permissions 3) Update the DIGITALOCEAN_API_TOKEN environment variable'
            },
            { status: 401 }
          )
        } else {
          const errorData = await deleteResponse.json().catch(() => ({}))
          return NextResponse.json(
            { 
              error: 'Failed to delete droplet from DigitalOcean',
              details: errorData.message || 'Unknown error'
            },
            { status: deleteResponse.status }
          )
        }
      }
    } catch (apiError) {
      console.error('DigitalOcean API error:', apiError)
      return NextResponse.json(
        { 
          error: 'Failed to connect to DigitalOcean API',
          details: apiError instanceof Error ? apiError.message : 'Unknown error occurred'
        },
        { status: 500 }
      )
    }

    // Then, delete the droplet record from our database
    const deletedDroplet = await prisma.droplet.delete({
      where: {
        dropletId: parseInt(dropletId)
      }
    })

    return NextResponse.json({ 
      message: 'Droplet deleted successfully',
      droplet: deletedDroplet
    })
  } catch (error) {
    console.error('Error deleting droplet:', error)
    return NextResponse.json(
      { error: 'Failed to delete droplet' },
      { status: 500 }
    )
  }
}
