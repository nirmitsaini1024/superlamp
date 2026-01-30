"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Rocket,
  Server,
  Globe,
  DollarSign,
  Cpu,
  HardDrive,
  Loader2,
  Check,
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
}

export default function DeployPage() {
  const params = useParams();
  const router = useRouter();
  const appId = params.appId as string;

  const [data, setData] = useState<{
    applications: MarketplaceApp[];
    regions: Region[];
    plans: Plan[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [step, setStep] = useState<"plan" | "region">("plan");
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [selectedRegion, setSelectedRegion] = useState<Region | null>(null);
  const [label, setLabel] = useState("");
  const [hostname, setHostname] = useState("");
  const [deployLoading, setDeployLoading] = useState(false);
  const [deployError, setDeployError] = useState<string | null>(null);
  const [deploySuccess, setDeploySuccess] = useState<{ instance?: unknown } | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/marketplace");
        if (!res.ok) throw new Error("Failed to load marketplace");
        const json = await res.json();
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const app = useMemo(
    () => data?.applications?.find((a) => String(a.id) === appId),
    [data?.applications, appId]
  );

  const plansList = useMemo(() => {
    if (!data?.plans) return [];
    return [...data.plans].sort((a, b) => a.monthly_cost - b.monthly_cost);
  }, [data?.plans]);

  const regionsList = useMemo(() => {
    if (!data?.regions || !selectedPlan?.locations?.length) return [];
    return data.regions.filter((r) => selectedPlan.locations.includes(r.id));
  }, [data?.regions, selectedPlan]);

  useEffect(() => {
    if (app && !label) {
      const slug = app.short_name?.replace(/\s+/g, "-").toLowerCase() || `app-${app.id}`;
      const suffix = Math.random().toString(36).slice(2, 6);
      setLabel(`${slug}-${suffix}`);
      setHostname(`${slug}-${suffix}`);
    }
  }, [app, label]);

  const onSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
    setSelectedRegion(null);
    setStep("region");
  };

  const onSelectRegion = (region: Region) => {
    setSelectedRegion(region);
  };

  const changePlan = () => {
    setSelectedPlan(null);
    setSelectedRegion(null);
    setStep("plan");
  };

  const submitDeploy = async () => {
    if (!app || !selectedPlan || !selectedRegion) return;
    try {
      setDeployLoading(true);
      setDeployError(null);
      setDeploySuccess(null);
      const res = await fetch("/api/vultr/deploy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_id: app.image_id,
          plan: selectedPlan.id,
          region: selectedRegion.id,
          label: label.trim() || undefined,
          hostname: hostname.trim() || undefined,
          enable_ipv6: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) {
        setDeployError(json.error || json.details || "Deploy failed");
        return;
      }
      setDeploySuccess(json);
    } catch (e) {
      setDeployError(e instanceof Error ? e.message : "Deploy failed");
    } finally {
      setDeployLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
          <span className="text-muted-foreground">Loading…</span>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <p className="text-destructive mb-4">{error ?? "No data"}</p>
          <Link href="/marketplace">
            <Button variant="outline">Back to Market Place</Button>
          </Link>
        </div>
      </div>
    );
  }

  if (!app) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center max-w-md">
          <p className="text-destructive mb-4">Application not found.</p>
          <Link href="/marketplace">
            <Button variant="outline">Back to Market Place</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Link
          href="/marketplace"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Market Place
        </Link>

        <h1 className="text-2xl font-bold text-foreground mb-1">Deploy: {app.name}</h1>
        <p className="text-muted-foreground text-sm mb-8">{app.deploy_name}</p>

        {/* Step 1: Select plan */}
        {step === "plan" && (
          <section className="space-y-4">
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Server className="w-5 h-5" />
              1. Select a plan
            </h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {plansList.map((plan) => (
                <button
                  key={plan.id}
                  type="button"
                  onClick={() => onSelectPlan(plan)}
                  className="rounded-lg border-2 border-border bg-card p-4 text-left hover:border-primary hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <div className="font-mono text-sm font-medium text-foreground">{plan.id}</div>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3 h-3" />
                      {plan.vcpu_count} vCPU
                    </span>
                    <span className="flex items-center gap-1">
                      <HardDrive className="w-3 h-3" />
                      {plan.ram} MB RAM, {plan.disk} GB
                    </span>
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      ${plan.monthly_cost}/mo
                    </span>
                  </div>
                  <Badge variant="secondary" className="mt-2 text-xs">
                    {plan.type}
                  </Badge>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Step 2: Select region */}
        {step === "region" && selectedPlan && (
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <button
                type="button"
                onClick={changePlan}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                ← Change plan
              </button>
            </div>
            <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
              <Globe className="w-5 h-5" />
              2. Select a region
            </h2>
            <p className="text-sm text-muted-foreground">
              Plan: <span className="font-mono text-foreground">{selectedPlan.id}</span>
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              {regionsList.map((region) => (
                <button
                  key={region.id}
                  type="button"
                  onClick={() => onSelectRegion(region)}
                  className={`rounded-lg border-2 p-4 text-left transition-colors focus:outline-none focus:ring-2 focus:ring-ring ${
                    selectedRegion?.id === region.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/50 hover:bg-muted/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-foreground">{region.city}</span>
                    {selectedRegion?.id === region.id && (
                      <Check className="w-4 h-4 text-primary" />
                    )}
                  </div>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {region.id} · {region.continent}
                  </div>
                </button>
              ))}
            </div>
          </section>
        )}

        {/* Summary and Deploy (when plan + region selected) */}
        {selectedPlan && selectedRegion && (
          <section className="mt-10 pt-8 border-t border-border space-y-6">
            <h2 className="text-lg font-semibold text-foreground">Summary</h2>
            <div className="rounded-lg border border-border bg-card p-4 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Application</span>
                <span className="font-medium text-foreground">{app.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-mono text-foreground">{selectedPlan.id}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Region</span>
                <span className="text-foreground">
                  {selectedRegion.city} ({selectedRegion.id})
                </span>
              </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-4 space-y-4">
              <h3 className="text-sm font-medium text-foreground">Plan Details</h3>
              <div className="flex flex-wrap gap-2 mb-2">
                <Badge variant="secondary">{selectedPlan.type}</Badge>
                {selectedPlan.cpu_vendor && (
                  <Badge variant="outline">{selectedPlan.cpu_vendor}</Badge>
                )}
                {selectedPlan.disk_type && (
                  <Badge variant="outline">{selectedPlan.disk_type}</Badge>
                )}
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex items-center gap-2">
                  <Cpu className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">vCPUs</span>
                  <span className="font-medium text-foreground">{selectedPlan.vcpu_count}</span>
                  {selectedPlan.vcpu_type && (
                    <span className="text-muted-foreground">({selectedPlan.vcpu_type})</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">RAM</span>
                  <span className="font-medium text-foreground">{selectedPlan.ram} MB</span>
                </div>
                <div className="flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Disk</span>
                  <span className="font-medium text-foreground">
                    {selectedPlan.disk} GB
                    {selectedPlan.disk_count != null && selectedPlan.disk_count > 1
                      ? ` × ${selectedPlan.disk_count}`
                      : ""}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Bandwidth</span>
                  <span className="font-medium text-foreground">{selectedPlan.bandwidth} GB</span>
                </div>
                <div className="flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-muted-foreground">Monthly</span>
                  <span className="font-medium text-foreground">${selectedPlan.monthly_cost}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Hourly</span>
                  <span className="font-medium text-foreground">${selectedPlan.hourly_cost}</span>
                </div>
                {selectedPlan.monthly_cost_preemptible != null && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Monthly (preemptible)</span>
                    <span className="font-medium text-foreground">${selectedPlan.monthly_cost_preemptible}</span>
                  </div>
                )}
                {selectedPlan.hourly_cost_preemptible != null && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Hourly (preemptible)</span>
                    <span className="font-medium text-foreground">${selectedPlan.hourly_cost_preemptible}</span>
                  </div>
                )}
                {selectedPlan.invoice_type && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Invoice</span>
                    <span className="font-medium text-foreground">{selectedPlan.invoice_type}</span>
                  </div>
                )}
                {selectedPlan.storage_type && (
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Storage type</span>
                    <span className="font-medium text-foreground">{selectedPlan.storage_type.replace(/_/g, " ")}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Deploy on-demand</span>
                  <span className="font-medium text-foreground">{selectedPlan.deploy_ondemand ? "Yes" : "No"}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Deploy preemptible</span>
                  <span className="font-medium text-foreground">{selectedPlan.deploy_preemptible ? "Yes" : "No"}</span>
                </div>
              </dl>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Label (optional)
                </label>
                <Input
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="e.g. ols-wordpress-01"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                  Hostname (optional)
                </label>
                <Input
                  value={hostname}
                  onChange={(e) => setHostname(e.target.value)}
                  placeholder="e.g. ols-wp-01"
                />
              </div>
            </div>

            {deployError && (
              <p className="text-sm text-destructive">{deployError}</p>
            )}
            {deploySuccess && (
              <div className="rounded-lg border border-border bg-card p-4 text-sm">
                <p className="font-medium text-foreground">Instance created successfully.</p>
                <pre className="mt-2 text-xs overflow-x-auto text-muted-foreground">
                  {JSON.stringify(deploySuccess.instance, null, 2)}
                </pre>
              </div>
            )}

            {!deploySuccess && (
              <Button
                onClick={submitDeploy}
                disabled={deployLoading}
                className="w-full py-8 text-lg"
              >
                {deployLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Deploying…
                  </>
                ) : (
                  <>
                    <Rocket className="mr-2 h-8 w-8" />
                    Deploy instance
                  </>
                )}
              </Button>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
