import { type ReactNode, useEffect } from "react";
import { useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth, type AppRole } from "@/context/auth-context";
import { audit } from "@/lib/audit";

interface Props {
  allow: AppRole[];
  children: ReactNode;
}

export function ProtectedRoute({ allow, children }: Props) {
  const { user, role, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      navigate({ to: "/portals" });
      return;
    }
    if (!role || !allow.includes(role)) {
      audit("role.denied", { userId: user.id, target: window.location.pathname, metadata: { required: allow, actual: role } });
      navigate({ to: "/portals" });
    }
  }, [loading, user, role, allow, navigate]);

  if (loading || !user || !role || !allow.includes(role)) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }
  return <>{children}</>;
}

export function RoleGuard({ allow, children, fallback = null }: { allow: AppRole[]; children: ReactNode; fallback?: ReactNode }) {
  const { role } = useAuth();
  if (!role || !allow.includes(role)) return <>{fallback}</>;
  return <>{children}</>;
}
