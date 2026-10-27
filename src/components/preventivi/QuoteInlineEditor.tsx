import { useState, useRef } from "react";
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Calendar,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  CreditCard,
  Download,
  Eye,
  FileSpreadsheet,
  FileText,
  FolderPlus,
  Layers,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Printer,
  Sparkles,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ClientOption, DocFormValue } from "@/components/DocumentEditor";
import type { CompanyInfo, DocItem, DocTemplate } from "@/lib/doc";
import {
  TEMPLATES,
  docTotals,
  emptyItem,
  formatCurrency,
  lineTotal,
  DEFAULT_VAT_RATES,
  DEFAULT_UNITS_OF_MEASURE,
  STANDARD_QUOTE_SECTIONS,
  ITEM_TYPES,
} from "@/lib/doc";
import { DocPreview } from "@/components/DocPreview";
import { downloadPdf, printElement } from "@/lib/pdf";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { useCompany } from "@/hooks/data";

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
  const companyQuery = useCompany();
  const configuredVatRates =
    companyQuery.data?.vat_rates && companyQuery.data.vat_rates.length > 0
      ? companyQuery.data.vat_rates
      : DEFAULT_VAT_RATES;
  const configuredUnits =
    companyQuery.data?.units_of_measure && companyQuery.data.units_of_measure.length > 0
      ? companyQuery.data.units_of_measure
      : DEFAULT_UNITS_OF_MEASURE;
  const defaultUnit = companyQuery.data?.default_unit_of_measure || "pz";

  const selectedClient = clients.find((c) => c.id === value.client_id);
  const totals = docTotals(value.items, value.vat_rate);

  const [customSectionOpen, setCustomSectionOpen] = useState(false);
  const [customSectionName, setCustomSectionName] = useState("");

  // Helper set field
  const updateField = (patch: Partial<DocFormValue>) => {
    onChange({ ...value, ...patch });
  };

  // Elenco sezioni attive e ordinate
  const activeSections = (() => {
    const list: string[] = [];
    if (value.sections && value.sections.length > 0) {
      list.push(...value.sections);
    }
    value.items.forEach((it) => {
      if (it.section && !list.includes(it.section)) {
        list.push(it.section);
      }
    });
    if (list.length === 0) {
      list.push("Lavorazioni principali");
    }
    return list;
  })();

  const updateItem = (index: number, patch: Partial<DocItem>) => {
    const items = value.items.map((it, i) => (i === index ? { ...it, ...patch } : it));
    updateField({ items });
  };

  const handleAddSection = (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (activeSections.includes(trimmed)) {
      toast.info(`La sezione "${trimmed}" è già presente`);
      return;
    }
    const newSections = [...activeSections, trimmed];
    // Aggiungi subito una prima voce vuota appartenente alla nuova sezione
    const newItem = emptyItem(defaultUnit, trimmed);
    updateField({
      sections: newSections,
      items: [...value.items, newItem],
    });
    toast.success(`Sezione "${trimmed}" aggiunta`);
  };

  const handleMoveSection = (sectionName: string, direction: "up" | "down") => {
    const idx = activeSections.indexOf(sectionName);
    if (idx === -1) return;
    if (direction === "up" && idx === 0) return;
    if (direction === "down" && idx === activeSections.length - 1) return;

    const targetIdx = direction === "up" ? idx - 1 : idx + 1;
    const newSections = [...activeSections];
    const [moved] = newSections.splice(idx, 1);
    newSections.splice(targetIdx, 0, moved);

    // Riordina l'array items seguendo l'ordine delle nuove sezioni
    const reorderedItems: DocItem[] = [];
    newSections.forEach((sec) => {
      const secItems = value.items.filter((it) => (it.section || activeSections[0]) === sec);
      reorderedItems.push(...secItems);
    });
    const extraItems = value.items.filter(
      (it) => !newSections.includes(it.section || activeSections[0]),
    );
    reorderedItems.push(...extraItems);

    updateField({
      sections: newSections,
      items: reorderedItems,
    });
  };

  const handleDeleteSection = (sectionName: string) => {
    if (activeSections.length <= 1) {
      toast.error("Non puoi eliminare l'unica sezione rimasta.");
      return;
    }
    const newSections = activeSections.filter((s) => s !== sectionName);
    const fallbackSection = newSections[0];
    const updatedItems = value.items.map((it) =>
      (it.section || activeSections[0]) === sectionName ? { ...it, section: fallbackSection } : it,
    );
    updateField({
      sections: newSections,
      items: updatedItems,
    });
    toast.success(`Sezione rimossa. Voci spostate in "${fallbackSection}".`);
  };

  const handleAddItemToSection = (sectionName: string) => {
    const newItem = emptyItem(defaultUnit, sectionName);
    let lastIndex = -1;
    for (let i = value.items.length - 1; i >= 0; i--) {
      if ((value.items[i].section || activeSections[0]) === sectionName) {
        lastIndex = i;
        break;
      }
    }
    const newItems = [...value.items];
    if (lastIndex >= 0) {
      newItems.splice(lastIndex + 1, 0, newItem);
    } else {
      newItems.push(newItem);
    }
    updateField({
      sections: activeSections.includes(sectionName)
        ? activeSections
        : [...activeSections, sectionName],
      items: newItems,
    });
  };

  const handleMoveItemInSection = (itemIndex: number, direction: "up" | "down") => {
    const currentItem = value.items[itemIndex];
    const currentSec = currentItem.section || activeSections[0];

    const sectionIndices = value.items
      .map((it, idx) => ({ sec: it.section || activeSections[0], idx }))
      .filter((x) => x.sec === currentSec)
      .map((x) => x.idx);

    const pos = sectionIndices.indexOf(itemIndex);
    if (pos === -1) return;

    if (direction === "up") {
      if (pos === 0) return;
      const targetIdx = sectionIndices[pos - 1];
      const newItems = [...value.items];
      const temp = newItems[itemIndex];
      newItems[itemIndex] = newItems[targetIdx];
      newItems[targetIdx] = temp;
      updateField({ items: newItems });
    } else {
      if (pos === sectionIndices.length - 1) return;
      const targetIdx = sectionIndices[pos + 1];
      const newItems = [...value.items];
      const temp = newItems[itemIndex];
      newItems[itemIndex] = newItems[targetIdx];
      newItems[targetIdx] = temp;
      updateField({ items: newItems });
    }
  };

  const handleDuplicateItem = (itemIndex: number) => {
    const itemToClone = value.items[itemIndex];
    const cloned: DocItem = {
      ...itemToClone,
      id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      description: itemToClone.description ? `${itemToClone.description} (Copia)` : "",
    };
    const newItems = [...value.items];
    newItems.splice(itemIndex + 1, 0, cloned);
    updateField({ items: newItems });
    toast.success("Voce duplicata");
  };

  const addItem = () => {
    const lastSec = activeSections[activeSections.length - 1] || "Lavorazioni principali";
    handleAddItemToSection(lastSec);
  };

  const removeItem = (index: number) => {
    if (value.items.length <= 1) {
      updateField({ items: [emptyItem(defaultUnit, activeSections[0])] });
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

          {/* SEZIONE 4: VOCI ED ARTICOLI CON CAPITOLI / SEZIONI */}
          <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="size-4 text-primary" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Voci ed Articoli
                </h2>
                <span className="text-xs text-muted-foreground">({value.items.length})</span>
              </div>

              <div className="flex items-center gap-2">
                {/* Menu a discesa Aggiungi Sezione */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs font-medium gap-1.5 px-3 bg-background hover:bg-muted/40"
                    >
                      <FolderPlus className="size-3.5 text-primary" />
                      <span>Aggiungi sezione</span>
                      <ChevronDown className="size-3 text-muted-foreground ml-0.5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-60 text-xs">
                    {STANDARD_QUOTE_SECTIONS.map((secName) => {
                      const isAlreadyPresent = activeSections.includes(secName);
                      return (
                        <DropdownMenuItem
                          key={secName}
                          onClick={() => handleAddSection(secName)}
                          className="text-xs cursor-pointer flex items-center justify-between py-2"
                        >
                          <span>{secName}</span>
                          {isAlreadyPresent && (
                            <span className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                              presente
                            </span>
                          )}
                        </DropdownMenuItem>
                      );
                    })}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={() => {
                        setCustomSectionName("");
                        setCustomSectionOpen(true);
                      }}
                      className="text-xs cursor-pointer text-primary font-medium flex items-center gap-1.5 py-2"
                    >
                      <Plus className="size-3.5" />
                      <span>Sezione personalizzata...</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Pulsante rapido Aggiungi voce */}
                <Button
                  type="button"
                  onClick={addItem}
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs font-medium gap-1 px-2.5"
                >
                  <Plus className="size-3.5" />
                  <span>Aggiungi voce</span>
                </Button>
              </div>
            </div>

            {/* Sezioni con voci raggruppate */}
            <div className="space-y-4">
              {activeSections.map((sectionName, secIdx) => {
                const sectionItems = value.items
                  .map((item, originalIndex) => ({ item, originalIndex }))
                  .filter((x) => (x.item.section || activeSections[0]) === sectionName);

                return (
                  <div
                    key={sectionName}
                    className="rounded-xl border border-border/70 bg-muted/10 overflow-hidden space-y-3 p-3 sm:p-4"
                  >
                    {/* Intestazione del Capitolo / Sezione */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5 bg-muted/30 -mx-3 -mt-3 sm:-mx-4 sm:-mt-4 px-3 py-2 sm:px-4">
                      <div className="flex items-center gap-2 min-w-0">
                        <Layers className="size-4 text-primary shrink-0" />
                        <span className="font-bold text-xs sm:text-sm text-foreground uppercase tracking-wide truncate">
                          {sectionName}
                        </span>
                        <span className="text-[11px] text-muted-foreground shrink-0 font-normal">
                          ({sectionItems.length} {sectionItems.length === 1 ? "voce" : "voci"})
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* Sposta sezione Su */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground"
                          title="Sposta sezione in alto"
                          disabled={secIdx === 0}
                          onClick={() => handleMoveSection(sectionName, "up")}
                        >
                          <ArrowUp className="size-3.5" />
                        </Button>
                        {/* Sposta sezione Giù */}
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="size-7 text-muted-foreground hover:text-foreground"
                          title="Sposta sezione in basso"
                          disabled={secIdx === activeSections.length - 1}
                          onClick={() => handleMoveSection(sectionName, "down")}
                        >
                          <ArrowDown className="size-3.5" />
                        </Button>

                        <span className="h-4 w-px bg-border/70 mx-0.5" />

                        {/* Aggiungi voce specifica per questa sezione */}
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 text-xs font-medium gap-1 px-2.5 bg-background shadow-2xs"
                          onClick={() => handleAddItemToSection(sectionName)}
                        >
                          <Plus className="size-3" />
                          <span>Voce</span>
                        </Button>

                        {/* Elimina sezione (se presente più di una) */}
                        {activeSections.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="size-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            title="Elimina sezione"
                            onClick={() => handleDeleteSection(sectionName)}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        )}
                      </div>
                    </div>

                    {/* Elenco voci appartenenti alla sezione */}
                    <div className="space-y-3 pt-1">
                      {sectionItems.length === 0 ? (
                        <div className="py-5 text-center border border-dashed border-border/70 rounded-lg bg-background/50 text-xs text-muted-foreground">
                          Nessuna voce in questa sezione.{" "}
                          <button
                            type="button"
                            onClick={() => handleAddItemToSection(sectionName)}
                            className="text-primary font-medium hover:underline ml-1"
                          >
                            + Aggiungi una voce
                          </button>
                        </div>
                      ) : (
                        sectionItems.map(({ item, originalIndex }, posInSection) => {
                          const rowTot = lineTotal(item);
                          const isFirstInSection = posInSection === 0;
                          const isLastInSection = posInSection === sectionItems.length - 1;

                          return (
                            <div
                              key={item.id || originalIndex}
                              className="rounded-lg border border-border/80 bg-card p-3 sm:p-3.5 shadow-2xs space-y-3 transition-colors hover:border-primary/40"
                            >
                              {/* Descrizione voce */}
                              <div className="space-y-1">
                                <Label className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider flex items-center gap-1.5">
                                  <span className="size-4 rounded-full bg-primary/10 text-primary text-[10px] inline-flex items-center justify-center font-mono font-bold">
                                    {posInSection + 1}
                                  </span>
                                  Descrizione
                                </Label>
                                <Textarea
                                  rows={2}
                                  value={item.description}
                                  onChange={(e) =>
                                    updateItem(originalIndex, { description: e.target.value })
                                  }
                                  placeholder="Descrizione dettagliata dell'articolo, fornitura o prestazione d'opera..."
                                  className="text-xs sm:text-sm bg-background border-border resize-y min-h-[52px]"
                                />
                              </div>

                              {/* Griglia Quantità, U.M., Prezzo Unitario, Sconto, Totale Riga */}
                              <div className="grid grid-cols-2 sm:grid-cols-12 gap-2.5 items-end">
                                <div className="col-span-1 sm:col-span-2">
                                  <Label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                                    Quantità
                                  </Label>
                                  <Input
                                    type="number"
                                    step="any"
                                    min="0"
                                    value={item.qty}
                                    onChange={(e) =>
                                      updateItem(originalIndex, {
                                        qty: Number(e.target.value) || 0,
                                      })
                                    }
                                    className="h-8 text-xs bg-background border-border"
                                  />
                                </div>

                                <div className="col-span-1 sm:col-span-2">
                                  <Label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                                    Unità
                                  </Label>
                                  <Select
                                    value={item.unit || defaultUnit}
                                    onValueChange={(val) =>
                                      updateItem(originalIndex, { unit: val })
                                    }
                                  >
                                    <SelectTrigger className="h-8 text-xs bg-background border-border px-2">
                                      <SelectValue placeholder="U.M." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {configuredUnits.map((u) => (
                                        <SelectItem key={u.id} value={u.code} className="text-xs">
                                          {u.code}{" "}
                                          <span className="text-muted-foreground text-[10px]">
                                            ({u.name})
                                          </span>
                                        </SelectItem>
                                      ))}
                                      {!configuredUnits.some(
                                        (u) => u.code === (item.unit || defaultUnit),
                                      ) && (
                                        <SelectItem
                                          value={item.unit || defaultUnit}
                                          className="text-xs"
                                        >
                                          {item.unit || defaultUnit}
                                        </SelectItem>
                                      )}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="col-span-1 sm:col-span-3">
                                  <Label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                                    Prezzo Unit. (€)
                                  </Label>
                                  <Input
                                    type="number"
                                    step="any"
                                    min="0"
                                    value={item.unit_price}
                                    onChange={(e) =>
                                      updateItem(originalIndex, {
                                        unit_price: Number(e.target.value) || 0,
                                      })
                                    }
                                    className="h-8 text-xs font-mono bg-background border-border"
                                  />
                                </div>

                                <div className="col-span-1 sm:col-span-2">
                                  <Label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                                    Sconto %
                                  </Label>
                                  <Input
                                    type="number"
                                    step="any"
                                    min="0"
                                    max="100"
                                    value={item.discount ?? 0}
                                    onChange={(e) =>
                                      updateItem(originalIndex, {
                                        discount: Number(e.target.value) || 0,
                                      })
                                    }
                                    placeholder="0"
                                    className="h-8 text-xs font-mono bg-background border-border"
                                  />
                                </div>

                                <div className="col-span-2 sm:col-span-3 flex flex-col justify-end text-right pb-0.5 sm:pb-1">
                                  <Label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                                    Totale Riga
                                  </Label>
                                  <div className="h-8 flex items-center justify-end px-2.5 rounded-md bg-muted/40 border border-border/60">
                                    <span className="text-xs sm:text-sm font-bold font-mono text-foreground">
                                      {formatCurrency(rowTot)}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Classificazione Tipo & Sezione */}
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1 border-t border-border/50">
                                <div>
                                  <Label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                                    Tipo voce
                                  </Label>
                                  <Select
                                    value={item.item_type || "Lavorazione"}
                                    onValueChange={(val) =>
                                      updateItem(originalIndex, { item_type: val })
                                    }
                                  >
                                    <SelectTrigger className="h-7 text-xs bg-background border-border">
                                      <SelectValue placeholder="Seleziona tipo..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {ITEM_TYPES.map((t) => (
                                        <SelectItem key={t} value={t} className="text-xs">
                                          {t}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div>
                                  <Label className="text-[10px] text-muted-foreground uppercase font-medium block mb-1">
                                    Sezione di appartenenza
                                  </Label>
                                  <Select
                                    value={item.section || sectionName}
                                    onValueChange={(val) =>
                                      updateItem(originalIndex, { section: val })
                                    }
                                  >
                                    <SelectTrigger className="h-7 text-xs bg-background border-border">
                                      <SelectValue placeholder="Seleziona sezione..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {activeSections.map((sec) => (
                                        <SelectItem key={sec} value={sec} className="text-xs">
                                          {sec}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                </div>
                              </div>

                              {/* Barra Azioni Voce (Sposta su, Sposta giù, Duplica, Elimina) */}
                              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border/40">
                                <div className="flex items-center gap-1.5">
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[11px] font-medium gap-1 px-2 text-muted-foreground hover:text-foreground"
                                    disabled={isFirstInSection}
                                    onClick={() => handleMoveItemInSection(originalIndex, "up")}
                                    title="Sposta su nella sezione"
                                  >
                                    <ArrowUp className="size-3" />
                                    <span>Sposta su</span>
                                  </Button>

                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[11px] font-medium gap-1 px-2 text-muted-foreground hover:text-foreground"
                                    disabled={isLastInSection}
                                    onClick={() => handleMoveItemInSection(originalIndex, "down")}
                                    title="Sposta giù nella sezione"
                                  >
                                    <ArrowDown className="size-3" />
                                    <span>Sposta giù</span>
                                  </Button>

                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    className="h-7 text-[11px] font-medium gap-1 px-2 text-muted-foreground hover:text-foreground"
                                    onClick={() => handleDuplicateItem(originalIndex)}
                                    title="Duplica voce"
                                  >
                                    <Copy className="size-3" />
                                    <span>Duplica voce</span>
                                  </Button>
                                </div>

                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  className="h-7 text-[11px] font-medium gap-1 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => removeItem(originalIndex)}
                                  title="Elimina voce"
                                >
                                  <Trash2 className="size-3" />
                                  <span>Elimina</span>
                                </Button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dialog per Sezione Personalizzata */}
            <Dialog open={customSectionOpen} onOpenChange={setCustomSectionOpen}>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-base font-semibold">
                    Aggiungi Sezione Personalizzata
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground">
                    Inserisci il titolo del capitolo o categoria per raggruppare le voci del
                    preventivo.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-3 py-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Nome della sezione</Label>
                    <Input
                      value={customSectionName}
                      onChange={(e) => setCustomSectionName(e.target.value)}
                      placeholder="Es. Opere in cartongesso, Impianto di allarme..."
                      className="text-xs sm:text-sm"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (customSectionName.trim()) {
                            handleAddSection(customSectionName);
                            setCustomSectionOpen(false);
                          }
                        }
                      }}
                      autoFocus
                    />
                  </div>
                </div>
                <DialogFooter className="gap-2 sm:gap-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setCustomSectionOpen(false)}
                  >
                    Annulla
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    disabled={!customSectionName.trim()}
                    onClick={() => {
                      if (customSectionName.trim()) {
                        handleAddSection(customSectionName);
                        setCustomSectionOpen(false);
                      }
                    }}
                  >
                    Aggiungi sezione
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
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
                    <SelectTrigger className="h-7 min-w-[95px] text-xs bg-background border-border">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {configuredVatRates.map((vr) => (
                        <SelectItem key={vr.id} value={String(vr.rate)} className="text-xs">
                          {vr.rate}% {vr.label ? `· ${vr.label}` : ""}
                        </SelectItem>
                      ))}
                      {!configuredVatRates.some(
                        (vr) => Number(vr.rate) === Number(value.vat_rate),
                      ) && (
                        <SelectItem value={String(value.vat_rate)} className="text-xs">
                          {value.vat_rate}% (Personalizzata)
                        </SelectItem>
                      )}
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
