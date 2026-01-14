import { redirect } from "@tanstack/react-router";
import { createMiddleware, createServerFn } from "@tanstack/react-start";
import { getRequestHeaders } from "@tanstack/react-start/server";

import { auth } from "../auth/server";

/**
 * Error handling middleware - logs errors and returns generic message to client
 */
const errorHandlingMiddleware = createMiddleware().server(async ({ next }) => {
  try {
    return await next();
  } catch (error) {
    console.error("[ServerFn Error]", error);
    throw new Error("Something went wrong. Please try again.");
  }
});

/**
 * For routes - redirects unauthenticated users to home
 */
const redirectIfUnauthenticatedMiddleware = createMiddleware().server(async ({ next }) => {
  const headers = getRequestHeaders();
  const session = await auth.api.getSession({ headers });

  if (!session) throw redirect({ to: "/" });
  return await next({ context: { session } });
});

/**
 * For server functions - throws if unauthenticated
 */
const throwIfUnauthenticatedMiddleware = createMiddleware().server(async ({ next }) => {
  const headers = getRequestHeaders();
  const session = await auth.api.getSession({ headers });

  if (!session?.user) {
    throw new Error("You must be logged in");
  }
  return await next({ context: { session } });
});

/**
 * For server functions - attaches session if authenticated, null otherwise
 */
const optionalAuthMiddleware = createMiddleware().server(async ({ next }) => {
  const headers = getRequestHeaders();
  const session = await auth.api.getSession({ headers });
  return await next({ context: { session } });
});

/**
 * Server function to check auth and redirect - for use in route beforeLoad
 */
const requireAuth = createServerFn({ method: "GET" })
  .middleware([redirectIfUnauthenticatedMiddleware])
  .handler(async () => {
    // Middleware handles auth check and redirect
    return { authenticated: true };
  });

export {
  errorHandlingMiddleware,
  optionalAuthMiddleware,
  redirectIfUnauthenticatedMiddleware,
  throwIfUnauthenticatedMiddleware,
  requireAuth,
};
