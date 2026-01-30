"use client";

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@/hooks/useUser'
import { useDropletDeletion } from '@/hooks/useDropletDeletion'
import { useDropletAnalytics } from '@/hooks/useDropletAnalytics'
import { GPUAnalyticsModal } from '@/components/gpu-analytics-modal'
import { 
  Server, 
  MapPin, 
  Cpu, 
  HardDrive, 
  Clock, 
  DollarSign,
  ExternalLink,
  RefreshCw,
  Trash2,
  BarChart3,
  List,
  X,
  Activity
} from 'lucide-react'

interface Droplet {
  id: string
  dropletId: number
  dropletName: string
  dropletStatus: string
  region: string
  size: string
  image: string
  ipAddress?: string
  projectName?: string
  userInput: string
  costPerHour?: number
  expirationTime?: string
  isDeleted?: boolean
  deletedAt?: string
  createdAt: string
  updatedAt: string
}

export default function Dashboard() {
  const { isSignedIn, isLoaded, dbUser, loading: userLoading } = useUser()
  const { deleteDroplet, isDeleting, error: deleteError, clearError } = useDropletDeletion()
  const { fetchAnalytics, isLoading: analyticsLoading, error: analyticsError, analytics, clearError: clearAnalyticsError } = useDropletAnalytics()
  const router = useRouter()
  const [droplets, setDroplets] = useState<Droplet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<number | null>(null)
  const [selectedDropletId, setSelectedDropletId] = useState<number | null>(null)
  const [showAnalytics, setShowAnalytics] = useState(false)
  const [loadingAnalyticsId, setLoadingAnalyticsId] = useState<number | null>(null)
  const [extendingId, setExtendingId] = useState<number | null>(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [showLiveDroplets, setShowLiveDroplets] = useState(false)
  const [liveDroplets, setLiveDroplets] = useState<any[]>([])
  const [loadingLiveDroplets, setLoadingLiveDroplets] = useState(false)
  const [liveDropletsError, setLiveDropletsError] = useState<string | null>(null)

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/')
      return
    }
    
    if (isLoaded && isSignedIn && dbUser) {
      fetchDroplets()
    }
  }, [isLoaded, isSignedIn, dbUser, router])

  // Update current time every second for live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const fetchDroplets = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch('/api/droplets')
      if (!response.ok) {
        throw new Error('Failed to fetch droplets')
      }
      const data = await response.json()
      setDroplets(data.droplets)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteDroplet = async (dropletId: number, dropletName: string) => {
    if (!confirm(`Are you sure you want to delete "${dropletName}"? This action cannot be undone.`)) {
      return
    }

    try {
      setDeletingId(dropletId)
      clearError()
      await deleteDroplet(dropletId)
      // Remove the deleted droplet from the local state
      setDroplets(prev => prev.filter(d => d.dropletId !== dropletId))
    } catch (err) {
      console.error('Failed to delete droplet:', err)
    } finally {
      setDeletingId(null)
    }
  }

  const handleViewAnalytics = async (dropletId: number) => {
    try {
      console.log(`[Dashboard] Attempting to fetch analytics for droplet ID: ${dropletId}`)
      setSelectedDropletId(dropletId)
      setLoadingAnalyticsId(dropletId)
      clearAnalyticsError()
      await fetchAnalytics(dropletId)
      setShowAnalytics(true)
    } catch (err) {
      console.error('Failed to fetch analytics:', err)
      // The error is already set by the hook
    } finally {
      setLoadingAnalyticsId(null)
    }
  }

  const handleCloseAnalytics = () => {
    setShowAnalytics(false)
    setSelectedDropletId(null)
    setLoadingAnalyticsId(null)
    clearAnalyticsError()
  }

  const handleExtendExpiration = async (dropletId: number) => {
    try {
      setExtendingId(dropletId)
      const response = await fetch(`/api/droplets/${dropletId}/extend`, {
        method: 'POST',
      })
      
      if (!response.ok) {
        throw new Error('Failed to extend expiration')
      }
      
      // Refresh droplets list
      await fetchDroplets()
    } catch (err) {
      console.error('Failed to extend expiration:', err)
      alert('Failed to extend expiration time')
    } finally {
      setExtendingId(null)
    }
  }

  const fetchLiveDroplets = async () => {
    try {
      setLoadingLiveDroplets(true)
      setLiveDropletsError(null)
      const response = await fetch('/api/droplets/live')
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to fetch live droplets')
      }
      const data = await response.json()
      setLiveDroplets(data.droplets || [])
      setShowLiveDroplets(true)
    } catch (err) {
      setLiveDropletsError(err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setLoadingLiveDroplets(false)
    }
  }

  const getTimeRemaining = (expirationTime?: string, isDeleted?: boolean) => {
    if (isDeleted) return 'Expired'
    if (!expirationTime) return null
    
    // Use currentTime state for live updates
    const expiration = new Date(expirationTime)
    const diff = expiration.getTime() - currentTime.getTime()
    
    if (diff <= 0) return 'Expired'
    
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor((diff % 60000) / 1000)
    
    if (minutes > 0) {
      return `${minutes}m ${seconds}s`
    }
    return `${seconds}s`
  }

  const isExpired = (droplet: Droplet) => {
    if (droplet.isDeleted) return true
    if (!droplet.expirationTime) return false
    return new Date(droplet.expirationTime) <= new Date()
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800'
      case 'new':
        return 'bg-blue-100 text-blue-800'
      case 'off':
        return 'bg-gray-100 text-gray-800'
      case 'archive':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-yellow-100 text-yellow-800'
    }
  }

  const getRegionName = (region: string) => {
    const regionMap: { [key: string]: string } = {
      'tor1': 'Toronto',
      'nyc1': 'New York',
      'nyc2': 'New York 2',
      'sfo2': 'San Francisco 2',
      'sfo3': 'San Francisco',
      'ams3': 'Amsterdam',
      'sgp1': 'Singapore',
      'lon1': 'London',
      'fra1': 'Frankfurt',
      'blr1': 'Bangalore'
    }
    return regionMap[region] || region
  }

  const getSizeName = (size: string) => {
    const sizeMap: { [key: string]: string } = {
      'gpu-4000adax1-20gb': 'GPU 4000ADA (20GB)',
      'gpu-6000adax1-48gb': 'GPU 6000ADA (48GB)',
      'gpu-h100x1-80gb': 'GPU H100 (80GB)',
      'gpu-h200x1-141gb': 'GPU H200 (141GB)',
      's-1vcpu-1gb': 'Basic 1GB',
      's-1vcpu-2gb': 'Basic 2GB',
      's-2vcpu-4gb': 'Basic 4GB',
      's-4vcpu-8gb': 'Basic 8GB',
      's-8vcpu-16gb': 'Basic 16GB'
    }
    return sizeMap[size] || size
  }

  if (!isLoaded || userLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading...</span>
        </div>
      </div>
    )
  }

  if (!isSignedIn) {
    return null
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 animate-spin" />
          <span>Loading your droplets...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground">GPU Droplets Dashboard</h1>
            <p className="text-muted-foreground mt-2">
              Manage your DigitalOcean droplets created through AI
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchLiveDroplets}
              disabled={loadingLiveDroplets}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <List className="w-4 h-4" />
              {loadingLiveDroplets ? 'Loading...' : 'List Live Droplets'}
            </button>
            <button
              onClick={fetchDroplets}
              className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>
        </div>

        {(error || deleteError || analyticsError) && (
          <div className="mb-6 p-4 bg-red-100 border border-red-300 text-red-700 rounded-lg">
            <div className="whitespace-pre-line">
              {error || deleteError || analyticsError}
            </div>
            {(deleteError || analyticsError) && (
              <button
                onClick={() => {
                  if (deleteError) clearError()
                  if (analyticsError) clearAnalyticsError()
                }}
                className="mt-2 text-red-600 hover:text-red-800 underline"
              >
                Dismiss
              </button>
            )}
          </div>
        )}

        {droplets.length === 0 ? (
          <div className="text-center py-12">
            <Server className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold text-foreground mb-2">No droplets found</h3>
            <p className="text-muted-foreground mb-4">
              Create your first GPU droplet using the chat interface
            </p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90"
            >
              Create Droplet
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {droplets.map((droplet) => {
              const expired = isExpired(droplet)
              return (
              <div
                key={droplet.id}
                className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">{droplet.dropletName}</h3>
                  </div>
                  <div className="flex items-center gap-2">
                    {expired ? (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                        Expired
                      </span>
                    ) : (
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(droplet.dropletStatus)}`}
                      >
                        {droplet.dropletStatus}
                      </span>
                    )}
                    {!expired && (
                      <>
                        <button
                          onClick={() => handleViewAnalytics(droplet.dropletId)}
                          disabled={loadingAnalyticsId === droplet.dropletId}
                          className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title={loadingAnalyticsId === droplet.dropletId ? "Loading analytics..." : "View analytics"}
                        >
                          {loadingAnalyticsId === droplet.dropletId ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <BarChart3 className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteDroplet(droplet.dropletId, droplet.dropletName)}
                          disabled={deletingId === droplet.dropletId || isDeleting}
                          className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete droplet"
                        >
                          {deletingId === droplet.dropletId ? (
                            <RefreshCw className="w-4 h-4 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4" />
                    <span>{getRegionName(droplet.region)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Cpu className="w-4 h-4" />
                    <span>{getSizeName(droplet.size)}</span>
                  </div>

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <HardDrive className="w-4 h-4" />
                    <span>{droplet.image}</span>
                  </div>

                  {droplet.ipAddress && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <ExternalLink className="w-4 h-4" />
                      <span>{droplet.ipAddress}</span>
                    </div>
                  )}

                  {droplet.costPerHour && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <DollarSign className="w-4 h-4" />
                      <span>${droplet.costPerHour}/hour</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="w-4 h-4" />
                    <span>{new Date(droplet.createdAt).toLocaleDateString()}</span>
                  </div>

                  {(droplet.expirationTime || expired) && (
                    <div className="flex items-center justify-between text-sm pt-2 border-t border-border">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        <span>Expires: <span className={expired ? 'text-red-600 font-medium' : ''}>{getTimeRemaining(droplet.expirationTime, droplet.isDeleted) || 'Expired'}</span></span>
                        {droplet.deletedAt && (
                          <span className="text-xs text-red-500">(Deleted: {new Date(droplet.deletedAt).toLocaleString()})</span>
                        )}
                      </div>
                      {!expired && (
                        <button
                          onClick={() => handleExtendExpiration(droplet.dropletId)}
                          disabled={extendingId === droplet.dropletId}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                          title="Extend by 10 minutes"
                        >
                          {extendingId === droplet.dropletId ? (
                            <RefreshCw className="w-3 h-3 animate-spin" />
                          ) : (
                            <>
                              <span>+</span>
                              <span>10m</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {droplet.projectName && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <span className="text-xs text-muted-foreground">Project: </span>
                    <span className="text-xs font-medium text-foreground">{droplet.projectName}</span>
                  </div>
                )}

                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs text-muted-foreground italic">
                    &quot;{droplet.userInput}&quot;
                  </p>
                </div>
              </div>
            )
            })}
          </div>
        )}
      </div>

      {/* GPU Analytics Modal */}
      <GPUAnalyticsModal
        isOpen={showAnalytics}
        onClose={handleCloseAnalytics}
        analytics={analytics}
        isLoading={analyticsLoading}
        error={analyticsError}
      />

      {/* Live Droplets Modal */}
      {showLiveDroplets && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Live Droplets from DigitalOcean
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  {liveDroplets.length} droplet(s) found
                </p>
              </div>
              <button
                onClick={() => setShowLiveDroplets(false)}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {liveDropletsError && (
                <div className="mb-4 p-4 bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-700 text-red-700 dark:text-red-300 rounded-lg">
                  {liveDropletsError}
                </div>
              )}

              {liveDroplets.length === 0 ? (
                <div className="text-center py-12">
                  <Server className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500 dark:text-gray-400">No droplets found in your DigitalOcean account</p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {liveDroplets.map((droplet) => (
                    <div
                      key={droplet.id}
                      className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg border border-gray-200 dark:border-gray-600"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Server className="w-4 h-4 text-primary" />
                          <h3 className="font-semibold text-gray-900 dark:text-white">{droplet.name}</h3>
                        </div>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(droplet.status)}`}>
                          {droplet.status}
                        </span>
                      </div>
                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-300">{getRegionName(droplet.region)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-300">{droplet.vcpus} vCPU, {droplet.memory}MB RAM</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <HardDrive className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600 dark:text-gray-300">{getSizeName(droplet.size)}</span>
                        </div>
                        {droplet.ip_address && (
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-gray-400" />
                            <span className="text-gray-600 dark:text-gray-300 font-mono text-xs">{droplet.ip_address}</span>
                          </div>
                        )}
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          Created: {new Date(droplet.created_at).toLocaleString()}
                        </div>
                        {droplet.monitoring && (
                          <div className="text-xs text-green-600 dark:text-green-400">
                            ✓ Monitoring enabled
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
