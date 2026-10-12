import { useState, useEffect, useCallback } from "react";

export type VatRate = {
  id: string;
  rate: number;
  label: string;
  description: string;
  natureCode?: string; // Es. N1, N2.2, N3, N4 per fatturazione elettronica
  is_default: boolean;
  is_system?: boolean;
};

export const DEFAULT_VAT_RATES: VatRate[] = [
  {
    id: "vat-22",
    rate: 22,
    label: "22% - Ordinaria",
    description: "Aliquota ordinaria standard per beni e servizi",
    is_default: true,
    is_system: true,
  },
  {
    id: "vat-10",
    rate: 10,
    label: "10% - Ridotta Edilizia",
    description: "Manutenzioni ordinarie/straordinarie e ristrutturazioni edilizie",
    is_default: false,
    is_system: true,
  },
  {
    id: "vat-4",
    rate: 4,
    label: "4% - Minima / Prima Casa",
    description: "Prima casa, abbattimento barriere architettoniche e beni di prima necessità",
    is_default: false,
    is_system: true,
  },
  {
    id: "vat-5",
    rate: 5,
    label: "5% - Super Ridotta",
    description: "Servizi sociali, teleriscaldamento ed erbe aromatiche",
    is_default: false,
    is_system: true,
  },
  {
    id: "vat-0",
    rate: 0,
    label: "0% - Esente / Non imponibile",
    description: "Operazioni esenti art. 10, regime forfettario o reverse charge",
    natureCode: "N2.2",
    is_default: false,
    is_system: true,
  },
];

const STORAGE_KEY = "artigiano_smart_vat_rates_v1";
const EVENT_NAME = "vat-rates-updated";

function loadVatRates(): VatRate[] {
  if (typeof window === "undefined") return DEFAULT_VAT_RATES;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_VAT_RATES;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_VAT_RATES;
    return parsed;
  } catch (e) {
    console.error("Errore caricamento aliquote IVA:", e);
    return DEFAULT_VAT_RATES;
  }
}

function persistVatRates(rates: VatRate[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rates));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: rates }));
  } catch (e) {
    console.error("Errore salvataggio aliquote IVA:", e);
  }
}

export function useVatRates() {
  const [rates, setRates] = useState<VatRate[]>(loadVatRates);

  useEffect(() => {
    setRates(loadVatRates());

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<VatRate[]>;
      if (customEvent.detail) {
        setRates(customEvent.detail);
      } else {
        setRates(loadVatRates());
      }
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const defaultRate = rates.find((r) => r.is_default) || rates[0] || DEFAULT_VAT_RATES[0];

  const addVatRate = useCallback((newRate: Omit<VatRate, "id">) => {
    setRates((prev) => {
      const id = `vat-custom-${Date.now()}`;
      const next = prev.map((r) => (newRate.is_default ? { ...r, is_default: false } : r));
      const updated = [...next, { ...newRate, id }];
      persistVatRates(updated);
      return updated;
    });
  }, []);

  const updateVatRate = useCallback((id: string, updates: Partial<VatRate>) => {
    setRates((prev) => {
      const next = prev.map((r) => {
        if (r.id === id) {
          return { ...r, ...updates };
        }
        if (updates.is_default) {
          return { ...r, is_default: false };
        }
        return r;
      });
      persistVatRates(next);
      return next;
    });
  }, []);

  const deleteVatRate = useCallback((id: string) => {
    setRates((prev) => {
      const target = prev.find((r) => r.id === id);
      if (target?.is_system) {
        throw new Error("Non è possibile eliminare un'aliquota di sistema predefinita.");
      }
      const updated = prev.filter((r) => r.id !== id);
      if (target?.is_default && updated.length > 0) {
        updated[0].is_default = true;
      }
      persistVatRates(updated);
      return updated;
    });
  }, []);

  const setDefaultVatRate = useCallback((id: string) => {
    setRates((prev) => {
      const updated = prev.map((r) => ({
        ...r,
        is_default: r.id === id,
      }));
      persistVatRates(updated);
      return updated;
    });
  }, []);

  const resetToDefault = useCallback(() => {
    persistVatRates(DEFAULT_VAT_RATES);
    setRates(DEFAULT_VAT_RATES);
  }, []);

  return {
    rates,
    defaultRate,
    addVatRate,
    updateVatRate,
    deleteVatRate,
    setDefaultVatRate,
    resetToDefault,
  };
}
