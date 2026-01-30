import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
  return handleCleanup()
}

export async function POST(request: NextRequest) {
  return handleCleanup()
}

async function handleCleanup() {
  const startTime = new Date()
  console.log(`[CRONJOB] Starting cleanup at ${startTime.toISOString()}`)
  
  try {
    const now = new Date()
    console.log(`[CRONJOB] Checking for expired droplets (current time: ${now.toISOString()})`)
    
    // Find all droplets that have expired and are not already marked as deleted
    // Only check droplets that have an expirationTime set (not null)
    const allDroplets = await prisma.droplet.findMany({
      where: {
        dropletStatus: {
          not: 'archive' // Don't try to delete already archived droplets
        }
      }
    })
    
    // Filter in JavaScript to handle:
    // 1. Null expirationTime (skip droplets without expiration)
    // 2. Already deleted droplets (skip if isDeleted is true)
    // 3. Expired droplets (expirationTime <= now)
    const expiredDroplets = allDroplets.filter(droplet => {
      // Skip if already marked as deleted
      if ((droplet as any).isDeleted === true) {
        return false
      }
      // Skip droplets without expiration time
      if (!droplet.expirationTime) {
        return false
      }
      // Check if expired
      return new Date(droplet.expirationTime) <= now
    })

    console.log(`[CRONJOB] Found ${expiredDroplets.length} expired droplet(s)`)

    if (expiredDroplets.length === 0) {
      console.log(`[CRONJOB] No expired droplets to delete`)
      return NextResponse.json({ 
        message: 'No expired droplets found',
        deleted: 0,
        timestamp: now.toISOString()
      })
    }

    const digitalOceanToken = process.env.DIGITALOCEAN_API_TOKEN
    if (!digitalOceanToken) {
      console.error('[CRONJOB] ERROR: DigitalOcean API token not configured')
      return NextResponse.json({ 
        error: 'DigitalOcean API token not configured' 
      }, { status: 500 })
    }

    let deletedCount = 0
    const errors: string[] = []

    // Delete each expired droplet
    for (const droplet of expiredDroplets) {
      try {
        console.log(`[CRONJOB] Processing droplet: ${droplet.dropletName} (ID: ${droplet.dropletId}, Expired at: ${droplet.expirationTime?.toISOString()})`)
        
        // Delete from DigitalOcean
        const deleteResponse = await fetch(
          `https://api.digitalocean.com/v2/droplets/${droplet.dropletId}`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${digitalOceanToken}`,
              'Content-Type': 'application/json'
            }
          }
        )

        if (!deleteResponse.ok && deleteResponse.status !== 404) {
          const errorText = await deleteResponse.text()
          throw new Error(`Failed to delete droplet ${droplet.dropletId}: ${deleteResponse.status} - ${errorText}`)
        }

        if (deleteResponse.status === 404) {
          console.log(`[CRONJOB] Droplet ${droplet.dropletId} not found in DigitalOcean (already deleted), marking as deleted in database`)
        } else {
          console.log(`[CRONJOB] Successfully deleted droplet ${droplet.dropletId} from DigitalOcean`)
        }

        // Mark as deleted in database instead of hard deleting
        // Use type assertion to handle fields that might not be in Prisma client yet
        await prisma.droplet.update({
          where: {
            dropletId: droplet.dropletId
          },
          data: {
            isDeleted: true,
            deletedAt: new Date(),
            dropletStatus: 'archive' // Mark status as archive
          } as any
        })

        deletedCount++
        console.log(`[CRONJOB] ✓ Marked expired droplet as deleted: ${droplet.dropletName} (ID: ${droplet.dropletId})`)
      } catch (error) {
        const errorMsg = `Error deleting droplet ${droplet.dropletId}: ${error instanceof Error ? error.message : 'Unknown error'}`
        errors.push(errorMsg)
        console.error(`[CRONJOB] ✗ ${errorMsg}`)
      }
    }

    const endTime = new Date()
    const duration = endTime.getTime() - startTime.getTime()
    
    console.log(`[CRONJOB] Cleanup completed in ${duration}ms. Deleted ${deletedCount}/${expiredDroplets.length} droplets`)
    
    return NextResponse.json({
      message: `Cleanup completed. Deleted ${deletedCount} expired droplets.`,
      deleted: deletedCount,
      total: expiredDroplets.length,
      errors: errors.length > 0 ? errors : undefined,
      timestamp: endTime.toISOString(),
      duration: `${duration}ms`
    })
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error'
    console.error(`[CRONJOB] FATAL ERROR: ${errorMsg}`, error)
    return NextResponse.json(
      { 
        error: 'Failed to run cleanup', 
        details: errorMsg,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    )
  }
}

