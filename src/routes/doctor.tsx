import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Users, FileText, Calendar, Activity } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth-context";

export const Route = createFileRoute("/doctor")({ component: DoctorDashboard });

function DoctorDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<{ doctor_code: string; specialization: string } | null>(null);
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("doctors").select("doctor_code, specialization").eq("id", user.id).maybeSingle(),
      supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
    ]).then(([d, p]) => {
      setDoctor(d.data);
      setProfile(p.data);
      setLoading(false);
    });
  }, [user]);

  const stats = [
    { icon: Users, label: t("dashboard.todayOpd"), value: "0" },
    { icon: Activity, label: t("dashboard.activePatients"), value: "0" },
    { icon: FileText, label: t("dashboard.pendingReports"), value: "0" },
    { icon: Calendar, label: t("dashboard.upcoming"), value: "0" },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {loading ? <Skeleton className="h-32" /> : (
          <Card className="bg-gradient-hero p-6 text-primary-foreground shadow-elevated">
            <p className="text-sm text-primary-foreground/80">{t("dashboard.welcome", { name: profile?.full_name || "Doctor" })}</p>
            <h1 className="mt-1 text-2xl font-bold">Dr. {profile?.full_name}</h1>
            <div className="mt-2 text-sm text-primary-foreground/90">
              {doctor?.specialization} · <span className="font-mono">{doctor?.doctor_code}</span>
            </div>
          </Card>
        )}
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
          <h2 className="font-semibold">{t("dashboard.todayOpd")}</h2>
          <div className="mt-4 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">{t("dashboard.none")}</div>
        </Card>
      </main>
    </div>
  );
}
