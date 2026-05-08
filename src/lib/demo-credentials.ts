export const DEMO_CREDENTIALS = [
  {
    role: "patient" as const,
    label: "Patient",
    name: "Anirudh Pewal",
    id: "HF-HR-2026-483921",
    email: "anirudh@healthflow.demo",
    password: "Anirudh@123",
  },
  {
    role: "doctor" as const,
    label: "Doctor",
    name: "Dr. Palak Gupta",
    id: "DOC-PLK-2026",
    email: "palak.gupta@healthflow.demo",
    password: "Doctor@123",
  },
  {
    role: "admin" as const,
    label: "Hospital Admin",
    name: "Dr. Satish Kumar",
    id: "ADM-SK-2026",
    email: "satish.admin@healthflow.demo",
    password: "Admin@123",
  },
];

export function isDemoEmail(email: string) {
  return email.toLowerCase().endsWith("@healthflow.demo");
}
