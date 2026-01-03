import { HeadContent, Scripts, createRootRoute } from "@tanstack/react-router"

import { Header } from "../components/header"

import appCss from "../styles.css?url"

const Route = createRootRoute({
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "Layered - AI Image Decomposition",
      },
      {
        name: "description",
        content: "Decompose any image into editable layers using AI. Powered by Qwen-Image-Layered.",
      },
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="bg-stone-50 text-stone-900">
        <Header />
        {children}
        <Scripts />
      </body>
    </html>
  )
}

export { Route }
