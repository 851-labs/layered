import { redirect } from "@tanstack/react-router"
import { createMiddleware } from "@tanstack/react-start"
import { getRequestHeaders } from "@tanstack/react-start/server"
import { auth } from "./server"

/**
 * For routes - redirects unauthenticated users to home
 */
const redirectIfUnauthenticatedMiddleware = createMiddleware().server(async ({ next }) => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })

  if (!session) throw redirect({ to: "/" })
  return await next({ context: { session } })
})

/**
 * For server functions - throws if unauthenticated
 */
const throwIfUnauthenticatedMiddleware = createMiddleware().server(async ({ next }) => {
  const headers = getRequestHeaders()
  const session = await auth.api.getSession({ headers })

  if (!session?.user) {
    throw new Error("You must be logged in")
  }
  return await next({ context: { session } })
})

export { redirectIfUnauthenticatedMiddleware, throwIfUnauthenticatedMiddleware }
