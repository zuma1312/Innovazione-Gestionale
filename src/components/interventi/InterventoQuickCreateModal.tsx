import { useState, useEffect } from "react";
import { Calendar, Clock, FileText, MapPin, Sparkles, User, Wrench } from "lucide-react";
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

export type InterventoQuickInitialData = {
  client_id: string;
  title: string;
  cantiere?: string;
  date: string;
  technician?: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clients: ClientOption[];
  company: CompanyInfo;
  onConfirm: (data: InterventoQuickInitialData) => void;
};

export function InterventoQuickCreateModal({
  open,
  onOpenChange,
  clients,
  company,
  onConfirm,
}: Props) {
  const todayStr = new Date().toISOString().slice(0, 10);

  const [clientId, setClientId] = useState<string>("");
  const [title, setTitle] = useState<string>("");
  const [cantiere, setCantiere] = useState<string>("");
  const [date, setDate] = useState<string>(todayStr);
  const [technician, setTechnician] = useState<string>("Maurizio Tanforti");

  useEffect(() => {
    if (open) {
      setClientId(clients[0]?.id ?? "");
      setTitle("");
      setCantiere("");
      setDate(new Date().toISOString().slice(0, 10));
      setTechnician("Maurizio Tanforti");
    }
  }, [open, clients]);

  const selectedClient = clients.find((c) => c.id === clientId);

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
      toast.error("Seleziona un cliente per creare l'intervento");
      return;
    }

    onConfirm({
      client_id: clientId,
      title: title.trim(),
      cantiere: cantiere.trim() || undefined,
      date,
      technician: technician.trim() || undefined,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg p-0 overflow-hidden rounded-2xl border border-border shadow-2xl bg-card">
        {/* Header compatto */}
        <div className="bg-primary/5 border-b border-border/80 px-5 py-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary text-primary-foreground shadow-xs">
              <Wrench className="size-5" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                Nuovo Rapporto di Intervento
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Inserisci i dati essenziali. Potrai compilare manodopera, ricambi e dettagli tecnici
                direttamente nella sezione interventi.
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

          {/* 2. Oggetto / Titolo intervento */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <FileText className="size-3.5 text-primary" /> Oggetto / Descrizione sintetica
            </Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Es. Sostituzione vaso espansione, perdita collettore, collaudo caldaia..."
              className="h-10 text-sm bg-background border-border"
              autoFocus
            />
            <p className="text-[11px] text-muted-foreground">
              Sintesi dell'anomalia o del lavoro da eseguire.
            </p>
          </div>

          {/* 3. Cantiere / Luogo esecuzione */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <MapPin className="size-3.5 text-primary" /> Cantiere / Luogo di esecuzione
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
              placeholder="Es. Via Garibaldi 12, piano 3 interno 8..."
              className="h-10 text-sm bg-background border-border"
            />
          </div>

          {/* 4. Data e Tecnico */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Calendar className="size-3.5 text-primary" /> Data intervento
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 text-xs sm:text-sm bg-background border-border"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                <Wrench className="size-3.5 text-primary" /> Tecnico incaricato
              </Label>
              <Input
                value={technician}
                onChange={(e) => setTechnician(e.target.value)}
                placeholder="Es. Maurizio Tanforti..."
                className="h-9 text-xs sm:text-sm bg-background border-border"
              />
            </div>
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
              <span>Crea ed entra in compilazione</span>
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
