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

function LayerPanel({ layers, onToggleVisibility, onOpacityChange, onSolo }: LayerPanelProps) {
  return (
    <div className="w-72 border-l border-stone-200 bg-stone-50 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-stone-200">
        <h2 className="text-sm font-medium text-stone-700">Layers</h2>
      </div>

      {/* Layers list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {layers.map((layer, index) => (
          <div
            key={index}
            className={`
              p-2 rounded-lg border transition-all duration-200
              ${layer.visible ? "bg-white border-stone-200" : "bg-stone-100 border-stone-200/60 opacity-60"}
            `}
          >
            <div className="flex gap-3">
              {/* Thumbnail */}
              <div className="w-12 h-12 rounded overflow-hidden bg-stone-200 shrink-0 checkerboard">
                <img src={layer.url} alt={`Layer ${index + 1}`} className="w-full h-full object-contain" />
              </div>

              {/* Controls */}
              <div className="flex-1 min-w-0">
                {/* Layer info row */}
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-stone-700">Layer {index + 1}</span>
                  <span className="text-[10px] text-stone-400">{Math.round(layer.opacity * 100)}%</span>
                </div>

                {/* Opacity slider */}
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={layer.opacity * 100}
                  onChange={(e) => onOpacityChange(index, parseInt(e.target.value) / 100)}
                  disabled={!layer.visible}
                  className={`
                    w-full h-1 rounded-full appearance-none cursor-pointer
                    bg-stone-200
                    [&::-webkit-slider-thumb]:appearance-none
                    [&::-webkit-slider-thumb]:w-3
                    [&::-webkit-slider-thumb]:h-3
                    [&::-webkit-slider-thumb]:rounded-full
                    [&::-webkit-slider-thumb]:bg-stone-900
                    [&::-webkit-slider-thumb]:cursor-pointer
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                />

                {/* Actions */}
                <div className="flex gap-1 mt-1">
                  <button
                    onClick={() => onSolo(index)}
                    className="p-1 hover:bg-stone-100 rounded transition-colors"
                    title="Solo layer"
                  >
                    <Focus className="w-3.5 h-3.5 text-stone-400 hover:text-stone-700" />
                  </button>
                  <button
                    onClick={() => onToggleVisibility(index)}
                    className="p-1 hover:bg-stone-100 rounded transition-colors"
                    title={layer.visible ? "Hide layer" : "Show layer"}
                  >
                    {layer.visible ? (
                      <Eye className="w-3.5 h-3.5 text-stone-500" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5 text-stone-400" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export { LayerPanel }
