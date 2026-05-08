// HealthFlow demo seeder - creates 3 demo accounts and rich seed data
// Idempotent: safe to call multiple times.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const DEMOS = [
  { email: "anirudh@healthflow.demo", password: "Anirudh@123", full_name: "Anirudh Pewal", role: "patient" as const },
  { email: "palak.gupta@healthflow.demo", password: "Doctor@123", full_name: "Dr. Palak Gupta", role: "doctor" as const },
  { email: "satish.admin@healthflow.demo", password: "Admin@123", full_name: "Dr. Satish Kumar", role: "admin" as const },
];

async function ensureUser(email: string, password: string, full_name: string) {
  // Find existing
  const { data: list } = await admin.auth.admin.listUsers({ page: 1, perPage: 1000 });
  const existing = list?.users.find((u) => u.email === email);
  if (existing) {
    // Reset password to known value
    await admin.auth.admin.updateUserById(existing.id, { password, email_confirm: true, user_metadata: { full_name } });
    return existing.id;
  }
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name },
  });
  if (error) throw error;
  return data.user!.id;
}

async function upsertProfileAndRole(id: string, full_name: string, email: string, role: "patient" | "doctor" | "admin") {
  await admin.from("profiles").upsert({ id, full_name, email });
  // user_roles uses (user_id, role) unique. Insert if missing.
  const { data: existing } = await admin.from("user_roles").select("id").eq("user_id", id).maybeSingle();
  if (!existing) {
    await admin.from("user_roles").insert({ user_id: id, role });
  } else {
    await admin.from("user_roles").update({ role }).eq("user_id", id);
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  try {
    const ids: Record<string, string> = {};
    for (const d of DEMOS) {
      const id = await ensureUser(d.email, d.password, d.full_name);
      await upsertProfileAndRole(id, d.full_name, d.email, d.role);
      ids[d.role] = id;
    }

    // Find AIIMS Narnaul hospital id
    const { data: hosp } = await admin.from("hospitals").select("id").eq("name", "AIIMS Narnaul").maybeSingle();
    const hospitalId = hosp?.id ?? null;

    // Patient row for Anirudh
    await admin.from("patients").upsert({
      id: ids.patient,
      patient_code: "HF-HR-2026-483921",
      date_of_birth: "2003-01-15",
      gender: "Male",
      state: "Haryana",
      state_code: "HR",
      blood_group: "B+",
      aadhaar_full: null,
      aadhaar_last4: "3921",
      city: "Narnaul",
      district: "Narnaul",
    });

    // Doctor row for Dr. Palak Gupta
    await admin.from("doctors").upsert({
      id: ids.doctor,
      doctor_code: "DOC-PLK-2026",
      specialization: "Neurology",
      qualification: "MBBS MD DM Neurology",
      council_reg_number: "MCI-PLK-2026",
      experience_years: 12,
      consultation_fee: 700,
      languages: ["Hindi", "English"],
      opd_days: ["Mon", "Tue", "Thu"],
      opd_start_time: "09:00",
      opd_end_time: "13:00",
      rating: 4.8,
      hospital_id: hospitalId,
      bio: "Consultant Neurologist, AIIMS Narnaul",
    });

    // Hospital admin row for Dr. Satish Kumar
    if (hospitalId) {
      await admin.from("hospital_admins").upsert({
        id: ids.admin,
        hospital_id: hospitalId,
        designation: "Medical Superintendent",
      });
    }

    // Treatment for Anirudh under Dr. Palak
    const { data: existingTx } = await admin
      .from("treatments")
      .select("id")
      .eq("patient_id", ids.patient)
      .eq("doctor_id", ids.doctor)
      .maybeSingle();
    let treatmentId = existingTx?.id;
    if (!treatmentId) {
      const { data: tx } = await admin
        .from("treatments")
        .insert({
          patient_id: ids.patient,
          doctor_id: ids.doctor,
          hospital_id: hospitalId,
          diagnosis: "Chronic Migraine + Hypertension",
          status: "Under Treatment",
          progress: 65,
          last_visit: "2026-04-28",
          next_appointment: "2026-05-15",
          notes: "Responding well to amitriptyline. BP improving.",
        })
        .select("id")
        .single();
      treatmentId = tx!.id;
    }

    // Prescriptions
    await admin.from("prescriptions").delete().eq("patient_id", ids.patient);
    await admin.from("prescriptions").insert([
      { patient_id: ids.patient, doctor_id: ids.doctor, treatment_id: treatmentId, medicine_name: "Amitriptyline 10mg", dosage: "10mg", frequency: "Night", instructions: "Take with water before sleep" },
      { patient_id: ids.patient, doctor_id: ids.doctor, treatment_id: treatmentId, medicine_name: "Amlodipine 5mg", dosage: "5mg", frequency: "Morning", instructions: "After breakfast" },
    ]);

    // Lab reports
    await admin.from("lab_reports").delete().eq("patient_id", ids.patient);
    await admin.from("lab_reports").insert([
      { patient_id: ids.patient, name: "MRI Brain", result: "Normal", status: "ready", report_date: "2026-03-15" },
      { patient_id: ids.patient, name: "CBC", result: "Normal", status: "ready", report_date: "2026-04-28" },
      { patient_id: ids.patient, name: "Lipid Profile", result: "Borderline", status: "ready", report_date: "2026-04-28" },
    ]);

    // Payments
    await admin.from("payments").delete().eq("patient_id", ids.patient);
    await admin.from("payments").insert([
      { patient_id: ids.patient, amount: 700, method: "UPI", description: "Consultation - Dr. Palak Gupta", paid_at: "2026-04-28T10:30:00Z" },
      { patient_id: ids.patient, amount: 4500, method: "Card", description: "MRI Brain", paid_at: "2026-03-15T11:00:00Z" },
      { patient_id: ids.patient, amount: 700, method: "Cash", description: "Consultation - Dr. Palak Gupta", paid_at: "2026-02-02T09:30:00Z" },
    ]);

    // Appointments
    await admin.from("appointments").delete().eq("patient_id", ids.patient);
    await admin.from("appointments").insert([
      { patient_id: ids.patient, doctor_id: ids.doctor, hospital_id: hospitalId, scheduled_at: "2026-05-15T10:00:00Z", status: "scheduled", reason: "Follow-up consultation" },
    ]);

    // Notifications
    await admin.from("notifications").delete().eq("user_id", ids.patient);
    await admin.from("notifications").insert([
      { user_id: ids.patient, title: "Appointment reminder", body: "Follow-up with Dr. Palak Gupta on 15 May 2026, 10:00 AM" },
      { user_id: ids.patient, title: "Lab report ready", body: "Your CBC and Lipid Profile reports are available" },
      { user_id: ids.patient, title: "Prescription refilled", body: "Amitriptyline 10mg refilled by Dr. Palak Gupta" },
    ]);

    // Seed extra patients (24 more) as treatment records only (no auth users)
    // We seed them as treatments with synthetic patient_id UUIDs and rows in patients table.
    const others = [
      { code: "HF-DL-2026-291847", name: "Sunita Devi", dob: "1974-01-01", gender: "Female", state: "Delhi", sc: "DL", bg: "O+", dx: "Type 2 Diabetes + Hypertension", st: "Under Treatment", pr: 45, last: "2026-04-25", next: "2026-05-20" },
      { code: "HF-PB-2026-384756", name: "Harpreet Singh", dob: "1988-06-10", gender: "Male", state: "Punjab", sc: "PB", bg: "A+", dx: "Right Knee Osteoarthritis", st: "Under Treatment", pr: 80, last: "2026-04-30", next: "2026-05-10" },
      { code: "HF-RJ-2026-192847", name: "Meena Sharma", dob: "1981-03-12", gender: "Female", state: "Rajasthan", sc: "RJ", bg: "AB+", dx: "Coronary Artery Disease", st: "Under Treatment", pr: 55, last: "2026-04-27", next: "2026-05-12" },
      { code: "HF-KA-2026-485921", name: "Ravi Kumar", dob: "1997-08-21", gender: "Male", state: "Karnataka", sc: "KA", bg: "B-", dx: "Asthma Moderate Persistent", st: "Under Treatment", pr: 70, last: "2026-04-29", next: "2026-05-18" },
      { code: "HF-MH-2026-573829", name: "Fatima Begum", dob: "1966-04-04", gender: "Female", state: "Maharashtra", sc: "MH", bg: "O-", dx: "Breast Cancer Stage 2", st: "Chemotherapy Ongoing", pr: 40, last: "2026-05-01", next: "2026-05-14" },
      { code: "HF-PB-2026-629183", name: "Amarjeet Singh Bajwa", dob: "1971-09-09", gender: "Male", state: "Punjab", sc: "PB", bg: "A-", dx: "Hypertension + Diabetes Type 2", st: "Under Treatment", pr: 60, last: "2026-04-26", next: "2026-05-22" },
      { code: "HF-TN-2026-847362", name: "Priya Ramachandran", dob: "1994-11-11", gender: "Female", state: "Tamil Nadu", sc: "TN", bg: "B+", dx: "PCOD + Hypothyroidism", st: "Under Treatment", pr: 75, last: "2026-04-28", next: "2026-05-16" },
      { code: "HF-DL-2026-391827", name: "Mohammed Rafiq", dob: "1978-02-02", gender: "Male", state: "Delhi", sc: "DL", bg: "AB-", dx: "Heart Failure with Atrial Fibrillation", st: "Under Treatment", pr: 35, last: "2026-05-02", next: "2026-05-11" },
      { code: "HF-MH-2026-284736", name: "Anita Desai", dob: "1985-07-07", gender: "Female", state: "Maharashtra", sc: "MH", bg: "O+", dx: "Rheumatoid Arthritis", st: "Under Treatment", pr: 50, last: "2026-04-24", next: "2026-05-19" },
      { code: "HF-PB-2026-748291", name: "Gursharan Singh Dhaliwal", dob: "1959-05-05", gender: "Male", state: "Punjab", sc: "PB", bg: "B+", dx: "Lung Cancer Stage 3", st: "Radiation Therapy Ongoing", pr: 25, last: "2026-05-03", next: "2026-05-13" },
      { code: "HF-TN-2026-562839", name: "Lakshmi Venkataraman", dob: "1968-12-12", gender: "Female", state: "Tamil Nadu", sc: "TN", bg: "A+", dx: "Parkinson Disease", st: "Under Treatment", pr: 30, last: "2026-04-27", next: "2026-05-21" },
      { code: "HF-UP-2026-193746", name: "Rohit Agarwal", dob: "1991-03-03", gender: "Male", state: "Uttar Pradesh", sc: "UP", bg: "O+", dx: "Crohns Disease", st: "Under Treatment", pr: 55, last: "2026-04-29", next: "2026-05-17" },
      { code: "HF-DL-2026-485736", name: "Shabnam Parveen", dob: "1998-08-08", gender: "Female", state: "Delhi", sc: "DL", bg: "B-", dx: "High Risk Pregnancy", st: "Regular Monitoring", pr: 65, last: "2026-05-01", next: "2026-05-09" },
      { code: "HF-UP-2026-837264", name: "Balram Tiwari", dob: "1954-01-30", gender: "Male", state: "Uttar Pradesh", sc: "UP", bg: "AB+", dx: "Chronic Kidney Disease Stage 4", st: "Pre-Dialysis Management", pr: 20, last: "2026-04-25", next: "2026-05-23" },
      { code: "HF-KL-2026-294837", name: "Deepika Nair", dob: "1992-02-14", gender: "Female", state: "Kerala", sc: "KL", bg: "O-", dx: "End Stage Liver Disease", st: "Awaiting Transplant", pr: 30, last: "2026-05-02", next: "2026-05-10" },
      { code: "HF-PB-2026-374829", name: "Sukhwinder Singh", dob: "1976-06-06", gender: "Male", state: "Punjab", sc: "PB", bg: "A+", dx: "Myocardial Infarction Post Stenting", st: "Recovery Phase", pr: 75, last: "2026-04-20", next: "2026-05-25" },
      { code: "HF-RJ-2026-473829", name: "Reena Joshi", dob: "1983-09-09", gender: "Female", state: "Rajasthan", sc: "RJ", bg: "B+", dx: "Epilepsy Partial Complex", st: "Controlled on Medication", pr: 85, last: "2026-04-18", next: "2026-05-28" },
      { code: "HF-KL-2026-584729", name: "Thomas Mathew", dob: "1964-04-04", gender: "Male", state: "Kerala", sc: "KL", bg: "O+", dx: "Atrial Fibrillation + Heart Failure", st: "Under Treatment", pr: 50, last: "2026-04-22", next: "2026-05-24" },
      { code: "HF-TN-2026-293847", name: "Kavya Reddy", dob: "2007-10-10", gender: "Female", state: "Tamil Nadu", sc: "TN", bg: "A-", dx: "Hodgkins Lymphoma Stage 2", st: "Chemotherapy Cycle 3 of 6", pr: 45, last: "2026-05-01", next: "2026-05-12" },
      { code: "HF-HR-2026-583921", name: "Naresh Gupta", dob: "1970-11-11", gender: "Male", state: "Haryana", sc: "HR", bg: "B+", dx: "Triple Vessel Coronary Artery Disease", st: "Post CABG Recovery", pr: 40, last: "2026-04-28", next: "2026-05-14" },
      { code: "HF-MH-2026-394827", name: "Rukhsana Shaikh", dob: "1989-05-05", gender: "Female", state: "Maharashtra", sc: "MH", bg: "AB+", dx: "Systemic Lupus Erythematosus", st: "Under Treatment", pr: 60, last: "2026-04-26", next: "2026-05-20" },
      { code: "HF-PB-2026-182736", name: "Jagmohan Singh Sandhu", dob: "1956-07-07", gender: "Male", state: "Punjab", sc: "PB", bg: "O+", dx: "Hip Fracture Post Surgery", st: "Physiotherapy Phase", pr: 90, last: "2026-04-15", next: "2026-06-05" },
      { code: "HF-WB-2026-473829", name: "Ananya Das", dob: "2000-12-01", gender: "Female", state: "West Bengal", sc: "WB", bg: "B+", dx: "PCOS + Insulin Resistance", st: "Under Treatment", pr: 70, last: "2026-04-30", next: "2026-05-18" },
      { code: "HF-KL-2026-839274", name: "Christy Abraham", dob: "1982-03-03", gender: "Male", state: "Kerala", sc: "KL", bg: "A+", dx: "Multiple Sclerosis Relapsing Remitting", st: "Disease Modifying Therapy", pr: 55, last: "2026-04-23", next: "2026-05-22" },
    ];

    for (const o of others) {
      // Check if patient already seeded
      const { data: ex } = await admin.from("patients").select("id").eq("patient_code", o.code).maybeSingle();
      let pid = ex?.id;
      if (!pid) {
        pid = crypto.randomUUID();
        await admin.from("patients").insert({
          id: pid, patient_code: o.code, date_of_birth: o.dob, gender: o.gender,
          state: o.state, state_code: o.sc, blood_group: o.bg, aadhaar_last4: o.code.slice(-4),
        });
        await admin.from("profiles").upsert({ id: pid, full_name: o.name, email: `${o.code.toLowerCase()}@healthflow.demo` });
      }
      const { data: extx } = await admin.from("treatments").select("id").eq("patient_id", pid).maybeSingle();
      if (!extx) {
        await admin.from("treatments").insert({
          patient_id: pid, hospital_id: hospitalId, diagnosis: o.dx,
          status: o.st, progress: o.pr, last_visit: o.last, next_appointment: o.next,
        });
      }
    }

    return new Response(JSON.stringify({ ok: true, ids, seededPatients: others.length + 1 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("seed-demo error", err);
    return new Response(JSON.stringify({ ok: false, error: String(err instanceof Error ? err.message : err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
