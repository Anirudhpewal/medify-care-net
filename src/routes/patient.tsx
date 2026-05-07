import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, FileText, CreditCard, Download } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth-context";
import { ProtectedRoute } from "@/components/protected-route";
import { PatientIdCard } from "@/components/patient-id-card";

export const Route = createFileRoute("/patient")({
  component: () => (
    <ProtectedRoute allow={["patient"]}>
      <PatientDashboard />
    </ProtectedRoute>
  ),
});

function PatientDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [patient, setPatient] = useState<{ patient_code: string; aadhaar_last4: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      supabase.from("patients").select("patient_code, aadhaar_last4").eq("id", user.id).maybeSingle(),
    ]).then(([p, pat]) => {
      setProfile(p.data);
      setPatient(pat.data);
      setLoading(false);
    });
  }, [user]);

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {loading ? (
          <Skeleton className="h-40" />
        ) : (
          <Card className="overflow-hidden p-0 shadow-elevated">
            <div className="flex flex-col gap-6 bg-gradient-hero p-6 text-primary-foreground sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm text-primary-foreground/80">{t("dashboard.welcome", { name: profile?.full_name || "Patient" })}</p>
                <h1 className="mt-1 text-2xl font-bold">{profile?.full_name}</h1>
                {patient?.patient_code && (
                  <div className="mt-4">
                    <PatientIdCard
                      patientCode={patient.patient_code}
                      fullName={profile?.full_name ?? ""}
                      aadhaarLast4={patient.aadhaar_last4}
                    />
                  </div>
                )}
              </div>
            </div>
          </Card>
        )}

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { icon: Calendar, label: t("dashboard.bookAppt") },
            { icon: FileText, label: t("dashboard.viewRecords") },
            { icon: CreditCard, label: t("dashboard.payBills") },
            { icon: Download, label: t("dashboard.download") },
          ].map((q) => (
            <Card key={q.label} className="p-5 shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground"><q.icon className="h-5 w-5" /></div>
              <div className="mt-3 font-medium">{q.label}</div>
              <Button variant="link" className="mt-1 h-auto p-0 text-primary">Open →</Button>
            </Card>
          ))}
        </div>

        <Card className="mt-6 p-6 shadow-card">
          <h2 className="font-semibold">{t("dashboard.upcoming")}</h2>
          <div className="mt-4 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
            {t("dashboard.none")}
          </div>
        </Card>
      </main>
    </div>
  );
}
