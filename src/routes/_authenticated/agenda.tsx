import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Clock,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  Check,
  User,
  Pencil,
  Wrench,
  Search,
  FileText,
  X,
  ExternalLink,
  CalendarClock,
  AlertCircle,
  Phone,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
import { KPISummaryCard } from "@/components/KPISummaryCard";
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useList, useRemove, useSave } from "@/hooks/data";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/agenda")({
  component: AgendaPage,
});

const STATUSES = ["programmato", "confermato", "in attesa", "completato", "annullato"] as const;
const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function getStartOfWeek(date: Date) {
  const d = new Date(date);
  const day = d.getDay();
  // Lunedì come primo giorno della settimana (day === 0 è Domenica)
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function toLocalInput(date: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(
    date.getHours(),
  )}:${pad(date.getMinutes())}`;
}

function formatTimeOnly(isoString: string) {
  try {
    const d = new Date(isoString);
    return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "--:--";
  }
}

function getEndTimeString(isoString: string, durationMin?: number) {
  try {
    const start = new Date(isoString);
    const end = new Date(start.getTime() + (durationMin || 60) * 60 * 1000);
    return end.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
  } catch {
    return "--:--";
  }
}

function getStatusBadge(status: string) {
  switch (status) {
    case "completato":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
          <CheckCircle2 className="size-3" /> Completato
        </span>
      );
    case "confermato":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
          <Clock className="size-3" /> Confermato
        </span>
      );
    case "annullato":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
          <X className="size-3" /> Annullato
        </span>
      );
    case "in attesa":
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800">
          <Clock className="size-3" /> In attesa
        </span>
      );
    case "programmato":
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800">
          <AlertCircle className="size-3" /> Programmato
        </span>
      );
  }
}

function getStatusBorderClass(status: string) {
  switch (status) {
    case "completato":
      return "border-l-3 sm:border-l-4 border-l-emerald-500";
    case "confermato":
      return "border-l-3 sm:border-l-4 border-l-amber-500";
    case "annullato":
      return "border-l-3 sm:border-l-4 border-l-rose-500";
    case "in attesa":
      return "border-l-3 sm:border-l-4 border-l-purple-500";
    case "programmato":
    default:
      return "border-l-3 sm:border-l-4 border-l-blue-500";
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function AgendaPage() {
  const appointments = useList<any>("appointments");
  const clients = useList<any>("clients");
  const save = useSave("appointments");
  const remove = useRemove("appointments");

  // Navigazione calendario & date
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => new Date());
  const [dateFilterMode, setDateFilterMode] = useState<"tutti" | "oggi" | "settimana" | "giorno">(
    "settimana",
  );

  // Dialog mese completo
  const [monthCursor, setMonthCursor] = useState(() => new Date());
  const [monthDialogOpen, setMonthDialogOpen] = useState(false);

  // Ricerca e filtri
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("tutti");

  // Form nuovo / modifica appuntamento
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(null);

  const rows: any[] = useMemo(() => appointments.data ?? [], [appointments.data]);
  const clientsMap = useMemo(() => {
    const map = new Map<string, any>();
    (clients.data ?? []).forEach((c: any) => {
      map.set(c.id, c);
    });
    return map;
  }, [clients.data]);

  // Calcolo dei giorni per il mese aperto nel dialog (42 giorni)
  const monthDays = useMemo(() => {
    const first = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - offset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [monthCursor]);

  // Gestione navigazione periodo
  const handlePrevPeriod = () => {
    if (dateFilterMode === "giorno" || dateFilterMode === "oggi") {
      setSelected((prev) => {
        const next = new Date(prev);
        next.setDate(prev.getDate() - 1);
        return next;
      });
      setDateFilterMode("giorno");
    } else {
      setCursor((prev) => {
        const next = new Date(prev);
        next.setDate(prev.getDate() - 7);
        return next;
      });
      setDateFilterMode("settimana");
    }
  };

  const handleNextPeriod = () => {
    if (dateFilterMode === "giorno" || dateFilterMode === "oggi") {
      setSelected((prev) => {
        const next = new Date(prev);
        next.setDate(prev.getDate() + 1);
        return next;
      });
      setDateFilterMode("giorno");
    } else {
      setCursor((prev) => {
        const next = new Date(prev);
        next.setDate(prev.getDate() + 7);
        return next;
      });
      setDateFilterMode("settimana");
    }
  };

  const handleSelectToday = () => {
    const today = new Date();
    setSelected(today);
    setCursor(today);
    setDateFilterMode("oggi");
  };

  const handleOpenMonthDialog = () => {
    setMonthCursor(new Date(selected));
    setMonthDialogOpen(true);
  };

  const handleSelectDayFromMonth = (d: Date) => {
    setSelected(new Date(d));
    setCursor(new Date(d));
    setDateFilterMode("giorno");
    setMonthDialogOpen(false);
  };

  // Statistiche generali (KPI cards identiche a Interventi / Preventivi)
  const stats = useMemo(() => {
    const today = new Date();
    const todayCount = rows.filter((a) => sameDay(new Date(a.starts_at), today)).length;
    const confirmedCount = rows.filter((a) => a.status === "confermato").length;
    const completedCount = rows.filter((a) => a.status === "completato").length;

    return {
      all: rows.length,
      today: todayCount,
      confirmed: confirmedCount,
      completed: completedCount,
    };
  }, [rows]);

  // Etichetta periodo corrente selezionato
  const currentPeriodLabel = useMemo(() => {
    if (dateFilterMode === "tutti") return "Tutti gli appuntamenti";
    if (dateFilterMode === "oggi") {
      return `Oggi, ${new Date().toLocaleDateString("it-IT", {
        weekday: "short",
        day: "numeric",
        month: "short",
      })}`;
    }
    if (dateFilterMode === "giorno") {
      return selected.toLocaleDateString("it-IT", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
    }
    // settimana
    const start = getStartOfWeek(cursor);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    const startMonth = start.toLocaleDateString("it-IT", { month: "short" });
    const endMonth = end.toLocaleDateString("it-IT", { month: "short" });
    const year = end.getFullYear();
    if (startMonth === endMonth) {
      return `Settimana ${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString("it-IT", { month: "long" })} ${year}`;
    }
    return `Settimana ${start.getDate()} ${startMonth} - ${end.getDate()} ${endMonth} ${year}`;
  }, [dateFilterMode, cursor, selected]);

  // Filtraggio lista appuntamenti
  const filteredAppointments = useMemo(() => {
    return rows
      .filter((a) => {
        // Filtro data
        const d = new Date(a.starts_at);
        if (dateFilterMode === "oggi") {
          if (!sameDay(d, new Date())) return false;
        } else if (dateFilterMode === "giorno") {
          if (!sameDay(d, selected)) return false;
        } else if (dateFilterMode === "settimana") {
          const startWeek = getStartOfWeek(cursor);
          const endWeek = new Date(startWeek);
          endWeek.setDate(startWeek.getDate() + 7);
          if (d < startWeek || d >= endWeek) return false;
        }

        // Filtro stato
        if (statusFilter !== "tutti" && a.status !== statusFilter) {
          return false;
        }

        // Ricerca testuale
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const client = clientsMap.get(a.client_id);
          const clientName = client?.name?.toLowerCase() || "";
          const clientPhone = client?.phone || "";
          const title = a.title?.toLowerCase() || "";
          const address = a.address?.toLowerCase() || "";
          const notes = a.notes?.toLowerCase() || "";
          const matches =
            title.includes(q) ||
            clientName.includes(q) ||
            clientPhone.includes(q) ||
            address.includes(q) ||
            notes.includes(q);
          if (!matches) return false;
        }

        return true;
      })
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [rows, dateFilterMode, cursor, selected, statusFilter, searchQuery, clientsMap]);

  // Apri modale per nuovo appuntamento
  const openNew = (dateToUse?: Date) => {
    const d = new Date(dateToUse || selected);
    d.setHours(9, 0, 0, 0);
    setForm({
      id: undefined,
      client_id: null,
      title: "",
      starts_at: toLocalInput(d),
      duration_min: 60,
      address: "",
      notes: "",
      status: "programmato",
    });
    setOpen(true);
  };

  const handleSelectClient = (clientId: string) => {
    const client = clientsMap.get(clientId);
    setForm((prev: any) => ({
      ...prev,
      client_id: clientId,
      address: client?.address
        ? `${client.address}${client.city ? `, ${client.city}` : ""}`
        : prev.address,
    }));
  };

  const submit = async () => {
    if (!form.title.trim()) return toast.error("Inserisci il titolo dell'appuntamento.");
    try {
      await save.mutateAsync({
        ...form,
        starts_at: new Date(form.starts_at).toISOString(),
        duration_min: Number(form.duration_min) || 60,
      });
      toast.success(
        form.id ? "Appuntamento modificato con successo." : "Appuntamento creato con successo.",
      );
      setOpen(false);
    } catch {
      toast.error("Salvataggio non riuscito.");
    }
  };

  const handleQuickStatusChange = async (appointment: any, newStatus: string) => {
    try {
      await save.mutateAsync({
        ...appointment,
        status: newStatus,
      });
      toast.success(`Stato aggiornato a "${newStatus}".`);
    } catch {
      toast.error("Errore durante l'aggiornamento dello stato.");
    }
  };

  const handleSendWhatsApp = (appointment: any) => {
    const client = clientsMap.get(appointment.client_id);
    if (!client?.phone) {
      toast.error("Nessun numero di telefono presente per questo cliente.");
      return;
    }
    let clean = client.phone.replace(/[^0-9]/g, "");
    if (clean.length === 10 && clean.startsWith("3")) {
      clean = `39${clean}`;
    }
    const d = new Date(appointment.starts_at);
    const dateFormatted = d.toLocaleDateString("it-IT", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
    const timeFormatted = formatTimeOnly(appointment.starts_at);
    const msg = `Salve ${client.name || ""}, le ricordiamo l'appuntamento con Azienda Demo Srl programmato per ${dateFormatted} alle ore ${timeFormatted} per: ${appointment.title || "intervento"}. Restiamo a disposizione per qualsiasi informazione o conferma.`;
    const url = `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  return (
    <AppLayout
      title="Agenda"
      description="Pianificazione interventi, appuntamenti e sopralluoghi tecnici a Roma."
      actions={
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Tasto per aprire e visualizzare tutto il mese */}
          <Button
            type="button"
            variant="outline"
            onClick={handleOpenMonthDialog}
            className="h-9 px-2.5 sm:px-3 gap-1.5 text-xs sm:text-sm font-medium border-border/80 bg-card hover:bg-muted/50 rounded-lg cursor-pointer shadow-xs shrink-0"
            title="Apri calendario mensile completo"
          >
            <Calendar className="size-4 text-primary" />
            <span className="hidden sm:inline">Calendario mese</span>
            <span className="sm:hidden text-xs">Mese</span>
          </Button>

          <Button
            onClick={() => openNew(selected)}
            className="h-9 px-3 sm:px-4 text-xs sm:text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs rounded-lg gap-1.5 shrink-0 cursor-pointer"
          >
            <div className="flex items-center gap-1">
              <Plus className="size-3.5 stroke-[2.5]" />
              <CalendarDays className="size-4" />
            </div>
            <span className="hidden sm:inline">Nuovo appuntamento</span>
            <span className="sm:hidden text-xs">Nuovo</span>
          </Button>
        </div>
      }
    >
      <div className="space-y-4 sm:space-y-5 w-full max-w-full min-w-0">
        {/* ======================================================== */}
        {/* 1. INDICATORI RAPIDI (KPI OVERVIEW IDENTICO AL RESTO)     */}
        {/* ======================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full min-w-0">
          <KPISummaryCard
            label="Tutti gli appuntamenti"
            value={stats.all}
            hint="Totale pianificati"
            icon={CalendarDays}
            tone="primary"
            isActive={dateFilterMode === "tutti" && statusFilter === "tutti"}
            onClick={() => {
              setDateFilterMode("tutti");
              setStatusFilter("tutti");
            }}
          />
          <KPISummaryCard
            label="In programma oggi"
            value={stats.today}
            hint="Fissati per oggi"
            icon={Calendar}
            tone="blue"
            isActive={dateFilterMode === "oggi"}
            onClick={() => {
              handleSelectToday();
              setStatusFilter("tutti");
            }}
          />
          <KPISummaryCard
            label="Confermati"
            value={stats.confirmed}
            hint="Pronti per intervento"
            icon={CheckCircle2}
            tone="amber"
            isActive={statusFilter === "confermato"}
            onClick={() => setStatusFilter(statusFilter === "confermato" ? "tutti" : "confermato")}
          />
          <KPISummaryCard
            label="Completati"
            value={stats.completed}
            hint="Interventi conclusi"
            icon={Check}
            tone="emerald"
            isActive={statusFilter === "completato"}
            onClick={() => setStatusFilter(statusFilter === "completato" ? "tutti" : "completato")}
          />
        </div>

        {/* ======================================================== */}
        {/* 2. TOOLBAR DI RICERCA, NAVIGAZIONE DATA E FILTRI STATO   */}
        {/* ======================================================== */}
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 shadow-xs w-full max-w-full min-w-0 space-y-3">
          {/* Riga 1: Ricerca testuale e selettore periodo */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3 min-w-0">
            {/* Ricerca testuale */}
            <div className="relative flex-1 min-w-0">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cerca appuntamento, cliente, indirizzo, note..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background shadow-xs rounded-lg h-9 text-xs sm:text-sm w-full"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer"
                >
                  <X className="size-3.5" />
                </button>
              )}
            </div>

            {/* Navigatore date rapido e compatto */}
            <div className="flex items-center gap-1 sm:gap-1.5 self-center sm:self-auto shrink-0 bg-background border border-border rounded-lg p-0.5 shadow-2xs">
              <Button
                size="icon"
                variant="ghost"
                className="size-7.5 rounded-md cursor-pointer"
                onClick={handlePrevPeriod}
                title="Periodo precedente"
              >
                <ChevronLeft className="size-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                className="h-7.5 px-2.5 text-xs font-semibold rounded-md cursor-pointer text-foreground capitalize"
                onClick={handleOpenMonthDialog}
                title="Clicca per aprire il calendario mese completo"
              >
                <Calendar className="size-3.5 mr-1.5 text-primary" />
                <span>{currentPeriodLabel}</span>
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="size-7.5 rounded-md cursor-pointer"
                onClick={handleNextPeriod}
                title="Periodo successivo"
              >
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>

          {/* Riga 2: Filtri periodo (Oggi, Settimana, Tutti) e filtri di stato */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-2.5 border-t border-border/60 min-w-0">
            {/* Modalità data */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 sm:pb-0 min-w-0">
              <button
                type="button"
                onClick={() => setDateFilterMode("settimana")}
                className={cn(
                  "h-7.5 px-2.5 text-xs font-medium rounded-md transition-all shrink-0 cursor-pointer",
                  dateFilterMode === "settimana"
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "border border-border bg-background text-muted-foreground hover:bg-muted/50",
                )}
              >
                Settimana
              </button>
              <button
                type="button"
                onClick={handleSelectToday}
                className={cn(
                  "h-7.5 px-2.5 text-xs font-medium rounded-md transition-all shrink-0 cursor-pointer",
                  dateFilterMode === "oggi"
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "border border-border bg-background text-muted-foreground hover:bg-muted/50",
                )}
              >
                Oggi
              </button>
              <button
                type="button"
                onClick={() => setDateFilterMode("tutti")}
                className={cn(
                  "h-7.5 px-2.5 text-xs font-medium rounded-md transition-all shrink-0 cursor-pointer",
                  dateFilterMode === "tutti"
                    ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                    : "border border-border bg-background text-muted-foreground hover:bg-muted/50",
                )}
              >
                Tutti i periodi
              </button>
            </div>

            {/* Pillole filtro stato */}
            <div className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto pb-0.5 sm:pb-0 min-w-0 max-w-full">
              {(["tutti", ...STATUSES] as const).map((st) => {
                const count =
                  st === "tutti" ? rows.length : rows.filter((a) => a.status === st).length;

                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={cn(
                      "h-7.5 px-2 sm:px-2.5 text-xs font-medium rounded-md transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
                      statusFilter === st
                        ? "bg-primary text-primary-foreground font-semibold shadow-2xs"
                        : "border border-border bg-background text-muted-foreground hover:bg-muted/50 hover:text-foreground",
                    )}
                  >
                    <span className="capitalize">{st === "tutti" ? "Tutti" : st}</span>
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0.2 text-[10px] font-mono",
                        statusFilter === st
                          ? "bg-primary-foreground/20 text-primary-foreground"
                          : "bg-muted text-muted-foreground",
                      )}
                    >
                      {count}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. LISTA DEGLI APPUNTAMENTI (RESPONSIVE, CENTRATA)       */}
        {/* ======================================================== */}
        <div className="rounded-xl border border-border bg-card p-3.5 sm:p-5 shadow-xs space-y-4 w-full max-w-full min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-border/60 min-w-0">
            <div>
              <h3 className="text-sm sm:text-base font-bold text-foreground capitalize tracking-tight">
                {currentPeriodLabel}
              </h3>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-0.5">
                {filteredAppointments.length === 0
                  ? "Nessun appuntamento trovato"
                  : `${filteredAppointments.length} ${
                      filteredAppointments.length === 1
                        ? "appuntamento in programma"
                        : "appuntamenti in programma"
                    }`}
              </p>
            </div>

            <Button
              size="sm"
              onClick={() => openNew(selected)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-3 py-1.5 shadow-xs rounded-lg gap-1.5 text-xs shrink-0 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="size-3.5 stroke-[2.5]" />
              <span>Aggiungi appuntamento</span>
            </Button>
          </div>

          {filteredAppointments.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 sm:p-12 rounded-xl border border-dashed border-border/80 text-center bg-muted/15 w-full">
              <div className="p-3 rounded-full bg-primary/10 text-primary mb-3">
                <CalendarClock className="size-6 sm:size-7" />
              </div>
              <h4 className="text-sm font-semibold text-foreground">
                {searchQuery || statusFilter !== "tutti"
                  ? "Nessun appuntamento corrisponde ai filtri impostati"
                  : "Nessun appuntamento in questo periodo"}
              </h4>
              <p className="text-xs text-muted-foreground max-w-sm mt-1">
                {searchQuery || statusFilter !== "tutti"
                  ? "Prova a reimpostare i filtri o la ricerca per vedere altri appuntamenti."
                  : "Non ci sono interventi o sopralluoghi fissati. Puoi registrarne uno adesso."}
              </p>
              <Button
                size="sm"
                className="mt-4 gap-1.5 text-xs bg-primary text-primary-foreground hover:bg-primary/90 shadow-xs rounded-lg cursor-pointer"
                onClick={() => openNew(selected)}
              >
                <Plus className="size-3.5" />
                <span>Crea appuntamento</span>
              </Button>
            </div>
          ) : (
            <div className="space-y-3 w-full max-w-full min-w-0">
              {filteredAppointments.map((a) => {
                const client = clientsMap.get(a.client_id);
                const startTime = formatTimeOnly(a.starts_at);
                const endTime = getEndTimeString(a.starts_at, a.duration_min);
                const borderClass = getStatusBorderClass(a.status);
                const appointmentDate = new Date(a.starts_at);

                return (
                  <div
                    key={a.id}
                    className={cn(
                      "group relative rounded-xl border border-border bg-card p-3 sm:p-4 transition-all shadow-xs hover:border-primary/40 space-y-2.5 sm:space-y-3 w-full max-w-full min-w-0 overflow-hidden",
                      borderClass,
                    )}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5 min-w-0">
                      <div className="min-w-0 space-y-1.5 flex-1">
                        {/* Data, Orario e stato */}
                        <div className="flex items-center flex-wrap gap-1.5 sm:gap-2 min-w-0">
                          {/* Badge data giorno */}
                          <span className="inline-flex items-center gap-1 font-semibold text-[11px] sm:text-xs text-foreground bg-primary/10 text-primary px-2 py-0.5 rounded-md border border-primary/20 shrink-0">
                            <Calendar className="size-3" />
                            <span>
                              {appointmentDate.toLocaleDateString("it-IT", {
                                weekday: "short",
                                day: "numeric",
                                month: "short",
                              })}
                            </span>
                          </span>

                          {/* Orario */}
                          <span className="inline-flex items-center gap-1 font-semibold text-[11px] sm:text-xs text-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/60 shrink-0">
                            <Clock className="size-3 text-muted-foreground" />
                            <span className="font-mono">
                              {startTime} - {endTime}
                            </span>
                            <span className="text-[10px] text-muted-foreground font-normal">
                              ({a.duration_min || 60}m)
                            </span>
                          </span>

                          {/* Dropdown rapido per cambiare stato */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <button
                                type="button"
                                className="cursor-pointer transition-opacity hover:opacity-85 shrink-0"
                                title="Clicca per cambiare stato"
                              >
                                {getStatusBadge(a.status)}
                              </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start">
                              {STATUSES.map((st) => (
                                <DropdownMenuItem
                                  key={st}
                                  onClick={() => handleQuickStatusChange(a, st)}
                                  className="capitalize text-xs gap-2 cursor-pointer"
                                >
                                  <span>{getStatusBadge(st)}</span>
                                </DropdownMenuItem>
                              ))}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {/* Titolo appuntamento */}
                        <h4 className="text-sm sm:text-base font-bold text-foreground tracking-tight break-words">
                          {a.title}
                        </h4>

                        {/* Informazioni Cliente */}
                        {client ? (
                          <div className="flex items-center flex-wrap gap-2 text-xs text-muted-foreground min-w-0">
                            <span className="inline-flex items-center gap-1 text-foreground font-medium">
                              <User className="size-3.5 text-primary shrink-0" />
                              <span className="truncate">{client.name}</span>
                            </span>

                            {client.phone && (
                              <div className="flex items-center gap-1.5 shrink-0">
                                <a
                                  href={`tel:${client.phone}`}
                                  className="inline-flex items-center gap-1 text-[11px] text-primary hover:underline font-mono bg-primary/5 hover:bg-primary/10 px-2 py-0.5 rounded-md border border-primary/20"
                                >
                                  <Phone className="size-3" />
                                  <span>{client.phone}</span>
                                </a>

                                <button
                                  type="button"
                                  onClick={() => handleSendWhatsApp(a)}
                                  className="inline-flex items-center gap-1 text-[11px] text-emerald-700 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-950/60 px-2 py-0.5 rounded-md border border-emerald-300 dark:border-emerald-800 cursor-pointer"
                                  title="Invia promemoria WhatsApp al cliente"
                                >
                                  <MessageSquare className="size-3" />
                                  <span>WhatsApp</span>
                                </button>
                              </div>
                            )}
                          </div>
                        ) : null}

                        {/* Indirizzo intervento */}
                        {a.address && (
                          <div className="flex items-start gap-1.5 text-xs text-muted-foreground pt-0.5 min-w-0">
                            <MapPin className="size-3.5 text-muted-foreground shrink-0 mt-0.5" />
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                                a.address,
                              )}`}
                              target="_blank"
                              rel="noreferrer"
                              className="hover:text-primary hover:underline flex items-center gap-1 break-words flex-1"
                            >
                              <span>{a.address}</span>
                              <ExternalLink className="size-3 shrink-0 opacity-60" />
                            </a>
                          </div>
                        )}

                        {/* Note dell'appuntamento */}
                        {a.notes && (
                          <p className="text-xs text-muted-foreground/90 bg-muted/30 p-2 sm:p-2.5 rounded-lg border border-border/50 whitespace-pre-wrap break-words mt-1">
                            {a.notes}
                          </p>
                        )}
                      </div>

                      {/* Azioni Modifica / Elimina */}
                      <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 rounded-lg text-muted-foreground hover:text-foreground cursor-pointer"
                          title="Modifica appuntamento"
                          onClick={() => {
                            setForm({
                              ...a,
                              starts_at: toLocalInput(new Date(a.starts_at)),
                            });
                            setOpen(true);
                          }}
                        >
                          <Pencil className="size-3.5" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="size-8 rounded-lg text-muted-foreground hover:text-destructive cursor-pointer"
                          title="Elimina appuntamento"
                          onClick={async () => {
                            if (window.confirm("Vuoi davvero eliminare questo appuntamento?")) {
                              try {
                                await remove.mutateAsync(a.id);
                                toast.success("Appuntamento eliminato con successo.");
                              } catch {
                                toast.error("Errore durante l'eliminazione.");
                              }
                            }
                          }}
                        >
                          <Trash2 className="size-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Footer card con link al Rapportino di Intervento */}
                    <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs min-w-0">
                      <Link
                        to="/interventi"
                        className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium text-[11px] truncate"
                      >
                        <Wrench className="size-3 shrink-0" />
                        <span>Gestione Rapportini Intervento</span>
                      </Link>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                        onClick={() => {
                          setForm({
                            ...a,
                            starts_at: toLocalInput(new Date(a.starts_at)),
                          });
                          setOpen(true);
                        }}
                      >
                        Dettagli completi
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ======================================================== */}
      {/* DIALOG: VISTA MENSILE COMPLETA (CALENDARIO DEL MESE)     */}
      {/* ======================================================== */}
      <Dialog open={monthDialogOpen} onOpenChange={setMonthDialogOpen}>
        <DialogContent className="sm:max-w-md md:max-w-lg rounded-xl p-4 sm:p-6 w-[95vw] max-w-lg overflow-hidden">
          <DialogHeader className="pb-2 border-b border-border/60">
            <div className="flex items-center justify-between gap-2">
              <DialogTitle className="flex items-center gap-2 text-base font-bold capitalize">
                <Calendar className="size-4 text-primary" />
                <span>
                  {monthCursor.toLocaleDateString("it-IT", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
              </DialogTitle>
              <div className="flex items-center gap-1">
                <Button
                  size="icon"
                  variant="outline"
                  className="size-7 rounded-md"
                  onClick={() =>
                    setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))
                  }
                  title="Mese precedente"
                >
                  <ChevronLeft className="size-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 px-2 text-xs font-semibold rounded-md"
                  onClick={() => setMonthCursor(new Date())}
                >
                  Oggi
                </Button>
                <Button
                  size="icon"
                  variant="outline"
                  className="size-7 rounded-md"
                  onClick={() =>
                    setMonthCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))
                  }
                  title="Mese successivo"
                >
                  <ChevronRight className="size-3.5" />
                </Button>
              </div>
            </div>
          </DialogHeader>

          <div className="space-y-2 pt-2">
            {/* Intestazione giorni settimana */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] sm:text-xs font-bold text-muted-foreground py-1 border-b border-border/40 uppercase tracking-wider">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-0.5">
                  {d}
                </div>
              ))}
            </div>

            {/* Matrice 42 giorni del mese */}
            <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
              {monthDays.map((d) => {
                const count = rows.filter((a) => sameDay(new Date(a.starts_at), d)).length;
                const isCurrentMonth = d.getMonth() === monthCursor.getMonth();
                const isSelected = sameDay(d, selected);
                const isToday = sameDay(d, new Date());

                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    onClick={() => handleSelectDayFromMonth(d)}
                    className={cn(
                      "flex min-h-[46px] sm:min-h-[58px] flex-col items-center justify-between rounded-lg border p-1 text-xs transition-all cursor-pointer min-w-0",
                      isSelected
                        ? "border-primary bg-primary/10 ring-1 ring-primary/40 font-bold shadow-xs text-primary"
                        : "border-border hover:border-primary/40 hover:bg-muted/30 bg-card",
                      !isCurrentMonth && "opacity-30 bg-muted/10",
                      isToday &&
                        !isSelected &&
                        "border-accent/60 bg-accent/5 font-bold text-accent",
                    )}
                  >
                    <span className="text-[11px] sm:text-xs font-semibold font-mono">
                      {d.getDate()}
                    </span>
                    {count > 0 ? (
                      <span className="inline-flex items-center justify-center rounded-full bg-primary text-primary-foreground font-bold text-[9px] size-4">
                        {count}
                      </span>
                    ) : (
                      <span className="text-[9px] text-muted-foreground/30">-</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setMonthDialogOpen(false)}
              className="text-xs"
            >
              Chiudi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ======================================================== */}
      {/* MODALE CREAZIONE / MODIFICA APPUNTAMENTO                 */}
      {/* ======================================================== */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md md:max-w-lg rounded-xl p-4 sm:p-6 w-[95vw] max-w-lg overflow-y-auto max-h-[90vh]">
          <DialogHeader className="pb-2 border-b border-border/60">
            <DialogTitle className="flex items-center gap-2 text-base font-bold">
              <CalendarDays className="size-4 text-primary" />
              <span>{form?.id ? "Modifica appuntamento" : "Nuovo appuntamento"}</span>
            </DialogTitle>
          </DialogHeader>

          {form && (
            <div className="space-y-3.5 pt-2 text-xs sm:text-sm">
              <div>
                <Label className="text-xs font-medium">Titolo / Descrizione intervento *</Label>
                <Input
                  className="mt-1 bg-background text-xs sm:text-sm h-9"
                  placeholder="es. Riparazione perdita caldaia o Sopralluogo bagno"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-xs font-medium">Cliente collegato</Label>
                <Select
                  value={form.client_id || "none"}
                  onValueChange={(val) => handleSelectClient(val === "none" ? null : val)}
                >
                  <SelectTrigger className="mt-1 bg-background text-xs sm:text-sm h-9">
                    <SelectValue placeholder="Seleziona un cliente (opzionale)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Nessun cliente associato</SelectItem>
                    {(clients.data ?? []).map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.city ? `(${c.city})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs font-medium">Data e Ora di inizio *</Label>
                  <Input
                    type="datetime-local"
                    className="mt-1 bg-background text-xs sm:text-sm h-9"
                    value={form.starts_at}
                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-xs font-medium">Durata stimata (minuti)</Label>
                  <Input
                    type="number"
                    min={15}
                    step={15}
                    className="mt-1 bg-background text-xs sm:text-sm h-9"
                    value={form.duration_min}
                    onChange={(e) => setForm({ ...form, duration_min: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label className="text-xs font-medium">Stato appuntamento</Label>
                <Select
                  value={form.status}
                  onValueChange={(val) => setForm({ ...form, status: val })}
                >
                  <SelectTrigger className="mt-1 bg-background text-xs sm:text-sm h-9">
                    <SelectValue placeholder="Stato" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((st) => (
                      <SelectItem key={st} value={st} className="capitalize">
                        {st}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs font-medium">Indirizzo intervento</Label>
                <Input
                  className="mt-1 bg-background text-xs sm:text-sm h-9"
                  placeholder="es. Via dei Prati Fiscali 120, Roma"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>

              <div>
                <Label className="text-xs font-medium">Note aggiuntive per il tecnico</Label>
                <Textarea
                  className="mt-1 bg-background text-xs sm:text-sm resize-none"
                  rows={3}
                  placeholder="es. Citofono interno 4, chiavi dal portiere, caldaia in balcone..."
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                />
              </div>
            </div>
          )}

          <DialogFooter className="pt-3 border-t border-border/60 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setOpen(false)}
              className="text-xs"
            >
              Annulla
            </Button>
            <Button
              type="button"
              size="sm"
              className="bg-primary text-primary-foreground hover:bg-primary/90 text-xs"
              onClick={submit}
            >
              {form?.id ? "Salva modifiche" : "Crea appuntamento"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
