import { RotateCcw, Move } from "lucide-react";
import { useState, useRef, useEffect } from "react";

import { cn } from "../utils/cn";

type Layer = {
  url: string;
  visible: boolean;
  opacity: number;
};

type LayerViewer3DProps = {
  layers: Layer[];
  className?: string;
};

function LayerViewer3D({ layers, className = "" }: LayerViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState({ x: 15, y: -25 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [spread, setSpread] = useState(0);

  // Animate spread on mount and when layers change
  useEffect(() => {
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

  const resetRotation = () => {
    setRotation({ x: 15, y: -25 });
  };

  const visibleLayers = layers.filter((l) => l.visible);
  const layerSpacing = 50 * spread;

  return (
    <div className={cn("relative", className)}>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={resetRotation}
          className="p-2.5 bg-white/90 hover:bg-white rounded-lg transition-colors shadow-sm border border-stone-200/60"
          title="Reset view"
        >
          <RotateCcw className="w-4 h-4 text-stone-600" />
        </button>
      </div>

      {/* Drag hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 px-3 py-1.5 bg-white/90 rounded-full shadow-sm border border-stone-200/60">
        <Move className="w-3 h-3 text-stone-400" />
        <span className="text-xs text-stone-500">Drag to rotate</span>
      </div>

      {/* 3D Scene */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
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
            transform: `rotateX(${rotation.x}deg) rotateY(${rotation.y}deg)`,
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
                  className="max-w-[320px] max-h-[280px] w-auto h-auto rounded-lg"
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
