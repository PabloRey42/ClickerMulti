import { useEffect, useState } from "react";
import type { PlayerCreatureView } from "@farm-clicker/shared";
import { useAuthStore } from "../state/authStore";
import { useTeamStore } from "../state/teamStore";
import { TYPE_LABEL, typeIconSrc, creatureSpriteSrc, creatureSpriteTransform } from "../theme/typeColors";

function moveItem<T>(items: T[], fromIndex: number, toIndex: number): T[] {
  const next = [...items];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
}

function TeamCard({
  member,
  isDragging,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: {
  member: PlayerCreatureView;
  isDragging: boolean;
  onDragStart: () => void;
  onDragEnter: () => void;
  onDragEnd: () => void;
}) {
  return (
    <li
      draggable
      onDragStart={(e) => {
        // Firefox refuses to start a drag at all unless dataTransfer carries data.
        e.dataTransfer.setData("text/plain", member.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart();
      }}
      onDragEnter={onDragEnter}
      onDragOver={(e) => e.preventDefault()}
      onDragEnd={onDragEnd}
      className={`flex cursor-grab items-center gap-2.5 rounded-xl border-2 bg-panel px-2.5 py-2 shadow-md transition-opacity active:cursor-grabbing ${
        member.isActive ? "border-gold" : "border-gold-deep"
      } ${isDragging ? "opacity-40" : ""}`}
    >
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border border-gold-deep/60 bg-panel-light">
        <img
          src={creatureSpriteSrc(member.spriteFile, member.isShiny)}
          alt={member.name}
          style={{ transform: creatureSpriteTransform(member.spriteFile) }}
          className={`h-11 w-11 object-contain [image-rendering:pixelated] ${member.isShiny ? "shiny-sprite" : ""}`}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-1">
          <span className="flex min-w-0 items-center gap-1 truncate text-xs font-extrabold text-gold-light">
            <span className="truncate">
              {member.isShiny ? "✨ " : ""}
              {member.nickname ?? member.name} {member.isActive ? "★" : ""}
            </span>
            {member.types.map((type) => (
              <img key={type} src={typeIconSrc(type)} alt={TYPE_LABEL[type]} title={TYPE_LABEL[type]} className="h-4 w-4 shrink-0" />
            ))}
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
  const reorderTeam = useTeamStore((s) => s.reorderTeam);

  useEffect(() => {
    if (!accessToken) return;
    refresh(accessToken);
  }, [accessToken, refresh]);

  const team = creatures.filter((c) => c.isOnTeam);

  // Only non-null mid-drag — a locally reordered snapshot of team ids, rendered instead of
  // `team` so the list visibly moves under the pointer before the server confirms anything.
  const [dragOrder, setDragOrder] = useState<string[] | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const byId = new Map(team.map((c) => [c.id, c]));
  const displayTeam = dragOrder
    ? dragOrder.map((id) => byId.get(id)).filter((c): c is PlayerCreatureView => c !== undefined)
    : team;

  function handleDragStart(id: string) {
    setDraggingId(id);
    setDragOrder(team.map((c) => c.id));
  }

  function handleDragEnter(overId: string) {
    setDragOrder((current) => {
      if (!current || !draggingId || draggingId === overId) return current;
      const fromIndex = current.indexOf(draggingId);
      const toIndex = current.indexOf(overId);
      if (fromIndex === -1 || toIndex === -1) return current;
      return moveItem(current, fromIndex, toIndex);
    });
  }

  function handleDragEnd() {
    setDraggingId(null);
    setDragOrder(null);
    if (dragOrder && accessToken) reorderTeam(accessToken, dragOrder);
  }

  return (
    <aside className="w-full rounded-3xl border-[3px] border-gold bg-gold-deep/30 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-sm">
      <h2 className="mb-3 text-center text-sm font-black uppercase tracking-widest text-gold-light">Ton équipe</h2>

      {team.length === 0 && (
        <p className="text-center text-xs font-bold text-panel-foreground/60">Aucun Pokémon dans l'équipe.</p>
      )}
      {team.length > 1 && (
        <p className="mb-2 text-center text-[10px] font-bold text-panel-foreground/50">
          Glisse pour réordonner — le premier est ton Pokémon actif.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {displayTeam.map((c) => (
          <TeamCard
            key={c.id}
            member={c}
            isDragging={draggingId === c.id}
            onDragStart={() => handleDragStart(c.id)}
            onDragEnter={() => handleDragEnter(c.id)}
            onDragEnd={handleDragEnd}
          />
        ))}
      </ul>
    </aside>
  );
}
