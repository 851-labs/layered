import { createFileRoute, useNavigate } from "@tanstack/react-router"
import { useState, useCallback } from "react"
import { Upload, Loader2, AlertCircle } from "lucide-react"

import { uploadImage, decomposeImage } from "../lib/fal"

type ExampleCardProps = {
  example: { id: string; input: string; layers: string[] }
  hasBorderRight: boolean
}

function ExampleCard({ example, hasBorderRight }: ExampleCardProps) {
  const [isHovered, setIsHovered] = useState(false)

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`
        aspect-square relative overflow-hidden
        border-b border-stone-200
        ${hasBorderRight ? "border-r" : ""}
      `}
      style={{ perspective: "900px" }}
    >
      <div
        className="absolute inset-0 flex items-center justify-center transition-transform duration-500 ease-out"
        style={{
          transformStyle: "preserve-3d",
          transform: isHovered
            ? "rotateY(0deg) rotateX(0deg) rotateZ(0deg)"
            : "rotateY(25deg) rotateX(0deg) rotateY(30deg)",
        }}
      >
        {example.layers.map((layer, layerIndex) => {
          const spacing = 15
          const depthSpacing = 40
          const depth = isHovered ? 0 : layerIndex * depthSpacing
          const xOffset = isHovered ? 0 : layerIndex * spacing

          return (
            <img
              key={layerIndex}
              src={layer}
              alt={`Layer ${layerIndex + 1}`}
              draggable={false}
              className="absolute select-none object-contain transition-all duration-500 ease-out"
              style={{
                width: isHovered ? "100%" : "55%",
                height: isHovered ? "100%" : "55%",
                transform: `translateZ(${depth}px) translateX(${xOffset}px) rotateY(0deg)`,
                boxShadow: isHovered ? "none" : "0 4px 20px rgba(0, 0, 0, 0.15)",
              }}
            />
          )
        })}
      </div>
    </div>
  )
}

// Example images to showcase (6 examples for the 3x2 grid)
const EXAMPLES = [
  {
    id: "1",
    input: "https://replicate.delivery/pbxt/OGJS6oNSRRCreFyh6zqtSHcnRLSKPYRBE21H0p72qzoocduq/couple-in-field.png",
    layers: [
      "https://replicate.delivery/xezq/Ci603GTf5kU4V61PU6dcHFZOupLS4ikrAn5x0RCGZvg86Z6KA/out-0.webp",
      "https://replicate.delivery/xezq/LRxbPqWEZhLoC95xridbviBBmj3JDt72G3WSPGUudCUe6Z6KA/out-1.webp",
      "https://replicate.delivery/xezq/4q0uoz3ioWprNV1UyvP4rQSwOKQW3hUD5aAmc1UCS1ae6Z6KA/out-2.webp",
      "https://replicate.delivery/xezq/RMRT4pGJzRaUIVdxyOfsPI2Y1ioxfKIcgSez0eMTY70nXPTXB/out-3.webp",
    ],
  },
  {
    id: "2",
    input: "https://replicate.delivery/pbxt/OGJS6oNSRRCreFyh6zqtSHcnRLSKPYRBE21H0p72qzoocduq/couple-in-field.png",
    layers: [
      "https://replicate.delivery/xezq/Ci603GTf5kU4V61PU6dcHFZOupLS4ikrAn5x0RCGZvg86Z6KA/out-0.webp",
      "https://replicate.delivery/xezq/LRxbPqWEZhLoC95xridbviBBmj3JDt72G3WSPGUudCUe6Z6KA/out-1.webp",
      "https://replicate.delivery/xezq/4q0uoz3ioWprNV1UyvP4rQSwOKQW3hUD5aAmc1UCS1ae6Z6KA/out-2.webp",
      "https://replicate.delivery/xezq/RMRT4pGJzRaUIVdxyOfsPI2Y1ioxfKIcgSez0eMTY70nXPTXB/out-3.webp",
    ],
  },
  {
    id: "3",
    input: "https://replicate.delivery/pbxt/OGJS6oNSRRCreFyh6zqtSHcnRLSKPYRBE21H0p72qzoocduq/couple-in-field.png",
    layers: [
      "https://replicate.delivery/xezq/Ci603GTf5kU4V61PU6dcHFZOupLS4ikrAn5x0RCGZvg86Z6KA/out-0.webp",
      "https://replicate.delivery/xezq/LRxbPqWEZhLoC95xridbviBBmj3JDt72G3WSPGUudCUe6Z6KA/out-1.webp",
      "https://replicate.delivery/xezq/4q0uoz3ioWprNV1UyvP4rQSwOKQW3hUD5aAmc1UCS1ae6Z6KA/out-2.webp",
      "https://replicate.delivery/xezq/RMRT4pGJzRaUIVdxyOfsPI2Y1ioxfKIcgSez0eMTY70nXPTXB/out-3.webp",
    ],
  },
  {
    id: "4",
    input: "https://replicate.delivery/pbxt/OGJS6oNSRRCreFyh6zqtSHcnRLSKPYRBE21H0p72qzoocduq/couple-in-field.png",
    layers: [
      "https://replicate.delivery/xezq/Ci603GTf5kU4V61PU6dcHFZOupLS4ikrAn5x0RCGZvg86Z6KA/out-0.webp",
      "https://replicate.delivery/xezq/LRxbPqWEZhLoC95xridbviBBmj3JDt72G3WSPGUudCUe6Z6KA/out-1.webp",
      "https://replicate.delivery/xezq/4q0uoz3ioWprNV1UyvP4rQSwOKQW3hUD5aAmc1UCS1ae6Z6KA/out-2.webp",
      "https://replicate.delivery/xezq/RMRT4pGJzRaUIVdxyOfsPI2Y1ioxfKIcgSez0eMTY70nXPTXB/out-3.webp",
    ],
  },
  {
    id: "5",
    input: "https://replicate.delivery/pbxt/OGJS6oNSRRCreFyh6zqtSHcnRLSKPYRBE21H0p72qzoocduq/couple-in-field.png",
    layers: [
      "https://replicate.delivery/xezq/Ci603GTf5kU4V61PU6dcHFZOupLS4ikrAn5x0RCGZvg86Z6KA/out-0.webp",
      "https://replicate.delivery/xezq/LRxbPqWEZhLoC95xridbviBBmj3JDt72G3WSPGUudCUe6Z6KA/out-1.webp",
      "https://replicate.delivery/xezq/4q0uoz3ioWprNV1UyvP4rQSwOKQW3hUD5aAmc1UCS1ae6Z6KA/out-2.webp",
      "https://replicate.delivery/xezq/RMRT4pGJzRaUIVdxyOfsPI2Y1ioxfKIcgSez0eMTY70nXPTXB/out-3.webp",
    ],
  },
  {
    id: "6",
    input: "https://replicate.delivery/pbxt/OGJS6oNSRRCreFyh6zqtSHcnRLSKPYRBE21H0p72qzoocduq/couple-in-field.png",
    layers: [
      "https://replicate.delivery/xezq/Ci603GTf5kU4V61PU6dcHFZOupLS4ikrAn5x0RCGZvg86Z6KA/out-0.webp",
      "https://replicate.delivery/xezq/LRxbPqWEZhLoC95xridbviBBmj3JDt72G3WSPGUudCUe6Z6KA/out-1.webp",
      "https://replicate.delivery/xezq/4q0uoz3ioWprNV1UyvP4rQSwOKQW3hUD5aAmc1UCS1ae6Z6KA/out-2.webp",
      "https://replicate.delivery/xezq/RMRT4pGJzRaUIVdxyOfsPI2Y1ioxfKIcgSez0eMTY70nXPTXB/out-3.webp",
    ],
  },
]

function App() {
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleImageSelected = useCallback(
    async (file: File) => {
      setIsProcessing(true)
      setError(null)

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

        if (!result.layers || result.layers.length === 0) {
          throw new Error("No layers were extracted from the image")
        }

        // Navigate to the generation page
        navigate({ to: "/g/$id", params: { id: result.id } })
      } catch (err) {
        console.error("Processing failed:", err)
        setError(err instanceof Error ? err.message : "Failed to process image")
        setIsProcessing(false)
      }
    },
    [navigate]
  )

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
            <ExampleCard key={example.id} example={example} hasBorderRight={index % 3 !== 2} />
          ))}
        </div>
      </div>
    </div>
  )
}

const Route = createFileRoute("/")({ component: App })

export { Route }
