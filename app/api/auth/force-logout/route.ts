import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: 'No active session' }, { status: 401 });
    }

    // Clear the session by returning a response that clears the session cookie
    const response = NextResponse.json({ 
      success: true, 
      message: 'User logged out due to account deletion',
      redirectTo: '/auth/signin?error=account_deleted'
    });

    // Clear NextAuth session cookies
    response.cookies.set('next-auth.session-token', '', {
      expires: new Date(0),
      path: '/',
    });
    
    response.cookies.set('__Secure-next-auth.session-token', '', {
      expires: new Date(0),
      path: '/',
      secure: true,
    });

    response.cookies.set('next-auth.csrf-token', '', {
      expires: new Date(0),
      path: '/',
    });

    response.cookies.set('__Host-next-auth.csrf-token', '', {
      expires: new Date(0),
      path: '/',
      secure: true,
    });

    return response;

  } catch (error) {
    console.error('Force logout error:', error);
    return NextResponse.json({
      error: 'Failed to logout user'
    }, { status: 500 });
  }
}
