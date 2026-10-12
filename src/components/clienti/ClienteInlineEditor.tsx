import { useState } from "react";
import {
  AlertCircle,
  ArrowLeft,
  Building2,
  Calendar,
  Check,
  CheckCircle2,
  CreditCard,
  FileSpreadsheet,
  FileText,
  Loader2,
  Mail,
  MapPin,
  Phone,
  Plus,
  Receipt,
  Trash2,
  User,
  Users,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "@tanstack/react-router";
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
import { usePaymentMethods } from "@/hooks/usePaymentMethods";

export type ClientFormValue = {
  id?: string;
  name: string;
  client_type: "privato" | "azienda";
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  zip?: string;
  vat_number?: string;
  notes?: string;
  // Campi avanzati per anagrafica pulita e ordinata
  fiscal_code?: string;
  sdi_code?: string;
  pec_email?: string;
  second_phone?: string;
  province?: string;
  cantiere_notes?: string;
  payment_method_id?: string;
  payment_method?: string;
  payment_iban?: string;
  payment_terms?: string;
  technical_notes?: string;
  exclusions?: string;
};

type Props = {
  value: ClientFormValue;
  onChange: (value: ClientFormValue) => void;
  onSave: () => Promise<void> | void;
  onBack: () => void;
  saving?: boolean;
  onDelete?: () => void;
  interventionsCount?: number;
  quotesCount?: number;
};

export function ClienteInlineEditor({
  value,
  onChange,
  onSave,
  onBack,
  saving,
  onDelete,
  interventionsCount = 0,
  quotesCount = 0,
}: Props) {
  const navigate = useNavigate();
  const { methods, defaultMethod } = usePaymentMethods();

  const updateField = (patch: Partial<ClientFormValue>) => {
    onChange({ ...value, ...patch });
  };

  const handleSendWhatsApp = () => {
    if (!value.phone) {
      toast.error("Nessun numero di telefono registrato.");
      return;
    }
    let clean = value.phone.replace(/\D/g, "");
    if (clean.length === 10 && clean.startsWith("3")) {
      clean = `39${clean}`;
    }
    const msg = `Salve ${value.name}, vi contattiamo da Innovazione Termica. Restiamo a disposizione per qualsiasi necessità.`;
    window.open(
      `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`,
      "_blank",
      "noopener,noreferrer",
    );
  };

  const getInitials = (name: string) => {
    if (!name) return "CL";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="space-y-5">
      {/* 1. HEADER BAR PULITA E ORDINATA */}
      <div className="bg-card rounded-xl border border-border/80 p-3.5 sm:p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Sinistra: Torna ai Clienti + Nome Cliente & Badge */}
          <div className="flex items-center gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="h-8 px-2.5 gap-1.5 text-xs text-muted-foreground hover:text-foreground hover:bg-muted"
            >
              <ArrowLeft className="size-3.5" />
              <span>Clienti</span>
            </Button>

            <div className="h-4 w-px bg-border/80" />

            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold text-foreground truncate max-w-xs sm:max-w-md">
                {value.name || "Nuovo Cliente"}
              </h1>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  value.client_type === "azienda"
                    ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                    : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                }`}
              >
                {value.client_type === "azienda" ? (
                  <>
                    <Building2 className="size-3" /> Azienda
                  </>
                ) : (
                  <>
                    <User className="size-3" /> Privato
                  </>
                )}
              </span>
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
              <span>{saving ? "Salvataggio..." : "Salva cliente"}</span>
            </Button>

            {value.phone && (
              <>
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

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                  className="h-8 text-xs gap-1.5 px-2.5"
                >
                  <a href={`tel:${value.phone}`}>
                    <Phone className="size-3.5 text-primary" />
                    <span className="hidden sm:inline">Chiama</span>
                  </a>
                </Button>
              </>
            )}

            {onDelete && value.id && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="size-8 text-destructive hover:bg-destructive/10"
                title="Elimina cliente"
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
          {/* SEZIONE 1: DATI ANAGRAFICI E FISCALI */}
          <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
              <User className="size-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Dati Anagrafici e Fiscali
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Tipologia */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Tipologia cliente *</Label>
                <Select
                  value={value.client_type}
                  onValueChange={(v: "privato" | "azienda") => updateField({ client_type: v })}
                >
                  <SelectTrigger className="h-9 text-xs sm:text-sm bg-background border-border">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="privato">Persona Fisica (Privato)</SelectItem>
                    <SelectItem value="azienda">Azienda / Società / Ditta Individuale</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Nome o Ragione Sociale */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  {value.client_type === "azienda" ? "Ragione Sociale *" : "Nome e Cognome *"}
                </Label>
                <Input
                  value={value.name}
                  onChange={(e) => updateField({ name: e.target.value })}
                  placeholder="Es. Mario Rossi o Rossi Impianti Srl"
                  className="h-9 text-xs sm:text-sm bg-background border-border font-medium"
                />
              </div>

              {/* Codice Fiscale */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Codice Fiscale</Label>
                <Input
                  value={value.fiscal_code || ""}
                  onChange={(e) => updateField({ fiscal_code: e.target.value.toUpperCase() })}
                  placeholder="RSSMRA80A01H501U"
                  className="h-9 text-xs sm:text-sm font-mono bg-background border-border"
                />
              </div>

              {/* Partita IVA */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Partita IVA</Label>
                <Input
                  value={value.vat_number || ""}
                  onChange={(e) => updateField({ vat_number: e.target.value })}
                  placeholder="IT01234567890"
                  className="h-9 text-xs sm:text-sm font-mono bg-background border-border"
                />
              </div>

              {/* Codice Destinatario SDI */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Codice Univoco SDI (Fatt. Elettronica)
                </Label>
                <Input
                  value={value.sdi_code || ""}
                  onChange={(e) => updateField({ sdi_code: e.target.value.toUpperCase() })}
                  placeholder="0000000 oppure M5UXCR1"
                  className="h-9 text-xs sm:text-sm font-mono bg-background border-border"
                />
              </div>

              {/* PEC */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Indirizzo PEC</Label>
                <Input
                  type="email"
                  value={value.pec_email || ""}
                  onChange={(e) => updateField({ pec_email: e.target.value })}
                  placeholder="azienda@pec.it"
                  className="h-9 text-xs sm:text-sm bg-background border-border"
                />
              </div>
            </div>
          </div>

          {/* SEZIONE 2: RECAPITI E CONTATTI */}
          <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
              <Phone className="size-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Recapiti e Contatti
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Telefono Cellulare Principale */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Telefono Cellulare Principale
                </Label>
                <Input
                  value={value.phone || ""}
                  onChange={(e) => updateField({ phone: e.target.value })}
                  placeholder="Es. 333 1234567"
                  className="h-9 text-xs sm:text-sm bg-background border-border"
                />
              </div>

              {/* Telefono Secondario o Fisso */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Telefono Secondario / Ufficio
                </Label>
                <Input
                  value={value.second_phone || ""}
                  onChange={(e) => updateField({ second_phone: e.target.value })}
                  placeholder="Es. 06 12345678"
                  className="h-9 text-xs sm:text-sm bg-background border-border"
                />
              </div>

              {/* Email Principale */}
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">Email Ordinaria</Label>
                <Input
                  type="email"
                  value={value.email || ""}
                  onChange={(e) => updateField({ email: e.target.value })}
                  placeholder="mario.rossi@email.it"
                  className="h-9 text-xs sm:text-sm bg-background border-border"
                />
              </div>
            </div>
          </div>

          {/* SEZIONE 3: SEDE E INDIRIZZO PRINCIPALE (PER FATTI SUOI) */}
          <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
              <MapPin className="size-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Sede e Indirizzo Principale
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
              {/* Indirizzo e Civico */}
              <div className="space-y-1 sm:col-span-3">
                <Label className="text-xs text-muted-foreground">
                  Indirizzo (Via / Piazza e Civico)
                </Label>
                <Input
                  value={value.address || ""}
                  onChange={(e) => updateField({ address: e.target.value })}
                  placeholder="Es. Via Appia Nuova 120, interno 4 scala B..."
                  className="h-9 text-xs sm:text-sm bg-background border-border"
                />
              </div>

              {/* Città */}
              <div className="space-y-1 sm:col-span-1">
                <Label className="text-xs text-muted-foreground">Città</Label>
                <Input
                  value={value.city || ""}
                  onChange={(e) => updateField({ city: e.target.value })}
                  placeholder="Roma"
                  className="h-9 text-xs sm:text-sm bg-background border-border"
                />
              </div>

              {/* CAP */}
              <div className="space-y-1 sm:col-span-1">
                <Label className="text-xs text-muted-foreground">CAP</Label>
                <Input
                  value={value.zip || ""}
                  onChange={(e) => updateField({ zip: e.target.value })}
                  placeholder="00181"
                  className="h-9 text-xs sm:text-sm bg-background border-border"
                />
              </div>

              {/* Provincia */}
              <div className="space-y-1 sm:col-span-1">
                <Label className="text-xs text-muted-foreground">Provincia</Label>
                <Input
                  value={value.province || ""}
                  onChange={(e) => updateField({ province: e.target.value.toUpperCase() })}
                  placeholder="RM"
                  maxLength={4}
                  className="h-9 text-xs sm:text-sm bg-background border-border uppercase"
                />
              </div>

              {/* Note Cantiere / Istruzioni di Accesso */}
              <div className="space-y-1 sm:col-span-3">
                <Label className="text-xs text-muted-foreground">
                  Istruzioni di Accesso / Citofono / Piano
                </Label>
                <Input
                  value={value.cantiere_notes || ""}
                  onChange={(e) => updateField({ cantiere_notes: e.target.value })}
                  placeholder="Es. Citofonare a Rossi, piano 3 senza ascensore, parcheggio sul retro..."
                  className="h-9 text-xs sm:text-sm bg-background border-border"
                />
              </div>
            </div>
          </div>

          {/* SEZIONE 4: CONDIZIONI DI PAGAMENTO PREFERITE (DISTINTA) */}
          <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
              <CreditCard className="size-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Condizioni di Pagamento Preferite
              </h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Metodo preferito */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Metodo di pagamento abituale
                </Label>
                <Select
                  value={value.payment_method_id ?? defaultMethod?.id ?? ""}
                  onValueChange={(mid) => {
                    const found = methods.find((m) => m.id === mid);
                    updateField({
                      payment_method_id: mid,
                      payment_method: found?.typeLabel,
                    });
                  }}
                >
                  <SelectTrigger className="h-9 text-xs sm:text-sm bg-background border-border">
                    <SelectValue placeholder="Seleziona metodo preferito..." />
                  </SelectTrigger>
                  <SelectContent>
                    {methods.map((m) => (
                      <SelectItem key={m.id} value={m.id} className="text-xs sm:text-sm">
                        {m.name} ({m.typeLabel})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* IBAN Cliente (se per RID/SDD o rimborsi) */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">IBAN del Cliente</Label>
                <Input
                  value={value.payment_iban || ""}
                  onChange={(e) => updateField({ payment_iban: e.target.value })}
                  placeholder="IT00X0000000000000000000000"
                  className="h-9 text-xs sm:text-sm font-mono bg-background border-border"
                />
              </div>

              {/* Termini concordati */}
              <div className="space-y-1 sm:col-span-2">
                <Label className="text-xs text-muted-foreground">
                  Termini e Scadenze di Pagamento Concordate
                </Label>
                <Input
                  value={value.payment_terms || ""}
                  onChange={(e) => updateField({ payment_terms: e.target.value })}
                  placeholder="Es. 30 giorni data fattura fine mese oppure Rimessa diretta a vista fattura..."
                  className="h-9 text-xs sm:text-sm bg-background border-border"
                />
              </div>
            </div>
          </div>

          {/* SEZIONE 5: NOTE E DATI TECNICI IMPIANTO (DISTINTA) */}
          <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
              <Wrench className="size-4 text-primary" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Note Tecniche e Dati Impianto Cliente
              </h2>
            </div>

            <div className="space-y-3">
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">
                  Marca/Modello Caldaia o Climatizzatore, Matricola e Catasto Impianti
                </Label>
                <Textarea
                  rows={3}
                  value={value.technical_notes || ""}
                  onChange={(e) => updateField({ technical_notes: e.target.value })}
                  placeholder="Es. Caldaia Vaillant ecoTEC plus VMW 26 kW installata nel 2021. Matricola: 2120000000000. Codice catasto CURIT: 1234567..."
                  className="text-xs sm:text-sm bg-background border-border resize-y"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Note Generali sul Cliente</Label>
                <Textarea
                  rows={2}
                  value={value.notes || ""}
                  onChange={(e) => updateField({ notes: e.target.value })}
                  placeholder="Note generali, provenienza contatto o storico del cliente..."
                  className="text-xs sm:text-sm bg-background border-border resize-y"
                />
              </div>
            </div>
          </div>

          {/* SEZIONE 6: ESCLUSIONI E AVVERTENZE SPECIALI (DISTINTA) */}
          <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
            <div className="flex items-center gap-2 border-b border-border/60 pb-2.5">
              <AlertCircle className="size-4 text-amber-500" />
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Esclusioni e Avvertenze Speciali per Tecnici
              </h2>
            </div>

            <div className="space-y-1">
              <Label className="text-xs text-muted-foreground">
                Avvertenze operative, orari di reperibilità o limitazioni contrattuali
              </Label>
              <Textarea
                rows={3}
                value={value.exclusions || ""}
                onChange={(e) => updateField({ exclusions: e.target.value })}
                placeholder="Es. Contattare sempre prima dell'arrivo. Cane presente in cortile da custodire. Disponibile solo mattina dalle 8:30 alle 12:30."
                className="text-xs sm:text-sm bg-background border-border resize-y"
              />
            </div>
          </div>
        </div>

        {/* COLONNA LATERALE: SCHEDA PROFILO STICKY (4/12) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="rounded-xl border border-border/70 bg-card p-4 sm:p-5 shadow-xs space-y-4 sticky top-4">
            {/* Profilo Sintetico */}
            <div className="flex items-center gap-3 border-b border-border/60 pb-4">
              <div className="size-12 rounded-xl bg-primary/10 text-primary font-bold flex items-center justify-center text-base shrink-0 border border-primary/20">
                {getInitials(value.name)}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-sm sm:text-base text-foreground truncate">
                  {value.name || "Nuovo Cliente"}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {[value.city, value.province].filter(Boolean).join(" (") +
                    (value.province ? ")" : "") || "Nessuna città"}
                </p>
              </div>
            </div>

            {/* Quick Contacts */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Canali di contatto
              </span>

              {value.phone ? (
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleSendWhatsApp}
                    className="flex-1 h-8 text-xs gap-1.5 text-[#25D366] hover:bg-[#25D366]/10 border-[#25D366]/30"
                  >
                    <Phone className="size-3" />
                    <span>WhatsApp</span>
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    asChild
                    className="flex-1 h-8 text-xs gap-1.5"
                  >
                    <a href={`tel:${value.phone}`}>
                      <Phone className="size-3 text-primary" />
                      <span>Chiama</span>
                    </a>
                  </Button>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground italic">
                  Nessun recapito telefonico inserito.
                </p>
              )}

              {value.email && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full h-8 text-xs gap-1.5"
                >
                  <a href={`mailto:${value.email}`}>
                    <Mail className="size-3 text-primary" />
                    <span className="truncate">{value.email}</span>
                  </a>
                </Button>
              )}
            </div>

            {/* KPI Rapidi Cliente */}
            <div className="pt-2 border-t border-border/60 space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Storico Documentale
              </span>

              <div className="grid grid-cols-2 gap-2 text-center">
                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                  <span className="text-xs text-muted-foreground block">Interventi</span>
                  <span className="text-base font-bold font-mono text-foreground">
                    {interventionsCount}
                  </span>
                </div>

                <div className="p-2.5 rounded-lg bg-muted/40 border border-border/60">
                  <span className="text-xs text-muted-foreground block">Preventivi</span>
                  <span className="text-base font-bold font-mono text-foreground">
                    {quotesCount}
                  </span>
                </div>
              </div>
            </div>

            {/* Azioni Rapide Nuovo Documento per questo cliente */}
            <div className="pt-2 border-t border-border/60 space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                Crea Nuovo per {value.name.split(" ")[0] || "Cliente"}
              </span>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: "/preventivi" })}
                className="w-full h-8 text-xs gap-1.5 justify-start"
              >
                <FileText className="size-3.5 text-primary" />
                <span>Vai a Preventivi</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: "/interventi" })}
                className="w-full h-8 text-xs gap-1.5 justify-start"
              >
                <Wrench className="size-3.5 text-primary" />
                <span>Vai a Interventi</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => navigate({ to: "/fatture" })}
                className="w-full h-8 text-xs gap-1.5 justify-start"
              >
                <Receipt className="size-3.5 text-primary" />
                <span>Vai a Fatture</span>
              </Button>
            </div>

            {/* Pulsante Salva in fondo alla colonna */}
            <div className="pt-2 border-t border-border/60">
              <Button
                type="button"
                onClick={onSave}
                disabled={saving}
                className="w-full h-9 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-xs gap-1.5 shadow-xs"
              >
                {saving ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                <span>Salva anagrafica</span>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
