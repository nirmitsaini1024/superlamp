import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'

export async function GET(request: NextRequest) {
    try {
        const { userId } = await auth()

        if (!userId) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const digitalOceanToken = process.env.DIGITALOCEAN_API_TOKEN?.trim()
        if (!digitalOceanToken) {
            console.error('[Live Droplets API] DIGITALOCEAN_API_TOKEN is not set or empty')
            return NextResponse.json(
                { 
                    error: 'DigitalOcean API token not configured',
                    details: 'Please set the DIGITALOCEAN_API_TOKEN environment variable in your .env file and restart the Next.js server'
                },
                { status: 500 }
            )
        }
        
        console.log(`[Live Droplets API] Using DigitalOcean token (length: ${digitalOceanToken.length}, starts with: ${digitalOceanToken.substring(0, 10)}...)`)

        // Fetch all droplets from DigitalOcean API (handle pagination)
        let allDroplets: any[] = []
        let page = 1
        let hasMorePages = true

        while (hasMorePages) {
            const response = await fetch(`https://api.digitalocean.com/v2/droplets?page=${page}&per_page=200`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${digitalOceanToken}`,
                    'Content-Type': 'application/json'
                }
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                console.error(`[Live Droplets API] Error fetching droplets page ${page}:`, {
                    status: response.status,
                    statusText: response.statusText,
                    error: errorData
                })
                
                // If it's the first page, return error. Otherwise, break and return what we have
                if (page === 1) {
                    if (response.status === 401) {
                        return NextResponse.json(
                            { 
                                error: 'DigitalOcean API authentication failed',
                                details: errorData.message || 'Unable to authenticate with DigitalOcean API. Please check that your DIGITALOCEAN_API_TOKEN is valid and has not expired.',
                                help: 'To fix this: 1) Verify your token at https://cloud.digitalocean.com/account/api/tokens 2) Ensure the token has read/write permissions 3) Update the DIGITALOCEAN_API_TOKEN environment variable in your Next.js .env file 4) Restart your Next.js development server after updating .env'
                            },
                            { status: 401 }
                        )
                    }
                    
                    return NextResponse.json(
                        { 
                            error: 'Failed to fetch droplets from DigitalOcean',
                            details: errorData.message || `HTTP ${response.status}: ${response.statusText}`,
                            status: response.status
                        },
                        { status: response.status }
                    )
                }
                break
            }

            const data = await response.json()
            const pageDroplets = data.droplets || []
            allDroplets = [...allDroplets, ...pageDroplets]

            // Check if there are more pages
            const links = data.links || {}
            const pages = links.pages || {}
            hasMorePages = !!pages.next && pageDroplets.length > 0
            page++
        }

        const droplets = allDroplets

        console.log(`[Live Droplets API] Fetched ${droplets.length} total droplets from DigitalOcean`)

        // Format the response
        const formattedDroplets = droplets.map((d: any) => ({
            id: d.id,
            name: d.name,
            status: d.status,
            region: d.region?.slug || d.region?.name || 'unknown',
            size: d.size?.slug || 'unknown',
            image: d.image?.slug || d.image?.name || 'unknown',
            ip_address: d.networks?.v4?.find((n: any) => n.type === 'public')?.ip_address || null,
            created_at: d.created_at,
            memory: d.memory,
            vcpus: d.vcpus,
            disk: d.disk,
            monitoring: d.monitoring || false,
            tags: d.tags || []
        }))

        return NextResponse.json({
            droplets: formattedDroplets,
            count: formattedDroplets.length,
            message: 'Droplets retrieved successfully from DigitalOcean'
        })
    } catch (error) {
        console.error('Error fetching live droplets:', error)
        return NextResponse.json(
            {
                error: 'Failed to fetch live droplets',
                details: error instanceof Error ? error.message : 'Unknown error',
                droplets: [],
                count: 0
            },
            { status: 500 }
        )
    }
}


