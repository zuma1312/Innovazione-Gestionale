import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export type PaymentMethod = {
  id: string;
  code: string;
  typeLabel: string;
  name: string;
  iban?: string;
  is_default: boolean;
  is_system?: boolean;
  notes?: string;
};

export const SDI_PAYMENT_TYPES = [
  { code: "MP01", label: "Contanti (MP01)", defaultName: "Contanti" },
  { code: "MP02", label: "Assegno (MP02)", defaultName: "Assegno bancario" },
  { code: "MP03", label: "Assegno circolare (MP03)", defaultName: "Assegno circolare" },
  { code: "MP04", label: "Contanti presso Tesoreria (MP04)", defaultName: "Contanti tesoreria" },
  { code: "MP05", label: "Bonifico (MP05)", defaultName: "Bonifico bancario" },
  { code: "MP06", label: "Vaglia cambiario (MP06)", defaultName: "Vaglia cambiario" },
  { code: "MP07", label: "Bollettino bancario (MP07)", defaultName: "Bollettino bancario" },
  { code: "MP08", label: "Carta di pagamento (MP08)", defaultName: "Carta di pagamento" },
  { code: "MP09", label: "RID (MP09)", defaultName: "RID" },
  { code: "MP10", label: "RID utenze (MP10)", defaultName: "RID utenze" },
  { code: "MP11", label: "RID veloce (MP11)", defaultName: "RID veloce" },
  { code: "MP12", label: "Riba (MP12)", defaultName: "Ricevuta bancaria (Ri.Ba.)" },
  { code: "MP13", label: "MAV (MP13)", defaultName: "MAV" },
  { code: "MP14", label: "Quietanza erario (MP14)", defaultName: "Quietanza erario" },
  { code: "MP15", label: "Giroconto (MP15)", defaultName: "Giroconto su contabilità speciale" },
  { code: "MP16", label: "Domiciliazione bancaria (MP16)", defaultName: "Domiciliazione bancaria" },
  { code: "MP17", label: "Domiciliazione postale (MP17)", defaultName: "Domiciliazione postale" },
  { code: "MP18", label: "Bollettino postale (MP18)", defaultName: "Bollettino di c/c postale" },
  { code: "MP19", label: "SEPA Core (MP19)", defaultName: "SEPA Direct Debit Core" },
  { code: "MP20", label: "SEPA B2B (MP20)", defaultName: "SEPA Direct Debit B2B" },
  {
    code: "MP21",
    label: "Trattenuta somme (MP21)",
    defaultName: "Trattenuta su somme già riscosse",
  },
  {
    code: "MP22",
    label: "Trattenuta terzi (MP22)",
    defaultName: "Trattenuta somme riscosse da terzi",
  },
  { code: "N.D.", label: "N.D.", defaultName: "Nessuna" },
];

export const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: "pm-mp08",
    code: "MP08",
    typeLabel: "Carta di pagamento (MP08)",
    name: "Carta di pagamento",
    iban: "",
    is_default: false,
    is_system: true,
  },
  {
    id: "pm-mp01",
    code: "MP01",
    typeLabel: "Contanti (MP01)",
    name: "Contanti",
    iban: "",
    is_default: false,
    is_system: true,
  },
  {
    id: "pm-nd",
    code: "N.D.",
    typeLabel: "N.D.",
    name: "Nessuna",
    iban: "",
    is_default: false,
    is_system: true,
  },
  {
    id: "pm-mp05",
    code: "MP05",
    typeLabel: "Bonifico (MP05)",
    name: "Bonifico",
    iban: "IT20X0878773190000000070774",
    is_default: true,
    is_system: true,
  },
];

const STORAGE_KEY = "app_payment_methods";

export function usePaymentMethods() {
  const [methods, setMethods] = useState<PaymentMethod[]>(() => {
    if (typeof window !== "undefined") {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch (e) {
        console.warn("Could not read payment methods from localStorage", e);
      }
    }
    return DEFAULT_PAYMENT_METHODS;
  });

  // Sync with current user storage key
  useEffect(() => {
    const syncUserStorage = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        const userId = data.user?.id;
        const key = userId ? `${STORAGE_KEY}_${userId}` : STORAGE_KEY;
        const raw = localStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setMethods(parsed);
            return;
          }
        }
        // Save initial default
        localStorage.setItem(key, JSON.stringify(DEFAULT_PAYMENT_METHODS));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_PAYMENT_METHODS));
      } catch {
        // ignore
      }
    };
    syncUserStorage();
  }, []);

  const saveMethods = useCallback((newMethods: PaymentMethod[]) => {
    setMethods(newMethods);
    if (typeof window !== "undefined") {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(newMethods));
        supabase.auth.getUser().then(({ data }) => {
          if (data.user?.id) {
            localStorage.setItem(`${STORAGE_KEY}_${data.user.id}`, JSON.stringify(newMethods));
          }
        });
      } catch (e) {
        console.warn("Could not save payment methods", e);
      }
    }
  }, []);

  const addMethod = useCallback(
    (method: Omit<PaymentMethod, "id">) => {
      const newMethod: PaymentMethod = {
        ...method,
        id: `pm-custom-${Date.now()}`,
      };
      let updated = [...methods];
      if (newMethod.is_default) {
        updated = updated.map((m) => ({ ...m, is_default: false }));
      }
      updated.push(newMethod);
      saveMethods(updated);
      return newMethod;
    },
    [methods, saveMethods],
  );

  const updateMethod = useCallback(
    (id: string, patch: Partial<PaymentMethod>) => {
      const updated = methods.map((m) => {
        if (m.id === id) {
          return { ...m, ...patch };
        }
        if (patch.is_default) {
          return { ...m, is_default: false };
        }
        return m;
      });
      saveMethods(updated);
    },
    [methods, saveMethods],
  );

  const deleteMethod = useCallback(
    (id: string) => {
      const updated = methods.filter((m) => m.id !== id);
      // Ensure at least one is default if deleted was default
      const hadDefault = updated.some((m) => m.is_default);
      if (!hadDefault && updated.length > 0) {
        updated[0].is_default = true;
      }
      saveMethods(updated);
    },
    [methods, saveMethods],
  );

  const setDefaultMethod = useCallback(
    (id: string) => {
      const updated = methods.map((m) => ({
        ...m,
        is_default: m.id === id,
      }));
      saveMethods(updated);
    },
    [methods, saveMethods],
  );

  const resetToDefault = useCallback(() => {
    saveMethods(DEFAULT_PAYMENT_METHODS);
  }, [saveMethods]);

  const defaultMethod = methods.find((m) => m.is_default) || methods[0];

  return {
    methods,
    defaultMethod,
    addMethod,
    updateMethod,
    deleteMethod,
    setDefaultMethod,
    resetToDefault,
  };
}
