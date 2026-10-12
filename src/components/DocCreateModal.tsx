import { useState, useEffect } from "react";
import {
  Building2,
  Calendar,
  Check,
  ChevronDown,
  CreditCard,
  FileText,
  MapPin,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { ClientOption } from "@/components/DocumentEditor";
import type { CompanyInfo, DocTemplate } from "@/lib/doc";
import { TEMPLATES } from "@/lib/doc";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { cn } from "@/lib/utils";

export type DocCreateInitialData = {
  client_id: string;
  cantiere?: string;
  title: string;
  date: string;
  secondary_date: string | null;
  payment_method_id?: string;
  payment_method?: string;
  payment_iban?: string;
  template: DocTemplate;
  vat_rate: number;
  notes: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docType: "preventivo" | "fattura" | "intervento";
  docLabel: string; // "Preventivo" | "Fattura" | "Intervento"
  clients: ClientOption[];
  company: CompanyInfo & {
    quote_validity_days?: number;
    invoice_due_days?: number;
    default_vat_rate?: number;
    default_template?: DocTemplate;
    default_notes?: string;
  };
  onConfirm: (data: DocCreateInitialData) => void;
};

export function DocCreateModal({
  open,
  onOpenChange,
  docType,
  docLabel,
  clients,
  company,
  onConfirm,
}: Props) {
  const { methods, defaultMethod } = usePaymentMethods();

  const todayStr = new Date().toISOString().slice(0, 10);
  const defaultValidityDays =
    docType === "preventivo"
      ? Number(company.quote_validity_days || 30)
      : docType === "fattura"
        ? Number(company.invoice_due_days || 30)
        : 0;

  const defaultSecDate = () => {
    if (defaultValidityDays <= 0) return null;
    const d = new Date();
    d.setDate(d.getDate() + defaultValidityDays);
    return d.toISOString().slice(0, 10);
  };

  const [clientId, setClientId] = useState<string>("");
  const [cantiere, setCantiere] = useState<string>("");
  const [oggetto, setOggetto] = useState<string>("");
  const [date, setDate] = useState<string>(todayStr);
  const [secondaryDate, setSecondaryDate] = useState<string | null>(defaultSecDate());
  const [paymentMethodId, setPaymentMethodId] = useState<string>("");
  const [template, setTemplate] = useState<DocTemplate>(company.default_template ?? "classico");
  const [vatRate, setVatRate] = useState<number>(Number(company.default_vat_rate ?? 22));
  const [notes, setNotes] = useState<string>(company.default_notes ?? "");
  const [showAdvanced, setShowAdvanced] = useState<boolean>(false);

  // Reimposta stati ogni volta che la modale viene aperta
  useEffect(() => {
    if (open) {
      setClientId(clients[0]?.id ?? "");
      setCantiere("");
      setOggetto("");
      setDate(new Date().toISOString().slice(0, 10));
      setSecondaryDate(defaultSecDate());
      setPaymentMethodId(defaultMethod?.id ?? "");
      setTemplate(company.default_template ?? "classico");
      setVatRate(Number(company.default_vat_rate ?? 22));
      setNotes(company.default_notes ?? "");
      setShowAdvanced(false);
    }
  }, [open, defaultMethod?.id, company]);

  const selectedClient = clients.find((c) => c.id === clientId);

  const handleApplyDays = (days: number) => {
    const base = date ? new Date(date) : new Date();
    base.setDate(base.getDate() + days);
    setSecondaryDate(base.toISOString().slice(0, 10));
  };

  const handleUseClientAddress = () => {
    if (!selectedClient) return;
    const addr = [selectedClient.address, selectedClient.city].filter(Boolean).join(", ");
    if (addr) {
      setCantiere(addr);
      toast.info("Indirizzo del cliente impostato come cantiere");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast.error("Seleziona un cliente per creare il documento");
      return;
    }

    const chosenPayment = methods.find((m) => m.id === paymentMethodId) || defaultMethod;

    onConfirm({
      client_id: clientId,
      cantiere: cantiere.trim() || undefined,
      title: oggetto.trim(),
      date,
      secondary_date: secondaryDate,
      payment_method_id: chosenPayment?.id,
      payment_method: chosenPayment?.typeLabel,
      payment_iban: chosenPayment?.iban || "",
      template,
      vat_rate: vatRate,
      notes,
    });

    onOpenChange(false);
  };

  const defaultPlaceholderOggetto =
    docType === "preventivo"
      ? "Es. Rifacimento impianto bagno"
      : docType === "fattura"
        ? "Es. Saldo lavori cantiere via Roma"
        : "Es. Manutenzione caldaia e riparazione perdita";

  const secondaryDateLabel =
    docType === "preventivo"
      ? "Valido fino al"
      : docType === "fattura"
        ? "Scadenza pagamento"
        : "Data fine lavori (opzionale)";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[calc(100dvh-3rem)] sm:max-h-[calc(100dvh-4rem)] overflow-hidden p-0 rounded-2xl border border-border shadow-2xl bg-card flex flex-col">
        {/* Header modale */}
        <DialogHeader className="px-5 sm:px-6 pt-5 pb-4 border-b border-border/80 flex flex-row items-center justify-between pr-12 shrink-0">
          <DialogTitle className="text-lg font-bold text-foreground">
            Nuovo {docLabel.toLowerCase()}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit}
          className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1 min-h-0"
        >
          {/* CLIENTE * */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-foreground flex items-center justify-between">
              <span>
                Cliente <span className="text-destructive">*</span>
              </span>
              {selectedClient?.email ? (
                <span className="text-xs text-muted-foreground font-normal">
                  {selectedClient.email}
                </span>
              ) : null}
            </Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="h-10.5 rounded-lg bg-background border-border text-sm shadow-xs">
                <SelectValue placeholder="Seleziona cliente" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    <div className="flex items-center gap-2">
                      <User className="size-3.5 text-muted-foreground" />
                      <span className="font-medium">{c.name}</span>
                      {c.city ? (
                        <span className="text-xs text-muted-foreground">({c.city})</span>
                      ) : null}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedClient && (
              <div className="text-xs text-muted-foreground bg-muted/40 p-2.5 rounded-lg border border-border/60 flex items-center justify-between">
                <div className="truncate">
                  <span>
                    {[selectedClient.address, selectedClient.city].filter(Boolean).join(", ") ||
                      "Nessun indirizzo salvato"}
                  </span>
                  {selectedClient.vat_number ? (
                    <span className="ml-2 font-mono">P.IVA {selectedClient.vat_number}</span>
                  ) : null}
                </div>
                {selectedClient.address && !cantiere ? (
                  <button
                    type="button"
                    onClick={handleUseClientAddress}
                    className="text-[11px] text-primary hover:underline font-medium shrink-0 ml-2 cursor-pointer"
                  >
                    Usa come cantiere
                  </button>
                ) : null}
              </div>
            )}
          </div>

          {/* CANTIERE / INDIRIZZO LAVORO */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-semibold text-foreground">
                Cantiere / indirizzo lavoro
              </Label>
              {selectedClient?.address && !cantiere ? (
                <button
                  type="button"
                  onClick={handleUseClientAddress}
                  className="text-xs text-primary hover:underline cursor-pointer"
                >
                  Indirizzo cliente
                </button>
              ) : null}
            </div>
            <div className="relative">
              <Input
                value={cantiere}
                onChange={(e) => setCantiere(e.target.value)}
                placeholder="Opzionale"
                className="h-10.5 rounded-lg bg-background border-border text-sm pl-9 shadow-xs"
              />
              <MapPin className="size-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* OGGETTO */}
          <div className="space-y-1.5">
            <Label className="text-sm font-semibold text-foreground">Oggetto</Label>
            <Input
              value={oggetto}
              onChange={(e) => setOggetto(e.target.value)}
              placeholder={defaultPlaceholderOggetto}
              className="h-10.5 rounded-lg bg-background border-border text-sm shadow-xs"
            />
          </div>

          {/* DATE & SCADENZA RAPIDA */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-muted-foreground">Data documento</Label>
              <div className="relative">
                <Input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-9.5 text-xs bg-background shadow-xs rounded-lg"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-muted-foreground">
                  {secondaryDateLabel}
                </Label>
                {docType !== "intervento" && (
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => handleApplyDays(15)}
                      className="px-1.5 py-0.5 rounded bg-muted hover:bg-muted-foreground/20 text-muted-foreground transition-colors cursor-pointer"
                    >
                      +15g
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyDays(30)}
                      className="px-1.5 py-0.5 rounded bg-muted hover:bg-muted-foreground/20 text-muted-foreground transition-colors cursor-pointer"
                    >
                      +30g
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyDays(60)}
                      className="px-1.5 py-0.5 rounded bg-muted hover:bg-muted-foreground/20 text-muted-foreground transition-colors cursor-pointer"
                    >
                      +60g
                    </button>
                  </div>
                )}
              </div>
              <Input
                type="date"
                value={secondaryDate ?? ""}
                onChange={(e) => setSecondaryDate(e.target.value || null)}
                className="h-9.5 text-xs bg-background shadow-xs rounded-lg"
              />
            </div>
          </div>

          {/* MODALITÀ DI PAGAMENTO PREDEFINITA */}
          <div className="space-y-1.5 pt-1">
            <Label className="text-xs font-semibold text-muted-foreground flex items-center justify-between">
              <span>Modalità di pagamento</span>
              {methods.find((m) => m.id === paymentMethodId)?.iban ? (
                <span className="text-[11px] font-mono text-muted-foreground truncate max-w-[200px]">
                  IBAN configurato
                </span>
              ) : null}
            </Label>
            <Select value={paymentMethodId} onValueChange={setPaymentMethodId}>
              <SelectTrigger className="h-9.5 rounded-lg bg-background border-border text-xs shadow-xs">
                <SelectValue placeholder="Seleziona modalità di pagamento" />
              </SelectTrigger>
              <SelectContent>
                {methods.map((pm) => (
                  <SelectItem key={pm.id} value={pm.id} className="text-xs">
                    <div className="flex items-center justify-between gap-3 w-full">
                      <span>{pm.typeLabel}</span>
                      {pm.is_default ? (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          (Predefinita)
                        </span>
                      ) : null}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* OPZIONI AVANZATE TOGGLE */}
          <div className="pt-1">
            <button
              type="button"
              onClick={() => setShowAdvanced((v) => !v)}
              className="text-xs font-medium text-primary hover:underline flex items-center gap-1 cursor-pointer"
            >
              <Sparkles className="size-3.5" />
              {showAdvanced
                ? "Nascondi opzioni aggiuntive"
                : "Altre opzioni di creazione (IVA, Modello, Note)"}
            </button>

            {showAdvanced && (
              <div className="mt-3 p-3.5 rounded-xl border border-border/80 bg-muted/20 space-y-3.5 animate-in fade-in-50 duration-200">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Modello grafico PDF</Label>
                    <Select value={template} onValueChange={(t) => setTemplate(t as DocTemplate)}>
                      <SelectTrigger className="h-9 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TEMPLATES.map((t) => (
                          <SelectItem key={t.value} value={t.value} className="text-xs">
                            {t.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs text-muted-foreground">Aliquota IVA (%)</Label>
                    <Select value={String(vatRate)} onValueChange={(v) => setVatRate(Number(v))}>
                      <SelectTrigger className="h-9 text-xs bg-background">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="22" className="text-xs">
                          22% (Ordinaria)
                        </SelectItem>
                        <SelectItem value="10" className="text-xs">
                          10% (Edilizia / Ristrutturazione)
                        </SelectItem>
                        <SelectItem value="4" className="text-xs">
                          4% (Prima casa / Agevolata)
                        </SelectItem>
                        <SelectItem value="0" className="text-xs">
                          0% (Esente / Forfettario)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">
                    Note / Condizioni iniziali
                  </Label>
                  <Textarea
                    rows={2}
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Es. Tempi di consegna 10 giorni lavorativi..."
                    className="text-xs bg-background"
                  />
                </div>
              </div>
            )}
          </div>

          {/* FOOTER PULSANTI: ANNULLA e CREA E APRI (Stile Screenshot) */}
          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-border/80">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium border-border hover:bg-muted cursor-pointer"
            >
              Annulla
            </Button>

            <Button
              type="submit"
              className="bg-[#1d4ed8] hover:bg-[#1e40af] text-white font-semibold text-sm px-5 py-2 rounded-lg shadow-sm cursor-pointer tracking-wide"
            >
              Crea e apri
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
