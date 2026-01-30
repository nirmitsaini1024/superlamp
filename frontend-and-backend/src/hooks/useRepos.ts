'use client'

import { useState, useEffect, useMemo } from 'react'
import { useAuth } from './useAuth'

export interface Repository {
  id: number
  name: string
  full_name: string
  description: string | null
  private: boolean
  html_url: string
  clone_url: string
  ssh_url: string
  language: string | null
  stargazers_count: number
  forks_count: number
  updated_at: string
  created_at: string
}

export function useRepos() {
  const [allRepos, setAllRepos] = useState<Repository[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { isAuthenticated } = useAuth()

  const fetchRepos = async () => {
    if (!isAuthenticated) {
      setAllRepos([])
      return
    }

    setLoading(true)
    setError(null)
    
    try {
      // Since we removed GitHub integration, return empty array
      // In a real app, you might want to integrate with a different service
      setAllRepos([])
    } catch (err) {
      setError('Failed to fetch repositories')
      console.error('Error fetching repos:', err)
    } finally {
      setLoading(false)
    }
  }

  // Get only the last 6 repositories by updated time
  const recentRepos = useMemo(() => {
    return allRepos.slice(0, 6)
  }, [allRepos])

  useEffect(() => {
    fetchRepos()
  }, [isAuthenticated])

  return {
    allRepos,
    recentRepos,
    loading,
    error,
    refresh: fetchRepos
  }
}