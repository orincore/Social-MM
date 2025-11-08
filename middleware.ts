import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';

export default withAuth(
  function middleware(req) {
    // If user is authenticated and trying to access auth pages, redirect to dashboard
    if (req.nextauth.token && (
      req.nextUrl.pathname.startsWith('/auth/signin') ||
      req.nextUrl.pathname.startsWith('/auth/error') ||
      req.nextUrl.pathname === '/'
    )) {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // Allow access to onboarding for authenticated users
    if (req.nextauth.token && req.nextUrl.pathname === '/onboarding') {
      return NextResponse.next();
    }

    // Allow the request to continue
    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Protect dashboard routes
        if (req.nextUrl.pathname.startsWith('/dashboard')) {
          return !!token;
        }
        
        // Allow access to other routes
        return true;
      },
    },
  }
);

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/auth/:path*',
    '/onboarding',
    '/'
  ]
};
