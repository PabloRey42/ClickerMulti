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
    <div className="screen">
      <div className="dialog-box">
        <h1 className="title">Farm Clicker</h1>
        <div className="tabs">
          <button
            type="button"
            className={`tab ${mode === "login" ? "tab-active" : ""}`}
            onClick={() => setMode("login")}
          >
            Connexion
          </button>
          <button
            type="button"
            className={`tab ${mode === "register" ? "tab-active" : ""}`}
            onClick={() => setMode("register")}
          >
            Créer un compte
          </button>
        </div>

        <form onSubmit={handleSubmit} className="form">
          <label>
            Email
            <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" required />
          </label>
          {mode === "register" && (
            <label>
              Pseudo
              <input value={username} onChange={(e) => setUsername(e.target.value)} minLength={3} required />
            </label>
          )}
          <label>
            Mot de passe
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              minLength={8}
              required
            />
          </label>

          {error && <p className="error-text">{error}</p>}

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "..." : mode === "login" ? "Se connecter" : "Créer mon compte"}
          </button>
        </form>
      </div>
    </div>
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
