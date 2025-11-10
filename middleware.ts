import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const AUTH_ROUTE_MATCHERS = ['/auth/signin', '/auth/error'];

async function validateUser(req: NextRequest) {
  const origin = new URL(req.url).origin;

  try {
    const response = await fetch(`${origin}/api/auth/validate-user`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        cookie: req.headers.get('cookie') || '',
      },
    });

    return response;
  } catch (error) {
    console.error('Middleware user validation failed:', error);
    return null;
  }
}

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

    // Validate that the user still exists in the database
    const validationResponse = await validateUser(req);

    if (validationResponse) {
      if (validationResponse.status === 404) {
        const redirectUrl = new URL('/auth/signin?error=account_deleted', req.url);
        const response = NextResponse.redirect(redirectUrl);

        response.cookies.delete('next-auth.session-token');
        response.cookies.delete('__Secure-next-auth.session-token');
        response.cookies.delete('next-auth.csrf-token');
        response.cookies.delete('__Host-next-auth.csrf-token');

        return response;
      }

      if (validationResponse.status === 401) {
        return NextResponse.redirect(new URL('/auth/signin', req.url));
      }
    }
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
