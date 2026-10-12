import { useRef, useState, useEffect, useCallback } from "react";
import { Download, Eye, FileText, Loader2, Mail, Plus, Printer, Trash2, X } from "lucide-react";
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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DocPreview } from "@/components/DocPreview";
import { DocPreviewModal } from "@/components/DocPreviewModal";
import { TEMPLATES, docTotals, emptyItem, formatCurrency } from "@/lib/doc";
import type { CompanyInfo, DocItem, DocTemplate } from "@/lib/doc";
import { downloadPdf, printElement, sendByEmail } from "@/lib/pdf";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { cn } from "@/lib/utils";

export type ClientOption = {
  id: string;
  name: string;
  email?: string;
  address?: string;
  city?: string;
  zip?: string;
  vat_number?: string;
};

export type DocFormValue = {
  id?: string;
  client_id: string | null;
  number: string;
  date: string;
  secondary_date: string | null;
  items: DocItem[];
  vat_rate: number;
  notes: string;
  status: string;
  template: DocTemplate;
  body?: string;
  title?: string;
  cantiere?: string;
  payment_method_id?: string;
  payment_method?: string;
  payment_iban?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  docLabel: string;
  secondaryDateLabel: string;
  statuses: string[];
  withBody?: boolean;
  company: CompanyInfo;
  clients: ClientOption[];
  value: DocFormValue;
  onChange: (value: DocFormValue) => void;
  onSave: () => void;
  saving?: boolean;
};

export function DocumentEditor(props: Props) {
  const {
    open,
    onOpenChange,
    docLabel,
    secondaryDateLabel,
    statuses,
    withBody,
    company,
    clients,
    value,
    onChange,
    onSave,
    saving,
  } = props;
  const previewRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const client = clients.find((c) => c.id === value.client_id);
  const totals = docTotals(value.items, value.vat_rate);
  const { methods, defaultMethod } = usePaymentMethods();
  const set = useCallback(
    (patch: Partial<DocFormValue>) => onChange({ ...value, ...patch }),
    [value, onChange],
  );

  // Auto-select default payment method on new documents
  useEffect(() => {
    if (!value.payment_method && !value.payment_method_id && defaultMethod) {
      onChange({
        ...value,
        payment_method_id: defaultMethod.id,
        payment_method: defaultMethod.typeLabel,
        payment_iban: defaultMethod.iban || "",
      });
    }
  }, [defaultMethod, value, onChange]);

  const updateItem = (index: number, patch: Partial<DocItem>) => {
    const items = value.items.map((item, i) => (i === index ? { ...item, ...patch } : item));
    set({ items });
  };

  const run = async (key: string, fn: () => Promise<void> | void) => {
    if (!previewRef.current) return;
    setBusy(key);
    try {
      await fn();
    } catch (error) {
      console.error(error);
      toast.error("Operazione non riuscita, riprova.");
    } finally {
      setBusy(null);
    }
  };

  const filename = `${docLabel.replace(/\s+/g, "-").toLowerCase()}-${value.number || "bozza"}`;
  const [previewModalOpen, setPreviewModalOpen] = useState(false);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:w-[calc(100vw-4rem)] max-w-5xl max-h-[calc(100dvh-3rem)] sm:max-h-[calc(100dvh-4rem)] overflow-hidden p-0 rounded-2xl border border-border shadow-2xl bg-card flex flex-col">
          {/* HEADER CLASSICO PULITO */}
          <div className="flex items-center justify-between border-b border-border bg-card px-5 py-3.5 pr-12 shrink-0">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <FileText className="size-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <span>
                    {value.id ? "Modifica" : "Nuovo"} {docLabel}
                  </span>
                  {value.number ? (
                    <span className="font-mono text-primary font-semibold">N. {value.number}</span>
                  ) : null}
                </h3>
                <p className="text-xs text-muted-foreground">
                  Compila i dati del documento. L'anteprima PDF e la stampa sono disponibili dai
                  pulsanti dedicati.
                </p>
              </div>
            </div>
          </div>

          {/* ACTION BAR (Pulsanti stile Screenshot: verde SALVA, blu ANTEPRIMA PDF, e altri) */}
          <div className="flex flex-wrap items-center justify-between gap-2.5 border-b border-border bg-card px-4 py-2.5 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              {/* Tasto SALVA */}
              <Button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-xs px-4 py-2 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
                Salva
              </Button>

              {/* Tasto ANTEPRIMA PDF */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setPreviewModalOpen(true)}
                className="font-medium text-xs px-3.5 py-2 rounded-lg shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <Eye className="size-3.5" />
                Anteprima PDF
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => run("pdf", () => downloadPdf(previewRef.current!, filename))}
                disabled={busy !== null}
                className="text-xs font-medium h-8.5 gap-1.5 cursor-pointer rounded-lg"
              >
                {busy === "pdf" ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Download className="size-3.5" />
                )}
                Scarica PDF
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => run("print", () => printElement(previewRef.current!))}
                disabled={busy !== null}
                className="text-xs font-medium h-8.5 gap-1.5 cursor-pointer rounded-lg"
              >
                <Printer className="size-3.5" /> Stampa
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  sendByEmail(
                    client?.email ?? "",
                    `${docLabel} ${value.number} - ${company.company_name}`,
                    `Gentile ${client?.name ?? "cliente"},\n\nin allegato ${docLabel.toLowerCase()} n. ${value.number} per un totale di ${formatCurrency(totals.total)}.\n\nCordiali saluti,\n${company.company_name}`,
                  )
                }
                className="text-xs font-medium h-8.5 gap-1.5 cursor-pointer rounded-lg"
              >
                <Mail className="size-3.5" /> Invia email
              </Button>
            </div>

            <div className="text-right flex items-center gap-2">
              <span className="text-xs text-muted-foreground">Totale:</span>
              <span className="text-base sm:text-lg font-bold text-primary">
                {formatCurrency(totals.total)}
              </span>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 space-y-5 pb-8">
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="Cliente">
                  <Select
                    value={value.client_id ?? ""}
                    onValueChange={(v) => set({ client_id: v })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {clients.map((c) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Oggetto">
                  <Input
                    value={value.title ?? ""}
                    onChange={(e) => set({ title: e.target.value })}
                    placeholder="Es. Rifacimento impianto bagno"
                  />
                </Field>
                <Field label="Cantiere / indirizzo lavoro">
                  <Input
                    value={value.cantiere ?? ""}
                    onChange={(e) => set({ cantiere: e.target.value })}
                    placeholder="Opzionale (es. Via Roma 12, Milano)"
                  />
                </Field>
                <Field label="Numero">
                  <Input value={value.number} onChange={(e) => set({ number: e.target.value })} />
                </Field>
                <Field label="Data">
                  <Input
                    type="date"
                    value={value.date}
                    onChange={(e) => set({ date: e.target.value })}
                  />
                </Field>
                <Field label={secondaryDateLabel}>
                  <Input
                    type="date"
                    value={value.secondary_date ?? ""}
                    onChange={(e) => set({ secondary_date: e.target.value || null })}
                  />
                </Field>
                <Field label="Stato">
                  <Select value={value.status} onValueChange={(v) => set({ status: v })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((s) => (
                        <SelectItem key={s} value={s}>
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Template PDF">
                  <Select
                    value={value.template}
                    onValueChange={(v) => set({ template: v as DocTemplate })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATES.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>

                <Field label="Modalità di pagamento">
                  <Select
                    value={
                      value.payment_method_id ||
                      methods.find(
                        (m) =>
                          m.typeLabel === value.payment_method ||
                          m.name === value.payment_method ||
                          m.code === value.payment_method,
                      )?.id ||
                      defaultMethod?.id ||
                      ""
                    }
                    onValueChange={(id) => {
                      const chosen = methods.find((m) => m.id === id);
                      if (chosen) {
                        set({
                          payment_method_id: chosen.id,
                          payment_method: chosen.typeLabel,
                          payment_iban: chosen.iban ?? "",
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Seleziona modalità di pagamento" />
                    </SelectTrigger>
                    <SelectContent>
                      {methods.map((pm) => (
                        <SelectItem key={pm.id} value={pm.id}>
                          <div className="flex items-center justify-between gap-2">
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
                </Field>

                {value.payment_iban ? (
                  <Field label="IBAN accredito">
                    <Input
                      value={value.payment_iban}
                      onChange={(e) => set({ payment_iban: e.target.value })}
                      placeholder="IT00X000..."
                      className="font-mono text-xs"
                    />
                  </Field>
                ) : null}
              </div>

              {withBody ? (
                <Field label="Descrizione lavoro">
                  <Textarea
                    rows={3}
                    value={value.body ?? ""}
                    onChange={(e) => set({ body: e.target.value })}
                    placeholder="Es. Sostituzione valvola e ripristino impianto..."
                  />
                </Field>
              ) : null}

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-semibold">Voci</Label>
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    onClick={() => set({ items: [...value.items, emptyItem()] })}
                  >
                    <Plus className="mr-1 size-4" /> Voce
                  </Button>
                </div>
                {value.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex flex-col sm:grid sm:grid-cols-[minmax(0,1fr)_80px_100px_auto] items-stretch sm:items-center gap-2 p-2.5 sm:p-0 rounded-lg bg-muted/30 sm:bg-transparent border sm:border-0 border-border"
                  >
                    <Input
                      placeholder="Descrizione voce o materiale"
                      value={item.description}
                      onChange={(e) => updateItem(index, { description: e.target.value })}
                      className="bg-background flex-1"
                    />
                    <div className="flex items-center gap-2 sm:contents">
                      <div className="flex items-center gap-1 flex-1 sm:flex-none">
                        <span className="sm:hidden text-xs text-muted-foreground shrink-0">
                          Qtà:
                        </span>
                        <Input
                          type="number"
                          step="0.5"
                          value={item.qty}
                          onChange={(e) => updateItem(index, { qty: Number(e.target.value) })}
                          className="bg-background w-full sm:w-20"
                        />
                      </div>
                      <div className="flex items-center gap-1 flex-1 sm:flex-none">
                        <span className="sm:hidden text-xs text-muted-foreground shrink-0">€:</span>
                        <Input
                          type="number"
                          step="0.01"
                          value={item.unit_price}
                          onChange={(e) =>
                            updateItem(index, { unit_price: Number(e.target.value) })
                          }
                          className="bg-background w-full sm:w-24 font-mono"
                        />
                      </div>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        onClick={() => set({ items: value.items.filter((_, i) => i !== index) })}
                        className="size-8 sm:size-9 text-destructive hover:bg-destructive/10 shrink-0 cursor-pointer"
                        title="Elimina voce"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <Field label="IVA %">
                  <Input
                    type="number"
                    value={value.vat_rate}
                    onChange={(e) => set({ vat_rate: Number(e.target.value) })}
                  />
                </Field>
                <div className="flex items-end justify-end">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Totale documento</p>
                    <p className="text-2xl font-bold text-primary">
                      {formatCurrency(totals.total)}
                    </p>
                  </div>
                </div>
              </div>

              <Field label="Note">
                <Textarea
                  rows={2}
                  value={value.notes}
                  onChange={(e) => set({ notes: e.target.value })}
                />
              </Field>

              {/* Riepilogo finale e pulsanti veloci */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border">
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    onClick={onSave}
                    disabled={saving}
                    className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-bold text-xs uppercase px-4 py-2 rounded-md shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    {saving ? <Loader2 className="size-3.5 animate-spin" /> : null}
                    SALVA DOCUMENTO
                  </Button>

                  <Button
                    type="button"
                    onClick={() => setPreviewModalOpen(true)}
                    className="bg-[#3b82f6] hover:bg-[#2563eb] text-white font-bold text-xs uppercase px-3.5 py-2 rounded-md shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="size-3.5" />
                    ANTEPRIMA PDF
                  </Button>
                </div>

                <p className="text-xs text-muted-foreground">
                  Documento configurato con {value.items.length}{" "}
                  {value.items.length === 1 ? "voce" : "voci"} · IVA {value.vat_rate}%
                </p>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Elemento offscreen per download ed esportazione immediata PDF */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          left: -9999,
          top: -9999,
          width: 794,
          opacity: 0,
          pointerEvents: "none",
        }}
      >
        <DocPreview
          ref={previewRef}
          template={value.template}
          docLabel={docLabel}
          number={value.number}
          date={value.date}
          secondaryDateLabel={secondaryDateLabel}
          secondaryDate={value.secondary_date}
          company={company}
          clientName={client?.name ?? ""}
          clientLines={[
            client?.address ?? "",
            [client?.zip, client?.city].filter(Boolean).join(" "),
            client?.vat_number ? `P.IVA ${client.vat_number}` : "",
            client?.email ?? "",
          ]}
          items={value.items}
          vatRate={value.vat_rate}
          notes={value.notes}
          bodyText={withBody ? value.body : undefined}
          title={value.title}
          cantiere={value.cantiere}
          paymentMethod={value.payment_method || defaultMethod?.typeLabel}
          paymentIban={value.payment_iban !== undefined ? value.payment_iban : defaultMethod?.iban}
        />
      </div>

      {/* Modal Anteprima PDF sotto il bottone dedicato */}
      <DocPreviewModal
        open={previewModalOpen}
        onOpenChange={setPreviewModalOpen}
        company={company}
        data={{
          docLabel,
          number: value.number,
          date: value.date,
          secondaryDateLabel,
          secondaryDate: value.secondary_date,
          template: value.template,
          clientName: client?.name ?? "",
          clientLines: [
            client?.address ?? "",
            [client?.zip, client?.city].filter(Boolean).join(" "),
            client?.vat_number ? `P.IVA ${client.vat_number}` : "",
            client?.email ?? "",
          ],
          items: value.items,
          vatRate: value.vat_rate,
          notes: value.notes,
          bodyText: withBody ? value.body : undefined,
          title: value.title,
          cantiere: value.cantiere,
          paymentMethod: value.payment_method || defaultMethod?.typeLabel,
          paymentIban: value.payment_iban !== undefined ? value.payment_iban : defaultMethod?.iban,
        }}
      />
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium text-muted-foreground">{label}</Label>
      {children}
    </div>
  );
}
