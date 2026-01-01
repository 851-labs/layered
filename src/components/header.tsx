import { Link } from "@tanstack/react-router"
import { Layers } from "lucide-react"

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-zinc-950/80 backdrop-blur-lg border-b border-zinc-800/50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="p-2 rounded-lg bg-amber-400/10 group-hover:bg-amber-400/20 transition-colors">
            <Layers className="w-5 h-5 text-amber-400" />
          </div>
          <span className="text-lg font-semibold text-white tracking-tight">Layered</span>
        </Link>

        <nav className="flex items-center gap-6">
          <a
            href="https://fal.ai/models/fal-ai/qwen-image-layered"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            Model
          </a>
          <a
            href="https://github.com/851-labs/layered"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-zinc-400 hover:text-white transition-colors"
          >
            GitHub
          </a>
        </nav>
      </div>
    </header>
  )
}
