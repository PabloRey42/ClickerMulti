import { useEffect, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { Compass, LayoutGrid, ShieldAlert, BarChart3 } from "lucide-react";
import { useAuthStore } from "./state/authStore";
import { useExplorationStore } from "./state/explorationStore";
import { LoginPage } from "./pages/LoginPage";
import { WorldMapPage } from "./pages/WorldMapPage";
import { CityMapPage } from "./pages/CityMapPage";
import { LeaguePage } from "./pages/LeaguePage";
import { EncounterPage } from "./pages/EncounterPage";
import { CollectionPage } from "./pages/CollectionPage";
import { StatsPage } from "./pages/StatsPage";
import { StarterSelectPage } from "./pages/StarterSelectPage";
import { AdminPage } from "./pages/AdminPage";
import { TeamSidebar } from "./components/TeamSidebar";
import { RouteEncounterSidebar } from "./components/RouteEncounterSidebar";
import { ActiveQuestTracker } from "./components/ActiveQuestTracker";
import { InventoryPanel } from "./components/InventoryPanel";
import { EvolutionAnimation } from "./components/EvolutionAnimation";
import { listCreatures } from "./api/creatures";
import { ApiError } from "./api/client";
import { useEvolutionStore } from "./state/evolutionStore";

const ADMIN_EMAIL = "admin@admin.com";

type Section = "explore" | "collection" | "stats" | "admin";

function NavTab({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={[
        "group relative flex h-11 flex-1 items-center justify-center gap-2 rounded-full border-2 px-4 text-[11px] font-extrabold uppercase tracking-widest transition-all sm:text-xs",
        active
          ? "border-gold-deep bg-gradient-to-b from-gold-light to-gold-deep text-panel shadow-[0_0_16px_var(--gold)]"
          : "border-gold-deep/70 bg-panel/80 text-gold-light hover:border-gold hover:bg-panel-light",
      ].join(" ")}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      <span className="truncate">{label}</span>
    </button>
  );
}

function GameShell({
  nav,
  left,
  right,
  children,
}: {
  nav?: ReactNode;
  left?: ReactNode;
  right?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main
      className="relative min-h-screen w-full bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: "url('/images/city-night.png')" }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-panel/50 via-panel/20 to-panel/70" />

      <div className="relative mx-auto flex min-h-screen max-w-[1500px] flex-col gap-4 px-4 py-5 lg:px-8">
        {nav && <header className="mx-auto w-full max-w-4xl">{nav}</header>}

        <div className="flex flex-1 flex-col items-stretch gap-4 lg:flex-row">
          {left && <div className="mx-auto w-full max-w-3xl lg:order-1 lg:mx-0 lg:w-72 lg:shrink-0">{left}</div>}
          <div className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-4 lg:order-2 lg:mx-0">{children}</div>
          {right && <div className="mx-auto w-full max-w-3xl lg:order-3 lg:mx-0 lg:w-72 lg:shrink-0">{right}</div>}
        </div>
      </div>
    </main>
  );
}

export function App() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const [section, setSection] = useState<Section>("explore");
  const [hasCreature, setHasCreature] = useState<boolean | null>(null);
  const [showInventory, setShowInventory] = useState(false);
  const screen = useExplorationStore((s) => s.screen);
  const transitioning = useExplorationStore((s) => s.transitioning);
  const goToCity = useExplorationStore((s) => s.goToCity);
  const goToLeague = useExplorationStore((s) => s.goToLeague);
  const evolutionQueue = useEvolutionStore((s) => s.queue);
  const enqueueEvolutions = useEvolutionStore((s) => s.enqueue);
  const dequeueEvolution = useEvolutionStore((s) => s.dequeue);

  useEffect(() => {
    if (!accessToken) return;
    setHasCreature(null);
    listCreatures(accessToken)
      .then((creatures) => {
        setHasCreature(creatures.length > 0);
        // Catches players up on any evolution their creatures already qualified for before
        // this feature existed (or before their species got an evolution level added) — this
        // is the one place guaranteed to run before TeamSidebar's own listCreatures call, so
        // it's the only call site that ever surfaces retroactive evolvedNow data; see
        // creatures.service.ts's listCreatures and evolutionStore.ts.
        const retroactive = creatures.flatMap((c) =>
          c.evolvedNow.map((step) => ({ step, isShiny: c.isShiny })),
        );
        if (retroactive.length > 0) enqueueEvolutions(retroactive);
      })
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) logout();
      });
  }, [accessToken, logout, enqueueEvolutions]);

  if (!user) return <LoginPage />;

  if (hasCreature === null) {
    return (
      <GameShell>
        <div className="rounded-3xl border-[3px] border-gold bg-gold-deep/25 p-6 text-center shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-sm">
          <p className="text-lg font-black text-gold-light">Chargement...</p>
        </div>
      </GameShell>
    );
  }

  if (!hasCreature) {
    return (
      <GameShell>
        <StarterSelectPage onChosen={() => setHasCreature(true)} />
      </GameShell>
    );
  }

  return (
    <GameShell
      nav={
        <nav className="flex items-center gap-3">
          <NavTab
            active={section === "explore"}
            onClick={() => setSection("explore")}
            icon={Compass}
            label="Exploration"
          />
          <NavTab
            active={section === "collection"}
            onClick={() => setSection("collection")}
            icon={LayoutGrid}
            label="Collection"
          />
          <NavTab
            active={section === "stats"}
            onClick={() => setSection("stats")}
            icon={BarChart3}
            label="Statistiques"
          />
          {user.email === ADMIN_EMAIL && (
            <NavTab
              active={section === "admin"}
              onClick={() => setSection("admin")}
              icon={ShieldAlert}
              label="Admin"
            />
          )}
          <button
            type="button"
            onClick={() => setShowInventory(true)}
            title="Inventaire"
            aria-label="Inventaire"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-gold-deep/70 bg-panel/80 text-gold-light transition-all hover:border-gold hover:bg-panel-light"
          >
            <img src="/ui/inventory-button.png" alt="" className="h-6 w-6 [image-rendering:pixelated]" />
          </button>
        </nav>
      }
      left={
        section === "explore" ? (
          <div className="flex flex-col gap-4">
            <RouteEncounterSidebar />
            <ActiveQuestTracker />
          </div>
        ) : undefined
      }
      right={section === "admin" ? undefined : <TeamSidebar />}
    >
      {section === "collection" && <CollectionPage />}

      {section === "stats" && <StatsPage />}

      {section === "admin" && <AdminPage />}

      {section === "explore" && (
        <div
          className={`transition-all duration-300 ${transitioning ? "scale-[0.97] opacity-0" : "scale-100 opacity-100"}`}
        >
          {screen.view === "world" && <WorldMapPage />}
          {screen.view === "city" && <CityMapPage cityId={screen.cityId} />}
          {screen.view === "league" && <LeaguePage />}
          {screen.view === "encounter" && (
            <EncounterPage
              onLeave={() =>
                screen.returnTo.view === "league" ? goToLeague() : goToCity(screen.returnTo.cityId)
              }
            />
          )}
        </div>
      )}

      {showInventory && <InventoryPanel onClose={() => setShowInventory(false)} />}

      {evolutionQueue.length > 0 && (
        <EvolutionAnimation
          key={evolutionQueue[0].queuedAt}
          step={evolutionQueue[0].step}
          isShiny={evolutionQueue[0].isShiny}
          onDone={dequeueEvolution}
        />
      )}
    </GameShell>
  );
}
