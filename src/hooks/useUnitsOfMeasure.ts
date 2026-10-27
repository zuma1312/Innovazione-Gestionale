import { useState, useEffect, useCallback } from "react";

export type UnitOfMeasure = {
  id: string;
  code: string; // Es. "pz", "ore", "m", "mq", "mc", "kg", "lt", "corpo"
  name: string; // Es. "Pezzi", "Ore manodopera", "Metri"
  description: string;
  is_default: boolean;
  is_system?: boolean;
};

export const DEFAULT_UNITS_OF_MEASURE: UnitOfMeasure[] = [
  {
    id: "um-pz",
    code: "pz",
    name: "Pezzi",
    description: "Articoli singoli, componenti, caldaie e climatizzatori",
    is_default: true,
    is_system: true,
  },
  {
    id: "um-ore",
    code: "ore",
    name: "Ore",
    description: "Manodopera oraria, pronto intervento, ricerca guasti e collaudi",
    is_default: false,
    is_system: true,
  },
  {
    id: "um-m",
    code: "m",
    name: "Metri lineari",
    description: "Tubazioni rame/multistrato, canaline, guaine e coibentazioni",
    is_default: false,
    is_system: true,
  },
  {
    id: "um-mq",
    code: "m²",
    name: "Metri quadri",
    description: "Pannelli radianti a pavimento, pareti radianti e superfici",
    is_default: false,
    is_system: true,
  },
  {
    id: "um-mc",
    code: "m³",
    name: "Metri cubi",
    description: "Volume accumulo termico, cisterne, serbatoi e carichi",
    is_default: false,
    is_system: true,
  },
  {
    id: "um-kg",
    code: "kg",
    name: "Chilogrammi",
    description: "Gas refrigerante (R32/R410A), metalli a peso, ghisa e sale",
    is_default: false,
    is_system: true,
  },
  {
    id: "um-lt",
    code: "lt",
    name: "Litri",
    description: "Liquidi disincrostanti, protettivi impianto e antigelo",
    is_default: false,
    is_system: true,
  },
  {
    id: "um-cf",
    code: "cf",
    name: "Confezione",
    description: "Scatole viteria, kit guarnizioni, blister e minuteria",
    is_default: false,
    is_system: true,
  },
  {
    id: "um-corpo",
    code: "a corpo",
    name: "A corpo / Forfait",
    description: "Fornitura e posa in opera chiavi in mano, ristrutturazione completa",
    is_default: false,
    is_system: true,
  },
];

const STORAGE_KEY = "artigiano_smart_units_of_measure_v1";
const EVENT_NAME = "units-of-measure-updated";

function loadUnits(): UnitOfMeasure[] {
  if (typeof window === "undefined") return DEFAULT_UNITS_OF_MEASURE;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_UNITS_OF_MEASURE;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_UNITS_OF_MEASURE;
    return parsed;
  } catch (e) {
    console.error("Errore caricamento unità di misura:", e);
    return DEFAULT_UNITS_OF_MEASURE;
  }
}

function persistUnits(units: UnitOfMeasure[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(units));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: units }));
  } catch (e) {
    console.error("Errore salvataggio unità di misura:", e);
  }
}

export function useUnitsOfMeasure() {
  const [units, setUnits] = useState<UnitOfMeasure[]>(DEFAULT_UNITS_OF_MEASURE);

  useEffect(() => {
    setUnits(loadUnits());

    const handleUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<UnitOfMeasure[]>;
      if (customEvent.detail) {
        setUnits(customEvent.detail);
      } else {
        setUnits(loadUnits());
      }
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const defaultUnit = units.find((u) => u.is_default) || units[0] || DEFAULT_UNITS_OF_MEASURE[0];

  const addUnit = useCallback((newUnit: Omit<UnitOfMeasure, "id">) => {
    setUnits((prev) => {
      const id = `um-custom-${Date.now()}`;
      const next = prev.map((u) => (newUnit.is_default ? { ...u, is_default: false } : u));
      const updated = [...next, { ...newUnit, id }];
      persistUnits(updated);
      return updated;
    });
  }, []);

  const updateUnit = useCallback((id: string, updates: Partial<UnitOfMeasure>) => {
    setUnits((prev) => {
      const next = prev.map((u) => {
        if (u.id === id) {
          return { ...u, ...updates };
        }
        if (updates.is_default) {
          return { ...u, is_default: false };
        }
        return u;
      });
      persistUnits(next);
      return next;
    });
  }, []);

  const deleteUnit = useCallback((id: string) => {
    setUnits((prev) => {
      const target = prev.find((u) => u.id === id);
      if (target?.is_system) {
        throw new Error("Non è possibile eliminare un'unità di misura di sistema.");
      }
      const updated = prev.filter((u) => u.id !== id);
      if (target?.is_default && updated.length > 0) {
        updated[0].is_default = true;
      }
      persistUnits(updated);
      return updated;
    });
  }, []);

  const setDefaultUnit = useCallback((id: string) => {
    setUnits((prev) => {
      const updated = prev.map((u) => ({
        ...u,
        is_default: u.id === id,
      }));
      persistUnits(updated);
      return updated;
    });
  }, []);

  const resetToDefault = useCallback(() => {
    persistUnits(DEFAULT_UNITS_OF_MEASURE);
    setUnits(DEFAULT_UNITS_OF_MEASURE);
  }, []);

  return {
    units,
    defaultUnit,
    addUnit,
    updateUnit,
    deleteUnit,
    setDefaultUnit,
    resetToDefault,
  };
}
