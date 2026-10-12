import { useCallback, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Copy,
  DollarSign,
  Download,
  Eye,
  FileCheck2,
  FileText,
  FilterX,
  Pencil,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Trash2,
  User,
  Wrench,
  X,
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
import { docTotals, formatCurrency, formatDate, nextNumber } from "@/lib/doc";
import type { DocItem, DocTemplate } from "@/lib/doc";

export const Route = createFileRoute("/_authenticated/interventi")({
  head: () => ({
    meta: [
      { title: "Interventi — INNOVAZIONE TERMICA" },
      {
        name: "description",
        content: "Rapportini di intervento con PDF, stampa e invio.",
      },
      { property: "og:title", content: "Interventi — INNOVAZIONE TERMICA" },
      {
        property: "og:description",
        content: "Rapporti di lavoro, manutenzioni e pronto intervento idraulico.",
      },
    ],
  }),
  component: InterventiPage,
});

const STATUSES = ["aperto", "in corso", "completato", "fatturato"] as const;

function WhatsAppIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c-.001 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.711 1.456h.005c6.554 0 11.89-5.336 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function InterventiPage() {
  const interventions = useList<any>("interventions");
  const clients = useList<any>("clients");
  const company = useCompany();
  const { defaultMethod } = usePaymentMethods();
  const save = useSave("interventions");
  const remove = useRemove("interventions");

  const [open, setOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [form, setForm] = useState<DocFormValue | null>(null);

  // Selezione multipla (stile screenshot)
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [previewData, setPreviewData] = useState<DocPreviewData | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  // Filtri
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("all");
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [techFilter, setTechFilter] = useState<string>("all");
  const [amountFilter, setAmountFilter] = useState<string>("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  const today = useMemo(() => new Date(), []);

  const toItems = (row: any): DocItem[] => [
    {
      description: `Manodopera (${row.hours ?? 1} h)`,
      qty: Number(row.hours ?? 1),
      unit_price: Number(row.hourly_rate ?? 35),
    },
    {
      description: "Materiali impiegati",
      qty: 1,
      unit_price: Number(row.materials_cost ?? 0),
    },
  ];

  const vatRate = Number(company.data?.default_vat_rate ?? 22);

  const calculateTotal = useCallback(
    (row: any) => {
      return docTotals(toItems(row), vatRate).total;
    },
    [vatRate],
  );

  const openNew = () => {
    const existingNumbers = (interventions.data ?? []).map((i: any) => i.number);
    setForm({
      client_id: null,
      number: nextNumber("INT", existingNumbers),
      date: todayStr,
      secondary_date: null,
      items: toItems({}),
      vat_rate: vatRate,
      notes: "",
      status: "aperto",
      template: "classico",
      body: "",
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
    const existingNumbers = (interventions.data ?? []).map((i: any) => i.number);
    setForm({
      client_id: data.client_id,
      number: nextNumber("INT", existingNumbers),
      date: data.date,
      secondary_date: data.secondary_date,
      items: toItems({}),
      vat_rate: data.vat_rate,
      notes: data.notes,
      status: "aperto",
      template: data.template,
      body: "",
      title: data.title,
      cantiere: data.cantiere,
      payment_method_id: data.payment_method_id,
      payment_method: data.payment_method,
      payment_iban: data.payment_iban,
    });
    setOpen(true);
  };

  const handleDuplicate = (row: any) => {
    const existingNumbers = (interventions.data ?? []).map((item: any) => item.number);
    setForm({
      client_id: row.client_id,
      number: nextNumber("INT", existingNumbers),
      date: todayStr,
      secondary_date: null,
      items: toItems(row),
      vat_rate: Number(company.data?.default_vat_rate ?? 22),
      notes: row.notes || "",
      status: "aperto",
      template: (row.template as DocTemplate) || "classico",
      body: row.description || row.title || "",
      title: `${row.title || ""} (Copia)`,
      payment_method_id: row.payment_method_id || defaultMethod?.id,
      payment_method: row.payment_method || defaultMethod?.typeLabel,
      payment_iban: row.payment_iban ?? defaultMethod?.iban ?? "",
    });
    setOpen(true);
    toast.info("Intervento duplicato in una nuova bozza.");
  };

  const handleOpenEdit = (row: any) => {
    setForm({
      id: row.id,
      client_id: row.client_id,
      number: row.number,
      date: row.date,
      secondary_date: null,
      items: toItems(row),
      vat_rate: Number(company.data?.default_vat_rate ?? 22),
      notes: "",
      status: row.status,
      template: row.template as DocTemplate,
      body: row.description || row.title || "",
      payment_method_id: row.payment_method_id,
      payment_method: row.payment_method,
      payment_iban: row.payment_iban,
    });
    setOpen(true);
  };

  const handleOpenPreview = (row: any) => {
    const client = (clients.data ?? []).find((c: any) => c.id === row.client_id);
    setPreviewData({
      docLabel: "Intervento",
      number: row.number,
      date: row.date,
      secondaryDateLabel: "Data fine lavori",
      secondaryDate: null,
      template: (row.template as DocTemplate) || "classico",
      clientName: client?.name ?? "Cliente",
      clientLines: [
        client?.address ?? "",
        [client?.zip, client?.city].filter(Boolean).join(" "),
        client?.vat_number ? `P.IVA ${client.vat_number}` : "",
        client?.email ?? "",
      ],
      items: toItems(row),
      vatRate: Number(company.data?.default_vat_rate ?? 22),
      notes: row.notes || "",
      bodyText: row.description || row.title || undefined,
      paymentMethod: row.payment_method || defaultMethod?.typeLabel,
      paymentIban: row.payment_iban ?? defaultMethod?.iban ?? "",
    });
    setPreviewOpen(true);
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Sei sicuro di voler eliminare ${selectedIds.length} interventi selezionati?`))
      return;
    try {
      for (const id of selectedIds) {
        await remove.mutateAsync(id);
      }
      setSelectedIds([]);
      toast.success("Interventi eliminati con successo.");
    } catch {
      toast.error("Errore durante l'eliminazione degli interventi.");
    }
  };

  const handleDuplicateSingleSelected = () => {
    if (selectedIds.length !== 1) return;
    const item = (interventions.data ?? []).find((r: any) => r.id === selectedIds[0]);
    if (item) handleDuplicate(item);
  };

  const handleExportCsv = () => {
    const rowsToExport =
      selectedIds.length > 0
        ? filteredRows.filter((r: any) => selectedIds.includes(r.id))
        : filteredRows;
    const csv = [
      "Numero,Data,Cliente,Tecnico,Totale,Stato",
      ...rowsToExport.map((row: any) => {
        const client = allClients.find((c: any) => c.id === row.client_id);
        const tot = calculateTotal(row);
        return `"${row.number}","${row.date}","${client?.name || ""}","${row.technician || ""}","${tot}","${row.status}"`;
      }),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "interventi.csv";
    link.click();
    toast.success("Elenco interventi esportato.");
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
    const labour = form.items[0];
    const materials = form.items[1];
    try {
      await save.mutateAsync({
        id: form.id,
        client_id: form.client_id,
        number: form.number,
        title: form.body?.split("\n")[0]?.slice(0, 80) || `Intervento ${form.number}`,
        description: form.body ?? "",
        date: form.date,
        hours: Number(labour?.qty ?? 1),
        hourly_rate: Number(labour?.unit_price ?? 35),
        materials_cost: Number(materials?.unit_price ?? 0),
        status: form.status,
        template: form.template,
      });
      toast.success("Intervento salvato con successo.");
      setOpen(false);
    } catch {
      toast.error("Salvataggio non riuscito.");
    }
  };

  const handleQuickStatusChange = async (row: any, newStatus: string) => {
    try {
      await save.mutateAsync({
        id: row.id,
        status: newStatus,
      });
      toast.success(`Stato aggiornato a "${newStatus}".`);
    } catch {
      toast.error("Impossibile aggiornare lo stato.");
    }
  };

  const openWhatsApp = (phone?: string, clientName?: string, row?: any) => {
    if (!phone) {
      toast.error("Nessun numero di telefono per questo cliente.");
      return;
    }

    let clean = phone.replace(/\D/g, "");
    if (clean.length === 10 && clean.startsWith("3")) {
      clean = `39${clean}`;
    }

    const totalFmt = formatCurrency(calculateTotal(row));
    const msg = `Salve ${clientName || ""}, vi contattiamo da Innovazione Termica in merito all'intervento ${row.number || ""}: ${row.title || row.description || ""} (${totalFmt}). Restiamo a disposizione per qualsiasi informazione.`;

    const url = `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const allInterventions = useMemo(() => interventions.data ?? [], [interventions.data]);
  const allClients = useMemo(() => clients.data ?? [], [clients.data]);

  // Elenco tecnici unici
  const technicians = useMemo(() => {
    const list = Array.from(
      new Set(
        allInterventions
          .map((i: any) => i.technician?.trim())
          .filter((t: string | undefined): t is string => Boolean(t)),
      ),
    );
    list.sort();
    return list;
  }, [allInterventions]);

  // Indicatori rapidi (KPI)
  const stats = useMemo(() => {
    const acc = {
      all: allInterventions.length,
      aperto: 0,
      in_corso: 0,
      completato: 0,
      fatturato: 0,
      totalValue: 0,
    };

    for (const row of allInterventions) {
      const val = calculateTotal(row);
      acc.totalValue += val;

      if (row.status === "aperto") acc.aperto++;
      else if (row.status === "in corso") acc.in_corso++;
      else if (row.status === "completato") acc.completato++;
      else if (row.status === "fatturato") acc.fatturato++;
    }

    return acc;
  }, [allInterventions, calculateTotal]);

  // Filtraggio avanzato
  const filteredRows = useMemo(() => {
    return allInterventions.filter((row: any) => {
      const client = allClients.find((c: any) => c.id === row.client_id);
      const clientName = client?.name || "";
      const clientPhone = client?.phone || "";
      const clientCity = client?.city || "";

      // Ricerca testuale
      const q = search.toLowerCase();
      const num = (row.number || "").toLowerCase();
      const title = (row.title || "").toLowerCase();
      const desc = (row.description || "").toLowerCase();
      const tech = (row.technician || "").toLowerCase();

      if (
        search &&
        !num.includes(q) &&
        !title.includes(q) &&
        !desc.includes(q) &&
        !tech.includes(q) &&
        !clientName.toLowerCase().includes(q) &&
        !clientPhone.includes(q) &&
        !clientCity.toLowerCase().includes(q)
      ) {
        return false;
      }

      // Filtro stato
      if (statusFilter !== "all" && row.status !== statusFilter) {
        return false;
      }

      // Filtro cliente
      if (clientFilter !== "all" && row.client_id !== clientFilter) {
        return false;
      }

      // Filtro tecnico
      if (techFilter !== "all" && row.technician !== techFilter) {
        return false;
      }

      // Filtro importo
      const tot = calculateTotal(row);
      if (amountFilter === "under_100" && tot >= 100) return false;
      if (amountFilter === "100_300" && (tot < 100 || tot > 300)) return false;
      if (amountFilter === "over_300" && tot <= 300) return false;

      // Filtro periodo
      if (periodFilter !== "all") {
        const rowDate = new Date(row.date);
        if (periodFilter === "today") {
          if (row.date !== todayStr) return false;
        } else if (periodFilter === "this_week") {
          const sevenDaysAgo = new Date();
          sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
          if (rowDate < sevenDaysAgo) return false;
        } else if (periodFilter === "this_month") {
          if (
            rowDate.getFullYear() !== today.getFullYear() ||
            rowDate.getMonth() !== today.getMonth()
          ) {
            return false;
          }
        } else if (periodFilter === "last_3_months") {
          const threeMonthsAgo = new Date();
          threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
          if (rowDate < threeMonthsAgo) return false;
        } else if (periodFilter === "this_year") {
          if (rowDate.getFullYear() !== today.getFullYear()) return false;
        }
      }

      return true;
    });
  }, [
    allInterventions,
    allClients,
    calculateTotal,
    search,
    statusFilter,
    clientFilter,
    techFilter,
    amountFilter,
    periodFilter,
    today,
    todayStr,
  ]);

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    periodFilter !== "all" ||
    clientFilter !== "all" ||
    techFilter !== "all" ||
    amountFilter !== "all";

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) +
    (periodFilter !== "all" ? 1 : 0) +
    (clientFilter !== "all" ? 1 : 0) +
    (techFilter !== "all" ? 1 : 0) +
    (amountFilter !== "all" ? 1 : 0);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setPeriodFilter("all");
    setClientFilter("all");
    setTechFilter("all");
    setAmountFilter("all");
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completato":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
            <CheckCircle2 className="size-3" /> Completato
          </span>
        );
      case "in corso":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
            <Clock className="size-3" /> In corso
          </span>
        );
      case "fatturato":
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
            <FileCheck2 className="size-3" /> Fatturato
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
            <AlertCircle className="size-3" /> Aperto
          </span>
        );
    }
  };

  return (
    <AppLayout
      title="Interventi"
      description="Rapportini di lavoro, manutenzioni e pronto intervento con riepilogo costi."
      actions={
        <Button
          onClick={openNew}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-2.5 sm:px-4 py-2 shadow-xs rounded-lg gap-1.5 shrink-0"
        >
          <div className="flex items-center gap-1">
            <Plus className="size-3.5 stroke-[2.5]" />
            <Wrench className="size-4" />
          </div>
          <span className="hidden sm:inline">Nuovo intervento</span>
          <span className="sm:hidden text-xs">Nuovo</span>
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
              <span className="text-xs font-medium">Tutti gli interventi</span>
              <Wrench className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums mt-1">
                {stats.all}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground/80 mt-0.5 truncate">
                Totale {formatCurrency(stats.totalValue)}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("aperto")}
            className={`rounded-xl border p-3.5 sm:p-4 text-left transition-all bg-card shadow-xs flex flex-col justify-between min-h-[96px] sm:min-h-[104px] ${
              statusFilter === "aperto"
                ? "border-blue-500 ring-1 ring-blue-500/20 shadow-xs"
                : "border-border hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center justify-between text-blue-700 dark:text-blue-400">
              <span className="text-xs font-medium">Aperti / Da fare</span>
              <AlertCircle className="size-4" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums mt-1">
                {stats.aperto}
              </p>
              <p className="text-[11px] sm:text-xs text-blue-600/80 mt-0.5 truncate">
                In attesa di esecuzione
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("in corso")}
            className={`rounded-xl border p-3.5 sm:p-4 text-left transition-all bg-card shadow-xs flex flex-col justify-between min-h-[96px] sm:min-h-[104px] ${
              statusFilter === "in corso"
                ? "border-amber-500 ring-1 ring-amber-500/20 shadow-xs"
                : "border-border hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
              <span className="text-xs font-medium">In corso</span>
              <Clock className="size-4" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums mt-1">
                {stats.in_corso}
              </p>
              <p className="text-[11px] sm:text-xs text-amber-600/80 mt-0.5 truncate">
                Lavorazioni attive
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("completato")}
            className={`rounded-xl border p-3.5 sm:p-4 text-left transition-all bg-card shadow-xs flex flex-col justify-between min-h-[96px] sm:min-h-[104px] ${
              statusFilter === "completato"
                ? "border-emerald-500 ring-1 ring-emerald-500/20 shadow-xs"
                : "border-border hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
              <span className="text-xs font-medium">Completati</span>
              <CheckCircle2 className="size-4" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums mt-1">
                {stats.completato}
              </p>
              <p className="text-[11px] sm:text-xs text-emerald-600/80 mt-0.5 truncate">
                Pronti per fatturazione
              </p>
            </div>
          </button>
        </div>

        {/* Toolbar con filtri multipli */}
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 shadow-xs space-y-3">
          <div className="flex flex-col md:grid md:grid-cols-12 gap-3">
            {/* Ricerca per numero, titolo, note, cliente + Toggle filtri mobile */}
            <div className="flex items-center gap-2 md:col-span-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cerca numero, titolo, cliente, note..."
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
                    title="Altre azioni sugli interventi"
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
                    Elimina selezionati ({selectedIds.length})
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    disabled={selectedIds.length !== 1}
                    onClick={handleDuplicateSingleSelected}
                    className="cursor-pointer text-xs"
                  >
                    <Copy className="mr-2 size-4" />
                    Duplica selezionato
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleExportCsv} className="cursor-pointer text-xs">
                    <Download className="mr-2 size-4" />
                    Esporta elenco (.CSV)
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={toggleSelectAll} className="cursor-pointer text-xs">
                    {selectedIds.length === filteredRows.length && filteredRows.length > 0
                      ? "Deseleziona tutti"
                      : "Seleziona tutti"}
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
                    <SelectItem value="aperto">Aperto</SelectItem>
                    <SelectItem value="in corso">In corso</SelectItem>
                    <SelectItem value="completato">Completato</SelectItem>
                    <SelectItem value="fatturato">Fatturato</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro 2: Periodo */}
              <div>
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger className="bg-background shadow-xs rounded-lg">
                    <SelectValue placeholder="Periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le date</SelectItem>
                    <SelectItem value="today">Oggi</SelectItem>
                    <SelectItem value="this_week">Questa settimana</SelectItem>
                    <SelectItem value="this_month">Questo mese</SelectItem>
                    <SelectItem value="last_3_months">Ultimi 3 mesi</SelectItem>
                    <SelectItem value="this_year">Anno in corso</SelectItem>
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
                    <SelectItem value="under_100">Fino a 100 €</SelectItem>
                    <SelectItem value="100_300">100 € – 300 €</SelectItem>
                    <SelectItem value="over_300">Oltre 300 €</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Reset Filtri Bar */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
              <span className="text-muted-foreground">
                Trovati <strong className="text-foreground">{filteredRows.length}</strong>{" "}
                interventi su {allInterventions.length}
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

        {/* Modalità Lista / Tabella Interventi con Checkbox e Anteprima PDF */}
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="w-12 pl-4">
                  <Checkbox
                    checked={filteredRows.length > 0 && selectedIds.length === filteredRows.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Seleziona tutti"
                  />
                </TableHead>
                <TableHead className="font-semibold text-foreground py-3">Numero</TableHead>
                <TableHead className="font-semibold text-foreground py-3">Cliente</TableHead>
                <TableHead className="font-semibold text-foreground py-3">
                  Descrizione / Lavorazione
                </TableHead>
                <TableHead className="font-semibold text-foreground py-3">Data</TableHead>
                <TableHead className="font-semibold text-foreground py-3 text-right">
                  Totale
                </TableHead>
                <TableHead className="font-semibold text-foreground py-3 text-center">
                  Stato
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
                        <p>Nessun intervento corrisponde ai filtri impostati.</p>
                        <Button variant="outline" size="sm" onClick={resetFilters}>
                          Reimposta filtri
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Wrench className="size-8 text-muted-foreground/40" />
                        <p>Nessun intervento registrato. Crea il primo rapportino di lavoro.</p>
                        <Button size="sm" onClick={openNew}>
                          <Plus className="mr-1.5 size-4" /> Nuovo intervento
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row: any) => {
                  const client = allClients.find((c: any) => c.id === row.client_id);
                  const total = calculateTotal(row);
                  const isSelected = selectedIds.includes(row.id);

                  return (
                    <TableRow
                      key={row.id}
                      className={`hover:bg-muted/40 transition-colors border-b border-border/60 ${
                        isSelected ? "bg-muted/50" : ""
                      }`}
                    >
                      {/* Checkbox selezione riga */}
                      <TableCell className="w-12 pl-4 py-3.5">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectOne(row.id)}
                          aria-label={`Seleziona intervento ${row.number}`}
                        />
                      </TableCell>

                      {/* Numero */}
                      <TableCell className="py-3.5">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(row)}
                          className="flex items-center gap-2 font-semibold text-foreground hover:text-primary transition-colors text-left cursor-pointer"
                        >
                          <Wrench className="size-4 text-primary shrink-0" />
                          <span>{row.number || "INT"}</span>
                        </button>
                      </TableCell>

                      {/* Cliente */}
                      <TableCell className="py-3.5">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground truncate">
                            {client?.name ?? "Senza cliente"}
                          </p>
                          {row.cantiere ? (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {row.cantiere}
                            </p>
                          ) : null}
                          {client?.city || client?.phone ? (
                            <p className="text-xs text-muted-foreground truncate">
                              {[client?.city, client?.phone].filter(Boolean).join(" · ")}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>

                      {/* Descrizione / Lavorazione */}
                      <TableCell className="py-3.5">
                        <div className="min-w-0 max-w-md">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(row)}
                            className="font-medium text-foreground hover:text-primary transition-colors text-left truncate block cursor-pointer"
                          >
                            {row.title || row.description || "Intervento senza titolo"}
                          </button>
                          {row.technician ? (
                            <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                              <User className="size-3" /> Tecnico: {row.technician}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>

                      {/* Data */}
                      <TableCell className="py-3.5 text-sm text-muted-foreground whitespace-nowrap">
                        <span className="flex items-center gap-1.5">
                          <Calendar className="size-3.5 text-muted-foreground/60" />
                          {formatDate(row.date)}
                        </span>
                      </TableCell>

                      {/* Importo Totale */}
                      <TableCell className="py-3.5 text-right whitespace-nowrap">
                        <p className="font-bold text-foreground text-sm">{formatCurrency(total)}</p>
                        <p className="text-[10px] text-muted-foreground">IVA inc.</p>
                      </TableCell>

                      {/* Stato con Cambio Rapido */}
                      <TableCell className="py-3.5 text-center">
                        <Select
                          value={row.status || "aperto"}
                          onValueChange={(val) => handleQuickStatusChange(row, val)}
                        >
                          <SelectTrigger className="h-7 w-auto border-0 shadow-none bg-transparent hover:bg-muted/40 p-0 focus:ring-0">
                            {getStatusBadge(row.status || "aperto")}
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="aperto">Aperto</SelectItem>
                            <SelectItem value="in corso">In corso</SelectItem>
                            <SelectItem value="completato">Completato</SelectItem>
                            <SelectItem value="fatturato">Fatturato</SelectItem>
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
                            onClick={() => handleOpenPreview(row)}
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
                              onClick={() => openWhatsApp(client.phone, client.name, row)}
                              className="size-8 text-[#25D366] hover:bg-[#25D366]/15 hover:text-[#20BA5A] transition-colors cursor-pointer"
                              title="Contatta cliente su WhatsApp"
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
                            onClick={() => handleDuplicate(row)}
                            className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Duplica intervento"
                          >
                            <Copy className="size-4" />
                          </Button>

                          {/* Modifica */}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenEdit(row)}
                            className="size-8 text-muted-foreground hover:text-foreground cursor-pointer"
                            title="Modifica intervento"
                          >
                            <Pencil className="size-4" />
                          </Button>

                          {/* Elimina */}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Eliminare il rapportino ${row.number || ""}?`)) {
                                remove.mutate(row.id);
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
                {filteredRows.length} {filteredRows.length === 1 ? "intervento" : "interventi"}
                {selectedIds.length > 0 ? ` · ${selectedIds.length} selezionati` : ""}
              </span>
            </div>
            <span className="font-semibold text-foreground">
              Totale:{" "}
              {formatCurrency(filteredRows.reduce((s: number, r: any) => s + calculateTotal(r), 0))}
            </span>
          </div>
        </div>
      </div>

      {/* Creazione Rapida Intervento */}
      <DocCreateModal
        open={createModalOpen}
        onOpenChange={setCreateModalOpen}
        docType="intervento"
        docLabel="Intervento"
        clients={allClients}
        company={{
          ...company.data,
          default_vat_rate: Number(company.data?.default_vat_rate ?? 22),
          default_template: (company.data?.default_template as DocTemplate) ?? "classico",
        }}
        onConfirm={handleConfirmCreate}
      />

      {/* Editor Documento */}
      {form ? (
        <DocumentEditor
          open={open}
          onOpenChange={setOpen}
          docLabel="Rapporto di intervento"
          secondaryDateLabel="Data chiusura"
          statuses={STATUSES as unknown as string[]}
          withBody
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
