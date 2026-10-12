import { useState, type RefObject } from "react";
import { Download, Loader2, Mail, Printer } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { downloadPdf, printElement, sendByEmail } from "@/lib/pdf";

export function PdfActions({
  targetRef,
  filename,
  email,
  subject,
  body,
}: {
  targetRef: RefObject<HTMLDivElement | null>;
  filename: string;
  email?: string;
  subject: string;
  body: string;
}) {
  const [busy, setBusy] = useState<string | null>(null);

  const run = async (key: string, fn: (el: HTMLDivElement) => Promise<void>) => {
    if (!targetRef.current) return;
    setBusy(key);
    try {
      await fn(targetRef.current);
    } catch (error) {
      console.error(error);
      toast.error("Operazione non riuscita, riprova.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        variant="secondary"
        onClick={() => run("pdf", (el) => downloadPdf(el, filename))}
        disabled={busy !== null}
      >
        {busy === "pdf" ? (
          <Loader2 className="mr-2 size-4 animate-spin" />
        ) : (
          <Download className="mr-2 size-4" />
        )}
        PDF
      </Button>
      <Button
        variant="secondary"
        onClick={() => run("print", (el) => printElement(el))}
        disabled={busy !== null}
      >
        <Printer className="mr-2 size-4" /> Stampa
      </Button>
      <Button variant="outline" onClick={() => sendByEmail(email ?? "", subject, body)}>
        <Mail className="mr-2 size-4" /> Invia
      </Button>
    </div>
  );
}
