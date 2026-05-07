import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, ShieldCheck, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/auth-context";
import { audit } from "@/lib/audit";

const PORTAL_VALUES = ["patient", "doctor", "admin"] as const;
type Portal = (typeof PORTAL_VALUES)[number];

export const Route = createFileRoute("/auth/$portal")({
  parseParams: (params) => {
    const p = params.portal as Portal;
    if (!PORTAL_VALUES.includes(p)) throw new Error("Invalid portal");
    return { portal: p };
  },
  component: AuthPage,
});

type Mode = "signin" | "signup";
type Step = "credentials" | "otp" | "details";

function AuthPage() {
  const { portal } = Route.useParams();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, role, refreshRole } = useAuth();

  const [mode, setMode] = useState<Mode>("signin");
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);

  // patient details
  const [dob, setDob] = useState("");
  const [gender, setGender] = useState("Male");
  const [stateName, setStateName] = useState("");
  const [stateCode, setStateCode] = useState("");
  const [aadhaar, setAadhaar] = useState("");

  // doctor details
  const [specialization, setSpecialization] = useState("");
  const [qualification, setQualification] = useState("");
  const [council, setCouncil] = useState("");

  useEffect(() => {
    if (user && role) {
      navigate({ to: `/${role}` as "/patient" | "/doctor" | "/admin" });
    }
  }, [user, role, navigate]);

  const portalLabel = t(`portals.${portal}`);

  async function handleCredentials(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/${portal}`,
            data: { full_name: fullName },
          },
        });
        if (error) throw error;
        // Send OTP
        const { error: otpErr } = await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
        if (otpErr && !otpErr.message.toLowerCase().includes("already")) {
          // ignore - account may need email confirm
        }
        toast.success(t("auth.otpSentTo", { email }));
        setStep("otp");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          await audit("login.failed", { userId: null, target: email, metadata: { portal, reason: error.message } });
          throw error;
        }
        // Send OTP for 2FA layer
        await supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: false } }).catch(() => {});
        toast.success(t("auth.otpSentTo", { email }));
        setStep("otp");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : t("common.error");
      toast.error(msg);
    } finally {
      setBusy(false);
    }
  }

  async function handleVerifyOtp() {
    if (otp.length !== 6) return toast.error(t("common.invalidOtp"));
    setBusy(true);
    try {
      const { error } = await supabase.auth.verifyOtp({ email, token: otp, type: "email" });
      if (error) throw error;
      const { data: sessData } = await supabase.auth.getSession();
      const userId = sessData.session?.user.id;
      if (!userId) throw new Error("No session");

      // Check if role exists
      const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();

      if (mode === "signup" || !roleRow) {
        // Need details for new accounts
        setStep("details");
      } else {
        if (roleRow.role !== portal) {
          toast.error(`This account is registered as ${roleRow.role}. Use the ${roleRow.role} portal.`);
          await supabase.auth.signOut();
        } else {
          await refreshRole();
          await audit("login.success", { userId, metadata: { portal } });
          toast.success(t("common.success"));
          navigate({ to: `/${portal}` as "/patient" | "/doctor" | "/admin" });
        }
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  async function handleSubmitDetails() {
    setBusy(true);
    try {
      const { data: sessData } = await supabase.auth.getSession();
      const userId = sessData.session?.user.id;
      if (!userId) throw new Error("No session");

      // Insert role
      await supabase.from("user_roles").insert({ user_id: userId, role: portal });

      // Update profile
      await supabase.from("profiles").upsert({ id: userId, full_name: fullName, email });

      if (portal === "patient") {
        const { data: codeData } = await supabase.rpc("generate_patient_code", { _state_code: stateCode || "IN" });
        await supabase.from("patients").insert({
          id: userId,
          patient_code: codeData as string,
          date_of_birth: dob,
          gender,
          state: stateName || "Unknown",
          state_code: stateCode || "IN",
          aadhaar_full: aadhaar || null,
          aadhaar_last4: aadhaar ? aadhaar.slice(-4) : null,
        });
      } else if (portal === "doctor") {
        const { data: codeData } = await supabase.rpc("generate_doctor_code");
        await supabase.from("doctors").insert({
          id: userId,
          doctor_code: codeData as string,
          specialization,
          qualification,
          council_reg_number: council,
        });
      }

      await refreshRole();
      toast.success(t("common.success"));
      navigate({ to: `/${portal}` as "/patient" | "/doctor" | "/admin" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gradient-hero">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-12 sm:px-6">
        <Link to="/portals" className="mb-6 inline-flex items-center gap-2 text-sm text-primary-foreground/90 hover:text-primary-foreground">
          <ArrowLeft className="h-4 w-4" /> {t("auth.backToCredentials")}
        </Link>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
          <Card className="overflow-hidden p-8 shadow-elevated">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary text-primary-foreground">
                <Heart className="h-5 w-5" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">{mode === "signin" ? t("auth.loginTitle", { portal: portalLabel }) : t("auth.registerTitle", { portal: portalLabel })}</h1>
                <p className="flex items-center gap-1 text-xs text-muted-foreground">
                  <ShieldCheck className="h-3 w-3" /> {t("auth.secureNotice")}
                </p>
              </div>
            </div>

            {step === "credentials" && (
              <form onSubmit={handleCredentials} className="mt-6 space-y-4">
                {mode === "signup" && (
                  <div>
                    <Label>{t("auth.fullName")}</Label>
                    <Input required value={fullName} onChange={(e) => setFullName(e.target.value)} className="mt-1" />
                  </div>
                )}
                <div>
                  <Label>{t("auth.email")}</Label>
                  <Input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="mt-1" />
                </div>
                <div>
                  <Label>{t("auth.password")}</Label>
                  <Input required type="password" minLength={8} value={password} onChange={(e) => setPassword(e.target.value)} className="mt-1" />
                </div>
                <Button type="submit" disabled={busy} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">
                  {busy ? t("common.loading") : t("auth.sendOtp")}
                </Button>
                <p className="text-center text-sm text-muted-foreground">
                  {mode === "signin" ? t("auth.noAccount") : t("auth.haveAccount")}{" "}
                  <button type="button" className="font-medium text-primary hover:underline" onClick={() => setMode(mode === "signin" ? "signup" : "signin")}>
                    {mode === "signin" ? t("auth.signUp") : t("auth.signIn")}
                  </button>
                </p>
              </form>
            )}

            {step === "otp" && (
              <div className="mt-6 space-y-5">
                <div className="text-center text-sm text-muted-foreground">{t("auth.otpSentTo", { email })}</div>
                <div className="flex justify-center">
                  <InputOTP maxLength={6} value={otp} onChange={setOtp}>
                    <InputOTPGroup>
                      {[0, 1, 2, 3, 4, 5].map((i) => <InputOTPSlot key={i} index={i} />)}
                    </InputOTPGroup>
                  </InputOTP>
                </div>
                <Button onClick={handleVerifyOtp} disabled={busy || otp.length !== 6} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">
                  {busy ? t("common.loading") : t("auth.verifyOtp")}
                </Button>
                <button onClick={() => setStep("credentials")} className="block w-full text-center text-sm text-muted-foreground hover:text-foreground">
                  {t("auth.backToCredentials")}
                </button>
              </div>
            )}

            {step === "details" && (
              <div className="mt-6 space-y-4">
                {portal === "patient" && (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>{t("patientReg.dob")}</Label>
                        <Input required type="date" value={dob} onChange={(e) => setDob(e.target.value)} className="mt-1" />
                      </div>
                      <div>
                        <Label>{t("patientReg.gender")}</Label>
                        <select value={gender} onChange={(e) => setGender(e.target.value)} className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                          <option>Male</option><option>Female</option><option>Other</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>{t("patientReg.state")}</Label>
                        <Input required value={stateName} onChange={(e) => setStateName(e.target.value)} className="mt-1" placeholder="Delhi" />
                      </div>
                      <div>
                        <Label>State code</Label>
                        <Input required maxLength={2} value={stateCode} onChange={(e) => setStateCode(e.target.value.toUpperCase())} className="mt-1" placeholder="DL" />
                      </div>
                    </div>
                    <div>
                      <Label>{t("patientReg.aadhaar")}</Label>
                      <Input maxLength={12} value={aadhaar} onChange={(e) => setAadhaar(e.target.value.replace(/\D/g, ""))} className="mt-1" />
                      <p className="mt-1 text-xs text-muted-foreground">{t("patientReg.aadhaarNote")}</p>
                    </div>
                  </>
                )}
                {portal === "doctor" && (
                  <>
                    <div>
                      <Label>{t("doctorReg.specialization")}</Label>
                      <Input required value={specialization} onChange={(e) => setSpecialization(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label>{t("doctorReg.qualification")}</Label>
                      <Input required value={qualification} onChange={(e) => setQualification(e.target.value)} className="mt-1" />
                    </div>
                    <div>
                      <Label>{t("doctorReg.council")}</Label>
                      <Input required value={council} onChange={(e) => setCouncil(e.target.value)} className="mt-1" />
                    </div>
                  </>
                )}
                {portal === "admin" && (
                  <p className="text-sm text-muted-foreground">Hospital admin accounts require manual onboarding. Continuing will create a placeholder admin account.</p>
                )}
                <Button onClick={handleSubmitDetails} disabled={busy} className="w-full bg-gradient-primary text-primary-foreground hover:opacity-90">
                  {busy ? t("common.loading") : t("common.next")}
                </Button>
              </div>
            )}
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
