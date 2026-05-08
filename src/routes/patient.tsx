import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Calendar, FileText, CreditCard, Pill, Bell, Activity } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
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

interface Treatment { id: string; diagnosis: string; status: string; progress: number; last_visit: string | null; next_appointment: string | null; }
interface Prescription { id: string; medicine_name: string; dosage: string | null; frequency: string | null; instructions: string | null; }
interface LabReport { id: string; name: string; result: string | null; status: string | null; report_date: string | null; }
interface Payment { id: string; amount: number; method: string | null; description: string | null; paid_at: string; }
interface Notification { id: string; title: string; body: string | null; read: boolean; created_at: string; }

function PatientDashboard() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [profile, setProfile] = useState<{ full_name: string } | null>(null);
  const [patient, setPatient] = useState<{ patient_code: string; aadhaar_last4: string | null; blood_group: string | null } | null>(null);
  const [treatments, setTreatments] = useState<Treatment[]>([]);
  const [rx, setRx] = useState<Prescription[]>([]);
  const [labs, setLabs] = useState<LabReport[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [notifs, setNotifs] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
      supabase.from("patients").select("patient_code, aadhaar_last4, blood_group").eq("id", user.id).maybeSingle(),
      supabase.from("treatments").select("*").eq("patient_id", user.id).order("created_at", { ascending: false }),
      supabase.from("prescriptions").select("*").eq("patient_id", user.id),
      supabase.from("lab_reports").select("*").eq("patient_id", user.id).order("report_date", { ascending: false }),
      supabase.from("payments").select("*").eq("patient_id", user.id).order("paid_at", { ascending: false }),
      supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    ]).then(([p, pat, tx, rxd, lab, pay, nf]) => {
      setProfile(p.data);
      setPatient(pat.data);
      setTreatments((tx.data ?? []) as Treatment[]);
      setRx((rxd.data ?? []) as Prescription[]);
      setLabs((lab.data ?? []) as LabReport[]);
      setPayments((pay.data ?? []) as Payment[]);
      setNotifs((nf.data ?? []) as Notification[]);
      setLoading(false);
    });
  }, [user]);

  const unread = notifs.filter((n) => !n.read).length;

  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <SiteHeader />
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-8 sm:px-6">
        {loading ? (
          <Skeleton className="h-40" />
        ) : (
          <Card className="overflow-hidden p-0 shadow-elevated">
            <div className="flex flex-col gap-6 bg-gradient-hero p-6 text-primary-foreground sm:flex-row sm:items-start sm:justify-between">
              <div className="flex-1">
                <p className="text-sm text-primary-foreground/80">{t("dashboard.welcome", { name: profile?.full_name || "Patient" })}</p>
                <h1 className="mt-1 text-2xl font-bold">{profile?.full_name}</h1>
                <div className="mt-1 text-sm text-primary-foreground/90">
                  Blood group: {patient?.blood_group ?? "—"}
                </div>
                {patient?.patient_code && (
                  <div className="mt-4">
                    <PatientIdCard patientCode={patient.patient_code} fullName={profile?.full_name ?? ""} aadhaarLast4={patient.aadhaar_last4} />
                  </div>
                )}
              </div>
              {unread > 0 && (
                <div className="rounded-lg bg-card/15 px-4 py-3 text-sm">
                  <Bell className="mb-1 h-4 w-4" />
                  <div className="font-medium">{unread} new notifications</div>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Treatments */}
        <Card className="mt-6 p-6 shadow-card">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary" />
            <h2 className="font-semibold">Active treatment</h2>
          </div>
          <div className="mt-4 space-y-4">
            {treatments.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border p-6 text-center text-sm text-muted-foreground">No active treatment</div>
            ) : treatments.map((tx) => (
              <div key={tx.id} className="rounded-lg border border-border p-4">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="font-semibold">{tx.diagnosis}</div>
                    <div className="text-xs text-muted-foreground">Status: {tx.status}</div>
                  </div>
                  <div className="text-sm font-semibold text-primary">{tx.progress}%</div>
                </div>
                <Progress value={tx.progress} className="mt-3" />
                <div className="mt-3 grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                  <div>Last visit: <span className="text-foreground">{tx.last_visit ?? "—"}</span></div>
                  <div>Next appt: <span className="text-foreground">{tx.next_appointment ?? "—"}</span></div>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          {/* Prescriptions */}
          <Card className="p-6 shadow-card">
            <div className="flex items-center gap-2"><Pill className="h-4 w-4 text-primary" /><h2 className="font-semibold">Current medicines</h2></div>
            <div className="mt-4 space-y-2">
              {rx.length === 0 ? <div className="text-sm text-muted-foreground">No prescriptions</div> : rx.map((m) => (
                <div key={m.id} className="rounded-md border border-border p-3 text-sm">
                  <div className="font-medium">{m.medicine_name}</div>
                  <div className="text-xs text-muted-foreground">{m.frequency} {m.instructions ? `· ${m.instructions}` : ""}</div>
                </div>
              ))}
            </div>
          </Card>

          {/* Lab reports */}
          <Card className="p-6 shadow-card">
            <div className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /><h2 className="font-semibold">Lab reports</h2></div>
            <div className="mt-4 space-y-2">
              {labs.length === 0 ? <div className="text-sm text-muted-foreground">No reports</div> : labs.map((l) => (
                <div key={l.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                  <div>
                    <div className="font-medium">{l.name}</div>
                    <div className="text-xs text-muted-foreground">{l.report_date}</div>
                  </div>
                  <div className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">{l.result}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Payments + Notifications */}
        <div className="mt-6 grid gap-6 lg:grid-cols-2">
          <Card className="p-6 shadow-card">
            <div className="flex items-center gap-2"><CreditCard className="h-4 w-4 text-primary" /><h2 className="font-semibold">Payment history</h2></div>
            <div className="mt-4 space-y-2">
              {payments.length === 0 ? <div className="text-sm text-muted-foreground">No payments</div> : payments.map((p) => (
                <div key={p.id} className="flex items-center justify-between rounded-md border border-border p-3 text-sm">
                  <div>
                    <div className="font-medium">{p.description}</div>
                    <div className="text-xs text-muted-foreground">{new Date(p.paid_at).toLocaleDateString()} · {p.method}</div>
                  </div>
                  <div className="font-semibold">₹{Number(p.amount).toLocaleString("en-IN")}</div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 shadow-card">
            <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-primary" /><h2 className="font-semibold">Notifications</h2></div>
            <div className="mt-4 space-y-2">
              {notifs.length === 0 ? <div className="text-sm text-muted-foreground">Nothing new</div> : notifs.map((n) => (
                <div key={n.id} className={`rounded-md border p-3 text-sm ${n.read ? "border-border" : "border-primary/30 bg-primary/5"}`}>
                  <div className="font-medium">{n.title}</div>
                  <div className="text-xs text-muted-foreground">{n.body}</div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </main>
    </div>
  );
}
