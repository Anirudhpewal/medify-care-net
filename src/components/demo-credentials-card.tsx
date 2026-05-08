import { useState } from "react";
import { Copy, LogIn, Check } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { DEMO_CREDENTIALS } from "@/lib/demo-credentials";

export function DemoCredentialsCard({ compact = false }: { compact?: boolean }) {
  const [copied, setCopied] = useState<string | null>(null);

  const onCopy = (role: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(role);
    toast.success("Credentials copied");
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <Card className={compact ? "p-4 shadow-card" : "p-6 shadow-elevated"}>
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Demo credentials</h3>
        <span className="rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">Live</span>
      </div>
      <div className={compact ? "grid gap-3" : "grid gap-3 sm:grid-cols-3"}>
        {DEMO_CREDENTIALS.map((c) => {
          const text = `Name: ${c.name}\nID: ${c.id}\nEmail: ${c.email}\nPassword: ${c.password}`;
          return (
            <div key={c.role} className="rounded-lg border border-border bg-card/50 p-3">
              <div className="text-xs font-semibold uppercase text-primary">{c.label}</div>
              <div className="mt-1 text-sm font-medium">{c.name}</div>
              <div className="mt-1 font-mono text-[11px] text-muted-foreground">{c.id}</div>
              <div className="mt-1 truncate text-xs text-muted-foreground" title={c.email}>{c.email}</div>
              <div className="font-mono text-xs">{c.password}</div>
              <div className="mt-2 flex gap-2">
                <Button size="sm" variant="outline" className="h-7 px-2" onClick={() => onCopy(c.role, text)}>
                  {copied === c.role ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                  <span className="ml-1 text-xs">Copy</span>
                </Button>
                <Button asChild size="sm" className="h-7 bg-gradient-primary px-2 text-primary-foreground hover:opacity-90">
                  <Link to="/auth/$portal" params={{ portal: c.role }} search={{ demo: "1" }}>
                    <LogIn className="h-3 w-3" />
                    <span className="ml-1 text-xs">Quick Login</span>
                  </Link>
                </Button>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
