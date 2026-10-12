import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowUpRight,
  CalendarDays,
  Euro,
  FileText,
  Package,
  Receipt,
  TrendingDown,
  Users,
  Wrench,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AppLayout } from "@/components/AppLayout";
import { Badge } from "@/components/ui/badge";
import { useList } from "@/hooks/data";
import { formatCurrency, formatDate, formatDateTime } from "@/lib/doc";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — INNOVAZIONE TERMICA" },
      { name: "description", content: "Statistiche, appuntamenti e attività recenti." },
      { property: "og:title", content: "Dashboard — INNOVAZIONE TERMICA" },
      { property: "og:description", content: "Statistiche e attività del gestionale." },
    ],
  }),
  component: DashboardPage,
});

/* eslint-disable @typescript-eslint/no-explicit-any */
function DashboardPage() {
  const clients = useList<any>("clients");
  const appointments = useList<any>("appointments");
  const interventions = useList<any>("interventions");
  const quotes = useList<any>("quotes");
  const invoices = useList<any>("invoices");
  const inventory = useList<any>("inventory_items");
  const expenses = useList<any>("expenses");

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
      label: "Spese",
      value: formatCurrency(spese),
      hint: "Materiali e costi registrati",
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
      hint: "Anagrafiche in archivio",
      icon: Users,
      tone: "primary" as const,
    },
    {
      label: "Magazzino",
      value: String((inventory.data ?? []).length),
      hint: lowStock.length ? `${lowStock.length} sotto scorta` : "Scorte ok",
      icon: Package,
      tone: "accent" as const,
    },
  ];

  const modules = [
    { to: "/clienti", label: "Clienti", icon: Users, desc: "Anagrafiche e contatti" },
    { to: "/agenda", label: "Agenda", icon: CalendarDays, desc: "Calendario appuntamenti" },
    { to: "/interventi", label: "Interventi", icon: Wrench, desc: "Rapportini di lavoro" },
    { to: "/preventivi", label: "Preventivi", icon: FileText, desc: "Offerte e PDF" },
    { to: "/fatture", label: "Fatture", icon: Receipt, desc: "Emissione e incassi" },
    { to: "/magazzino", label: "Magazzino", icon: Package, desc: "Scorte e ricambi" },
  ] as const;

  return (
    <AppLayout title="Dashboard" description="Panoramica attività di INNOVAZIONE TERMICA">
      <div className="space-y-6">
        <section className="overflow-hidden rounded-2xl bg-brand p-6 text-primary-foreground shadow-float md:p-8">
          <p className="text-sm opacity-85">Bentornato 👋</p>
          <h2 className="mt-1 text-2xl font-bold md:text-3xl">
            Tutto pronto per la giornata, INNOVAZIONE TERMICA
          </h2>
          <p className="mt-2 max-w-2xl text-sm opacity-85">
            Hai {upcoming.length} appuntamenti in arrivo e{" "}
            {invoiceRows.filter((i) => i.status !== "pagata").length} fatture da incassare.
          </p>
        </section>

        <section className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="card-surface p-3.5 sm:p-4.5 flex flex-col justify-between min-h-[96px] sm:min-h-[104px]"
            >
              <div className="flex items-start justify-between gap-1">
                <p className="text-xs font-medium text-muted-foreground">{s.label}</p>
                <span
                  className={`flex size-8 sm:size-9 shrink-0 items-center justify-center rounded-lg ${
                    s.tone === "primary"
                      ? "bg-primary/10 text-primary"
                      : "bg-accent-soft text-accent"
                  }`}
                >
                  <s.icon className="size-4" />
                </span>
              </div>
              <div>
                <p className="mt-1 text-xl sm:text-2xl font-bold font-mono tabular-nums">
                  {s.value}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground truncate">{s.hint}</p>
              </div>
            </div>
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="card-surface p-5 lg:col-span-2">
            <h3 className="text-sm font-semibold">Fatturato ultimi 6 mesi</h3>
            <div className="mt-4 h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={months}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                  <XAxis dataKey="label" stroke="var(--color-muted-foreground)" fontSize={12} />
                  <YAxis stroke="var(--color-muted-foreground)" fontSize={12} />
                  <Tooltip formatter={(v: number) => formatCurrency(Number(v))} />
                  <Bar dataKey="incassato" fill="var(--color-primary)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card-surface p-5">
            <h3 className="text-sm font-semibold">Prossimi appuntamenti</h3>
            <ul className="mt-3 space-y-3">
              {upcoming.length === 0 ? (
                <li className="text-sm text-muted-foreground">Nessun appuntamento in agenda.</li>
              ) : (
                upcoming.map((a) => (
                  <li key={a.id} className="rounded-lg border p-3">
                    <p className="text-sm font-medium">{a.title}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(a.starts_at)}</p>
                  </li>
                ))
              )}
            </ul>
            <Link
              to="/agenda"
              className="mt-4 inline-flex items-center text-sm font-medium text-primary hover:underline"
            >
              Apri agenda <ArrowUpRight className="ml-1 size-4" />
            </Link>
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="card-surface p-5">
            <h3 className="text-sm font-semibold">Ultimi interventi</h3>
            <ul className="mt-3 space-y-3">
              {lastInterventions.length === 0 ? (
                <li className="text-sm text-muted-foreground">Nessun intervento registrato.</li>
              ) : (
                lastInterventions.map((i) => (
                  <li
                    key={i.id}
                    className="flex items-center justify-between rounded-lg border p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{i.title}</p>
                      <p className="text-xs text-muted-foreground">{formatDate(i.date)}</p>
                    </div>
                    <Badge variant={i.status === "completato" ? "default" : "secondary"}>
                      {i.status}
                    </Badge>
                  </li>
                ))
              )}
            </ul>
          </div>

          <div className="card-surface p-5">
            <h3 className="text-sm font-semibold">Accesso rapido ai moduli</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              {modules.map((m) => (
                <Link
                  key={m.to}
                  to={m.to}
                  className="group rounded-xl border p-4 transition-colors hover:border-primary hover:bg-primary/5"
                >
                  <m.icon className="size-5 text-primary" />
                  <p className="mt-2 text-sm font-semibold">{m.label}</p>
                  <p className="text-xs text-muted-foreground">{m.desc}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
