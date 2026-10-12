import { useState, useEffect } from "react";
import { Calendar, Clock, FileText, MapPin, Plus, Sparkles, User, X } from "lucide-react";
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
import type { ClientOption } from "@/components/DocumentEditor";
import type { CompanyInfo } from "@/lib/doc";

export type QuoteQuickInitialData = {
  client_id: string;
  title: string;
  cantiere?: string;
  date: string;
  valid_until: string | null;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientOption[];
  company: CompanyInfo & {
    quote_validity_days?: number;
  };
  onConfirm: (data: QuoteQuickInitialData) => void;
};

export function QuoteQuickCreateModal({ open, onOpenChange, clients, company, onConfirm }: Props) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const defaultValidityDays = Number(company.quote_validity_days || 30);

  const calcDefaultValidUntil = (days: number) => {
    const d = new Date();
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  };

  const [clientId, setClientId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [cantiere, setCantiere] = useState<string>("");
  const [date, setDate] = useState<string>(todayStr);
  const [validUntil, setValidUntil] = useState<string | null>(
    calcDefaultValidUntil(defaultValidityDays),
  );

  // Reset when opened
  useEffect(() => {
    if (open) {
      setClientId(clients[0]?.id ?? "");
      setTitle("");
      setCantiere("");
      setDate(new Date().toISOString().slice(0, 10));
      setValidUntil(calcDefaultValidUntil(defaultValidityDays));
    }
  }, [open, clients, defaultValidityDays]);

  const selectedClient = clients.find((c) => c.id === clientId);

  const handleApplyDays = (days: number) => {
    const base = date ? new Date(date) : new Date();
    base.setDate(base.getDate() + days);
    setValidUntil(base.toISOString().slice(0, 10));
  };

  const handleUseClientAddress = () => {
    if (!selectedClient) return;
    const addr = [selectedClient.address, selectedClient.city].filter(Boolean).join(", ");
    if (addr) {
      setCantiere(addr);
      toast.info("Indirizzo del cliente impostato come cantiere");
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      toast.error("Seleziona un cliente per creare il preventivo");
      return;
    }

    onConfirm({
      client_id: clientId,
      title: title.trim(),
      cantiere: cantiere.trim() || undefined,
      date,
      valid_until: validUntil,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border border-border shadow-2xl bg-card">
        {/* Header compatto */}
        <div className="bg-primary/5 border-b border-border/80 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-xs">
              <FileText className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                Nuovo Preventivo
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Inserisci i dati essenziali. Potrai compilare articoli, prezzi e note direttamente
                nella sezione preventivi.
              </DialogDescription>
            </div>
          </div>
        </div>

        {/* Form con poche informazioni essenziali */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* 1. Cliente */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <User className="size-3.5 text-primary" /> Cliente intestatario *
              </span>
              {selectedClient?.city ? (
                <span className="text-[11px] font-normal text-muted-foreground">
                  {selectedClient.city}
                </span>
              ) : null}
            </Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger className="h-10 text-sm bg-background border-border">
                <SelectValue placeholder="Seleziona un cliente..." />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id} className="text-xs sm:text-sm">
                    <span className="font-medium text-foreground">{c.name}</span>
                    {c.city ? (
                      <span className="text-muted-foreground ml-1.5">({c.city})</span>
                    ) : null}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 2. Oggetto / Titolo preventivo */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <FileText className="size-3.5 text-primary" /> Oggetto / Descrizione sintetica
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Es. Sostituzione caldaia a condensazione, Impianto termico..."
              className="h-10 text-sm bg-background border-border"
              autoFocus
            />
          </div>

          {/* 3. Cantiere / Luogo intervento */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary" /> Cantiere / Luogo lavori{" "}
                <span className="text-[11px] font-normal text-muted-foreground">(opzionale)</span>
              </Label>
              {selectedClient?.address ? (
                <button
                  type="button"
                  onClick={handleUseClientAddress}
                  className="text-[11px] text-primary hover:underline font-medium cursor-pointer"
                >
                  Usa indirizzo cliente
                </button>
              ) : null}
            </div>
            <Input
              value={cantiere}
              onChange={(e) => setCantiere(e.target.value)}
              placeholder="Es. Via Roma 15, Milano..."
              className="h-10 text-sm bg-background border-border"
            />
          </div>

          {/* 4. Date: Emissione e Validità */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-primary" /> Data preventivo
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 text-xs sm:text-sm bg-background border-border"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Clock className="size-3.5 text-primary" /> Validità offerta
                </Label>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => handleApplyDays(15)}
                    className="px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    15gg
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyDays(30)}
                    className="px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    30gg
                  </button>
                  <button
                    type="button"
                    onClick={() => handleApplyDays(60)}
                    className="px-1.5 py-0.5 rounded bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground cursor-pointer"
                  >
                    60gg
                  </button>
                </div>
              </div>
              <Input
                type="date"
                value={validUntil ?? ""}
                onChange={(e) => setValidUntil(e.target.value || null)}
                className="h-9 text-xs sm:text-sm bg-background border-border"
              />
            </div>
          </div>

          {/* Footer Bottoni */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-border mt-5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 text-xs sm:text-sm"
            >
              Annulla
            </Button>
            <Button
              type="submit"
              size="sm"
              className="h-9 text-xs sm:text-sm bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 gap-1.5 shadow-xs"
            >
              <Plus className="size-4" />
              Crea e compila preventivo
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
