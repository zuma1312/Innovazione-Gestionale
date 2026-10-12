export type DocItem = {
  description: string;
  qty: number;
  unit_price: number;
};

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
};

export const emptyItem = (): DocItem => ({ description: "", qty: 1, unit_price: 0 });

export function lineTotal(item: DocItem) {
  return (Number(item.qty) || 0) * (Number(item.unit_price) || 0);
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
