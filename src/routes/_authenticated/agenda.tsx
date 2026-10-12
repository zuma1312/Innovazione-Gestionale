import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  CalendarDays,
  Calendar,
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
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
} from "lucide-react";
import { toast } from "sonner";
import { AppLayout } from "@/components/AppLayout";
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
  head: () => ({
    meta: [
      { title: "Agenda — INNOVAZIONE TERMICA" },
      { name: "description", content: "Calendario appuntamenti e pronto intervento." },
      { property: "og:title", content: "Agenda — INNOVAZIONE TERMICA" },
      { property: "og:description", content: "Calendario degli appuntamenti." },
    ],
  }),
  component: AgendaPage,
});

const STATUSES = ["programmato", "confermato", "completato", "annullato"] as const;

const WEEKDAYS = ["Lun", "Mar", "Mer", "Gio", "Ven", "Sab", "Dom"];

const QUICK_TITLES = [
  "Sopralluogo tecnico",
  "Manutenzione ordinaria caldaia",
  "Riparazione perdita bagno/cucina",
  "Controllo fumi e bollino blu",
  "Installazione climatizzatore",
  "Pronto intervento idraulico",
];

const QUICK_DURATIONS = [
  { label: "30 min", value: 30 },
  { label: "1 ora", value: 60 },
  { label: "1h 30m", value: 90 },
  { label: "2 ore", value: 120 },
  { label: "3 ore", value: 180 },
];

function WhatsAppIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c-.001 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.711 1.456h.005c6.554 0 11.89-5.336 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

const toLocalInput = (d: Date) => {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

function getStartOfWeek(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = (day + 6) % 7; // Monday = 0, Sunday = 6
  d.setDate(d.getDate() - diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function formatTimeOnly(dateStr: string) {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return "--:--";
  return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
}

function getEndTimeString(startIso: string, durationMin: number) {
  const d = new Date(startIso);
  if (Number.isNaN(d.getTime())) return "--:--";
  d.setMinutes(d.getMinutes() + (Number(durationMin) || 60));
  return d.toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" });
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
        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 line-through">
          <X className="size-3" /> Annullato
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
      return "border-l-4 border-l-emerald-500";
    case "confermato":
      return "border-l-4 border-l-amber-500";
    case "annullato":
      return "border-l-4 border-l-rose-500";
    case "programmato":
    default:
      return "border-l-4 border-l-blue-500";
  }
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function AgendaPage() {
  const appointments = useList<any>("appointments");
  const clients = useList<any>("clients");
  const save = useSave("appointments");
  const remove = useRemove("appointments");

  // Visualizzazione: di base impostata su 1 settimana ("week"), apribile a mese intero ("month")
  const [viewMode, setViewMode] = useState<"week" | "month">("week");
  const [cursor, setCursor] = useState(() => new Date());
  const [selected, setSelected] = useState(() => new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("tutti");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<any>(null);

  // Calcolo dei giorni per la settimana corrente (7 giorni da Lunedì a Domenica)
  const weekDays = useMemo(() => {
    const start = getStartOfWeek(cursor);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  // Calcolo dei giorni per la matrice del mese (42 giorni)
  const monthDays = useMemo(() => {
    const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const offset = (first.getDay() + 6) % 7;
    const start = new Date(first);
    start.setDate(first.getDate() - offset);
    return Array.from({ length: 42 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  }, [cursor]);

  const rows: any[] = useMemo(() => appointments.data ?? [], [appointments.data]);
  const clientsMap = useMemo(() => {
    const map = new Map<string, any>();
    (clients.data ?? []).forEach((c: any) => {
      map.set(c.id, c);
    });
    return map;
  }, [clients.data]);

  // Navigazione periodo
  const handlePrev = () => {
    if (viewMode === "week") {
      setCursor((prev) => {
        const next = new Date(prev);
        next.setDate(prev.getDate() - 7);
        return next;
      });
    } else {
      setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    }
  };

  const handleNext = () => {
    if (viewMode === "week") {
      setCursor((prev) => {
        const next = new Date(prev);
        next.setDate(prev.getDate() + 7);
        return next;
      });
    } else {
      setCursor((prev) => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    }
  };

  const handleToday = () => {
    const today = new Date();
    setCursor(today);
    setSelected(today);
  };

  // Appuntamenti del giorno selezionato
  const dayAppointments = useMemo(() => {
    return rows
      .filter((a) => sameDay(new Date(a.starts_at), selected))
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [rows, selected]);

  // Appuntamenti filtrati per ricerca e stato
  const filteredDayAppointments = useMemo(() => {
    return dayAppointments.filter((a) => {
      if (statusFilter !== "tutti" && a.status !== statusFilter) return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const client = clientsMap.get(a.client_id);
      const clientName = client?.name?.toLowerCase() || "";
      const title = a.title?.toLowerCase() || "";
      const address = a.address?.toLowerCase() || "";
      const notes = a.notes?.toLowerCase() || "";
      return (
        title.includes(q) || clientName.includes(q) || address.includes(q) || notes.includes(q)
      );
    });
  }, [dayAppointments, statusFilter, searchQuery, clientsMap]);

  // Statistiche per la settimana corrente
  const weekStats = useMemo(() => {
    const startWeek = getStartOfWeek(cursor);
    const endWeek = new Date(startWeek);
    endWeek.setDate(startWeek.getDate() + 7);

    const weekRows = rows.filter((a) => {
      const d = new Date(a.starts_at);
      return d >= startWeek && d < endWeek;
    });

    const todayCount = rows.filter((a) => sameDay(new Date(a.starts_at), new Date())).length;
    const confirmedCount = weekRows.filter((a) => a.status === "confermato").length;
    const completedCount = weekRows.filter((a) => a.status === "completato").length;

    return {
      today: todayCount,
      weekTotal: weekRows.length,
      confirmed: confirmedCount,
      completed: completedCount,
      weekRows,
    };
  }, [rows, cursor]);

  // Prossimi appuntamenti della settimana (per colonna laterale)
  const upcomingWeekAppointments = useMemo(() => {
    const startWeek = getStartOfWeek(cursor);
    const endWeek = new Date(startWeek);
    endWeek.setDate(startWeek.getDate() + 7);

    return rows
      .filter((a) => {
        const d = new Date(a.starts_at);
        return d >= startWeek && d < endWeek;
      })
      .sort((a, b) => new Date(a.starts_at).getTime() - new Date(b.starts_at).getTime());
  }, [rows, cursor]);

  const openNew = (date: Date) => {
    const d = new Date(date);
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
    const msg = `Salve ${client.name || ""}, le ricordiamo l'appuntamento con Innovazione Termica programmato per ${dateFormatted} alle ore ${timeFormatted} per: ${appointment.title || "intervento"}. Restiamo a disposizione per qualsiasi informazione o conferma.`;
    const url = `https://wa.me/${clean}?text=${encodeURIComponent(msg)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  // Formattazione titolo intervallo per la vista settimana
  const weekLabel = useMemo(() => {
    const start = weekDays[0];
    const end = weekDays[6];
    const startMonth = start.toLocaleDateString("it-IT", { month: "short" });
    const endMonth = end.toLocaleDateString("it-IT", { month: "short" });
    const year = end.getFullYear();
    if (startMonth === endMonth) {
      return `${start.getDate()} - ${end.getDate()} ${start.toLocaleDateString("it-IT", { month: "long" })} ${year}`;
    }
    return `${start.getDate()} ${startMonth} - ${end.getDate()} ${endMonth} ${year}`;
  }, [weekDays]);

  return (
    <AppLayout
      title="Agenda"
      description="Calendario settimanale e mensile degli interventi e sopralluoghi programmati."
      actions={
        <Button
          onClick={() => openNew(selected)}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-2.5 sm:px-4 py-2 shadow-xs rounded-lg gap-1.5 shrink-0 cursor-pointer"
        >
          <div className="flex items-center gap-1">
            <Plus className="size-3.5 stroke-[2.5]" />
            <CalendarDays className="size-4" />
          </div>
          <span className="hidden sm:inline">Nuovo appuntamento</span>
          <span className="sm:hidden text-xs">Nuovo</span>
        </Button>
      }
    >
      <div className="space-y-5">
        {/* ======================================================== */}
        {/* 1. CALENDARIO IN ALTO (DI BASE 1 SETTIMANA, APRIBILE A MESE) */}
        {/* ======================================================== */}
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-4">
          {/* Header e controlli calendario */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3.5 border-b border-border/60">
            {/* Titolo e indicatore vista */}
            <div className="flex items-center gap-3">
              <div className="size-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
                {viewMode === "week" ? (
                  <CalendarDays className="size-5" />
                ) : (
                  <Calendar className="size-5" />
                )}
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-semibold tracking-tight text-foreground capitalize">
                  {viewMode === "week"
                    ? weekLabel
                    : cursor.toLocaleDateString("it-IT", {
                        month: "long",
                        year: "numeric",
                      })}
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {viewMode === "week"
                    ? "Vista settimanale · Seleziona un giorno per visualizzare i dettagli"
                    : "Vista mensile completa · Fai clic su un giorno per selezionarlo"}
                </p>
              </div>
            </div>

            {/* Pulsanti navigazione periodo & Toggle Mese */}
            <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-between sm:justify-end">
              {/* Tasto dedicato per aprire/chiudere la vista del mese intero */}
              <Button
                type="button"
                variant={viewMode === "month" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode(viewMode === "week" ? "month" : "week")}
                className={cn(
                  "h-8 sm:h-9 px-3 gap-1.5 text-xs sm:text-sm font-medium transition-all shadow-xs rounded-lg cursor-pointer",
                  viewMode === "month"
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border-border bg-background text-foreground hover:bg-muted/50",
                )}
              >
                {viewMode === "week" ? (
                  <>
                    <Calendar className="size-3.5 sm:size-4 text-primary" />
                    <span>Visualizza tutto il mese</span>
                    <ChevronDown className="size-3.5 opacity-60" />
                  </>
                ) : (
                  <>
                    <CalendarRange className="size-3.5 sm:size-4" />
                    <span>Riduci a 1 settimana</span>
                    <ChevronUp className="size-3.5 opacity-60" />
                  </>
                )}
              </Button>

              {/* Controlli di navigazione periodo */}
              <div className="flex items-center gap-1 rounded-lg border border-border bg-background p-0.5 shadow-xs">
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 sm:size-8 rounded-md"
                  onClick={handlePrev}
                  title={viewMode === "week" ? "Settimana precedente" : "Mese precedente"}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-7 sm:h-8 px-2.5 text-xs font-semibold rounded-md"
                  onClick={handleToday}
                >
                  Oggi
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="size-7 sm:size-8 rounded-md"
                  onClick={handleNext}
                  title={viewMode === "week" ? "Settimana successiva" : "Mese successivo"}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* VISTA 1 SETTIMANA (DEFAULT) */}
          {viewMode === "week" && (
            <div className="grid grid-cols-7 gap-2 sm:gap-3">
              {weekDays.map((d, idx) => {
                const count = rows.filter((a) => sameDay(new Date(a.starts_at), d)).length;
                const isSelected = sameDay(d, selected);
                const isToday = sameDay(d, new Date());

                return (
                  <button
                    key={d.toISOString()}
                    type="button"
                    onClick={() => setSelected(new Date(d))}
                    onDoubleClick={() => openNew(d)}
                    className={cn(
                      "group relative flex flex-col items-center justify-between p-2.5 sm:p-3 rounded-xl border text-center transition-all cursor-pointer select-none min-h-[84px] sm:min-h-[96px]",
                      isSelected
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30 shadow-xs font-semibold"
                        : isToday
                          ? "border-accent/60 bg-accent/5 font-semibold"
                          : "border-border hover:border-primary/40 hover:bg-muted/30 bg-card shadow-xs",
                    )}
                  >
                    {/* Giorno della settimana */}
                    <span
                      className={cn(
                        "text-[10px] sm:text-xs uppercase tracking-wider font-medium",
                        isSelected
                          ? "text-primary font-semibold"
                          : isToday
                            ? "text-accent font-semibold"
                            : "text-muted-foreground",
                      )}
                    >
                      {WEEKDAYS[idx]}
                    </span>

                    {/* Numero giorno */}
                    <span
                      className={cn(
                        "text-lg sm:text-2xl font-bold font-mono tabular-nums my-0.5",
                        isSelected ? "text-primary" : isToday ? "text-accent" : "text-foreground",
                      )}
                    >
                      {d.getDate()}
                    </span>

                    {/* Badge / Indicatore appuntamenti */}
                    <div className="min-h-[20px] flex items-center justify-center">
                      {count > 0 ? (
                        <span
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold leading-none shadow-2xs",
                            isSelected
                              ? "bg-primary text-primary-foreground"
                              : "bg-primary/15 text-primary border border-primary/20",
                          )}
                        >
                          <span>{count}</span>
                          <span className="hidden sm:inline">app.</span>
                        </span>
                      ) : isToday ? (
                        <span className="text-[10px] font-bold text-accent uppercase tracking-wider">
                          Oggi
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground/30 font-medium">-</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* VISTA MESE COMPLETO (ESPANDIBILE TRAMITE PULSANTE) */}
          {viewMode === "month" && (
            <div className="space-y-2 animate-in fade-in-50 duration-200">
              {/* Intestazione giorni settimana */}
              <div className="grid grid-cols-7 gap-1 text-center text-xs font-semibold text-muted-foreground py-1.5 border-b border-border/40 uppercase tracking-wider">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="py-1">
                    {d}
                  </div>
                ))}
              </div>

              {/* Matrice 42 giorni */}
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {monthDays.map((d) => {
                  const count = rows.filter((a) => sameDay(new Date(a.starts_at), d)).length;
                  const isCurrentMonth = d.getMonth() === cursor.getMonth();
                  const isSelected = sameDay(d, selected);
                  const isToday = sameDay(d, new Date());

                  return (
                    <button
                      key={d.toISOString()}
                      type="button"
                      onClick={() => setSelected(new Date(d))}
                      onDoubleClick={() => openNew(d)}
                      className={cn(
                        "flex min-h-[58px] sm:min-h-[72px] flex-col items-start justify-between rounded-lg border p-1.5 sm:p-2 text-left text-xs transition-all cursor-pointer",
                        isSelected
                          ? "border-primary bg-primary/10 ring-1 ring-primary/40 font-semibold shadow-xs"
                          : "border-border hover:border-primary/40 hover:bg-muted/30 bg-card",
                        !isCurrentMonth && "opacity-35 bg-muted/15",
                        isToday &&
                          !isSelected &&
                          "border-accent/60 bg-accent/5 font-semibold text-accent",
                      )}
                    >
                      <div className="w-full flex items-center justify-between">
                        <span
                          className={cn(
                            "text-xs sm:text-sm font-medium font-mono",
                            isToday ? "text-accent font-bold" : "text-foreground",
                          )}
                        >
                          {d.getDate()}
                        </span>
                        {isToday && (
                          <span className="hidden sm:inline text-[9px] font-bold text-accent">
                            OGGI
                          </span>
                        )}
                      </div>

                      {count > 0 ? (
                        <div className="mt-auto w-full flex items-center justify-between pt-1">
                          <span
                            className={cn(
                              "rounded-full px-1.5 py-0.5 text-[9px] font-semibold leading-none",
                              isSelected
                                ? "bg-primary text-primary-foreground"
                                : "bg-primary/20 text-primary border border-primary/20",
                            )}
                          >
                            {count} {count === 1 ? "app." : "app."}
                          </span>
                        </div>
                      ) : null}
                    </button>
                  );
                })}
              </div>

              {/* Barra inferiore informativa e chiusura rapida */}
              <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
                <span>Fai clic su un giorno per visualizzarlo in dettaglio</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("week")}
                  className="h-7 text-xs text-primary hover:text-primary cursor-pointer"
                >
                  Torna alla vista settimanale
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 2. INDICATORI RAPIDI (KPI OVERVIEW CARDS)               */}
        {/* ======================================================== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setStatusFilter("tutti")}
            className={cn(
              "rounded-xl border p-3.5 sm:p-4 text-left transition-all bg-card shadow-xs flex flex-col justify-between min-h-[96px] sm:min-h-[104px] cursor-pointer",
              statusFilter === "tutti"
                ? "border-primary ring-1 ring-primary/20 shadow-xs"
                : "border-border hover:bg-muted/30",
            )}
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Tutti nella settimana</span>
              <CalendarDays className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums mt-1">
                {weekStats.weekTotal}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground/80 mt-0.5 truncate">
                {weekStats.today} in programma oggi
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => {
              const today = new Date();
              setCursor(today);
              setSelected(today);
            }}
            className="rounded-xl border border-border p-3.5 sm:p-4 text-left transition-all bg-card shadow-xs flex flex-col justify-between min-h-[96px] sm:min-h-[104px] hover:bg-muted/30 cursor-pointer"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Appuntamenti oggi</span>
              <Calendar className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums mt-1">
                {weekStats.today}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground/80 mt-0.5 truncate">
                Fissati per la giornata odierna
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("confermato")}
            className={cn(
              "rounded-xl border p-3.5 sm:p-4 text-left transition-all bg-card shadow-xs flex flex-col justify-between min-h-[96px] sm:min-h-[104px] cursor-pointer",
              statusFilter === "confermato"
                ? "border-amber-500 ring-1 ring-amber-500/20 shadow-xs"
                : "border-border hover:bg-muted/30",
            )}
          >
            <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
              <span className="text-xs font-medium">Confermati</span>
              <CheckCircle2 className="size-4" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums mt-1">
                {weekStats.confirmed}
              </p>
              <p className="text-[11px] sm:text-xs text-amber-600/80 mt-0.5 truncate">
                Pronti per l'intervento
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStatusFilter("completato")}
            className={cn(
              "rounded-xl border p-3.5 sm:p-4 text-left transition-all bg-card shadow-xs flex flex-col justify-between min-h-[96px] sm:min-h-[104px] cursor-pointer",
              statusFilter === "completato"
                ? "border-emerald-500 ring-1 ring-emerald-500/20 shadow-xs"
                : "border-border hover:bg-muted/30",
            )}
          >
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
              <span className="text-xs font-medium">Completati</span>
              <Check className="size-4" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums mt-1">
                {weekStats.completed}
              </p>
              <p className="text-[11px] sm:text-xs text-emerald-600/80 mt-0.5 truncate">
                Interventi conclusi
              </p>
            </div>
          </button>
        </div>

        {/* ======================================================== */}
        {/* 3. TOOLBAR DI RICERCA E FILTRI STATO                     */}
        {/* ======================================================== */}
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 shadow-xs">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Ricerca testuale */}
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Cerca appuntamento, cliente, note, indirizzo..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-background shadow-xs rounded-lg h-9 text-xs sm:text-sm"
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

            {/* Filtro stato */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {(["tutti", ...STATUSES] as const).map((st) => {
                const count =
                  st === "tutti"
                    ? dayAppointments.length
                    : dayAppointments.filter((a) => a.status === st).length;

                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setStatusFilter(st)}
                    className={cn(
                      "h-8 px-3 text-xs font-medium rounded-lg transition-all shrink-0 cursor-pointer flex items-center gap-1.5",
                      statusFilter === st
                        ? "bg-primary text-primary-foreground font-semibold shadow-xs"
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
        {/* 4. CORPO PRINCIPALE A DUE COLONNE                       */}
        {/* ======================================================== */}
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px] xl:grid-cols-[minmax(0,1fr)_380px]">
          {/* COLONNA SINISTRA: APPUNTAMENTI DEL GIORNO SELEZIONATO */}
          <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-4">
            {/* Header del giorno selezionato */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3.5 border-b border-border/60">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-foreground capitalize tracking-tight">
                    {selected.toLocaleDateString("it-IT", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </h3>
                  {sameDay(selected, new Date()) && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-accent/15 text-accent border border-accent/30">
                      OGGI
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {dayAppointments.length === 0
                    ? "Nessun appuntamento in programma"
                    : `${dayAppointments.length} ${dayAppointments.length === 1 ? "appuntamento programmato" : "appuntamenti programmati"}`}
                </p>
              </div>

              <Button
                size="sm"
                onClick={() => openNew(selected)}
                className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-3 py-1.5 shadow-xs rounded-lg gap-1.5 text-xs shrink-0 cursor-pointer"
              >
                <Plus className="size-3.5 stroke-[2.5]" />
                <span>Aggiungi in questa data</span>
              </Button>
            </div>

            {/* Lista appuntamenti */}
            <div className="space-y-3.5">
              {filteredDayAppointments.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-8 sm:p-12 rounded-xl border border-dashed border-border/80 text-center bg-muted/15">
                  <div className="p-3 rounded-full bg-primary/10 text-primary mb-3">
                    <CalendarClock className="size-6" />
                  </div>
                  <h4 className="text-sm font-semibold text-foreground">
                    {searchQuery || statusFilter !== "tutti"
                      ? "Nessun appuntamento corrisponde ai filtri"
                      : "Nessun appuntamento in questa data"}
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-sm mt-1">
                    {searchQuery || statusFilter !== "tutti"
                      ? "Prova a modificare i termini di ricerca o a selezionare tutti gli stati."
                      : "Non ci sono interventi o sopralluoghi fissati per questo giorno. Puoi aggiungerne uno adesso."}
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
                filteredDayAppointments.map((a) => {
                  const client = clientsMap.get(a.client_id);
                  const startTime = formatTimeOnly(a.starts_at);
                  const endTime = getEndTimeString(a.starts_at, a.duration_min);
                  const borderClass = getStatusBorderClass(a.status);

                  return (
                    <div
                      key={a.id}
                      className={cn(
                        "group relative rounded-xl border border-border bg-card p-4 transition-all shadow-xs hover:border-primary/40 space-y-3",
                        borderClass,
                      )}
                    >
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div className="min-w-0 space-y-1.5 flex-1">
                          {/* Orario e stato */}
                          <div className="flex items-center flex-wrap gap-2">
                            <span className="inline-flex items-center gap-1.5 font-semibold text-xs text-foreground bg-muted/60 px-2.5 py-1 rounded-md border border-border/60">
                              <Clock className="size-3 text-muted-foreground" />
                              <span className="font-mono">
                                {startTime} - {endTime}
                              </span>
                              <span className="text-[10px] text-muted-foreground font-normal">
                                ({a.duration_min || 60} min)
                              </span>
                            </span>

                            {/* Dropdown rapido per cambiare stato */}
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <button
                                  type="button"
                                  className="cursor-pointer transition-opacity hover:opacity-85"
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

                          {/* Titolo */}
                          <h4 className="text-sm sm:text-base font-bold text-foreground tracking-tight pt-0.5">
                            {a.title}
                          </h4>

                          {/* Cliente */}
                          {client && (
                            <div className="flex items-center gap-1.5 text-xs text-foreground/80 font-medium">
                              <User className="size-3.5 text-muted-foreground" />
                              <Link to="/clienti" className="hover:underline text-primary">
                                {client.name}
                              </Link>
                              {client.phone && (
                                <span className="text-muted-foreground text-[11px] font-mono">
                                  · {client.phone}
                                </span>
                              )}
                            </div>
                          )}

                          {/* Indirizzo con link a Google Maps */}
                          {a.address ? (
                            <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <MapPin className="size-3.5 text-muted-foreground shrink-0" />
                              <a
                                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.address)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="truncate hover:underline hover:text-primary flex items-center gap-1"
                              >
                                <span>{a.address}</span>
                                <ExternalLink className="size-2.5 opacity-60 shrink-0" />
                              </a>
                            </p>
                          ) : null}

                          {/* Note */}
                          {a.notes ? (
                            <div className="mt-2 p-2.5 rounded-lg bg-muted/30 border border-border/50 text-xs text-muted-foreground flex items-start gap-2">
                              <FileText className="size-3.5 text-muted-foreground/70 shrink-0 mt-0.5" />
                              <p className="whitespace-pre-line leading-relaxed">{a.notes}</p>
                            </div>
                          ) : null}
                        </div>

                        {/* Azioni rapide su ciascuna riga */}
                        <div className="flex items-center sm:flex-col justify-end gap-1 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/40">
                          {client?.phone && (
                            <Button
                              size="icon"
                              variant="ghost"
                              className="size-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-500/10 cursor-pointer rounded-lg"
                              title="Invia promemoria WhatsApp al cliente"
                              onClick={() => handleSendWhatsApp(a)}
                            >
                              <WhatsAppIcon className="size-4" />
                            </Button>
                          )}
                          <Button
                            size="icon"
                            variant="ghost"
                            className="size-8 text-muted-foreground hover:text-foreground cursor-pointer rounded-lg"
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
                            className="size-8 text-rose-500 hover:text-rose-600 hover:bg-rose-500/10 cursor-pointer rounded-lg"
                            title="Elimina appuntamento"
                            onClick={() => {
                              if (
                                window.confirm("Sei sicuro di voler eliminare questo appuntamento?")
                              ) {
                                remove.mutate(a.id);
                                toast.success("Appuntamento eliminato.");
                              }
                            }}
                          >
                            <Trash2 className="size-3.5" />
                          </Button>
                        </div>
                      </div>

                      {/* Footer card con link a crea intervento */}
                      <div className="pt-2.5 border-t border-border/50 flex items-center justify-between text-xs">
                        <Link
                          to="/interventi"
                          className="inline-flex items-center gap-1.5 text-primary hover:underline font-medium text-[11px]"
                        >
                          <Wrench className="size-3" />
                          <span>Vai ai Rapportini Intervento</span>
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
                })
              )}
            </div>
          </div>

          {/* COLONNA DESTRA: PROSSIMI APPUNTAMENTI DELLA SETTIMANA & LINK RAPIDI */}
          <div className="space-y-5">
            {/* Box appuntamenti della settimana */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-3.5">
              <div className="flex items-center justify-between pb-3 border-b border-border/60">
                <div className="flex items-center gap-2">
                  <CalendarDays className="size-4 text-primary" />
                  <h4 className="text-sm font-semibold text-foreground">
                    Appuntamenti della settimana
                  </h4>
                </div>
                <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary border border-primary/20">
                  {upcomingWeekAppointments.length}
                </span>
              </div>

              {upcomingWeekAppointments.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  Nessun appuntamento in programma per questa settimana.
                </p>
              ) : (
                <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
                  {upcomingWeekAppointments.map((a) => {
                    const client = clientsMap.get(a.client_id);
                    const appointmentDate = new Date(a.starts_at);
                    const isSelectedDay = sameDay(appointmentDate, selected);

                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => setSelected(new Date(appointmentDate))}
                        className={cn(
                          "w-full text-left p-3 rounded-lg border text-xs transition-all cursor-pointer flex items-start justify-between gap-2.5",
                          isSelectedDay
                            ? "border-primary bg-primary/5 ring-1 ring-primary/20 shadow-2xs"
                            : "border-border/80 hover:border-primary/40 hover:bg-muted/30 bg-card",
                        )}
                      >
                        <div className="min-w-0 space-y-0.5">
                          <p className="font-semibold text-foreground truncate">{a.title}</p>
                          <p className="text-[11px] text-muted-foreground">
                            {appointmentDate.toLocaleDateString("it-IT", {
                              weekday: "short",
                              day: "numeric",
                              month: "short",
                            })}{" "}
                            · <span className="font-mono">{formatTimeOnly(a.starts_at)}</span>
                          </p>
                          {client && (
                            <p className="text-[11px] text-primary truncate font-medium">
                              {client.name}
                            </p>
                          )}
                        </div>
                        <div className="shrink-0">{getStatusBadge(a.status)}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Collegamenti rapidi */}
            <div className="rounded-xl border border-border bg-card p-4 sm:p-5 shadow-xs space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Collegamenti rapidi
              </h4>
              <div className="space-y-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full justify-start text-xs font-medium h-9 rounded-lg border-border hover:bg-muted/50 cursor-pointer"
                >
                  <Link to="/interventi">
                    <Wrench className="size-3.5 mr-2 text-primary" />
                    <span>Gestione Rapportini Intervento</span>
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full justify-start text-xs font-medium h-9 rounded-lg border-border hover:bg-muted/50 cursor-pointer"
                >
                  <Link to="/clienti">
                    <User className="size-3.5 mr-2 text-primary" />
                    <span>Anagrafica Clienti</span>
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                  className="w-full justify-start text-xs font-medium h-9 rounded-lg border-border hover:bg-muted/50 cursor-pointer"
                >
                  <Link to="/preventivi">
                    <FileText className="size-3.5 mr-2 text-primary" />
                    <span>Preventivi e Documenti</span>
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* DIALOG: NUOVO / MODIFICA APPUNTAMENTO                    */}
      {/* ======================================================== */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-xl rounded-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CalendarDays className="size-5 text-primary" />
              <span>{form?.id ? "Modifica appuntamento" : "Nuovo appuntamento"}</span>
            </DialogTitle>
          </DialogHeader>

          {form ? (
            <div className="space-y-4 pt-1">
              {/* Suggerimenti rapidi titolo */}
              <div>
                <Label className="text-xs text-muted-foreground">
                  Titolo appuntamento o intervento
                </Label>
                <Input
                  value={form.title}
                  placeholder="Es. Manutenzione caldaia, sopralluogo..."
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 h-9 rounded-lg shadow-xs"
                />
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {QUICK_TITLES.map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm({ ...form, title: t })}
                      className="px-2 py-0.5 text-[10px] rounded-md bg-muted/60 hover:bg-muted text-muted-foreground hover:text-foreground border border-border/50 transition-colors cursor-pointer"
                    >
                      + {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* Cliente */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Cliente</Label>
                <Select
                  value={form.client_id ?? "none"}
                  onValueChange={(v) => handleSelectClient(v === "none" ? null : v)}
                >
                  <SelectTrigger className="h-9 rounded-lg shadow-xs">
                    <SelectValue placeholder="Seleziona un cliente..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">-- Nessun cliente selezionato --</SelectItem>
                    {(clients.data ?? []).map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.city ? `(${c.city})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Data e ora + Durata */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Data e ora inizio</Label>
                  <Input
                    type="datetime-local"
                    value={form.starts_at}
                    onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
                    className="h-9 rounded-lg shadow-xs"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Durata stimata (minuti)</Label>
                  <Input
                    type="number"
                    min="15"
                    step="15"
                    value={form.duration_min}
                    onChange={(e) =>
                      setForm({ ...form, duration_min: Number(e.target.value) || 60 })
                    }
                    className="h-9 rounded-lg shadow-xs"
                  />
                  <div className="flex gap-1 pt-0.5">
                    {QUICK_DURATIONS.map((qd) => (
                      <button
                        key={qd.value}
                        type="button"
                        onClick={() => setForm({ ...form, duration_min: qd.value })}
                        className={cn(
                          "px-1.5 py-0.5 text-[10px] rounded border transition-colors cursor-pointer",
                          Number(form.duration_min) === qd.value
                            ? "bg-primary text-primary-foreground font-medium border-primary"
                            : "bg-muted/40 text-muted-foreground hover:bg-muted border-border/50",
                        )}
                      >
                        {qd.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stato & Indirizzo */}
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Stato</Label>
                  <Select
                    value={form.status}
                    onValueChange={(v) => setForm({ ...form, status: v })}
                  >
                    <SelectTrigger className="h-9 rounded-lg shadow-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => (
                        <SelectItem key={s} value={s} className="capitalize">
                          {s}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Indirizzo intervento</Label>
                  <Input
                    value={form.address || ""}
                    placeholder="Es. Via Appia Nuova 120, Roma"
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="h-9 rounded-lg shadow-xs"
                  />
                </div>
              </div>

              {/* Note */}
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">
                  Note operative o dettagli materiale
                </Label>
                <Textarea
                  rows={3}
                  placeholder="Es. Portare ricambi guarnizioni, verificare pressione caldaia..."
                  value={form.notes || ""}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="rounded-lg shadow-xs"
                />
              </div>

              <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-border/50">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setOpen(false)}
                  className="rounded-lg cursor-pointer"
                >
                  Annulla
                </Button>
                <Button
                  type="button"
                  onClick={submit}
                  disabled={save.isPending}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg shadow-xs cursor-pointer"
                >
                  {save.isPending ? "Salvataggio..." : "Salva appuntamento"}
                </Button>
              </DialogFooter>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
