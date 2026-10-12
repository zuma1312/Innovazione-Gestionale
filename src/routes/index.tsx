import { useEffect, useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { Loader2, Lock, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import logo from "@/assets/logo.png";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Accesso — INNOVAZIONE TERMICA | Gestionale idraulico" },
      {
        name: "description",
        content:
          "Gestionale per interventi idraulici e pronto intervento a Roma: clienti, agenda, preventivi, fatture e magazzino.",
      },
      { property: "og:title", content: "INNOVAZIONE TERMICA — Gestionale idraulico" },
      {
        property: "og:description",
        content: "Clienti, agenda, interventi, preventivi, fatture e magazzino in un unico posto.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard", replace: true });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (data.session) {
          navigate({ to: "/dashboard", replace: true });
        } else {
          toast.success("Account creato. Controlla la tua email per confermare l'indirizzo.");
          setMode("login");
        }
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Accesso non riuscito";
      toast.error(message.includes("Invalid login") ? "Email o password non corretti." : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <div className="relative hidden flex-1 bg-brand p-12 text-primary-foreground lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-3">
          <img src={logo} alt="" width={48} height={48} className="size-12" />
          <div>
            <p className="text-xl font-bold tracking-wide">INNOVAZIONE TERMICA</p>
            <p className="text-sm opacity-80">Idraulica e pronto intervento · Roma</p>
          </div>
        </div>
        <div className="max-w-md space-y-4">
          <h2 className="text-4xl font-bold leading-tight">
            Il tuo lavoro, organizzato dal primo squillo alla fattura.
          </h2>
          <p className="opacity-85">
            Clienti, agenda appuntamenti, interventi, preventivi, fatture e magazzino con PDF pronti
            da stampare e inviare.
          </p>
        </div>
        <p className="text-xs opacity-70">© {new Date().getFullYear()} Innovazione Termica</p>
      </div>

      <div className="flex flex-1 items-center justify-center bg-brand-soft p-6">
        <div className="w-full max-w-md card-surface p-8">
          <div className="mb-6 flex flex-col items-center text-center lg:hidden">
            <img src={logo} alt="" width={64} height={64} className="size-16" />
            <p className="mt-3 text-lg font-bold">INNOVAZIONE TERMICA</p>
          </div>
          <h1 className="text-center text-2xl font-bold">
            {mode === "login" ? "Accedi al gestionale" : "Crea il tuo accesso"}
          </h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            Inserisci email e password per continuare.
          </p>

          <form onSubmit={submit} className="mt-6 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  required
                  className="pl-9"
                  placeholder="nome@innovazionetermica.it"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type="password"
                  required
                  minLength={6}
                  className="pl-9"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <Loader2 className="mr-2 size-4 animate-spin" /> : null}
              {mode === "login" ? "Accedi" : "Registrati"}
            </Button>

            <div className="relative my-3">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">oppure</span>
              </div>
            </div>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={async () => {
                setLoading(true);
                try {
                  await supabase.auth.signInWithPassword({
                    email: "maurizio.tanforti@gmail.com",
                    password: "demo-password-2025",
                  });
                  navigate({ to: "/dashboard", replace: true });
                } catch {
                  toast.error("Accesso demo non riuscito.");
                } finally {
                  setLoading(false);
                }
              }}
              disabled={loading}
            >
              Accesso Rapido Demo (Maurizio Tanforti)
            </Button>
          </form>

          <button
            type="button"
            className="mt-5 w-full text-sm text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
          >
            {mode === "login"
              ? "Non hai ancora un accesso? Registrati"
              : "Hai già un account? Accedi"}
          </button>
        </div>
      </div>
    </div>
  );
}
