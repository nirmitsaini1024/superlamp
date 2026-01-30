import { useState } from 'react'
import { useAuth } from '@clerk/nextjs'

export function useDropletDeletion() {
  const { getToken } = useAuth()
  const [isDeleting, setIsDeleting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const deleteDroplet = async (dropletId: number) => {
    try {
      setIsDeleting(true)
      setError(null)

      const token = await getToken()
      if (!token) {
        throw new Error('No authentication token available')
      }

      // Delete from both DigitalOcean and database via Next.js API
      const response = await fetch(`/api/droplets?dropletId=${dropletId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorData = await response.json()
        // Build a comprehensive error message
        let errorMessage = errorData.error || 'Failed to delete droplet'
        if (errorData.details) {
          errorMessage += `: ${errorData.details}`
        }
        if (errorData.help) {
          errorMessage += `\n\n${errorData.help}`
        }
        throw new Error(errorMessage)
      }

      const result = await response.json()
      return result
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMessage)
      throw err
    } finally {
      setIsDeleting(false)
    }
  }

  return {
    deleteDroplet,
    isDeleting,
    error,
    clearError: () => setError(null)
  }
}
