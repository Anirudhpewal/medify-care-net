import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { Stethoscope } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/doctors-search")({ component: DoctorsSearchPage });

interface Doctor { id: string; doctor_code: string; specialization: string; qualification: string; experience_years: number; consultation_fee: number; languages: string[]; }

function DoctorsSearchPage() {
  const { t } = useTranslation();
  const [docs, setDocs] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  useEffect(() => {
    supabase.from("doctors").select("*").limit(50).then(({ data }) => {
      setDocs((data ?? []) as Doctor[]);
      setLoading(false);
    });
  }, []);

  const filtered = docs.filter(d => !q || d.specialization.toLowerCase().includes(q.toLowerCase()));

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("doctors.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("doctors.subtitle")}</p>
          <Input placeholder={t("search.placeholder")} value={q} onChange={(e) => setQ(e.target.value)} className="mt-6 max-w-md bg-card" />
          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {loading
              ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48" />)
              : filtered.length === 0
                ? <div className="col-span-full rounded-lg border border-dashed border-border bg-card p-10 text-center text-sm text-muted-foreground">No doctors registered yet. Sign up via the doctor portal to be listed.</div>
                : filtered.map(d => (
                    <Card key={d.id} className="p-6 shadow-card">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-primary text-primary-foreground">
                          <Stethoscope className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="font-semibold">Dr. {d.doctor_code}</div>
                          <div className="text-xs text-muted-foreground">{d.specialization}</div>
                        </div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                        <div><div className="text-xs text-muted-foreground">{t("doctors.yearsExp")}</div><div className="font-medium">{d.experience_years}</div></div>
                        <div><div className="text-xs text-muted-foreground">Fee</div><div className="font-medium">₹{d.consultation_fee}</div></div>
                      </div>
                      <Button asChild className="mt-5 w-full bg-gradient-primary text-primary-foreground hover:opacity-90">
                        <Link to="/portals">{t("doctors.bookAppt")}</Link>
                      </Button>
                    </Card>
                  ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
