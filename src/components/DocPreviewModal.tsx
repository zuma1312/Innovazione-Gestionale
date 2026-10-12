import { useRef, useState } from "react";
import { Download, Loader2, Printer, X, ZoomIn, ZoomOut } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DocPreview } from "@/components/DocPreview";
import type { CompanyInfo, DocItem, DocTemplate } from "@/lib/doc";
import { downloadPdf, printElement } from "@/lib/pdf";

export type DocPreviewData = {
  docLabel: string;
  number: string;
  date: string;
  secondaryDateLabel?: string;
  secondaryDate?: string | null;
  template: DocTemplate;
  clientName: string;
  clientLines: string[];
  items: DocItem[];
  vatRate: number;
  notes?: string;
  bodyText?: string;
  title?: string;
  cantiere?: string;
  paymentMethod?: string;
  paymentIban?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: DocPreviewData | null;
  company: CompanyInfo;
};

export function DocPreviewModal({ open, onOpenChange, data, company }: Props) {
  const previewRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [scale, setScale] = useState<number>(() => {
    if (typeof window !== "undefined" && window.innerWidth < 640) {
      return 0.45;
    }
    return 0.85;
  });

  if (!data) return null;

  const filename = `${data.docLabel.replace(/\s+/g, "-").toLowerCase()}-${data.number || "documento"}`;

  const handleDownload = async () => {
    if (!previewRef.current) return;
    setBusy("pdf");
    try {
      await downloadPdf(previewRef.current, filename);
      toast.success("PDF scaricato con successo");
    } catch (err) {
      console.error(err);
      toast.error("Errore durante la generazione del PDF");
    } finally {
      setBusy(null);
    }
  };

  const handlePrint = async () => {
    if (!previewRef.current) return;
    setBusy("print");
    try {
      await printElement(previewRef.current);
    } catch (err) {
      console.error(err);
      toast.error("Errore durante l'apertura di stampa");
    } finally {
      setBusy(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:w-[calc(100vw-4rem)] max-w-5xl max-h-[calc(100dvh-3rem)] sm:max-h-[calc(100dvh-4rem)] overflow-hidden p-0 flex flex-col bg-slate-900/95 text-slate-100 border-slate-800">
        <DialogHeader className="border-b border-slate-800 px-5 py-3.5 flex flex-row items-center justify-between shrink-0 bg-slate-950">
          <div className="flex items-center gap-2">
            <DialogTitle className="text-sm sm:text-base font-semibold text-white">
              Anteprima PDF — {data.docLabel} {data.number}
            </DialogTitle>
          </div>

          <div className="flex items-center gap-2 pr-6">
            {/* Zoom controls */}
            <div className="hidden sm:flex items-center bg-slate-800/80 rounded-md border border-slate-700 p-0.5 mr-2 text-xs">
              <button
                type="button"
                onClick={() => setScale((s) => Math.max(0.45, s - 0.1))}
                className="p-1 hover:text-white text-slate-400 cursor-pointer"
                title="Riduci zoom"
              >
                <ZoomOut className="size-3.5" />
              </button>
              <span className="px-1.5 text-[11px] font-mono text-slate-300">
                {Math.round(scale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setScale((s) => Math.min(1.2, s + 0.1))}
                className="p-1 hover:text-white text-slate-400 cursor-pointer"
                title="Aumenta zoom"
              >
                <ZoomIn className="size-3.5" />
              </button>
            </div>

            <Button
              size="sm"
              onClick={handleDownload}
              disabled={busy !== null}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs h-8 px-3 gap-1.5"
            >
              {busy === "pdf" ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Download className="size-3.5" />
              )}
              Scarica PDF
            </Button>

            <Button
              size="sm"
              variant="outline"
              onClick={handlePrint}
              disabled={busy !== null}
              className="bg-slate-800 hover:bg-slate-700 text-white border-slate-700 text-xs h-8 px-3 gap-1.5"
            >
              <Printer className="size-3.5" /> Stampa
            </Button>
          </div>
        </DialogHeader>

        {/* Foglio A4 Preview */}
        <div className="flex-1 overflow-auto p-4 sm:p-8 flex justify-center items-start bg-slate-900/60">
          <div
            className="bg-white rounded-lg shadow-2xl transition-transform origin-top"
            style={{
              width: 794,
              minHeight: 1123,
              transform: `scale(${scale})`,
              marginBottom: `${Math.max(0, 1123 * (scale - 1))}px`,
            }}
          >
            <DocPreview
              ref={previewRef}
              template={data.template}
              docLabel={data.docLabel}
              number={data.number}
              date={data.date}
              secondaryDateLabel={data.secondaryDateLabel}
              secondaryDate={data.secondaryDate}
              company={company}
              clientName={data.clientName}
              clientLines={data.clientLines}
              items={data.items}
              vatRate={data.vatRate}
              notes={data.notes}
              bodyText={data.bodyText}
              title={data.title}
              cantiere={data.cantiere}
              paymentMethod={data.paymentMethod}
              paymentIban={data.paymentIban}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
