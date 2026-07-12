import { useEffect, useState } from "react";
import type { RaidLobbySummary } from "@farm-clicker/shared";
import { useAuthStore } from "../state/authStore";
import { listRaidLobbies, createRaidLobby, joinRaidLobby } from "../api/raid";
import { ApiError } from "../api/client";

const ERROR_MESSAGES: Record<string, string> = {
  raid_already_in_active_lobby: "Tu es déjà dans un raid en cours.",
  raid_lobby_full: "Ce groupe est complet.",
  raid_lobby_not_joinable: "Ce raid a déjà démarré ou expiré.",
  raid_hotspot_not_found: "Ce raid n'existe pas.",
};

export function RaidBrowserPage({
  hotspotId,
  onEnterLobby,
  onBack,
}: {
  hotspotId: string;
  onEnterLobby: (lobbyId: string) => void;
  onBack: () => void;
}) {
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const [lobbies, setLobbies] = useState<RaidLobbySummary[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken, hotspotId]);

  async function refresh() {
    if (!accessToken) return;
    try {
      setLobbies(await listRaidLobbies(accessToken, hotspotId));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    }
  }

  async function handleCreate() {
    if (!accessToken || busy) return;
    setBusy(true);
    setError(null);
    try {
      const lobby = await createRaidLobby(accessToken, hotspotId);
      onEnterLobby(lobby.id);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) return logout();
        const body = err.body as { error?: string } | undefined;
        setError((body?.error && ERROR_MESSAGES[body.error]) ?? "Impossible de créer un raid.");
      }
    } finally {
      setBusy(false);
    }
  }

  async function handleJoin(lobbyId: string) {
    if (!accessToken || busy) return;
    setBusy(true);
    setError(null);
    try {
      await joinRaidLobby(accessToken, lobbyId);
      onEnterLobby(lobbyId);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) return logout();
        const body = err.body as { error?: string } | undefined;
        setError((body?.error && ERROR_MESSAGES[body.error]) ?? "Impossible de rejoindre ce raid.");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="rounded-3xl border-[3px] border-gold bg-gold-deep/25 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-sm">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="text-lg font-black tracking-wide text-gold-light">Groupes de raid</h1>
        <button
          type="button"
          onClick={onBack}
          className="text-xs font-bold text-panel-foreground/70 underline-offset-2 hover:text-gold-light hover:underline"
        >
          Retour
        </button>
      </div>

      <p className="mb-3 text-center text-xs font-semibold text-panel-foreground/70">
        Il faut au moins 2 dresseurs pour lancer le combat. Rejoins un groupe ou crée le tien.
      </p>

      {error && <p className="mb-2 text-center text-xs font-bold text-stat-hp">{error}</p>}

      <button
        type="button"
        disabled={busy}
        onClick={handleCreate}
        className="mb-4 w-full rounded-full border-2 border-stat-pp bg-gradient-to-b from-stat-pp to-gold px-4 py-2.5 text-sm font-black uppercase tracking-wide text-panel shadow-[0_4px_0_var(--gold-deep)] transition-all active:translate-y-1 active:shadow-none disabled:opacity-60"
      >
        {busy ? "..." : "Créer un raid"}
      </button>

      <ul className="flex flex-col gap-2">
        {lobbies.map((lobby) => (
          <li
            key={lobby.id}
            className="flex items-center justify-between gap-3 rounded-xl border-2 border-gold-deep bg-panel px-3 py-2"
          >
            <div>
              <p className="text-sm font-extrabold text-gold-light">Groupe de {lobby.creatorUsername}</p>
              <p className="text-[10px] font-semibold text-panel-foreground/60">
                {lobby.participantCount}/{lobby.minParticipants}+ dresseurs
              </p>
            </div>
            <button
              type="button"
              disabled={busy}
              onClick={() => handleJoin(lobby.id)}
              className="shrink-0 rounded-full border-2 border-gold-light bg-gradient-to-b from-gold-light to-gold-deep px-3 py-1.5 text-xs font-black uppercase text-panel disabled:opacity-60"
            >
              Rejoindre
            </button>
          </li>
        ))}
        {lobbies.length === 0 && (
          <p className="text-center text-xs font-semibold text-panel-foreground/60">
            Aucun groupe ouvert pour l'instant. Sois le premier à en créer un !
          </p>
        )}
      </ul>
    </section>
  );
}
