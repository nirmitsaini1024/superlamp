'use client'

import { useUser, useAuth as useClerkAuth } from '@clerk/nextjs'

export function useAuth() {
  const { user, isLoaded } = useUser()
  const { signOut } = useClerkAuth()

  const login = () => {
    // Clerk handles login through SignInButton component
    // This function is kept for compatibility but won't be used
  }

  const logout = () => {
    signOut()
  }

  return {
    user: user ? {
      id: user.id,
      login: user.username || user.emailAddresses[0]?.emailAddress || '',
      email: user.emailAddresses[0]?.emailAddress || '',
      avatar_url: user.imageUrl || '',
      name: user.fullName || user.firstName || user.lastName || null
    } : null,
    loading: !isLoaded,
    isAuthenticated: !!user,
    login,
    logout
  }
}