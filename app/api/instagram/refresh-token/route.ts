import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { dbConnect } from '@/lib/db';
import User from '@/models/User';
import { InstagramAccount } from '@/models/InstagramAccount';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const instagramAccount = await InstagramAccount.findOne({ 
      userId: user._id, 
      isActive: true 
    });

    if (!instagramAccount) {
      return NextResponse.json({ error: 'Instagram account not connected' }, { status: 404 });
    }

    console.log('Attempting to refresh Instagram token for:', instagramAccount.username);

    // Check if token is close to expiry (within 30 days for proactive refresh)
    const now = new Date();
    const tokenExpiryDate = new Date(instagramAccount.tokenExpiresAt);
    const daysUntilExpiry = Math.ceil((tokenExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    console.log(`Token expires in ${daysUntilExpiry} days`);

    // Only refresh if token is close to expiry (within 30 days) or already expired
    // Instagram allows refreshing tokens before they expire to extend validity
    if (daysUntilExpiry > 30 && daysUntilExpiry > 0) {
      return NextResponse.json({
        success: true,
        message: 'Token is still valid, no refresh needed',
        daysUntilExpiry,
        tokenExpiresAt: instagramAccount.tokenExpiresAt
      });
    }

    // Refresh the long-lived token using Instagram Graph API
    // This extends the token validity by another 60 days from the refresh time
    const refreshUrl = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${instagramAccount.accessToken}`;
    
    const refreshResponse = await fetch(refreshUrl);
    
    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error('Token refresh failed:', errorText);
      
      // If token is invalid, mark account as disconnected
      if (refreshResponse.status === 400 || refreshResponse.status === 401) {
        instagramAccount.isActive = false;
        await instagramAccount.save();
        
        // Also update user profile
        if (user.instagram?.connected) {
          user.instagram.connected = false;
          await user.save();
        }
        
        return NextResponse.json({ 
          error: 'Token refresh failed - account disconnected',
          requiresReconnection: true,
          details: errorText
        }, { status: 401 });
      }
      
      return NextResponse.json({ 
        error: 'Failed to refresh token',
        details: errorText
      }, { status: 500 });
    }

    const refreshData = await refreshResponse.json();
    const newToken = refreshData.access_token;
    const expiresIn = refreshData.expires_in || 5184000; // 60 days default
    const newExpiryDate = new Date(Date.now() + expiresIn * 1000);

    console.log('Token refreshed successfully, new expiry:', newExpiryDate);

    // Update InstagramAccount with new token
    instagramAccount.accessToken = newToken;
    instagramAccount.tokenExpiresAt = newExpiryDate;
    instagramAccount.lastSyncAt = new Date();
    await instagramAccount.save();

    // Update User profile for consistency
    if (user.instagram) {
      user.instagram.accessToken = newToken;
      user.instagram.tokenExpiresAt = newExpiryDate;
      user.instagram.connected = true;
      await user.save();
    }

    // Fetch fresh profile data with new token
    try {
      const profileResponse = await fetch(
        `https://graph.facebook.com/v21.0/${instagramAccount.instagramId}?fields=id,username,media_count,followers_count,follows_count,profile_picture_url,biography,website&access_token=${newToken}`
      );

      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        
        // Update account with fresh data
        instagramAccount.username = profileData.username;
        instagramAccount.followersCount = profileData.followers_count || 0;
        instagramAccount.followingCount = profileData.follows_count || 0;
        instagramAccount.mediaCount = profileData.media_count || 0;
        instagramAccount.profilePictureUrl = profileData.profile_picture_url;
        instagramAccount.biography = profileData.biography;
        instagramAccount.website = profileData.website;
        await instagramAccount.save();

        // Update user profile too
        if (user.instagram) {
          user.instagram.username = profileData.username;
          user.instagram.followersCount = profileData.followers_count || 0;
          user.instagram.followingCount = profileData.follows_count || 0;
          user.instagram.mediaCount = profileData.media_count || 0;
          user.instagram.profilePictureUrl = profileData.profile_picture_url;
          user.instagram.biography = profileData.biography;
          await user.save();
        }
      }
    } catch (profileError) {
      console.log('Could not fetch fresh profile data, but token was refreshed successfully');
    }

    return NextResponse.json({
      success: true,
      message: 'Instagram token refreshed successfully',
      tokenExpiresAt: newExpiryDate,
      daysUntilExpiry: Math.ceil(expiresIn / (60 * 60 * 24)),
      account: {
        username: instagramAccount.username,
        followersCount: instagramAccount.followersCount,
        mediaCount: instagramAccount.mediaCount
      }
    });

  } catch (error) {
    console.error('Instagram token refresh error:', error);
    return NextResponse.json({ 
      error: 'Failed to refresh Instagram token',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint to check token status
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const instagramAccount = await InstagramAccount.findOne({ 
      userId: user._id, 
      isActive: true 
    });

    if (!instagramAccount) {
      return NextResponse.json({ 
        connected: false,
        error: 'Instagram account not connected' 
      });
    }

    const now = new Date();
    const tokenExpiryDate = new Date(instagramAccount.tokenExpiresAt);
    const daysUntilExpiry = Math.ceil((tokenExpiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = now > tokenExpiryDate;
    const needsRefresh = daysUntilExpiry <= 7;

    return NextResponse.json({
      connected: !isExpired,
      tokenExpiresAt: instagramAccount.tokenExpiresAt,
      daysUntilExpiry,
      isExpired,
      needsRefresh,
      account: {
        username: instagramAccount.username,
        followersCount: instagramAccount.followersCount
      }
    });

  } catch (error) {
    console.error('Token status check error:', error);
    return NextResponse.json({ 
      error: 'Failed to check token status',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
