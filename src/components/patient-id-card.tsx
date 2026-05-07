import { useState } from "react";
import QRCode from "react-qr-code";
import { Copy, Download, QrCode, Check, IdCard } from "lucide-react";
import jsPDF from "jspdf";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { audit } from "@/lib/audit";

interface Props {
  patientCode: string;
  fullName: string;
  aadhaarLast4?: string | null;
  bloodGroup?: string | null;
}

export function PatientIdCard({ patientCode, fullName, aadhaarLast4, bloodGroup }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const profileUrl = typeof window !== "undefined" ? `${window.location.origin}/patient?id=${patientCode}` : patientCode;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(patientCode);
    setCopied(true);
    toast.success("Patient ID copied");
    setTimeout(() => setCopied(false), 1500);
  };

  const handleDownload = () => {
    const doc = new jsPDF({ unit: "mm", format: [90, 55] });
    doc.setFillColor(15, 76, 117);
    doc.rect(0, 0, 90, 14, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text("HealthFlow Patient ID", 4, 9);
    doc.setTextColor(20, 20, 20);
    doc.setFontSize(9);
    doc.text(`Name: ${fullName}`, 4, 22);
    doc.text(`ID: ${patientCode}`, 4, 28);
    if (bloodGroup) doc.text(`Blood: ${bloodGroup}`, 4, 34);
    if (aadhaarLast4) doc.text(`Aadhaar: XXXX-XXXX-${aadhaarLast4}`, 4, 40);
    doc.setFontSize(7);
    doc.setTextColor(100);
    doc.text("Scan QR for profile", 4, 50);
    doc.save(`HealthFlow-${patientCode}.pdf`);
    audit("patient.id.downloaded", { target: patientCode });
  };

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="inline-flex items-center gap-2 rounded-md bg-card/15 px-3 py-1.5 backdrop-blur">
          <IdCard className="h-4 w-4" />
          <span className="font-mono text-sm">{patientCode}</span>
        </div>
        <Button size="sm" variant="secondary" onClick={handleCopy}>
          {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        </Button>
        <Button size="sm" variant="secondary" onClick={() => { setOpen(true); audit("patient.id.viewed", { target: patientCode }); }}>
          <QrCode className="h-3.5 w-3.5" />
        </Button>
        <Button size="sm" variant="secondary" onClick={handleDownload}>
          <Download className="h-3.5 w-3.5" />
        </Button>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Patient ID</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-lg bg-white p-4">
              <QRCode value={profileUrl} size={200} />
            </div>
            <div className="text-center">
              <div className="font-semibold">{fullName}</div>
              <div className="font-mono text-sm text-muted-foreground">{patientCode}</div>
            </div>
            <Button onClick={handleDownload} className="w-full">
              <Download className="mr-2 h-4 w-4" /> Download Card (PDF)
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
