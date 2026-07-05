import { useState } from "react";
import { useAuthStore } from "./state/authStore";
import { useExplorationStore } from "./state/explorationStore";
import { LoginPage } from "./pages/LoginPage";
import { FarmPage } from "./pages/FarmPage";
import { WorldMapPage } from "./pages/WorldMapPage";
import { CityMapPage } from "./pages/CityMapPage";

type Section = "farm" | "explore";

export function App() {
  const user = useAuthStore((s) => s.user);
  const [section, setSection] = useState<Section>("farm");
  const screen = useExplorationStore((s) => s.screen);
  const transitioning = useExplorationStore((s) => s.transitioning);

  if (!user) return <LoginPage />;

  return (
    <div className="screen">
      <div className="app-shell">
        <div className="tabs section-tabs">
          <button
            type="button"
            className={`tab ${section === "farm" ? "tab-active" : ""}`}
            onClick={() => setSection("farm")}
          >
            Ferme
          </button>
          <button
            type="button"
            className={`tab ${section === "explore" ? "tab-active" : ""}`}
            onClick={() => setSection("explore")}
          >
            Explorer
          </button>
        </div>

        {section === "farm" && <FarmPage />}

        {section === "explore" && (
          <div className={`map-transition ${transitioning ? "map-transition-active" : ""}`}>
            {screen.view === "world" ? (
              <WorldMapPage />
            ) : (
              <CityMapPage cityId={screen.cityId} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
