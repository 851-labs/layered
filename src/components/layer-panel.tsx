import { Eye, EyeOff, Focus } from "lucide-react"

type Layer = {
  url: string
  visible: boolean
  opacity: number
}

type LayerPanelProps = {
  layers: Layer[]
  onToggleVisibility: (index: number) => void
  onOpacityChange: (index: number, opacity: number) => void
  onSolo: (index: number) => void
}

export function LayerPanel({
  layers,
  onToggleVisibility,
  onOpacityChange,
  onSolo,
}: LayerPanelProps) {
  return (
    <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
      <div className="px-4 py-3 border-b border-zinc-800">
        <h3 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
          Layers
        </h3>
      </div>

      <div className="divide-y divide-zinc-800/50">
        {layers.map((layer, index) => (
          <div
            key={index}
            className={`
              p-3 flex items-center gap-3 transition-colors
              ${layer.visible ? "bg-zinc-900" : "bg-zinc-950/50"}
            `}
          >
            {/* Thumbnail */}
            <div className="relative w-12 h-12 rounded-md overflow-hidden bg-zinc-800 flex-shrink-0">
              {/* Checkerboard background for transparency */}
              <div
                className="absolute inset-0"
                style={{
                  backgroundImage: `
                    linear-gradient(45deg, #27272a 25%, transparent 25%),
                    linear-gradient(-45deg, #27272a 25%, transparent 25%),
                    linear-gradient(45deg, transparent 75%, #27272a 75%),
                    linear-gradient(-45deg, transparent 75%, #27272a 75%)
                  `,
                  backgroundSize: "8px 8px",
                  backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
                }}
              />
              <img
                src={layer.url}
                alt={`Layer ${index + 1}`}
                className="absolute inset-0 w-full h-full object-contain"
              />
            </div>

            {/* Layer info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium text-zinc-300">
                  Layer {index + 1}
                </span>
                <span className="text-xs text-zinc-600">
                  {Math.round(layer.opacity * 100)}%
                </span>
              </div>

              {/* Opacity slider */}
              <input
                type="range"
                min="0"
                max="100"
                value={layer.opacity * 100}
                onChange={(e) =>
                  onOpacityChange(index, parseInt(e.target.value) / 100)
                }
                disabled={!layer.visible}
                className={`
                  w-full h-1 rounded-full appearance-none cursor-pointer
                  bg-zinc-700
                  [&::-webkit-slider-thumb]:appearance-none
                  [&::-webkit-slider-thumb]:w-3
                  [&::-webkit-slider-thumb]:h-3
                  [&::-webkit-slider-thumb]:rounded-full
                  [&::-webkit-slider-thumb]:bg-amber-400
                  [&::-webkit-slider-thumb]:cursor-pointer
                  [&::-webkit-slider-thumb]:transition-transform
                  [&::-webkit-slider-thumb]:hover:scale-125
                  disabled:opacity-50 disabled:cursor-not-allowed
                `}
              />
            </div>

            {/* Actions */}
            <div className="flex gap-1">
              <button
                onClick={() => onSolo(index)}
                className="p-2 hover:bg-zinc-700 rounded-md transition-colors group"
                title="Solo layer"
              >
                <Focus className="w-4 h-4 text-zinc-500 group-hover:text-amber-400" />
              </button>
              <button
                onClick={() => onToggleVisibility(index)}
                className="p-2 hover:bg-zinc-700 rounded-md transition-colors"
                title={layer.visible ? "Hide layer" : "Show layer"}
              >
                {layer.visible ? (
                  <Eye className="w-4 h-4 text-zinc-400" />
                ) : (
                  <EyeOff className="w-4 h-4 text-zinc-600" />
                )}
              </button>
            </div>
          </div>
        ))}
      </div>

      {layers.length === 0 && (
        <div className="p-8 text-center text-zinc-600 text-sm">
          No layers yet. Upload an image to decompose it into layers.
        </div>
      )}
    </div>
  )
}

