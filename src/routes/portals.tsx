import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ArrowRight, Stethoscope, UserRound, Building2 } from "lucide-react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/portals")({ component: PortalsPage });

const PORTALS = [
  { code: "patient" as const, Icon: UserRound },
  { code: "doctor" as const, Icon: Stethoscope },
  { code: "admin" as const, Icon: Building2 },
];

function PortalsPage() {
  const { t } = useTranslation();
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1 bg-muted/30">
        <div className="mx-auto max-w-5xl px-4 py-16 sm:px-6">
          <div className="text-center">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">{t("portals.title")}</h1>
            <p className="mt-2 text-muted-foreground">{t("portals.subtitle")}</p>
          </div>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {PORTALS.map(({ code, Icon }) => (
              <Card key={code} className="flex flex-col p-8 shadow-card transition hover:-translate-y-1 hover:shadow-elevated">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground">
                  <Icon className="h-6 w-6" />
                </div>
                <h2 className="mt-4 text-xl font-semibold">{t(`portals.${code}`)}</h2>
                <p className="mt-2 flex-1 text-sm text-muted-foreground">{t(`portals.${code}Desc`)}</p>
                <Button asChild className="mt-6 bg-gradient-primary text-primary-foreground hover:opacity-90">
                  <Link to="/auth/$portal" params={{ portal: code }}>
                    {t("portals.enter")} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
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
