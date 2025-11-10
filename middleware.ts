import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const AUTH_ROUTE_MATCHERS = ['/auth/signin', '/auth/error'];

function getSessionToken(req: NextRequest) {
  return (
    req.cookies.get('__Secure-next-auth.session-token')?.value ||
    req.cookies.get('next-auth.session-token')?.value ||
    null
  );
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const sessionToken = getSessionToken(req);
  const isAuthenticated = Boolean(sessionToken);

  // Redirect authenticated users away from auth pages or home
  if (
    isAuthenticated &&
    (pathname === '/' || AUTH_ROUTE_MATCHERS.some((route) => pathname.startsWith(route)))
  ) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }
    // User validation is handled by NextAuth session and individual API routes
    // No need for additional middleware validation that causes fetch errors
  }

  // Allow onboarding for authenticated users
  if (pathname === '/onboarding' && isAuthenticated) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/auth/:path*', '/onboarding', '/'],
};
