import { ArrowCounterClockwiseIcon, ArrowsOutCardinalIcon } from "@phosphor-icons/react";
import { useState, useRef, useEffect, useCallback } from "react";

import { Slider } from "@/ui/slider";
import { cn } from "@/utils/cn";

type Layer = {
  url: string;
  visible: boolean;
  opacity: number;
};

type LayerViewer3DProps = {
  layers: Layer[];
};

const DEFAULT_ROTATION = { x: 15, y: 25 };
const DEFAULT_ZOOM = 1;
const DEFAULT_SPACING = 80;
const ZOOM_MIN = 0.5;
const ZOOM_MAX = 2.5;
const SPACING_MIN = 0;
const SPACING_MAX = 200;

function LayerViewer3D({ layers }: LayerViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(DEFAULT_ROTATION);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [spread, setSpread] = useState(1);
  const [zoom, setZoom] = useState(DEFAULT_ZOOM);
  const [spacing, setSpacing] = useState(DEFAULT_SPACING);

  // Touch state for pinch-to-zoom
  const [initialPinchDistance, setInitialPinchDistance] = useState<number | null>(null);
  const [initialZoom, setInitialZoom] = useState(DEFAULT_ZOOM);

  // Animate spread when layers change (but not on initial mount)
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    // Only animate spread on layer changes, not initial mount
    setSpread(0);
    const timer = setTimeout(() => setSpread(1), 100);
    return () => clearTimeout(timer);
  }, [layers]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setRotation((prev) => ({
      x: Math.max(-60, Math.min(60, prev.x - deltaY * 0.3)),
      y: prev.y + deltaX * 0.3,
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  // Scroll wheel zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, prev + delta)));
  }, []);

  // Calculate distance between two touch points
  const getTouchDistance = (touches: React.TouchList): number => {
    if (touches.length < 2) return 0;
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  };

  // Touch handlers for pinch-to-zoom
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const distance = getTouchDistance(e.touches);
      setInitialPinchDistance(distance);
      setInitialZoom(zoom);
    } else if (e.touches.length === 1) {
      setIsDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance !== null) {
      e.preventDefault();
      const currentDistance = getTouchDistance(e.touches);
      const scale = currentDistance / initialPinchDistance;
      const newZoom = Math.max(ZOOM_MIN, Math.min(ZOOM_MAX, initialZoom * scale));
      setZoom(newZoom);
    } else if (e.touches.length === 1 && isDragging) {
      const deltaX = e.touches[0].clientX - dragStart.x;
      const deltaY = e.touches[0].clientY - dragStart.y;

      setRotation((prev) => ({
        x: Math.max(-60, Math.min(60, prev.x - deltaY * 0.3)),
        y: prev.y + deltaX * 0.3,
      }));

      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchEnd = () => {
    setInitialPinchDistance(null);
    setIsDragging(false);
  };

  const resetView = () => {
    setRotation(DEFAULT_ROTATION);
    setZoom(DEFAULT_ZOOM);
    setSpacing(DEFAULT_SPACING);
  };

  const handleSpacingChange = (value: number | readonly number[]) => {
    const newValue = Array.isArray(value) ? value[0] : value;
    setSpacing(newValue);
  };

  const visibleLayers = layers.filter((l) => l.visible);
  const layerSpacing = spacing * spread;

  return (
    <div className="w-full h-full relative bg-gray-50">
      {/* Live Coordinates Overlay */}
      <div className="absolute top-4 left-4 z-10 bg-white/90 border border-stone-200/60 px-3 py-2 font-mono text-xs text-stone-600 space-y-1">
        <div className="flex justify-between gap-4">
          <span className="text-stone-400">Rotate X</span>
          <span>{rotation.x.toFixed(1)}°</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-stone-400">Rotate Y</span>
          <span>{rotation.y.toFixed(1)}°</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-stone-400">Zoom</span>
          <span>{(zoom * 100).toFixed(0)}%</span>
        </div>
        <div className="flex justify-between gap-4">
          <span className="text-stone-400">Spacing</span>
          <span>{spacing.toFixed(0)}px</span>
        </div>
      </div>

      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={resetView}
          className="p-2.5 bg-white/90 hover:bg-white transition-colors border border-stone-200/60"
          title="Reset view"
        >
          <ArrowCounterClockwiseIcon className="w-4 h-4 text-stone-600" />
        </button>
      </div>

      {/* Bottom Control Bar */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4 px-4 py-2 bg-white/90 border border-stone-200/60">
        <div className="flex items-center gap-2">
          <ArrowsOutCardinalIcon className="w-3 h-3 text-stone-400" />
          <span className="text-xs text-stone-500">Drag to rotate</span>
        </div>
        <div className="w-px h-4 bg-stone-200" />
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500 whitespace-nowrap">Spacing</span>
          <Slider
            className="w-24"
            value={[spacing]}
            min={SPACING_MIN}
            max={SPACING_MAX}
            onValueChange={handleSpacingChange}
          />
        </div>
      </div>

      {/* 3D Scene */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        className={cn(
          "w-full h-full min-h-[300px] flex items-center justify-center cursor-grab select-none",
          isDragging && "cursor-grabbing",
        )}
        style={{ perspective: "1200px" }}
      >
        <div
          className="relative transition-transform duration-300 ease-out"
          style={{
            transformStyle: "preserve-3d",
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg) scale(${zoom})`,
          }}
        >
          {visibleLayers.map((layer, index) => {
            const zOffset = (visibleLayers.length - 1 - index) * layerSpacing;

            return (
              <div
                key={index}
                className="absolute top-1/2 left-1/2 transition-all duration-500 ease-out"
                style={{
                  transform: `translate(-50%, -50%) translateZ(${zOffset}px)`,
                  opacity: layer.opacity,
                  transformStyle: "preserve-3d",
                }}
              >
                <img
                  src={layer.url}
                  alt={`Layer ${index + 1}`}
                  className="max-w-[320px] max-h-[280px] w-auto h-auto"
                  style={{
                    boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.2)",
                  }}
                  draggable={false}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export { LayerViewer3D };
