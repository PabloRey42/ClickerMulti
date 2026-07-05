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
    <div className="flex flex-col gap-3">
      <button
        type="button"
        onClick={() => setEditorMode((v) => !v)}
        className={[
          "self-start rounded-full border-2 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wide transition-colors",
          editorMode
            ? "border-gold-deep bg-gold text-panel"
            : "border-gold-deep/50 bg-panel/60 text-gold-light hover:bg-panel-light",
        ].join(" ")}
      >
        Mode éditeur {editorMode ? "activé" : "désactivé"}
      </button>

      <div
        onClick={handleMapClick}
        className="relative overflow-hidden rounded-2xl border-2 border-gold-deep shadow-[inset_0_0_30px_rgba(0,0,0,0.5)]"
        style={{ cursor: editorMode ? "crosshair" : "default" }}
      >
        <img src={imageSrc} alt={imageAlt} draggable={false} className="h-auto w-full select-none" />

        {hotspots.map((hotspot) => (
          <button
            key={hotspot.id}
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              if (editorMode) return;
              onHotspotClick(hotspot);
            }}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            aria-label={markerLabel(hotspot)}
            style={{ left: `${hotspot.shape.xPercent}%`, top: `${hotspot.shape.yPercent}%` }}
          >
            <span
              className={`block h-3.5 w-3.5 rounded-full border-2 border-panel-foreground shadow-[0_0_8px_rgba(0,0,0,0.7)] transition-transform group-hover:scale-125 ${markerClassName(hotspot)}`}
            />
            <span className="pointer-events-none absolute left-1/2 top-full mt-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-gold-deep bg-panel/95 px-2 py-0.5 text-[10px] font-bold text-gold-light opacity-0 shadow-lg transition-opacity group-hover:opacity-100">
              {markerLabel(hotspot)}
            </span>
          </button>
        ))}

        {editorMode && editorPin && (
          <div
            className="pointer-events-none absolute -translate-x-1/2 -translate-y-[130%] whitespace-nowrap rounded-lg bg-panel px-2 py-1 text-[11px] font-bold text-gold-light"
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
