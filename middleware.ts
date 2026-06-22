import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("farm_mall_token")?.value
  const { pathname } = request.nextUrl

  // Public route PREFIXES (everything under /auth is public)
  const publicPrefixes = ["/auth", "/calculator", "/forecast"]

  // A route is public if it's the home page (exact match) or under a public prefix.
  // NOTE: "/" must be matched exactly — using startsWith("/") would match every path.
  const isPublicRoute =
    pathname === "/" || publicPrefixes.some((prefix) => pathname.startsWith(prefix))

  // Everything else (e.g. /dashboard, /admin) requires authentication.
  if (!isPublicRoute && !token) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
