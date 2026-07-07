import { useEffect, useState } from "react";
import type { PlayerStatsResponse } from "@farm-clicker/shared";
import { useAuthStore } from "../state/authStore";
import { getPlayerStats } from "../api/stats";
import { ApiError } from "../api/client";

const STAT_TILES: { key: keyof PlayerStatsResponse; label: string; icon: string }[] = [
  { key: "totalClicks", label: "Clics totaux", icon: "🖱️" },
  { key: "totalPokemonDefeated", label: "Pokémon vaincus", icon: "⚔️" },
  { key: "totalCaptures", label: "Captures réussies", icon: "🎯" },
  { key: "totalShinyCaptures", label: "Shiny capturés", icon: "✨" },
  { key: "totalGoldEarned", label: "Or total gagné", icon: "💰" },
  { key: "totalXpEarned", label: "XP totale gagnée", icon: "🌟" },
  { key: "creaturesOwned", label: "Pokémon possédés", icon: "📖" },
  { key: "leagueRank", label: "Rang de Ligue", icon: "🏆" },
  { key: "questsCompleted", label: "Quêtes complétées", icon: "📜" },
];

export function StatsPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const [stats, setStats] = useState<PlayerStatsResponse | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    getPlayerStats(accessToken)
      .then(setStats)
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) logout();
      });
  }, [accessToken, logout]);

  return (
    <section className="rounded-3xl border-[3px] border-gold bg-gold-deep/25 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-sm">
      <h1 className="mb-4 text-center text-lg font-black tracking-wide text-gold-light sm:text-xl">Statistiques</h1>

      {!stats ? (
        <p className="text-center text-sm font-semibold text-panel-foreground/70">Chargement...</p>
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {STAT_TILES.map((tile) => (
            <div
              key={tile.key}
              className="flex flex-col items-center gap-1 rounded-2xl border-2 border-gold-deep bg-panel px-3 py-4 text-center"
            >
              <span className="text-2xl">{tile.icon}</span>
              <span className="text-xl font-black text-gold-light">{stats[tile.key].toString()}</span>
              <span className="text-[10px] font-bold uppercase tracking-wide text-panel-foreground/60">
                {tile.label}
              </span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
