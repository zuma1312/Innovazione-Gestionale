// Mock Supabase Client for local / preview / offline development
// Automatically used when VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY are not configured.
/* eslint-disable @typescript-eslint/no-explicit-any */

export const DEMO_USER = {
  id: "usr_demo_user",
  email: "demo@example.com",
  user_metadata: { full_name: "Mario Rossi" },
  app_metadata: { provider: "email" },
  aud: "authenticated",
  created_at: "2024-01-01T08:00:00.000Z",
};

const STORAGE_KEY_AUTH = "sb_mock_auth_session";
const STORAGE_KEY_LOGGED_OUT = "sb_mock_logged_out";
const STORAGE_PREFIX_TABLE = "sb_mock_table_";

type AuthListener = (event: string, session: typeof DEMO_SESSION | null) => void;
const authListeners = new Set<AuthListener>();

export const DEMO_SESSION = {
  access_token: "mock-jwt-token-demo-2025",
  token_type: "bearer",
  expires_in: 3600 * 24 * 365,
  expires_at: Math.floor(Date.now() / 1000) + 3600 * 24 * 365,
  refresh_token: "mock-refresh-token",
  user: DEMO_USER,
};

function getStorage(): Storage | null {
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  return null;
}

// In-memory fallback for SSR
const memoryStore: Record<string, string> = {};

function getItem(key: string): string | null {
  const ls = getStorage();
  if (ls) return ls.getItem(key);
  return memoryStore[key] ?? null;
}

function setItem(key: string, value: string): void {
  const ls = getStorage();
  if (ls) ls.setItem(key, value);
  memoryStore[key] = value;
}

function removeItem(key: string): void {
  const ls = getStorage();
  if (ls) ls.removeItem(key);
  delete memoryStore[key];
}

function getStoredSession() {
  const isLoggedOut = getItem(STORAGE_KEY_LOGGED_OUT);
  if (isLoggedOut === "true") {
    return null;
  }
  const raw = getItem(STORAGE_KEY_AUTH);
  if (raw === "null" || raw === "undefined") {
    return null;
  }
  if (!raw) {
    // Default to authenticated session for smooth demo experience
    setItem(STORAGE_KEY_AUTH, JSON.stringify(DEMO_SESSION));
    return DEMO_SESSION;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function getInitialTableData(table: string): any[] {
  const now = Date.now();
  const day = 86400000;
  const hour = 3600000;

  switch (table) {
    case "company_settings":
      return [
        {
          user_id: DEMO_USER.id,
          company_name: "Azienda Demo Srl",
          address: "Via Roma 100",
          city: "Roma",
          phone: "0000000000",
          email: "demo@example.com",
          vat_number: "00000000000",
          iban: "IT00X0000000000000000000000",
          default_vat_rate: 22,
          default_template: "classico",
          owner_first_name: "Mario",
          owner_last_name: "Rossi",
          fiscal_code: "RSSMRA80A01H501U",
          zip: "00100",
          province: "RM",
          quote_prefix: "PREV",
          quote_validity_days: 30,
          quote_payment_terms: "Acconto 50% alla firma, Saldo a fine lavori",
          quote_default_notes:
            "Garanzia 24 mesi su tutti i ricambi e posa a regola d'arte con dichiarazione di conformità DM 37/08.",
          quote_default_exclusions:
            "Tutto quanto non esplicitamente descritto nelle singole voci di preventivo.",
          updated_at: new Date().toISOString(),
        },
      ];

    case "clients":
      return [
        {
          id: "cl-1",
          user_id: DEMO_USER.id,
          name: "Luca Verdi",
          email: "cliente1@example.com",
          phone: "0000000001",
          address: "Via Dante 10",
          city: "Roma",
          zip: "00100",
          vat_number: "VRDLCU75C12H501X",
          notes: "Caldaia murale 24kW da revisionare. Secondo piano con ascensore.",
          created_at: new Date(now - 30 * day).toISOString(),
        },
        {
          id: "cl-2",
          user_id: DEMO_USER.id,
          name: "Condominio Il Pino",
          email: "amministrazione@example.com",
          phone: "0000000002",
          address: "Corso Italia 50",
          city: "Roma",
          zip: "00100",
          vat_number: "00000000002",
          notes: "Centrale termica condominiale e autoclave gemellare. Referente amministratore.",
          created_at: new Date(now - 25 * day).toISOString(),
        },
        {
          id: "cl-3",
          user_id: DEMO_USER.id,
          name: "Giulia Neri",
          email: "cliente2@example.com",
          phone: "0000000003",
          address: "Via Garibaldi 15",
          city: "Roma",
          zip: "00100",
          vat_number: "",
          notes: "Riparazione perdita bagno e installazione miscelatori doccia termostatici.",
          created_at: new Date(now - 18 * day).toISOString(),
        },
        {
          id: "cl-4",
          user_id: DEMO_USER.id,
          name: "Bar Pasticceria Stella",
          email: "commerciale@example.com",
          phone: "0000000004",
          address: "Piazza Duomo 5",
          city: "Roma",
          zip: "00100",
          vat_number: "00000000004",
          notes: "Locale commerciale: impianto scarico cucina e depuratore addolcitore.",
          created_at: new Date(now - 10 * day).toISOString(),
        },
        {
          id: "cl-5",
          user_id: DEMO_USER.id,
          name: "Alessandro Bianchi",
          email: "cliente3@example.com",
          phone: "0000000005",
          address: "Via Milano 22",
          city: "Roma",
          zip: "00100",
          vat_number: "BNCGLI68M15H501J",
          notes: "Richiesta preventivo per impianto solare termico a circolazione forzata.",
          created_at: new Date(now - 5 * day).toISOString(),
        },
      ];

    case "appointments":
      return [
        {
          id: "ap-1",
          user_id: DEMO_USER.id,
          client_id: "cl-1",
          title: "Sopralluogo sostituzione caldaia",
          starts_at: new Date(now + 2 * hour).toISOString(),
          duration_min: 90,
          address: "Via Dante 10, Roma",
          notes: "Verificare canna fumaria collettiva e scarico condensa a norma.",
          status: "confermato",
          created_at: new Date(now - 2 * day).toISOString(),
        },
        {
          id: "ap-2",
          user_id: DEMO_USER.id,
          client_id: "cl-3",
          title: "Riparazione perdita lavello e doccia",
          starts_at: new Date(now + 26 * hour).toISOString(),
          duration_min: 120,
          address: "Via Garibaldi 15, Roma",
          notes: "Portare raccordi multistrato da 16 e miscelatore di ricambio.",
          status: "programmato",
          created_at: new Date(now - 1 * day).toISOString(),
        },
        {
          id: "ap-3",
          user_id: DEMO_USER.id,
          client_id: "cl-2",
          title: "Controllo annuale centrale termica e fumi",
          starts_at: new Date(now + 50 * hour).toISOString(),
          duration_min: 180,
          address: "Corso Italia 50, Roma",
          notes: "Rilascio bollino e aggiornamento libretto telematico.",
          status: "programmato",
          created_at: new Date(now - 3 * day).toISOString(),
        },
      ];

    case "interventions":
      return [
        {
          id: "int-1",
          user_id: DEMO_USER.id,
          client_id: "cl-1",
          number: "INT-2025-018",
          title: "Sostituzione scambiatore primario e collaudo",
          description:
            "Intervento su caldaia bloccata: pulizia ugelli, sostituzione scambiatore a piastre e taratura pressione gas.",
          date: new Date(now - 3 * day).toISOString().split("T")[0],
          technician: "Mario Rossi",
          hours: 2.5,
          hourly_rate: 35,
          materials_cost: 165,
          status: "completato",
          template: "classico",
          created_at: new Date(now - 3 * day).toISOString(),
        },
        {
          id: "int-2",
          user_id: DEMO_USER.id,
          client_id: "cl-4",
          number: "INT-2025-019",
          title: "Pronto intervento disostruzione scarico cucina",
          description:
            "Disostruzione con macchina a spirale meccanica e lavaggio ad alta pressione condotta 110mm.",
          date: new Date(now - 1 * day).toISOString().split("T")[0],
          technician: "Mario Rossi",
          hours: 3,
          hourly_rate: 45,
          materials_cost: 40,
          status: "completato",
          template: "moderno",
          created_at: new Date(now - 1 * day).toISOString(),
        },
      ];

    case "quotes":
      return [
        {
          id: "qt-1",
          user_id: DEMO_USER.id,
          client_id: "cl-1",
          number: "PREV-2025-001",
          date: new Date(now - 14 * day).toISOString().split("T")[0],
          valid_until: new Date(now + 16 * day).toISOString().split("T")[0],
          items: [
            {
              description: "Fornitura Caldaia a condensazione 24kW classe A",
              quantity: 1,
              unit_price: 1350,
              vat_rate: 22,
            },
            {
              description: "Installazione, raccordi a norma e scarico fumi coassiale",
              quantity: 1,
              unit_price: 450,
              vat_rate: 22,
            },
            {
              description: "Lavaggio chimico impianto con liquido risanante filmante",
              quantity: 1,
              unit_price: 250,
              vat_rate: 22,
            },
            {
              description: "Installazione filtro defangatore magnetico sotto-caldaia",
              quantity: 1,
              unit_price: 110,
              vat_rate: 22,
            },
          ],
          vat_rate: 22,
          notes: "Detrazione fiscale 50% / 65% applicabile. Pratica Enea inclusa.",
          status: "accettato",
          template: "classico",
          total: 2635.2,
          created_at: new Date(now - 14 * day).toISOString(),
        },
        {
          id: "qt-2",
          user_id: DEMO_USER.id,
          client_id: "cl-2",
          number: "PREV-2025-002",
          date: new Date(now - 7 * day).toISOString().split("T")[0],
          valid_until: new Date(now + 23 * day).toISOString().split("T")[0],
          items: [
            {
              description: "Pompa di rilancio elettronica gemellare Wilo Stratos",
              quantity: 1,
              unit_price: 1250,
              vat_rate: 22,
            },
            {
              description: "Manodopera montaggio, collaudo idraulico ed elettrico",
              quantity: 8,
              unit_price: 35,
              vat_rate: 22,
            },
          ],
          vat_rate: 22,
          notes: "Intervento programmato per fine mese in centrale termica.",
          status: "inviato",
          template: "moderno",
          total: 1866.6,
          created_at: new Date(now - 7 * day).toISOString(),
        },
      ];

    case "invoices":
      return [
        {
          id: "inv-1",
          user_id: DEMO_USER.id,
          client_id: "cl-1",
          number: "FATT-2025-001",
          date: new Date(now - 4 * day).toISOString().split("T")[0],
          due_date: new Date(now + 26 * day).toISOString().split("T")[0],
          items: [
            {
              description: "Fornitura e installazione Caldaia a condensazione 24kW classe A",
              quantity: 1,
              unit_price: 1800,
              vat_rate: 22,
            },
            {
              description: "Lavaggio chimico e defangatore magnetico",
              quantity: 1,
              unit_price: 360,
              vat_rate: 22,
            },
          ],
          vat_rate: 22,
          notes: "Pagamento a mezzo bonifico bancario su IBAN indicato.",
          status: "pagata",
          template: "classico",
          total: 2635.2,
          created_at: new Date(now - 4 * day).toISOString(),
        },
        {
          id: "inv-2",
          user_id: DEMO_USER.id,
          client_id: "cl-4",
          number: "FATT-2025-002",
          date: new Date(now - 1 * day).toISOString().split("T")[0],
          due_date: new Date(now + 14 * day).toISOString().split("T")[0],
          items: [
            {
              description: "Pronto intervento disostruzione scarico cucina e ripristino",
              quantity: 1,
              unit_price: 175,
              vat_rate: 22,
            },
          ],
          vat_rate: 22,
          notes: "Pagamento a 15 giorni.",
          status: "emessa",
          template: "moderno",
          total: 213.5,
          created_at: new Date(now - 1 * day).toISOString(),
        },
      ];

    case "inventory_items":
      return [
        {
          id: "item-1",
          user_id: DEMO_USER.id,
          code: "FL-12-40",
          name: "Flessibile acciaio inox 1/2 MF 40cm",
          category: "Raccorderia e Valvole",
          quantity: 18,
          min_quantity: 8,
          unit_price: 6.5,
          supplier: "Fornitore Demo Materiali",
          created_at: new Date(now - 20 * day).toISOString(),
        },
        {
          id: "item-2",
          user_id: DEMO_USER.id,
          code: "VAL-GAS-34",
          name: "Valvola a sfera gas 3/4 FF con leva di sicurezza",
          category: "Raccorderia e Valvole",
          quantity: 9,
          min_quantity: 5,
          unit_price: 14.5,
          supplier: "Fornitore Demo Materiali",
          created_at: new Date(now - 20 * day).toISOString(),
        },
        {
          id: "item-3",
          user_id: DEMO_USER.id,
          code: "DEF-MAG-01",
          name: "Filtro defangatore magnetico sotto-caldaia 3/4",
          category: "Caldaie e Climatizzazione",
          quantity: 5,
          min_quantity: 3,
          unit_price: 68.0,
          supplier: "Fornitore Componenti Srl",
          created_at: new Date(now - 15 * day).toISOString(),
        },
        {
          id: "item-4",
          user_id: DEMO_USER.id,
          code: "TERM-DIG-02",
          name: "Cronotermostato ambiente digitale Wi-Fi settimanale",
          category: "Caldaie e Climatizzazione",
          quantity: 4,
          min_quantity: 2,
          unit_price: 52.0,
          supplier: "Fornitore Elettronica Srl",
          created_at: new Date(now - 10 * day).toISOString(),
        },
        {
          id: "item-5",
          user_id: DEMO_USER.id,
          code: "KIT-GUARN-100",
          name: "Assortimento guarnizioni fibra e EPDM 100 pz",
          category: "Materiale di consumo",
          quantity: 2,
          min_quantity: 4,
          unit_price: 18.0,
          supplier: "Fornitore Demo Materiali",
          created_at: new Date(now - 10 * day).toISOString(),
        },
        {
          id: "item-6",
          user_id: DEMO_USER.id,
          code: "CHIM-FILM-1L",
          name: "Liquido protettivo filmante per radiatori 1L",
          category: "Materiale di consumo",
          quantity: 7,
          min_quantity: 4,
          unit_price: 26.0,
          supplier: "Fornitore Trattamenti Srl",
          created_at: new Date(now - 8 * day).toISOString(),
        },
      ];

    case "expenses":
      return [
        {
          id: "exp-1",
          user_id: DEMO_USER.id,
          title: "Fornitura raccordi e valvole ottone",
          amount: 320.0,
          date: new Date(now - 12 * day).toISOString().split("T")[0],
          category: "Materiali",
          notes: "Fattura n. 450 Fornitore Demo Materiali",
          created_at: new Date(now - 12 * day).toISOString(),
        },
        {
          id: "exp-2",
          user_id: DEMO_USER.id,
          title: "Carburante furgone aziendale",
          amount: 85.0,
          date: new Date(now - 5 * day).toISOString().split("T")[0],
          category: "Carburante",
          notes: "Stazione di Servizio Demo",
          created_at: new Date(now - 5 * day).toISOString(),
        },
        {
          id: "exp-3",
          user_id: DEMO_USER.id,
          title: "Assicurazione RC professionale",
          amount: 115.0,
          date: new Date(now - 20 * day).toISOString().split("T")[0],
          category: "Assicurazione",
          notes: "Rata mensile polizza assicurativa",
          created_at: new Date(now - 20 * day).toISOString(),
        },
      ];

    default:
      return [];
  }
}

function getTable(table: string): any[] {
  const key = STORAGE_PREFIX_TABLE + table;
  const raw = getItem(key);
  if (!raw) {
    const initial = getInitialTableData(table);
    setItem(key, JSON.stringify(initial));
    return initial;
  }
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

function saveTable(table: string, data: any[]): void {
  const key = STORAGE_PREFIX_TABLE + table;
  setItem(key, JSON.stringify(data));
}

class MockQueryBuilder {
  private table: string;
  private action: "select" | "insert" | "update" | "delete" | "upsert" = "select";
  private actionData: any = null;
  private filters: Array<{ column: string; op: "eq" | "neq" | "in" | "is"; value: any }> = [];
  private orderConfig?: { column: string; ascending: boolean };
  private limitCount?: number;
  private isSingle = false;
  private isMaybeSingle = false;

  constructor(table: string) {
    this.table = table;
  }

  select(_columns = "*") {
    if (this.action === "select") {
      this.action = "select";
    }
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, op: "eq", value });
    return this;
  }

  neq(column: string, value: any) {
    this.filters.push({ column, op: "neq", value });
    return this;
  }

  in(column: string, values: any[]) {
    this.filters.push({ column, op: "in", value: values });
    return this;
  }

  is(column: string, value: any) {
    this.filters.push({ column, op: "is", value });
    return this;
  }

  order(column: string, options?: { ascending?: boolean }) {
    this.orderConfig = {
      column,
      ascending: options?.ascending !== false,
    };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.isSingle = true;
    return this;
  }

  maybeSingle() {
    this.isMaybeSingle = true;
    return this;
  }

  insert(data: any) {
    this.action = "insert";
    this.actionData = data;
    return this;
  }

  update(patch: any) {
    this.action = "update";
    this.actionData = patch;
    return this;
  }

  delete() {
    this.action = "delete";
    return this;
  }

  upsert(data: any) {
    this.action = "upsert";
    this.actionData = data;
    return this;
  }

  private execute(): { data: any; error: any } {
    let rows = [...getTable(this.table)];

    const matchesFilters = (item: any) => {
      for (const f of this.filters) {
        const itemVal = item[f.column];
        if (f.op === "eq" && String(itemVal) !== String(f.value)) return false;
        if (f.op === "neq" && String(itemVal) === String(f.value)) return false;
        if (f.op === "in" && (!Array.isArray(f.value) || !f.value.includes(itemVal))) return false;
        if (f.op === "is" && itemVal !== f.value) return false;
      }
      return true;
    };

    if (this.action === "insert") {
      const items = Array.isArray(this.actionData) ? this.actionData : [this.actionData];
      const inserted = items.map((it) => {
        const id = it.id || "id_" + Math.random().toString(36).slice(2, 10);
        return {
          ...it,
          id,
          created_at: it.created_at || new Date().toISOString(),
        };
      });
      rows.push(...inserted);
      saveTable(this.table, rows);
      return {
        data: Array.isArray(this.actionData) ? inserted : inserted[0],
        error: null,
      };
    }

    if (this.action === "update") {
      let updatedCount = 0;
      rows = rows.map((item) => {
        if (matchesFilters(item)) {
          updatedCount++;
          return {
            ...item,
            ...this.actionData,
            updated_at: new Date().toISOString(),
          };
        }
        return item;
      });
      saveTable(this.table, rows);
      return { data: this.actionData, error: null };
    }

    if (this.action === "delete") {
      rows = rows.filter((item) => !matchesFilters(item));
      saveTable(this.table, rows);
      return { data: null, error: null };
    }

    if (this.action === "upsert") {
      const items = Array.isArray(this.actionData) ? this.actionData : [this.actionData];
      const upserted = items.map((it) => {
        const matchKey = it.id ? "id" : it.user_id ? "user_id" : null;
        if (matchKey) {
          const idx = rows.findIndex((r) => r[matchKey] === it[matchKey]);
          if (idx >= 0) {
            rows[idx] = { ...rows[idx], ...it, updated_at: new Date().toISOString() };
            return rows[idx];
          }
        }
        const newRow = {
          ...it,
          id: it.id || "id_" + Math.random().toString(36).slice(2, 10),
          created_at: it.created_at || new Date().toISOString(),
        };
        rows.push(newRow);
        return newRow;
      });
      saveTable(this.table, rows);
      return {
        data: Array.isArray(this.actionData) ? upserted : upserted[0],
        error: null,
      };
    }

    // Default SELECT
    let result = rows.filter(matchesFilters);

    if (this.orderConfig) {
      const { column, ascending } = this.orderConfig;
      result.sort((a, b) => {
        const valA = a[column];
        const valB = b[column];
        if (valA === valB) return 0;
        if (valA === undefined || valA === null) return 1;
        if (valB === undefined || valB === null) return -1;
        if (typeof valA === "number" && typeof valB === "number") {
          return ascending ? valA - valB : valB - valA;
        }
        const strA = String(valA);
        const strB = String(valB);
        return ascending ? strA.localeCompare(strB) : strB.localeCompare(strA);
      });
    }

    if (this.limitCount !== undefined) {
      result = result.slice(0, this.limitCount);
    }

    if (this.isSingle) {
      if (result.length === 0) {
        return {
          data: null,
          error: { message: "JSON object requested, multiple (or no) rows returned" },
        };
      }
      return { data: result[0], error: null };
    }

    if (this.isMaybeSingle) {
      return { data: result[0] ?? null, error: null };
    }

    return { data: result, error: null };
  }

  // Makes Builder directly thenable (awaitable)
  then<TResult1 = any, TResult2 = never>(
    onfulfilled?: ((value: { data: any; error: any }) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null,
  ): Promise<TResult1 | TResult2> {
    const outcome = this.execute();
    return Promise.resolve(outcome).then(onfulfilled, onrejected);
  }
}

export function createMockSupabaseClient() {
  return {
    auth: {
      getSession: async () => {
        const session = getStoredSession();
        return { data: { session }, error: null };
      },
      getUser: async () => {
        const session = getStoredSession();
        return { data: { user: session?.user ?? null }, error: null };
      },
      getClaims: async (_token: string) => {
        const session = getStoredSession();
        return {
          data: {
            claims: {
              sub: session?.user?.id ?? DEMO_USER.id,
              email: session?.user?.email ?? DEMO_USER.email,
            },
          },
          error: null,
        };
      },
      signInWithPassword: async ({ email }: { email: string; password?: string }) => {
        removeItem(STORAGE_KEY_LOGGED_OUT);
        const user = {
          ...DEMO_USER,
          id:
            "usr_" +
            Math.abs(email.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)),
          email: email || DEMO_USER.email,
        };
        const session = {
          ...DEMO_SESSION,
          user,
        };
        setItem(STORAGE_KEY_AUTH, JSON.stringify(session));
        authListeners.forEach((cb) => {
          try {
            cb("SIGNED_IN", session);
          } catch (e) {
            console.error("Auth listener error", e);
          }
        });
        return { data: { user, session }, error: null };
      },
      signUp: async ({ email }: { email: string; password?: string; options?: any }) => {
        removeItem(STORAGE_KEY_LOGGED_OUT);
        const user = {
          ...DEMO_USER,
          id:
            "usr_" +
            Math.abs(email.split("").reduce((a, b) => ((a << 5) - a + b.charCodeAt(0)) | 0, 0)),
          email: email || DEMO_USER.email,
        };
        const session = {
          ...DEMO_SESSION,
          user,
        };
        setItem(STORAGE_KEY_AUTH, JSON.stringify(session));
        authListeners.forEach((cb) => {
          try {
            cb("SIGNED_IN", session);
          } catch (e) {
            console.error("Auth listener error", e);
          }
        });
        return { data: { user, session }, error: null };
      },
      signOut: async () => {
        setItem(STORAGE_KEY_LOGGED_OUT, "true");
        removeItem(STORAGE_KEY_AUTH);
        authListeners.forEach((cb) => {
          try {
            cb("SIGNED_OUT", null);
          } catch (e) {
            console.error("Auth listener error", e);
          }
        });
        return { error: null };
      },
      onAuthStateChange: (callback: AuthListener) => {
        authListeners.add(callback);
        // Dispatch current state on next tick
        setTimeout(() => {
          const session = getStoredSession();
          callback(session ? "SIGNED_IN" : "INITIAL_SESSION", session);
        }, 0);
        return {
          data: {
            subscription: {
              unsubscribe: () => {
                authListeners.delete(callback);
              },
            },
          },
        };
      },
    },
    from: (table: string) => {
      return new MockQueryBuilder(table);
    },
  };
}
