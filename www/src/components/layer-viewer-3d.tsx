import { useState, useRef, useEffect } from "react"
import { RotateCcw, Move } from "lucide-react"

type Layer = {
  url: string
  visible: boolean
  opacity: number
}

type LayerViewer3DProps = {
  layers: Layer[]
  className?: string
}

export function LayerViewer3D({ layers, className = "" }: LayerViewer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [rotation, setRotation] = useState({ x: 15, y: -25 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [spread, setSpread] = useState(0)

  // Animate spread on mount
  useEffect(() => {
    const timer = setTimeout(() => setSpread(1), 100)
    return () => clearTimeout(timer)
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true)
    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return

    const deltaX = e.clientX - dragStart.x
    const deltaY = e.clientY - dragStart.y

    setRotation((prev) => ({
      x: Math.max(-60, Math.min(60, prev.x - deltaY * 0.3)),
      y: prev.y + deltaX * 0.3,
    }))

    setDragStart({ x: e.clientX, y: e.clientY })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  const handleMouseLeave = () => {
    setIsDragging(false)
  }

  const resetRotation = () => {
    setRotation({ x: 15, y: -25 })
  }

  const visibleLayers = layers.filter((l) => l.visible)
  const layerSpacing = 60 * spread

  return (
    <div className={`relative ${className}`}>
      {/* Controls */}
      <div className="absolute top-4 right-4 z-10 flex gap-2">
        <button
          onClick={resetRotation}
          className="p-2 bg-zinc-800/80 hover:bg-zinc-700 rounded-lg transition-colors"
          title="Reset view"
        >
          <RotateCcw className="w-4 h-4 text-zinc-400" />
        </button>
      </div>

      {/* Drag hint */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2 text-xs text-zinc-500">
        <Move className="w-3 h-3" />
        <span>Drag to rotate</span>
      </div>

      {/* 3D Scene */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        className={`
          w-full aspect-[4/3] flex items-center justify-center
          cursor-grab select-none
          ${isDragging ? "cursor-grabbing" : ""}
        `}
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
            const zOffset = (visibleLayers.length - 1 - index) * layerSpacing

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
                  className="max-w-[400px] max-h-[300px] w-auto h-auto rounded-lg shadow-2xl"
                  style={{
                    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
                  }}
                  draggable={false}
                />
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

