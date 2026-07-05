import { FormEvent, useState } from "react";
import { login, register } from "../api/auth";
import { ApiError } from "../api/client";
import { useAuthStore } from "../state/authStore";

export function LoginPage() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const setSession = useAuthStore((s) => s.setSession);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const auth =
        mode === "login" ? await login(email, password) : await register(email, username, password);
      setSession(auth);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(errorMessage(err));
      } else {
        setError("Une erreur est survenue.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main
      className="relative flex min-h-screen w-full items-center justify-center bg-cover bg-center bg-no-repeat p-4"
      style={{ backgroundImage: "url('/images/city-night.png')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-panel/50 via-panel/20 to-panel/70" />

      <div className="relative w-full max-w-sm rounded-3xl border-[3px] border-gold bg-gold-deep/30 p-6 shadow-[0_10px_40px_rgba(0,0,0,0.6)] backdrop-blur-sm">
        <h1 className="mb-4 text-center text-2xl font-black tracking-wide text-gold-light">Farm Clicker</h1>

        <div className="mb-4 flex gap-2">
          <button
            type="button"
            onClick={() => setMode("login")}
            className={[
              "flex-1 rounded-full border-2 px-3 py-2 text-xs font-extrabold uppercase tracking-wide transition-all",
              mode === "login"
                ? "border-gold-deep bg-gradient-to-b from-gold-light to-gold-deep text-panel"
                : "border-gold-deep/70 bg-panel/80 text-gold-light hover:bg-panel-light",
            ].join(" ")}
          >
            Connexion
          </button>
          <button
            type="button"
            onClick={() => setMode("register")}
            className={[
              "flex-1 rounded-full border-2 px-3 py-2 text-xs font-extrabold uppercase tracking-wide transition-all",
              mode === "register"
                ? "border-gold-deep bg-gradient-to-b from-gold-light to-gold-deep text-panel"
                : "border-gold-deep/70 bg-panel/80 text-gold-light hover:bg-panel-light",
            ].join(" ")}
          >
            Créer un compte
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-xs font-bold text-panel-foreground/80">
            Email
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              required
              className="rounded-lg border-2 border-gold-deep bg-panel px-3 py-2 text-sm text-gold-light outline-none focus:border-gold"
            />
          </label>
          {mode === "register" && (
            <label className="flex flex-col gap-1 text-xs font-bold text-panel-foreground/80">
              Pseudo
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                minLength={3}
                required
                className="rounded-lg border-2 border-gold-deep bg-panel px-3 py-2 text-sm text-gold-light outline-none focus:border-gold"
              />
            </label>
          )}
          <label className="flex flex-col gap-1 text-xs font-bold text-panel-foreground/80">
            Mot de passe
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              minLength={8}
              required
              className="rounded-lg border-2 border-gold-deep bg-panel px-3 py-2 text-sm text-gold-light outline-none focus:border-gold"
            />
          </label>

          {error && <p className="text-center text-xs font-bold text-stat-hp">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="mt-1 rounded-full border-2 border-gold-light bg-gradient-to-b from-gold-light to-gold-deep px-4 py-2.5 text-sm font-black uppercase tracking-wide text-panel shadow-[0_4px_0_var(--gold-deep)] transition-all active:translate-y-1 active:shadow-none disabled:opacity-60"
          >
            {loading ? "..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>
      </div>
    </main>
  );
}

function errorMessage(err: ApiError): string {
  const body = err.body as { error?: string } | undefined;
  switch (body?.error) {
    case "invalid_credentials":
      return "Email ou mot de passe incorrect.";
    case "email_or_username_taken":
      return "Cet email ou pseudo est déjà utilisé.";
    case "invalid_body":
      return "Formulaire invalide.";
    default:
      return "Une erreur est survenue.";
  }
}
