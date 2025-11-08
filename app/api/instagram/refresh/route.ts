import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { InstagramAccount } from '@/models/InstagramAccount';

export async function POST() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized - Please login with Google' }, { status: 401 });
    }

    await connectDB();
    // Only look for users with Google auth (not Facebook local emails)
    const user = await User.findOne({ 
      email: session.user.email,
      email: { $not: { $regex: /@facebook\.local$/ } }
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found - Please login with Google' }, { status: 404 });
    }

    const instagramAccount = await InstagramAccount.findOne({ 
      userId: user._id, 
      isActive: true 
    });

    if (!instagramAccount) {
      return NextResponse.json({ error: 'Instagram account not connected' }, { status: 404 });
    }

    // Check if token is expired
    if (new Date() > instagramAccount.tokenExpiresAt) {
      return NextResponse.json({ error: 'Instagram token expired, please reconnect' }, { status: 401 });
    }

    // Refresh Instagram profile data using existing token
    const profileResponse = await fetch(
      `https://graph.facebook.com/v21.0/${instagramAccount.instagramId}?fields=id,username,media_count,followers_count,follows_count,profile_picture_url,biography,website&access_token=${instagramAccount.accessToken}`
    );

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error('Failed to refresh Instagram profile:', profileResponse.status, errorText);
      return NextResponse.json({ error: 'Failed to refresh Instagram data' }, { status: 500 });
    }

    const profileData = await profileResponse.json();

    // Update account with latest data
    instagramAccount.username = profileData.username;
    instagramAccount.accountType = 'BUSINESS'; // Instagram Business account connected via Facebook page
    instagramAccount.profilePictureUrl = profileData.profile_picture_url;
    instagramAccount.followersCount = profileData.followers_count || 0;
    instagramAccount.followingCount = profileData.follows_count || 0;
    instagramAccount.mediaCount = profileData.media_count || 0;
    instagramAccount.biography = profileData.biography;
    instagramAccount.website = profileData.website;
    instagramAccount.lastSyncAt = new Date();
    
    await instagramAccount.save();

    return NextResponse.json({
      success: true,
      message: 'Instagram data refreshed successfully',
      account: {
        username: instagramAccount.username,
        accountType: instagramAccount.accountType,
        followersCount: instagramAccount.followersCount,
        followingCount: instagramAccount.followingCount,
        mediaCount: instagramAccount.mediaCount,
        lastSyncAt: instagramAccount.lastSyncAt
      }
    });

  } catch (error) {
    console.error('Instagram refresh error:', error);
    return NextResponse.json({ 
      error: 'Failed to refresh Instagram data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
