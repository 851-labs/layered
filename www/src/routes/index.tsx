import { createFileRoute } from "@tanstack/react-router"
import { useState, useCallback } from "react"
import { Layers, Sparkles, AlertCircle } from "lucide-react"

import { ImageUpload } from "../components/image-upload"
import { LayerViewer3D } from "../components/layer-viewer-3d"
import { LayerPanel } from "../components/layer-panel"
import { uploadImage, decomposeImage } from "../lib/fal.server"

export const Route = createFileRoute("/")({ component: App })

type LayerState = {
  url: string
  visible: boolean
  opacity: number
}

function App() {
  const [layers, setLayers] = useState<LayerState[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImageSelected = useCallback(async (file: File) => {
    setIsProcessing(true)
    setError(null)
    setLayers([])

    try {
      // Convert file to base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          // Remove data URL prefix
          const base64Data = result.split(",")[1]
          resolve(base64Data)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      // Upload to fal storage
      const { url } = await uploadImage({
        data: { base64, contentType: file.type },
      })

      // Process through qwen-image-layered
      const result = await decomposeImage({ data: { imageUrl: url } })

      // Set layers with initial state
      const layers = result.layers || []
      if (layers.length === 0) {
        throw new Error("No layers were extracted from the image")
      }

      setLayers(
        layers.map((layer) => ({
          url: layer.url,
          visible: true,
          opacity: 1,
        }))
      )
    } catch (err) {
      console.error("Processing failed:", err)
      setError(err instanceof Error ? err.message : "Failed to process image")
    } finally {
      setIsProcessing(false)
    }
  }, [])

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

  const hasLayers = layers.length > 0

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Hero Section */}
      {!hasLayers && (
        <section className="pt-16 pb-12 px-6">
          <div className="max-w-2xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/10 text-amber-400 text-sm font-medium mb-6">
              <Sparkles className="w-4 h-4" />
              <span>Powered by Qwen-Image-Layered</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4 tracking-tight">
              Decompose images into
              <span className="block text-amber-400">editable layers</span>
            </h1>

            <p className="text-lg text-zinc-400 mb-10">
              Upload any image and watch AI separate it into individual layers. Perfect for designers, artists, and
              creative professionals.
            </p>
          </div>

          {/* Upload Zone */}
          <div className="max-w-xl mx-auto">
            <ImageUpload onImageSelected={handleImageSelected} isUploading={isProcessing} />
          </div>

          {/* Error Message */}
          {error && (
            <div className="max-w-xl mx-auto mt-6">
              <div className="flex items-center gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </div>
          )}
        </section>
      )}

      {/* Results Section */}
      {hasLayers && (
        <section className="py-8 px-6">
          <div className="max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-400/10">
                  <Layers className="w-5 h-5 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-white">Layer Decomposition</h2>
                  <p className="text-sm text-zinc-500">{layers.length} layers extracted</p>
                </div>
              </div>

              <button
                onClick={() => setLayers([])}
                className="px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors"
              >
                New image
              </button>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* 3D Viewer */}
              <div className="lg:col-span-2">
                <div className="bg-zinc-900 rounded-xl border border-zinc-800 overflow-hidden">
                  <LayerViewer3D layers={layers} />
                </div>
              </div>

              {/* Layer Panel */}
              <div className="lg:col-span-1">
                <LayerPanel
                  layers={layers}
                  onToggleVisibility={handleToggleVisibility}
                  onOpacityChange={handleOpacityChange}
                  onSolo={handleSolo}
                />
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  )
}
