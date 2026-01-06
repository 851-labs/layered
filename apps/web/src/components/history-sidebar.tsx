import { Link, useNavigate } from "@tanstack/react-router"
import { Plus, Loader2 } from "lucide-react"
import { useState, useCallback } from "react"

import { api } from "../lib/api"
import { type Prediction } from "../lib/api/schemas"

const SUPPORTED_CONTENT_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"] as const
type SupportedContentType = (typeof SUPPORTED_CONTENT_TYPES)[number]

function isSupportedContentType(type: string): type is SupportedContentType {
  return SUPPORTED_CONTENT_TYPES.includes(type as SupportedContentType)
}

type HistorySidebarProps = {
  predictions: Prediction[]
  currentId: string
}

function HistorySidebar({ predictions, currentId }: HistorySidebarProps) {
  const navigate = useNavigate()
  const [isUploading, setIsUploading] = useState(false)

  const handleNewClick = useCallback(() => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/png,image/jpeg,image/webp,image/gif"
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      // Validate content type
      if (!isSupportedContentType(file.type)) {
        console.error(`Unsupported image format: ${file.type || "unknown"}`)
        return
      }

      setIsUploading(true)
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

        const { blobId, url } = await api.upload.image({
          data: {
            base64,
            contentType: file.type,
            fileName: file.name,
          },
        })

        const result = await api.prediction.create({
          data: { imageUrl: url, inputBlobId: blobId },
        })
        navigate({ to: "/g/$id", params: { id: result.id } })
      } catch (err) {
        console.error("Upload failed:", err)
      } finally {
        setIsUploading(false)
      }
    }
    input.click()
  }, [navigate])

  return (
    <div className="w-60 border-r border-stone-200 bg-stone-50 flex flex-col h-full">
      {/* Header with New button */}
      <div className="p-3 border-b border-stone-200">
        <button
          onClick={handleNewClick}
          disabled={isUploading}
          className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-stone-900 hover:bg-stone-800 disabled:bg-stone-400 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          <span>{isUploading ? "Processing..." : "New"}</span>
        </button>
      </div>

      {/* Predictions list */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1">
        {predictions.map((prediction) => {
          const isActive = prediction.id === currentId

          return (
            <Link
              key={prediction.id}
              to="/g/$id"
              params={{ id: prediction.id }}
              className={`
                block p-2 rounded-lg transition-colors
                ${isActive ? "bg-stone-200" : "hover:bg-stone-100"}
              `}
            >
              <div className="aspect-video rounded overflow-hidden bg-stone-200 mb-2">
                {prediction.inputBlob && (
                  <img
                    src={prediction.inputBlob.url}
                    alt={`Prediction ${prediction.id.slice(0, 8)}`}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-stone-600 truncate">{prediction.id.slice(0, 8)}</span>
                <span className="text-xs text-stone-400">{prediction.outputBlobs.length} layers</span>
              </div>
            </Link>
          )
        })}

        {predictions.length === 0 && <div className="text-center py-8 text-sm text-stone-400">No predictions yet</div>}
      </div>
    </div>
  )
}

export { HistorySidebar }
