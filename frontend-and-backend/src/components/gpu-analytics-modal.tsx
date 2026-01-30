"use client"

import { useState, useEffect } from 'react'
import { X, Server, Cpu, HardDrive, Database, Activity, DollarSign, MapPin, Clock, Tag, RefreshCw, ExternalLink } from 'lucide-react'
import { DropletAnalytics } from '@/hooks/useDropletAnalytics'

interface GPUAnalyticsModalProps {
  isOpen: boolean
  onClose: () => void
  analytics: DropletAnalytics | null
  isLoading: boolean
  error: string | null
}

export function GPUAnalyticsModal({ isOpen, onClose, analytics, isLoading, error }: GPUAnalyticsModalProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'details'>('overview')

  if (!isOpen) return null

  const formatBytes = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    if (bytes === 0) return '0 Bytes'
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 4
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'text-green-600 bg-green-100'
      case 'new':
        return 'text-blue-600 bg-blue-100'
      case 'off':
        return 'text-gray-600 bg-gray-100'
      case 'archive':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-yellow-600 bg-yellow-100'
    }
  }

  const getRegionName = (region: string) => {
    const regionMap: { [key: string]: string } = {
      'tor1': 'Toronto',
      'nyc1': 'New York',
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
      's-1vcpu-1gb': 'Basic 1GB',
      's-1vcpu-2gb': 'Basic 2GB',
      's-2vcpu-4gb': 'Basic 4GB',
      's-4vcpu-8gb': 'Basic 8GB',
      's-8vcpu-16gb': 'Basic 16GB'
    }
    return sizeMap[size] || size
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <Server className="w-6 h-6 text-primary" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
              {analytics?.droplet.name || 'GPU Analytics'}
            </h2>
            {isLoading && (
              <div className="flex items-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-500" />
                <span className="text-sm text-gray-500">Loading...</span>
              </div>
            )}
            {analytics?.droplet && !isLoading && (
              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(analytics.droplet.status)}`}>
                {analytics.droplet.status}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          {['overview', 'metrics', 'details'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 text-sm font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'text-primary dark:text-white border-b-2 border-primary bg-primary/5 dark:bg-primary/20'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="relative">
                <Activity className="w-8 h-8 animate-spin text-primary" />
                <div className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
              </div>
              <div className="mt-4 text-center">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Fetching GPU Analytics
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Retrieving data from DigitalOcean API...
                </p>
                <div className="mt-4 flex items-center justify-center space-x-1">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          )}

          {error && !isLoading && (
            <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {analytics && !isLoading && (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Cpu className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">CPU</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {analytics.droplet.vcpus} vCPUs
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <Database className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Memory</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatBytes(analytics.droplet.memory * 1024 * 1024)}
                      </p>
                    </div>

                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="flex items-center gap-2 mb-2">
                        <HardDrive className="w-4 h-4 text-primary" />
                        <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Storage</span>
                      </div>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {formatBytes(analytics.droplet.disk * 1024 * 1024 * 1024)}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Basic Information</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">Region:</span>
                          <span className="text-sm font-medium">{getRegionName(analytics.droplet.region)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Server className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">Size:</span>
                          <span className="text-sm font-medium">{getSizeName(analytics.droplet.size_slug)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span className="text-sm text-gray-600 dark:text-gray-300">Created:</span>
                          <span className="text-sm font-medium">
                            {new Date(analytics.droplet.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        {analytics.droplet.ip_address && (
                          <div className="flex items-center gap-2">
                            <Activity className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-600 dark:text-gray-300">IP Address:</span>
                            <span className="text-sm font-medium font-mono">{analytics.droplet.ip_address}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Pricing</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Hourly:</span>
                          <span className="text-sm font-medium">{formatCurrency(analytics.droplet.size_price_hourly)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-600 dark:text-gray-300">Monthly:</span>
                          <span className="text-sm font-medium">{formatCurrency(analytics.droplet.size_price_monthly)}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {analytics.droplet.tags && analytics.droplet.tags.length > 0 && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {analytics.droplet.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full"
                          >
                            <Tag className="w-3 h-3" />
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Metrics Tab */}
              {activeTab === 'metrics' && (
                <div className="space-y-6">
                  {!analytics.droplet.monitoring && (
                    <div className="bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-300 dark:border-yellow-700 text-yellow-700 dark:text-yellow-300 px-4 py-4 rounded-lg">
                      <p className="font-medium mb-2 flex items-center gap-2">
                        <Activity className="w-4 h-4" />
                        Monitoring is disabled
                      </p>
                      <p className="text-sm mb-3">
                        Enable monitoring to view detailed metrics (CPU, Memory, Disk, Network). Metrics are only available when monitoring is enabled on the droplet.
                      </p>
                      <div className="space-y-2 text-sm">
                        <p className="font-medium">How to enable monitoring:</p>
                        <div className="space-y-2 pl-4">
                          <div>
                            <p className="font-medium mb-1">Option 1: Via DigitalOcean Control Panel (Recommended)</p>
                            <ol className="list-decimal list-inside space-y-1 text-xs text-yellow-800 dark:text-yellow-400">
                              <li>Go to <a 
                                href={`https://cloud.digitalocean.com/droplets/${analytics.droplet.id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="underline hover:text-yellow-900 dark:hover:text-yellow-200"
                              >your droplet in DigitalOcean</a></li>
                              <li>Click on "Settings" tab</li>
                              <li>Scroll to "Monitoring" section</li>
                              <li>Click "Enable" button</li>
                              <li>Wait a few minutes for metrics to start collecting</li>
                            </ol>
                          </div>
                          <div>
                            <p className="font-medium mb-1">Option 2: Via SSH (If you have access)</p>
                            <ol className="list-decimal list-inside space-y-1 text-xs text-yellow-800 dark:text-yellow-400">
                              <li>SSH into your droplet</li>
                              <li>Run: <code className="bg-yellow-200 dark:bg-yellow-800 px-1 rounded">curl -sSL https://repos.insights.digitalocean.com/install.sh | sudo bash</code></li>
                              <li>Wait a few minutes for the agent to start collecting metrics</li>
                            </ol>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-yellow-300 dark:border-yellow-700">
                          <a
                            href={`https://cloud.digitalocean.com/droplets/${analytics.droplet.id}/settings`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded-lg text-sm font-medium transition-colors"
                          >
                            <ExternalLink className="w-4 h-4" />
                            Open DigitalOcean Control Panel
                          </a>
                        </div>
                      </div>
                    </div>
                  )}

                  {analytics.metrics ? (
                    <div className="space-y-6">
                      {/* CPU Metrics */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <Cpu className="w-5 h-5" />
                          CPU Usage (Last 24 Hours)
                        </h3>
                        {analytics.metrics.cpu && analytics.metrics.cpu.length > 0 ? (
                          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              CPU metrics are available but require a charting library to display properly.
                            </div>
                            <div className="text-xs text-gray-500">
                              Data points: {analytics.metrics.cpu.length}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            No CPU metrics available. Enable monitoring to collect metrics.
                          </div>
                        )}
                      </div>

                      {/* Memory Metrics */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <Database className="w-5 h-5" />
                          Memory Usage (Last 24 Hours)
                        </h3>
                        {analytics.metrics.memory && analytics.metrics.memory.length > 0 ? (
                          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              Memory utilization metrics are available.
                            </div>
                            <div className="text-xs text-gray-500">
                              Data points: {analytics.metrics.memory.length}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            No memory metrics available. Enable monitoring to collect metrics.
                          </div>
                        )}
                      </div>

                      {/* Disk Metrics */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <HardDrive className="w-5 h-5" />
                          Disk Usage (Last 24 Hours)
                        </h3>
                        {analytics.metrics.disk && analytics.metrics.disk.length > 0 ? (
                          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                            <div className="text-sm text-gray-600 dark:text-gray-300 mb-2">
                              Filesystem free space metrics are available.
                            </div>
                            <div className="text-xs text-gray-500">
                              Data points: {analytics.metrics.disk.length}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            No disk metrics available. Enable monitoring to collect metrics.
                          </div>
                        )}
                      </div>

                      {/* Network Metrics */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                          <Activity className="w-5 h-5" />
                          Network Traffic (Last 24 Hours)
                        </h3>
                        {analytics.metrics.network && (analytics.metrics.network.inbound || analytics.metrics.network.outbound) ? (
                          <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-3">
                            {analytics.metrics.network.inbound && analytics.metrics.network.inbound.length > 0 && (
                              <div>
                                <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                                  Inbound Traffic
                                </div>
                                <div className="text-xs text-gray-500">
                                  Data points: {analytics.metrics.network.inbound.length}
                                </div>
                              </div>
                            )}
                            {analytics.metrics.network.outbound && analytics.metrics.network.outbound.length > 0 && (
                              <div>
                                <div className="text-sm text-gray-600 dark:text-gray-300 mb-1">
                                  Outbound Traffic
                                </div>
                                <div className="text-xs text-gray-500">
                                  Data points: {analytics.metrics.network.outbound.length}
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="text-center py-4 text-gray-500 text-sm">
                            No network metrics available. Enable monitoring to collect metrics.
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">
                        {analytics.message || 'Metrics are not available for this droplet. Enable monitoring to collect metrics.'}
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* Details Tab */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Technical Specifications</h3>
                    <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-300">Droplet ID:</span>
                          <span className="ml-2 font-mono">{analytics.droplet.id}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-300">Size Slug:</span>
                          <span className="ml-2 font-mono">{analytics.droplet.size_slug}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-300">Monitoring:</span>
                          <span className="ml-2">{analytics.droplet.monitoring ? 'Enabled' : 'Disabled'}</span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-300">Features:</span>

                          <span className="ml-2">{analytics.droplet.features?.length ? analytics.droplet.features.join(', ') : 'None'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resource Allocation</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                          {analytics.droplet.size_vcpus}
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400">vCPUs</div>
                      </div>
                      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                          {formatBytes(analytics.droplet.size_memory * 1024 * 1024)}
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400">RAM</div>
                      </div>
                      <div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg">
                        <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                          {formatBytes(analytics.droplet.size_disk * 1024 * 1024 * 1024)}
                        </div>
                        <div className="text-sm text-purple-600 dark:text-purple-400">SSD Storage</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
