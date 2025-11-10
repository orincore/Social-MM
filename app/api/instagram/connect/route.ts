import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { InstagramAccount } from '@/models/InstagramAccount';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Instagram Business OAuth URL (via Facebook)
    const instagramAuthUrl = new URL('https://www.facebook.com/v18.0/dialog/oauth');
    instagramAuthUrl.searchParams.set('client_id', process.env.INSTAGRAM_CLIENT_ID!);
    instagramAuthUrl.searchParams.set('redirect_uri', `${process.env.NEXTAUTH_URL}/api/instagram/callback`);
    instagramAuthUrl.searchParams.set('scope', 'pages_show_list,pages_read_engagement,instagram_basic,instagram_content_publish,business_management');
    instagramAuthUrl.searchParams.set('response_type', 'code');
    instagramAuthUrl.searchParams.set('state', Date.now().toString()); // Use timestamp as state for security

    return NextResponse.json({ 
      success: true, 
      authUrl: instagramAuthUrl.toString() 
    });
  } catch (error) {
    console.error('Instagram connect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete Instagram account connection
    await InstagramAccount.deleteMany({ userId: user._id });

    return NextResponse.json({ 
      success: true, 
      message: 'Instagram account disconnected successfully' 
    });
  } catch (error) {
    console.error('Instagram disconnect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
