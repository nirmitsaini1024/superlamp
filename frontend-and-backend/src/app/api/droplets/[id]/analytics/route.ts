import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id: dropletId } = await params

    if (!dropletId) {
      return NextResponse.json(
        { error: 'Droplet ID is required' },
        { status: 400 }
      )
    }

    // Log the droplet ID being requested for debugging
    console.log(`[Analytics API] Fetching analytics for droplet ID: ${dropletId}`)

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

    // First, try to get droplet name from database
    let dropletName: string | null = null
    try {
      const dbDroplet = await prisma.droplet.findUnique({
        where: { dropletId: parseInt(dropletId) },
        select: { dropletName: true }
      })
      if (dbDroplet) {
        dropletName = dbDroplet.dropletName
        console.log(`[Analytics API] Found droplet in database: ${dbDroplet.dropletName}`)
      }
    } catch (dbError) {
      console.error('[Analytics API] Error fetching droplet from database:', dbError)
    }

    // Fetch droplet details with retry logic for newly created droplets
    let dropletResponse = await fetch(
      `https://api.digitalocean.com/v2/droplets/${dropletId}`,
      {
        headers: {
          'Authorization': `Bearer ${digitalOceanToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    // Track the actual droplet ID we're using (might change if we find by name)
    let actualDropletId = dropletId

    // If 404, try to find by name in live droplets (for ID mismatch cases)
    if (dropletResponse.status === 404 && dropletName) {
      console.log(`[Analytics API] Droplet ${dropletId} returned 404, searching by name: ${dropletName}`)
      try {
        const liveDropletsResponse = await fetch('https://api.digitalocean.com/v2/droplets?per_page=200', {
          headers: {
            'Authorization': `Bearer ${digitalOceanToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (liveDropletsResponse.ok) {
          const liveData = await liveDropletsResponse.json()
          const liveDroplets = liveData.droplets || []
          const foundDroplet = liveDroplets.find((d: any) => d.name === dropletName)
          
          if (foundDroplet) {
            console.log(`[Analytics API] Found droplet by name! Database ID: ${dropletId}, Actual ID: ${foundDroplet.id}`)
            actualDropletId = foundDroplet.id.toString()
            
            // Retry with the correct ID
            await new Promise(resolve => setTimeout(resolve, 1000)) // Wait 1 second
            dropletResponse = await fetch(
              `https://api.digitalocean.com/v2/droplets/${actualDropletId}`,
              {
                headers: {
                  'Authorization': `Bearer ${digitalOceanToken}`,
                  'Content-Type': 'application/json'
                }
              }
            )
            
            if (dropletResponse.ok) {
              console.log(`[Analytics API] Successfully fetched droplet using correct ID: ${actualDropletId}`)
            }
          }
        }
      } catch (fallbackError) {
        console.error('[Analytics API] Error searching by name:', fallbackError)
      }
    }

    // If still 404, check live droplets list and retry once (for newly created droplets)
    if (dropletResponse.status === 404) {
      console.log(`[Analytics API] Droplet ${actualDropletId} returned 404, checking live droplets list...`)
      try {
        const liveDropletsResponse = await fetch('https://api.digitalocean.com/v2/droplets?per_page=200', {
          headers: {
            'Authorization': `Bearer ${digitalOceanToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (liveDropletsResponse.ok) {
          const liveData = await liveDropletsResponse.json()
          const liveDroplets = liveData.droplets || []
          const foundDroplet = liveDroplets.find((d: any) => d.id === parseInt(actualDropletId))
          
          if (foundDroplet) {
            // Droplet exists in list but returned 404 - might be a timing issue, wait and retry
            console.log(`[Analytics API] Found droplet ${actualDropletId} in live list, waiting 2 seconds and retrying...`)
            await new Promise(resolve => setTimeout(resolve, 2000)) // Wait 2 seconds
            
            dropletResponse = await fetch(
              `https://api.digitalocean.com/v2/droplets/${actualDropletId}`,
              {
                headers: {
                  'Authorization': `Bearer ${digitalOceanToken}`,
                  'Content-Type': 'application/json'
                }
              }
            )
            
            if (dropletResponse.ok) {
              console.log(`[Analytics API] Retry successful for droplet ${actualDropletId}`)
            }
          }
        }
      } catch (fallbackError) {
        console.error('[Analytics API] Error checking live droplets:', fallbackError)
      }
    }

    if (!dropletResponse.ok) {
      if (dropletResponse.status === 404) {
        const errorData = await dropletResponse.json().catch(() => ({}))
        console.error(`[Analytics API] Droplet ${actualDropletId} not found in DigitalOcean after retry`, errorData)
        
        // Check live droplets list to provide better error message
        let suggestionMessage = 'Try refreshing the dashboard or use "List Live Droplets" to see all droplets currently in your DigitalOcean account.'
        let foundByName = false
        let correctId: number | null = null
        let dropletStatus: string | null = null
        
        try {
          const liveDropletsResponse = await fetch('https://api.digitalocean.com/v2/droplets?per_page=200', {
            headers: {
              'Authorization': `Bearer ${digitalOceanToken}`,
              'Content-Type': 'application/json'
            }
          })
          
          if (liveDropletsResponse.ok) {
            const liveData = await liveDropletsResponse.json()
            const liveDroplets = liveData.droplets || []
            
            // Try to find by name if we have it
            if (dropletName && liveDroplets.length > 0) {
              const foundDroplet = liveDroplets.find((d: any) => d.name === dropletName)
              if (foundDroplet) {
                foundByName = true
                correctId = foundDroplet.id
                dropletStatus = foundDroplet.status
                suggestionMessage = `Found droplet "${dropletName}" with ID ${foundDroplet.id} (database has ${dropletId}). The droplet exists but the stored ID is incorrect. Status: ${foundDroplet.status}. ${foundDroplet.status === 'new' ? 'The droplet is still provisioning - please wait for it to become active.' : foundDroplet.status !== 'active' ? 'The droplet is not active yet - analytics will be available when status is "active".' : 'Please refresh the dashboard to sync the correct ID.'}`
              }
            }
            
            if (!foundByName) {
              const foundById = liveDroplets.find((d: any) => d.id === parseInt(actualDropletId))
              
              if (!foundById && liveDroplets.length > 0) {
                suggestionMessage = `The droplet with ID ${actualDropletId} was not found. Your account has ${liveDroplets.length} other droplet(s). Use "List Live Droplets" to see them. The droplet may have been deleted or the stored ID may be incorrect.`
              } else if (liveDroplets.length === 0) {
                suggestionMessage = 'No droplets found in your DigitalOcean account. The droplet may have been deleted.'
              } else if (foundById) {
                dropletStatus = foundById.status
                suggestionMessage = `The droplet exists but status is "${foundById.status}". ${foundById.status === 'new' ? 'The droplet is still provisioning - please wait for it to become active before viewing analytics.' : foundById.status !== 'active' ? 'Analytics are only available when the droplet status is "active".' : 'Please wait a moment and try again.'}`
              }
            }
          }
        } catch (fallbackError) {
          console.error('[Analytics API] Error checking live droplets:', fallbackError)
        }
        
        return NextResponse.json(
          { 
            error: 'Droplet not found',
            details: `The droplet with ID ${actualDropletId} was not found in your DigitalOcean account. It may have been deleted, the ID may be incorrect, or the droplet may still be provisioning.`,
            help: suggestionMessage,
            ...(foundByName && correctId ? { correct_id: correctId, found_by_name: true, status: dropletStatus } : {}),
            ...(dropletStatus ? { status: dropletStatus } : {})
          },
          { status: 404 }
        )
      }
      
      if (dropletResponse.status === 401) {
        const errorData = await dropletResponse.json().catch(() => ({}))
        return NextResponse.json(
          { 
            error: 'DigitalOcean API authentication failed',
            details: errorData.message || 'Unable to authenticate with DigitalOcean API. Please check that your DIGITALOCEAN_API_TOKEN is valid and has not expired.',
            help: 'To fix this: 1) Verify your token at https://cloud.digitalocean.com/account/api/tokens 2) Ensure the token has read/write permissions 3) Update the DIGITALOCEAN_API_TOKEN environment variable'
          },
          { status: 401 }
        )
      }
      
      const errorData = await dropletResponse.json().catch(() => ({}))
      return NextResponse.json(
        { 
          error: 'Failed to fetch droplet details',
          details: errorData.message || 'Unknown error'
        },
        { status: dropletResponse.status }
      )
    }

    const dropletData = await dropletResponse.json()
    const droplet = dropletData.droplet

    console.log(`[Analytics API] Successfully fetched droplet ${actualDropletId}: ${droplet.name} (status: ${droplet.status})`)

    // Check if droplet is active before fetching metrics
    if (droplet.status !== 'active') {
      const statusMessage = droplet.status === 'new' 
        ? 'The droplet is still provisioning. Please wait for it to become active before viewing analytics.'
        : `Droplet status is "${droplet.status}". Metrics are only available when the droplet status is "active".`
      
      return NextResponse.json({
        droplet: {
          id: droplet.id,
          name: droplet.name,
          status: droplet.status,
          region: droplet.region.slug,
          size: droplet.size.slug,
          memory: droplet.memory,
          vcpus: droplet.vcpus,
          disk: droplet.disk,
          created_at: droplet.created_at,
          ip_address: droplet.networks?.v4?.[0]?.ip_address,
          monitoring: droplet.monitoring,
          tags: droplet.tags || [],
          features: droplet.features || [],
          size_slug: droplet.size.slug,
          size_memory: droplet.size.memory,
          size_disk: droplet.size.disk,
          size_vcpus: droplet.size.vcpus,
          size_price_hourly: droplet.size.price_hourly,
          size_price_monthly: droplet.size.price_monthly
        },
        metrics: null,
        message: statusMessage
      })
    }

    // Fetch metrics for the last 24 hours (only available if monitoring is enabled)
    const now = new Date()
    const startTime = new Date(now.getTime() - 24 * 60 * 60 * 1000) // 24 hours ago
    const endTime = now

    // Fetch CPU metrics
    let cpuMetrics = null
    try {
      const cpuResponse = await fetch(
        `https://api.digitalocean.com/v2/monitoring/metrics/droplet/cpu?host_id=${actualDropletId}&start=${startTime.toISOString()}&end=${endTime.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${digitalOceanToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      if (cpuResponse.ok) {
        const cpuData = await cpuResponse.json()
        cpuMetrics = cpuData.data?.result?.[0]?.values || []
      }
    } catch (error) {
      console.error('Error fetching CPU metrics:', error)
    }

    // Fetch memory metrics (available when monitoring is enabled)
    let memoryMetrics = null
    try {
      const memoryResponse = await fetch(
        `https://api.digitalocean.com/v2/monitoring/metrics/droplet/memory_utilization_percent?host_id=${actualDropletId}&start=${startTime.toISOString()}&end=${endTime.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${digitalOceanToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      if (memoryResponse.ok) {
        const memoryData = await memoryResponse.json()
        memoryMetrics = memoryData.data?.result?.[0]?.values || []
      }
    } catch (error) {
      console.error('Error fetching memory metrics:', error)
    }

    // Fetch filesystem metrics (disk usage)
    let diskMetrics = null
    try {
      const diskResponse = await fetch(
        `https://api.digitalocean.com/v2/monitoring/metrics/droplet/filesystem_free?host_id=${actualDropletId}&start=${startTime.toISOString()}&end=${endTime.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${digitalOceanToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      if (diskResponse.ok) {
        const diskData = await diskResponse.json()
        diskMetrics = diskData.data?.result?.[0]?.values || []
      }
    } catch (error) {
      console.error('Error fetching disk metrics:', error)
    }

    // Fetch network inbound metrics
    let networkInMetrics = null
    try {
      const networkInResponse = await fetch(
        `https://api.digitalocean.com/v2/monitoring/metrics/droplet/interface_rx?host_id=${actualDropletId}&start=${startTime.toISOString()}&end=${endTime.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${digitalOceanToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      if (networkInResponse.ok) {
        const networkInData = await networkInResponse.json()
        networkInMetrics = networkInData.data?.result?.[0]?.values || []
      }
    } catch (error) {
      console.error('Error fetching network inbound metrics:', error)
    }

    // Fetch network outbound metrics
    let networkOutMetrics = null
    try {
      const networkOutResponse = await fetch(
        `https://api.digitalocean.com/v2/monitoring/metrics/droplet/interface_tx?host_id=${actualDropletId}&start=${startTime.toISOString()}&end=${endTime.toISOString()}`,
        {
          headers: {
            'Authorization': `Bearer ${digitalOceanToken}`,
            'Content-Type': 'application/json'
          }
        }
      )
      if (networkOutResponse.ok) {
        const networkOutData = await networkOutResponse.json()
        networkOutMetrics = networkOutData.data?.result?.[0]?.values || []
      }
    } catch (error) {
      console.error('Error fetching network outbound metrics:', error)
    }

    const metrics = {
      cpu: cpuMetrics,
      memory: memoryMetrics,
      disk: diskMetrics,
      network: {
        inbound: networkInMetrics,
        outbound: networkOutMetrics
      }
    }

    // Fetch additional droplet information
    const dropletInfo = {
      id: droplet.id,
      name: droplet.name,
      status: droplet.status,
      region: droplet.region.slug,
      memory: droplet.memory,
      vcpus: droplet.vcpus,
      disk: droplet.disk,
      created_at: droplet.created_at,
      ip_address: droplet.networks?.v4?.[0]?.ip_address,
      monitoring: droplet.monitoring,
      tags: droplet.tags || [],
      features: droplet.features || [],
      size_slug: droplet.size.slug,
      size_memory: droplet.size.memory,
      size_disk: droplet.size.disk,
      size_vcpus: droplet.size.vcpus,
      size_price_hourly: droplet.size.price_hourly,
      size_price_monthly: droplet.size.price_monthly
    }

    return NextResponse.json({
      droplet: dropletInfo,
      metrics,
      message: 'Analytics retrieved successfully'
    })

  } catch (error) {
    console.error('Error fetching droplet analytics:', error)
    return NextResponse.json(
      { error: 'Failed to fetch droplet analytics' },
      { status: 500 }
    )
  }
}
