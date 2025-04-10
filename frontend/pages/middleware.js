// middleware.js
import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  // These routes will be protected — Clerk will enforce authentication here
  protectedRoutes: [
    "/mcq",
    "/written",
    "/api",
    "/STS",
    "/Suggestion",
    "/Notes",
  ],
  // Optionally define routes that don't need auth here (like home, about, etc.)
  publicRoutes: ["/"],
});

export const config = {
  matcher: [
    /*
     * Match all routes except:
     * - _next (Next.js internals)
     * - static files (like .js, .css, .png, etc.)
     * - favicon
     */
    "/((?!_next|.*\\..*|favicon.ico).*)",
  ],
};
