import { clerkMiddleware } from '@clerk/nextjs/server'

export default clerkMiddleware()

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
}

const isProtectedRoute = (path) => {
  return (
    path.startsWith("/mcq") ||
    path.startsWith("/written") ||
    path.startsWith("/api") ||
    path.startsWith("/STS") || 
    path.startsWith("/Suggestion") ||
    path.startsWith("/Notes") 
  );
};