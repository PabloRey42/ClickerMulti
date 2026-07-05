import { useEffect } from "react";
import { useAuthStore } from "../state/authStore";
import { useTeamStore } from "../state/teamStore";

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
    <div className="dialog-box team-sidebar">
      <h2 className="title team-sidebar-title">Ton équipe</h2>

      {team.length === 0 && <p className="team-empty">Aucun Pokémon dans l'équipe.</p>}

      <ul className="team-list">
        {team.map((c) => (
          <li key={c.id} className={`team-card ${c.isActive ? "team-card-active" : ""}`}>
            <img src={`/sprites/${c.spriteFile}`} alt={c.name} className="team-sprite" />
            <div className="team-card-info">
              <span className="team-card-name">
                {c.nickname ?? c.name} {c.isActive ? "★" : ""}
              </span>
              <span className="team-card-level">Nv. {c.level}</span>

              <div className="hp-bar">
                <div
                  className="hp-bar-fill hp-bar-fill-player"
                  style={{ width: `${Math.max(0, (c.currentHp / c.maxHp) * 100)}%` }}
                />
              </div>
              <span className="hp-label">
                {c.currentHp}/{c.maxHp} PV
              </span>

              <div className="xp-bar">
                <div
                  className="xp-bar-fill"
                  style={{ width: `${(c.xp / c.xpToNextLevel) * 100}%` }}
                />
              </div>
              <span className="xp-label">
                {c.xp}/{c.xpToNextLevel} XP
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
