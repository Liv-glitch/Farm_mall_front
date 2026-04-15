import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function middleware(request: NextRequest) {
  const token = request.cookies.get("farm_mall_token")?.value
  const { pathname } = request.nextUrl

  // Get auth URLs from environment variables with defaults
  const loginUrl = process.env.NEXT_PUBLIC_AUTH_LOGIN_URL || "/auth/login"
  const registerUrl = process.env.NEXT_PUBLIC_AUTH_REGISTER_URL || "/auth/register"
  const forgotPasswordUrl = process.env.NEXT_PUBLIC_AUTH_FORGOT_PASSWORD_URL || "/auth/forgot-password"

  // Public routes that don't require authentication
  const publicRoutes = ["/", loginUrl, registerUrl, forgotPasswordUrl]

  // Admin routes that require authentication
  const adminRoutes = ["/admin"]

  // User dashboard routes that require authentication
  const userRoutes = ["/dashboard"]

  // Protected routes (routes that require authentication)
  const isProtectedRoute = !publicRoutes.some((route) => pathname.startsWith(route))

  // If trying to access protected route without token, redirect to login
  if (!token && isProtectedRoute) {
    return NextResponse.redirect(new URL(loginUrl, request.url))
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
