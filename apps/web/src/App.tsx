import { useEffect, useState } from "react";
import { useAuthStore } from "./state/authStore";
import { useExplorationStore } from "./state/explorationStore";
import { LoginPage } from "./pages/LoginPage";
import { WorldMapPage } from "./pages/WorldMapPage";
import { CityMapPage } from "./pages/CityMapPage";
import { EncounterPage } from "./pages/EncounterPage";
import { CollectionPage } from "./pages/CollectionPage";
import { StarterSelectPage } from "./pages/StarterSelectPage";
import { listCreatures } from "./api/creatures";
import { ApiError } from "./api/client";

type Section = "explore" | "collection";

export function App() {
  const user = useAuthStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const logout = useAuthStore((s) => s.logout);
  const [section, setSection] = useState<Section>("explore");
  const [hasCreature, setHasCreature] = useState<boolean | null>(null);
  const screen = useExplorationStore((s) => s.screen);
  const transitioning = useExplorationStore((s) => s.transitioning);

  useEffect(() => {
    if (!accessToken) return;
    setHasCreature(null);
    listCreatures(accessToken)
      .then((creatures) => setHasCreature(creatures.length > 0))
      .catch((err) => {
        if (err instanceof ApiError && err.status === 401) logout();
      });
  }, [accessToken, logout]);

  if (!user) return <LoginPage />;

  if (hasCreature === null) {
    return (
      <div className="screen">
        <div className="dialog-box">
          <p className="title">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!hasCreature) {
    return (
      <div className="screen">
        <StarterSelectPage onChosen={() => setHasCreature(true)} />
      </div>
    );
  }

  return (
    <div className="screen">
      <div className="app-shell">
        <div className="tabs section-tabs">
          <button
            type="button"
            className={`tab ${section === "explore" ? "tab-active" : ""}`}
            onClick={() => setSection("explore")}
          >
            Explorer
          </button>
          <button
            type="button"
            className={`tab ${section === "collection" ? "tab-active" : ""}`}
            onClick={() => setSection("collection")}
          >
            Collection
          </button>
        </div>

        {section === "collection" && <CollectionPage />}

        {section === "explore" && (
          <div className={`map-transition ${transitioning ? "map-transition-active" : ""}`}>
            {screen.view === "world" && <WorldMapPage />}
            {screen.view === "city" && <CityMapPage cityId={screen.cityId} />}
            {screen.view === "encounter" && <EncounterPage cityId={screen.cityId} />}
          </div>
        )}
      </div>
    </div>
  );
}
