import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  AlertTriangle,
  BookOpen,
  Boxes,
  CheckCircle2,
  ChevronDown,
  Copy,
  DollarSign,
  Download,
  FilterX,
  Minus,
  Pencil,
  Plus,
  Search,
  Settings,
  SlidersHorizontal,
  Tag,
  Trash2,
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
import { Label } from "@/components/ui/label";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useList, useRemove, useSave } from "@/hooks/data";
import { formatCurrency } from "@/lib/doc";

export const Route = createFileRoute("/_authenticated/catalogo")({
  head: () => ({
    meta: [
      { title: "Catalogo — INNOVAZIONE TERMICA" },
      {
        name: "description",
        content: "Catalogo voci, ricambi, materiali e prestazioni con gestione scorte e listini.",
      },
      { property: "og:title", content: "Catalogo — INNOVAZIONE TERMICA" },
      {
        property: "og:description",
        content: "Gestione catalogo articoli e prezzi per idraulica e termica.",
      },
    ],
  }),
  component: CatalogoPage,
});

const DEFAULT_CATEGORIES = [
  "Caldaie e Climatizzazione",
  "Idraulica e Tubature",
  "Sanitari e Rubinetteria",
  "Raccorderia e Valvole",
  "Manodopera e Servizi",
  "Materiale di consumo",
  "Altro",
];

const EMPTY_ITEM = {
  id: undefined as string | undefined,
  code: "",
  name: "",
  category: "Idraulica e Tubature",
  quantity: 1,
  min_quantity: 1,
  unit_price: 0,
  supplier: "",
};

function WhatsAppIcon({ className = "size-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c-.001 2.096.547 4.142 1.588 5.945L0 24l6.335-1.662c1.746.953 3.71 1.455 5.711 1.456h.005c6.554 0 11.89-5.336 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
    </svg>
  );
}

/* eslint-disable @typescript-eslint/no-explicit-any */
function CatalogoPage() {
  const items = useList<any>("inventory_items");
  const save = useSave("inventory_items");
  const remove = useRemove("inventory_items");

  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ ...EMPTY_ITEM });

  // Selezione multipla
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Filtri
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [stockFilter, setStockFilter] = useState<string>("all");
  const [priceFilter, setPriceFilter] = useState<string>("all");
  const [supplierFilter, setSupplierFilter] = useState<string>("all");
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const allItems = useMemo(() => items.data ?? [], [items.data]);

  // Fornitori unici
  const suppliers = useMemo(() => {
    const list = Array.from(
      new Set(
        allItems
          .map((i: any) => i.supplier?.trim())
          .filter((s: string | undefined): s is string => Boolean(s)),
      ),
    );
    list.sort();
    return list;
  }, [allItems]);

  // Categorie uniche
  const categories = useMemo(() => {
    const set = new Set(DEFAULT_CATEGORIES);
    for (const item of allItems) {
      if (item.category?.trim()) set.add(item.category.trim());
    }
    return Array.from(set);
  }, [allItems]);

  // Indicatori rapidi (KPI)
  const stats = useMemo(() => {
    let totalQty = 0;
    let totalVal = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const item of allItems) {
      const q = Number(item.quantity || 0);
      const min = Number(item.min_quantity || 0);
      const p = Number(item.unit_price || 0);

      totalQty += q;
      totalVal += q * p;

      if (q === 0) {
        outOfStockCount++;
      } else if (q <= min) {
        lowStockCount++;
      }
    }

    return {
      totalItems: allItems.length,
      totalQty,
      totalVal,
      lowStockCount,
      outOfStockCount,
    };
  }, [allItems]);

  // Filtraggio avanzato
  const filteredRows = useMemo(() => {
    return allItems.filter((item: any) => {
      // Ricerca testuale
      const q = search.toLowerCase();
      const code = (item.code || "").toLowerCase();
      const name = (item.name || "").toLowerCase();
      const cat = (item.category || "").toLowerCase();
      const sup = (item.supplier || "").toLowerCase();

      if (
        search &&
        !code.includes(q) &&
        !name.includes(q) &&
        !cat.includes(q) &&
        !sup.includes(q)
      ) {
        return false;
      }

      // Filtro categoria
      if (categoryFilter !== "all" && item.category !== categoryFilter) {
        return false;
      }

      // Filtro fornitore
      if (supplierFilter !== "all" && item.supplier !== supplierFilter) {
        return false;
      }

      // Filtro giacenza
      const qty = Number(item.quantity || 0);
      const minQty = Number(item.min_quantity || 0);

      if (stockFilter === "available" && qty <= 0) return false;
      if (stockFilter === "low_stock" && (qty <= 0 || qty > minQty)) return false;
      if (stockFilter === "out_of_stock" && qty > 0) return false;

      // Filtro prezzo
      const price = Number(item.unit_price || 0);
      if (priceFilter === "under_50" && price >= 50) return false;
      if (priceFilter === "50_250" && (price < 50 || price > 250)) return false;
      if (priceFilter === "250_1000" && (price < 250 || price > 1000)) return false;
      if (priceFilter === "over_1000" && price <= 1000) return false;

      return true;
    });
  }, [allItems, search, categoryFilter, supplierFilter, stockFilter, priceFilter]);

  const hasActiveFilters =
    search.trim() !== "" ||
    categoryFilter !== "all" ||
    stockFilter !== "all" ||
    priceFilter !== "all" ||
    supplierFilter !== "all";

  const activeFilterCount =
    (categoryFilter !== "all" ? 1 : 0) +
    (stockFilter !== "all" ? 1 : 0) +
    (priceFilter !== "all" ? 1 : 0) +
    (supplierFilter !== "all" ? 1 : 0);

  const resetFilters = () => {
    setSearch("");
    setCategoryFilter("all");
    setStockFilter("all");
    setPriceFilter("all");
    setSupplierFilter("all");
  };

  const handleOpenNew = () => {
    setForm({ ...EMPTY_ITEM });
    setOpen(true);
  };

  const handleOpenEdit = (item: any) => {
    setForm({
      ...EMPTY_ITEM,
      ...item,
      quantity: Number(item.quantity || 0),
      min_quantity: Number(item.min_quantity || 0),
      unit_price: Number(item.unit_price || 0),
    });
    setOpen(true);
  };

  const handleDuplicate = (item: any) => {
    const nextCode = item.code ? `${item.code}-COPY` : "";
    setForm({
      ...EMPTY_ITEM,
      ...item,
      id: undefined,
      code: nextCode,
      name: `${item.name} (Copia)`,
      quantity: Number(item.quantity || 0),
      min_quantity: Number(item.min_quantity || 0),
      unit_price: Number(item.unit_price || 0),
    });
    setOpen(true);
    toast.info("Voce duplicata. Modifica e salva la nuova voce.");
  };

  const handleAdjustQuantity = async (item: any, delta: number) => {
    const newQty = Math.max(0, Number(item.quantity || 0) + delta);
    try {
      await save.mutateAsync({
        id: item.id,
        quantity: newQty,
      });
      toast.success(`Giacenza aggiornata: ${newQty}`);
    } catch {
      toast.error("Impossibile aggiornare la giacenza.");
    }
  };

  const handleShareWhatsApp = (item: any) => {
    const text = `*${item.name}* (Cod: ${item.code || "-"})\nPrezzo: ${formatCurrency(Number(item.unit_price || 0))}\nDisponibilità: ${item.quantity} pz\n— Innovazione Termica`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const submit = async () => {
    if (!form.name.trim()) {
      return toast.error("Inserisci la descrizione o il nome della voce.");
    }

    try {
      await save.mutateAsync({
        ...form,
        quantity: Number(form.quantity || 0),
        min_quantity: Number(form.min_quantity || 0),
        unit_price: Number(form.unit_price || 0),
      });
      toast.success(form.id ? "Voce catalogo aggiornata." : "Nuova voce salvata nel catalogo.");
      setOpen(false);
    } catch {
      toast.error("Salvataggio non riuscito.");
    }
  };

  const getStockBadge = (quantity: number, minQuantity: number) => {
    if (quantity === 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800">
          <XCircle className="size-3" /> Esaurito
        </span>
      );
    }
    if (quantity <= minQuantity) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800">
          <AlertTriangle className="size-3" /> Sotto scorta
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800">
        <CheckCircle2 className="size-3" /> Disponibile
      </span>
    );
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;
    if (
      !confirm(`Sei sicuro di voler eliminare ${selectedIds.length} voci selezionate dal catalogo?`)
    )
      return;
    try {
      for (const id of selectedIds) {
        await remove.mutateAsync(id);
      }
      setSelectedIds([]);
      toast.success("Voci eliminate con successo.");
    } catch {
      toast.error("Errore durante l'eliminazione.");
    }
  };

  const handleDuplicateSingleSelected = () => {
    if (selectedIds.length !== 1) return;
    const item = allItems.find((i: any) => i.id === selectedIds[0]);
    if (item) handleDuplicate(item);
  };

  const handleExportCsv = () => {
    const rowsToExport =
      selectedIds.length > 0
        ? filteredRows.filter((r: any) => selectedIds.includes(r.id))
        : filteredRows;
    const csv = [
      "Codice,Descrizione,Categoria,Prezzo Unitario,Giacenza,Min Scorta,Fornitore",
      ...rowsToExport.map((item: any) => {
        return `"${item.code || ""}","${item.name || ""}","${item.category || ""}","${item.unit_price || 0}","${item.quantity || 0}","${item.min_quantity || 0}","${item.supplier || ""}"`;
      }),
    ].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "catalogo.csv";
    link.click();
    toast.success("Elenco catalogo esportato.");
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

  return (
    <AppLayout
      title="Catalogo"
      description="Gestione voci di capitolato, ricambi, materiali e prestazioni con prezzi e scorte."
      actions={
        <Button
          onClick={handleOpenNew}
          className="bg-primary hover:bg-primary/90 text-primary-foreground font-medium px-2.5 sm:px-4 py-2 shadow-xs rounded-lg gap-1.5 shrink-0"
        >
          <div className="flex items-center gap-1">
            <Plus className="size-3.5 stroke-[2.5]" />
            <BookOpen className="size-4" />
          </div>
          <span className="hidden sm:inline">Nuova voce</span>
          <span className="sm:hidden text-xs">Nuova</span>
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Indicatori Rapidi (KPI Cards interattive) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <button
            type="button"
            onClick={() => setStockFilter("all")}
            className={`rounded-xl border p-3.5 sm:p-4 text-left transition-all bg-card shadow-xs flex flex-col justify-between min-h-[96px] sm:min-h-[104px] ${
              stockFilter === "all"
                ? "border-primary ring-1 ring-primary/20 shadow-xs"
                : "border-border hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Totale voci</span>
              <Boxes className="size-4 text-primary" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums mt-1">
                {stats.totalItems}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground/80 mt-0.5 truncate">
                {stats.totalQty} unità in giacenza
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStockFilter("all")}
            className="rounded-xl border border-border bg-card p-3.5 sm:p-4 text-left shadow-xs flex flex-col justify-between min-h-[96px] sm:min-h-[104px] hover:bg-muted/30 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between text-muted-foreground">
              <span className="text-xs font-medium">Valore inventario</span>
              <DollarSign className="size-4 text-emerald-600" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums mt-1">
                {formatCurrency(stats.totalVal)}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground/80 mt-0.5 truncate">
                Valutazione catalogo
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStockFilter("low_stock")}
            className={`rounded-xl border p-3.5 sm:p-4 text-left transition-all bg-card shadow-xs flex flex-col justify-between min-h-[96px] sm:min-h-[104px] ${
              stockFilter === "low_stock"
                ? "border-amber-500 ring-1 ring-amber-500/20 shadow-xs"
                : "border-border hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center justify-between text-amber-700 dark:text-amber-400">
              <span className="text-xs font-medium">Sotto scorta</span>
              <AlertTriangle className="size-4" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums mt-1">
                {stats.lowStockCount}
              </p>
              <p className="text-[11px] sm:text-xs text-amber-600/80 mt-0.5 truncate">
                Necessitano riordino
              </p>
            </div>
          </button>

          <button
            type="button"
            onClick={() => setStockFilter("out_of_stock")}
            className={`rounded-xl border p-3.5 sm:p-4 text-left transition-all bg-card shadow-xs flex flex-col justify-between min-h-[96px] sm:min-h-[104px] ${
              stockFilter === "out_of_stock"
                ? "border-rose-500 ring-1 ring-rose-500/20 shadow-xs"
                : "border-border hover:bg-muted/30"
            }`}
          >
            <div className="flex items-center justify-between text-rose-700 dark:text-rose-400">
              <span className="text-xs font-medium">Esauriti</span>
              <XCircle className="size-4" />
            </div>
            <div>
              <p className="text-xl sm:text-2xl font-bold text-foreground font-mono tabular-nums mt-1">
                {stats.outOfStockCount}
              </p>
              <p className="text-[11px] sm:text-xs text-rose-600/80 mt-0.5 truncate">
                Giacenza zero
              </p>
            </div>
          </button>
        </div>

        {/* Toolbar con filtri multipli dettagliati */}
        <div className="rounded-xl border border-border bg-card p-3 sm:p-4 shadow-xs space-y-3">
          <div className="flex flex-col md:grid md:grid-cols-12 gap-3">
            {/* Ricerca per codice, nome, fornitore + Menu Altro + Toggle filtri mobile */}
            <div className="flex items-center gap-2 md:col-span-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Cerca per codice, descrizione, fornitore..."
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
                    title="Altre azioni sul catalogo"
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
                    Esporta catalogo (.CSV)
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
              {/* Filtro 1: Categoria */}
              <div>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="bg-background shadow-xs rounded-lg">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le categorie</SelectItem>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro 2: Giacenza / Disponibilità */}
              <div>
                <Select value={stockFilter} onValueChange={setStockFilter}>
                  <SelectTrigger className="bg-background shadow-xs rounded-lg">
                    <SelectValue placeholder="Disponibilità" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutte le giacenze</SelectItem>
                    <SelectItem value="available">Disponibili (&gt; 0)</SelectItem>
                    <SelectItem value="low_stock">Sotto scorta</SelectItem>
                    <SelectItem value="out_of_stock">Esauriti (0 pz)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro 3: Fascia Prezzo */}
              <div>
                <Select value={priceFilter} onValueChange={setPriceFilter}>
                  <SelectTrigger className="bg-background shadow-xs rounded-lg">
                    <SelectValue placeholder="Prezzo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i prezzi</SelectItem>
                    <SelectItem value="under_50">Fino a 50 €</SelectItem>
                    <SelectItem value="50_250">50 € – 250 €</SelectItem>
                    <SelectItem value="250_1000">250 € – 1.000 €</SelectItem>
                    <SelectItem value="over_1000">Oltre 1.000 €</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Filtro 4: Fornitore */}
              <div>
                <Select value={supplierFilter} onValueChange={setSupplierFilter}>
                  <SelectTrigger className="bg-background shadow-xs rounded-lg">
                    <SelectValue placeholder="Fornitore" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tutti i fornitori</SelectItem>
                    {suppliers.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Reset Filtri Bar */}
          {hasActiveFilters && (
            <div className="flex items-center justify-between pt-2 border-t border-border/60 text-xs">
              <span className="text-muted-foreground">
                Trovate <strong className="text-foreground">{filteredRows.length}</strong> voci su{" "}
                {allItems.length}
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

        {/* Modalità Lista / Tabella Catalogo */}
        <div className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
          <Table>
            <TableHeader className="bg-muted/30">
              <TableRow className="hover:bg-transparent border-b border-border">
                <TableHead className="w-12 pl-4">
                  <Checkbox
                    checked={filteredRows.length > 0 && selectedIds.length === filteredRows.length}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Seleziona tutti"
                  />
                </TableHead>
                <TableHead className="font-semibold text-foreground py-3">Codice</TableHead>
                <TableHead className="font-semibold text-foreground py-3">
                  Descrizione voce
                </TableHead>
                <TableHead className="font-semibold text-foreground py-3">Categoria</TableHead>
                <TableHead className="font-semibold text-foreground py-3 text-right">
                  Prezzo unitario
                </TableHead>
                <TableHead className="font-semibold text-foreground py-3 text-center">
                  Giacenza
                </TableHead>
                <TableHead className="font-semibold text-foreground py-3 text-center">
                  Stato scorta
                </TableHead>
                <TableHead className="font-semibold text-foreground py-3 text-right">
                  Valore tot.
                </TableHead>
                <TableHead className="font-semibold text-foreground py-3 pr-4 text-right">
                  Azioni
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRows.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="h-40 text-center text-sm text-muted-foreground">
                    {hasActiveFilters ? (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <p>Nessuna voce corrisponde ai filtri impostati.</p>
                        <Button variant="outline" size="sm" onClick={resetFilters}>
                          Reimposta filtri
                        </Button>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-2">
                        <Boxes className="size-8 text-muted-foreground/40" />
                        <p>Il catalogo è vuoto. Aggiungi la prima voce, ricambio o servizio.</p>
                        <Button size="sm" onClick={handleOpenNew}>
                          <Plus className="mr-1.5 size-4" /> Nuova voce
                        </Button>
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ) : (
                filteredRows.map((item: any) => {
                  const qty = Number(item.quantity || 0);
                  const minQty = Number(item.min_quantity || 0);
                  const price = Number(item.unit_price || 0);
                  const totalValueItem = qty * price;
                  const isSelected = selectedIds.includes(item.id);

                  return (
                    <TableRow
                      key={item.id}
                      className={`hover:bg-muted/40 transition-colors border-b border-border/60 ${
                        isSelected ? "bg-muted/50" : ""
                      }`}
                    >
                      {/* Checkbox selezione riga */}
                      <TableCell className="w-12 pl-4 py-3.5">
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => toggleSelectOne(item.id)}
                          aria-label={`Seleziona voce ${item.name}`}
                        />
                      </TableCell>

                      {/* Codice */}
                      <TableCell className="py-3.5 font-mono text-xs">
                        {item.code ? (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-muted text-foreground font-semibold">
                            {item.code}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/40">—</span>
                        )}
                      </TableCell>

                      {/* Descrizione voce / Nome */}
                      <TableCell className="py-3.5">
                        <div className="min-w-0">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(item)}
                            className="font-semibold text-foreground hover:text-primary transition-colors text-left truncate block max-w-md"
                          >
                            {item.name}
                          </button>
                          {item.supplier ? (
                            <p className="text-xs text-muted-foreground truncate">
                              Fornitore: {item.supplier}
                            </p>
                          ) : null}
                        </div>
                      </TableCell>

                      {/* Categoria */}
                      <TableCell className="py-3.5">
                        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Tag className="size-3 text-muted-foreground/70" />
                          {item.category || "Generico"}
                        </span>
                      </TableCell>

                      {/* Prezzo unitario */}
                      <TableCell className="py-3.5 text-right font-medium text-foreground text-sm">
                        {formatCurrency(price)}
                      </TableCell>

                      {/* Giacenza con regolazione rapida (+ / -) */}
                      <TableCell className="py-3.5 text-center">
                        <div className="inline-flex items-center gap-1.5 border border-border rounded-lg bg-background p-1">
                          <button
                            type="button"
                            disabled={qty <= 0}
                            onClick={() => handleAdjustQuantity(item, -1)}
                            className="size-5 rounded flex items-center justify-center hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                            title="Riduci di 1"
                          >
                            <Minus className="size-3" />
                          </button>
                          <span className="font-bold text-sm min-w-7 text-center">{qty}</span>
                          <button
                            type="button"
                            onClick={() => handleAdjustQuantity(item, 1)}
                            className="size-5 rounded flex items-center justify-center hover:bg-muted transition-colors"
                            title="Aumenta di 1"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                      </TableCell>

                      {/* Stato scorta */}
                      <TableCell className="py-3.5 text-center">
                        {getStockBadge(qty, minQty)}
                      </TableCell>

                      {/* Valore Totale */}
                      <TableCell className="py-3.5 text-right font-semibold text-foreground text-sm">
                        {formatCurrency(totalValueItem)}
                      </TableCell>

                      {/* Azioni sulla voce */}
                      <TableCell className="py-3.5 pr-4 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {/* Condividi su WhatsApp */}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleShareWhatsApp(item)}
                            className="size-8 text-[#25D366] hover:bg-[#25D366]/15 hover:text-[#20BA5A] transition-colors"
                            title="Condividi dettagli su WhatsApp"
                          >
                            <WhatsAppIcon className="size-4" />
                          </Button>

                          {/* Duplica */}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleDuplicate(item)}
                            className="size-8 text-muted-foreground hover:text-foreground"
                            title="Duplica voce"
                          >
                            <Copy className="size-4" />
                          </Button>

                          {/* Modifica */}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => handleOpenEdit(item)}
                            className="size-8 text-muted-foreground hover:text-foreground"
                            title="Modifica scheda"
                          >
                            <Pencil className="size-4" />
                          </Button>

                          {/* Elimina */}
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              if (confirm(`Eliminare dal catalogo "${item.name}"?`)) {
                                remove.mutate(item.id);
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
                {filteredRows.length} {filteredRows.length === 1 ? "voce" : "voci"}
                {selectedIds.length > 0 ? ` · ${selectedIds.length} selezionate` : ""}
              </span>
            </div>
            <span className="font-semibold text-foreground">
              Valore totale:{" "}
              {formatCurrency(
                filteredRows.reduce(
                  (s: number, r: any) => s + Number(r.quantity || 0) * Number(r.unit_price || 0),
                  0,
                ),
              )}
            </span>
          </div>
        </div>
      </div>

      {/* Dialog Nuova / Modifica Voce */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-lg max-h-[calc(100dvh-3rem)] sm:max-h-[calc(100dvh-4rem)] overflow-hidden p-0 rounded-2xl border border-border shadow-2xl bg-card flex flex-col">
          <DialogHeader className="px-5 sm:px-6 pt-5 pb-4 border-b border-border/80 flex flex-row items-center justify-between pr-12 shrink-0">
            <DialogTitle className="text-lg font-bold text-foreground">
              {form.id ? "Modifica voce catalogo" : "Nuova voce catalogo"}
            </DialogTitle>
          </DialogHeader>

          <div className="p-5 sm:px-6 py-4 space-y-4 overflow-y-auto flex-1 min-h-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5 sm:col-span-1">
                <Label htmlFor="i_code">Codice</Label>
                <Input
                  id="i_code"
                  value={form.code}
                  onChange={(e) => setForm((prev) => ({ ...prev, code: e.target.value }))}
                  placeholder="Es. CALD-01"
                />
              </div>
              <div className="space-y-1.5 sm:col-span-2">
                <Label htmlFor="i_cat">Categoria</Label>
                <Select
                  value={form.category}
                  onValueChange={(val) => setForm((prev) => ({ ...prev, category: val }))}
                >
                  <SelectTrigger id="i_cat">
                    <SelectValue placeholder="Seleziona categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((c) => (
                      <SelectItem key={c} value={c}>
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="i_name">Descrizione / Nome voce *</Label>
              <Input
                id="i_name"
                value={form.name}
                onChange={(e) => setForm((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Es. Caldaia Murale a Condensazione 24 kW"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="i_price">Prezzo unitario (€)</Label>
                <Input
                  id="i_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={form.unit_price}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      unit_price: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="i_qty">Quantità giacenza</Label>
                <Input
                  id="i_qty"
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      quantity: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                  placeholder="1"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="i_min_qty">Scorta minima</Label>
                <Input
                  id="i_min_qty"
                  type="number"
                  min="0"
                  value={form.min_quantity}
                  onChange={(e) =>
                    setForm((prev) => ({
                      ...prev,
                      min_quantity: parseInt(e.target.value, 10) || 0,
                    }))
                  }
                  placeholder="1"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="i_sup">Fornitore / Marca</Label>
              <Input
                id="i_sup"
                value={form.supplier}
                onChange={(e) => setForm((prev) => ({ ...prev, supplier: e.target.value }))}
                placeholder="Es. Vaillant, Riello, Caleffi, Bticino..."
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 px-5 sm:px-6 py-4 border-t border-border/80 shrink-0 bg-muted/20">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Annulla
            </Button>
            <Button type="button" onClick={submit} disabled={save.isPending}>
              {save.isPending ? "Salvataggio..." : "Salva voce"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
