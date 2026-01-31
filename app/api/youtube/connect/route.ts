import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // YouTube OAuth URL with required scopes
    const youtubeAuthUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    youtubeAuthUrl.searchParams.set('client_id', process.env.YOUTUBE_CLIENT_ID!);
    youtubeAuthUrl.searchParams.set('redirect_uri', `${process.env.NEXTAUTH_URL}/api/youtube/callback`);
    youtubeAuthUrl.searchParams.set('scope', [
      'https://www.googleapis.com/auth/youtube.readonly',
      'https://www.googleapis.com/auth/youtube.upload',
      'https://www.googleapis.com/auth/youtube.force-ssl',
      'https://www.googleapis.com/auth/yt-analytics.readonly'
    ].join(' '));
    youtubeAuthUrl.searchParams.set('response_type', 'code');
    youtubeAuthUrl.searchParams.set('access_type', 'offline'); // Required for refresh token
    youtubeAuthUrl.searchParams.set('prompt', 'consent'); // Force consent to get refresh token
    youtubeAuthUrl.searchParams.set('state', session.user.email); // Use email as state for security

    return NextResponse.json({ 
      success: true, 
      authUrl: youtubeAuthUrl.toString() 
    });
  } catch (error) {
    console.error('YouTube connect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
