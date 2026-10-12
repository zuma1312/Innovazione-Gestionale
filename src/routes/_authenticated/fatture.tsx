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
import { Button } from "@/components/ui/button";
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
import { DocumentEditor, type DocFormValue } from "@/components/DocumentEditor";
import { DocPreviewModal, type DocPreviewData } from "@/components/DocPreviewModal";
import { DocCreateModal, type DocCreateInitialData } from "@/components/DocCreateModal";
import { DEFAULT_COMPANY, useCompany, useList, useRemove, useSave } from "@/hooks/data";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { docTotals, emptyItem, formatCurrency, formatDate, nextNumber } from "@/lib/doc";
import type { DocTemplate } from "@/lib/doc";

export const Route = createFileRoute("/_authenticated/fatture")({
  head: () => ({
    meta: [
      { title: "Fatture — INNOVAZIONE TERMICA" },
      {
        name: "description",
        content: "Emissione e gestione fatture con PDF, tracciamento incassi e scadenze.",
      },
      { property: "og:title", content: "Fatture — INNOVAZIONE TERMICA" },
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

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<DocFormValue | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);

  // Selezione multipla (stile screenshot)
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

  const openNew = () => {
    const existingNumbers = (invoices.data ?? []).map((i: any) => i.number);
    setForm({
      client_id: null,
      number: nextNumber(company.data?.invoice_prefix || "FT", existingNumbers),
      date: todayStr,
      secondary_date: null,
      items: [emptyItem()],
      vat_rate: Number(company.data?.default_vat_rate || 22),
      notes: company.data?.invoice_default_notes || "",
      status: "emessa",
      template: (company.data?.default_template as DocTemplate) || "classico",
      title: "",
      cantiere: "",
      payment_method_id: defaultMethod?.id,
      payment_method: defaultMethod?.typeLabel,
      payment_iban: defaultMethod?.iban ?? "",
    });
    setOpen(true);
  };

  const handleConfirmCreate = (data: DocCreateInitialData) => {
    setCreateModalOpen(false);
    const existingNumbers = (invoices.data ?? []).map((i: any) => i.number);

    setForm({
      client_id: data.client_id,
      number: nextNumber("FT", existingNumbers),
      date: data.date,
      secondary_date: data.secondary_date,
      items: [emptyItem()],
      vat_rate: data.vat_rate,
      notes: data.notes,
      status: "emessa",
      template: data.template,
      title: data.title,
      cantiere: data.cantiere,
      payment_method_id: data.payment_method_id,
      payment_method: data.payment_method,
      payment_iban: data.payment_iban,
    });
    setOpen(true);
  };

  const handleDuplicate = (inv: any) => {
    const existingNumbers = (invoices.data ?? []).map((item: any) => item.number);
    setForm({
      client_id: inv.client_id,
      number: nextNumber("FT", existingNumbers),
      date: todayStr,
      secondary_date: inv.due_date || null,
      items: (inv.items ?? []).map((i: any) => ({ ...i })),
      vat_rate: Number(inv.vat_rate || 22),
      notes: inv.notes || "",
      status: "emessa",
      template: (inv.template as DocTemplate) || "classico",
      title: inv.title ? `${inv.title} (Copia)` : "",
      cantiere: inv.cantiere || "",
      payment_method_id: inv.payment_method_id || defaultMethod?.id,
      payment_method: inv.payment_method || defaultMethod?.typeLabel,
      payment_iban: inv.payment_iban ?? defaultMethod?.iban ?? "",
    });
    setOpen(true);
    toast.info("Fattura duplicata in una nuova bozza.");
  };

  const handleOpenEdit = (inv: any) => {
    setForm({
      id: inv.id,
      client_id: inv.client_id,
      number: inv.number,
      date: inv.date,
      secondary_date: inv.due_date,
      items: (inv.items ?? []) as any,
      vat_rate: Number(inv.vat_rate),
      notes: inv.notes,
      status: inv.status,
      template: inv.template as DocTemplate,
      title: inv.title || "",
      cantiere: inv.cantiere || "",
      payment_method_id: inv.payment_method_id,
      payment_method: inv.payment_method,
      payment_iban: inv.payment_iban,
    });
    setOpen(true);
  };

  const handleOpenPreview = (inv: any) => {
    const client = (clients.data ?? []).find((c: any) => c.id === inv.client_id);
    setPreviewData({
      docLabel: "Fattura",
      number: inv.number,
      date: inv.date,
      secondaryDateLabel: "Scadenza pagamento",
      secondaryDate: inv.due_date,
      template: (inv.template as DocTemplate) || "classico",
      clientName: client?.name ?? "Cliente",
      clientLines: [
        client?.address ?? "",
        [client?.zip, client?.city].filter(Boolean).join(" "),
        client?.vat_number ? `P.IVA ${client.vat_number}` : "",
        client?.email ?? "",
      ],
      items: (inv.items ?? []) as any,
      vatRate: Number(inv.vat_rate || 22),
      notes: inv.notes,
      title: inv.title,
      cantiere: inv.cantiere,
      paymentMethod: inv.payment_method || defaultMethod?.typeLabel,
      paymentIban: inv.payment_iban ?? defaultMethod?.iban ?? "",
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
      ...rowsToExport.map((inv: any) => {
        const client = allClients.find((c: any) => c.id === inv.client_id);
        return `"${inv.number}","${inv.date}","${inv.due_date || ""}","${client?.name || ""}","${inv.total || 0}","${inv.status}"`;
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

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const submit = async () => {
    if (!form) return;
    try {
      await save.mutateAsync({
        id: form.id,
        client_id: form.client_id,
        number: form.number,
        date: form.date,
        due_date: form.secondary_date,
        items: form.items,
        vat_rate: form.vat_rate,
        notes: form.notes,
        status: form.status,
        template: form.template,
        title: form.title,
        cantiere: form.cantiere,
        payment_method_id: form.payment_method_id,
        payment_method: form.payment_method,
        payment_iban: form.payment_iban,
        total: docTotals(form.items, form.vat_rate).total,
      });
      toast.success("Fattura salvata con successo.");
      setOpen(false);
    } catch {
      toast.error("Salvataggio non riuscito.");
    }
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
    const msg = `Gentile ${clientName || ""}, le trasmettiamo il riepilogo della Fattura N. ${inv?.number || ""} di ${totalFmt} da parte di Innovazione Termica. Restiamo a disposizione per qualsiasi chiarimento.`;

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

      const isPaid = inv.status === "pagata";
      const isOverdue = !isPaid && inv.due_date && new Date(inv.due_date) < today;

      if (isPaid) {
        totalPaid += tot;
        countPaid++;
      } else {
        totalPending += tot;
        countPending++;
      }

      if (isOverdue) {
        totalOverdue += tot;
        countOverdue++;
      }
    }

    return {
      allCount: allInvoices.length,
      totalInvoiced,
      totalPaid,
      countPaid,
      totalPending,
      countPending,
      totalOverdue,
      countOverdue,
    };
  }, [allInvoices, today]);

  // Filtraggio avanzato
  const filteredRows = useMemo(() => {
    return allInvoices.filter((inv: any) => {
      const client = allClients.find((c: any) => c.id === inv.client_id);
      const clientName = client?.name || "";
      const clientPhone = client?.phone || "";
      const clientCity = client?.city || "";
      const clientVat = client?.vat_number || "";

      // Ricerca testuale
      const q = search.toLowerCase();
      const num = (inv.number || "").toLowerCase();
      const title = (inv.title || "").toLowerCase();
      const cantiere = (inv.cantiere || "").toLowerCase();
      const notes = (inv.notes || "").toLowerCase();

      if (
        search &&
        !num.includes(q) &&
        !title.includes(q) &&
        !cantiere.includes(q) &&
        !clientName.toLowerCase().includes(q) &&
        !clientPhone.includes(q) &&
        !clientCity.toLowerCase().includes(q) &&
        !clientVat.toLowerCase().includes(q) &&
        !notes.includes(q)
      ) {
        return false;
      }

      // Filtro stato
      if (statusFilter !== "all" && inv.status !== statusFilter) {
        return false;
      }

      // Filtro cliente
      if (clientFilter !== "all" && inv.client_id !== clientFilter) {
        return false;
      }

      // Filtro importo
      const tot = Number(inv.total || 0);
      if (amountFilter === "under_500" && tot >= 500) return false;
      if (amountFilter === "500_2000" && (tot < 500 || tot > 2000)) return false;
      if (amountFilter === "2000_5000" && (tot < 2000 || tot > 5000)) return false;
      if (amountFilter === "over_5000" && tot <= 5000) return false;

      // Filtro periodo
      if (periodFilter !== "all") {
        const invDate = new Date(inv.date);
        const dueDate = inv.due_date ? new Date(inv.due_date) : null;
        const isPaid = inv.status === "pagata";

        if (periodFilter === "this_month") {
          if (
            invDate.getFullYear() !== today.getFullYear() ||
            invDate.getMonth() !== today.getMonth()
          ) {
            return false;
          }
        } else if (periodFilter === "last_3_months") {
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          if (invDate < threeMonthsAgo) return false;
        } else if (periodFilter === "this_year") {
          if (invDate.getFullYear() !== today.getFullYear()) return false;
        } else if (periodFilter === "overdue") {
          if (!dueDate || dueDate >= today || isPaid) return false;
        } else if (periodFilter === "expiring_soon") {
          if (!dueDate || isPaid) return false;
          const nextWeek = new Date();
          nextWeek.setDate(nextWeek.getDate() + 7);
          if (dueDate < today || dueDate > nextWeek) return false;
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

  return (
    <AppLayout
      title="Fatture"
      description="Emissione, incassi e documenti fiscali con anteprima PDF in tempo reale."
      actions={
        <Button
          onClick={openNew}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-2.5 sm:px-4 py-2 shadow-xs rounded-lg gap-1.5 shrink-0"
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`rounded-xl border p-3.5 sm:p-4 text-left transition-all bg-card shadow-xs flex flex-col justify-between min-h-[96px] sm:min-h-[104px] ${
              statusFilter === "all"
                ? "border-primary ring-1 ring-primary/20 shadow-xs"
                : "border-border hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Totale fatturato</span>
              <Receipt className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums mt-1">
                {formatCurrency(stats.totalInvoiced)}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground/80 mt-0.5 truncate">
                {stats.allCount} fatture emesse
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("pagata")}
            className={`rounded-xl border p-3.5 sm:p-4 text-left transition-all bg-card shadow-xs flex flex-col justify-between min-h-[96px] sm:min-h-[104px] ${
              statusFilter === "pagata"
                ? "border-emerald-500 ring-1 ring-emerald-500/20 shadow-xs"
                : "border-border hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
              <span className="text-xs font-medium">Incassato</span>
              <CheckCircle2 className="size-4" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums mt-1">
                {formatCurrency(stats.totalPaid)}
              </p>
              <p className="text-[11px] sm:text-xs text-emerald-600/80 mt-0.5 truncate">
                {stats.countPaid} pagate con successo
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("emessa")}
            className={`rounded-xl border p-3.5 sm:p-4 text-left transition-all bg-card shadow-xs flex flex-col justify-between min-h-[96px] sm:min-h-[104px] ${
              statusFilter === "emessa"
                ? "border-blue-500 ring-1 ring-blue-500/20 shadow-xs"
                : "border-border hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center justify-between text-blue-700 dark:text-blue-400">
              <span className="text-xs font-medium">Da incassare</span>
              <Clock className="size-4" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums mt-1">
                {formatCurrency(stats.totalPending)}
              </p>
              <p className="text-[11px] sm:text-xs text-blue-600/80 mt-0.5 truncate">
                {stats.countPending} in attesa di saldo
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setPeriodFilter("overdue")}
            className={`rounded-xl border p-3.5 sm:p-4 text-left transition-all bg-card shadow-xs flex flex-col justify-between min-h-[96px] sm:min-h-[104px] ${
              periodFilter === "overdue"
                ? "border-rose-500 ring-1 ring-rose-500/20 shadow-xs"
                : "border-border hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center justify-between text-rose-700 dark:text-rose-400">
              <span className="text-xs font-medium">Scadute / Insolute</span>
              <AlertTriangle className="size-4" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums mt-1">
                {formatCurrency(stats.totalOverdue)}
              </p>
              <p className="text-[11px] sm:text-xs text-rose-600/80 mt-0.5 truncate">
                {stats.countOverdue} oltre i termini
              </p>
            </div>
          </button>
        </div>

        {/* Toolbar con filtri multipli */}
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 shadow-xs space-y-3">
          <div className="flex flex-col md:grid md:grid-cols-12 gap-3">
            {/* Ricerca per numero, cliente, note + Toggle filtri mobile */}
            <div className="flex items-center gap-2 md:col-span-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cerca numero, cliente, P.IVA, note..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-background shadow-xs rounded-lg"
                />
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-9 text-xs font-semibold uppercase px-2.5 rounded-lg shadow-xs flex items-center gap-1 cursor-pointer shrink-0"
                    title="Altre azioni sulle fatture"
                  >
                    Altro
                    <ChevronDown className="size-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem
                    disabled={selectedIds.length === 0}
                    onClick={handleDeleteSelected}
                    className="text-destructive cursor-pointer text-xs"
                  >
                    <Trash2 className="mr-2 size-4" />
                    Elimina selezionate ({selectedIds.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={selectedIds.length !== 1}
                    onClick={handleDuplicateSingleSelected}
                    className="cursor-pointer text-xs"
                  >
                    <Copy className="mr-2 size-4" />
                    Duplica selezionata
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExportCsv} className="cursor-pointer text-xs">
                    <Download className="mr-2 size-4" />
                    Esporta elenco (.CSV)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={toggleSelectAll} className="cursor-pointer text-xs">
                    {selectedIds.length === filteredRows.length && filteredRows.length > 0
                      ? "Deseleziona tutte"
                      : "Seleziona tutte"}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button
                type="button"
                variant={showMobileFilters || activeFilterCount > 0 ? "secondary" : "outline"}
                size="sm"
                onClick={() => setShowMobileFilters((prev) => !prev)}
                className="md:hidden shrink-0 h-9 px-3 gap-1.5 rounded-lg border-border"
              >
                <SlidersHorizontal className="size-3.5" />
                <span>Filtri</span>
                {activeFilterCount > 0 && (
                  <span className="flex size-4.5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    "size-3.5 transition-transform duration-200",
                    showMobileFilters && "rotate-180",
                  )}
                />
              </Button>
            </div>

            {/* Menu a scomparsa filtri su mobile, sempre in linea su desktop */}
            <div
              className={cn(
                "md:col-span-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3",
                showMobileFilters ? "grid" : "hidden md:grid",
              )}
            >
              {/* Filtro 1: Stato */}
              <div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="bg-background shadow-xs rounded-lg">
                    <SelectValue placeholder="Tutti gli stati" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli stati</SelectItem>
                    <SelectItem value="emessa">Emessa</SelectItem>
                    <SelectItem value="inviata">Inviata</SelectItem>
                    <SelectItem value="pagata">Pagata</SelectItem>
                    <SelectItem value="insoluta">Insoluta</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro 2: Periodo / Scadenze */}
              <div>
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger className="bg-background shadow-xs rounded-lg">
                    <SelectValue placeholder="Periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le date</SelectItem>
                    <SelectItem value="this_month">Questo mese</SelectItem>
                    <SelectItem value="last_3_months">Ultimi 3 mesi</SelectItem>
                    <SelectItem value="this_year">Anno in corso</SelectItem>
                    <SelectItem value="expiring_soon">In scadenza (7 gg)</SelectItem>
                    <SelectItem value="overdue">Scadute</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro 3: Cliente */}
              <div>
                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger className="bg-background shadow-xs rounded-lg">
                    <SelectValue placeholder="Cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i clienti</SelectItem>
                    {allClients.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro 4: Importo */}
              <div>
                <Select value={amountFilter} onValueChange={setAmountFilter}>
                  <SelectTrigger className="bg-background shadow-xs rounded-lg">
                    <SelectValue placeholder="Importo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti gli importi</SelectItem>
                    <SelectItem value="under_500">Meno di 500 €</SelectItem>
                    <SelectItem value="500_2000">500 € – 2.000 €</SelectItem>
                    <SelectItem value="2000_5000">2.000 € – 5.000 €</SelectItem>
                    <SelectItem value="over_5000">Oltre 5.000 €</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Reset Filtri Bar */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
              <span className="text-muted-foreground">
                Trovate <strong className="text-foreground">{filteredRows.length}</strong> fatture
                su {allInvoices.length}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetFilters}
                className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1.5"
              >
                <FilterX className="size-3.5" /> Azzera filtri
              </Button>
            </div>
          )}
        </div>

        {/* Modalità Lista / Tabella Fatture con Checkbox e Anteprima PDF */}
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="w-12 pl-4">
                  <Checkbox
                    checked={filteredRows.length > 0 && selectedIds.length === filteredRows.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Seleziona tutte"
                  />
                </TableHead>
                <TableHead className="font-semibold text-foreground py-3">Numero</TableHead>
                <TableHead className="font-semibold text-foreground py-3">Cliente</TableHead>
                <TableHead className="font-semibold text-foreground py-3">Data emissione</TableHead>
                <TableHead className="font-semibold text-foreground py-3">
                  Scadenza pagamento
                </TableHead>
                <TableHead className="font-semibold text-foreground py-3 text-right">
                  Importo
                </TableHead>
                <TableHead className="font-semibold text-foreground py-3 text-center">
                  Stato incasso
                </TableHead>
                <TableHead className="font-semibold text-foreground py-3 pr-4 text-right">
                  Azioni
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="h-40 text-center text-sm text-muted-foreground">
                    {hasActiveFilters ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <p>Nessuna fattura corrisponde ai filtri impostati.</p>
                        <Button variant="outline" size="sm" onClick={resetFilters}>
                          Reimposta filtri
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Receipt className="size-8 text-muted-foreground/40" />
                        <p>Nessuna fattura presente. Crea la prima fattura con anteprima PDF.</p>
                        <Button size="sm" onClick={openNew}>
                          <Plus className="mr-1.5 size-4" /> Nuova fattura
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((inv: any) => {
                  const client = allClients.find((c: any) => c.id === inv.client_id);
                  const isPaid = inv.status === "pagata";
                  const isOverdue = !isPaid && inv.due_date && new Date(inv.due_date) < today;
                  const isSelected = selectedIds.includes(inv.id);

                  return (
                    <TableRow
                      key={inv.id}
                      className={`hover:bg-muted/40 transition-colors border-b border-border/60 ${
                        isSelected ? "bg-muted/50" : ""
                      }`}
                    >
                      {/* Checkbox selezione riga */}
                      <TableCell className="w-12 pl-4 py-3.5">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectOne(inv.id)}
                          aria-label={`Seleziona fattura ${inv.number}`}
                        />
                      </TableCell>

                      {/* Numero */}
                      <TableCell className="py-3.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(inv)}
                          className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors text-left cursor-pointer"
                        >
                          <Receipt className="size-4 text-primary shrink-0" />
                          <span>{inv.number || "FT"}</span>
                        </button>
                      </TableCell>

                      {/* Cliente */}
                      <TableCell className="py-3.5">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {client?.name ?? "Senza cliente"}
                          </p>
                          {inv.title ? (
                            <p className="text-xs font-semibold text-primary truncate mt-0.5">
                              {inv.title}
                              {inv.cantiere ? (
                                <span className="font-normal text-muted-foreground ml-1.5">
                                  · {inv.cantiere}
                                </span>
                              ) : null}
                            </p>
                          ) : null}
                          {client?.city || client?.phone ? (
                            <p className="text-xs text-muted-foreground truncate">
                              {[client?.city, client?.phone].filter(Boolean).join(" · ")}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>

                      {/* Data emissione */}
                      <TableCell className="py-3.5 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-muted-foreground/60" />
                          {formatDate(inv.date)}
                        </span>
                      </TableCell>

                      {/* Scadenza pagamento */}
                      <TableCell className="py-3.5 text-sm">
                        {inv.due_date ? (
                          <span
                            className={
                              isOverdue
                                ? "text-rose-600 dark:text-rose-400 font-semibold text-xs flex items-center gap-1"
                                : "text-muted-foreground text-xs"
                            }
                          >
                            {formatDate(inv.due_date)}
                            {isOverdue && " (Scaduta)"}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40 text-xs">—</span>
                        )}
                      </TableCell>

                      {/* Importo Totale */}
                      <TableCell className="py-3.5 text-right">
                        <p className="font-bold text-foreground text-sm">
                          {formatCurrency(Number(inv.total || 0))}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          IVA {inv.vat_rate}% inc.
                        </p>
                      </TableCell>

                      {/* Stato con Cambio Rapido */}
                      <TableCell className="py-3.5 text-center">
                        <Select
                          value={inv.status || "emessa"}
                          onValueChange={(val) => handleQuickStatusChange(inv, val)}
                        >
                          <SelectTrigger className="h-7 w-auto border-0 shadow-none bg-transparent hover:bg-muted/40 p-0 focus:ring-0">
                            {getStatusBadge(inv.status || "emessa")}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="emessa">Emessa</SelectItem>
                            <SelectItem value="inviata">Inviata</SelectItem>
                            <SelectItem value="pagata">Pagata</SelectItem>
                            <SelectItem value="insoluta">Insoluta</SelectItem>
                          </SelectContent>
                        </Select>
                      </TableCell>

                      {/* Azioni sulla riga con Tasto Anteprima PDF */}
                      <TableCell className="py-3.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* TASTO ANTEPRIMA PDF DIRETTO */}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenPreview(inv)}
                            className="size-8 text-primary hover:bg-primary/15 transition-colors cursor-pointer"
                            title="Visualizza anteprima PDF"
                          >
                            <Eye className="size-4" />
                          </Button>

                          {/* TASTO WHATSAPP */}
                          {client?.phone ? (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => openWhatsApp(client.phone, client.name, inv)}
                              className="size-8 text-[#25D366] hover:bg-[#25D366]/15 hover:text-[#20BA5A] transition-colors cursor-pointer"
                              title="Invia o ricorda su WhatsApp"
                            >
                              <WhatsAppIcon className="size-4" />
                            </Button>
                          ) : (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              disabled
                              className="size-8 opacity-25 cursor-not-allowed"
                              title="Nessun numero cliente per WhatsApp"
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
                            title="Duplica fattura"
                          >
                            <Copy className="size-4" />
                          </Button>

                          {/* Modifica */}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenEdit(inv)}
                            className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Modifica fattura"
                          >
                            <Pencil className="size-4" />
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

          {/* Barra inferiore con icona impostazioni e conteggio (Screenshot 2) */}
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

      {/* Creazione Rapida Fattura (Menu da Screenshot) */}
      <DocCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        docType="fattura"
        docLabel="Fattura"
        clients={allClients}
        company={company.data ?? DEFAULT_COMPANY}
        onConfirm={handleConfirmCreate}
      />

      {/* Editor Documento */}
      {form ? (
        <DocumentEditor
          open={open}
          onOpenChange={setOpen}
          docLabel="Fattura"
          secondaryDateLabel="Scadenza"
          statuses={STATUSES as unknown as string[]}
          company={company.data ?? DEFAULT_COMPANY}
          clients={allClients}
          value={form}
          onChange={setForm}
          onSave={submit}
          saving={save.isPending}
        />
      ) : null}

      {/* Modal Anteprima PDF aperta dal pulsante dedicato */}
      <DocPreviewModal
        open={previewOpen}
        onOpenChange={setPreviewOpen}
        company={company.data ?? DEFAULT_COMPANY}
        data={previewData}
      />
    </AppLayout>
  );
}
