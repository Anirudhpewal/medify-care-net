import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { ShieldCheck, Languages, Activity, BadgeCheck, Search, ArrowRight } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";

export const Route = createFileRoute("/")({ component: HomePage });

function Stat({ value, label, delay }: { value: string; label: string; delay: number }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <div className="text-3xl font-bold text-primary-foreground sm:text-4xl">{value}</div>
      <div className="mt-1 text-sm text-primary-foreground/80">{label}</div>
    </motion.div>
  );
}

function HomePage() {
  const { t } = useTranslation();
  const features = [
    { icon: BadgeCheck, k: "f1" },
    { icon: Languages, k: "f2" },
    { icon: ShieldCheck, k: "f3" },
    { icon: Activity, k: "f4" },
  ];
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden bg-gradient-hero">
          <div className="absolute inset-0 opacity-20" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, white 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
          <div className="relative mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24">
            <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
              <div>
                <motion.h1 initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-4xl font-bold tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl">
                  {t("hero.title")}
                </motion.h1>
                <motion.p initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="mt-5 max-w-xl text-lg text-primary-foreground/90">
                  {t("hero.subtitle")}
                </motion.p>

                <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="mt-8 flex flex-col gap-3 sm:flex-row">
                  <div className="flex flex-1 items-center gap-2 rounded-lg bg-card p-2 shadow-elevated">
                    <Search className="ml-2 h-5 w-5 text-muted-foreground" />
                    <Input placeholder={t("search.placeholder")} className="border-0 bg-transparent shadow-none focus-visible:ring-0" />
                    <Button asChild size="sm">
                      <Link to="/hospitals">{t("search.button")}</Link>
                    </Button>
                  </div>
                </motion.div>

                <div className="mt-8 flex flex-wrap gap-3">
                  <Button asChild size="lg" className="bg-card text-foreground hover:bg-card/90">
                    <Link to="/hospitals">{t("hero.ctaPrimary")}</Link>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-primary-foreground/40 bg-transparent text-primary-foreground hover:bg-primary-foreground/10">
                    <Link to="/doctors-search">{t("hero.ctaSecondary")}</Link>
                  </Button>
                </div>

                <div className="mt-12 grid grid-cols-3 gap-6">
                  <Stat value="500+" label={t("hero.statsHospitals")} delay={0.3} />
                  <Stat value="12k+" label={t("hero.statsDoctors")} delay={0.4} />
                  <Stat value="2M+" label={t("hero.statsPatients")} delay={0.5} />
                </div>
              </div>

              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 }} className="hidden lg:block">
                <div className="rounded-2xl bg-card/10 p-2 shadow-elevated backdrop-blur">
                  <div className="rounded-xl bg-card p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs font-medium text-muted-foreground">PATIENT ID</div>
                        <div className="mt-1 font-mono text-lg font-semibold">HF-DL-2026-483921</div>
                      </div>
                      <div className="rounded-lg bg-success/15 px-3 py-1 text-xs font-medium text-success">Verified</div>
                    </div>
                    <div className="mt-6 grid gap-3">
                      {["Cardiology consult — Tomorrow 10:30 AM","Lab report ready — CBC","Prescription refilled"].map((line, i) => (
                        <div key={i} className="flex items-center gap-3 rounded-lg border border-border p-3">
                          <div className="h-2 w-2 rounded-full bg-success" />
                          <span className="text-sm">{line}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
          <h2 className="text-center text-3xl font-bold tracking-tight sm:text-4xl">{t("features.title")}</h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div key={f.k} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.05 }}>
                <Card className="h-full p-6 shadow-card transition hover:shadow-elevated">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
                    <f.icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 font-semibold">{t(`features.${f.k}Title`)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{t(`features.${f.k}Desc`)}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Portals */}
        <section className="bg-muted/40">
          <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-20">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("portals.title")}</h2>
              <p className="mt-3 text-muted-foreground">{t("portals.subtitle")}</p>
            </div>
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {(["patient", "doctor", "admin"] as const).map((p) => (
                <Card key={p} className="group flex flex-col p-8 shadow-card transition hover:-translate-y-1 hover:shadow-elevated">
                  <h3 className="text-xl font-semibold">{t(`portals.${p}`)}</h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground">{t(`portals.${p}Desc`)}</p>
                  <Button asChild className="mt-6 w-full bg-gradient-primary text-primary-foreground hover:opacity-90">
                    <Link to="/auth/$portal" params={{ portal: p }}>
                      {t("portals.enter")} <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  );
}
