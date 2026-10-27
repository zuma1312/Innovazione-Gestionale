import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  DollarSign,
  Download,
  Eye,
  FileText,
  FilterX,
  Pencil,
  Plus,
  Receipt,
  Search,
  Settings,
  SlidersHorizontal,
  Trash2,
  X,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AppLayout } from "@/components/AppLayout";
import { KPISummaryCard } from "@/components/KPISummaryCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
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
import type { DocFormValue } from "@/components/DocumentEditor";
import { DocPreviewModal, type DocPreviewData } from "@/components/DocPreviewModal";
import {
  FatturaQuickCreateModal,
  type FatturaQuickInitialData,
} from "@/components/fatture/FatturaQuickCreateModal";
import { FatturaInlineEditor } from "@/components/fatture/FatturaInlineEditor";
import { DEFAULT_COMPANY, useCompany, useList, useRemove, useSave } from "@/hooks/data";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { docTotals, emptyItem, formatCurrency, formatDate, nextNumber } from "@/lib/doc";
import type { DocTemplate } from "@/lib/doc";

export const Route = createFileRoute("/_authenticated/fatture")({
  head: () => ({
    meta: [
      { title: "Fatture — Azienda Demo Srl" },
      {
        name: "description",
        content: "Emissione e gestione fatture con PDF, tracciamento incassi e scadenze.",
      },
      { property: "og:title", content: "Fatture — Azienda Demo Srl" },
      {
        property: "og:description",
        content: "Fatture elettroniche e cartacee con riepilogo incassi e PDF in tempo reale.",
      },
    ],
  }),
  component: FatturePage,
});

const STATUSES = ["emessa", "inviata", "pagata", "insoluta"] as const;

function WhatsAppIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c-.001 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.711 1.456h.005c6.554 0 11.89-5.336 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function FatturePage() {
  const invoices = useList<any>("invoices");
  const clients = useList<any>("clients");
  const company = useCompany();
  const { defaultMethod } = usePaymentMethods();
  const save = useSave("invoices");
  const remove = useRemove("invoices");

  // Fattura correntemente in compilazione diretta inline (senza modale esterna)
  const [editingInvoice, setEditingInvoice] = useState<DocFormValue | null>(null);

  // Scheda apertura rapida con poche informazioni
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  // Selezione multipla
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<DocPreviewData | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Filtri
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [amountFilter, setAmountFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  const today = useMemo(() => new Date(), []);

  const prefix = company.data?.invoice_prefix || "FT";
  const defaultNotes = company.data?.invoice_default_notes || "";

  // Apertura scheda rapida
  const handleOpenQuickCreate = () => {
    setQuickCreateOpen(true);
  };

  // Conferma scheda rapida: crea la fattura e la apre direttamente nella sezione
  const handleQuickCreateConfirm = async (data: FatturaQuickInitialData) => {
    setQuickCreateOpen(false);
    const existingNumbers = (invoices.data ?? []).map((i: any) => i.number);
    const number = nextNumber(prefix, existingNumbers);

    const newInvoice: DocFormValue = {
      client_id: data.client_id,
      number,
      date: data.date,
      secondary_date: data.due_date,
      items: [emptyItem(company.data?.default_unit_of_measure || "pz")],
      vat_rate: Number(company.data?.default_vat_rate || 22),
      notes: defaultNotes,
      status: "emessa",
      template: (company.data?.default_template as DocTemplate) || "classico",
      title: data.title,
      cantiere: data.cantiere,
      payment_method_id: defaultMethod?.id,
      payment_method: defaultMethod?.typeLabel,
      payment_iban: defaultMethod?.iban ?? "",
    };

    try {
      const res = await save.mutateAsync({
        client_id: newInvoice.client_id,
        number: newInvoice.number,
        date: newInvoice.date,
        due_date: newInvoice.secondary_date,
        items: newInvoice.items,
        vat_rate: newInvoice.vat_rate,
        notes: newInvoice.notes,
        status: newInvoice.status,
        template: newInvoice.template,
        title: newInvoice.title,
        cantiere: newInvoice.cantiere,
        payment_method_id: newInvoice.payment_method_id,
        payment_method: newInvoice.payment_method,
        payment_iban: newInvoice.payment_iban,
        total: 0,
      });

      setEditingInvoice({
        ...newInvoice,
        id: (res as any)?.id,
      });
      toast.success(`Fattura ${number} creata. Ora puoi compilarla direttamente qui.`);
    } catch {
      toast.error("Errore durante la creazione della fattura.");
    }
  };

  // Salvataggio della fattura compilata inline
  const handleSaveInvoice = async (val: DocFormValue) => {
    try {
      const tot = docTotals(val.items, val.vat_rate).total;
      await save.mutateAsync({
        id: val.id,
        client_id: val.client_id,
        number: val.number,
        date: val.date,
        due_date: val.secondary_date,
        items: val.items,
        vat_rate: val.vat_rate,
        notes: val.notes,
        exclusions: val.exclusions,
        payment_conditions: val.payment_conditions,
        status: val.status,
        template: val.template,
        title: val.title,
        body: val.body,
        cantiere: val.cantiere,
        payment_method_id: val.payment_method_id,
        payment_method: val.payment_method,
        payment_iban: val.payment_iban,
        total: tot,
      });
      toast.success(`Fattura ${val.number} salvata con successo.`);
    } catch {
      toast.error("Errore durante il salvataggio della fattura.");
    }
  };

  // Apertura di una fattura esistente per modifica inline
  const handleOpenEditInline = (inv: any) => {
    setEditingInvoice({
      id: inv.id,
      client_id: inv.client_id,
      number: inv.number,
      date: inv.date,
      secondary_date: inv.due_date,
      items: (inv.items && inv.items.length > 0
        ? inv.items
        : [emptyItem(company.data?.default_unit_of_measure || "pz")]) as any,
      vat_rate: Number(inv.vat_rate ?? company.data?.default_vat_rate ?? 22),
      notes: inv.notes || "",
      exclusions: inv.exclusions || "",
      payment_conditions: inv.payment_conditions || "",
      status: inv.status || "emessa",
      template: (inv.template as DocTemplate) || "classico",
      title: inv.title || "",
      body: inv.body || "",
      cantiere: inv.cantiere || "",
      payment_method_id: inv.payment_method_id,
      payment_method: inv.payment_method,
      payment_iban: inv.payment_iban,
    });
  };

  // Duplicazione di una fattura
  const handleDuplicate = async (inv: any) => {
    const existingNumbers = (invoices.data ?? []).map((item: any) => item.number);
    const newNumber = nextNumber(prefix, existingNumbers);

    const duplicatedInvoice: DocFormValue = {
      client_id: inv.client_id,
      number: newNumber,
      date: todayStr,
      secondary_date: inv.due_date || null,
      items: (inv.items ?? []).map((i: any) => ({ ...i })),
      vat_rate: Number(inv.vat_rate || 22),
      notes: inv.notes || "",
      exclusions: inv.exclusions || "",
      payment_conditions: inv.payment_conditions || "",
      status: "emessa",
      template: (inv.template as DocTemplate) || "classico",
      title: inv.title ? `${inv.title} (Copia)` : "",
      body: inv.body || "",
      cantiere: inv.cantiere || "",
      payment_method_id: inv.payment_method_id || defaultMethod?.id,
      payment_method: inv.payment_method || defaultMethod?.typeLabel,
      payment_iban: inv.payment_iban ?? defaultMethod?.iban ?? "",
    };

    try {
      const res = await save.mutateAsync({
        client_id: duplicatedInvoice.client_id,
        number: duplicatedInvoice.number,
        date: duplicatedInvoice.date,
        due_date: duplicatedInvoice.secondary_date,
        items: duplicatedInvoice.items,
        vat_rate: duplicatedInvoice.vat_rate,
        notes: duplicatedInvoice.notes,
        exclusions: duplicatedInvoice.exclusions,
        payment_conditions: duplicatedInvoice.payment_conditions,
        status: duplicatedInvoice.status,
        template: duplicatedInvoice.template,
        title: duplicatedInvoice.title,
        body: duplicatedInvoice.body,
        cantiere: duplicatedInvoice.cantiere,
        payment_method_id: duplicatedInvoice.payment_method_id,
        payment_method: duplicatedInvoice.payment_method,
        payment_iban: duplicatedInvoice.payment_iban,
        total: docTotals(duplicatedInvoice.items, duplicatedInvoice.vat_rate).total,
      });

      setEditingInvoice({
        ...duplicatedInvoice,
        id: (res as any)?.id,
      });
      toast.success(`Fattura duplicata con numero ${newNumber}.`);
    } catch {
      toast.error("Errore durante la duplicazione della fattura.");
    }
  };

  // Anteprima PDF
  const handleOpenPreview = (inv: any) => {
    const client = (clients.data ?? []).find((c: any) => c.id === inv.client_id);
    setPreviewData({
      docLabel: "Fattura",
      number: inv.number,
      date: inv.date,
      secondaryDateLabel: "Scadenza pagamento",
      secondaryDate: inv.due_date || inv.secondary_date,
      template: (inv.template as DocTemplate) || "classico",
      clientName: client?.name ?? "Cliente",
      clientLines: [
        client?.address ?? "",
        [client?.zip, client?.city].filter(Boolean).join(" "),
        client?.vat_number ? `P.IVA/CF ${client.vat_number}` : "",
        client?.email ?? "",
      ],
      items: (inv.items ?? []) as any,
      vatRate: Number(inv.vat_rate || 22),
      notes: inv.notes,
      exclusions: inv.exclusions,
      paymentConditions: inv.payment_conditions,
      bodyText: inv.body,
      title: inv.title,
      cantiere: inv.cantiere,
      paymentMethod: inv.payment_method || defaultMethod?.typeLabel,
      paymentIban: inv.payment_iban ?? defaultMethod?.iban ?? "",
    });
    setPreviewOpen(true);
  };

  const handleOpenPreviewFromInline = (val: DocFormValue) => {
    const client = (clients.data ?? []).find((c: any) => c.id === val.client_id);
    setPreviewData({
      docLabel: "Fattura",
      number: val.number,
      date: val.date,
      secondaryDateLabel: "Scadenza pagamento",
      secondaryDate: val.secondary_date,
      template: val.template,
      clientName: client?.name ?? "Cliente",
      clientLines: [
        client?.address ?? "",
        [client?.zip, client?.city].filter(Boolean).join(" "),
        client?.vat_number ? `P.IVA/CF ${client.vat_number}` : "",
        client?.email ?? "",
      ],
      items: val.items,
      vatRate: val.vat_rate,
      notes: val.notes,
      exclusions: val.exclusions,
      paymentConditions: val.payment_conditions,
      bodyText: val.body,
      title: val.title,
      cantiere: val.cantiere,
      paymentMethod: val.payment_method,
      paymentIban: val.payment_iban,
    });
    setPreviewOpen(true);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Sei sicuro di voler eliminare ${selectedIds.length} fatture selezionate?`))
      return;
    try {
      for (const id of selectedIds) {
        await remove.mutateAsync(id);
      }
      setSelectedIds([]);
      toast.success("Fatture eliminate con successo.");
    } catch {
      toast.error("Errore durante l'eliminazione delle fatture.");
    }
  };

  const handleDuplicateSingleSelected = () => {
    if (selectedIds.length !== 1) return;
    const inv = (invoices.data ?? []).find((item: any) => item.id === selectedIds[0]);
    if (inv) handleDuplicate(inv);
  };

  const handleExportCsv = () => {
    const rowsToExport =
      selectedIds.length > 0
        ? filteredRows.filter((r: any) => selectedIds.includes(r.id))
        : filteredRows;
    const csv = [
      "Numero,Data,Scadenza,Cliente,Totale,Stato",
      ...rowsToExport.map((row: any) => {
        const client = allClients.find((c: any) => c.id === row.client_id);
        return `"${row.number}","${row.date}","${row.due_date || ""}","${client?.name || ""}","${row.total}","${row.status}"`;
      }),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "fatture.csv";
    link.click();
    toast.success("Elenco fatture esportato.");
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredRows.length && filteredRows.length > 0) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredRows.map((r: any) => r.id));
    }
  };

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleQuickStatusChange = async (inv: any, newStatus: string) => {
    try {
      await save.mutateAsync({
        id: inv.id,
        status: newStatus,
      });
      toast.success(`Stato fattura aggiornato a "${newStatus}".`);
    } catch {
      toast.error("Impossibile aggiornare lo stato.");
    }
  };

  const openWhatsApp = (phone?: string, clientName?: string, inv?: any) => {
    if (!phone) {
      toast.error("Nessun numero di telefono per questo cliente.");
      return;
    }

    let clean = phone.replace(/\D/g, "");
    if (clean.length === 10 && clean.startsWith("3")) {
      clean = `39${clean}`;
    }

    const totalFmt = formatCurrency(Number(inv?.total || 0));
    const msg = `Gentile ${clientName || ""}, le trasmettiamo il riepilogo della Fattura N. ${inv?.number || ""} di ${totalFmt} da parte di Azienda Demo Srl. Restiamo a disposizione per qualsiasi chiarimento.`;

    const url = `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const allInvoices = useMemo(() => invoices.data ?? [], [invoices.data]);
  const allClients = useMemo(() => clients.data ?? [], [clients.data]);

  // Indicatori rapidi (KPI)
  const stats = useMemo(() => {
    let totalInvoiced = 0;
    let totalPaid = 0;
    let totalPending = 0;
    let totalOverdue = 0;

    let countPaid = 0;
    let countPending = 0;
    let countOverdue = 0;

    for (const inv of allInvoices) {
      const tot = Number(inv.total || 0);
      totalInvoiced += tot;

      if (inv.status === "pagata") {
        totalPaid += tot;
        countPaid++;
      } else if (inv.status === "insoluta") {
        totalOverdue += tot;
        countOverdue++;
      } else {
        totalPending += tot;
        countPending++;
      }
    }

    return {
      totalInvoiced,
      totalPaid,
      totalPending,
      totalOverdue,
      allCount: allInvoices.length,
      countPaid,
      countPending,
      countOverdue,
    };
  }, [allInvoices]);

  // Filtraggio avanzato
  const filteredRows = useMemo(() => {
    return allInvoices.filter((inv: any) => {
      const q = search.toLowerCase();
      const client = allClients.find((c: any) => c.id === inv.client_id);
      const clientName = (client?.name || "").toLowerCase();
      const num = (inv.number || "").toLowerCase();
      const title = (inv.title || "").toLowerCase();

      if (search && !clientName.includes(q) && !num.includes(q) && !title.includes(q)) {
        return false;
      }

      if (statusFilter !== "all" && inv.status !== statusFilter) {
        return false;
      }

      if (clientFilter !== "all" && inv.client_id !== clientFilter) {
        return false;
      }

      if (amountFilter !== "all") {
        const val = Number(inv.total || 0);
        if (amountFilter === "under_500" && val >= 500) return false;
        if (amountFilter === "500_2000" && (val < 500 || val > 2000)) return false;
        if (amountFilter === "over_2000" && val <= 2000) return false;
      }

      if (periodFilter !== "all" && inv.date) {
        const d = new Date(inv.date);
        const diffDays = (today.getTime() - d.getTime()) / (1000 * 3600 * 24);

        if (periodFilter === "month" && diffDays > 30) return false;
        if (periodFilter === "quarter" && diffDays > 90) return false;
        if (periodFilter === "year") {
          const invYear = d.getFullYear();
          if (invYear !== today.getFullYear()) return false;
        }
      }

      return true;
    });
  }, [
    allInvoices,
    allClients,
    search,
    statusFilter,
    clientFilter,
    amountFilter,
    periodFilter,
    today,
  ]);

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    periodFilter !== "all" ||
    clientFilter !== "all" ||
    amountFilter !== "all";

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) +
    (periodFilter !== "all" ? 1 : 0) +
    (clientFilter !== "all" ? 1 : 0) +
    (amountFilter !== "all" ? 1 : 0);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPeriodFilter("all");
    setClientFilter("all");
    setAmountFilter("all");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pagata":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="size-3" /> Pagata
          </span>
        );
      case "emessa":
      case "inviata":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
            <Clock className="size-3" /> {status === "inviata" ? "Inviata" : "Emessa"}
          </span>
        );
      case "insoluta":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
            <XCircle className="size-3" /> Insoluta
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-muted text-muted-foreground border border-border">
            Bozza
          </span>
        );
    }
  };

  // Se è in corso la compilazione di una fattura, mostriamo l'editor direttamente nella sezione!
  if (editingInvoice) {
    const editingClient = allClients.find((c: any) => c.id === editingInvoice.client_id);
    return (
      <AppLayout
        title={`Fattura ${editingInvoice.number}`}
        description={`Compilazione diretta fattura per ${editingClient?.name || "cliente"}`}
      >
        <FatturaInlineEditor
          value={editingInvoice}
          onChange={setEditingInvoice}
          onSave={() => handleSaveInvoice(editingInvoice)}
          onBack={() => setEditingInvoice(null)}
          company={company.data ?? DEFAULT_COMPANY}
          clients={allClients}
          saving={save.isPending}
          onDuplicate={() => handleDuplicate(editingInvoice)}
          onDelete={async () => {
            if (editingInvoice.id && confirm(`Eliminare la fattura ${editingInvoice.number}?`)) {
              await remove.mutateAsync(editingInvoice.id);
              setEditingInvoice(null);
              toast.success("Fattura eliminata.");
            }
          }}
          onOpenPreviewModal={handleOpenPreviewFromInline}
        />

        {/* Modal Anteprima PDF aperta dall'editor inline */}
        <DocPreviewModal
          open={previewOpen}
          onOpenChange={setPreviewOpen}
          company={company.data ?? DEFAULT_COMPANY}
          data={previewData}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Fatture"
      description="Emissione, incassi e documenti fiscali con anteprima PDF in tempo reale."
      actions={
        <Button
          onClick={handleOpenQuickCreate}
          className="h-9 px-3 sm:px-4 text-xs sm:text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs rounded-lg gap-1.5 shrink-0 cursor-pointer"
        >
          <div className="flex items-center gap-1">
            <Plus className="size-3.5 stroke-[2.5]" />
            <Receipt className="size-4" />
          </div>
          <span className="hidden sm:inline">Nuova fattura</span>
          <span className="sm:hidden text-xs">Nuova</span>
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Indicatori Rapidi (KPI Cards interattive) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full min-w-0">
          <KPISummaryCard
            label="Totale fatturato"
            value={formatCurrency(stats.totalInvoiced)}
            hint={`${stats.allCount} fatture emesse`}
            icon={Receipt}
            tone="primary"
            isActive={statusFilter === "all"}
            onClick={() => setStatusFilter("all")}
          />
          <KPISummaryCard
            label="Incassato"
            value={formatCurrency(stats.totalPaid)}
            hint={`${stats.countPaid} fatture saldate`}
            icon={CheckCircle2}
            tone="emerald"
            valueClassName="text-emerald-600 dark:text-emerald-400"
            isActive={statusFilter === "pagata"}
            onClick={() => setStatusFilter(statusFilter === "pagata" ? "all" : "pagata")}
          />
          <KPISummaryCard
            label="Da incassare"
            value={formatCurrency(stats.totalPending)}
            hint={`${stats.countPending} in attesa`}
            icon={Clock}
            tone="blue"
            valueClassName="text-blue-600 dark:text-blue-400"
            isActive={statusFilter === "emessa"}
            onClick={() => setStatusFilter(statusFilter === "emessa" ? "all" : "emessa")}
          />
          <KPISummaryCard
            label="Insoluti"
            value={formatCurrency(stats.totalOverdue)}
            hint={`${stats.countOverdue} scadute`}
            icon={AlertTriangle}
            tone="rose"
            valueClassName="text-rose-600 dark:text-rose-400"
            isActive={statusFilter === "insoluta"}
            onClick={() => setStatusFilter(statusFilter === "insoluta" ? "all" : "insoluta")}
          />
        </div>

        {/* Card Contenitore Principale con Tabella e Filtri */}
        <div className="bg-card rounded-xl border border-border shadow-xs overflow-hidden">
          {/* Barra Superiore: Ricerca e Filtri */}
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center justify-between">
              {/* Ricerca veloce */}
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Cerca fattura, cliente o oggetto..."
                  className="pl-9 h-9 text-xs sm:text-sm bg-background border-border"
                />
                {search && (
                  <button
                    onClick={() => setSearch("")}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  >
                    <X className="size-3.5" />
                  </button>
                )}
              </div>

              {/* Azioni Toolbar */}
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="sm:hidden h-9 text-xs gap-1.5"
                >
                  <SlidersHorizontal className="size-3.5" />
                  <span>Filtri</span>
                  {activeFilterCount > 0 && (
                    <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-4">
                      {activeFilterCount}
                    </Badge>
                  )}
                </Button>

                <div className="hidden sm:flex items-center gap-2">
                  {/* Filtro Stato */}
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="h-9 text-xs w-[130px] bg-background border-border">
                      <SelectValue placeholder="Stato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti gli stati</SelectItem>
                      <SelectItem value="emessa">Emessa</SelectItem>
                      <SelectItem value="inviata">Inviata</SelectItem>
                      <SelectItem value="pagata">Pagata</SelectItem>
                      <SelectItem value="insoluta">Insoluta</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Filtro Periodo */}
                  <Select value={periodFilter} onValueChange={setPeriodFilter}>
                    <SelectTrigger className="h-9 text-xs w-[130px] bg-background border-border">
                      <SelectValue placeholder="Periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutto il periodo</SelectItem>
                      <SelectItem value="month">Ultimi 30 giorni</SelectItem>
                      <SelectItem value="quarter">Ultimi 3 mesi</SelectItem>
                      <SelectItem value="year">Anno corrente</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Filtro Importo */}
                  <Select value={amountFilter} onValueChange={setAmountFilter}>
                    <SelectTrigger className="h-9 text-xs w-[130px] bg-background border-border">
                      <SelectValue placeholder="Importo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti gli importi</SelectItem>
                      <SelectItem value="under_500">&lt; 500 €</SelectItem>
                      <SelectItem value="500_2000">500 € - 2.000 €</SelectItem>
                      <SelectItem value="over_2000">&gt; 2.000 €</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Filtro Cliente */}
                  <Select value={clientFilter} onValueChange={setClientFilter}>
                    <SelectTrigger className="h-9 text-xs w-[140px] bg-background border-border">
                      <SelectValue placeholder="Cliente" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="all">Tutti i clienti</SelectItem>
                      {allClients.map((c: any) => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={resetFilters}
                    className="h-9 text-xs text-muted-foreground hover:text-foreground px-2 gap-1"
                    title="Azzera filtri"
                  >
                    <FilterX className="size-3.5" />
                    <span className="hidden md:inline">Reset</span>
                  </Button>
                )}
              </div>
            </div>

            {/* Filtri collassabili su Mobile */}
            {showMobileFilters && (
              <div className="sm:hidden grid grid-cols-2 gap-2 pt-2 border-t border-border/60">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Stato" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli stati</SelectItem>
                    <SelectItem value="emessa">Emessa</SelectItem>
                    <SelectItem value="inviata">Inviata</SelectItem>
                    <SelectItem value="pagata">Pagata</SelectItem>
                    <SelectItem value="insoluta">Insoluta</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutto il periodo</SelectItem>
                    <SelectItem value="month">Ultimi 30 giorni</SelectItem>
                    <SelectItem value="quarter">Ultimi 3 mesi</SelectItem>
                    <SelectItem value="year">Anno corrente</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={amountFilter} onValueChange={setAmountFilter}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Importo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli importi</SelectItem>
                    <SelectItem value="under_500">&lt; 500 €</SelectItem>
                    <SelectItem value="500_2000">500 € - 2.000 €</SelectItem>
                    <SelectItem value="over_2000">&gt; 2.000 €</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Cliente" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">Tutti i clienti</SelectItem>
                    {allClients.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Barra Azioni Multiple */}
            {selectedIds.length > 0 && (
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-primary/10 border border-primary/20 text-xs">
                <span className="font-medium text-foreground">
                  {selectedIds.length}{" "}
                  {selectedIds.length === 1 ? "fattura selezionata" : "fatture selezionate"}
                </span>
                <div className="flex items-center gap-2">
                  {selectedIds.length === 1 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDuplicateSingleSelected}
                      className="h-7 text-xs gap-1 bg-background"
                    >
                      <Copy className="size-3" />
                      <span>Duplica</span>
                    </Button>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportCsv}
                    className="h-7 text-xs gap-1 bg-background"
                  >
                    <Download className="size-3" />
                    <span>Esporta CSV</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteSelected}
                    className="h-7 text-xs gap-1"
                  >
                    <Trash2 className="size-3" />
                    <span>Elimina ({selectedIds.length})</span>
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Tabella Fatture */}
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 text-center">
                  <Checkbox
                    checked={selectedIds.length === filteredRows.length && filteredRows.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Seleziona tutte"
                  />
                </TableHead>
                <TableHead className="w-[110px]">Numero</TableHead>
                <TableHead className="w-[100px]">Data</TableHead>
                <TableHead>Cliente & Oggetto</TableHead>
                <TableHead className="w-[120px]">Scadenza</TableHead>
                <TableHead className="w-[110px] text-right">Totale</TableHead>
                <TableHead className="w-[130px]">Stato</TableHead>
                <TableHead className="w-[150px] text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <Receipt className="size-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">Nessuna fattura trovata</p>
                    <p className="text-xs mt-0.5">
                      {hasActiveFilters
                        ? "Prova a modificare i filtri applicati."
                        : "Crea la tua prima fattura cliccando su 'Nuova fattura'."}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((inv: any) => {
                  const client = allClients.find((c: any) => c.id === inv.client_id);
                  const isSelected = selectedIds.includes(inv.id);

                  return (
                    <TableRow
                      key={inv.id}
                      className={cn(
                        "group hover:bg-muted/30 transition-colors cursor-pointer",
                        isSelected && "bg-primary/5",
                      )}
                      onClick={(e) => {
                        // Evita click se cliccato su azioni o checkbox
                        if ((e.target as HTMLElement).closest("button, input, [role=checkbox], a"))
                          return;
                        handleOpenEditInline(inv);
                      }}
                    >
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectRow(inv.id)}
                          aria-label={`Seleziona ${inv.number}`}
                        />
                      </TableCell>

                      <TableCell className="font-mono font-semibold text-foreground text-xs sm:text-sm">
                        {inv.number}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(inv.date)}
                      </TableCell>

                      <TableCell>
                        <div className="font-medium text-foreground text-xs sm:text-sm flex items-center gap-1.5">
                          <span>{client?.name ?? "Cliente non specificato"}</span>
                          {client?.city && (
                            <span className="text-muted-foreground text-[11px] font-normal">
                              ({client.city})
                            </span>
                          )}
                        </div>
                        {inv.title && (
                          <div className="text-xs text-muted-foreground truncate max-w-xs sm:max-w-md">
                            {inv.title}
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {inv.due_date ? formatDate(inv.due_date) : "—"}
                      </TableCell>

                      <TableCell className="text-right font-mono font-semibold text-foreground text-xs sm:text-sm whitespace-nowrap">
                        {formatCurrency(Number(inv.total || 0))}
                      </TableCell>

                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="focus:outline-none cursor-pointer flex items-center gap-1"
                            >
                              {getStatusBadge(inv.status)}
                              <ChevronDown className="size-3 text-muted-foreground opacity-60" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem
                              onClick={() => handleQuickStatusChange(inv, "emessa")}
                            >
                              Emessa
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleQuickStatusChange(inv, "inviata")}
                            >
                              Inviata
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleQuickStatusChange(inv, "pagata")}
                            >
                              Pagata
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleQuickStatusChange(inv, "insoluta")}
                            >
                              Insoluta
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>

                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {/* Modifica Inline */}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenEditInline(inv)}
                            className="size-8 text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
                            title="Compila / Modifica fattura"
                          >
                            <Pencil className="size-4" />
                          </Button>

                          {/* Anteprima PDF */}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenPreview(inv)}
                            className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Anteprima PDF"
                          >
                            <Eye className="size-4" />
                          </Button>

                          {/* WhatsApp */}
                          {client?.phone && (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => openWhatsApp(client.phone, client.name, inv)}
                              className="size-8 text-[#25D366] hover:bg-[#25D366]/10 cursor-pointer"
                              title="Invia tramite WhatsApp"
                            >
                              <WhatsAppIcon className="size-4" />
                            </Button>
                          )}

                          {/* Duplica */}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDuplicate(inv)}
                            className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Duplica"
                          >
                            <Copy className="size-4" />
                          </Button>

                          {/* Elimina */}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Eliminare la fattura ${inv.number}?`)) {
                                remove.mutate(inv.id);
                              }
                            }}
                            className="size-8 text-destructive hover:bg-destructive/10 cursor-pointer"
                            title="Elimina"
                          >
                            <Trash2 className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>

          {/* Barra inferiore con icona impostazioni e conteggio */}
          <div className="p-3 border-t border-border bg-muted/20 flex items-center justify-between text-xs text-muted-foreground">
            <div className="flex items-center gap-2">
              <Link
                to="/impostazioni"
                className="p-1 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
                title="Impostazioni di configurazione"
              >
                <Settings className="size-4" />
              </Link>
              <span>
                {filteredRows.length} {filteredRows.length === 1 ? "fattura" : "fatture"}
                {selectedIds.length > 0 ? ` · ${selectedIds.length} selezionate` : ""}
              </span>
            </div>
            <span className="font-semibold text-foreground">
              Totale:{" "}
              {formatCurrency(
                filteredRows.reduce((s: number, r: any) => s + Number(r.total || 0), 0),
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Scheda Rapida di Creazione Fattura */}
      <FatturaQuickCreateModal
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
        clients={allClients}
        company={company.data ?? DEFAULT_COMPANY}
        onConfirm={handleQuickCreateConfirm}
      />

      {/* Modal Anteprima PDF */}
      <DocPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        company={company.data ?? DEFAULT_COMPANY}
        data={previewData}
      />
    </AppLayout>
  );
}
