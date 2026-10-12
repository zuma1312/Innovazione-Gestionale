import { useEffect, useState, useCallback } from "react";
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  Wrench,
  FileText,
  Receipt,
  BookOpen,
  Package,
  type LucideIcon,
} from "lucide-react";

export type NavIconKey =
  | "LayoutDashboard"
  | "Users"
  | "CalendarDays"
  | "Wrench"
  | "FileText"
  | "Receipt"
  | "BookOpen"
  | "Package";

export const NAV_ICONS_MAP: Record<NavIconKey, LucideIcon> = {
  LayoutDashboard,
  Users,
  CalendarDays,
  Wrench,
  FileText,
  Receipt,
  BookOpen,
  Package,
};

export interface NavItemConfig {
  id: string;
  to: string;
  label: string;
  iconName: NavIconKey;
  visible: boolean;
  description: string;
}

export const DEFAULT_NAV_CONFIG: NavItemConfig[] = [
  {
    id: "dashboard",
    to: "/dashboard",
    label: "Dashboard",
    iconName: "LayoutDashboard",
    visible: true,
    description: "Panoramica attività e indicatori",
  },
  {
    id: "clienti",
    to: "/clienti",
    label: "Clienti",
    iconName: "Users",
    visible: true,
    description: "Anagrafica clienti e contatti",
  },
  {
    id: "agenda",
    to: "/agenda",
    label: "Agenda",
    iconName: "CalendarDays",
    visible: true,
    description: "Calendario e pianificazione appuntamenti",
  },
  {
    id: "interventi",
    to: "/interventi",
    label: "Interventi",
    iconName: "Wrench",
    visible: true,
    description: "Rapportini di lavoro e schede tecniche",
  },
  {
    id: "preventivi",
    to: "/preventivi",
    label: "Preventivi",
    iconName: "FileText",
    visible: true,
    description: "Preventivi, computi e proposte commerciali",
  },
  {
    id: "fatture",
    to: "/fatture",
    label: "Fatture",
    iconName: "Receipt",
    visible: true,
    description: "Fatturazione elettronica SDI e note di credito",
  },
  {
    id: "catalogo",
    to: "/catalogo",
    label: "Catalogo",
    iconName: "BookOpen",
    visible: true,
    description: "Listino articoli, ricambi e manodopera",
  },
  {
    id: "magazzino",
    to: "/catalogo",
    label: "Magazzino",
    iconName: "Package",
    visible: false,
    description: "Giacenze scorte e movimentazioni",
  },
];

const STORAGE_KEY = "innovazione_termica_sidebar_nav_v1";
const EVENT_NAME = "sidebar-nav-updated";

function loadConfig(): NavItemConfig[] {
  if (typeof window === "undefined") return DEFAULT_NAV_CONFIG;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_NAV_CONFIG;
    const parsed = JSON.parse(raw) as Partial<NavItemConfig>[];
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_NAV_CONFIG;

    // Merge with defaults to ensure all fields and any missing items are preserved
    const result: NavItemConfig[] = [];
    const seen = new Set<string>();

    for (const item of parsed) {
      if (!item.id) continue;
      const def = DEFAULT_NAV_CONFIG.find((d) => d.id === item.id);
      if (def) {
        result.push({
          ...def,
          ...item,
          visible: typeof item.visible === "boolean" ? item.visible : def.visible,
        });
        seen.add(item.id);
      }
    }

    // Add any default items that weren't in the saved config
    for (const def of DEFAULT_NAV_CONFIG) {
      if (!seen.has(def.id)) {
        result.push(def);
      }
    }

    return result;
  } catch (e) {
    console.error("Error loading sidebar nav config:", e);
    return DEFAULT_NAV_CONFIG;
  }
}

export function saveConfig(items: NavItemConfig[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: items }));
  } catch (e) {
    console.error("Error saving sidebar nav config:", e);
  }
}

export function useSidebarNavConfig() {
  const [items, setItems] = useState<NavItemConfig[]>(loadConfig);

  useEffect(() => {
    const handleUpdate = () => {
      setItems(loadConfig());
    };

    window.addEventListener(EVENT_NAME, handleUpdate);
    window.addEventListener("storage", handleUpdate);

    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const toggleVisibility = useCallback((id: string) => {
    setItems((prev) => {
      // Don't allow hiding everything - keep at least one visible
      const target = prev.find((i) => i.id === id);
      if (!target) return prev;
      if (target.visible) {
        const visibleCount = prev.filter((i) => i.visible).length;
        if (visibleCount <= 1) return prev;
      }
      const updated = prev.map((item) =>
        item.id === id ? { ...item, visible: !item.visible } : item,
      );
      saveConfig(updated);
      return updated;
    });
  }, []);

  const setVisibility = useCallback((id: string, visible: boolean) => {
    setItems((prev) => {
      const updated = prev.map((item) => (item.id === id ? { ...item, visible } : item));
      saveConfig(updated);
      return updated;
    });
  }, []);

  const moveUp = useCallback((index: number) => {
    if (index <= 0) return;
    setItems((prev) => {
      if (index >= prev.length) return prev;
      const updated = [...prev];
      const temp = updated[index - 1];
      updated[index - 1] = updated[index];
      updated[index] = temp;
      saveConfig(updated);
      return updated;
    });
  }, []);

  const moveDown = useCallback((index: number) => {
    setItems((prev) => {
      if (index < 0 || index >= prev.length - 1) return prev;
      const updated = [...prev];
      const temp = updated[index + 1];
      updated[index + 1] = updated[index];
      updated[index] = temp;
      saveConfig(updated);
      return updated;
    });
  }, []);

  const resetToDefault = useCallback(() => {
    saveConfig(DEFAULT_NAV_CONFIG);
    setItems(DEFAULT_NAV_CONFIG);
  }, []);

  const visibleItems = items.filter((item) => item.visible);

  return {
    items,
    visibleItems,
    toggleVisibility,
    setVisibility,
    moveUp,
    moveDown,
    resetToDefault,
  };
}
