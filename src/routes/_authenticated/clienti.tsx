import { useCallback, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
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
  Settings,
  SlidersHorizontal,
  Trash2,
  User,
  Users,
  Wrench,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AppLayout } from "@/components/AppLayout";
import { KPISummaryCard } from "@/components/KPISummaryCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import {
  ClienteQuickCreateModal,
  type ClienteQuickInitialData,
} from "@/components/clienti/ClienteQuickCreateModal";
import {
  ClienteInlineEditor,
  type ClientFormValue,
} from "@/components/clienti/ClienteInlineEditor";
import { useList, useRemove, useSave } from "@/hooks/data";

export const Route = createFileRoute("/_authenticated/clienti")({
  head: () => ({
    meta: [
      { title: "Clienti — Azienda Demo Srl" },
      {
        name: "description",
        content: "Privati e aziende, con i cantieri collegati.",
      },
      { property: "og:title", content: "Clienti — Azienda Demo Srl" },
      {
        property: "og:description",
        content: "Privati e aziende, con i cantieri collegati.",
      },
    ],
  }),
  component: ClientiPage,
});

type ClientType = "privato" | "azienda";

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

  // Cliente correntemente in compilazione diretta inline (senza modale esterna)
  const [editingClient, setEditingClient] = useState<ClientFormValue | null>(null);

  // Scheda apertura rapida con poche informazioni essenziali
  const [quickCreateOpen, setQuickCreateOpen] = useState(false);

  // Filtri elenco
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [cityFilter, setCityFilter] = useState<string>("all");
  const [cantieriFilter, setCantieriFilter] = useState<string>("all");
  const [contactFilter, setContactFilter] = useState<string>("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const allClients = useMemo(() => clients.data ?? [], [clients.data]);
  const allInterventions = useMemo(() => interventions.data ?? [], [interventions.data]);
  const allQuotes = useMemo(() => quotes.data ?? [], [quotes.data]);

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

  const getQuotesCount = useCallback(
    (clientId: string) => {
      return allQuotes.filter((q: any) => q.client_id === clientId).length;
    },
    [allQuotes],
  );

  // Apertura scheda rapida con poche informazioni essenziali
  const handleOpenQuickCreate = () => {
    setQuickCreateOpen(true);
  };

  // Conferma scheda apertura rapida: crea il cliente e lo apre inline
  const handleQuickCreateConfirm = async (data: ClienteQuickInitialData) => {
    setQuickCreateOpen(false);

    const newClient: ClientFormValue = {
      name: data.name,
      client_type: data.client_type,
      phone: data.phone,
      city: data.city,
      address: data.address || "",
      zip: "",
      vat_number: "",
      notes: "",
      fiscal_code: "",
      sdi_code: "",
      pec_email: "",
      second_phone: "",
      province: "",
      cantiere_notes: "",
      payment_method_id: "",
      payment_method: "",
      payment_iban: "",
      payment_terms: "",
      technical_notes: "",
      exclusions: "",
    };

    try {
      const res = await save.mutateAsync({
        ...newClient,
      });

      setEditingClient({
        ...newClient,
        id: (res as any)?.id,
      });
      toast.success(
        `Cliente ${data.name} creato. Ora puoi completare l'anagrafica direttamente qui.`,
      );
    } catch {
      toast.error("Errore durante la creazione del cliente.");
    }
  };

  // Salvataggio del cliente compilato inline
  const handleSaveClient = async (val: ClientFormValue) => {
    if (!val.name.trim()) {
      toast.error("Inserisci il nome o la ragione sociale del cliente.");
      return;
    }

    try {
      await save.mutateAsync({
        ...val,
      });
      toast.success(`Anagrafica di ${val.name} salvata con successo.`);
    } catch {
      toast.error("Errore durante il salvataggio del cliente.");
    }
  };

  // Apertura di un cliente esistente per modifica inline
  const handleOpenEditInline = (c: any) => {
    setEditingClient({
      id: c.id,
      name: c.name || "",
      client_type: getClientType(c),
      email: c.email || "",
      phone: c.phone || "",
      address: c.address || "",
      city: c.city || "",
      zip: c.zip || "",
      vat_number: c.vat_number || "",
      notes: c.notes || "",
      fiscal_code: c.fiscal_code || "",
      sdi_code: c.sdi_code || "",
      pec_email: c.pec_email || "",
      second_phone: c.second_phone || "",
      province: c.province || "",
      cantiere_notes: c.cantiere_notes || "",
      payment_method_id: c.payment_method_id || "",
      payment_method: c.payment_method || "",
      payment_iban: c.payment_iban || "",
      payment_terms: c.payment_terms || "",
      technical_notes: c.technical_notes || "",
      exclusions: c.exclusions || "",
    });
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
      ? `Ciao ${name}, ti contatto da Azienda Demo Srl.`
      : `Salve, vi contatto da Azienda Demo Srl.`;

    const url = `https://wa.me/${clean}?text=${encodeURIComponent(greeting)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

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

      const cType = getClientType(c);
      if (typeFilter === "privato" && cType !== "privato") return false;
      if (typeFilter === "azienda" && cType !== "azienda") return false;

      if (cityFilter !== "all" && c.city !== cityFilter) return false;

      const cantieri = getCantieriCount(c.id);
      if (cantieriFilter === "with_cantieri" && cantieri === 0) return false;
      if (cantieriFilter === "no_cantieri" && cantieri > 0) return false;
      if (cantieriFilter === "frequent" && cantieri < 3) return false;

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

  // Se è in corso la compilazione/modifica di un cliente, mostriamo l'editor direttamente nella sezione!
  if (editingClient) {
    const cantieri = editingClient.id ? getCantieriCount(editingClient.id) : 0;
    const qCount = editingClient.id ? getQuotesCount(editingClient.id) : 0;

    return (
      <AppLayout
        title={editingClient.name || "Scheda Cliente"}
        description={`Gestione anagrafica e recapiti per ${editingClient.name || "nuovo cliente"}`}
      >
        <ClienteInlineEditor
          value={editingClient}
          onChange={setEditingClient}
          onSave={() => handleSaveClient(editingClient)}
          onBack={() => setEditingClient(null)}
          saving={save.isPending}
          interventionsCount={cantieri}
          quotesCount={qCount}
          onDelete={async () => {
            if (editingClient.id && confirm(`Eliminare il cliente ${editingClient.name}?`)) {
              await remove.mutateAsync(editingClient.id);
              setEditingClient(null);
              toast.success("Cliente eliminato con successo.");
            }
          }}
        />
      </AppLayout>
    );
  }

  return (
    <AppLayout
      title="Clienti"
      description="Privati e aziende, con i cantieri collegati."
      actions={
        <Button
          onClick={handleOpenQuickCreate}
          className="h-9 px-3 sm:px-4 text-xs sm:text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold shadow-xs rounded-lg gap-1.5 shrink-0 cursor-pointer"
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
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 w-full min-w-0">
          <KPISummaryCard
            label="Totale clienti"
            value={stats.total}
            hint="Anagrafiche registrate"
            icon={Users}
            tone="primary"
            isActive={typeFilter === "all" && cantieriFilter === "all"}
            onClick={() => {
              setTypeFilter("all");
              setCantieriFilter("all");
            }}
          />
          <KPISummaryCard
            label="Privati"
            value={stats.privati}
            hint="Clienti privati"
            icon={User}
            tone="blue"
            isActive={typeFilter === "privato"}
            onClick={() => setTypeFilter(typeFilter === "privato" ? "all" : "privato")}
          />
          <KPISummaryCard
            label="Aziende"
            value={stats.aziende}
            hint="Aziende e ditte"
            icon={Building2}
            tone="purple"
            isActive={typeFilter === "azienda"}
            onClick={() => setTypeFilter(typeFilter === "azienda" ? "all" : "azienda")}
          />
          <KPISummaryCard
            label="Con cantieri"
            value={stats.withCantieri}
            hint="Interventi registrati"
            icon={Wrench}
            tone="emerald"
            isActive={cantieriFilter === "with_cantieri"}
            onClick={() =>
              setCantieriFilter(cantieriFilter === "with_cantieri" ? "all" : "with_cantieri")
            }
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
                  placeholder="Cerca cliente, telefono, città, email o P.IVA..."
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
                  {/* Filtro Tipo */}
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger className="h-9 text-xs w-[130px] bg-background border-border">
                      <SelectValue placeholder="Tipologia" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutte le tipologie</SelectItem>
                      <SelectItem value="privato">Solo Privati</SelectItem>
                      <SelectItem value="azienda">Solo Aziende</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Filtro Città */}
                  <Select value={cityFilter} onValueChange={setCityFilter}>
                    <SelectTrigger className="h-9 text-xs w-[130px] bg-background border-border">
                      <SelectValue placeholder="Città" />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      <SelectItem value="all">Tutte le città</SelectItem>
                      {cities.map((city) => (
                        <SelectItem key={city} value={city}>
                          {city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Filtro Cantieri */}
                  <Select value={cantieriFilter} onValueChange={setCantieriFilter}>
                    <SelectTrigger className="h-9 text-xs w-[140px] bg-background border-border">
                      <SelectValue placeholder="Cantieri" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti i cantieri</SelectItem>
                      <SelectItem value="with_cantieri">Con cantieri (&gt;0)</SelectItem>
                      <SelectItem value="no_cantieri">Senza cantieri (0)</SelectItem>
                      <SelectItem value="frequent">Frequenti (3+)</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Filtro Canali Contatto */}
                  <Select value={contactFilter} onValueChange={setContactFilter}>
                    <SelectTrigger className="h-9 text-xs w-[140px] bg-background border-border">
                      <SelectValue placeholder="Canali" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Tutti i canali</SelectItem>
                      <SelectItem value="has_phone">Con telefono</SelectItem>
                      <SelectItem value="has_email">Con e-mail</SelectItem>
                      <SelectItem value="has_address">Con indirizzo</SelectItem>
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
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Tipologia" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le tipologie</SelectItem>
                    <SelectItem value="privato">Solo Privati</SelectItem>
                    <SelectItem value="azienda">Solo Aziende</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={cityFilter} onValueChange={setCityFilter}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Città" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    <SelectItem value="all">Tutte le città</SelectItem>
                    {cities.map((city) => (
                      <SelectItem key={city} value={city}>
                        {city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={cantieriFilter} onValueChange={setCantieriFilter}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Cantieri" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i cantieri</SelectItem>
                    <SelectItem value="with_cantieri">Con cantieri (&gt;0)</SelectItem>
                    <SelectItem value="no_cantieri">Senza cantieri (0)</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={contactFilter} onValueChange={setContactFilter}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Canali" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i canali</SelectItem>
                    <SelectItem value="has_phone">Con telefono</SelectItem>
                    <SelectItem value="has_email">Con e-mail</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>

          {/* Tabella Clienti */}
          <Table>
            <TableHeader className="bg-muted/40">
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[200px] sm:w-[260px]">Nome / Ragione Sociale</TableHead>
                <TableHead className="w-[110px]">Tipologia</TableHead>
                <TableHead>Contatti & Telefono</TableHead>
                <TableHead>Indirizzo & Città</TableHead>
                <TableHead className="w-[100px] text-center">Cantieri</TableHead>
                <TableHead className="w-[140px] text-right">Azioni</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                    <Users className="size-8 mx-auto mb-2 opacity-40" />
                    <p className="font-medium">Nessun cliente trovato</p>
                    <p className="text-xs mt-0.5">
                      {hasActiveFilters
                        ? "Prova a modificare i filtri applicati."
                        : "Crea il tuo primo cliente cliccando su 'Nuovo cliente'."}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((c: any) => {
                  const cantieri = getCantieriCount(c.id);
                  const isAzienda = getClientType(c) === "azienda";

                  return (
                    <TableRow
                      key={c.id}
                      className="group hover:bg-muted/30 transition-colors cursor-pointer"
                      onClick={(e) => {
                        if ((e.target as HTMLElement).closest("button, input, a")) return;
                        handleOpenEditInline(c);
                      }}
                    >
                      <TableCell>
                        <div className="font-semibold text-foreground text-xs sm:text-sm">
                          {c.name}
                        </div>
                        {c.vat_number && (
                          <div className="text-[11px] text-muted-foreground font-mono">
                            {isAzienda ? `P.IVA ${c.vat_number}` : `CF/P.IVA ${c.vat_number}`}
                          </div>
                        )}
                      </TableCell>

                      <TableCell>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            isAzienda
                              ? "bg-purple-500/10 text-purple-600 border border-purple-500/20"
                              : "bg-blue-500/10 text-blue-600 border border-blue-500/20"
                          }`}
                        >
                          {isAzienda ? (
                            <>
                              <Building2 className="size-3" /> Azienda
                            </>
                          ) : (
                            <>
                              <User className="size-3" /> Privato
                            </>
                          )}
                        </span>
                      </TableCell>

                      <TableCell>
                        <div className="space-y-0.5 text-xs text-muted-foreground">
                          {c.phone && (
                            <div className="flex items-center gap-1.5">
                              <Phone className="size-3 text-muted-foreground shrink-0" />
                              <a
                                href={`tel:${c.phone}`}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-primary"
                              >
                                {c.phone}
                              </a>
                            </div>
                          )}
                          {c.email && (
                            <div className="flex items-center gap-1.5 truncate max-w-[180px]">
                              <Mail className="size-3 text-muted-foreground shrink-0" />
                              <a
                                href={`mailto:${c.email}`}
                                onClick={(e) => e.stopPropagation()}
                                className="hover:text-primary truncate"
                              >
                                {c.email}
                              </a>
                            </div>
                          )}
                          {!c.phone && !c.email && (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          {c.address ? (
                            <div className="flex items-center gap-1.5 truncate max-w-[200px]">
                              <MapPin className="size-3 text-muted-foreground shrink-0" />
                              <span className="truncate">
                                {c.address}
                                {c.city ? `, ${c.city}` : ""}
                              </span>
                            </div>
                          ) : c.city ? (
                            <span>{c.city}</span>
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </div>
                      </TableCell>

                      <TableCell className="text-center">
                        <Badge
                          variant="secondary"
                          className={cn(
                            "font-mono text-xs",
                            cantieri > 0 && "bg-primary/10 text-primary border-primary/20",
                          )}
                        >
                          {cantieri}
                        </Badge>
                      </TableCell>

                      <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {/* Modifica Inline */}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenEditInline(c)}
                            className="size-8 text-primary hover:text-primary hover:bg-primary/10 cursor-pointer"
                            title="Modifica anagrafica"
                          >
                            <Pencil className="size-4" />
                          </Button>

                          {/* WhatsApp */}
                          {c.phone && (
                            <Button
                              type="button"
                              size="icon"
                              variant="ghost"
                              onClick={() => openWhatsApp(c.phone, c.name)}
                              className="size-8 text-[#25D366] hover:bg-[#25D366]/10 cursor-pointer"
                              title="Invia tramite WhatsApp"
                            >
                              <WhatsAppIcon className="size-4" />
                            </Button>
                          )}

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
                            className="size-8 text-destructive hover:bg-destructive/10 cursor-pointer"
                            title="Elimina cliente"
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
                {filteredRows.length} {filteredRows.length === 1 ? "cliente" : "clienti"}
              </span>
            </div>
            <span className="font-semibold text-foreground">
              {stats.privati} privati · {stats.aziende} aziende
            </span>
          </div>
        </div>
      </div>

      {/* Scheda Rapida di Creazione Cliente */}
      <ClienteQuickCreateModal
        open={quickCreateOpen}
        onOpenChange={setQuickCreateOpen}
        onConfirm={handleQuickCreateConfirm}
      />
    </AppLayout>
  );
}
