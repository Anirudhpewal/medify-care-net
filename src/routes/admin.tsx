import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Users, IndianRupee, Bed, AlertCircle } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
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
  const stats = [
    { icon: Users, label: t("dashboard.totalPatients"), value: "—" },
    { icon: IndianRupee, label: t("dashboard.todayRevenue"), value: "₹—" },
    { icon: Bed, label: t("dashboard.bedsAvailable"), value: "—" },
    { icon: AlertCircle, label: t("dashboard.pendingReports"), value: "—" },
  ];
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        <Card className="bg-gradient-hero p-6 text-primary-foreground shadow-elevated">
          <h1 className="text-2xl font-bold">Hospital Admin</h1>
          <p className="mt-1 text-sm text-primary-foreground/80">Dashboard for hospital operations & analytics.</p>
        </Card>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stats.map(s => (
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
          <h2 className="font-semibold">Coming in Phase 2</h2>
          <p className="mt-2 text-sm text-muted-foreground">Bed management, pharmacy inventory, blood bank, billing & payments, complaints, staff management.</p>
        </Card>
      </main>
    </div>
  );
}
