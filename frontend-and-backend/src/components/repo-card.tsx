"use client"

import { Repository } from "@/hooks/useRepos"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ExternalLink, GitBranch, Star, Eye } from "lucide-react"

interface RepoCardProps {
  repo: Repository
  onImport?: (repo: Repository) => void
}

export function RepoCard({ repo, onImport }: RepoCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  return (
    <div className="group relative bg-card border border-border rounded-lg p-4 hover:border-ring transition-all duration-200">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-card-foreground font-medium truncate">
              {repo.name}
            </h3>
            {repo.private && (
              <Badge variant="secondary" className="text-xs bg-secondary text-secondary-foreground">
                Private
              </Badge>
            )}
          </div>
          <p className="text-muted-foreground text-sm truncate">
            {repo.full_name}
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => window.open(repo.html_url, '_blank')}
        >
          <ExternalLink className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      {repo.description && (
        <p className="text-card-foreground text-sm mb-3 line-clamp-2">
          {repo.description}
        </p>
      )}

      <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
        {repo.language && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-chart-1"></div>
            <span>{repo.language}</span>
          </div>
        )}
        <div className="flex items-center gap-1">
          <Star className="h-3 w-3" />
          <span>{repo.stargazers_count}</span>
        </div>
        <div className="flex items-center gap-1">
          <GitBranch className="h-3 w-3" />
          <span>{repo.forks_count}</span>
        </div>
        <div className="flex items-center gap-1">
          <Eye className="h-3 w-3" />
          <span>Updated {formatDate(repo.updated_at)}</span>
        </div>
      </div>

      {onImport && (
        <Button
          onClick={() => onImport(repo)}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
          size="sm"
        >
          Import Repository
        </Button>
      )}
    </div>
  )
} 