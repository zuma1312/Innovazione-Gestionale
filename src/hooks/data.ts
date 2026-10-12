import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { CompanyInfo } from "@/lib/doc";

export type TableName =
  | "clients"
  | "appointments"
  | "interventions"
  | "quotes"
  | "invoices"
  | "inventory_items"
  | "expenses";

const ORDER: Record<TableName, { column: string; ascending: boolean }> = {
  clients: { column: "created_at", ascending: false },
  appointments: { column: "starts_at", ascending: true },
  interventions: { column: "date", ascending: false },
  quotes: { column: "date", ascending: false },
  invoices: { column: "date", ascending: false },
  inventory_items: { column: "name", ascending: true },
  expenses: { column: "date", ascending: false },
};

/* eslint-disable @typescript-eslint/no-explicit-any */
export function useList<T = any>(table: TableName) {
  return useQuery({
    queryKey: [table],
    queryFn: async (): Promise<T[]> => {
      const order = ORDER[table];
      const { data, error } = await (supabase as any)
        .from(table)
        .select("*")
        .order(order.column, { ascending: order.ascending });
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

export function useSave(table: TableName) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Record<string, any>) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Sessione scaduta");
      const payload = { ...row, user_id: userId };
      if (payload.id) {
        const { error } = await (supabase as any).from(table).update(payload).eq("id", payload.id);
        if (error) throw error;
      } else {
        delete payload.id;
        const { error } = await (supabase as any).from(table).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [table] });
    },
  });
}

export function useRemove(table: TableName) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any).from(table).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [table] });
    },
  });
}

export const DEFAULT_COMPANY: CompanyInfo = {
  company_name: "INNOVAZIONE TERMICA",
  address: "",
  city: "Roma",
  phone: "3891344474",
  email: "maurizio.tanforti@gmail.com",
  vat_number: "",
  iban: "",
};

export type CompanySettings = CompanyInfo & {
  user_id?: string;
  default_vat_rate: number;
  default_template: string;
  owner_first_name: string;
  owner_last_name: string;
  fiscal_code: string;
  zip: string;
  province: string;
  logo_url: string;
  quote_prefix: string;
  quote_validity_days: number;
  quote_payment_terms: string;
  quote_default_notes: string;
  quote_default_exclusions: string;

  // Fatturazione elettronica
  sdi_code: string;
  pec_email: string;
  xml_transmission_format: string;
  tax_regime: string;

  // Avanzate
  invoice_prefix: string;
  intervention_prefix: string;
  price_decimals: number;
  currency: string;

  // Modelli
  template_quotes: string;
  template_invoices: string;
  template_electronic_invoices: string;
  template_interventions: string;
  template_ddt: string;
  template_email: string;

  // App & Servizi
  whatsapp_enabled: boolean;
  whatsapp_custom_msg: string;
  google_calendar_enabled: boolean;

  // Gestione Link
  public_link_expiration_days: number;
  public_link_require_signature: boolean;

  // Profilo utenti permessi
  tech_can_view_prices: boolean;
  allow_edit_approved_quotes: boolean;
};

export const DEFAULT_SETTINGS: CompanySettings = {
  ...DEFAULT_COMPANY,
  default_vat_rate: 22,
  default_template: "classico",
  owner_first_name: "Maurizio",
  owner_last_name: "Tanforti",
  fiscal_code: "",
  zip: "",
  province: "",
  logo_url: "",
  quote_prefix: "PREV",
  quote_validity_days: 30,
  quote_payment_terms: "Acconto 50% alla firma, Saldo a fine lavori",
  quote_default_notes: "",
  quote_default_exclusions: "Tutto quanto non esplicitamente descritto nelle voci del preventivo",

  sdi_code: "0000000",
  pec_email: "fatture@pec.innovazionetermica.it",
  xml_transmission_format: "FPR12",
  tax_regime: "RF01",

  invoice_prefix: "FT",
  intervention_prefix: "INT",
  price_decimals: 2,
  currency: "EUR (€)",

  template_quotes: "Classico",
  template_invoices: "Classico",
  template_electronic_invoices: "Standard",
  template_interventions: "Moderno",
  template_ddt: "Minimale",
  template_email: "Attivo",

  whatsapp_enabled: true,
  whatsapp_custom_msg:
    "Gentile cliente, le inviamo in allegato il documento di Innovazione Termica. Restiamo a disposizione per qualsiasi chiarimento.",
  google_calendar_enabled: false,

  public_link_expiration_days: 60,
  public_link_require_signature: true,

  tech_can_view_prices: true,
  allow_edit_approved_quotes: false,
};

export function useCompany() {
  return useQuery({
    queryKey: ["company_settings"],
    queryFn: async (): Promise<CompanySettings> => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      let cached: Partial<CompanySettings> = {};
      if (typeof window !== "undefined") {
        try {
          const raw = localStorage.getItem(
            userId ? `app_company_settings_${userId}` : "app_company_settings",
          );
          if (raw) cached = JSON.parse(raw);
        } catch (e) {
          console.warn("Could not read local company settings", e);
        }
      }

      if (!userId) {
        return { ...DEFAULT_SETTINGS, ...cached };
      }

      const { data, error } = await (supabase as any)
        .from("company_settings")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        const row = { user_id: userId, ...DEFAULT_COMPANY };
        await (supabase as any).from("company_settings").insert(row);
        return { ...DEFAULT_SETTINGS, ...cached, ...row };
      }

      return {
        ...DEFAULT_SETTINGS,
        ...cached,
        ...data,
      };
    },
  });
}

export function useSaveCompany() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (row: Partial<CompanySettings>) => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;
      if (!userId) throw new Error("Sessione scaduta");

      // Save known Supabase columns
      const dbPayload = {
        user_id: userId,
        company_name: row.company_name ?? "INNOVAZIONE TERMICA",
        address: row.address ?? "",
        city: row.city ?? "Roma",
        phone: row.phone ?? "",
        email: row.email ?? "",
        vat_number: row.vat_number ?? "",
        iban: row.iban ?? "",
        default_vat_rate: Number(row.default_vat_rate) || 22,
        default_template: row.default_template ?? "classico",
        updated_at: new Date().toISOString(),
      };

      const { error } = await (supabase as any).from("company_settings").upsert(dbPayload);
      if (error) throw error;

      // Persist full settings object in localStorage
      if (typeof window !== "undefined") {
        try {
          const current = localStorage.getItem(`app_company_settings_${userId}`);
          const prev = current ? JSON.parse(current) : {};
          localStorage.setItem(
            `app_company_settings_${userId}`,
            JSON.stringify({ ...DEFAULT_SETTINGS, ...prev, ...row }),
          );
          localStorage.setItem(
            "app_company_settings",
            JSON.stringify({ ...DEFAULT_SETTINGS, ...prev, ...row }),
          );
        } catch (e) {
          console.warn("Could not save local company settings", e);
        }
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["company_settings"] }),
  });
}
