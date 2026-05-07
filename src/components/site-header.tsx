import { Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { Heart, Menu, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { LanguageSwitcher } from "./language-switcher";
import { useAuth } from "@/context/auth-context";

export function SiteHeader() {
  const { t } = useTranslation();
  const { user, role, signOut } = useAuth();
  const [open, setOpen] = useState(false);

  const dashboardPath = role ? `/${role}` : "/";

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground shadow-elevated">
            <Heart className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight">{t("brand.name")}</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground" }}>
            {t("nav.home")}
          </Link>
          <Link to="/hospitals" className="text-sm font-medium text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground" }}>
            {t("nav.hospitals")}
          </Link>
          <Link to="/doctors-search" className="text-sm font-medium text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground" }}>
            {t("nav.doctors")}
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to={dashboardPath}>{t("nav.dashboard")}</Link>
              </Button>
              <Button size="sm" variant="outline" onClick={() => signOut()}>
                {t("nav.logout")}
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden md:inline-flex">
                <Link to="/portals">{t("nav.login")}</Link>
              </Button>
              <Button asChild size="sm" className="bg-gradient-primary text-primary-foreground hover:opacity-90">
                <Link to="/portals">{t("nav.register")}</Link>
              </Button>
            </>
          )}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)}>
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {open && (
        <div className="border-t border-border bg-background md:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-1 px-4 py-3 sm:px-6">
            <Link to="/" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">{t("nav.home")}</Link>
            <Link to="/hospitals" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">{t("nav.hospitals")}</Link>
            <Link to="/doctors-search" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">{t("nav.doctors")}</Link>
            {!user && (
              <Link to="/portals" onClick={() => setOpen(false)} className="rounded-md px-3 py-2 text-sm font-medium hover:bg-accent">{t("nav.login")}</Link>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
