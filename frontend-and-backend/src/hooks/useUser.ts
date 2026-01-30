import { useState, useEffect } from 'react'
import { useUser as useClerkUser, useAuth } from '@clerk/nextjs'

interface User {
  id: string
  clerkId: string
  email: string | null
  firstName: string | null
  lastName: string | null
  username: string | null
  createdAt: string
  updatedAt: string
}

export function useUser() {
  const { isSignedIn, isLoaded, user: clerkUser } = useClerkUser()
  const { getToken } = useAuth()
  const [dbUser, setDbUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createUser = async () => {
    if (!clerkUser) return

    try {
      setLoading(true)
      setError(null)

      const token = await getToken()
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: clerkUser.emailAddresses[0]?.emailAddress,
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
          username: clerkUser.username,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create user')
      }

      const data = await response.json()
      setDbUser(data.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const fetchUser = async () => {
    if (!clerkUser) return

    try {
      setLoading(true)
      setError(null)

      const token = await getToken()
      const response = await fetch('/api/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })
      
      if (response.status === 404) {
        // User doesn't exist, create them
        await createUser()
        return
      }

      if (!response.ok) {
        throw new Error('Failed to fetch user')
      }

      const data = await response.json()
      setDbUser(data.user)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (isLoaded && isSignedIn && clerkUser && !dbUser) {
      fetchUser()
    }
  }, [isLoaded, isSignedIn, clerkUser, dbUser])

  return {
    isSignedIn,
    isLoaded,
    clerkUser,
    dbUser,
    loading,
    error,
    createUser,
    fetchUser
  }
}
