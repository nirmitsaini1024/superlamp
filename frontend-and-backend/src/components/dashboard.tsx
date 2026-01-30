"use client";

import { useState } from "react";
import { useRepos } from "@/hooks/useRepos";
import { RepoCard } from "./repo-card";
import { Repository } from "@/hooks/useRepos";
import { Button } from "@/components/ui/button";
import { Search, X } from "lucide-react";
import { ProjectSetupForm } from "./project/project-form";
import { Input } from "@/components/ui/input";

export function Dashboard() {
  const { allRepos, recentRepos, loading, error } = useRepos();
  const [showAllRepos, setShowAllRepos] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRepo, setSelectedRepo] = useState<Repository | null>(null);

  const handleImport = (repo: Repository) => {
    setSelectedRepo(repo);
  };

  const handleBackToRepos = () => {
    setSelectedRepo(null);
  };

  // If a repository is selected, show the project setup form
  if (selectedRepo) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Button
            onClick={handleBackToRepos}
            variant="ghost"
            className="mb-6 text-muted-foreground hover:text-foreground"
          >
            ← Back to repositories
          </Button>
          <ProjectSetupForm repo={selectedRepo} />
        </div>
      </div>
    );
  }

  // Filter repositories based on search query
  const filteredRepos = allRepos.filter(
    (repo) =>
      repo.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      repo.full_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Show loading state while initially fetching repos
  if (loading && allRepos.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-xl">Loading repositories...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground text-xl">Error loading repositories</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {!showAllRepos ? (
          // Show recent repositories
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  Recent Repositories
                </h2>
                <p className="text-muted-foreground mt-1">
                  Your 6 most recently updated repositories
                </p>
              </div>
              <Button
                onClick={() => setShowAllRepos(true)}
                variant="outline"
                className="border-border text-foreground hover:bg-accent"
              >
                View All ({allRepos.length})
              </Button>
            </div>

            {recentRepos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {recentRepos.map((repo) => (
                  <RepoCard key={repo.id} repo={repo} onImport={handleImport} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-muted-foreground">
                  <p className="text-lg font-medium mb-2">
                    No repositories found
                  </p>
                  <p className="text-sm">
                    Create your first repository on GitHub to get started
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          // Show all repositories with search
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-foreground">
                  All Repositories
                </h2>
                <p className="text-muted-foreground mt-1">
                  {filteredRepos.length} of {allRepos.length} repositories
                </p>
              </div>
              <Button
                onClick={() => setShowAllRepos(false)}
                variant="outline"
                className="border-border text-foreground hover:bg-accent"
              >
                Show Recent
              </Button>
            </div>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search repositories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-10"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>

            {filteredRepos.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredRepos.map((repo) => (
                  <RepoCard key={repo.id} repo={repo} onImport={handleImport} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="text-muted-foreground">
                  {searchQuery ? (
                    <>
                      <p className="text-lg font-medium mb-2">
                        No repositories found
                      </p>
                      <p className="text-sm">
                        Try adjusting your search criteria
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-medium mb-2">
                        No repositories yet
                      </p>
                      <p className="text-sm">
                        Create your first repository on GitHub to get started
                      </p>
                    </>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
