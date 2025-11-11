import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { YouTubeAccount } from '@/models/YouTubeAccount';
import Content from '@/models/Content';
import { PublishJob } from '@/models/PublishJob';
import SocialAccount from '@/models/SocialAccount';

export async function GET(request: NextRequest) {
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

    // First check User profile for YouTube connection
    if (user.youtube?.connected && user.youtube?.accessToken) {
      // Check if token is expired
      const isTokenExpired = user.youtube.tokenExpiresAt && new Date() > user.youtube.tokenExpiresAt;
      
      if (!isTokenExpired) {
        return NextResponse.json({
          connected: true,
          channel: {
            title: user.youtube.channelTitle,
            channelId: user.youtube.channelId,
            description: user.youtube.channelDescription,
            thumbnailUrl: user.youtube.thumbnailUrl,
            subscriberCount: user.youtube.subscriberCount,
            videoCount: user.youtube.videoCount,
            viewCount: user.youtube.viewCount,
            connectedAt: user.youtube.connectedAt
          },
          source: 'user_profile'
        });
      } else {
        // Token expired, mark as disconnected in user profile
        user.youtube.connected = false;
        await user.save();
      }
    }
    
    // Fallback to separate YouTube account model
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

export async function DELETE(request: NextRequest) {
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

    if (user.youtube) {
      user.youtube.connected = false;
      user.youtube.accessToken = undefined;
      user.youtube.refreshToken = undefined;
      user.youtube.tokenExpiresAt = undefined;
      user.youtube.channelId = undefined;
      user.youtube.channelTitle = undefined;
      user.youtube.channelDescription = undefined;
      user.youtube.thumbnailUrl = undefined;
      user.youtube.subscriberCount = 0;
      user.youtube.videoCount = 0;
      user.youtube.viewCount = 0;
      user.youtube.connectedAt = undefined;
      await user.save();
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
