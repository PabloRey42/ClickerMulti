import { useEffect } from "react";
import type { PlayerCreatureView } from "@farm-clicker/shared";
import { useAuthStore } from "../state/authStore";
import { useTeamStore } from "../state/teamStore";

function TeamCard({ member }: { member: PlayerCreatureView }) {
  return (
    <li
      className={`flex items-center gap-2.5 rounded-xl border-2 bg-panel px-2.5 py-2 shadow-md ${
        member.isActive ? "border-gold" : "border-gold-deep"
      }`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gold-deep/60 bg-panel-light">
        <img src={`/sprites/${member.spriteFile}`} alt={member.name} className="h-9 w-9 [image-rendering:pixelated]" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-1">
          <span className="truncate text-xs font-extrabold text-gold-light">
            {member.nickname ?? member.name} {member.isActive ? "★" : ""}
          </span>
          <span className="shrink-0 text-[10px] font-bold text-panel-foreground/60">Niv. {member.level}</span>
        </div>
        <div className="mt-1 flex flex-col gap-0.5">
          <div className="h-1.5 overflow-hidden rounded-full bg-bar-track">
            <div
              className="h-full rounded-full bg-stat-hp transition-all"
              style={{ width: `${Math.max(0, Math.min(100, (member.currentHp / member.maxHp) * 100))}%` }}
            />
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-bar-track">
            <div
              className="h-full rounded-full bg-stat-xp transition-all"
              style={{ width: `${Math.max(0, Math.min(100, (member.xp / member.xpToNextLevel) * 100))}%` }}
            />
          </div>
        </div>
      </div>
    </li>
  );
}

export function TeamSidebar() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const creatures = useTeamStore((s) => s.creatures);
  const refresh = useTeamStore((s) => s.refresh);

  useEffect(() => {
    if (!accessToken) return;
    refresh(accessToken);
  }, [accessToken, refresh]);

  const team = creatures.filter((c) => c.isOnTeam);

  return (
    <aside className="w-full rounded-3xl border-[3px] border-gold bg-gold-deep/30 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-sm">
      <h2 className="mb-3 text-center text-sm font-black uppercase tracking-widest text-gold-light">Ton équipe</h2>

      {team.length === 0 && (
        <p className="text-center text-xs font-bold text-panel-foreground/60">Aucun Pokémon dans l'équipe.</p>
      )}

      <ul className="flex flex-col gap-2">
        {team.map((c) => (
          <TeamCard key={c.id} member={c} />
        ))}
      </ul>
    </aside>
  );
}
