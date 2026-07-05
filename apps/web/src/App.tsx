import { useState } from "react";
import { useAuthStore } from "./state/authStore";
import { useExplorationStore } from "./state/explorationStore";
import { LoginPage } from "./pages/LoginPage";
import { WorldMapPage } from "./pages/WorldMapPage";
import { CityMapPage } from "./pages/CityMapPage";
import { EncounterPage } from "./pages/EncounterPage";
import { CollectionPage } from "./pages/CollectionPage";

type Section = "explore" | "collection";

export function App() {
  const user = useAuthStore((s) => s.user);
  const [section, setSection] = useState<Section>("explore");
  const screen = useExplorationStore((s) => s.screen);
  const transitioning = useExplorationStore((s) => s.transitioning);

  if (!user) return <LoginPage />;

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
