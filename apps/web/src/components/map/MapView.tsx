import { useState } from "react";
import type { HotspotShape } from "@farm-clicker/shared";

interface HotspotLike {
  id: string;
  shape: HotspotShape;
}

interface MapViewProps<H extends HotspotLike> {
  imageSrc: string;
  imageAlt: string;
  hotspots: H[];
  markerClassName: (hotspot: H) => string;
  markerLabel: (hotspot: H) => string;
  onHotspotClick: (hotspot: H) => void;
}

interface EditorPin {
  xPercent: number;
  yPercent: number;
  copied: boolean;
}

/**
 * Renders a background map image with hotspots positioned by percentage, so alignment
 * survives any display size. Also doubles as a dev coordinate picker: toggle "Mode
 * éditeur" and click anywhere on the map to read/copy the %x,%y under the cursor,
 * instead of guessing pixel positions by hand.
 */
export function MapView<H extends HotspotLike>({
  imageSrc,
  imageAlt,
  hotspots,
  markerClassName,
  markerLabel,
  onHotspotClick,
}: MapViewProps<H>) {
  const [editorMode, setEditorMode] = useState(false);
  const [editorPin, setEditorPin] = useState<EditorPin | null>(null);

  function handleMapClick(e: React.MouseEvent<HTMLDivElement>) {
    if (!editorMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const xPercent = ((e.clientX - rect.left) / rect.width) * 100;
    const yPercent = ((e.clientY - rect.top) / rect.height) * 100;
    const text = `{ xPercent: ${xPercent.toFixed(1)}, yPercent: ${yPercent.toFixed(1)} }`;

    setEditorPin({ xPercent, yPercent, copied: false });
    navigator.clipboard
      ?.writeText(text)
      .then(() => setEditorPin({ xPercent, yPercent, copied: true }))
      .catch(() => {});
  }

  return (
    <div className="map-toolbar">
      <button
        type="button"
        className={`tab ${editorMode ? "tab-active" : ""}`}
        onClick={() => setEditorMode((v) => !v)}
      >
        Mode éditeur {editorMode ? "activé" : "désactivé"}
      </button>

      <div className="map-frame" onClick={handleMapClick}>
        <img src={imageSrc} alt={imageAlt} className="map-image" draggable={false} />

        {hotspots.map((hotspot) => (
          <button
            key={hotspot.id}
            type="button"
            className={`map-hotspot ${markerClassName(hotspot)}`}
            style={{ left: `${hotspot.shape.xPercent}%`, top: `${hotspot.shape.yPercent}%` }}
            onClick={(e) => {
              e.stopPropagation();
              if (editorMode) return;
              onHotspotClick(hotspot);
            }}
            title={markerLabel(hotspot)}
          />
        ))}

        {editorMode && editorPin && (
          <div
            className="map-editor-pin"
            style={{ left: `${editorPin.xPercent}%`, top: `${editorPin.yPercent}%` }}
          >
            x: {editorPin.xPercent.toFixed(1)}% · y: {editorPin.yPercent.toFixed(1)}%
            {editorPin.copied ? " (copié)" : ""}
          </div>
        )}
      </div>
    </div>
  );
}
