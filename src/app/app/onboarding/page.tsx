"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Building2,
  Settings2,
  Rocket,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Store,
  Receipt,
  BarChart3,
  Package,
  Users,
  Clock3,
  CreditCard,
  ImageIcon,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { OnboardingStepper } from "@/components/onboarding-stepper";

const STEP_LABELS = ["Welcome", "Quick Setup", "You're Ready"];

const CAPABILITIES = [
  { icon: Store, label: "Point of Sale", description: "Ring up sales and manage registers" },
  { icon: Package, label: "Inventory", description: "Track stock across locations" },
  { icon: Receipt, label: "Orders", description: "Handle online and in-store orders" },
  { icon: Users, label: "Staff", description: "Manage team roles and permissions" },
  { icon: BarChart3, label: "Reports", description: "Insights into your business performance" },
  { icon: Building2, label: "Suppliers", description: "Procurement and purchase orders" },
];

const TAX_MODE_OPTIONS = [
  { value: "no_tax", label: "No Tax", description: "Products are not taxed" },
  { value: "inclusive_tax", label: "Tax Inclusive", description: "Prices already include tax" },
  { value: "exclusive_tax", label: "Tax Exclusive", description: "Tax is added on top of prices" },
];

const NEXT_CONFIGURATION = [
  {
    icon: ImageIcon,
    title: "Brand and logo",
    description: "Add storefront identity and profile details once the business is live.",
  },
  {
    icon: Clock3,
    title: "Store hours",
    description: "Publish opening hours and customer-facing availability from settings.",
  },
  {
    icon: CreditCard,
    title: "Payments",
    description: "Connect payment rails and review receipt defaults after setup.",
  },
] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2 fields
  const [locationName, setLocationName] = useState("Main Store");
  const [taxMode, setTaxMode] = useState("no_tax");

  const handleNext = () => {
    setError(null);
    setCurrentStep((s) => s + 1);
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((s) => s - 1);
  };

  const handleComplete = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/onboarding/complete", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message ?? "Failed to complete onboarding.");
      }

      router.push("/app/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="mx-auto max-w-2xl pt-8">
        <OnboardingStepper
          currentStep={currentStep}
          totalSteps={STEP_LABELS.length}
          labels={STEP_LABELS}
        />

        {error && (
          <div className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Step 1: Welcome */}
        {currentStep === 0 && (
          <Card className="gradient-panel animate-fade-in-up">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Sparkles className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">Welcome to your new business hub!</CardTitle>
              <CardDescription className="text-base">
                Everything you need to run your business is right here. Here&apos;s what you can do:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-2">
                {CAPABILITIES.map((cap) => {
                  const Icon = cap.icon;
                  return (
                    <div
                      key={cap.label}
                      className="flex items-start gap-3 rounded-xl border border-border/60 bg-white/60 p-3 transition-colors hover:bg-muted/50"
                    >
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{cap.label}</div>
                        <div className="text-xs text-muted-foreground">{cap.description}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={handleNext} className="gap-2">
                  Get Started
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 2: Quick Setup */}
        {currentStep === 1 && (
          <Card className="gradient-panel animate-fade-in-up">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10">
                <Settings2 className="h-7 w-7 text-primary" />
              </div>
              <CardTitle className="text-2xl">Quick Setup</CardTitle>
              <CardDescription className="text-base">
                Verify your default location and choose how you handle taxes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="rounded-[24px] border border-primary/12 bg-primary/[0.05] p-4">
                <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr]">
                  <div className="space-y-2 text-left">
                    <div className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Setup preview
                    </div>
                    <div className="text-base font-semibold">What you are locking in right now</div>
                    <p className="text-sm text-muted-foreground">
                      These defaults shape the first location, receipts, taxes, and operational
                      views. You can keep refining the business profile after launch.
                    </p>
                  </div>
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div className="rounded-2xl border border-primary/10 bg-[hsl(var(--surface-lowest))]/85 px-4 py-3 text-left">
                      <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Location
                      </div>
                      <div className="mt-1 font-medium text-foreground">
                        {locationName || "Main Store"}
                      </div>
                    </div>
                    <div className="rounded-2xl border border-primary/10 bg-[hsl(var(--surface-lowest))]/85 px-4 py-3 text-left">
                      <div className="text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        Tax mode
                      </div>
                      <div className="mt-1 font-medium text-foreground">
                        {TAX_MODE_OPTIONS.find((option) => option.value === taxMode)?.label ??
                          "No Tax"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="locationName" className="text-sm font-medium">
                  Default Location Name
                </Label>
                <Input
                  id="locationName"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder="e.g. Main Store, Downtown Branch"
                />
                <p className="text-xs text-muted-foreground">
                  This is the name of your primary business location. You can add more locations
                  later.
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">Tax Mode</Label>
                <div className="grid gap-2">
                  {TAX_MODE_OPTIONS.map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setTaxMode(option.value)}
                      className={`flex items-start gap-3 rounded-xl border p-3.5 text-left transition-all ${
                        taxMode === option.value
                          ? "border-primary bg-primary/5 shadow-sm shadow-primary/10"
                          : "border-border/60 bg-white/60 hover:bg-muted/50"
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                          taxMode === option.value
                            ? "border-primary bg-primary"
                            : "border-muted-foreground/30"
                        }`}
                      >
                        {taxMode === option.value && (
                          <div className="h-2 w-2 rounded-full bg-white" />
                        )}
                      </div>
                      <div>
                        <div className="text-sm font-medium">{option.label}</div>
                        <div className="text-xs text-muted-foreground">{option.description}</div>
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  You can change this anytime in your business settings.
                </p>
              </div>

              <div className="rounded-[24px] border border-border/30 bg-[hsl(var(--surface-lowest))]/90 p-4">
                <div className="space-y-3 text-left">
                  <div>
                    <div className="text-[0.68rem] font-bold uppercase tracking-[0.18em] text-muted-foreground">
                      Configure next
                    </div>
                    <div className="mt-1 text-base font-semibold">
                      Complete the business profile after the dashboard opens
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-3">
                    {NEXT_CONFIGURATION.map((item) => {
                      const Icon = item.icon;
                      return (
                        <div
                          key={item.title}
                          className="rounded-[20px] border border-border/25 bg-[hsl(var(--surface-low))] px-4 py-4"
                        >
                          <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
                            <Icon className="size-4" />
                          </div>
                          <div className="mt-3 text-sm font-semibold">{item.title}</div>
                          <div className="mt-1 text-sm leading-6 text-muted-foreground">
                            {item.description}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={handleBack} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleNext} className="gap-2">
                  Continue
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Step 3: You're Ready */}
        {currentStep === 2 && (
          <Card className="gradient-panel animate-fade-in-up">
            <CardHeader className="text-center pb-2">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-green-500/10">
                <Rocket className="h-7 w-7 text-green-600" />
              </div>
              <CardTitle className="text-2xl">You&apos;re Ready!</CardTitle>
              <CardDescription className="text-base">
                Your business is all set up. Here&apos;s a quick summary:
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div className="rounded-xl border border-border/60 bg-white/60 p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  <div className="flex flex-1 items-center justify-between">
                    <span className="text-sm text-muted-foreground">Default location</span>
                    <span className="text-sm font-medium">{locationName || "Main Store"}</span>
                  </div>
                </div>
                <div className="border-t border-border/40" />
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  <div className="flex flex-1 items-center justify-between">
                    <span className="text-sm text-muted-foreground">Tax mode</span>
                    <span className="text-sm font-medium">
                      {TAX_MODE_OPTIONS.find((o) => o.value === taxMode)?.label ?? "No Tax"}
                    </span>
                  </div>
                </div>
                <div className="border-t border-border/40" />
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 shrink-0 text-green-500" />
                  <div className="flex flex-1 items-center justify-between">
                    <span className="text-sm text-muted-foreground">Dashboard</span>
                    <span className="text-sm font-medium">Ready to go</span>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-blue-200/60 bg-blue-50/50 p-4">
                <p className="text-sm text-blue-800">
                  <span className="font-medium">Next steps:</span> Add your products, invite staff
                  members, and start making sales. You can access all features from the dashboard.
                </p>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="outline" onClick={handleBack} className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleComplete} disabled={loading} className="gap-2">
                  {loading ? (
                    "Setting up..."
                  ) : (
                    <>
                      Go to Dashboard
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
