import { createFileRoute } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { MapPin, Star, Bed, ShieldCheck } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/hospitals")({ component: HospitalsPage });

interface Hospital {
  id: string; name: string; hospital_type: string; state: string; city: string | null;
  specialities: string[]; facilities: string[]; insurance_panels: string[];
  beds_general: number; beds_icu: number; beds_nicu: number; rating: number; review_count: number;
}

function HospitalsPage() {
  const { t } = useTranslation();
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [type, setType] = useState<string>("All");

  useEffect(() => {
    supabase.from("hospitals").select("*").then(({ data }) => {
      setHospitals((data ?? []) as Hospital[]);
      setLoading(false);
    });
  }, []);

  const filtered = hospitals.filter((h) => {
    const matchQ = !q || h.name.toLowerCase().includes(q.toLowerCase()) || h.city?.toLowerCase().includes(q.toLowerCase()) || h.specialities.some(s => s.toLowerCase().includes(q.toLowerCase()));
    const matchType = type === "All" || h.hospital_type === type;
    return matchQ && matchType;
  });

  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("hospitals.title")}</h1>
          <p className="mt-2 text-muted-foreground">{t("hospitals.subtitle")}</p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Input placeholder={t("search.placeholder")} value={q} onChange={(e) => setQ(e.target.value)} className="bg-card" />
            <select value={type} onChange={(e) => setType(e.target.value)} className="h-10 rounded-md border border-input bg-card px-3 text-sm">
              <option>All</option><option>Government</option><option>Private</option><option>Trust</option>
            </select>
          </div>

          <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {loading
              ? Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-64" />)
              : filtered.map((h, i) => (
                  <motion.div key={h.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                    <Card className="flex h-full flex-col p-6 shadow-card transition hover:-translate-y-0.5 hover:shadow-elevated">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold leading-tight">{h.name}</h3>
                        <Badge variant="outline" className="shrink-0">{h.hospital_type}</Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />{h.city}, {h.state}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-1">
                        {h.specialities.slice(0, 3).map(s => <Badge key={s} variant="secondary" className="text-xs">{s}</Badge>)}
                      </div>
                      <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                        <div className="rounded-md bg-muted p-2 text-center"><div className="font-semibold">{h.beds_general}</div><div className="text-muted-foreground">{t("hospitals.beds")}</div></div>
                        <div className="rounded-md bg-muted p-2 text-center"><div className="font-semibold">{h.beds_icu}</div><div className="text-muted-foreground">ICU</div></div>
                        <div className="rounded-md bg-muted p-2 text-center"><div className="font-semibold">{h.beds_nicu}</div><div className="text-muted-foreground">NICU</div></div>
                      </div>
                      {h.insurance_panels.length > 0 && (
                        <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                          <ShieldCheck className="h-3 w-3 text-success" />
                          {h.insurance_panels.slice(0, 2).join(" · ")}
                        </div>
                      )}
                      <div className="mt-4 flex items-center justify-between border-t border-border pt-4">
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="h-4 w-4 fill-warning text-warning" />
                          <span className="font-medium">{h.rating}</span>
                          <span className="text-xs text-muted-foreground">({h.review_count})</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs text-success">
                          <Bed className="h-3 w-3" /> Available
                        </div>
                      </div>
                    </Card>
                  </motion.div>
                ))}
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
