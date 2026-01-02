import { Link } from "@tanstack/react-router"
import { Github } from "lucide-react"

function Header() {
  return (
    <header className="h-14 border-b border-stone-200/60 bg-stone-50/80 backdrop-blur-sm sticky top-0 z-50">
      <div className="h-full max-w-[1400px] mx-auto px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-[15px] font-medium text-stone-800 tracking-tight">Layered</span>
        </Link>

        <a
          href="https://github.com/851-labs/layered"
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 -m-2 text-stone-500 hover:text-stone-900 transition-colors"
          aria-label="GitHub"
        >
          <Github className="w-5 h-5" />
        </a>
      </div>
    </header>
  )
}

export { Header }
