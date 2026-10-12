import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  BookOpen,
  CalendarDays,
  ClipboardCheck,
  FileText,
  Inbox,
  LayoutDashboard,
  LayoutGrid,
  LogOut,
  Menu,
  Package,
  Receipt,
  Settings,
  Users,
  Wrench,
} from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { useSidebarNavConfig, NAV_ICONS_MAP } from "@/hooks/useSidebarNavConfig";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/clienti", label: "Clienti", icon: Users },
  { to: "/agenda", label: "Agenda", icon: CalendarDays },
  { to: "/interventi", label: "Interventi", icon: Wrench },
  { to: "/preventivi", label: "Preventivi", icon: FileText },
  { to: "/fatture", label: "Fatture", icon: Receipt },
  { to: "/catalogo", label: "Catalogo", icon: BookOpen },
] as const;

export function AppLayout({
  title,
  description,
  actions,
  children,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setEmail(data.user?.email ?? ""));
  }, []);

  const [isSigningOut, setIsSigningOut] = useState(false);

  const signOut = async () => {
    if (isSigningOut) return;
    setIsSigningOut(true);
    try {
      await queryClient.cancelQueries();
      queryClient.clear();
      await supabase.auth.signOut();
      toast.success("Disconnessione effettuata");
      navigate({ to: "/", replace: true });
    } catch (error) {
      console.error("Errore durante la disconnessione:", error);
      navigate({ to: "/", replace: true });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarHeader className="border-b border-sidebar-border px-3 py-4 group-data-[collapsible=icon]:px-1.5 group-data-[collapsible=icon]:py-3.5 transition-all">
          <div className="flex items-center gap-2 group-data-[collapsible=icon]:justify-center">
            <img
              src={logo}
              alt="Innovazione Termica"
              width={36}
              height={36}
              className="size-9 shrink-0 aspect-square object-contain"
            />
            <div className="min-w-0 group-data-[collapsible=icon]:hidden">
              <p className="truncate text-sm font-bold tracking-wide">INNOVAZIONE</p>
              <p className="truncate text-xs text-sidebar-foreground/70">TERMICA · Roma</p>
            </div>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <AppSidebarNav pathname={pathname} />
        </SidebarContent>
        <SidebarFooter className="border-t border-sidebar-border">
          <AppSidebarFooter pathname={pathname} onSignOut={signOut} isSigningOut={isSigningOut} />
        </SidebarFooter>
      </Sidebar>

      <SidebarInset className="bg-background min-h-screen flex flex-col">
        <header className="sticky top-0 z-20 border-b bg-card/90 px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3 backdrop-blur shadow-xs">
          <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-2 sm:gap-4 min-w-0">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-1">
              <SidebarTrigger />
              <div className="min-w-0 flex-1">
                <h1 className="truncate text-base sm:text-lg font-semibold tracking-tight">
                  {title}
                </h1>
                {description ? (
                  <p className="truncate text-xs text-muted-foreground hidden sm:block">
                    {description}
                  </p>
                ) : null}
              </div>
            </div>
            <div className="hidden text-right text-xs text-muted-foreground md:block">{email}</div>
            {actions ? (
              <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">{actions}</div>
            ) : null}
          </div>
        </header>
        <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6 pb-24 md:pb-8 min-w-0">
          {children}
        </main>
        <MobileBottomBar />
      </SidebarInset>
    </SidebarProvider>
  );
}

function AppSidebarNav({ pathname }: { pathname: string }) {
  const { setOpenMobile, isMobile } = useSidebar();
  const { visibleItems } = useSidebarNavConfig();
  const handleNavClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <SidebarGroup>
      <div className="flex items-center justify-between px-2 pb-1">
        <SidebarGroupLabel className="p-0 text-sidebar-foreground/70">Gestionale</SidebarGroupLabel>
        <Link
          to="/impostazioni"
          title="Personalizza e ordina sezioni barra laterale"
          className="text-[11px] text-sidebar-foreground/50 hover:text-sidebar-foreground transition-colors font-medium hover:underline group-data-[collapsible=icon]:hidden"
          onClick={handleNavClick}
        >
          Personalizza
        </Link>
      </div>
      <SidebarGroupContent>
        <SidebarMenu>
          {visibleItems.map((item) => {
            const Icon = NAV_ICONS_MAP[item.iconName] || LayoutDashboard;
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton asChild isActive={pathname === item.to} tooltip={item.label}>
                  <Link to={item.to} onClick={handleNavClick}>
                    <Icon className="size-4 shrink-0" />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            );
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
}

function AppSidebarFooter({
  pathname,
  onSignOut,
  isSigningOut,
}: {
  pathname: string;
  onSignOut: () => void;
  isSigningOut: boolean;
}) {
  const { setOpenMobile, isMobile } = useSidebar();
  const handleSettingsClick = () => {
    if (isMobile) setOpenMobile(false);
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <SidebarMenuButton asChild isActive={pathname === "/impostazioni"} tooltip="Impostazioni">
          <Link to="/impostazioni" onClick={handleSettingsClick}>
            <Settings />
            <span>Impostazioni</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
      <SidebarMenuItem>
        <SidebarMenuButton
          type="button"
          onClick={onSignOut}
          tooltip="Esci"
          disabled={isSigningOut}
          className="cursor-pointer text-destructive hover:bg-destructive/10 hover:text-destructive focus-visible:text-destructive"
        >
          <LogOut className="size-4 shrink-0" />
          <span>{isSigningOut ? "Disconnessione..." : "Esci"}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}

function MobileBottomBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { visibleItems } = useSidebarNavConfig();

  const bottomItems = visibleItems.slice(0, 6);
  const colCount = Math.max(1, Math.min(bottomItems.length, 6));

  return (
    <nav
      aria-label="Navigazione mobile"
      className="fixed bottom-0 inset-x-0 z-40 md:hidden bg-card/95 backdrop-blur-md border-t border-border px-1 pt-1.5 pb-[max(0.5rem,env(safe-area-inset-bottom))] shadow-lg select-none"
    >
      <div
        className="grid items-center"
        style={{ gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))` }}
      >
        {bottomItems.map((item) => {
          const Icon = NAV_ICONS_MAP[item.iconName] || LayoutDashboard;
          const isActive = pathname === item.to;
          return (
            <Link
              key={item.id}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center py-1 px-0.5 rounded-lg transition-colors group",
                isActive
                  ? "text-primary font-semibold"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <div className="relative flex items-center justify-center">
                <Icon
                  className={cn(
                    "size-4.5 transition-transform group-active:scale-90",
                    isActive && "scale-105 stroke-[2.25]",
                  )}
                />
              </div>
              <span className="text-[10px] leading-tight mt-1 truncate max-w-full font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
