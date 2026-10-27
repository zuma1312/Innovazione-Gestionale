export type DocItem = {
  id?: string;
  description: string;
  qty: number;
  unit_price: number;
  unit?: string;
  discount?: number;
  vat?: number;
  item_type?: string;
  section?: string;
};

export type VatRateOption = {
  id: string;
  rate: number;
  label: string;
  description?: string;
  is_default?: boolean;
};

export const DEFAULT_VAT_RATES: VatRateOption[] = [
  {
    id: "vat_22",
    rate: 22,
    label: "Ordinaria 22%",
    description: "Prestazioni di manodopera ordinaria e beni finiti standard",
    is_default: true,
  },
  {
    id: "vat_10",
    rate: 10,
    label: "Ridotta 10%",
    description: "Ristrutturazioni edilizie, manutenzioni ordinarie e straordinarie",
    is_default: false,
  },
  {
    id: "vat_4",
    rate: 4,
    label: "Super-ridotta 4%",
    description: "Interventi prima casa e abbattimento barriere architettoniche",
    is_default: false,
  },
  {
    id: "vat_5",
    rate: 5,
    label: "Ridotta speciale 5%",
    description: "Servizi sociali, teleriscaldamento e prestazioni agevolate",
    is_default: false,
  },
  {
    id: "vat_0",
    rate: 0,
    label: "Esente / Non Imp. 0%",
    description: "Regime forfettario, Art. 10 DPR 633/72, Reverse Charge",
    is_default: false,
  },
];

export type UnitOfMeasureOption = {
  id: string;
  code: string;
  name: string;
  category?: string;
  is_default?: boolean;
};

export const DEFAULT_UNITS_OF_MEASURE: UnitOfMeasureOption[] = [
  { id: "um_cad", code: "cad.", name: "Cadauno", category: "Quantità", is_default: true },
  { id: "um_pz", code: "pz", name: "Pezzo / Pezzi", category: "Quantità", is_default: false },
  { id: "um_ore", code: "ore", name: "Ore lavorative", category: "Tempo", is_default: false },
  {
    id: "um_corpo",
    code: "corpo",
    name: "A corpo / Forfait",
    category: "Prestazione",
    is_default: false,
  },
  { id: "um_m", code: "m", name: "Metri lineari", category: "Lunghezza", is_default: false },
  { id: "um_mq", code: "mq", name: "Metri quadri", category: "Superficie", is_default: false },
  { id: "um_mc", code: "mc", name: "Metri cubi", category: "Volume", is_default: false },
  { id: "um_kg", code: "kg", name: "Chilogrammi", category: "Peso", is_default: false },
  { id: "um_lt", code: "lt", name: "Litri", category: "Volume liquido", is_default: false },
  { id: "um_kit", code: "kit", name: "Kit / Gruppo", category: "Assieme", is_default: false },
  {
    id: "um_giorni",
    code: "giorni",
    name: "Giornate lavorative",
    category: "Tempo",
    is_default: false,
  },
];

export const STANDARD_QUOTE_SECTIONS = [
  "Opere preliminari",
  "Lavorazioni principali",
  "Materiali e forniture",
  "Manodopera",
  "Finiture",
  "Smaltimenti e pulizia finale",
  "Collaudo e consegna",
  "Extra e opzionali",
] as const;

export const ITEM_TYPES = [
  "Lavorazione",
  "Materiale",
  "Manodopera",
  "Fornitura",
  "Servizio",
] as const;

export type DocTemplate = "classico" | "moderno" | "minimal";

export const TEMPLATES: { value: DocTemplate; label: string }[] = [
  { value: "classico", label: "Classico" },
  { value: "moderno", label: "Moderno" },
  { value: "minimal", label: "Minimal" },
];

export type CompanyInfo = {
  company_name: string;
  address: string;
  city: string;
  phone: string;
  email: string;
  vat_number: string;
  iban: string;
  logo_url?: string;
};

export const emptyItem = (defaultUnit = "cad.", section?: string): DocItem => ({
  id:
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `item-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
  description: "",
  qty: 1,
  unit_price: 0,
  unit: defaultUnit,
  discount: 0,
  vat: 22,
  item_type: "Lavorazione",
  section: section || undefined,
});

export function lineTotal(item: DocItem) {
  const base = (Number(item.qty) || 0) * (Number(item.unit_price) || 0);
  const discount = Math.max(0, Math.min(100, Number(item.discount) || 0));
  return base * (1 - discount / 100);
}

export function docTotals(items: DocItem[], vatRate: number) {
  const net = items.reduce((sum, item) => sum + lineTotal(item), 0);
  const vat = (net * (Number(vatRate) || 0)) / 100;
  return { net, vat, total: net + vat };
}

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(
    Number.isFinite(value) ? value : 0,
  );
}

export function formatDate(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("it-IT", { day: "2-digit", month: "2-digit", year: "numeric" });
}

export function formatDateTime(value?: string | null) {
  if (!value) return "-";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function nextNumber(prefix: string, existing: string[]) {
  const year = new Date().getFullYear();
  const nums = existing
    .map((n) => {
      const match = n?.match(/(\d+)\s*$/);
      return match ? parseInt(match[1], 10) : 0;
    })
    .filter((n) => Number.isFinite(n));
  const next = (nums.length ? Math.max(...nums) : 0) + 1;
  return `${prefix}-${year}-${String(next).padStart(4, "0")}`;
}
