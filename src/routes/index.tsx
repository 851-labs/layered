import { createFileRoute } from "@tanstack/react-router"
import { useState, useCallback } from "react"
import { Upload, Loader2, AlertCircle, X } from "lucide-react"

import { LayerViewer3D } from "../components/layer-viewer-3d"
import { LayerPanel } from "../components/layer-panel"
import { uploadImage, decomposeImage } from "../lib/fal.server"

type LayerState = {
  url: string
  visible: boolean
  opacity: number
}

// Example images to showcase (6 examples for the 3x2 grid)
const EXAMPLES = [
  {
    id: "1",
    input: "/examples/example-1.png",
    layers: ["/examples/example-1-layer-0.png", "/examples/example-1-layer-1.png", "/examples/example-1-layer-2.png"],
  },
  {
    id: "2",
    input: "/examples/example-2.png",
    layers: ["/examples/example-2-layer-0.png", "/examples/example-2-layer-1.png"],
  },
  {
    id: "3",
    input: "/examples/example-3.png",
    layers: ["/examples/example-3-layer-0.png", "/examples/example-3-layer-1.png", "/examples/example-3-layer-2.png"],
  },
  {
    id: "4",
    input: "/examples/example-4.png",
    layers: ["/examples/example-4-layer-0.png", "/examples/example-4-layer-1.png"],
  },
  {
    id: "5",
    input: "/examples/example-5.png",
    layers: ["/examples/example-5-layer-0.png", "/examples/example-5-layer-1.png", "/examples/example-5-layer-2.png"],
  },
  {
    id: "6",
    input: "/examples/example-6.png",
    layers: ["/examples/example-6-layer-0.png", "/examples/example-6-layer-1.png"],
  },
]

function App() {
  const [layers, setLayers] = useState<LayerState[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showResults, setShowResults] = useState(false)

  const handleImageSelected = useCallback(async (file: File) => {
    setIsProcessing(true)
    setError(null)
    setLayers([])

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = () => {
          const result = reader.result as string
          const base64Data = result.split(",")[1]
          resolve(base64Data)
        }
        reader.onerror = reject
        reader.readAsDataURL(file)
      })

      const { url } = await uploadImage({
        data: { base64, contentType: file.type },
      })

      const result = await decomposeImage({ data: { imageUrl: url } })

      const resultLayers = result.layers || []
      if (resultLayers.length === 0) {
        throw new Error("No layers were extracted from the image")
      }

      setLayers(
        resultLayers.map((layer) => ({
          url: layer.url,
          visible: true,
          opacity: 1,
        }))
      )
      setShowResults(true)
    } catch (err) {
      console.error("Processing failed:", err)
      setError(err instanceof Error ? err.message : "Failed to process image")
    } finally {
      setIsProcessing(false)
    }
  }, [])

  const handleExampleClick = (example: (typeof EXAMPLES)[0]) => {
    setLayers(
      example.layers.map((url) => ({
        url,
        visible: true,
        opacity: 1,
      }))
    )
    setShowResults(true)
    setError(null)
  }

  const handleUploadClick = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) handleImageSelected(file)
    }
    input.click()
  }

  const handleClose = () => {
    setShowResults(false)
    setLayers([])
  }

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

  // Results overlay
  if (showResults && layers.length > 0) {
    return (
      <div className="min-h-screen bg-stone-50">
        <div className="max-w-[1400px] mx-auto border-x border-stone-200">
          {/* Close button */}
          <div className="flex justify-end p-4 border-b border-stone-200">
            <button onClick={handleClose} className="p-2 hover:bg-stone-100 rounded-lg transition-colors">
              <X className="w-5 h-5 text-stone-500" />
            </button>
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

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto border-x border-stone-200">
        {/* Hero Section - Centered */}
        <div className="border-b border-stone-200">
          {/* Title */}
          <div className="py-12 px-6 text-center border-b border-stone-200">
            <h1 className="text-[28px] md:text-[32px] font-semibold text-stone-800 leading-tight tracking-tight">
              Decompose images into
              <br />
              editable layers
            </h1>
          </div>

          {/* Upload Section */}
          <div className="py-16 px-6 flex flex-col items-center">
            <button
              onClick={handleUploadClick}
              disabled={isProcessing}
              className="flex flex-col items-center gap-4 group"
            >
              <div
                className={`
                  w-16 h-16 rounded-2xl border-2 border-dashed 
                  flex items-center justify-center transition-colors
                  ${isProcessing ? "border-stone-300 bg-stone-100" : "border-stone-300 group-hover:border-stone-400 group-hover:bg-stone-100"}
                `}
              >
                {isProcessing ? (
                  <Loader2 className="w-6 h-6 text-stone-400 animate-spin" />
                ) : (
                  <Upload className="w-6 h-6 text-stone-400 group-hover:text-stone-500" />
                )}
              </div>
              <div className="text-center">
                <p className="text-stone-600 font-medium">{isProcessing ? "Processing..." : "Upload an image"}</p>
                <p className="text-sm text-stone-400 mt-1">Drag and drop or click to browse</p>
              </div>
            </button>

            {error && (
              <div className="mt-8 flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl max-w-md">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}
          </div>
        </div>

        {/* Examples Grid - 3 columns x 2 rows */}
        <div className="grid grid-cols-3">
          {EXAMPLES.map((example, index) => (
            <button
              key={example.id}
              onClick={() => handleExampleClick(example)}
              className={`
                aspect-square relative group
                border-b border-stone-200
                ${index % 3 !== 2 ? "border-r" : ""}
                hover:bg-stone-100/50 transition-colors
              `}
            >
              {/* Placeholder X pattern */}
              <svg className="w-full h-full text-stone-200" viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="1" />
                <line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="1" />
              </svg>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

const Route = createFileRoute("/")({ component: App })

export { Route }
