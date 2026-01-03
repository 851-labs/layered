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

function LayerPanel({
  layers,
  onToggleVisibility,
  onOpacityChange,
  onSolo,
}: LayerPanelProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {layers.map((layer, index) => (
        <div
          key={index}
          className={`
            p-4 rounded-xl border transition-all duration-200
            ${layer.visible ? "bg-white border-stone-200" : "bg-stone-50 border-stone-200/60 opacity-60"}
          `}
        >
          {/* Thumbnail */}
          <div className="relative aspect-square rounded-lg overflow-hidden mb-3 checkerboard">
            <img
              src={layer.url}
              alt={`Layer ${index + 1}`}
              className="absolute inset-0 w-full h-full object-contain"
            />
          </div>

          {/* Layer info */}
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium text-stone-700">
              Layer {index + 1}
            </span>
            <span className="text-xs text-stone-400">
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
              w-full h-1.5 rounded-full appearance-none cursor-pointer mb-3
              bg-stone-200
              [&::-webkit-slider-thumb]:appearance-none
              [&::-webkit-slider-thumb]:w-4
              [&::-webkit-slider-thumb]:h-4
              [&::-webkit-slider-thumb]:rounded-full
              [&::-webkit-slider-thumb]:bg-stone-900
              [&::-webkit-slider-thumb]:cursor-pointer
              [&::-webkit-slider-thumb]:transition-transform
              [&::-webkit-slider-thumb]:hover:scale-110
              [&::-webkit-slider-thumb]:shadow-sm
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          />

          {/* Actions */}
          <div className="flex gap-1">
            <button
              onClick={() => onSolo(index)}
              className="flex-1 p-2 hover:bg-stone-100 rounded-lg transition-colors group flex items-center justify-center gap-1.5"
              title="Solo layer"
            >
              <Focus className="w-4 h-4 text-stone-400 group-hover:text-stone-700" />
              <span className="text-xs text-stone-400 group-hover:text-stone-700">
                Solo
              </span>
            </button>
            <button
              onClick={() => onToggleVisibility(index)}
              className="flex-1 p-2 hover:bg-stone-100 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              title={layer.visible ? "Hide layer" : "Show layer"}
            >
              {layer.visible ? (
                <>
                  <Eye className="w-4 h-4 text-stone-500" />
                  <span className="text-xs text-stone-500">Visible</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-4 h-4 text-stone-400" />
                  <span className="text-xs text-stone-400">Hidden</span>
                </>
              )}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}

export { LayerPanel }
