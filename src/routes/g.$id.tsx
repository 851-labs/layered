import { createFileRoute, Link } from "@tanstack/react-router"
import { useState, useCallback } from "react"
import { ArrowLeft } from "lucide-react"

import { LayerViewer3D } from "../components/layer-viewer-3d"
import { LayerPanel } from "../components/layer-panel"
import { getGeneration } from "../lib/fal"

type LayerState = {
  url: string
  visible: boolean
  opacity: number
}

function GenerationPage() {
  const { generation } = Route.useLoaderData()

  const [layers, setLayers] = useState<LayerState[]>(() =>
    generation.layers.map((url) => ({
      url,
      visible: true,
      opacity: 1,
    }))
  )

  const handleToggleVisibility = useCallback((index: number) => {
    setLayers((prev) => prev.map((layer, i) => (i === index ? { ...layer, visible: !layer.visible } : layer)))
  }, [])

  const handleOpacityChange = useCallback((index: number, opacity: number) => {
    setLayers((prev) => prev.map((layer, i) => (i === index ? { ...layer, opacity } : layer)))
  }, [])

  const handleSolo = useCallback((index: number) => {
    setLayers((prev) =>
      prev.map((layer, i) => ({
        ...layer,
        visible: i === index,
        opacity: i === index ? 1 : layer.opacity,
      }))
    )
  }, [])

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-[1400px] mx-auto border-x border-stone-200">
        {/* Header with back button */}
        <div className="flex items-center gap-4 p-4 border-b border-stone-200">
          <Link to="/" className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
            <ArrowLeft className="w-5 h-5 text-stone-500" />
          </Link>
          <span className="text-sm text-stone-500">Generation {generation.id.slice(0, 8)}</span>
        </div>

        {/* 3D Viewer */}
        <div className="aspect-video border-b border-stone-200 bg-stone-100/50">
          <LayerViewer3D layers={layers} className="w-full h-full" />
        </div>

        {/* Layer Controls */}
        <div className="p-6">
          <LayerPanel
            layers={layers}
            onToggleVisibility={handleToggleVisibility}
            onOpacityChange={handleOpacityChange}
            onSolo={handleSolo}
          />
        </div>
      </div>
    </div>
  )
}

const Route = createFileRoute("/g/$id")({
  loader: async ({ params }) => {
    const generation = await getGeneration({ data: { id: params.id } })
    return { generation }
  },
  component: GenerationPage,
})

export { Route }
