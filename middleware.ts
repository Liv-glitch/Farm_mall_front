import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("farm_mall_token")?.value
  const { pathname } = request.nextUrl

  // Public routes that don't require authentication
  const publicRoutes = ["/", "/auth/login", "/auth/register", "/auth/forgot-password"]

  // Admin routes that require authentication
  const adminRoutes = ["/admin"]

  // User dashboard routes that require authentication
  const userRoutes = ["/dashboard"]

  // Protected routes (routes that require authentication)
  const isProtectedRoute = !publicRoutes.some((route) => pathname.startsWith(route))

  // If trying to access protected route without token, redirect to login
  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL("/auth/login", request.url))
  }

  // Allow access to public routes regardless of token status
  // This prevents redirect loops when tokens are invalid
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // If we reach here, it's a protected route with a token - let the app handle validation
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
