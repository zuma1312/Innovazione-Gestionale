import { useState } from "react";
import { Download, Smartphone } from "lucide-react";
import { usePWAInstall } from "@/hooks/usePWAInstall";
import { IOSInstallGuideModal } from "@/components/IOSInstallGuideModal";
import { Button } from "@/components/ui/button";
import { SidebarMenuButton, SidebarMenuItem } from "@/components/ui/sidebar";

export function PWAInstallSidebarItem() {
  const { mounted, isInstalled, isIOS, isInstallable, install } = usePWAInstall();
  const [guideOpen, setGuideOpen] = useState(false);

  // Se l'app è già aperta in modalità standalone (salvata sulla Home), non mostriamo nulla
  if (!mounted || isInstalled) {
    return null;
  }

  const handleClick = () => {
    if (isIOS) {
      setGuideOpen(true);
    } else if (isInstallable) {
      install();
    } else {
      setGuideOpen(true);
    }
  };

  return (
    <>
      <SidebarMenuItem>
        <SidebarMenuButton
          type="button"
          onClick={handleClick}
          tooltip={isIOS ? "Installa su iPhone" : "Installa App"}
          className="cursor-pointer text-primary hover:bg-primary/10 hover:text-primary focus-visible:text-primary font-medium"
        >
          {isIOS ? (
            <Smartphone className="size-4 shrink-0 text-primary" />
          ) : (
            <Download className="size-4 shrink-0 text-primary" />
          )}
          <span>{isIOS ? "Installa su iPhone" : "Installa applicazione"}</span>
        </SidebarMenuButton>
      </SidebarMenuItem>

      <IOSInstallGuideModal open={guideOpen} onOpenChange={setGuideOpen} />
    </>
  );
}

export function PWAInstallHeaderButton() {
  const { mounted, isInstalled, isIOS, isInstallable, install } = usePWAInstall();
  const [guideOpen, setGuideOpen] = useState(false);

  if (!mounted || isInstalled) {
    return null;
  }

  const handleClick = () => {
    if (isIOS) {
      setGuideOpen(true);
    } else if (isInstallable) {
      install();
    } else {
      setGuideOpen(true);
    }
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        onClick={handleClick}
        className="h-9 px-3 gap-1.5 text-xs sm:text-sm font-medium rounded-lg border-primary/30 text-primary hover:bg-primary/10 shadow-xs hidden sm:inline-flex shrink-0 cursor-pointer"
      >
        {isIOS ? <Smartphone className="size-3.5" /> : <Download className="size-3.5" />}
        <span>{isIOS ? "Installa su Home" : "Installa App"}</span>
      </Button>

      <IOSInstallGuideModal open={guideOpen} onOpenChange={setGuideOpen} />
    </>
  );
}
