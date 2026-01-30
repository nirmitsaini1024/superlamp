import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

/**
 * Enable monitoring for a droplet
 * Note: This requires the DigitalOcean Agent to be installed on the droplet.
 * The agent is typically installed automatically when monitoring is enabled during creation,
 * or can be installed manually via SSH.
 */
export async function POST(
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

    // Note: DigitalOcean doesn't have a direct API endpoint to enable monitoring on existing droplets.
    // Monitoring must be enabled during droplet creation, or the DigitalOcean Agent must be installed
    // on the droplet manually. However, we can check if monitoring is available and provide instructions.
    
    // Fetch current droplet status
    const dropletResponse = await fetch(
      `https://api.digitalocean.com/v2/droplets/${dropletId}`,
      {
        headers: {
          'Authorization': `Bearer ${digitalOceanToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!dropletResponse.ok) {
      if (dropletResponse.status === 404) {
        return NextResponse.json(
          { error: 'Droplet not found' },
          { status: 404 }
        )
      }
      
      if (dropletResponse.status === 401) {
        const errorData = await dropletResponse.json().catch(() => ({}))
        return NextResponse.json(
          { 
            error: 'DigitalOcean API authentication failed',
            details: errorData.message || 'Unable to authenticate with DigitalOcean API.'
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

    // Check if droplet already has monitoring enabled
    if (droplet.monitoring) {
      return NextResponse.json({
        success: true,
        message: 'Monitoring is already enabled for this droplet',
        monitoring: true,
        droplet_id: droplet.id
      })
    }

    // Check if droplet_agent feature is available
    const hasAgent = droplet.features?.includes('droplet_agent') || false

    return NextResponse.json({
      success: false,
      message: hasAgent 
        ? 'Monitoring can be enabled. The DigitalOcean Agent is available on this droplet.'
        : 'Monitoring requires the DigitalOcean Agent to be installed on the droplet.',
      monitoring: false,
      droplet_id: droplet.id,
      has_agent: hasAgent,
      instructions: hasAgent
        ? [
            '1. SSH into your droplet',
            '2. Install the DigitalOcean Agent: curl -sSL https://repos.insights.digitalocean.com/install.sh | sudo bash',
            '3. Or enable via DigitalOcean Control Panel: Go to your droplet → Settings → Monitoring → Enable',
            '4. Once enabled, metrics will be available after a few minutes'
          ]
        : [
            '1. Enable monitoring during droplet creation (set monitoring: true)',
            '2. Or install the DigitalOcean Agent manually via SSH',
            '3. After installation, monitoring will be automatically enabled'
          ]
    })

  } catch (error) {
    console.error('Error checking droplet monitoring:', error)
    return NextResponse.json(
      { error: 'Failed to check droplet monitoring status' },
      { status: 500 }
    )
  }
}

/**
 * Get monitoring status for a droplet
 */
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

    const digitalOceanToken = process.env.DIGITALOCEAN_API_TOKEN
    if (!digitalOceanToken) {
      return NextResponse.json(
        { 
          error: 'DigitalOcean API token not configured',
          details: 'Please set the DIGITALOCEAN_API_TOKEN environment variable.'
        },
        { status: 500 }
      )
    }

    // Fetch droplet details
    const dropletResponse = await fetch(
      `https://api.digitalocean.com/v2/droplets/${dropletId}`,
      {
        headers: {
          'Authorization': `Bearer ${digitalOceanToken}`,
          'Content-Type': 'application/json'
        }
      }
    )

    if (!dropletResponse.ok) {
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

    return NextResponse.json({
      monitoring: droplet.monitoring || false,
      has_agent: droplet.features?.includes('droplet_agent') || false,
      droplet_id: droplet.id,
      droplet_name: droplet.name,
      status: droplet.status
    })

  } catch (error) {
    console.error('Error fetching monitoring status:', error)
    return NextResponse.json(
      { error: 'Failed to fetch monitoring status' },
      { status: 500 }
    )
  }
}

