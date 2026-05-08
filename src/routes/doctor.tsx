import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Users, FileText, Calendar, Activity } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth-context";
import { ProtectedRoute } from "@/components/protected-route";

export const Route = createFileRoute("/doctor")({
  component: () => (
    <ProtectedRoute allow={["doctor"]}>
      <DoctorDashboard />
    </ProtectedRoute>
  ),
});

interface PatientCase {
  id: string;
  diagnosis: string;
  status: string;
  progress: number;
  next_appointment: string | null;
  patient_id: string;
  patient_name?: string;
  patient_code?: string;
}

function DoctorDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [doctor, setDoctor] = useState<{ doctor_code: string; specialization: string } | null>(null);
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [cases, setCases] = useState<PatientCase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [d, p, tx] = await Promise.all([
        supabase.from("doctors").select("doctor_code, specialization").eq("id", user.id).maybeSingle(),
        supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
        supabase.from("treatments").select("*").eq("doctor_id", user.id).order("next_appointment", { ascending: true }),
      ]);
      setDoctor(d.data);
      setProfile(p.data);
      const txs = (tx.data ?? []) as PatientCase[];
      // fetch patient names
      const ids = Array.from(new Set(txs.map((c) => c.patient_id)));
      if (ids.length) {
        const [{ data: profs }, { data: pats }] = await Promise.all([
          supabase.from("profiles").select("id, full_name").in("id", ids),
          supabase.from("patients").select("id, patient_code").in("id", ids),
        ]);
        const nameMap = new Map((profs ?? []).map((x) => [x.id, x.full_name]));
        const codeMap = new Map((pats ?? []).map((x) => [x.id, x.patient_code]));
        setCases(txs.map((c) => ({ ...c, patient_name: nameMap.get(c.patient_id) ?? "—", patient_code: codeMap.get(c.patient_id) ?? "" })));
      } else {
        setCases([]);
      }
      setLoading(false);
    })();
  }, [user]);

  const stats = [
    { icon: Users, label: t("dashboard.activePatients"), value: cases.length.toString() },
    { icon: Activity, label: "Treatments today", value: cases.filter((c) => c.next_appointment === new Date().toISOString().slice(0, 10)).length.toString() },
    { icon: FileText, label: t("dashboard.pendingReports"), value: "0" },
    { icon: Calendar, label: "Upcoming visits", value: cases.filter((c) => c.next_appointment).length.toString() },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {loading ? <Skeleton className="h-32" /> : (
          <Card className="bg-gradient-hero p-6 text-primary-foreground shadow-elevated">
            <p className="text-sm text-primary-foreground/80">{t("dashboard.welcome", { name: profile?.full_name || "Doctor" })}</p>
            <h1 className="mt-1 text-2xl font-bold">{profile?.full_name}</h1>
            <div className="mt-2 text-sm text-primary-foreground/90">
              {doctor?.specialization} · <span className="font-mono">{doctor?.doctor_code}</span>
            </div>
          </Card>
        )}
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
          <h2 className="font-semibold">My patients</h2>
          <div className="mt-4 space-y-3">
            {cases.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No assigned patients yet</div>
            ) : cases.map((c) => (
              <div key={c.id} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{c.patient_name}</div>
                    <div className="font-mono text-xs text-muted-foreground">{c.patient_code}</div>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    Next: <span className="text-foreground">{c.next_appointment ?? "—"}</span>
                  </div>
                </div>
                <div className="mt-2 text-sm">{c.diagnosis}</div>
                <Progress value={c.progress} className="mt-2" />
              </div>
            ))}
          </div>
        </Card>
      </main>
    </div>
  );
}
