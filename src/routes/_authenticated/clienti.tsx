import { useCallback, useMemo, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import {
  Building2,
  ChevronDown,
  FileText,
  FilterX,
  Mail,
  MapPin,
  Pencil,
  Phone,
  Plus,
  Receipt,
  Search,
  SlidersHorizontal,
  Trash2,
  User,
  Users,
  Wrench,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useList, useRemove, useSave } from "@/hooks/data";
import { formatDate } from "@/lib/doc";

export const Route = createFileRoute("/_authenticated/clienti")({
  head: () => ({
    meta: [
      { title: "Clienti — INNOVAZIONE TERMICA" },
      {
        name: "description",
        content: "Privati e aziende, con i cantieri collegati.",
      },
      { property: "og:title", content: "Clienti — INNOVAZIONE TERMICA" },
      {
        property: "og:description",
        content: "Privati e aziende, con i cantieri collegati.",
      },
    ],
  }),
  component: ClientiPage,
});

type ClientType = "privato" | "azienda";

const EMPTY = {
  id: undefined as string | undefined,
  name: "",
  client_type: "privato" as ClientType,
  email: "",
  phone: "",
  address: "",
  city: "Roma",
  zip: "",
  vat_number: "",
  notes: "",
};

function WhatsAppIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c-.001 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.711 1.456h.005c6.554 0 11.89-5.336 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function ClientiPage() {
  const clients = useList<any>("clients");
  const interventions = useList<any>("interventions");
  const quotes = useList<any>("quotes");
  const save = useSave("clients");
  const remove = useRemove("clients");
  const navigate = useNavigate();

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY });

  // Filtri
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [cantieriFilter, setCantieriFilter] = useState<string>("all");
  const [contactFilter, setContactFilter] = useState<string>("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const allClients = useMemo(() => clients.data ?? [], [clients.data]);
  const allInterventions = useMemo(() => interventions.data ?? [], [interventions.data]);

  const getClientType = (c: any): ClientType => {
    if (c.client_type === "azienda" || c.client_type === "privato") {
      return c.client_type;
    }
    if (
      c.vat_number &&
      c.vat_number.trim().length > 0 &&
      !c.vat_number.match(/^[A-Z]{6}\d{2}[A-Z]\d{2}[A-Z]\d{3}[A-Z]$/i)
    ) {
      return "azienda";
    }
    return "privato";
  };

  const getCantieriCount = useCallback(
    (clientId: string) => {
      return allInterventions.filter((i: any) => i.client_id === clientId).length;
    },
    [allInterventions],
  );

  // Elenco città uniche per il filtro
  const cities = useMemo(() => {
    const set = new Set<string>();
    for (const c of allClients) {
      if (c.city?.trim()) set.add(c.city.trim());
    }
    return Array.from(set).sort();
  }, [allClients]);

  // Indicatori rapidi (KPI)
  const stats = useMemo(() => {
    let countPrivati = 0;
    let countAziende = 0;
    let countWithCantieri = 0;

    for (const c of allClients) {
      const type = getClientType(c);
      if (type === "azienda") countAziende++;
      else countPrivati++;

      if (getCantieriCount(c.id) > 0) countWithCantieri++;
    }

    return {
      total: allClients.length,
      privati: countPrivati,
      aziende: countAziende,
      withCantieri: countWithCantieri,
    };
  }, [allClients, getCantieriCount]);

  // Filtraggio avanzato
  const filteredRows = useMemo(() => {
    return allClients.filter((c: any) => {
      const q = search.toLowerCase();
      const name = (c.name || "").toLowerCase();
      const phone = (c.phone || "").toLowerCase();
      const city = (c.city || "").toLowerCase();
      const email = (c.email || "").toLowerCase();
      const address = (c.address || "").toLowerCase();
      const vat = (c.vat_number || "").toLowerCase();
      const notes = (c.notes || "").toLowerCase();

      // Ricerca libera
      if (
        search &&
        !name.includes(q) &&
        !phone.includes(q) &&
        !city.includes(q) &&
        !email.includes(q) &&
        !address.includes(q) &&
        !vat.includes(q) &&
        !notes.includes(q)
      ) {
        return false;
      }

      // Filtro Tipo
      const cType = getClientType(c);
      if (typeFilter === "privato" && cType !== "privato") return false;
      if (typeFilter === "azienda" && cType !== "azienda") return false;

      // Filtro Città
      if (cityFilter !== "all" && c.city !== cityFilter) return false;

      // Filtro Cantieri
      const cantieri = getCantieriCount(c.id);
      if (cantieriFilter === "with_cantieri" && cantieri === 0) return false;
      if (cantieriFilter === "no_cantieri" && cantieri > 0) return false;
      if (cantieriFilter === "frequent" && cantieri < 3) return false;

      // Filtro Canale Contatto
      if (contactFilter === "has_phone" && !c.phone?.trim()) return false;
      if (contactFilter === "has_email" && !c.email?.trim()) return false;
      if (contactFilter === "has_address" && (!c.address?.trim() || !c.city?.trim())) {
        return false;
      }

      return true;
    });
  }, [allClients, getCantieriCount, search, typeFilter, cityFilter, cantieriFilter, contactFilter]);

  const hasActiveFilters =
    search.trim() !== "" ||
    typeFilter !== "all" ||
    cityFilter !== "all" ||
    cantieriFilter !== "all" ||
    contactFilter !== "all";

  const activeFilterCount =
    (typeFilter !== "all" ? 1 : 0) +
    (cityFilter !== "all" ? 1 : 0) +
    (cantieriFilter !== "all" ? 1 : 0) +
    (contactFilter !== "all" ? 1 : 0);

  const resetFilters = () => {
    setSearch("");
    setTypeFilter("all");
    setCityFilter("all");
    setCantieriFilter("all");
    setContactFilter("all");
  };

  const openWhatsApp = (phone?: string, name?: string) => {
    if (!phone) {
      toast.error("Nessun numero di telefono disponibile per questo cliente.");
      return;
    }

    let clean = phone.replace(/\D/g, "");
    if (clean.length === 10 && clean.startsWith("3")) {
      clean = `39${clean}`;
    }

    const greeting = name
      ? `Ciao ${name}, ti contatto da Innovazione Termica.`
      : `Salve, vi contatto da Innovazione Termica.`;

    const url = `https://wa.me/${clean}?text=${encodeURIComponent(greeting)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const handleOpenNew = () => {
    setForm({ ...EMPTY });
    setOpen(true);
  };

  const handleOpenEdit = (c: any) => {
    setForm({
      ...EMPTY,
      ...c,
      client_type: getClientType(c),
    });
    setOpen(true);
  };

  const submit = async () => {
    if (!form.name.trim()) {
      return toast.error("Inserisci il nome o la ragione sociale del cliente.");
    }

    try {
      await save.mutateAsync({
        ...form,
        client_type: form.client_type,
      });
      toast.success(form.id ? "Cliente aggiornato con successo." : "Cliente salvato con successo.");
      setOpen(false);
    } catch {
      toast.error("Salvataggio non riuscito.");
    }
  };

  return (
    <AppLayout
      title="Clienti"
      description="Privati e aziende, con i cantieri collegati."
      actions={
        <Button
          onClick={handleOpenNew}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-2.5 sm:px-4 py-2 shadow-xs rounded-lg gap-1.5 shrink-0"
        >
          <div className="flex items-center gap-1">
            <Plus className="size-3.5 stroke-[2.5]" />
            <Users className="size-4" />
          </div>
          <span className="hidden sm:inline">Nuovo cliente</span>
          <span className="sm:hidden text-xs">Nuovo</span>
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Indicatori Rapidi (KPI Cards interattive) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setTypeFilter("all")}
            className={`rounded-xl border p-3.5 sm:p-4 text-left transition-all bg-card shadow-xs flex flex-col justify-between min-h-[96px] sm:min-h-[104px] ${
              typeFilter === "all"
                ? "border-primary ring-1 ring-primary/20 shadow-xs"
                : "border-border hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Totale clienti</span>
              <Users className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums mt-1">
                {stats.total}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground/80 mt-0.5 truncate">
                Anagrafiche registrate
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter("privato")}
            className={`rounded-xl border p-3.5 sm:p-4 text-left transition-all bg-card shadow-xs flex flex-col justify-between min-h-[96px] sm:min-h-[104px] ${
              typeFilter === "privato"
                ? "border-primary ring-1 ring-primary/20 shadow-xs"
                : "border-border hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Privati</span>
              <User className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums mt-1">
                {stats.privati}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground/80 mt-0.5 truncate">
                Clienti privati
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTypeFilter("azienda")}
            className={`rounded-xl border p-3.5 sm:p-4 text-left transition-all bg-card shadow-xs flex flex-col justify-between min-h-[96px] sm:min-h-[104px] ${
              typeFilter === "azienda"
                ? "border-blue-500 ring-1 ring-blue-500/20 shadow-xs"
                : "border-border hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center justify-between text-blue-700 dark:text-blue-400">
              <span className="text-xs font-medium">Aziende</span>
              <Building2 className="size-4" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums mt-1">
                {stats.aziende}
              </p>
              <p className="text-[11px] sm:text-xs text-blue-600/80 mt-0.5 truncate">
                Società e Partite IVA
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setCantieriFilter("with_cantieri")}
            className={`rounded-xl border p-3.5 sm:p-4 text-left transition-all bg-card shadow-xs flex flex-col justify-between min-h-[96px] sm:min-h-[104px] ${
              cantieriFilter === "with_cantieri"
                ? "border-emerald-500 ring-1 ring-emerald-500/20 shadow-xs"
                : "border-border hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-400">
              <span className="text-xs font-medium">Con cantieri</span>
              <Wrench className="size-4" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums mt-1">
                {stats.withCantieri}
              </p>
              <p className="text-[11px] sm:text-xs text-emerald-600/80 mt-0.5 truncate">
                Interventi all'attivo
              </p>
            </div>
          </button>
        </div>

        {/* Toolbar con filtri multipli dettagliati */}
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 shadow-xs space-y-3">
          <div className="flex flex-col md:grid md:grid-cols-12 gap-3">
            {/* Ricerca per testo + Toggle filtri mobile */}
            <div className="flex items-center gap-2 md:col-span-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cerca per nome, telefono, città, P.IVA..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 bg-background shadow-xs rounded-lg"
                />
              </div>
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
              {/* Filtro 1: Tipo */}
              <div>
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="bg-background shadow-xs rounded-lg">
                    <SelectValue placeholder="Tutti i tipi" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i tipi</SelectItem>
                    <SelectItem value="privato">Privato</SelectItem>
                    <SelectItem value="azienda">Azienda</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro 2: Città */}
              <div>
                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="bg-background shadow-xs rounded-lg">
                    <SelectValue placeholder="Città" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le città</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro 3: Cantieri */}
              <div>
                <Select value={cantieriFilter} onValueChange={setCantieriFilter}>
                  <SelectTrigger className="bg-background shadow-xs rounded-lg">
                    <SelectValue placeholder="Cantieri" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i cantieri</SelectItem>
                    <SelectItem value="with_cantieri">Con cantieri (&gt; 0)</SelectItem>
                    <SelectItem value="no_cantieri">Senza cantieri (0)</SelectItem>
                    <SelectItem value="frequent">Clienti frequenti (≥ 3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro 4: Recapiti */}
              <div>
                <Select value={contactFilter} onValueChange={setContactFilter}>
                  <SelectTrigger className="bg-background shadow-xs rounded-lg">
                    <SelectValue placeholder="Recapito" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i recapiti</SelectItem>
                    <SelectItem value="has_phone">Con telefono</SelectItem>
                    <SelectItem value="has_email">Con e-mail</SelectItem>
                    <SelectItem value="has_address">Con indirizzo</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Reset Filtri Bar */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
              <span className="text-muted-foreground">
                Trovati <strong className="text-foreground">{filteredRows.length}</strong> clienti
                su {allClients.length}
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

        {/* Modalità Lista / Tabella Clienti */}
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="font-semibold text-foreground py-3 pl-4">Cliente</TableHead>
                <TableHead className="font-semibold text-foreground py-3">Tipo</TableHead>
                <TableHead className="font-semibold text-foreground py-3">Telefono</TableHead>
                <TableHead className="font-semibold text-foreground py-3">
                  Città / Indirizzo
                </TableHead>
                <TableHead className="font-semibold text-foreground py-3 text-center">
                  Cantieri
                </TableHead>
                <TableHead className="font-semibold text-foreground py-3">Creato il</TableHead>
                <TableHead className="font-semibold text-foreground py-3 pr-4 text-right">
                  Azioni
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-36 text-center text-sm text-muted-foreground">
                    {hasActiveFilters ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <p>Nessun cliente corrisponde ai filtri impostati.</p>
                        <Button variant="outline" size="sm" onClick={resetFilters}>
                          Reimposta filtri
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Users className="size-8 text-muted-foreground/40" />
                        <p>Nessun cliente registrato. Aggiungi la prima anagrafica.</p>
                        <Button size="sm" onClick={handleOpenNew}>
                          <Plus className="mr-1.5 size-4" /> Nuovo cliente
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((c: any) => {
                  const cType = getClientType(c);
                  const cantieri = getCantieriCount(c.id);
                  const isAzienda = cType === "azienda";

                  return (
                    <TableRow
                      key={c.id}
                      className="hover:bg-muted/40 transition-colors border-b border-border/60"
                    >
                      {/* Cliente */}
                      <TableCell className="py-3.5 pl-4">
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(c)}
                            className="font-semibold text-foreground hover:text-primary transition-colors text-left block truncate"
                          >
                            {c.name}
                          </button>
                          {c.email ? (
                            <p className="text-xs text-muted-foreground truncate mt-0.5">
                              {c.email}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>

                      {/* Tipo */}
                      <TableCell className="py-3.5 text-sm text-foreground">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium ${
                            isAzienda
                              ? "bg-blue-50 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                              : "bg-muted text-muted-foreground"
                          }`}
                        >
                          {isAzienda ? (
                            <Building2 className="size-3" />
                          ) : (
                            <User className="size-3" />
                          )}
                          {isAzienda ? "Azienda" : "Privato"}
                        </span>
                      </TableCell>

                      {/* Telefono */}
                      <TableCell className="py-3.5 text-sm text-muted-foreground">
                        {c.phone ? (
                          <a
                            href={`tel:${c.phone}`}
                            className="hover:text-primary hover:underline transition-colors font-mono text-xs"
                          >
                            {c.phone}
                          </a>
                        ) : (
                          <span className="text-muted-foreground/50">—</span>
                        )}
                      </TableCell>

                      {/* Città / Indirizzo */}
                      <TableCell className="py-3.5 text-sm text-muted-foreground">
                        <div className="min-w-0 max-w-xs">
                          <p className="font-medium text-foreground text-xs">{c.city || "—"}</p>
                          {c.address ? (
                            <p className="text-[11px] text-muted-foreground truncate">
                              {c.address}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>

                      {/* Cantieri */}
                      <TableCell className="py-3.5 text-sm text-center">
                        <span
                          className={`inline-flex items-center justify-center min-w-6 px-1.5 py-0.5 rounded-full text-xs font-bold ${
                            cantieri > 0 ? "bg-primary/10 text-primary" : "text-muted-foreground/60"
                          }`}
                        >
                          {cantieri}
                        </span>
                      </TableCell>

                      {/* Creato il */}
                      <TableCell className="py-3.5 text-sm text-muted-foreground text-xs">
                        {formatDate(c.created_at || new Date().toISOString())}
                      </TableCell>

                      {/* Azioni dirette sulla riga */}
                      <TableCell className="py-3.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* TASTO WHATSAPP */}
                          {c.phone ? (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => openWhatsApp(c.phone, c.name)}
                              className="size-8 text-[#25D366] hover:bg-[#25D366]/15 hover:text-[#20BA5A] transition-colors"
                              title="Contatta su WhatsApp"
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
                              title="Nessun numero per WhatsApp"
                            >
                              <WhatsAppIcon className="size-4" />
                            </Button>
                          )}

                          {/* Chiama (se presente telefono) */}
                          {c.phone ? (
                            <Button
                              asChild
                              size="icon"
                              variant="ghost"
                              className="size-8 text-muted-foreground hover:text-foreground"
                              title="Chiama al telefono"
                            >
                              <a href={`tel:${c.phone}`}>
                                <Phone className="size-4" />
                              </a>
                            </Button>
                          ) : null}

                          {/* Invia Email (se presente email) */}
                          {c.email ? (
                            <Button
                              asChild
                              size="icon"
                              variant="ghost"
                              className="size-8 text-muted-foreground hover:text-foreground"
                              title="Invia email"
                            >
                              <a href={`mailto:${c.email}`}>
                                <Mail className="size-4" />
                              </a>
                            </Button>
                          ) : null}

                          {/* Crea documento per cliente (Preventivo, Fattura, Intervento) */}
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                type="button"
                                size="icon"
                                variant="ghost"
                                className="size-8 text-muted-foreground hover:text-primary cursor-pointer"
                                title="Crea documento per questo cliente"
                              >
                                <FileText className="size-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                              <DropdownMenuItem
                                onClick={() => {
                                  navigate({ to: "/preventivi" });
                                  toast.info(`Crea un preventivo per ${c.name}`);
                                }}
                                className="cursor-pointer text-xs"
                              >
                                <FileText className="mr-2 size-4 text-primary" />
                                Nuovo preventivo
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  navigate({ to: "/fatture" });
                                  toast.info(`Crea una fattura per ${c.name}`);
                                }}
                                className="cursor-pointer text-xs"
                              >
                                <Receipt className="mr-2 size-4 text-emerald-600" />
                                Nuova fattura
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => {
                                  navigate({ to: "/interventi" });
                                  toast.info(`Crea un intervento per ${c.name}`);
                                }}
                                className="cursor-pointer text-xs"
                              >
                                <Wrench className="mr-2 size-4 text-amber-600" />
                                Nuovo intervento
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>

                          {/* Modifica */}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenEdit(c)}
                            className="size-8 text-muted-foreground hover:text-foreground"
                            title="Modifica anagrafica"
                          >
                            <Pencil className="size-4" />
                          </Button>

                          {/* Elimina */}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Eliminare il cliente ${c.name}?`)) {
                                remove.mutate(c.id);
                              }
                            }}
                            className="size-8 text-destructive hover:bg-destructive/10"
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
        </div>
      </div>

      {/* Dialog Nuovo / Modifica Cliente */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{form.id ? "Modifica cliente" : "Nuovo cliente"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Tipo Cliente Switcher */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">Tipo cliente</Label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  variant={form.client_type === "privato" ? "default" : "outline"}
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => setForm((prev) => ({ ...prev, client_type: "privato" }))}
                >
                  <User className="size-4" /> Privato
                </Button>
                <Button
                  type="button"
                  variant={form.client_type === "azienda" ? "default" : "outline"}
                  className="w-full flex items-center justify-center gap-2"
                  onClick={() => setForm((prev) => ({ ...prev, client_type: "azienda" }))}
                >
                  <Building2 className="size-4" /> Azienda
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c_name">
                {form.client_type === "azienda"
                  ? "Ragione sociale / Nome azienda *"
                  : "Nome e Cognome *"}
              </Label>
              <Input
                id="c_name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder={
                  form.client_type === "azienda"
                    ? "Es. Termoidraulica Roma Srl"
                    : "Es. Maurizio Tanforti"
                }
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="c_phone">Telefono</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="c_phone"
                    value={form.phone}
                    onChange={(e) => setForm((prev) => ({ ...prev, phone: e.target.value }))}
                    className="pl-9"
                    placeholder="Es. 3891344474"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c_email">E-mail</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="c_email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((prev) => ({ ...prev, email: e.target.value }))}
                    className="pl-9"
                    placeholder="nome@email.it"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c_address">Indirizzo</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="c_address"
                  value={form.address}
                  onChange={(e) => setForm((prev) => ({ ...prev, address: e.target.value }))}
                  className="pl-9"
                  placeholder="Via / Piazza e civico"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="c_city">Città</Label>
                <Input
                  id="c_city"
                  value={form.city}
                  onChange={(e) => setForm((prev) => ({ ...prev, city: e.target.value }))}
                  placeholder="Roma"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="c_zip">CAP</Label>
                <Input
                  id="c_zip"
                  value={form.zip}
                  onChange={(e) => setForm((prev) => ({ ...prev, zip: e.target.value }))}
                  placeholder="00100"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c_vat">
                {form.client_type === "azienda" ? "Partita IVA" : "Codice Fiscale / P.IVA"}
              </Label>
              <Input
                id="c_vat"
                value={form.vat_number}
                onChange={(e) => setForm((prev) => ({ ...prev, vat_number: e.target.value }))}
                placeholder=""
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="c_notes">Note</Label>
              <Textarea
                id="c_notes"
                rows={2}
                value={form.notes}
                onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Dettagli impianto, accesso, codice cancello..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="button" onClick={submit} disabled={save.isPending}>
              {save.isPending ? "Salvataggio..." : "Salva cliente"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
