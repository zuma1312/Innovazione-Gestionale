import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CalendarDays,
  Clock,
  Euro,
  FileText,
  Package,
  Plus,
  Receipt,
  TrendingDown,
  TrendingUp,
  Users,
  Wrench,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppLayout } from "@/components/AppLayout";
import { KPISummaryCard, KPISummaryCardSkeleton } from "@/components/KPISummaryCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCompany, useList } from "@/hooks/data";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/doc";

export const Route = createFileRoute("/_authenticated/dashboard")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Dashboard — ArtigianoSmart" },
      { name: "description", content: "Statistiche, appuntamenti e attività recenti." },
      { property: "og:title", content: "Dashboard — ArtigianoSmart" },
      { property: "og:description", content: "Statistiche e attività del gestionale." },
    ],
  }),
  component: DashboardPage,
});

/* eslint-disable @typescript-eslint/no-explicit-any */
function DashboardPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const company = useCompany();
  const companyName = company.data?.company_name || "Azienda Demo Srl";
  const clients = useList<any>("clients");
  const appointments = useList<any>("appointments");
  const interventions = useList<any>("interventions");
  const quotes = useList<any>("quotes");
  const invoices = useList<any>("invoices");
  const inventory = useList<any>("inventory_items");
  const expenses = useList<any>("expenses");

  const clientMap = useMemo(
    () => new Map((clients.data ?? []).map((c: any) => [c.id, c.name])),
    [clients.data],
  );

  if (!mounted) {
    return (
      <AppLayout title="Dashboard" description="Panoramica attività">
        <div className="w-full min-w-0 space-y-5 sm:space-y-6">
          <section className="rounded-xl border border-border bg-card p-5 sm:p-6 shadow-xs animate-pulse">
            <div className="h-4 w-32 bg-muted/60 rounded mb-2" />
            <div className="h-7 w-64 bg-muted/60 rounded mb-2" />
            <div className="h-4 w-80 bg-muted/40 rounded" />
          </section>

          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
            {Array.from({ length: 8 }).map((_, i) => (
              <KPISummaryCardSkeleton key={i} />
            ))}
          </section>

          <section className="grid gap-4 lg:grid-cols-3 min-w-0">
            <div className="rounded-xl border border-border bg-card p-5 lg:col-span-2 h-72 sm:h-80 animate-pulse bg-muted/20" />
            <div className="rounded-xl border border-border bg-card p-5 h-72 sm:h-80 animate-pulse bg-muted/20" />
          </section>

          <section className="grid gap-4 lg:grid-cols-2 min-w-0">
            <div className="rounded-xl border border-border bg-card p-5 h-64 animate-pulse bg-muted/20" />
            <div className="rounded-xl border border-border bg-card p-5 h-64 animate-pulse bg-muted/20" />
          </section>
        </div>
      </AppLayout>
    );
  }

  const invoiceRows = invoices.data ?? [];
  const revenue = invoiceRows
    .filter((i) => i.status === "pagata")
    .reduce((s, i) => s + Number(i.total || 0), 0);
  const pending = invoiceRows
    .filter((i) => i.status !== "pagata")
    .reduce((s, i) => s + Number(i.total || 0), 0);
  const spese =
    (expenses.data ?? []).reduce((s, e) => s + Number(e.amount || 0), 0) +
    (interventions.data ?? []).reduce((s, i) => s + Number(i.materials_cost || 0), 0);

  const now = new Date();
  const upcoming = (appointments.data ?? [])
    .filter((a) => new Date(a.starts_at) >= new Date(now.getTime() - 3600_000))
    .slice(0, 5);
  const lastInterventions = (interventions.data ?? []).slice(0, 5);
  const lastInvoices = invoiceRows.slice(0, 5);
  const lowStock = (inventory.data ?? []).filter(
    (i) => Number(i.quantity) <= Number(i.min_quantity),
  );

  const months = Array.from({ length: 6 }, (_, idx) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - idx), 1);
    const label = d.toLocaleDateString("it-IT", { month: "short" });
    const incassato = invoiceRows
      .filter((i) => {
        const date = new Date(i.date);
        return date.getFullYear() === d.getFullYear() && date.getMonth() === d.getMonth();
      })
      .reduce((s, i) => s + Number(i.total || 0), 0);
    return { label, incassato };
  });

  const stats = [
    {
      label: "Guadagno incassato",
      value: formatCurrency(revenue),
      hint: `${formatCurrency(pending)} da incassare`,
      icon: Euro,
      tone: "primary" as const,
    },
    {
      label: "Spese registrate",
      value: formatCurrency(spese),
      hint: "Materiali e costi",
      icon: TrendingDown,
      tone: "accent" as const,
    },
    {
      label: "Prossimi appuntamenti",
      value: String(upcoming.length),
      hint: upcoming[0] ? formatDateTime(upcoming[0].starts_at) : "Agenda libera",
      icon: CalendarDays,
      tone: "primary" as const,
    },
    {
      label: "Lavori aperti",
      value: String((interventions.data ?? []).filter((i) => i.status !== "completato").length),
      hint: `${(interventions.data ?? []).length} interventi totali`,
      icon: Wrench,
      tone: "accent" as const,
    },
    {
      label: "Preventivi",
      value: String((quotes.data ?? []).length),
      hint: `${(quotes.data ?? []).filter((q) => q.status === "accettato").length} accettati`,
      icon: FileText,
      tone: "primary" as const,
    },
    {
      label: "Fatture",
      value: String(invoiceRows.length),
      hint: `${invoiceRows.filter((i) => i.status === "pagata").length} pagate`,
      icon: Receipt,
      tone: "accent" as const,
    },
    {
      label: "Clienti",
      value: String((clients.data ?? []).length),
      hint: "Anagrafiche attive",
      icon: Users,
      tone: "primary" as const,
    },
    {
      label: "Magazzino",
      value: String((inventory.data ?? []).length),
      hint: lowStock.length ? `${lowStock.length} sotto scorta` : "Scorte regolari",
      icon: Package,
      tone: "accent" as const,
    },
  ];

  return (
    <AppLayout
      title="Dashboard"
      description={`Panoramica attività di ${companyName}`}
      actions={
        <div className="flex items-center gap-1.5 sm:gap-2">
          <Button
            asChild
            variant="outline"
            className="h-9 px-3 gap-1.5 text-xs sm:text-sm font-medium rounded-lg shadow-xs hidden sm:inline-flex border-border/80 shrink-0 cursor-pointer"
          >
            <Link to="/agenda">
              <CalendarDays className="size-3.5 text-primary" />
              <span>Agenda</span>
            </Link>
          </Button>
          <Button
            asChild
            className="h-9 px-3 sm:px-4 gap-1.5 text-xs sm:text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-lg shadow-xs shrink-0 cursor-pointer"
          >
            <Link to="/interventi">
              <Plus className="size-3.5 stroke-[2.5]" />
              <span className="hidden sm:inline">Nuovo intervento</span>
              <span className="sm:hidden text-xs">Nuovo</span>
            </Link>
          </Button>
        </div>
      }
    >
      <div className="w-full min-w-0 space-y-5 sm:space-y-6">
        {/* Banner Benvenuto — Stile uniforme alle sezioni con sfondo Card */}
        <section className="relative overflow-hidden rounded-xl border border-border bg-card p-4 sm:p-5 lg:p-6 shadow-xs min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="min-w-0 flex-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary/10 text-primary mb-2">
                <span>Bentornato 👋</span>
                <span className="text-muted-foreground/60">•</span>
                <span className="font-mono capitalize">
                  {now.toLocaleDateString("it-IT", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold tracking-tight text-foreground truncate">
                Tutto pronto per la giornata, {companyName}
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground max-w-2xl">
                Hai <span className="font-semibold text-foreground">{upcoming.length}</span>{" "}
                appuntamenti in arrivo e{" "}
                <span className="font-semibold text-foreground">
                  {invoiceRows.filter((i) => i.status !== "pagata").length}
                </span>{" "}
                fatture in attesa di saldo.
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="gap-1.5 text-xs rounded-lg shadow-xs"
              >
                <Link to="/agenda">
                  <CalendarDays className="size-3.5 text-primary" />
                  <span>Apri agenda</span>
                </Link>
              </Button>
              <Button
                asChild
                size="sm"
                className="gap-1.5 text-xs bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-lg shadow-xs"
              >
                <Link to="/fatture">
                  <Receipt className="size-3.5" />
                  <span>Vedi fatture</span>
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Indicatori Rapidi (KPI Cards identiche alle altre sezioni) */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 min-w-0">
          {stats.map((s) => (
            <KPISummaryCard
              key={s.label}
              label={s.label}
              value={s.value}
              hint={s.hint}
              icon={s.icon}
              tone={s.tone === "accent" ? "amber" : "primary"}
            />
          ))}
        </section>

        {/* Grafico Fatturato + Prossimi Appuntamenti */}
        <section className="grid gap-4 lg:grid-cols-3 min-w-0">
          {/* Fatturato ultimi 6 mesi */}
          <div className="rounded-xl border border-border bg-card shadow-xs p-4 sm:p-5 lg:col-span-2 min-w-0 overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between pb-3 border-b border-border/60 min-w-0">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <TrendingUp className="size-4" />
                </div>
                <div className="min-w-0">
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    Fatturato ultimi 6 mesi
                  </h3>
                  <p className="text-xs text-muted-foreground truncate">
                    Incassi registrati mese per mese
                  </p>
                </div>
              </div>
              <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-muted text-foreground shrink-0">
                Totale: {formatCurrency(revenue)}
              </span>
            </div>

            <div className="mt-4 h-64 sm:h-72 w-full min-w-0 overflow-hidden">
              {mounted ? (
                <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
                  <BarChart data={months} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      stroke="var(--color-border)"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="label"
                      stroke="var(--color-muted-foreground)"
                      fontSize={12}
                      tickLine={false}
                    />
                    <YAxis
                      stroke="var(--color-muted-foreground)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `€${v}`}
                    />
                    <Tooltip
                      formatter={(v: any) => [formatCurrency(Number(v)), "Incassato"]}
                      contentStyle={{
                        backgroundColor: "var(--color-card)",
                        borderColor: "var(--color-border)",
                        borderRadius: "0.75rem",
                        fontSize: "12px",
                        boxShadow: "var(--shadow-card)",
                        color: "var(--color-foreground)",
                      }}
                    />
                    <Bar dataKey="incassato" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full w-full flex items-center justify-center text-xs text-muted-foreground">
                  Caricamento grafico...
                </div>
              )}
            </div>
          </div>

          {/* Prossimi appuntamenti */}
          <div className="rounded-xl border border-border bg-card shadow-xs p-4 sm:p-5 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border/60 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <CalendarDays className="size-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    Prossimi appuntamenti
                  </h3>
                </div>
                <Link
                  to="/agenda"
                  className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-0.5 shrink-0"
                >
                  Agenda <ArrowUpRight className="size-3.5" />
                </Link>
              </div>

              <div className="mt-3 space-y-2.5">
                {upcoming.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Nessun appuntamento in programma per oggi.
                  </div>
                ) : (
                  upcoming.map((a) => (
                    <div
                      key={a.id}
                      className="rounded-lg border border-border/80 bg-muted/20 p-2.5 sm:p-3 hover:bg-muted/40 transition-colors min-w-0"
                    >
                      <p className="text-xs sm:text-sm font-medium text-foreground truncate">
                        {a.title}
                      </p>
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground truncate">
                        <Clock className="size-3 shrink-0" />
                        <span>{formatDateTime(a.starts_at)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border/50 mt-3">
              <Link
                to="/agenda"
                className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                Vedi tutti in agenda <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </section>

        {/* Sezione Attività Recenti: Interventi + Fatture (Eliminato 'Accesso rapido ai moduli') */}
        <section className="grid gap-4 lg:grid-cols-2 min-w-0">
          {/* Ultimi interventi */}
          <div className="rounded-xl border border-border bg-card shadow-xs p-4 sm:p-5 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border/60 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Wrench className="size-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    Ultimi interventi registrati
                  </h3>
                </div>
                <Link
                  to="/interventi"
                  className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-0.5 shrink-0"
                >
                  Interventi <ArrowUpRight className="size-3.5" />
                </Link>
              </div>

              <div className="mt-3 space-y-2.5">
                {lastInterventions.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Nessun intervento registrato di recente.
                  </div>
                ) : (
                  lastInterventions.map((i) => {
                    const clientName = clientMap.get(i.client_id);
                    return (
                      <div
                        key={i.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-muted/20 p-2.5 sm:p-3 hover:bg-muted/40 transition-colors min-w-0"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            {i.number ? (
                              <span className="text-xs font-mono font-semibold text-primary shrink-0">
                                #{i.number}
                              </span>
                            ) : null}
                            <p className="truncate text-xs sm:text-sm font-medium text-foreground">
                              {i.title}
                            </p>
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground truncate">
                            <span>{formatDate(i.date)}</span>
                            {clientName ? <span>• {clientName}</span> : null}
                            {i.technician ? <span>• {i.technician}</span> : null}
                          </div>
                        </div>
                        <Badge
                          variant={i.status === "completato" ? "default" : "secondary"}
                          className="shrink-0 text-[10px] sm:text-xs capitalize"
                        >
                          {i.status}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border/50 mt-3">
              <Link
                to="/interventi"
                className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                Vedi tutti gli interventi <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </div>

          {/* Ultime fatture emesse */}
          <div className="rounded-xl border border-border bg-card shadow-xs p-4 sm:p-5 flex flex-col justify-between min-w-0">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-border/60 min-w-0">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Receipt className="size-4" />
                  </div>
                  <h3 className="text-sm font-semibold text-foreground truncate">
                    Ultime fatture emesse
                  </h3>
                </div>
                <Link
                  to="/fatture"
                  className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-0.5 shrink-0"
                >
                  Fatture <ArrowUpRight className="size-3.5" />
                </Link>
              </div>

              <div className="mt-3 space-y-2.5">
                {lastInvoices.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    Nessuna fattura emessa al momento.
                  </div>
                ) : (
                  lastInvoices.map((inv) => {
                    const clientName = clientMap.get(inv.client_id);
                    return (
                      <div
                        key={inv.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border/80 bg-muted/20 p-2.5 sm:p-3 hover:bg-muted/40 transition-colors min-w-0"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="text-xs font-mono font-semibold text-foreground shrink-0">
                              {inv.number}
                            </span>
                            <p className="truncate text-xs sm:text-sm font-medium text-foreground">
                              {clientName || inv.title || "Fattura"}
                            </p>
                          </div>
                          <div className="mt-0.5 flex items-center gap-2 text-[11px] text-muted-foreground truncate">
                            <span>{formatDate(inv.date)}</span>
                            <span className="font-mono font-medium text-foreground">
                              {formatCurrency(Number(inv.total || 0))}
                            </span>
                          </div>
                        </div>
                        <Badge
                          variant={inv.status === "pagata" ? "default" : "secondary"}
                          className={`shrink-0 text-[10px] sm:text-xs capitalize ${
                            inv.status === "pagata"
                              ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25"
                              : ""
                          }`}
                        >
                          {inv.status}
                        </Badge>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            <div className="pt-3 border-t border-border/50 mt-3">
              <Link
                to="/fatture"
                className="text-xs font-medium text-primary hover:underline inline-flex items-center gap-1"
              >
                Vedi tutte le fatture <ArrowUpRight className="size-3.5" />
              </Link>
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
