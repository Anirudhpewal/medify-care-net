import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Database } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { DemoCredentialsCard } from "@/components/demo-credentials-card";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";

export const Route = createFileRoute("/demo-credentials")({ component: DemoCredentialsPage });

function DemoCredentialsPage() {
  const [seeding, setSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<string | null>(null);

  const runSeed = async () => {
    setSeeding(true);
    setSeedResult(null);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/seed-demo`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.error ?? "Seed failed");
      setSeedResult(`Seeded ${data.seededPatients} patients + 3 demo accounts.`);
      toast.success("Demo data seeded successfully");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Seed failed");
      setSeedResult(`Error: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setSeeding(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteHeader />
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:px-6">
        <h1 className="text-3xl font-bold tracking-tight">Demo credentials</h1>
        <p className="mt-2 text-muted-foreground">Try HealthFlow with three pre-built accounts. Click <strong>Quick Login</strong> to auto-fill and sign in.</p>

        <Card className="mt-6 p-5 shadow-card">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="font-semibold">First time? Seed the demo data.</div>
              <p className="text-sm text-muted-foreground">Creates the 3 demo accounts and populates Anirudh's medical history.</p>
            </div>
            <Button onClick={runSeed} disabled={seeding} className="bg-gradient-primary text-primary-foreground hover:opacity-90">
              {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Database className="mr-2 h-4 w-4" />}
              {seeding ? "Seeding…" : "Seed demo data"}
            </Button>
          </div>
          {seedResult && <div className="mt-3 rounded-md bg-muted p-3 text-sm">{seedResult}</div>}
        </Card>

        <div className="mt-6">
          <DemoCredentialsCard />
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
