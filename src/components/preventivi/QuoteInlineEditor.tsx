import { useState, useRef } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  CreditCard,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Printer,
  Trash2,
  User,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
import type { ClientOption, DocFormValue } from "@/components/DocumentEditor";
import type { CompanyInfo, DocItem, DocTemplate } from "@/lib/doc";
import { TEMPLATES, docTotals, emptyItem, formatCurrency, lineTotal } from "@/lib/doc";
import { DocPreview } from "@/components/DocPreview";
import { downloadPdf, printElement } from "@/lib/pdf";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";

type Props = {
  value: DocFormValue;
  onChange: (value: DocFormValue) => void;
  onSave: () => Promise<void> | void;
  onBack: () => void;
  company: CompanyInfo;
  clients: ClientOption[];
  saving?: boolean;
  onDuplicate?: () => void;
  onDelete?: () => void;
  onOpenPreviewModal: (val: DocFormValue) => void;
};

export function QuoteInlineEditor({
  value,
  onChange,
  onSave,
  onBack,
  company,
  clients,
  saving,
  onDuplicate,
  onDelete,
  onOpenPreviewModal,
}: Props) {
  const hiddenPreviewRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);
  const [printing, setPrinting] = useState(false);
  const { methods, defaultMethod } = usePaymentMethods();

  const selectedClient = clients.find((c) => c.id === value.client_id);
  const totals = docTotals(value.items, value.vat_rate);

  // Helper set field
  const updateField = (patch: Partial<DocFormValue>) => {
    onChange({ ...value, ...patch });
  };

  const updateItem = (index: number, patch: Partial<DocItem>) => {
    const items = value.items.map((it, i) => (i === index ? { ...it, ...patch } : it));
    updateField({ items });
  };

  const addItem = () => {
    updateField({ items: [...value.items, emptyItem()] });
  };

  const removeItem = (index: number) => {
    if (value.items.length <= 1) {
      updateField({ items: [emptyItem()] });
      return;
    }
    const items = value.items.filter((_, i) => i !== index);
    updateField({ items });
  };

  const handleApplyDays = (days: number) => {
    const base = value.date ? new Date(value.date) : new Date();
    base.setDate(base.getDate() + days);
    updateField({ secondary_date: base.toISOString().slice(0, 10) });
  };

  const handleUseClientAddress = () => {
    if (!selectedClient) return;
    const addr = [selectedClient.address, selectedClient.city].filter(Boolean).join(", ");
    if (addr) {
      updateField({ cantiere: addr });
      toast.info("Indirizzo del cliente impostato come cantiere");
    }
  };

  const handleDirectDownload = async () => {
    if (!hiddenPreviewRef.current) return;
    setDownloading(true);
    try {
      const filename = `preventivo-${value.number || "bozza"}`;
      await downloadPdf(hiddenPreviewRef.current, filename);
      toast.success("PDF del preventivo scaricato con successo");
    } catch (err) {
      console.error(err);
      toast.error("Errore durante la generazione del PDF");
    } finally {
      setDownloading(false);
    }
  };

  const handleDirectPrint = async () => {
    if (!hiddenPreviewRef.current) return;
    setPrinting(true);
    try {
      await printElement(hiddenPreviewRef.current);
    } catch (err) {
      console.error(err);
      toast.error("Errore durante la stampa");
    } finally {
      setPrinting(false);
    }
  };

  const handleSendWhatsApp = () => {
    if (!selectedClient?.phone) {
      toast.error("Il cliente non ha un recapito telefonico registrato.");
      return;
    }
    let clean = selectedClient.phone.replace(/\D/g, "");
    if (clean.length === 10 && clean.startsWith("3")) {
      clean = `39${clean}`;
    }
    const totalFmt = formatCurrency(totals.total);
    const msg = `Gentile ${selectedClient.name},\nle inviamo il riepilogo del Preventivo N. ${value.number} di ${totalFmt}${
      value.title ? ` per "${value.title}"` : ""
    }.\nRestiamo a completa disposizione per qualsiasi chiarimento o sopralluogo.\n\nCordiali saluti,\n${company.company_name}`;
    window.open(
      `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "accettato":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="size-3" /> Accettato
          </span>
        );
      case "inviato":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
            <Clock className="size-3" /> Inviato
          </span>
        );
      case "rifiutato":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
            <XCircle className="size-3" /> Rifiutato
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border">
            Bozza
          </span>
        );
    }
  };

  return (
    <div className="space-y-5 pb-16">
      {/* 1. BARRA SUPERIORE MINIMALE ED ORDINATA */}
      <div className="rounded-xl border border-border/70 bg-card p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Sinistra: Torna + Numero + Badge */}
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-8 px-2.5 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <ArrowLeft className="size-3.5" />
              <span>Preventivi</span>
            </Button>

            <div className="h-4 w-px bg-border/80" />

            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-foreground flex items-center gap-2">
                <span>Preventivo</span>
                <span className="font-mono text-primary font-semibold">{value.number}</span>
              </h1>
              {getStatusBadge(value.status)}
            </div>
          </div>

          {/* Destra: Azioni Rapide */}
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              onClick={onSave}
              disabled={saving}
              size="sm"
              className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium px-3 text-xs gap-1.5 shadow-xs"
            >
              {saving ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Check className="size-3.5" />
              )}
              <span>{saving ? "Salvataggio..." : "Salva preventivo"}</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenPreviewModal(value)}
              className="h-8 text-xs gap-1.5 px-2.5"
            >
              <Eye className="size-3.5 text-primary" />
              <span>Anteprima</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleDirectDownload}
              disabled={downloading}
              className="h-8 text-xs gap-1.5 px-2.5"
            >
              {downloading ? (
                <Loader2 className="size-3.5 animate-spin" />
              ) : (
                <Download className="size-3.5 text-muted-foreground" />
              )}
              <span className="hidden sm:inline">Scarica</span>
            </Button>

            {selectedClient?.phone && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleSendWhatsApp}
                className="h-8 text-xs gap-1.5 px-2.5 text-[#25D366] hover:bg-[#25D366]/10 border-[#25D366]/30"
              >
                <Phone className="size-3.5" />
                <span className="hidden sm:inline">WhatsApp</span>
              </Button>
            )}

            {onDuplicate && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onDuplicate}
                className="size-8 text-muted-foreground hover:text-foreground"
                title="Duplica preventivo"
              >
                <Copy className="size-3.5" />
              </Button>
            )}

            {onDelete && value.id && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="size-8 text-destructive hover:bg-destructive/10"
                title="Elimina preventivo"
              >
                <Trash2 className="size-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* 2. LAYOUT A 2 COLONNE: PRINCIPALE (8) + RIEPILOGO STICKY (4) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* COLONNA PRINCIPALE (8/12) */}
        <div className="lg:col-span-8 space-y-4">
          {/* SEZIONE 1: DATI PREVENTIVO */}
          <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
              <Calendar className="size-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Dati Preventivo
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Numero */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Numero preventivo</Label>
                <Input
                  value={value.number}
                  onChange={(e) => updateField({ number: e.target.value })}
                  className="h-9 text-xs sm:text-sm font-mono bg-muted/30 border-border"
                />
              </div>

              {/* Data Emissione */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Data emissione</Label>
                <Input
                  type="date"
                  value={value.date}
                  onChange={(e) => updateField({ date: e.target.value })}
                  className="h-9 text-xs sm:text-sm bg-background border-border"
                />
              </div>

              {/* Validità / Scadenza con chip veloci */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground">Valido fino al</Label>
                  <div className="flex items-center gap-1 text-[10px]">
                    <button
                      type="button"
                      onClick={() => handleApplyDays(15)}
                      className="px-1 py-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      15gg
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyDays(30)}
                      className="px-1 py-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted font-semibold"
                    >
                      30gg
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyDays(60)}
                      className="px-1 py-0.5 rounded text-muted-foreground hover:text-foreground hover:bg-muted"
                    >
                      60gg
                    </button>
                  </div>
                </div>
                <Input
                  type="date"
                  value={value.secondary_date ?? ""}
                  onChange={(e) => updateField({ secondary_date: e.target.value || null })}
                  className="h-9 text-xs sm:text-sm bg-background border-border"
                />
              </div>

              {/* Cantiere / Luogo Intervento */}
              <div className="space-y-1 sm:col-span-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs text-muted-foreground flex items-center gap-1">
                    <MapPin className="size-3 text-muted-foreground" />
                    Cantiere / Luogo di esecuzione dei lavori
                  </Label>
                  {selectedClient?.address && (
                    <button
                      type="button"
                      onClick={handleUseClientAddress}
                      className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                    >
                      Usa indirizzo cliente
                    </button>
                  )}
                </div>
                <Input
                  value={value.cantiere || ""}
                  onChange={(e) => updateField({ cantiere: e.target.value })}
                  placeholder="Es. Via Garibaldi 12, Milano (MI)..."
                  className="h-9 text-xs sm:text-sm bg-background border-border"
                />
              </div>
            </div>
          </div>

          {/* SEZIONE 2: DATI CLIENTE */}
          <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
              <User className="size-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Dati Cliente
              </h2>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Cliente intestatario *</Label>
                <Select
                  value={value.client_id ?? ""}
                  onValueChange={(cid) => updateField({ client_id: cid })}
                >
                  <SelectTrigger className="h-9 text-xs sm:text-sm bg-background border-border">
                    <SelectValue placeholder="Seleziona cliente..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {clients.map((c, idx) => (
                      <SelectItem
                        key={`client-${c.id || "empty"}-${idx}`}
                        value={c.id}
                        className="text-xs sm:text-sm"
                      >
                        <span className="font-medium text-foreground">{c.name}</span>
                        {c.city && <span className="text-muted-foreground ml-1.5">({c.city})</span>}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Box dettagli cliente compatto ed elegante */}
              {selectedClient && (
                <div className="p-3 rounded-lg bg-muted/30 border border-border/60 text-xs text-muted-foreground flex flex-wrap items-center gap-x-5 gap-y-1.5">
                  {selectedClient.address && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                      <span>
                        {selectedClient.address}
                        {selectedClient.city ? `, ${selectedClient.city}` : ""}
                      </span>
                    </span>
                  )}
                  {selectedClient.phone && (
                    <span className="flex items-center gap-1.5">
                      <Phone className="size-3.5 text-muted-foreground shrink-0" />
                      <a href={`tel:${selectedClient.phone}`} className="hover:text-primary">
                        {selectedClient.phone}
                      </a>
                    </span>
                  )}
                  {selectedClient.email && (
                    <span className="flex items-center gap-1.5">
                      <Mail className="size-3.5 text-muted-foreground shrink-0" />
                      <a href={`mailto:${selectedClient.email}`} className="hover:text-primary">
                        {selectedClient.email}
                      </a>
                    </span>
                  )}
                  {selectedClient.vat_number && (
                    <span>
                      P.IVA / CF:{" "}
                      <strong className="text-foreground font-mono">
                        {selectedClient.vat_number}
                      </strong>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* SEZIONE 3: OGGETTO E DESCRIZIONE LAVORI (PER FATTI SUOI) */}
          <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
              <FileSpreadsheet className="size-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Oggetto e Descrizione Lavori
              </h2>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Oggetto dell'offerta</Label>
                <Input
                  value={value.title || ""}
                  onChange={(e) => updateField({ title: e.target.value })}
                  placeholder="Es. Fornitura e posa in opera caldaia a condensazione e valvole termostatiche..."
                  className="h-9 text-xs sm:text-sm bg-background border-border font-medium"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Descrizione dettagliata dell'intervento / Premessa tecnica
                </Label>
                <Textarea
                  rows={3}
                  value={value.body || ""}
                  onChange={(e) => updateField({ body: e.target.value })}
                  placeholder="Descrizione tecnica dell'intervento da eseguire, tipologia di impianto, specifiche tecniche o premessa dei lavori..."
                  className="text-xs sm:text-sm bg-background border-border resize-y"
                />
              </div>
            </div>
          </div>

          {/* SEZIONE 4: VOCI ED ARTICOLI (SENZA VOCI RAPIDE) */}
          <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center justify-between border-b border-border/60 pb-2.5">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Voci ed Articoli
                </h2>
                <span className="text-xs text-muted-foreground">({value.items.length})</span>
              </div>

              <Button
                type="button"
                onClick={addItem}
                variant="outline"
                size="sm"
                className="h-7 text-xs font-medium gap-1 px-2.5"
              >
                <Plus className="size-3.5" />
                <span>Aggiungi riga</span>
              </Button>
            </div>

            {/* Tabella pulita delle righe */}
            <div className="space-y-2.5">
              {value.items.map((item, idx) => {
                const rowTot = lineTotal(item);
                return (
                  <div
                    key={idx}
                    className="p-3 rounded-lg border border-border/60 bg-muted/15 hover:bg-muted/30 transition-colors space-y-2.5"
                  >
                    <div className="flex items-start gap-2.5">
                      <span className="text-[11px] font-mono text-muted-foreground pt-1.5 w-5 shrink-0 text-center">
                        {idx + 1}
                      </span>

                      <div className="flex-1 min-w-0">
                        <Textarea
                          rows={2}
                          value={item.description}
                          onChange={(e) => updateItem(idx, { description: e.target.value })}
                          placeholder="Descrizione articolo, fornitura o prestazione d'opera..."
                          className="text-xs sm:text-sm bg-background border-border resize-y min-h-[50px]"
                        />
                      </div>

                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeItem(idx)}
                        className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0 mt-1"
                        title="Rimuovi voce"
                      >
                        <Trash2 className="size-3.5" />
                      </Button>
                    </div>

                    {/* Quantità, Prezzo unitario e Totale riga */}
                    <div className="grid grid-cols-12 gap-3 pl-7 items-center">
                      <div className="col-span-4 sm:col-span-3">
                        <Label className="text-[10px] text-muted-foreground uppercase block mb-0.5">
                          Q.tà
                        </Label>
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          value={item.qty}
                          onChange={(e) => updateItem(idx, { qty: Number(e.target.value) || 0 })}
                          className="h-8 text-xs bg-background border-border"
                        />
                      </div>

                      <div className="col-span-5 sm:col-span-4">
                        <Label className="text-[10px] text-muted-foreground uppercase block mb-0.5">
                          Prezzo Unitario (€)
                        </Label>
                        <Input
                          type="number"
                          step="any"
                          min="0"
                          value={item.unit_price}
                          onChange={(e) =>
                            updateItem(idx, { unit_price: Number(e.target.value) || 0 })
                          }
                          className="h-8 text-xs font-mono bg-background border-border"
                        />
                      </div>

                      <div className="col-span-3 sm:col-span-5 text-right">
                        <Label className="text-[10px] text-muted-foreground uppercase block mb-0.5">
                          Totale
                        </Label>
                        <span className="text-xs sm:text-sm font-semibold font-mono text-foreground">
                          {formatCurrency(rowTot)}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <Button
              type="button"
              onClick={addItem}
              variant="outline"
              size="sm"
              className="w-full h-8 text-xs font-medium gap-1.5 border-dashed"
            >
              <Plus className="size-3.5" />
              <span>Aggiungi un'altra voce</span>
            </Button>
          </div>

          {/* SEZIONE 5: CONDIZIONI DI PAGAMENTO (DISTINTA) */}
          <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
              <CreditCard className="size-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Condizioni di Pagamento
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Metodo di pagamento</Label>
                <Select
                  value={value.payment_method_id ?? defaultMethod?.id ?? ""}
                  onValueChange={(mid) => {
                    const found = methods.find((m) => m.id === mid);
                    updateField({
                      payment_method_id: mid,
                      payment_method: found?.typeLabel,
                      payment_iban: found?.iban || "",
                    });
                  }}
                >
                  <SelectTrigger className="h-9 text-xs sm:text-sm bg-background border-border">
                    <SelectValue placeholder="Seleziona metodo..." />
                  </SelectTrigger>
                  <SelectContent>
                    {methods.map((m, idx) => (
                      <SelectItem
                        key={`method-${m.id || "empty"}-${idx}`}
                        value={m.id}
                        className="text-xs sm:text-sm"
                      >
                        {m.name} ({m.typeLabel})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">IBAN di accredito</Label>
                <Input
                  value={value.payment_iban || company.iban || ""}
                  onChange={(e) => updateField({ payment_iban: e.target.value })}
                  placeholder="IT00X0000000000000000000000"
                  className="h-9 text-xs sm:text-sm font-mono bg-background border-border"
                />
              </div>

              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">
                  Termini e scadenze di pagamento
                </Label>
                <Input
                  value={value.payment_conditions || ""}
                  onChange={(e) => updateField({ payment_conditions: e.target.value })}
                  placeholder="Es. 30% all'accettazione d'ordine, 70% a fine lavori con collaudo favorevole..."
                  className="h-9 text-xs sm:text-sm bg-background border-border"
                />
              </div>
            </div>
          </div>

          {/* SEZIONE 6: NOTE PER IL CLIENTE (DISTINTA) */}
          <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
              <FileText className="size-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Note per il Cliente
              </h2>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Condizioni di fornitura, tempi di consegna e garanzie
              </Label>
              <Textarea
                rows={3}
                value={value.notes}
                onChange={(e) => updateField({ notes: e.target.value })}
                placeholder="Es. Tempi di consegna e posa in opera: 5 giorni lavorativi dalla conferma. Garanzia di 24 mesi sul generatore installato e collaudo incluso."
                className="text-xs sm:text-sm bg-background border-border resize-y"
              />
            </div>
          </div>

          {/* SEZIONE 7: ESCLUSIONI ED OPERE NON INCLUSE (DISTINTA) */}
          <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
              <AlertCircle className="size-4 text-amber-500" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Esclusioni e Opere Non Incluse
              </h2>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Opere a carico del committente o escluse dalla presente offerta
              </Label>
              <Textarea
                rows={3}
                value={value.exclusions || ""}
                onChange={(e) => updateField({ exclusions: e.target.value })}
                placeholder="Es. Opere murarie, tracce, tinteggiature e allacciamenti elettrici a carico del committente. Fornitura e noleggio di ponteggio o piattaforma aerea esclusi salvo diversi accordi."
                className="text-xs sm:text-sm bg-background border-border resize-y"
              />
            </div>
          </div>
        </div>

        {/* COLONNA LATERALE: RIEPILOGO ECONOMICO STICKY (4/12) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-4 sticky top-4">
            <div className="border-b border-border/60 pb-2.5">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Riepilogo Economico
              </h3>
            </div>

            <div className="space-y-2.5">
              {/* Imponibile Netto */}
              <div className="flex items-center justify-between text-xs sm:text-sm">
                <span className="text-muted-foreground">Imponibile netto:</span>
                <span className="font-mono font-medium text-foreground">
                  {formatCurrency(totals.net)}
                </span>
              </div>

              {/* Aliquota IVA & Calcolo */}
              <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">Aliquota IVA:</span>
                  <Select
                    value={String(value.vat_rate)}
                    onValueChange={(val) => updateField({ vat_rate: Number(val) })}
                  >
                    <SelectTrigger className="h-7 w-20 text-xs bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="22">22%</SelectItem>
                      <SelectItem value="10">10%</SelectItem>
                      <SelectItem value="4">4%</SelectItem>
                      <SelectItem value="0">0%</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <span className="font-mono text-muted-foreground">
                  {formatCurrency(totals.vat)}
                </span>
              </div>

              {/* TOTALE PREVENTIVO */}
              <div className="border-t border-border/80 pt-3 mt-1">
                <div className="p-3 rounded-lg bg-muted/40 border border-border/80 text-center space-y-0.5">
                  <span className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold block">
                    Totale Preventivo
                  </span>
                  <span className="text-2xl font-bold font-mono text-foreground block">
                    {formatCurrency(totals.total)}
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    IVA {value.vat_rate}% inclusa
                  </span>
                </div>
              </div>

              {/* Pulsante Salva */}
              <Button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-medium h-9 text-xs shadow-xs gap-1.5 mt-1"
              >
                {saving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                <span>{saving ? "Salvataggio..." : "Salva preventivo"}</span>
              </Button>
            </div>

            {/* STATO PREVENTIVO */}
            <div className="pt-3.5 border-t border-border/60 space-y-1.5">
              <Label className="text-xs text-muted-foreground block">Stato del preventivo</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {(["bozza", "inviato", "accettato", "rifiutato"] as const).map((st) => {
                  const isCur = value.status === st;
                  return (
                    <button
                      key={st}
                      type="button"
                      onClick={() => updateField({ status: st })}
                      className={cn(
                        "text-xs font-medium py-1.5 px-2 rounded-md border transition-all capitalize cursor-pointer",
                        isCur
                          ? st === "accettato"
                            ? "bg-emerald-500 text-white border-emerald-600 font-semibold"
                            : st === "inviato"
                              ? "bg-blue-500 text-white border-blue-600 font-semibold"
                              : st === "rifiutato"
                                ? "bg-rose-500 text-white border-rose-600 font-semibold"
                                : "bg-primary text-primary-foreground border-primary font-semibold"
                          : "bg-background border-border text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      {st}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* MODELLO GRAFICO PDF */}
            <div className="pt-3.5 border-t border-border/60 space-y-1.5">
              <Label className="text-xs text-muted-foreground block">Modello grafico PDF</Label>
              <Select
                value={value.template}
                onValueChange={(t) => updateField({ template: t as DocTemplate })}
              >
                <SelectTrigger className="h-8 text-xs bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TEMPLATES.map((tmpl) => (
                    <SelectItem key={tmpl.value} value={tmpl.value} className="text-xs">
                      {tmpl.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* PULSANTI ANTEPRIMA & WHATSAPP */}
            <div className="pt-3.5 border-t border-border/60 space-y-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenPreviewModal(value)}
                className="w-full h-8 text-xs font-medium gap-1.5"
              >
                <Eye className="size-3.5 text-primary" />
                <span>Anteprima PDF</span>
              </Button>

              {selectedClient?.phone && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleSendWhatsApp}
                  className="w-full h-8 text-xs font-medium gap-1.5 text-[#25D366] hover:bg-[#25D366]/10 border-[#25D366]/30"
                >
                  <Phone className="size-3.5" />
                  <span>Invia su WhatsApp</span>
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ANTEPRIMA NASCOSTA PER GENERAZIONE PDF DIRETTO E STAMPA */}
      <div className="fixed -left-[9999px] -top-[9999px] pointer-events-none opacity-0">
        <DocPreview
          ref={hiddenPreviewRef}
          template={value.template}
          docLabel="Preventivo"
          number={value.number}
          date={value.date}
          secondaryDateLabel="Valido fino al"
          secondaryDate={value.secondary_date}
          company={company}
          clientName={selectedClient?.name ?? "Cliente"}
          clientLines={[
            selectedClient?.address ?? "",
            [selectedClient?.zip, selectedClient?.city].filter(Boolean).join(" "),
            selectedClient?.vat_number ? `P.IVA/CF ${selectedClient.vat_number}` : "",
            selectedClient?.email ?? "",
          ]}
          items={value.items}
          vatRate={value.vat_rate}
          notes={value.notes}
          exclusions={value.exclusions}
          paymentConditions={value.payment_conditions}
          title={value.title}
          bodyText={value.body}
          cantiere={value.cantiere}
          paymentMethod={value.payment_method}
          paymentIban={value.payment_iban}
        />
      </div>
    </div>
  );
}
