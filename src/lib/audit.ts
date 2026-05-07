import { supabase } from "@/integrations/supabase/client";

export type AuditAction =
  | "login.success"
  | "login.failed"
  | "logout"
  | "signup"
  | "role.denied"
  | "patient.id.viewed"
  | "patient.id.downloaded"
  | "prescription.created"
  | "appointment.created";

export async function audit(
  action: AuditAction,
  opts: { userId?: string | null; target?: string; metadata?: Record<string, unknown> } = {},
) {
  try {
    const ua = typeof navigator !== "undefined" ? navigator.userAgent : null;
    let userId = opts.userId ?? null;
    if (userId === undefined) {
      const { data } = await supabase.auth.getUser();
      userId = data.user?.id ?? null;
    }
    await supabase.from("audit_logs").insert({
      user_id: userId,
      action,
      target: opts.target ?? null,
      user_agent: ua,
      metadata: (opts.metadata ?? {}) as never,
    });
  } catch (e) {
    console.warn("[audit] failed", e);
  }
}
