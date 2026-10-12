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
  InterventoQuickCreateModal,
  type InterventoQuickInitialData,
} from "@/components/interventi/InterventoQuickCreateModal";
import { InterventoInlineEditor } from "@/components/interventi/InterventoInlineEditor";
import { DEFAULT_COMPANY, useCompany, useList, useRemove, useSave } from "@/hooks/data";
import { usePaymentMethods } from "@/hooks/usePaymentMethods";
import { docTotals, emptyItem, formatCurrency, formatDate, nextNumber } from "@/lib/doc";
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

  // Intervento correntemente in compilazione diretta inline (senza modale esterna)
  const [editingIntervention, setEditingIntervention] = useState<any | null>(null);

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
  const [clientFilter, setClientFilter] = useState<string>("all");
  const [techFilter, setTechFilter] = useState<string>("all");
  const [amountFilter, setAmountFilter] = useState<string>("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const todayStr = new Date().toISOString().slice(0, 10);
  const today = useMemo(() => new Date(), []);

  const prefix = company.data?.intervention_prefix || "INT";
  const defaultVatRate = Number(company.data?.default_vat_rate ?? 22);

  const toItems = (row: any): DocItem[] => {
    if (row.items && Array.isArray(row.items) && row.items.length > 0) {
      return row.items;
    }
    return [
      {
        description: `Manodopera (${row.hours ?? 1} h)`,
        qty: Number(row.hours ?? 1),
        unit_price: Number(row.hourly_rate ?? 35),
      },
      {
        description: "Materiali e ricambi impiegati",
        qty: 1,
        unit_price: Number(row.materials_cost ?? 0),
      },
    ];
  };

  const calculateTotal = useCallback(
    (row: any) => {
      const itms = toItems(row);
      const vr = Number(row.vat_rate ?? defaultVatRate);
      return docTotals(itms, vr).total;
    },
    [defaultVatRate],
  );

  // Apertura scheda rapida
  const handleOpenQuickCreate = () => {
    setQuickCreateOpen(true);
  };

  // Conferma scheda rapida: crea l'intervento e lo apre inline
  const handleQuickCreateConfirm = async (data: InterventoQuickInitialData) => {
    setQuickCreateOpen(false);
    const existingNumbers = (interventions.data ?? []).map((i: any) => i.number);
    const number = nextNumber(prefix, existingNumbers);

    const initialItems: DocItem[] = [
      {
        description: "Manodopera tecnica specializzata (1 h)",
        qty: 1,
        unit_price: 45,
      },
    ];

    const newIntervention: any = {
      client_id: data.client_id,
      number,
      date: data.date,
      secondary_date: null,
      items: initialItems,
      vat_rate: defaultVatRate,
      notes: "",
      exclusions: "",
      payment_conditions: "",
      status: "aperto",
      template: (company.data?.default_template as DocTemplate) || "classico",
      title: data.title,
      body: "",
      cantiere: data.cantiere,
      technician: data.technician || "Maurizio Tanforti",
      payment_method_id: defaultMethod?.id,
      payment_method: defaultMethod?.typeLabel,
      payment_iban: defaultMethod?.iban ?? "",
    };

    try {
      const res = await save.mutateAsync({
        client_id: newIntervention.client_id,
        number: newIntervention.number,
        title: newIntervention.title || `Intervento ${number}`,
        description: "",
        date: newIntervention.date,
        hours: 1,
        hourly_rate: 45,
        materials_cost: 0,
        items: newIntervention.items,
        vat_rate: newIntervention.vat_rate,
        notes: newIntervention.notes,
        status: newIntervention.status,
        template: newIntervention.template,
        cantiere: newIntervention.cantiere,
        technician: newIntervention.technician,
        payment_method_id: newIntervention.payment_method_id,
        payment_method: newIntervention.payment_method,
        payment_iban: newIntervention.payment_iban,
      });

      setEditingIntervention({
        ...newIntervention,
        id: (res as any)?.id,
      });
      toast.success(`Intervento ${number} creato. Ora puoi compilarlo direttamente qui.`);
    } catch {
      toast.error("Errore durante la creazione dell'intervento.");
    }
  };

  // Salvataggio dell'intervento compilato inline
  const handleSaveIntervention = async (val: any) => {
    try {
      const labour = val.items?.[0];
      const materials = val.items?.[1];

      await save.mutateAsync({
        id: val.id,
        client_id: val.client_id,
        number: val.number,
        title: val.title || val.body?.split("\n")[0]?.slice(0, 80) || `Intervento ${val.number}`,
        description: val.body ?? "",
        date: val.date,
        hours: Number(labour?.qty ?? 1),
        hourly_rate: Number(labour?.unit_price ?? 35),
        materials_cost: Number(materials?.unit_price ?? 0),
        items: val.items,
        vat_rate: val.vat_rate,
        notes: val.notes,
        exclusions: val.exclusions,
        payment_conditions: val.payment_conditions,
        status: val.status,
        template: val.template,
        cantiere: val.cantiere,
        technician: val.technician,
        payment_method_id: val.payment_method_id,
        payment_method: val.payment_method,
        payment_iban: val.payment_iban,
      });
      toast.success(`Intervento ${val.number} salvato con successo.`);
    } catch {
      toast.error("Errore durante il salvataggio dell'intervento.");
    }
  };

  // Apertura di un intervento esistente per modifica inline
  const handleOpenEditInline = (row: any) => {
    setEditingIntervention({
      id: row.id,
      client_id: row.client_id,
      number: row.number,
      date: row.date,
      secondary_date: null,
      items: toItems(row),
      vat_rate: Number(row.vat_rate ?? defaultVatRate),
      notes: row.notes || "",
      exclusions: row.exclusions || "",
      payment_conditions: row.payment_conditions || "",
      status: row.status || "aperto",
      template: (row.template as DocTemplate) || "classico",
      title: row.title || "",
      body: row.description || row.body || "",
      cantiere: row.cantiere || "",
      technician: row.technician || "Maurizio Tanforti",
      payment_method_id: row.payment_method_id,
      payment_method: row.payment_method,
      payment_iban: row.payment_iban,
    });
  };

  // Duplicazione di un intervento
  const handleDuplicate = async (row: any) => {
    const existingNumbers = (interventions.data ?? []).map((item: any) => item.number);
    const newNumber = nextNumber(prefix, existingNumbers);

    const duplicatedIntervention: any = {
      client_id: row.client_id,
      number: newNumber,
      date: todayStr,
      secondary_date: null,
      items: toItems(row),
      vat_rate: Number(row.vat_rate ?? defaultVatRate),
      notes: row.notes || "",
      exclusions: row.exclusions || "",
      payment_conditions: row.payment_conditions || "",
      status: "aperto",
      template: (row.template as DocTemplate) || "classico",
      title: row.title ? `${row.title} (Copia)` : `Intervento ${newNumber}`,
      body: row.description || row.body || "",
      cantiere: row.cantiere || "",
      technician: row.technician || "Maurizio Tanforti",
      payment_method_id: row.payment_method_id || defaultMethod?.id,
      payment_method: row.payment_method || defaultMethod?.typeLabel,
      payment_iban: row.payment_iban ?? defaultMethod?.iban ?? "",
    };

    try {
      const res = await save.mutateAsync({
        client_id: duplicatedIntervention.client_id,
        number: duplicatedIntervention.number,
        title: duplicatedIntervention.title,
        description: duplicatedIntervention.body,
        date: duplicatedIntervention.date,
        items: duplicatedIntervention.items,
        vat_rate: duplicatedIntervention.vat_rate,
        notes: duplicatedIntervention.notes,
        exclusions: duplicatedIntervention.exclusions,
        payment_conditions: duplicatedIntervention.payment_conditions,
        status: duplicatedIntervention.status,
        template: duplicatedIntervention.template,
        cantiere: duplicatedIntervention.cantiere,
        technician: duplicatedIntervention.technician,
        payment_method_id: duplicatedIntervention.payment_method_id,
        payment_method: duplicatedIntervention.payment_method,
        payment_iban: duplicatedIntervention.payment_iban,
      });

      setEditingIntervention({
        ...duplicatedIntervention,
        id: (res as any)?.id,
      });
      toast.success(`Intervento duplicato con numero ${newNumber}.`);
    } catch {
      toast.error("Errore durante la duplicazione dell'intervento.");
    }
  };

  // Anteprima PDF
  const handleOpenPreview = (row: any) => {
    const client = (clients.data ?? []).find((c: any) => c.id === row.client_id);
    setPreviewData({
      docLabel: "Rapporto di Intervento",
      number: row.number,
      date: row.date,
      secondaryDateLabel: "Data fine lavori",
      secondaryDate: null,
      template: (row.template as DocTemplate) || "classico",
      clientName: client?.name ?? "Cliente",
      clientLines: [
        client?.address ?? "",
        [client?.zip, client?.city].filter(Boolean).join(" "),
        client?.vat_number ? `P.IVA/CF ${client.vat_number}` : "",
        client?.email ?? "",
      ],
      items: toItems(row),
      vatRate: Number(row.vat_rate ?? defaultVatRate),
      notes: row.notes || "",
      exclusions: row.exclusions || "",
      paymentConditions: row.payment_conditions || "",
      bodyText: row.description || row.title || undefined,
      title: row.title,
      cantiere: row.cantiere,
      paymentMethod: row.payment_method || defaultMethod?.typeLabel,
      paymentIban: row.payment_iban ?? defaultMethod?.iban ?? "",
    });
    setPreviewOpen(true);
  };

  const handleOpenPreviewFromInline = (val: any) => {
    const client = (clients.data ?? []).find((c: any) => c.id === val.client_id);
    setPreviewData({
      docLabel: "Rapporto di Intervento",
      number: val.number,
      date: val.date,
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

  const toggleSelectRow = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
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
    const set = new Set<string>();
    for (const row of allInterventions) {
      if (row.technician?.trim()) set.add(row.technician.trim());
    }
    return Array.from(set).sort();
  }, [allInterventions]);

  // Indicatori rapidi (KPI)
  const stats = useMemo(() => {
    let countAperti = 0;
    let countInCorso = 0;
    let countCompletati = 0;
    let countFatturati = 0;
    let totalValue = 0;

    for (const row of allInterventions) {
      const tot = calculateTotal(row);
      totalValue += tot;
      if (row.status === "completato") countCompletati++;
      else if (row.status === "in corso") countInCorso++;
      else if (row.status === "fatturato") countFatturati++;
      else countAperti++;
    }

    return {
      total: allInterventions.length,
      aperti: countAperti,
      inCorso: countInCorso,
      completati: countCompletati,
      fatturati: countFatturati,
      totalValue,
    };
  }, [allInterventions, calculateTotal]);

  // Filtraggio avanzato
  const filteredRows = useMemo(() => {
    return allInterventions.filter((row: any) => {
      const q = search.toLowerCase();
      const client = allClients.find((c: any) => c.id === row.client_id);
      const clientName = (client?.name || "").toLowerCase();
      const num = (row.number || "").toLowerCase();
      const title = (row.title || "").toLowerCase();
      const desc = (row.description || "").toLowerCase();
      const tech = (row.technician || "").toLowerCase();

      if (
        search &&
        !clientName.includes(q) &&
        !num.includes(q) &&
        !title.includes(q) &&
        !desc.includes(q) &&
        !tech.includes(q)
      ) {
        return false;
      }

      if (statusFilter !== "all" && row.status !== statusFilter) return false;
      if (clientFilter !== "all" && row.client_id !== clientFilter) return false;
      if (techFilter !== "all" && row.technician !== techFilter) return false;

      if (amountFilter !== "all") {
        const val = calculateTotal(row);
        if (amountFilter === "under_150" && val >= 150) return false;
        if (amountFilter === "150_500" && (val < 150 || val > 500)) return false;
        if (amountFilter === "over_500" && val <= 500) return false;
      }

      if (periodFilter !== "all" && row.date) {
        const d = new Date(row.date);
        const diffDays = (today.getTime() - d.getTime()) / (1000 * 3600 * 24);

        if (periodFilter === "today" && diffDays > 1) return false;
        if (periodFilter === "week" && diffDays > 7) return false;
        if (periodFilter === "month" && diffDays > 30) return false;
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
  ]);

  const hasActiveFilters =
    search.trim() !== "" ||
    statusFilter !== "all" ||
    clientFilter !== "all" ||
    techFilter !== "all" ||
    amountFilter !== "all" ||
    periodFilter !== "all";

  const activeFilterCount =
    (statusFilter !== "all" ? 1 : 0) +
    (clientFilter !== "all" ? 1 : 0) +
    (techFilter !== "all" ? 1 : 0) +
    (amountFilter !== "all" ? 1 : 0) +
    (periodFilter !== "all" ? 1 : 0);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setClientFilter("all");
    setTechFilter("all");
    setAmountFilter("all");
    setPeriodFilter("all");
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
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
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
            <Clock className="size-3" /> Aperto
          </span>
        );
    }
  };

  // Se è in corso la compilazione di un intervento, mostriamo l'editor direttamente nella sezione!
  if (editingIntervention) {
    const editingClient = allClients.find((c: any) => c.id === editingIntervention.client_id);
    return (
      <AppLayout
        title={`Intervento ${editingIntervention.number}`}
        description={`Compilazione diretta rapporto di lavoro per ${editingClient?.name || "cliente"}`}
      >
        <InterventoInlineEditor
          value={editingIntervention}
          onChange={setEditingIntervention}
          onSave={() => handleSaveIntervention(editingIntervention)}
          onBack={() => setEditingIntervention(null)}
          company={company.data ?? DEFAULT_COMPANY}
          clients={allClients}
          saving={save.isPending}
          onDuplicate={() => handleDuplicate(editingIntervention)}
          onDelete={async () => {
            if (
              editingIntervention.id &&
              confirm(`Eliminare l'intervento ${editingIntervention.number}?`)
            ) {
              await remove.mutateAsync(editingIntervention.id);
              setEditingIntervention(null);
              toast.success("Intervento eliminato.");
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
      title="Interventi"
      description="Rapporti di lavoro, manutenzioni e pronto intervento idraulico con PDF in tempo reale."
      actions={
        <Button
          onClick={handleOpenQuickCreate}
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
              <span className="text-xs font-medium">Totale interventi</span>
              <Wrench className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums mt-1">
                {stats.total}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground/80 mt-0.5 truncate">
                Valore stimato {formatCurrency(stats.totalValue)}
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("aperto")}
            className={`rounded-xl border p-3.5 sm:p-4 text-left transition-all bg-card shadow-xs flex flex-col justify-between min-h-[96px] sm:min-h-[104px] ${
              statusFilter === "aperto"
                ? "border-amber-500 ring-1 ring-amber-500/20 shadow-xs"
                : "border-border hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Da eseguire</span>
              <Clock className="size-4 text-amber-500" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400 font-mono tabular-nums mt-1">
                {stats.aperti}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground/80 mt-0.5 truncate">
                Interventi aperti
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("in corso")}
            className={`rounded-xl border p-3.5 sm:p-4 text-left transition-all bg-card shadow-xs flex flex-col justify-between min-h-[96px] sm:min-h-[104px] ${
              statusFilter === "in corso"
                ? "border-blue-500 ring-1 ring-blue-500/20 shadow-xs"
                : "border-border hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">In lavorazione</span>
              <Wrench className="size-4 text-blue-500" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono tabular-nums mt-1">
                {stats.inCorso}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground/80 mt-0.5 truncate">
                In corso sui cantieri
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
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Completati</span>
              <CheckCircle2 className="size-4 text-emerald-500" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1">
                {stats.completati}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground/80 mt-0.5 truncate">
                Pronti per fatturazione
              </p>
            </div>
          </button>
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
                  placeholder="Cerca intervento, cliente, tecnico o oggetto..."
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
                      <SelectItem value="aperto">Aperto</SelectItem>
                      <SelectItem value="in corso">In corso</SelectItem>
                      <SelectItem value="completato">Completato</SelectItem>
                      <SelectItem value="fatturato">Fatturato</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Filtro Tecnico */}
                  <Select value={techFilter} onValueChange={setTechFilter}>
                    <SelectTrigger className="h-9 text-xs w-[130px] bg-background border-border">
                      <SelectValue placeholder="Tecnico" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti i tecnici</SelectItem>
                      {technicians.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Filtro Periodo */}
                  <Select value={periodFilter} onValueChange={setPeriodFilter}>
                    <SelectTrigger className="h-9 text-xs w-[130px] bg-background border-border">
                      <SelectValue placeholder="Periodo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutto il periodo</SelectItem>
                      <SelectItem value="today">Oggi</SelectItem>
                      <SelectItem value="week">Ultimi 7 giorni</SelectItem>
                      <SelectItem value="month">Ultimi 30 giorni</SelectItem>
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
                    <SelectItem value="aperto">Aperto</SelectItem>
                    <SelectItem value="in corso">In corso</SelectItem>
                    <SelectItem value="completato">Completato</SelectItem>
                    <SelectItem value="fatturato">Fatturato</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={techFilter} onValueChange={setTechFilter}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Tecnico" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i tecnici</SelectItem>
                    {technicians.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Periodo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutto il periodo</SelectItem>
                    <SelectItem value="today">Oggi</SelectItem>
                    <SelectItem value="week">Ultimi 7 giorni</SelectItem>
                    <SelectItem value="month">Ultimi 30 giorni</SelectItem>
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
                  {selectedIds.length === 1 ? "intervento selezionato" : "interventi selezionati"}
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

          {/* Tabella Interventi */}
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-10 text-center">
                  <Checkbox
                    checked={selectedIds.length === filteredRows.length && filteredRows.length > 0}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Seleziona tutti"
                  />
                </TableHead>
                <TableHead className="w-[110px]">Numero</TableHead>
                <TableHead className="w-[100px]">Data</TableHead>
                <TableHead>Cliente & Lavori</TableHead>
                <TableHead className="w-[120px]">Tecnico</TableHead>
                <TableHead className="w-[110px] text-right">Totale</TableHead>
                <TableHead className="w-[130px]">Stato</TableHead>
                <TableHead className="w-[150px] text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    <Wrench className="size-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">Nessun intervento trovato</p>
                    <p className="text-xs mt-0.5">
                      {hasActiveFilters
                        ? "Prova a modificare i filtri applicati."
                        : "Crea il tuo primo rapporto cliccando su 'Nuovo intervento'."}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((row: any) => {
                  const client = allClients.find((c: any) => c.id === row.client_id);
                  const isSelected = selectedIds.includes(row.id);
                  const tot = calculateTotal(row);

                  return (
                    <TableRow
                      key={row.id}
                      className={cn(
                        "group hover:bg-muted/30 transition-colors cursor-pointer",
                        isSelected && "bg-primary/5",
                      )}
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest("button, input, [role=checkbox], a"))
                          return;
                        handleOpenEditInline(row);
                      }}
                    >
                      <TableCell className="text-center" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectRow(row.id)}
                          aria-label={`Seleziona ${row.number}`}
                        />
                      </TableCell>

                      <TableCell className="font-mono font-semibold text-foreground text-xs sm:text-sm">
                        {row.number}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {formatDate(row.date)}
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
                        {(row.title || row.description) && (
                          <div className="text-xs text-muted-foreground truncate max-w-xs sm:max-w-md">
                            {row.title || row.description}
                          </div>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {row.technician || "—"}
                      </TableCell>

                      <TableCell className="text-right font-mono font-semibold text-foreground text-xs sm:text-sm whitespace-nowrap">
                        {formatCurrency(tot)}
                      </TableCell>

                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <button
                              type="button"
                              className="focus:outline-none cursor-pointer flex items-center gap-1"
                            >
                              {getStatusBadge(row.status)}
                              <ChevronDown className="size-3 text-muted-foreground opacity-60" />
                            </button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="start">
                            <DropdownMenuItem
                              onClick={() => handleQuickStatusChange(row, "aperto")}
                            >
                              Aperto
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleQuickStatusChange(row, "in corso")}
                            >
                              In corso
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleQuickStatusChange(row, "completato")}
                            >
                              Completato
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleQuickStatusChange(row, "fatturato")}
                            >
                              Fatturato
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
                            onClick={() => handleOpenEditInline(row)}
                            className="size-8 text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
                            title="Compila / Modifica rapporto"
                          >
                            <Pencil className="size-4" />
                          </Button>

                          {/* Anteprima PDF */}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenPreview(row)}
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
                              onClick={() => openWhatsApp(client.phone, client.name, row)}
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
                            onClick={() => handleDuplicate(row)}
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
                              if (confirm(`Eliminare l'intervento ${row.number}?`)) {
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
      <InterventoQuickCreateModal
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
