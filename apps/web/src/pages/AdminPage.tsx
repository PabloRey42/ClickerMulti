import { useEffect, useState } from "react";
import {
  SPECIES_CATALOG,
  POKEBALL_CATALOG,
  POTION_CATALOG,
  type AdminUserSummary,
  type AdminUserDetail,
} from "@farm-clicker/shared";
import { useAuthStore } from "../state/authStore";
import { ApiError } from "../api/client";
import {
  listAdminUsers,
  getAdminUserDetail,
  setAdminUserGold,
  giveAdminCreature,
  deleteAdminCreature,
  setAdminInventoryItem,
  deleteAdminUser,
} from "../api/admin";

const ALL_SPECIES = Object.values(SPECIES_CATALOG).sort((a, b) => a.dexNumber - b.dexNumber);
const ALL_ITEMS = [...Object.values(POKEBALL_CATALOG), ...Object.values(POTION_CATALOG)];

const inputClass =
  "rounded-lg border-2 border-gold-deep bg-panel px-2 py-1.5 text-xs text-gold-light outline-none focus:border-gold";
const buttonClass =
  "rounded-full border-2 border-gold-light bg-gradient-to-b from-gold-light to-gold-deep px-3 py-1.5 text-xs font-black uppercase text-panel disabled:opacity-50";
const dangerButtonClass =
  "rounded-full border-2 border-stat-hp bg-stat-hp/20 px-3 py-1.5 text-xs font-black uppercase text-stat-hp disabled:opacity-50";

export function AdminPage() {
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [goldInput, setGoldInput] = useState("");
  const [creatureSpecies, setCreatureSpecies] = useState(ALL_SPECIES[0]?.key ?? "");
  const [creatureLevel, setCreatureLevel] = useState("5");
  const [itemQuantities, setItemQuantities] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!accessToken) return;
    refreshUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessToken]);

  async function refreshUsers() {
    if (!accessToken) return;
    try {
      const res = await listAdminUsers(accessToken);
      setUsers(res.users);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    }
  }

  async function selectUser(userId: string) {
    if (!accessToken) return;
    setSelectedId(userId);
    setError(null);
    try {
      const d = await getAdminUserDetail(accessToken, userId);
      setDetail(d);
      setGoldInput(d.goldBalance.toString());
      const quantities: Record<string, string> = {};
      for (const item of ALL_ITEMS) {
        quantities[item.key] = String(d.inventoryItems.find((i) => i.itemKey === item.key)?.quantity ?? 0);
      }
      setItemQuantities(quantities);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) logout();
    }
  }

  async function handleAction<T>(action: () => Promise<T>) {
    if (!accessToken || busy) return;
    setBusy(true);
    setError(null);
    try {
      await action();
      if (selectedId) await selectUser(selectedId);
      await refreshUsers();
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.status === 401) return logout();
        setError("Action impossible.");
      }
    } finally {
      setBusy(false);
    }
  }

  function handleSetGold() {
    if (!selectedId || !/^\d+$/.test(goldInput)) return;
    handleAction(() => setAdminUserGold(accessToken!, selectedId, goldInput));
  }

  function handleGiveCreature() {
    if (!selectedId || !creatureSpecies) return;
    const level = Number(creatureLevel);
    if (!Number.isInteger(level) || level < 1) return;
    handleAction(() => giveAdminCreature(accessToken!, selectedId, creatureSpecies, level));
  }

  function handleDeleteCreature(creatureId: string) {
    if (!selectedId) return;
    handleAction(() => deleteAdminCreature(accessToken!, selectedId, creatureId));
  }

  function handleSetItem(itemKey: string) {
    if (!selectedId) return;
    const quantity = Number(itemQuantities[itemKey]);
    if (!Number.isInteger(quantity) || quantity < 0) return;
    handleAction(() => setAdminInventoryItem(accessToken!, selectedId, itemKey, quantity));
  }

  function handleDeleteUser() {
    if (!selectedId || !detail) return;
    if (!window.confirm(`Supprimer définitivement le compte "${detail.username}" et toutes ses données ?`)) return;
    handleAction(async () => {
      await deleteAdminUser(accessToken!, selectedId);
      setSelectedId(null);
      setDetail(null);
    });
  }

  return (
    <section className="rounded-3xl border-[3px] border-gold bg-gold-deep/25 p-4 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-sm">
      <h1 className="mb-4 text-center text-lg font-black tracking-wide text-gold-light sm:text-xl">
        Panel Admin
      </h1>

      {error && <p className="mb-3 text-center text-xs font-bold text-stat-hp">{error}</p>}

      <div className="flex flex-col gap-4 lg:flex-row">
        <div className="lg:w-80 lg:shrink-0">
          <h2 className="mb-2 text-xs font-black uppercase tracking-widest text-panel-foreground/60">
            Joueurs ({users.length})
          </h2>
          <ul className="flex max-h-[70vh] flex-col gap-1.5 overflow-y-auto">
            {users.map((u) => (
              <li key={u.id}>
                <button
                  type="button"
                  onClick={() => selectUser(u.id)}
                  className={[
                    "w-full rounded-xl border-2 px-3 py-2 text-left transition-colors",
                    selectedId === u.id
                      ? "border-gold-light bg-panel-light"
                      : "border-gold-deep bg-panel hover:bg-panel-light",
                  ].join(" ")}
                >
                  <p className="truncate text-sm font-extrabold text-gold-light">{u.username}</p>
                  <p className="truncate text-[10px] font-semibold text-panel-foreground/60">{u.email}</p>
                  <p className="text-[10px] font-semibold text-panel-foreground/60">
                    {u.goldBalance.toString()} or · {u.creatureCount} Pokémon · Rang {u.leagueRank}
                  </p>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {detail && (
          <div className="flex flex-1 flex-col gap-4">
            <div className="flex items-center justify-between gap-3 rounded-xl border-2 border-gold-deep bg-panel px-3 py-2">
              <div>
                <p className="text-sm font-extrabold text-gold-light">{detail.username}</p>
                <p className="text-[10px] font-semibold text-panel-foreground/60">{detail.email}</p>
              </div>
              <button type="button" disabled={busy} onClick={handleDeleteUser} className={dangerButtonClass}>
                Supprimer le compte
              </button>
            </div>

            <div className="rounded-xl border-2 border-gold-deep bg-panel p-3">
              <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-panel-foreground/60">Or</h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  inputMode="numeric"
                  value={goldInput}
                  onChange={(e) => setGoldInput(e.target.value)}
                  className={`${inputClass} w-32`}
                />
                <button type="button" disabled={busy} onClick={handleSetGold} className={buttonClass}>
                  Fixer
                </button>
                <span className="text-[10px] font-semibold text-panel-foreground/60">
                  Ligue : rang {detail.leagueRank}, {detail.unspentPoints} pt(s) non dépensé(s)
                </span>
              </div>
            </div>

            <div className="rounded-xl border-2 border-gold-deep bg-panel p-3">
              <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-panel-foreground/60">
                Donner un Pokémon
              </h3>
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={creatureSpecies}
                  onChange={(e) => setCreatureSpecies(e.target.value)}
                  className={inputClass}
                >
                  {ALL_SPECIES.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.name}
                    </option>
                  ))}
                </select>
                <input
                  type="number"
                  min="1"
                  max="999"
                  value={creatureLevel}
                  onChange={(e) => setCreatureLevel(e.target.value)}
                  placeholder="Niveau"
                  className={`${inputClass} w-20`}
                />
                <button type="button" disabled={busy} onClick={handleGiveCreature} className={buttonClass}>
                  Donner
                </button>
              </div>

              <ul className="mt-3 flex flex-col gap-1.5">
                {detail.creatures.map((c) => (
                  <li
                    key={c.id}
                    className="flex items-center gap-3 rounded-lg border border-gold-deep/60 bg-panel-light px-2 py-1.5"
                  >
                    <img
                      src={`/sprites/${c.spriteFile}`}
                      alt={c.name}
                      className="h-8 w-8 shrink-0 [image-rendering:pixelated]"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-extrabold text-gold-light">
                        {c.nickname ?? c.name} {c.isActive ? "★" : ""}
                      </p>
                      <p className="text-[10px] font-semibold text-panel-foreground/60">
                        Nv.{c.level} · {c.currentHp}/{c.maxHp} PV · {c.isOnTeam ? "en équipe" : "au repos"}
                      </p>
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleDeleteCreature(c.id)}
                      className="shrink-0 rounded-full border border-stat-hp px-2 py-1 text-[10px] font-black uppercase text-stat-hp disabled:opacity-50"
                    >
                      Suppr.
                    </button>
                  </li>
                ))}
                {detail.creatures.length === 0 && (
                  <p className="text-xs font-semibold text-panel-foreground/60">Aucun Pokémon.</p>
                )}
              </ul>
            </div>

            <div className="rounded-xl border-2 border-gold-deep bg-panel p-3">
              <h3 className="mb-2 text-xs font-black uppercase tracking-widest text-panel-foreground/60">
                Objets (balles &amp; soins)
              </h3>
              <ul className="flex flex-col gap-1.5">
                {ALL_ITEMS.map((item) => (
                  <li key={item.key} className="flex items-center gap-2 rounded-lg border border-gold-deep/60 bg-panel-light px-2 py-1.5">
                    <img src={`/items/${item.spriteFile}`} alt={item.name} className="h-6 w-6 shrink-0 [image-rendering:pixelated]" />
                    <span className="min-w-0 flex-1 truncate text-xs font-bold text-gold-light">{item.name}</span>
                    <input
                      type="number"
                      min="0"
                      value={itemQuantities[item.key] ?? "0"}
                      onChange={(e) => setItemQuantities((prev) => ({ ...prev, [item.key]: e.target.value }))}
                      className={`${inputClass} w-16`}
                    />
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => handleSetItem(item.key)}
                      className={buttonClass}
                    >
                      Fixer
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {!detail && (
          <div className="flex flex-1 items-center justify-center text-sm font-semibold text-panel-foreground/60">
            Sélectionne un joueur à gauche pour le gérer.
          </div>
        )}
      </div>
    </section>
  );
}
