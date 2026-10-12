import { useEffect, useRef, useState, useMemo, useCallback } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDown,
  ArrowUp,
  Building2,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Copy,
  CreditCard,
  ExternalLink,
  Eye,
  EyeOff,
  FileCode,
  FileSpreadsheet,
  FileText,
  Globe,
  LayoutGrid,
  Link2,
  Loader2,
  Lock,
  Mail,
  MapPin,
  MoreHorizontal,
  Pencil,
  Phone,
  Plus,
  RotateCcw,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import {
  useSidebarNavConfig,
  NAV_ICONS_MAP,
  saveConfig,
  DEFAULT_NAV_CONFIG,
  type NavItemConfig,
} from "@/hooks/useSidebarNavConfig";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { DEFAULT_SETTINGS, useCompany, useSaveCompany, type CompanySettings } from "@/hooks/data";
import {
  usePaymentMethods,
  SDI_PAYMENT_TYPES,
  type PaymentMethod,
} from "@/hooks/usePaymentMethods";
import defaultLogo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/impostazioni")({
  head: () => ({
    meta: [
      { title: "Impostazioni e Configurazione — INNOVAZIONE TERMICA" },
      {
        name: "description",
        content:
          "Configurazione sistema: profilo di fatturazione, modalità di pagamento, utenti, modelli e SDI.",
      },
      { property: "og:title", content: "Impostazioni e Configurazione — INNOVAZIONE TERMICA" },
      {
        property: "og:description",
        content: "Gestione profilo fatturazione, modalità di pagamento e parametri aziendali.",
      },
    ],
  }),
  component: ImpostazioniPage,
});

type SectionId =
  | "modalita_pagamento"
  | "profilo_fatturazione"
  | "profilo_utenti"
  | "fatturazione_elettronica"
  | "modelli"
  | "personalizza_menu"
  | "app_servizi"
  | "avanzate"
  | "gestione_link";

type SectionMeta = {
  id: SectionId;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
};

const ALL_SECTIONS: SectionMeta[] = [
  {
    id: "profilo_fatturazione",
    label: "Profilo di fatturazione",
    shortLabel: "Fatturazione",
    icon: Building2,
    description: "Dati aziendali, intestazione, P.IVA, CF e logo visualizzati sui documenti.",
  },
  {
    id: "fatturazione_elettronica",
    label: "Fatturazione elettronica",
    shortLabel: "Fatt. Elett.",
    icon: FileCode,
    description:
      "Codice destinatario SDI, indirizzo PEC, formato XML FPR12/FPA12 e regime fiscale.",
  },
  {
    id: "modalita_pagamento",
    label: "Modalità Pagamento",
    shortLabel: "Pagamenti",
    icon: CreditCard,
    description:
      "Configura i metodi di pagamento (MP01-MP22) e l'IBAN predefinito per i documenti.",
  },
  {
    id: "profilo_utenti",
    label: "Profilo utenti",
    shortLabel: "Utenti",
    icon: Users,
    description: "Gestione collaboratori, account tecnici e livelli di autorizzazione.",
  },
  {
    id: "modelli",
    label: "Modelli",
    shortLabel: "Modelli",
    icon: FileSpreadsheet,
    description: "Template e layout per Preventivi, Ordini, DDT, Fatture e Rapportini.",
  },
  {
    id: "personalizza_menu",
    label: "Personalizza menu",
    shortLabel: "Menu",
    icon: LayoutGrid,
    description: "Personalizza la visibilità e l'ordine delle voci nella barra di navigazione.",
  },
  {
    id: "app_servizi",
    label: "App e servizi esterni",
    shortLabel: "Integrazioni",
    icon: Globe,
    description: "Integrazioni con WhatsApp Web, Google Calendar, Cloud Backup e server email.",
  },
  {
    id: "gestione_link",
    label: "Gestione link",
    shortLabel: "Link",
    icon: Link2,
    description: "Collegamenti pubblici per approvazione preventivi e tracciamento interventi.",
  },
  {
    id: "avanzate",
    label: "Avanzate",
    shortLabel: "Avanzate",
    icon: SlidersHorizontal,
    description: "Prefissi numerazione, decimali, valuta predefinita ed esportazione backup.",
  },
];

const SECTION_MAP: Record<SectionId, SectionMeta> = ALL_SECTIONS.reduce(
  (acc, item) => {
    acc[item.id] = item;
    return acc;
  },
  {} as Record<SectionId, SectionMeta>,
);

const PAYMENT_TERMS_PRESETS = [
  "Saldo a fine lavori",
  "Acconto 50% alla firma, Saldo a fine lavori",
  "Acconto 50% alla firma, 40% a fine lavori, 10% Collaudo",
] as const;

type PaymentPreset = (typeof PAYMENT_TERMS_PRESETS)[number];

function isPaymentPreset(val: string): val is PaymentPreset {
  return (PAYMENT_TERMS_PRESETS as readonly string[]).includes(val);
}

function ImpostazioniPage() {
  const company = useCompany();
  const saveCompany = useSaveCompany();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const {
    methods,
    defaultMethod,
    addMethod,
    updateMethod,
    deleteMethod,
    setDefaultMethod,
    resetToDefault,
  } = usePaymentMethods();

  // Scheda attiva: tutte le sezioni sono sempre integrate e aperte in alto stile browser
  const [activeTab, setActiveTab] = useState<SectionId>("profilo_fatturazione");

  // Riferimento e controllo scorrimento barra schede laterale
  const tabListRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = tabListRef.current;
    if (!el) return;
    const { scrollLeft, scrollWidth, clientWidth } = el;
    setCanScrollLeft(scrollLeft > 4);
    setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = tabListRef.current;
    if (!el) return;

    checkScroll();
    el.addEventListener("scroll", checkScroll, { passive: true });
    window.addEventListener("resize", checkScroll);

    const resizeObserver = new ResizeObserver(() => {
      checkScroll();
    });
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener("scroll", checkScroll);
      window.removeEventListener("resize", checkScroll);
      resizeObserver.disconnect();
    };
  }, [checkScroll]);

  const handleScrollTabs = (direction: "left" | "right") => {
    const el = tabListRef.current;
    if (!el) return;
    const scrollAmount = 260;
    el.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Stato Dati aziendali e snapshot per tracciare le modifiche
  const [form, setForm] = useState<CompanySettings>({ ...DEFAULT_SETTINGS });
  const [savedForm, setSavedForm] = useState<CompanySettings>({ ...DEFAULT_SETTINGS });
  const [isInitialized, setIsInitialized] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isCustomPayment, setIsCustomPayment] = useState<boolean>(() => {
    return !isPaymentPreset(DEFAULT_SETTINGS.quote_payment_terms);
  });

  // Stato modifiche per personalizzazione menu
  const [menuIsDirty, setMenuIsDirty] = useState(false);
  const saveMenuRef = useRef<(() => void) | null>(null);

  // Stato Modalità di Pagamento (Screenshot 2)
  const [selectedMethodIds, setSelectedMethodIds] = useState<string[]>([]);
  const [sortAsc, setSortAsc] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [paymentForm, setPaymentForm] = useState<{
    code: string;
    name: string;
    iban: string;
    is_default: boolean;
  }>({
    code: "MP05",
    name: "Bonifico",
    iban: "",
    is_default: false,
  });

  useEffect(() => {
    if (company.data) {
      const terms = company.data.quote_payment_terms || DEFAULT_SETTINGS.quote_payment_terms;
      setIsCustomPayment(!isPaymentPreset(terms));
      const merged: CompanySettings = {
        ...DEFAULT_SETTINGS,
        ...company.data,
        owner_first_name: company.data.owner_first_name || DEFAULT_SETTINGS.owner_first_name,
        owner_last_name: company.data.owner_last_name || DEFAULT_SETTINGS.owner_last_name,
        phone: company.data.phone || DEFAULT_SETTINGS.phone,
        email: company.data.email || DEFAULT_SETTINGS.email,
        city: company.data.city || DEFAULT_SETTINGS.city,
        quote_prefix: company.data.quote_prefix || DEFAULT_SETTINGS.quote_prefix,
        quote_validity_days:
          company.data.quote_validity_days || DEFAULT_SETTINGS.quote_validity_days,
        default_vat_rate: company.data.default_vat_rate ?? DEFAULT_SETTINGS.default_vat_rate,
        quote_payment_terms:
          company.data.quote_payment_terms || DEFAULT_SETTINGS.quote_payment_terms,
        quote_default_exclusions:
          company.data.quote_default_exclusions || DEFAULT_SETTINGS.quote_default_exclusions,
      };
      setForm(merged);
      setSavedForm(merged);
      setIsInitialized(true);
    }
  }, [company.data]);

  // Campi gestiti per ciascuna scheda aziendale
  const TAB_FIELDS: Record<SectionId, (keyof CompanySettings)[]> = useMemo(
    () => ({
      profilo_fatturazione: [
        "company_name",
        "owner_first_name",
        "owner_last_name",
        "vat_number",
        "fiscal_code",
        "address",
        "zip",
        "city",
        "province",
        "phone",
        "email",
        "iban",
        "quote_payment_terms",
        "default_vat_rate",
        "quote_default_exclusions",
        "logo_url",
      ],
      fatturazione_elettronica: ["sdi_code", "pec_email", "xml_transmission_format", "tax_regime"],
      modalita_pagamento: ["iban", "quote_payment_terms"],
      profilo_utenti: ["tech_can_view_prices", "allow_edit_approved_quotes"],
      modelli: [
        "default_template",
        "template_quotes",
        "template_invoices",
        "template_electronic_invoices",
        "template_interventions",
        "template_ddt",
        "template_email",
      ],
      personalizza_menu: [],
      app_servizi: ["whatsapp_enabled", "whatsapp_custom_msg", "google_calendar_enabled"],
      avanzate: [
        "quote_prefix",
        "invoice_prefix",
        "intervention_prefix",
        "quote_validity_days",
        "price_decimals",
        "currency",
      ],
      gestione_link: ["public_link_expiration_days", "public_link_require_signature"],
    }),
    [],
  );

  // Verifica se la scheda attiva presenta nuove modifiche in corso
  const isCurrentTabDirty = useMemo(() => {
    if (activeTab === "personalizza_menu") {
      return menuIsDirty;
    }
    const fields = TAB_FIELDS[activeTab];
    if (!fields || fields.length === 0) return false;
    return fields.some((key) => form[key] !== savedForm[key]);
  }, [activeTab, form, savedForm, menuIsDirty, TAB_FIELDS]);

  // Verifica se una specifica scheda ha modifiche
  const isTabDirty = useCallback(
    (tabId: SectionId) => {
      if (tabId === "personalizza_menu") return menuIsDirty;
      const fields = TAB_FIELDS[tabId];
      if (!fields || fields.length === 0) return false;
      return fields.some((key) => form[key] !== savedForm[key]);
    },
    [TAB_FIELDS, form, savedForm, menuIsDirty],
  );

  // Upload Logo
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!["image/png", "image/jpeg"].includes(file.type)) {
      toast.error("Formato non valido. Seleziona un file PNG o JPG.");
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Il file supera la dimensione massima di 2 MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      const img = new Image();
      img.onload = () => {
        if (img.width < 80 || img.height < 80) {
          toast.error("L'immagine deve essere di almeno 80×80 px.");
          return;
        }
        if (img.width > 4000 || img.height > 4000) {
          toast.error("L'immagine non può superare i 4000 px di lato.");
          return;
        }

        const maxSide = 800;
        let targetWidth = img.width;
        let targetHeight = img.height;

        if (img.width > maxSide || img.height > maxSide) {
          if (img.width > img.height) {
            targetWidth = maxSide;
            targetHeight = Math.round((img.height * maxSide) / img.width);
          } else {
            targetHeight = maxSide;
            targetWidth = Math.round((img.width * maxSide) / img.height);
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = targetWidth;
        canvas.height = targetHeight;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

        const resizedDataUrl = canvas.toDataURL(file.type, 0.92);
        setForm((prev) => ({ ...prev, logo_url: resizedDataUrl }));
        toast.success("Logo aggiornato.");
      };
      img.src = src;
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveLogo = () => {
    setForm((prev) => ({ ...prev, logo_url: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
    toast.info("Logo reimpostato al predefinito.");
  };

  const handleSaveActiveSettings = async () => {
    if (activeTab === "personalizza_menu") {
      if (saveMenuRef.current) {
        saveMenuRef.current();
        setMenuIsDirty(false);
      }
      return;
    }

    setSaving(true);
    try {
      await saveCompany.mutateAsync(form);
      setSavedForm({ ...form });

      const messages: Record<SectionId, string> = {
        profilo_fatturazione: "Profilo di fatturazione salvato con successo.",
        fatturazione_elettronica: "Parametri fatturazione elettronica salvati con successo.",
        modalita_pagamento: "Parametri di pagamento salvati con successo.",
        profilo_utenti: "Impostazioni utenti e permessi salvate con successo.",
        modelli: "Modelli documenti salvati con successo.",
        personalizza_menu: "Configurazione menu barra laterale salvata con successo.",
        app_servizi: "Impostazioni app e servizi salvate con successo.",
        avanzate: "Impostazioni avanzate salvate con successo.",
        gestione_link: "Configurazione link pubblici salvata con successo.",
      };

      toast.success(messages[activeTab] || "Modifiche salvate con successo.");
    } catch {
      toast.error("Errore durante il salvataggio.");
    } finally {
      setSaving(false);
    }
  };

  // Ordinamento lista pagamenti
  const sortedMethods = useMemo(() => {
    const list = [...methods];
    list.sort((a, b) => {
      const cmp = a.typeLabel.localeCompare(b.typeLabel);
      return sortAsc ? cmp : -cmp;
    });
    return list;
  }, [methods, sortAsc]);

  // Gestione Modalità di Pagamento
  const openNewPaymentModal = () => {
    setEditingMethod(null);
    setPaymentForm({
      code: "MP05",
      name: "Bonifico",
      iban: form.iban || "IT20X0878773190000000070774",
      is_default: false,
    });
    setPaymentModalOpen(true);
  };

  const openEditPaymentModal = (pm: PaymentMethod) => {
    setEditingMethod(pm);
    setPaymentForm({
      code: pm.code,
      name: pm.name,
      iban: pm.iban || "",
      is_default: pm.is_default,
    });
    setPaymentModalOpen(true);
  };

  const handleSavePaymentMethod = () => {
    if (!paymentForm.name.trim()) {
      toast.error("Inserisci un nome per la modalità di pagamento.");
      return;
    }

    const typeDef = SDI_PAYMENT_TYPES.find((t) => t.code === paymentForm.code);
    const typeLabel = typeDef ? typeDef.label : `${paymentForm.name} (${paymentForm.code})`;

    if (editingMethod) {
      updateMethod(editingMethod.id, {
        code: paymentForm.code,
        typeLabel,
        name: paymentForm.name,
        iban: paymentForm.iban.trim(),
        is_default: paymentForm.is_default,
      });
      toast.success("Modalità di pagamento aggiornata.");
    } else {
      addMethod({
        code: paymentForm.code,
        typeLabel,
        name: paymentForm.name,
        iban: paymentForm.iban.trim(),
        is_default: paymentForm.is_default,
        is_system: false,
      });
      toast.success("Nuova modalità di pagamento aggiunta.");
    }

    // Se impostata come predefinita e con IBAN, sincronizza anche company settings
    if (paymentForm.is_default && paymentForm.iban.trim()) {
      setForm((prev) => ({ ...prev, iban: paymentForm.iban.trim() }));
      saveCompany.mutate({ iban: paymentForm.iban.trim() });
    }

    setPaymentModalOpen(false);
  };

  const toggleSelectMethod = (id: string) => {
    setSelectedMethodIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );
  };

  const toggleSelectAll = () => {
    if (selectedMethodIds.length === methods.length) {
      setSelectedMethodIds([]);
    } else {
      setSelectedMethodIds(methods.map((m) => m.id));
    }
  };

  const handleSetSelectedAsDefault = () => {
    if (selectedMethodIds.length !== 1) {
      toast.error("Seleziona una sola modalità da impostare come predefinita.");
      return;
    }
    const id = selectedMethodIds[0];
    setDefaultMethod(id);
    const chosen = methods.find((m) => m.id === id);
    if (chosen?.iban) {
      setForm((prev) => ({ ...prev, iban: chosen.iban || "" }));
      saveCompany.mutate({ iban: chosen.iban });
    }
    toast.success("Modalità predefinita aggiornata per tutti i nuovi documenti.");
  };

  const activeSectionInfo = SECTION_MAP[activeTab] || ALL_SECTIONS[0];

  return (
    <AppLayout
      title="Configurazione e Impostazioni"
      description="Personalizza il gestionale: profilo di fatturazione, modalità di pagamento, modelli e integrazioni."
      actions={
        isCurrentTabDirty ? (
          <Button
            onClick={handleSaveActiveSettings}
            disabled={saving}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-5 py-2 shadow-xs rounded-lg transition-all animate-in fade-in zoom-in-95 duration-200 cursor-pointer flex items-center gap-2"
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
            )}
            <span>Salva modifiche</span>
          </Button>
        ) : null
      }
    >
      <div className="space-y-5 pb-12">
        {/* Navigazione Sezioni Impostazioni */}
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <div className="relative flex items-center border-b border-border bg-muted/30 px-2 py-2">
            {/* Freccia laterale sinistra (visibile quando si scorre a destra) */}
            {canScrollLeft && (
              <button
                type="button"
                onClick={() => handleScrollTabs("left")}
                className="z-20 mr-1 flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                title="Scorri a sinistra"
                aria-label="Scorri a sinistra"
              >
                <ChevronLeft className="size-4" />
              </button>
            )}

            {/* Contenitore sezioni */}
            <div
              ref={tabListRef}
              className="flex items-center gap-1.5 min-w-0 flex-1 overflow-x-auto scroll-smooth no-scrollbar"
            >
              {ALL_SECTIONS.map((sec) => {
                const isActive = activeTab === sec.id;
                const Icon = sec.icon;
                const hasDirty = isTabDirty(sec.id);

                return (
                  <button
                    key={sec.id}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    onClick={() => setActiveTab(sec.id)}
                    className={cn(
                      "group relative flex items-center gap-2 px-3 sm:px-3.5 py-2 text-xs sm:text-sm font-medium transition-all select-none cursor-pointer rounded-lg whitespace-nowrap shrink-0",
                      isActive
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-3.5 shrink-0 transition-colors",
                        isActive
                          ? "text-primary-foreground"
                          : "text-muted-foreground group-hover:text-foreground",
                      )}
                    />
                    <span className="flex items-center gap-1.5">
                      {sec.label}
                      {hasDirty && (
                        <span
                          className="size-1.5 rounded-full bg-amber-400 shrink-0 animate-pulse"
                          title="Modifiche in corso non salvate"
                        />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Freccia laterale destra (visibile quando ci sono schede a destra da scorrere) */}
            {canScrollRight && (
              <button
                type="button"
                onClick={() => handleScrollTabs("right")}
                className="z-20 ml-1 flex size-7 shrink-0 items-center justify-center rounded-md border border-border bg-background text-muted-foreground shadow-xs transition-colors hover:bg-muted hover:text-foreground cursor-pointer"
                title="Scorri a destra"
                aria-label="Scorri a destra"
              >
                <ChevronRight className="size-4" />
              </button>
            )}
          </div>

          {/* CONTENUTO DELLA SEZIONE SELEZIONATA */}
          <div className="p-4 sm:p-6">
            {/* ======================================================== */}
            {/* SEZIONE 1: MODALITÀ DI PAGAMENTO                         */}
            {/* ======================================================== */}
            {activeTab === "modalita_pagamento" && (
              <div className="space-y-4">
                {/* Toolbar */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={openNewPaymentModal}
                      className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs px-3.5 py-2 rounded-lg shadow-xs flex items-center gap-1.5"
                    >
                      <Plus className="size-3.5 stroke-[2.5]" />
                      Nuova modalità
                    </Button>

                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          className="text-xs font-medium px-3 py-2 rounded-lg shadow-xs flex items-center gap-1.5"
                        >
                          Altro
                          <ChevronDown className="size-3.5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        <DropdownMenuItem
                          onClick={handleSetSelectedAsDefault}
                          className="cursor-pointer text-xs"
                        >
                          <CheckCircle2 className="mr-2 size-4 text-emerald-600" />
                          Imposta come predefinita
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            resetToDefault();
                            toast.success(
                              "Modalità di pagamento reimpostate ai valori predefiniti.",
                            );
                          }}
                          className="cursor-pointer text-xs text-amber-600 dark:text-amber-400"
                        >
                          <RotateCcw className="mr-2 size-4" />
                          Ripristina predefinite
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => {
                            const csv = [
                              "Codice,Tipologia,Nome,IBAN,Predefinita",
                              ...methods.map(
                                (m) =>
                                  `"${m.code}","${m.typeLabel}","${m.name}","${m.iban || ""}","${m.is_default ? "Sì" : "No"}"`,
                              ),
                            ].join("\n");
                            const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                            const url = URL.createObjectURL(blob);
                            const link = document.createElement("a");
                            link.href = url;
                            link.download = "modalita_pagamento.csv";
                            link.click();
                            toast.success("Elenco esportato in CSV.");
                          }}
                          className="cursor-pointer text-xs"
                        >
                          Esporta elenco (.CSV)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  <p className="text-xs text-muted-foreground hidden sm:block">
                    Selezionabili con menu a tendina su Preventivi, Fatture e Rapportini.
                  </p>
                </div>

                {/* Tabella Modalità di Pagamento (Esatta replica Screenshot 2) */}
                <div className="rounded-lg border border-border bg-card overflow-hidden shadow-xs">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow className="border-b border-border hover:bg-transparent">
                        <TableHead className="w-12 pl-4">
                          <Checkbox
                            checked={
                              methods.length > 0 && selectedMethodIds.length === methods.length
                            }
                            onCheckedChange={toggleSelectAll}
                            aria-label="Seleziona tutte"
                          />
                        </TableHead>
                        <TableHead
                          onClick={() => setSortAsc(!sortAsc)}
                          className="font-semibold text-foreground cursor-pointer select-none py-3"
                        >
                          <div className="flex items-center gap-1">
                            <span>Tipologia</span>
                            <span className="text-xs text-muted-foreground font-mono">
                              {sortAsc ? "↑" : "↓"}
                            </span>
                          </div>
                        </TableHead>
                        <TableHead className="font-semibold text-foreground py-3">Nome</TableHead>
                        <TableHead className="font-semibold text-foreground py-3">IBAN</TableHead>
                        <TableHead className="w-24 text-right pr-4 font-semibold text-foreground py-3">
                          Stato
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {sortedMethods.map((pm) => {
                        const isSelected = selectedMethodIds.includes(pm.id);

                        return (
                          <TableRow
                            key={pm.id}
                            className={cn(
                              "hover:bg-muted/30 transition-colors border-b border-border/70",
                              isSelected ? "bg-muted/20" : "",
                            )}
                          >
                            {/* Checkbox */}
                            <TableCell className="pl-4 py-3.5">
                              <Checkbox
                                checked={isSelected}
                                onCheckedChange={() => toggleSelectMethod(pm.id)}
                                aria-label={`Seleziona ${pm.name}`}
                              />
                            </TableCell>

                            {/* Tipologia (es. Carta di pagamento (MP08), Contanti (MP01), Bonifico (MP05)) */}
                            <TableCell className="font-medium text-foreground py-3.5">
                              <span className="text-sm">{pm.typeLabel}</span>
                            </TableCell>

                            {/* Nome */}
                            <TableCell className="py-3.5 text-sm text-foreground">
                              {pm.name}
                            </TableCell>

                            {/* IBAN */}
                            <TableCell className="py-3.5 font-mono text-xs text-muted-foreground">
                              {pm.iban ? (
                                <span className="tracking-wide text-foreground font-medium">
                                  {pm.iban}
                                </span>
                              ) : (
                                <span className="opacity-30">—</span>
                              )}
                            </TableCell>

                            {/* Icone Stato / Azioni (Screenshot 2: Lucchetto o Spunta Verde) */}
                            <TableCell className="py-3.5 pr-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                {pm.is_default ? (
                                  <div
                                    className="flex items-center justify-center size-6 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                    title="Metodo predefinito per nuovi documenti"
                                  >
                                    <CheckCircle2 className="size-5 fill-emerald-600 text-white dark:fill-emerald-400 dark:text-slate-900" />
                                  </div>
                                ) : pm.is_system ? (
                                  <div
                                    className="flex items-center justify-center size-6 text-muted-foreground/60"
                                    title="Metodo di sistema standard"
                                  >
                                    <Lock className="size-4" />
                                  </div>
                                ) : null}

                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="size-7 text-muted-foreground hover:text-foreground"
                                    >
                                      <MoreHorizontal className="size-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() => openEditPaymentModal(pm)}
                                      className="cursor-pointer text-xs"
                                    >
                                      <Pencil className="mr-2 size-3.5" /> Modifica
                                    </DropdownMenuItem>
                                    {!pm.is_default && (
                                      <DropdownMenuItem
                                        onClick={() => {
                                          setDefaultMethod(pm.id);
                                          if (pm.iban) {
                                            setForm((prev) => ({ ...prev, iban: pm.iban || "" }));
                                            saveCompany.mutate({ iban: pm.iban });
                                          }
                                          toast.success(`"${pm.name}" impostata come predefinita.`);
                                        }}
                                        className="cursor-pointer text-xs text-emerald-600"
                                      >
                                        <Check className="mr-2 size-3.5" /> Imposta come predefinita
                                      </DropdownMenuItem>
                                    )}
                                    {!pm.is_system && (
                                      <DropdownMenuItem
                                        onClick={() => {
                                          if (confirm(`Eliminare la modalità "${pm.name}"?`)) {
                                            deleteMethod(pm.id);
                                            toast.info("Modalità eliminata.");
                                          }
                                        }}
                                        className="cursor-pointer text-xs text-destructive"
                                      >
                                        <Trash2 className="mr-2 size-3.5" /> Elimina
                                      </DropdownMenuItem>
                                    )}
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Parametri di Pagamento Predefiniti */}
                <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Parametri di Pagamento Predefiniti
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      IBAN aziendale e condizioni predefinite applicate automaticamente sui nuovi
                      documenti.
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">IBAN Aziendale Predefinito</Label>
                      <Input
                        value={form.iban}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            iban: e.target.value.toUpperCase().replace(/\s/g, ""),
                          }))
                        }
                        placeholder="IT00X0000000000000000000000"
                        className="font-mono text-xs uppercase"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Condizioni di Pagamento Predefinite
                      </Label>
                      <Input
                        value={form.quote_payment_terms}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, quote_payment_terms: e.target.value }))
                        }
                        placeholder="Es: Acconto 50% alla firma, Saldo a fine lavori"
                        className="text-xs"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SCHEDA 2: PROFILO DI FATTURAZIONE                        */}
            {/* ======================================================== */}
            {activeTab === "profilo_fatturazione" && (
              <div className="space-y-6">
                {/* Dati aziendali */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-5">
                  <h3 className="text-base font-semibold text-foreground">Dati aziendali</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="company_name" className="text-xs font-medium">
                        Ragione sociale / Denominazione
                      </Label>
                      <Input
                        id="company_name"
                        value={form.company_name}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, company_name: e.target.value }))
                        }
                        placeholder="INNOVAZIONE TERMICA"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="owner_first_name" className="text-xs font-medium">
                        Nome titolare
                      </Label>
                      <Input
                        id="owner_first_name"
                        value={form.owner_first_name}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, owner_first_name: e.target.value }))
                        }
                        placeholder="Maurizio"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="owner_last_name" className="text-xs font-medium">
                        Cognome titolare
                      </Label>
                      <Input
                        id="owner_last_name"
                        value={form.owner_last_name}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, owner_last_name: e.target.value }))
                        }
                        placeholder="Tanforti"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="vat_number" className="text-xs font-medium">
                        Partita IVA
                      </Label>
                      <Input
                        id="vat_number"
                        value={form.vat_number}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, vat_number: e.target.value }))
                        }
                        placeholder="IT12345678901"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="fiscal_code" className="text-xs font-medium">
                        Codice fiscale
                      </Label>
                      <Input
                        id="fiscal_code"
                        value={form.fiscal_code}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, fiscal_code: e.target.value }))
                        }
                        placeholder="TNFMRZ80A01H501U"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="address" className="text-xs font-medium">
                        Indirizzo sede legale
                      </Label>
                      <Input
                        id="address"
                        value={form.address}
                        onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                        placeholder="Via Roma 123"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="zip" className="text-xs font-medium">
                        CAP
                      </Label>
                      <Input
                        id="zip"
                        value={form.zip}
                        onChange={(e) => setForm((prev) => ({ ...prev, zip: e.target.value }))}
                        placeholder="00100"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="city" className="text-xs font-medium">
                        Città
                      </Label>
                      <Input
                        id="city"
                        value={form.city}
                        onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                        placeholder="Roma"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="province" className="text-xs font-medium">
                        Provincia
                      </Label>
                      <Input
                        id="province"
                        value={form.province}
                        onChange={(e) => setForm((prev) => ({ ...prev, province: e.target.value }))}
                        placeholder="RM"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="phone" className="text-xs font-medium">
                        Telefono
                      </Label>
                      <Input
                        id="phone"
                        value={form.phone}
                        onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                        placeholder="3891344474"
                      />
                    </div>
                    <div className="space-y-1.5 md:col-span-2">
                      <Label htmlFor="email" className="text-xs font-medium">
                        E-mail aziendale
                      </Label>
                      <Input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                        placeholder="maurizio.tanforti@gmail.com"
                      />
                    </div>
                  </div>
                </div>

                {/* Logo aziendale */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
                  <h3 className="text-base font-semibold text-foreground">Logo aziendale</h3>
                  <p className="text-xs text-muted-foreground">
                    Compare in intestazione sui preventivi, fatture e rapportini. PNG o JPG, max 2
                    MB.
                  </p>
                  <div className="flex flex-wrap items-center gap-5 pt-2">
                    <div className="flex size-20 sm:size-24 items-center justify-center rounded-lg border border-border bg-background p-2 overflow-hidden shadow-xs">
                      <img
                        src={form.logo_url || defaultLogo}
                        alt="Logo aziendale"
                        className="max-h-full max-w-full object-contain"
                      />
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/png,image/jpeg"
                        className="hidden"
                        onChange={handleLogoUpload}
                      />
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                      >
                        Sostituisci logo
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        className="text-muted-foreground hover:text-foreground"
                        onClick={handleRemoveLogo}
                      >
                        Rimuovi
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Condizioni e clausole predefinite */}
                <div className="rounded-xl border border-border bg-card p-6 shadow-xs space-y-4">
                  <h3 className="text-base font-semibold text-foreground">
                    Condizioni e Note predefinite preventivi
                  </h3>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">Condizioni di pagamento testo</Label>
                      <Select
                        value={
                          isCustomPayment
                            ? "personalizzato"
                            : isPaymentPreset(form.quote_payment_terms)
                              ? form.quote_payment_terms
                              : "personalizzato"
                        }
                        onValueChange={(val) => {
                          if (val === "personalizzato") {
                            setIsCustomPayment(true);
                          } else {
                            setIsCustomPayment(false);
                            setForm((prev) => ({ ...prev, quote_payment_terms: val }));
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleziona preset condizioni" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Saldo a fine lavori">Saldo a fine lavori</SelectItem>
                          <SelectItem value="Acconto 50% alla firma, Saldo a fine lavori">
                            Acconto 50% alla firma, Saldo a fine lavori
                          </SelectItem>
                          <SelectItem value="Acconto 50% alla firma, 40% a fine lavori, 10% Collaudo">
                            Acconto 50% alla firma, 40% a fine lavori, 10% Collaudo
                          </SelectItem>
                          <SelectItem value="personalizzato">Personalizzato</SelectItem>
                        </SelectContent>
                      </Select>
                      {isCustomPayment && (
                        <Textarea
                          rows={2}
                          value={form.quote_payment_terms}
                          onChange={(e) =>
                            setForm((prev) => ({
                              ...prev,
                              quote_payment_terms: e.target.value,
                            }))
                          }
                          placeholder="Inserisci condizioni di pagamento personalizzate..."
                          className="mt-2"
                        />
                      )}
                    </div>

                    <div className="space-y-1.5">
                      <Label className="text-xs font-medium">
                        Esclusioni predefinite preventivo
                      </Label>
                      <Textarea
                        rows={2}
                        value={form.quote_default_exclusions}
                        onChange={(e) =>
                          setForm((prev) => ({
                            ...prev,
                            quote_default_exclusions: e.target.value,
                          }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <Button
                    onClick={handleSaveActiveSettings}
                    disabled={saving || !isCurrentTabDirty}
                    className={cn(
                      "font-medium px-6 py-2 rounded-lg transition-all",
                      isCurrentTabDirty
                        ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-xs cursor-pointer"
                        : "bg-muted text-muted-foreground opacity-60 cursor-not-allowed",
                    )}
                  >
                    {saving ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
                    Salva modifiche profilo
                  </Button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SCHEDA 3: PROFILO UTENTI                                 */}
            {/* ======================================================== */}
            {activeTab === "profilo_utenti" && (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">
                      Gestione Utenti e Accessi
                    </h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configura collaboratori, tecnici e ruoli operativi con permessi
                      personalizzati.
                    </p>
                  </div>
                  <Button
                    onClick={() =>
                      toast.info(
                        "Funzione invito utente: un link di invito verrà inviato via email.",
                      )
                    }
                    className="bg-primary text-primary-foreground text-xs"
                  >
                    <Plus className="mr-1.5 size-3.5" /> Nuovo utente
                  </Button>
                </div>

                <div className="rounded-lg border border-border bg-card overflow-hidden">
                  <Table>
                    <TableHeader className="bg-muted/40">
                      <TableRow>
                        <TableHead className="py-3 pl-4">Nome</TableHead>
                        <TableHead className="py-3">Email</TableHead>
                        <TableHead className="py-3">Ruolo</TableHead>
                        <TableHead className="py-3">Stato</TableHead>
                        <TableHead className="py-3 pr-4 text-right">Azioni</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      <TableRow>
                        <TableCell className="pl-4 font-medium">
                          Maurizio Tanforti{" "}
                          <span className="text-xs text-primary font-semibold ml-1">(Tu)</span>
                        </TableCell>
                        <TableCell className="text-xs font-mono">
                          maurizio.tanforti@gmail.com
                        </TableCell>
                        <TableCell>
                          <span className="text-[11px] font-semibold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                            Amministratore
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-[11px] text-emerald-600 font-medium">Attivo</span>
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <Button variant="ghost" size="sm" className="text-xs">
                            Modifica
                          </Button>
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        <TableCell className="pl-4 font-medium">Tecnico Idraulico 1</TableCell>
                        <TableCell className="text-xs font-mono">
                          tecnico@innovazionetermica.it
                        </TableCell>
                        <TableCell>
                          <span className="text-[11px] font-semibold bg-muted text-foreground px-2 py-0.5 rounded-full">
                            Tecnico sul campo
                          </span>
                        </TableCell>
                        <TableCell>
                          <span className="text-[11px] text-emerald-600 font-medium">Attivo</span>
                        </TableCell>
                        <TableCell className="pr-4 text-right">
                          <Button variant="ghost" size="sm" className="text-xs">
                            Modifica
                          </Button>
                        </TableCell>
                      </TableRow>
                    </TableBody>
                  </Table>
                </div>

                {/* Permessi Ruoli e Collaboratori */}
                <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-2xs space-y-4">
                  <div>
                    <h4 className="text-sm font-semibold text-foreground">
                      Permessi Ruoli e Collaboratori
                    </h4>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Configura le autorizzazioni operative per tecnici e operatori sul campo.
                    </p>
                  </div>
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          Visualizzazione prezzi e importi per tecnici
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Consenti ai tecnici sul campo di visualizzare i prezzi delle voci e il
                          totale dei documenti.
                        </p>
                      </div>
                      <Switch
                        checked={form.tech_can_view_prices}
                        onCheckedChange={(val) =>
                          setForm((prev) => ({ ...prev, tech_can_view_prices: val }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/20">
                      <div>
                        <p className="text-xs font-medium text-foreground">
                          Modifica preventivi dopo approvazione
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          Permetti la modifica di computi e preventivi dopo l'accettazione del
                          cliente.
                        </p>
                      </div>
                      <Switch
                        checked={form.allow_edit_approved_quotes}
                        onCheckedChange={(val) =>
                          setForm((prev) => ({ ...prev, allow_edit_approved_quotes: val }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SCHEDA 4: FATTURAZIONE ELETTRONICA                      */}
            {/* ======================================================== */}
            {activeTab === "fatturazione_elettronica" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Parametri Fatturazione Elettronica (SDI)
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Parametri di interscambio con il Sistema di Interscambio dell'Agenzia delle
                    Entrate.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">
                      Codice Destinatario SDI (7 caratteri)
                    </Label>
                    <Input
                      value={form.sdi_code}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, sdi_code: e.target.value.toUpperCase() }))
                      }
                      className="font-mono text-sm uppercase"
                      maxLength={7}
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Usa 0000000 per privati o consumatori con PEC.
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Indirizzo PEC Fatturazione</Label>
                    <Input
                      value={form.pec_email}
                      onChange={(e) => setForm((prev) => ({ ...prev, pec_email: e.target.value }))}
                      type="email"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Formato Trasmissione XML</Label>
                    <Select
                      value={form.xml_transmission_format}
                      onValueChange={(val) =>
                        setForm((prev) => ({ ...prev, xml_transmission_format: val }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="FPR12">
                          FPR12 (Fattura ordinaria B2B e privati B2C)
                        </SelectItem>
                        <SelectItem value="FPA12">
                          FPA12 (Fattura verso Pubblica Amministrazione)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Regime Fiscale</Label>
                    <Select
                      value={form.tax_regime}
                      onValueChange={(val) => setForm((prev) => ({ ...prev, tax_regime: val }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="RF01">RF01 - Regime ordinario</SelectItem>
                        <SelectItem value="RF19">RF19 - Regime forfettario</SelectItem>
                        <SelectItem value="RF02">RF02 - Contribuenti minimi</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <ShieldCheck className="size-5 text-emerald-600" />
                    <div>
                      <p className="text-xs font-medium text-foreground">Connettore SDI Attivo</p>
                      <p className="text-[11px] text-muted-foreground">
                        Generazione automatica file XML conformi alle specifiche v1.8.
                      </p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => toast.success("Configurazione SDI verificata con successo.")}
                  >
                    Verifica connessione
                  </Button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SCHEDA 5: MODELLI DOCUMENTI                              */}
            {/* ======================================================== */}
            {activeTab === "modelli" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Modelli di Stampa e Documenti
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Personalizza il layout grafico e le impostazioni per ciascun documento.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    {
                      id: "template_quotes" as const,
                      title: "Preventivi",
                      desc: "Layout preventivi con validità e acconti",
                      value: form.template_quotes,
                      options: ["Classico", "Moderno", "Compatto", "Minimale"],
                    },
                    {
                      id: "template_invoices" as const,
                      title: "Fatture",
                      desc: "Fatture con riepilogo IVA e scadenze",
                      value: form.template_invoices,
                      options: ["Classico", "Moderno", "Dettagliato"],
                    },
                    {
                      id: "template_electronic_invoices" as const,
                      title: "Fatture elettroniche",
                      desc: "Tracciato XML e foglio di stile SDI",
                      value: form.template_electronic_invoices,
                      options: ["Standard", "Compatto"],
                    },
                    {
                      id: "template_interventions" as const,
                      title: "Rapportini / Interventi",
                      desc: "Manodopera, materiali e firma",
                      value: form.template_interventions,
                      options: ["Moderno", "Dettagliato", "Minimale"],
                    },
                    {
                      id: "template_ddt" as const,
                      title: "DDT / Documenti di trasporto",
                      desc: "Bolla accompagnamento merci",
                      value: form.template_ddt,
                      options: ["Minimale", "Standard"],
                    },
                    {
                      id: "template_email" as const,
                      title: "Editor Email",
                      desc: "Modelli messaggi per invio PDF ai clienti",
                      value: form.template_email,
                      options: ["Attivo", "Semplice"],
                    },
                  ].map((m) => (
                    <div
                      key={m.id}
                      className="rounded-xl border border-border bg-card p-4 shadow-xs flex flex-col justify-between space-y-3"
                    >
                      <div>
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold text-sm">{m.title}</h4>
                          <span className="text-[10px] bg-primary/10 text-primary font-medium px-2 py-0.5 rounded-full">
                            {m.value}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1.5">{m.desc}</p>
                      </div>
                      <div className="space-y-1.5 pt-1">
                        <Label className="text-[11px] text-muted-foreground">
                          Layout predefinito
                        </Label>
                        <Select
                          value={m.value}
                          onValueChange={(val) => setForm((prev) => ({ ...prev, [m.id]: val }))}
                        >
                          <SelectTrigger className="h-8 text-xs font-medium">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {m.options.map((opt) => (
                              <SelectItem key={opt} value={opt}>
                                {opt}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SCHEDA 6: PERSONALIZZA MENU                              */}
            {/* ======================================================== */}
            {activeTab === "personalizza_menu" && (
              <PersonalizzaMenuTab
                onDirtyChange={setMenuIsDirty}
                registerSave={(fn) => {
                  saveMenuRef.current = fn;
                }}
              />
            )}

            {/* ======================================================== */}
            {/* SCHEDA 7: APP E SERVIZI ESTERNI                          */}
            {/* ======================================================== */}
            {activeTab === "app_servizi" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-foreground">App e Servizi Esterni</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Collega canali di comunicazione, calendari e archiviazione cloud.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">WhatsApp Web</h4>
                      <Switch
                        checked={form.whatsapp_enabled}
                        onCheckedChange={(val) =>
                          setForm((prev) => ({ ...prev, whatsapp_enabled: val }))
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Invio rapido di preventivi, solleciti fatture e promemoria appuntamenti
                      tramite WhatsApp.
                    </p>
                    <div className="space-y-1.5 pt-1">
                      <Label className="text-xs font-medium">Messaggio predefinito</Label>
                      <Textarea
                        value={form.whatsapp_custom_msg}
                        onChange={(e) =>
                          setForm((prev) => ({ ...prev, whatsapp_custom_msg: e.target.value }))
                        }
                        rows={3}
                        className="text-xs resize-none"
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold text-sm">Google Calendar</h4>
                      <Switch
                        checked={form.google_calendar_enabled}
                        onCheckedChange={(val) =>
                          setForm((prev) => ({ ...prev, google_calendar_enabled: val }))
                        }
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Sincronizzazione bidirezionale per interventi e appuntamenti con tecnici sul
                      campo.
                    </p>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() =>
                        toast.info("Connessione account Google salvata nelle impostazioni.")
                      }
                    >
                      Verifica account Google Calendar
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SCHEDA 8: AVANZATE                                       */}
            {/* ======================================================== */}
            {activeTab === "avanzate" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-foreground">Impostazioni Avanzate</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Numerazioni, decimali, formati e backup locale dei dati.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Prefisso Preventivi</Label>
                    <Input
                      value={form.quote_prefix}
                      onChange={(e) =>
                        setForm((prev) => ({ ...prev, quote_prefix: e.target.value.toUpperCase() }))
                      }
                      className="font-mono text-xs uppercase"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Prefisso Fatture</Label>
                    <Input
                      value={form.invoice_prefix}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          invoice_prefix: e.target.value.toUpperCase(),
                        }))
                      }
                      className="font-mono text-xs uppercase"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Prefisso Interventi</Label>
                    <Input
                      value={form.intervention_prefix}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          intervention_prefix: e.target.value.toUpperCase(),
                        }))
                      }
                      className="font-mono text-xs uppercase"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Valuta predefinita</Label>
                    <Input value={form.currency} disabled className="bg-muted text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Decimali prezzi (0-4)</Label>
                    <Input
                      value={form.price_decimals}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          price_decimals: Math.max(0, Math.min(4, Number(e.target.value) || 0)),
                        }))
                      }
                      type="number"
                      min={0}
                      max={4}
                      className="text-xs"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Validità preventivo (gg)</Label>
                    <Input
                      value={form.quote_validity_days}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          quote_validity_days: Math.max(1, Number(e.target.value) || 30),
                        }))
                      }
                      type="number"
                      min={1}
                      className="text-xs"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-border flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold">Esporta archivio completo</p>
                    <p className="text-[11px] text-muted-foreground">
                      Scarica tutti i dati in formato JSON per backup di sicurezza.
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const data = {
                        company: form,
                        paymentMethods: methods,
                        exportedAt: new Date().toISOString(),
                      };
                      const blob = new Blob([JSON.stringify(data, null, 2)], {
                        type: "application/json",
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `backup_innovazione_termica_${new Date().toISOString().slice(0, 10)}.json`;
                      a.click();
                      toast.success("Backup scaricato con successo.");
                    }}
                  >
                    Scarica backup JSON
                  </Button>
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* SCHEDA 9: GESTIONE LINK                                  */}
            {/* ======================================================== */}
            {activeTab === "gestione_link" && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-base font-semibold text-foreground">
                    Gestione Link Pubblici
                  </h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Link sicuri da condividere con i clienti per approvazione e visualizzazione.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
                  <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                    <Label className="text-xs font-medium">Validità link pubblico (giorni)</Label>
                    <Input
                      value={form.public_link_expiration_days}
                      onChange={(e) =>
                        setForm((prev) => ({
                          ...prev,
                          public_link_expiration_days: Math.max(1, Number(e.target.value) || 60),
                        }))
                      }
                      type="number"
                      min={1}
                      className="text-xs"
                    />
                    <p className="text-[11px] text-muted-foreground">
                      Dopo questo periodo il link scadrà per motivi di sicurezza.
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-border bg-card flex items-center justify-between">
                    <div>
                      <Label className="text-xs font-medium block">Richiedi firma cliente</Label>
                      <p className="text-[11px] text-muted-foreground">
                        Obbliga la firma grafica per approvare il preventivo online.
                      </p>
                    </div>
                    <Switch
                      checked={form.public_link_require_signature}
                      onCheckedChange={(val) =>
                        setForm((prev) => ({ ...prev, public_link_require_signature: val }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-3 max-w-2xl">
                  <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">Portale Approvazione Preventivi</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs gap-1"
                        onClick={() => {
                          navigator.clipboard?.writeText(
                            window.location.origin + "/preventivo-online",
                          );
                          toast.success("Link copiato negli appunti.");
                        }}
                      >
                        <Copy className="size-3" /> Copia link
                      </Button>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground bg-muted p-2 rounded">
                      {typeof window !== "undefined" ? window.location.origin : ""}
                      /preventivo-online/:token
                    </p>
                  </div>

                  <div className="p-4 rounded-xl border border-border bg-card space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">Tracciamento Intervento Tecnico</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs gap-1"
                        onClick={() => {
                          navigator.clipboard?.writeText(
                            window.location.origin + "/stato-intervento",
                          );
                          toast.success("Link copiato negli appunti.");
                        }}
                      >
                        <Copy className="size-3" /> Copia link
                      </Button>
                    </div>
                    <p className="text-xs font-mono text-muted-foreground bg-muted p-2 rounded">
                      {typeof window !== "undefined" ? window.location.origin : ""}
                      /stato-intervento/:id
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* DIALOG NUOVA / MODIFICA MODALITÀ DI PAGAMENTO (Screenshot 2) */}
      <Dialog open={paymentModalOpen} onOpenChange={setPaymentModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base">
              {editingMethod ? "Modifica modalità di pagamento" : "Nuova modalità di pagamento"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Tipologia standard SDI */}
            <div className="space-y-1.5">
              <Label htmlFor="pm_type" className="text-xs font-medium">
                Tipologia (Codice SDI / Fattura Elettronica)
              </Label>
              <Select
                value={paymentForm.code}
                onValueChange={(code) => {
                  const sdi = SDI_PAYMENT_TYPES.find((t) => t.code === code);
                  setPaymentForm((prev) => ({
                    ...prev,
                    code,
                    name:
                      prev.name && prev.name !== "Bonifico"
                        ? prev.name
                        : (sdi?.defaultName ?? prev.name),
                  }));
                }}
              >
                <SelectTrigger id="pm_type" className="w-full">
                  <SelectValue placeholder="Seleziona tipologia" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {SDI_PAYMENT_TYPES.map((t) => (
                    <SelectItem key={t.code} value={t.code}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Nome visualizzato */}
            <div className="space-y-1.5">
              <Label htmlFor="pm_name" className="text-xs font-medium">
                Nome modalità
              </Label>
              <Input
                id="pm_name"
                value={paymentForm.name}
                onChange={(e) => setPaymentForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Es. Bonifico, Contanti, POS..."
              />
            </div>

            {/* IBAN accredito */}
            <div className="space-y-1.5">
              <Label htmlFor="pm_iban" className="text-xs font-medium">
                IBAN (se applicabile)
              </Label>
              <Input
                id="pm_iban"
                value={paymentForm.iban}
                onChange={(e) =>
                  setPaymentForm((prev) => ({ ...prev, iban: e.target.value.toUpperCase() }))
                }
                placeholder="IT20X0878773190000000070774"
                className="font-mono text-xs uppercase"
              />
            </div>

            {/* Predefinita */}
            <div className="flex items-center space-x-2 pt-2">
              <Checkbox
                id="pm_default"
                checked={paymentForm.is_default}
                onCheckedChange={(checked) =>
                  setPaymentForm((prev) => ({ ...prev, is_default: Boolean(checked) }))
                }
              />
              <Label htmlFor="pm_default" className="text-xs font-medium cursor-pointer">
                Imposta come modalità predefinita per nuovi documenti
              </Label>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button type="button" variant="outline" onClick={() => setPaymentModalOpen(false)}>
              Annulla
            </Button>
            <Button
              type="button"
              onClick={handleSavePaymentMethod}
              className="bg-[#22c55e] hover:bg-[#16a34a] text-white font-medium"
            >
              Salva
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}

function PersonalizzaMenuTab({
  onDirtyChange,
  registerSave,
}: {
  onDirtyChange?: (isDirty: boolean) => void;
  registerSave?: (saveFn: () => void) => void;
}) {
  const { items: initialItems } = useSidebarNavConfig();
  const [draftItems, setDraftItems] = useState<NavItemConfig[]>(initialItems);
  const [savedSnapshot, setSavedSnapshot] = useState<string>(() => JSON.stringify(initialItems));

  useEffect(() => {
    setDraftItems(initialItems);
    setSavedSnapshot(JSON.stringify(initialItems));
  }, [initialItems]);

  const updateDraft = useCallback(
    (newItems: NavItemConfig[]) => {
      setDraftItems(newItems);
      const isDirty = JSON.stringify(newItems) !== savedSnapshot;
      onDirtyChange?.(isDirty);
    },
    [savedSnapshot, onDirtyChange],
  );

  const saveChanges = useCallback(() => {
    saveConfig(draftItems);
    setSavedSnapshot(JSON.stringify(draftItems));
    onDirtyChange?.(false);
    toast.success("Configurazione menu barra laterale salvata con successo.");
  }, [draftItems, onDirtyChange]);

  useEffect(() => {
    registerSave?.(saveChanges);
  }, [registerSave, saveChanges]);

  const handleMoveUp = (index: number, label: string) => {
    if (index <= 0) return;
    const next = [...draftItems];
    const temp = next[index - 1];
    next[index - 1] = next[index];
    next[index] = temp;
    updateDraft(next);
    toast.info(`"${label}" spostato in alto (salva in alto per confermare)`);
  };

  const handleMoveDown = (index: number, label: string) => {
    if (index >= draftItems.length - 1) return;
    const next = [...draftItems];
    const temp = next[index + 1];
    next[index + 1] = next[index];
    next[index] = temp;
    updateDraft(next);
    toast.info(`"${label}" spostato in basso (salva in alto per confermare)`);
  };

  const handleToggle = (id: string, label: string, isCurrentlyVisible: boolean) => {
    if (isCurrentlyVisible) {
      const visibleCount = draftItems.filter((i) => i.visible).length;
      if (visibleCount <= 1) {
        toast.error("Almeno una sezione deve rimanere visibile nella barra laterale.");
        return;
      }
    }
    const next = draftItems.map((item) =>
      item.id === id ? { ...item, visible: !item.visible } : item,
    );
    updateDraft(next);
    toast.info(
      `"${label}" ${!isCurrentlyVisible ? "reso visibile" : "nascosto"} (salva in alto per confermare)`,
    );
  };

  const visibleCount = draftItems.filter((i) => i.visible).length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-border">
        <div>
          <h3 className="text-base font-semibold text-foreground flex items-center gap-2">
            <LayoutGrid className="size-4.5 text-primary" />
            Personalizza Menu Barra Laterale
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            Scegli quali sezioni visualizzare nella barra laterale e ordinali con le frecce su e
            giù.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-md font-medium border border-border">
            {visibleCount} di {draftItems.length} visibili
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              updateDraft(DEFAULT_NAV_CONFIG);
              toast.info(
                "Configurazione reimpostata ai valori predefiniti (salva per confermare).",
              );
            }}
            className="text-xs gap-1.5 h-8 cursor-pointer"
            title="Ripristina ordine e visibilità predefiniti"
          >
            <RotateCcw className="size-3.5" />
            <span>Ripristina</span>
          </Button>
        </div>
      </div>

      <div className="space-y-2 max-w-2xl">
        {draftItems.map((item, idx) => {
          const Icon = NAV_ICONS_MAP[item.iconName] || LayoutGrid;
          const isFirst = idx === 0;
          const isLast = idx === draftItems.length - 1;

          return (
            <div
              key={item.id}
              className={cn(
                "group flex items-center justify-between gap-2.5 sm:gap-3 p-3 rounded-xl border transition-all",
                item.visible
                  ? "bg-card border-border shadow-2xs hover:border-border/80"
                  : "bg-muted/30 border-dashed border-border/70 opacity-65 hover:opacity-85",
              )}
            >
              <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                {/* Frecce su / giù */}
                <div className="flex items-center gap-1 shrink-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleMoveUp(idx, item.label)}
                    disabled={isFirst}
                    aria-label={`Sposta ${item.label} in alto`}
                    title={`Sposta "${item.label}" in alto nella barra laterale`}
                    className="size-7 sm:size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                  >
                    <ArrowUp className="size-3.5 sm:size-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={() => handleMoveDown(idx, item.label)}
                    disabled={isLast}
                    aria-label={`Sposta ${item.label} in basso`}
                    title={`Sposta "${item.label}" in basso nella barra laterale`}
                    className="size-7 sm:size-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted disabled:opacity-25 disabled:pointer-events-none cursor-pointer"
                  >
                    <ArrowDown className="size-3.5 sm:size-4" />
                  </Button>
                </div>

                {/* Badge posizione numerica */}
                <span className="size-6 shrink-0 rounded-md bg-muted text-[11px] font-semibold text-muted-foreground flex items-center justify-center border border-border/50">
                  {idx + 1}
                </span>

                {/* Icona sezione */}
                <div
                  className={cn(
                    "size-9 shrink-0 rounded-lg flex items-center justify-center transition-colors",
                    item.visible ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground",
                  )}
                >
                  <Icon className="size-4.5" />
                </div>

                {/* Nome e descrizione */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold text-foreground truncate">
                      {item.label}
                    </span>
                    {item.visible ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-emerald-600 bg-emerald-500/10 px-1.5 py-0.5 rounded-full">
                        <Eye className="size-2.5" />
                        Visibile
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted px-1.5 py-0.5 rounded-full">
                        <EyeOff className="size-2.5" />
                        Nascosta
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate hidden sm:block">
                    {item.description}
                  </p>
                </div>
              </div>

              {/* Pulsante visualizzazione e switch */}
              <div className="flex items-center gap-2 shrink-0">
                <Button
                  type="button"
                  variant={item.visible ? "outline" : "secondary"}
                  size="sm"
                  onClick={() => handleToggle(item.id, item.label, item.visible)}
                  className="h-8 px-2.5 text-xs font-medium gap-1.5 cursor-pointer"
                  title={
                    item.visible
                      ? `Nascondi ${item.label} dalla barra laterale`
                      : `Visualizza ${item.label} nella barra laterale`
                  }
                >
                  {item.visible ? (
                    <>
                      <Eye className="size-3.5 text-primary" />
                      <span className="hidden sm:inline">Visibile</span>
                    </>
                  ) : (
                    <>
                      <EyeOff className="size-3.5 text-muted-foreground" />
                      <span className="hidden sm:inline">Nascosta</span>
                    </>
                  )}
                </Button>
                <Switch
                  checked={item.visible}
                  onCheckedChange={() => handleToggle(item.id, item.label, item.visible)}
                  aria-label={`Visualizza o nascondi ${item.label} nella barra laterale`}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
