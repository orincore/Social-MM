import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { YouTubeAccount } from '@/models/YouTubeAccount';
import Content from '@/models/Content';
import { PublishJob } from '@/models/PublishJob';
import SocialAccount from '@/models/SocialAccount';

export async function GET() {
  try {
    const session = await getServerSession({ ...authOptions });
    
    if (!session?.user?.email) {
      return NextResponse.json({ connected: false, error: 'Unauthorized' });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    
    if (!user) {
      return NextResponse.json({ connected: false, error: 'User not found' });
    }
    
    // Get the user's YouTube account
    const account = await YouTubeAccount.findOne({ 
      userId: user._id, 
      isActive: true 
    });
    
    if (!account) {
      return NextResponse.json({ connected: false });
    }

    // Check if token is expired
    const isTokenExpired = new Date() > account.tokenExpiresAt;

    const response = { 
      connected: !isTokenExpired, 
      account: {
        channelId: account.channelId,
        channelTitle: account.channelTitle,
        channelHandle: account.channelHandle,
        subscriberCount: account.subscriberCount,
        videoCount: account.videoCount,
        viewCount: account.viewCount,
        thumbnailUrl: account.thumbnailUrl,
        description: account.description,
        country: account.country,
        connectedAt: account.createdAt,
        lastUpdated: account.updatedAt,
        tokenExpired: isTokenExpired
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error checking YouTube status:', error);
    return NextResponse.json({ connected: false, error: 'Failed to check status' });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession({ ...authOptions });
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete YouTube account and all related data
    await YouTubeAccount.deleteMany({ userId: user._id });

    // Invalidate analytics cache
    try {
      const cacheResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/cache/invalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('Cookie') || '',
        },
        body: JSON.stringify({ platform: 'youtube' }),
      });
      console.log('YouTube cache invalidation:', cacheResponse.ok ? 'Success' : 'Failed');
    } catch (error) {
      console.log('YouTube cache invalidation failed:', error);
    }

    await Promise.all([
      Content.deleteMany({ userId: user._id, platform: 'youtube' }),
      PublishJob.deleteMany({ userId: user._id.toString(), platform: 'youtube' }),
      SocialAccount.deleteMany({ userId: user._id, provider: 'youtube' }),
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'YouTube account disconnected successfully and data cleared' 
    });
  } catch (error) {
    console.error('YouTube disconnect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
