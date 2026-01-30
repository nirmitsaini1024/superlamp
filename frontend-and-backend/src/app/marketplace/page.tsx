"use client";

import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import {
  Store,
  Package,
  Search,
  RefreshCw,
  Server,
  Globe,
  DollarSign,
  Cpu,
  HardDrive,
  MapPin,
} from "lucide-react";

interface MarketplaceApp {
  id: number;
  name: string;
  short_name: string;
  deploy_name: string;
  type: string;
  vendor: string;
  image_id: string;
}

interface Region {
  id: string;
  city: string;
  country: string;
  continent: string;
  options: string[];
}

interface Plan {
  id: string;
  vcpu_count: number;
  ram: number;
  disk: number;
  disk_type: string;
  disk_count?: number;
  bandwidth: number;
  monthly_cost: number;
  hourly_cost: number;
  monthly_cost_preemptible?: number;
  hourly_cost_preemptible?: number;
  invoice_type?: string;
  type: string;
  locations: string[];
  cpu_vendor?: string;
  storage_type?: string;
  vcpu_type?: string;
  deploy_ondemand?: boolean;
  deploy_preemptible?: boolean;
  location_cost?: Record<string, number>;
}

interface MarketplaceData {
  applications: MarketplaceApp[];
  regions: Region[];
  plans: Plan[];
  meta?: {
    applicationsTotal: number;
    regionsTotal: number;
    plansTotal: number;
  };
}

export default function MarketplacePage() {
  const [data, setData] = useState<MarketplaceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [appSearch, setAppSearch] = useState("");
  const [appVendor, setAppVendor] = useState<string>("all");
  const [regionContinent, setRegionContinent] = useState<string>("all");
  const [planType, setPlanType] = useState<string>("all");
  const [activeSection, setActiveSection] = useState<"apps" | "regions" | "plans">("apps");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [planDialogOpen, setPlanDialogOpen] = useState(false);

  const fetchMarketplace = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch("/api/marketplace");
      if (!res.ok) throw new Error("Failed to load marketplace");
      const json = await res.json();
      setData(json);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMarketplace();
  }, []);

  const vendors = useMemo(() => {
    if (!data?.applications?.length) return [];
    const set = new Set(data.applications.map((a) => a.vendor).filter(Boolean));
    return Array.from(set).sort();
  }, [data?.applications]);

  const continents = useMemo(() => {
    if (!data?.regions?.length) return [];
    const set = new Set(data.regions.map((r) => r.continent).filter(Boolean));
    return Array.from(set).sort();
  }, [data?.regions]);

  const planTypes = useMemo(() => {
    if (!data?.plans?.length) return [];
    const set = new Set(data.plans.map((p) => p.type).filter(Boolean));
    return Array.from(set).sort();
  }, [data?.plans]);

  const filteredApps = useMemo(() => {
    if (!data?.applications) return [];
    return data.applications.filter((app) => {
      const matchSearch =
        !appSearch ||
        app.name.toLowerCase().includes(appSearch.toLowerCase()) ||
        app.deploy_name.toLowerCase().includes(appSearch.toLowerCase()) ||
        (app.vendor && app.vendor.toLowerCase().includes(appSearch.toLowerCase()));
      const matchVendor = appVendor === "all" || app.vendor === appVendor;
      return matchSearch && matchVendor;
    });
  }, [data?.applications, appSearch, appVendor]);

  const filteredRegions = useMemo(() => {
    if (!data?.regions) return [];
    if (regionContinent === "all") return data.regions;
    return data.regions.filter((r) => r.continent === regionContinent);
  }, [data?.regions, regionContinent]);

  const filteredPlans = useMemo(() => {
    if (!data?.plans) return [];
    let list = data.plans;
    if (planType !== "all") list = list.filter((p) => p.type === planType);
    return list.sort((a, b) => a.monthly_cost - b.monthly_cost);
  }, [data?.plans, planType]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading marketplace...</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <p className="text-destructive mb-4">{error ?? "No data"}</p>
          <Button onClick={fetchMarketplace} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  const meta = data.meta;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
            <Store className="w-8 h-8" />
            Market Place
          </h1>
          <p className="text-muted-foreground mt-2">
            Browse applications, regions, and plans available for deployment.
          </p>
          <div className="flex flex-wrap gap-2 mt-4">
            <Button
              variant={activeSection === "apps" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveSection("apps")}
            >
              <Package className="w-4 h-4 mr-1" />
              Applications ({meta?.applicationsTotal ?? data.applications?.length ?? 0})
            </Button>
            <Button
              variant={activeSection === "regions" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveSection("regions")}
            >
              <Globe className="w-4 h-4 mr-1" />
              Regions ({meta?.regionsTotal ?? data.regions?.length ?? 0})
            </Button>
            <Button
              variant={activeSection === "plans" ? "default" : "outline"}
              size="sm"
              onClick={() => setActiveSection("plans")}
            >
              <Server className="w-4 h-4 mr-1" />
              Plans ({meta?.plansTotal ?? data.plans?.length ?? 0})
            </Button>
          </div>
        </div>

        {/* Applications */}
        {activeSection === "apps" && (
          <section id="applications" className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center">
              <div className="relative flex-1 min-w-[200px] max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search applications..."
                  value={appSearch}
                  onChange={(e) => setAppSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <select
                value={appVendor}
                onChange={(e) => setAppVendor(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">All vendors</option>
                {vendors.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredApps.map((app) => (
                <Link
                  key={app.id}
                  href={`/marketplace/deploy/${app.id}`}
                  className="rounded-lg border border-border bg-card p-4 hover:shadow-md transition-shadow flex flex-col cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <h3 className="font-semibold text-foreground truncate" title={app.name}>
                    {app.name}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2" title={app.deploy_name}>
                    {app.deploy_name}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-1">
                    <Badge variant="secondary" className="text-xs">
                      {app.vendor}
                    </Badge>
                    <Badge variant="outline" className="text-xs font-mono">
                      {app.image_id}
                    </Badge>
                  </div>
                </Link>
              ))}
            </div>
            {filteredApps.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No applications match your filters.</p>
            )}
          </section>
        )}

        {/* Regions */}
        {activeSection === "regions" && (
          <section id="regions" className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center">
              <span className="text-sm text-muted-foreground">Continent:</span>
              <select
                value={regionContinent}
                onChange={(e) => setRegionContinent(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">All</option>
                {continents.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium">ID</th>
                      <th className="text-left p-3 font-medium">City</th>
                      <th className="text-left p-3 font-medium">Country</th>
                      <th className="text-left p-3 font-medium">Continent</th>
                      <th className="text-left p-3 font-medium">Options</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegions.map((r) => (
                      <tr key={r.id} className="border-t border-border hover:bg-muted/30">
                        <td className="p-3 font-mono">{r.id}</td>
                        <td className="p-3">{r.city}</td>
                        <td className="p-3">{r.country}</td>
                        <td className="p-3">{r.continent}</td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-1">
                            {r.options?.slice(0, 4).map((o) => (
                              <Badge key={o} variant="outline" className="text-xs">
                                {o.replace(/_/g, " ")}
                              </Badge>
                            ))}
                            {r.options?.length > 4 && (
                              <Badge variant="outline" className="text-xs">
                                +{r.options.length - 4}
                              </Badge>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {filteredRegions.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No regions match your filters.</p>
            )}
          </section>
        )}

        {/* Plans */}
        {activeSection === "plans" && (
          <section id="plans" className="space-y-4">
            <div className="flex flex-wrap gap-4 items-center">
              <span className="text-sm text-muted-foreground">Plan type:</span>
              <select
                value={planType}
                onChange={(e) => setPlanType(e.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              >
                <option value="all">All</option>
                {planTypes.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-lg border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted">
                    <tr>
                      <th className="text-left p-3 font-medium">Plan ID</th>
                      <th className="text-left p-3 font-medium">Type</th>
                      <th className="text-right p-3 font-medium">vCPU</th>
                      <th className="text-right p-3 font-medium">RAM (MB)</th>
                      <th className="text-right p-3 font-medium">Disk (GB)</th>
                      <th className="text-right p-3 font-medium">Bandwidth</th>
                      <th className="text-right p-3 font-medium">Monthly</th>
                      <th className="text-right p-3 font-medium">Locations</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPlans.map((p) => (
                      <tr
                        key={p.id}
                        role="button"
                        tabIndex={0}
                        onClick={() => {
                          setSelectedPlan(p);
                          setPlanDialogOpen(true);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedPlan(p);
                            setPlanDialogOpen(true);
                          }
                        }}
                        className="border-t border-border hover:bg-muted/50 cursor-pointer"
                      >
                        <td className="p-3 font-mono text-xs">{p.id}</td>
                        <td className="p-3">
                          <Badge variant="secondary">{p.type}</Badge>
                        </td>
                        <td className="p-3 text-right">{p.vcpu_count}</td>
                        <td className="p-3 text-right">{p.ram}</td>
                        <td className="p-3 text-right">{p.disk}</td>
                        <td className="p-3 text-right">{p.bandwidth}</td>
                        <td className="p-3 text-right font-medium">
                          <span className="flex items-center justify-end gap-1">
                            <DollarSign className="w-3 h-3" />
                            {p.monthly_cost}
                          </span>
                        </td>
                        <td className="p-3 text-right">{p.locations?.length ?? 0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            {filteredPlans.length === 0 && (
              <p className="text-muted-foreground text-center py-8">No plans match your filters.</p>
            )}
          </section>
        )}

        {/* Plan details dialog */}
        <AlertDialog open={planDialogOpen} onOpenChange={setPlanDialogOpen}>
          <AlertDialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2 font-mono text-neutral-900">
                {selectedPlan?.id}
              </AlertDialogTitle>
            </AlertDialogHeader>
            {selectedPlan && (
              <div className="grid gap-4 py-2 text-sm text-neutral-900">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="secondary" className="bg-neutral-100 text-neutral-900 border-neutral-200">
                    {selectedPlan.type}
                  </Badge>
                  {selectedPlan.cpu_vendor && (
                    <Badge variant="outline" className="border-neutral-300 text-neutral-800">
                      {selectedPlan.cpu_vendor}
                    </Badge>
                  )}
                  {selectedPlan.disk_type && (
                    <Badge variant="outline" className="border-neutral-300 text-neutral-800">
                      {selectedPlan.disk_type}
                    </Badge>
                  )}
                </div>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-neutral-500 shrink-0" />
                    <span className="text-neutral-500">vCPUs</span>
                    <span className="font-medium text-neutral-900">{selectedPlan.vcpu_count}</span>
                    {selectedPlan.vcpu_type && (
                      <span className="text-neutral-500">({selectedPlan.vcpu_type})</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-neutral-500 shrink-0" />
                    <span className="text-neutral-500">RAM</span>
                    <span className="font-medium text-neutral-900">{selectedPlan.ram} MB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-neutral-500 shrink-0" />
                    <span className="text-neutral-500">Disk</span>
                    <span className="font-medium text-neutral-900">
                      {selectedPlan.disk} GB
                      {selectedPlan.disk_count != null && selectedPlan.disk_count > 1
                        ? ` × ${selectedPlan.disk_count}`
                        : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500">Bandwidth</span>
                    <span className="font-medium text-neutral-900">{selectedPlan.bandwidth} GB</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-neutral-500 shrink-0" />
                    <span className="text-neutral-500">Monthly</span>
                    <span className="font-medium text-neutral-900">${selectedPlan.monthly_cost}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500">Hourly</span>
                    <span className="font-medium text-neutral-900">${selectedPlan.hourly_cost}</span>
                  </div>
                  {selectedPlan.monthly_cost_preemptible != null && (
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500">Monthly (preemptible)</span>
                      <span className="font-medium text-neutral-900">${selectedPlan.monthly_cost_preemptible}</span>
                    </div>
                  )}
                  {selectedPlan.hourly_cost_preemptible != null && (
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500">Hourly (preemptible)</span>
                      <span className="font-medium text-neutral-900">${selectedPlan.hourly_cost_preemptible}</span>
                    </div>
                  )}
                  {selectedPlan.invoice_type && (
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500">Invoice</span>
                      <span className="font-medium text-neutral-900">{selectedPlan.invoice_type}</span>
                    </div>
                  )}
                  {selectedPlan.storage_type && (
                    <div className="flex items-center gap-2">
                      <span className="text-neutral-500">Storage type</span>
                      <span className="font-medium text-neutral-900">{selectedPlan.storage_type.replace(/_/g, " ")}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500">Deploy on-demand</span>
                    <span className="font-medium text-neutral-900">{selectedPlan.deploy_ondemand ? "Yes" : "No"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500">Deploy preemptible</span>
                    <span className="font-medium text-neutral-900">{selectedPlan.deploy_preemptible ? "Yes" : "No"}</span>
                  </div>
                </dl>
                <div>
                  <div className="flex items-center gap-2 text-neutral-500 mb-2">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span>Locations ({selectedPlan.locations?.length ?? 0})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 rounded-md bg-neutral-100 border border-neutral-200">
                    {(selectedPlan.locations ?? []).map((loc) => (
                      <Badge key={loc} variant="outline" className="font-mono text-xs border-neutral-300 text-neutral-800">
                        {loc}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}
            <AlertDialogFooter>
              <AlertDialogCancel className="border-neutral-300 text-neutral-900 bg-white hover:bg-neutral-100">
                Close
              </AlertDialogCancel>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
