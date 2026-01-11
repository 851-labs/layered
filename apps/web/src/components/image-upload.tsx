import { useState, useCallback } from "react"
import { Upload, Image as ImageIcon, Loader2 } from "lucide-react"

import { cn } from "../utils/cn"

type ImageUploadProps = {
  onImageSelected: (file: File) => void
  isUploading?: boolean
  disabled?: boolean
}

function ImageUpload({ onImageSelected, isUploading = false, disabled = false }: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)

  const handleFile = useCallback(
    (file: File) => {
      if (!file.type.startsWith("image/")) {
        return
      }

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        setPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)

      onImageSelected(file)
    },
    [onImageSelected]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      if (disabled || isUploading) return

      const file = e.dataTransfer.files[0]
      if (file) {
        handleFile(file)
      }
    },
    [handleFile, disabled, isUploading]
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled && !isUploading) {
        setIsDragOver(true)
      }
    },
    [disabled, isUploading]
  )

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false)
  }, [])

  const handleClick = useCallback(() => {
    if (disabled || isUploading) return

    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        handleFile(file)
      }
    }
    input.click()
  }, [handleFile, disabled, isUploading])

  const reset = useCallback(() => {
    setPreview(null)
  }, [])

  return (
    <div className="w-full max-w-xl mx-auto">
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={handleClick}
        className={cn(
          "relative overflow-hidden rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer",
          isDragOver
            ? "border-amber-400 bg-amber-400/10 scale-[1.02]"
            : "border-zinc-600 hover:border-zinc-500 bg-zinc-900/50",
          (disabled || isUploading) && "opacity-50 cursor-not-allowed"
        )}
      >
        {preview ? (
          <div className="relative aspect-video">
            <img src={preview} alt="Preview" className="w-full h-full object-contain" />
            {isUploading && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="flex flex-col items-center gap-3">
                  <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
                  <span className="text-zinc-300 text-sm font-medium">Processing layers...</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-12 flex flex-col items-center gap-4">
            <div
              className={cn(
                "p-4 rounded-full transition-colors",
                isDragOver ? "bg-amber-400/20" : "bg-zinc-800"
              )}
            >
              {isDragOver ? (
                <ImageIcon className="w-10 h-10 text-amber-400" />
              ) : (
                <Upload className="w-10 h-10 text-zinc-400" />
              )}
            </div>
            <div className="text-center">
              <p className="text-zinc-300 font-medium mb-1">
                {isDragOver ? "Drop your image here" : "Upload an image"}
              </p>
              <p className="text-zinc-500 text-sm">Drag and drop or click to browse</p>
            </div>
            <div className="flex gap-2 text-xs text-zinc-600">
              <span>PNG</span>
              <span>•</span>
              <span>JPG</span>
              <span>•</span>
              <span>WebP</span>
            </div>
          </div>
        )}
      </div>

      {preview && !isUploading && (
        <button
          onClick={(e) => {
            e.stopPropagation()
            reset()
          }}
          className="mt-3 text-sm text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          Choose different image
        </button>
      )}
    </div>
  )
}

export { ImageUpload }
