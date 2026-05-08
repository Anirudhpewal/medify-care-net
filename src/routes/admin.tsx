import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Users, IndianRupee, Bed, Building2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { ProtectedRoute } from "@/components/protected-route";

export const Route = createFileRoute("/admin")({
  component: () => (
    <ProtectedRoute allow={["admin"]}>
      <AdminDashboard />
    </ProtectedRoute>
  ),
});

function AdminDashboard() {
  const { t } = useTranslation();
  const [counts, setCounts] = useState({ patients: 0, doctors: 0, hospitals: 0, revenue: 0 });
  const [topHospitals, setTopHospitals] = useState<{ id: string; name: string; city: string | null; rating: number | null }[]>([]);

  useEffect(() => {
    (async () => {
      const [pat, doc, hos, pay, top] = await Promise.all([
        supabase.from("patients").select("*", { count: "exact", head: true }),
        supabase.from("doctors").select("*", { count: "exact", head: true }),
        supabase.from("hospitals").select("*", { count: "exact", head: true }),
        supabase.from("payments").select("amount"),
        supabase.from("hospitals").select("id, name, city, rating").order("rating", { ascending: false }).limit(8),
      ]);
      setCounts({
        patients: pat.count ?? 0,
        doctors: doc.count ?? 0,
        hospitals: hos.count ?? 0,
        revenue: (pay.data ?? []).reduce((s, r) => s + Number(r.amount), 0),
      });
      setTopHospitals(top.data ?? []);
    })();
  }, []);

  const stats = [
    { icon: Users, label: t("dashboard.totalPatients"), value: counts.patients.toString() },
    { icon: IndianRupee, label: "Total revenue", value: `₹${counts.revenue.toLocaleString("en-IN")}` },
    { icon: Bed, label: "Doctors", value: counts.doctors.toString() },
    { icon: Building2, label: "Hospitals", value: counts.hospitals.toString() },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Card className="bg-gradient-hero p-6 text-primary-foreground shadow-elevated">
          <h1 className="text-2xl font-bold">Hospital Admin</h1>
          <p className="mt-1 text-sm text-primary-foreground/80">Live analytics across the HealthFlow network.</p>
        </Card>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <Card key={s.label} className="p-5 shadow-card">
              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">{s.label}</div>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="mt-2 text-3xl font-bold">{s.value}</div>
            </Card>
          ))}
        </div>

        <Card className="mt-6 p-6 shadow-card">
          <h2 className="font-semibold">Top-rated hospitals</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {topHospitals.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                <div>
                  <div className="font-medium">{h.name}</div>
                  <div className="text-xs text-muted-foreground">{h.city}</div>
                </div>
                <div className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-semibold text-success">★ {h.rating}</div>
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
