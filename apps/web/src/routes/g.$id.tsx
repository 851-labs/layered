import { createFileRoute } from "@tanstack/react-router"
import { useState, useCallback } from "react"

import { LayerViewer3D } from "../components/layer-viewer-3d"
import { LayerPanel } from "../components/layer-panel"
import { HistorySidebar } from "../components/history-sidebar"
import { api } from "../lib/api"

type LayerState = {
  url: string
  visible: boolean
  opacity: number
}

function GenerationPage() {
  const { prediction, predictions } = Route.useLoaderData()

  const [layers, setLayers] = useState<LayerState[]>(() =>
    prediction.outputBlobs.map((blob) => ({
      url: blob.url,
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
    <div className="h-[calc(100vh-56px)] flex bg-stone-50">
      {/* Left sidebar: History */}
      <HistorySidebar predictions={predictions} currentId={prediction.id} />

      {/* Center: 3D Viewer */}
      <div className="flex-1 flex items-center justify-center bg-stone-100/50">
        <LayerViewer3D layers={layers} className="w-full h-full" />
      </div>

      {/* Right sidebar: Layers */}
      <LayerPanel
        layers={layers}
        onToggleVisibility={handleToggleVisibility}
        onOpacityChange={handleOpacityChange}
        onSolo={handleSolo}
      />
    </div>
  )
}

const Route = createFileRoute("/g/$id")({
  loader: async ({ params }) => {
    const [prediction, { predictions }] = await Promise.all([
      api.prediction.get({ data: { id: params.id } }),
      api.prediction.list(),
    ])
    return { prediction, predictions }
  },
  component: GenerationPage,
})

export { Route }
