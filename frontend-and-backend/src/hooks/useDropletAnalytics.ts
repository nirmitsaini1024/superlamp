import { useState, useCallback } from 'react'

export interface DropletAnalytics {
  droplet: {
    id: number
    name: string
    status: string
    region: string
    memory: number
    vcpus: number
    disk: number
    created_at: string
    ip_address?: string
    monitoring: boolean
    tags: string[]
    features: string[]
    size_slug: string
    size_memory: number
    size_disk: number
    size_vcpus: number
    size_price_hourly: number
    size_price_monthly: number
  }
  metrics: {
    cpu: Array<[number, string]> | null
    memory: Array<[number, string]> | null
    disk: Array<[number, string]> | null
    network: {
      inbound: Array<[number, string]> | null
      outbound: Array<[number, string]> | null
    } | null
  } | null
  message: string
}

export interface UseDropletAnalyticsReturn {
  fetchAnalytics: (dropletId: number) => Promise<DropletAnalytics>
  isLoading: boolean
  error: string | null
  analytics: DropletAnalytics | null
  clearError: () => void
}

export function useDropletAnalytics(): UseDropletAnalyticsReturn {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<DropletAnalytics | null>(null)

  const fetchAnalytics = useCallback(async (dropletId: number): Promise<DropletAnalytics> => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/droplets/${dropletId}/analytics`)
      
      if (!response.ok) {
        const errorData = await response.json()
        // Build a comprehensive error message
        let errorMessage = errorData.error || 'Failed to fetch analytics'
        if (errorData.details) {
          errorMessage += `: ${errorData.details}`
        }
        if (errorData.help) {
          errorMessage += `\n\n${errorData.help}`
        }
        throw new Error(errorMessage)
      }

      const data = await response.json()
      setAnalytics(data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  return {
    fetchAnalytics,
    isLoading,
    error,
    analytics,
    clearError
  }
}




