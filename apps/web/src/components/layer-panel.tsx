import { EyeIcon, EyeSlashIcon } from "@phosphor-icons/react";

import { Separator } from "@/ui/separator";
import { Slider } from "@/ui/slider";
import { cn } from "@/utils/cn";

type Layer = {
  url: string;
  visible: boolean;
  opacity: number;
};

type LayerPanelProps = {
  layers: Layer[];
  onToggleVisibility: (index: number) => void;
  onOpacityChange: (index: number, opacity: number) => void;
};

function LayerPanel({ layers, onToggleVisibility, onOpacityChange }: LayerPanelProps) {
  return (
    <div className="w-72 border-l border-stone-200 bg-stone-50 flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3">
        <h2 className="text-sm font-medium text-stone-700">Layers</h2>
      </div>
      <Separator />

      {/* Layers list */}
      <div className="flex-1 overflow-y-auto">
        {layers.map((layer, index) => (
          <div key={index}>
            <div
              className={cn("px-3 py-2 flex items-center gap-3", !layer.visible && "opacity-50")}
            >
              {/* Thumbnail */}
              <div className="w-10 h-10 rounded overflow-hidden shrink-0 checkerboard">
                <img
                  src={layer.url}
                  alt={`Layer ${index + 1}`}
                  className="w-full h-full object-contain"
                />
              </div>

              {/* Layer info and controls */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center mb-3 justify-between">
                  <span className="text-xs font-medium text-stone-700">Layer {index + 1}</span>
                  <span className="text-[10px] text-stone-400 tabular-nums">
                    {Math.round(layer.opacity * 100)}%
                  </span>
                </div>

                {/* Opacity slider */}
                <Slider
                  min={0}
                  max={100}
                  value={[layer.opacity * 100]}
                  onValueChange={(value) => {
                    const opacity = Array.isArray(value) ? value[0] : value;
                    onOpacityChange(index, opacity / 100);
                  }}
                  disabled={!layer.visible}
                  className="mt-1.5"
                />
              </div>

              {/* Actions */}
              <div className="flex items-center gap-0.5">
                <button
                  onClick={() => onToggleVisibility(index)}
                  className="p-1.5 hover:bg-stone-200 rounded transition-colors"
                  title={layer.visible ? "Hide layer" : "Show layer"}
                >
                  {layer.visible ? (
                    <EyeIcon className="w-4 h-4 text-stone-500" />
                  ) : (
                    <EyeSlashIcon className="w-4 h-4 text-stone-400" />
                  )}
                </button>
              </div>
            </div>
            <div className="pl-16">
              <Separator />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export { LayerPanel };
