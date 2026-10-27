import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Share, PlusSquare, CheckCircle2, Smartphone, Sparkles } from "lucide-react";
import logo from "@/assets/logo.png";

interface IOSInstallGuideModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function IOSInstallGuideModal({ open, onOpenChange }: IOSInstallGuideModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-5 sm:p-6 overflow-y-auto">
        <DialogHeader className="text-left space-y-2">
          <div className="flex items-center gap-3">
            <div className="size-12 shrink-0 rounded-xl bg-primary/10 border border-primary/20 p-1 flex items-center justify-center overflow-hidden shadow-xs">
              <img src={logo} alt="ArtigianoSmart" className="size-10 object-contain rounded-lg" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold text-foreground">
                Installa su iPhone o iPad
              </DialogTitle>
              <p className="text-xs text-muted-foreground font-medium">
                Visualizzazione Standalone (schermo intero)
              </p>
            </div>
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            Salva il sito sulla schermata Home del tuo dispositivo iOS per usarlo come una vera e
            propria app nativa, senza la barra degli indirizzi né comandi del browser.
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3.5">
          {/* Step 1 */}
          <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-muted/20 p-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold text-xs">
              1
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground">
                  Tocca il pulsante Condividi
                </span>
                <Share className="size-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Nella barra dei menu di Safari (in basso su iPhone, in alto su iPad), tocca l'icona
                del quadrato con la freccia verso l'alto.
              </p>
            </div>
          </div>

          {/* Step 2 */}
          <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-muted/20 p-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary font-bold text-xs">
              2
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground">
                  Aggiungi alla schermata Home
                </span>
                <PlusSquare className="size-3.5 text-primary shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                Scorri l'elenco delle opzioni verso il basso e tocca la voce{" "}
                <strong>"Aggiungi alla schermata Home"</strong>.
              </p>
            </div>
          </div>

          {/* Step 3 */}
          <div className="flex items-start gap-3 rounded-xl border border-border/80 bg-muted/20 p-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              3
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-semibold text-foreground">
                  Conferma toccando "Aggiungi"
                </span>
                <CheckCircle2 className="size-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              </div>
              <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                In alto a destra tocca <strong>"Aggiungi"</strong>. L'icona dell'app apparirà tra le
                tue app sulla Home di iOS.
              </p>
            </div>
          </div>
        </div>

        {/* Tip Box */}
        <div className="mt-4 rounded-xl border border-primary/20 bg-primary/5 p-3 flex items-start gap-2.5 text-xs text-foreground/90">
          <Sparkles className="size-4 text-primary shrink-0 mt-0.5" />
          <p className="leading-relaxed">
            <strong>Vantaggio modalità Standalone:</strong> all'apertura dalla Home, Safari
            rimuoverà tutte le barre di navigazione, regalandoti un'interfaccia a schermo intero
            identica a un'applicazione nativa dell'App Store!
          </p>
        </div>

        <div className="mt-5 flex justify-end">
          <Button
            type="button"
            onClick={() => onOpenChange(false)}
            className="w-full sm:w-auto bg-primary text-primary-foreground font-medium rounded-lg"
          >
            Ho capito
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
