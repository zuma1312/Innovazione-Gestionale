import { useState, useEffect } from "react";
import { Building2, MapPin, Phone, Sparkles, User, Users } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export type ClienteQuickInitialData = {
  name: string;
  client_type: "privato" | "azienda";
  phone: string;
  city: string;
  address?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (data: ClienteQuickInitialData) => void;
};

export function ClienteQuickCreateModal({ open, onOpenChange, onConfirm }: Props) {
  const [name, setName] = useState("");
  const [clientType, setClientType] = useState<"privato" | "azienda">("privato");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("Roma");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (open) {
      setName("");
      setClientType("privato");
      setPhone("");
      setCity("Roma");
      setAddress("");
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Inserisci il nome o la ragione sociale del cliente");
      return;
    }

    onConfirm({
      name: name.trim(),
      client_type: clientType,
      phone: phone.trim(),
      city: city.trim(),
      address: address.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border border-border shadow-2xl bg-card">
        {/* Header compatto */}
        <div className="bg-primary/5 border-b border-border/80 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Users className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                Nuovo Cliente
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Inserisci i dati essenziali. Potrai completare recapiti, condizioni e note tecniche
                direttamente nella sezione clienti.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Form con poche informazioni essenziali */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* 1. Tipo cliente */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground">Tipologia cliente</Label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setClientType("privato")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  clientType === "privato"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-background text-muted-foreground border-border hover:bg-muted/50"
                }`}
              >
                <User className="size-3.5" />
                <span>Privato</span>
              </button>

              <button
                type="button"
                onClick={() => setClientType("azienda")}
                className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                  clientType === "azienda"
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : "bg-background text-muted-foreground border-border hover:bg-muted/50"
                }`}
              >
                <Building2 className="size-3.5" />
                <span>Azienda / Ditta</span>
              </button>
            </div>
          </div>

          {/* 2. Nome / Ragione Sociale */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              {clientType === "privato" ? (
                <>
                  <User className="size-3.5 text-primary" /> Nome e Cognome *
                </>
              ) : (
                <>
                  <Building2 className="size-3.5 text-primary" /> Ragione Sociale *
                </>
              )}
            </Label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={
                clientType === "privato"
                  ? "Es. Mario Rossi, Ing. Marco Bianchi..."
                  : "Es. Termo Service S.r.l., Rossi Costruzioni..."
              }
              className="h-10 text-sm bg-background border-border font-medium"
              autoFocus
            />
          </div>

          {/* 3. Telefono e Città */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Phone className="size-3.5 text-primary" /> Telefono principale
              </Label>
              <Input
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Es. 333 1234567..."
                className="h-9 text-xs sm:text-sm bg-background border-border"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary" /> Città
              </Label>
              <Input
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Es. Roma, Milano..."
                className="h-9 text-xs sm:text-sm bg-background border-border"
              />
            </div>
          </div>

          {/* 4. Indirizzo (Opzionale) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <MapPin className="size-3.5 text-muted-foreground" /> Indirizzo (opzionale)
            </Label>
            <Input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Es. Via Appia Nuova 120, interno 4..."
              className="h-9 text-xs sm:text-sm bg-background border-border"
            />
          </div>

          {/* Footer compatto */}
          <div className="pt-3 border-t border-border/80 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              Annulla
            </Button>
            <Button
              type="submit"
              size="sm"
              className="bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium px-4 h-9 shadow-xs gap-1.5"
            >
              <Sparkles className="size-3.5" />
              <span>Crea ed entra in anagrafica</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
