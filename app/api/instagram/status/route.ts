import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { InstagramAccount } from '@/models/InstagramAccount';
import Content from '@/models/Content';
import { PublishJob } from '@/models/PublishJob';
import SocialAccount from '@/models/SocialAccount';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email && !session?.user?.name) {
      return NextResponse.json({ connected: false, error: 'Unauthorized' });
    }

    await connectDB();
    const user = await User.findOne({ 
      $or: [
        { email: session.user.email },
        { name: session.user.name, email: { $regex: /@facebook\.local$/ } }
      ]
    });
    
    if (!user) {
      return NextResponse.json({ connected: false, error: 'User not found' });
    }

    // First check User profile for Instagram connection
    if (user.instagram?.connected && user.instagram?.accessToken) {
      // Check if token is expired
      const isTokenExpired = user.instagram.tokenExpiresAt && new Date() > user.instagram.tokenExpiresAt;
      
      if (!isTokenExpired) {
        return NextResponse.json({
          connected: true,
          account: {
            username: user.instagram.username,
            instagramId: user.instagram.instagramId,
            accountType: user.instagram.accountType,
            profilePictureUrl: user.instagram.profilePictureUrl,
            followersCount: user.instagram.followersCount,
            followingCount: user.instagram.followingCount,
            mediaCount: user.instagram.mediaCount,
            biography: user.instagram.biography,
            connectedAt: user.instagram.connectedAt
          },
          source: 'user_profile'
        });
      } else {
        // Token expired, mark as disconnected in user profile
        user.instagram.connected = false;
        await user.save();
      }
    }
    
    // Get the user's Instagram account
    console.log('Looking for Instagram account for user:', { userId: user._id, email: user.email });
    const account = await InstagramAccount.findOne({ 
      userId: user._id, 
      isActive: true 
    });
    
    console.log('Instagram account found:', account ? { id: account._id, username: account.username, isActive: account.isActive } : 'None');
    
    if (!account) {
      return NextResponse.json({ connected: false });
    }

    // Check if token is expired or needs refresh (within 30 days)
    const now = new Date();
    const isTokenExpired = now > account.tokenExpiresAt;
    const daysUntilExpiry = Math.ceil((account.tokenExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const needsRefresh = daysUntilExpiry <= 30 && daysUntilExpiry > 0;

    // Auto-refresh token if it's close to expiry
    if (needsRefresh && !isTokenExpired) {
      console.log(`Instagram token expires in ${daysUntilExpiry} days, attempting auto-refresh...`);
      try {
        const refreshUrl = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${account.accessToken}`;
        const refreshResponse = await fetch(refreshUrl);
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          const newToken = refreshData.access_token;
          const expiresIn = refreshData.expires_in || 5184000; // 60 days default
          const newExpiryDate = new Date(Date.now() + expiresIn * 1000);
          
          // Update account with new token
          account.accessToken = newToken;
          account.tokenExpiresAt = newExpiryDate;
          account.lastSyncAt = new Date();
          await account.save();
          
          // Update user profile for consistency
          if (user.instagram) {
            user.instagram.accessToken = newToken;
            user.instagram.tokenExpiresAt = newExpiryDate;
            user.instagram.connected = true;
            await user.save();
          }
          
          console.log('Instagram token auto-refreshed successfully, new expiry:', newExpiryDate);
        } else {
          console.log('Auto-refresh failed, token may need manual reconnection');
        }
      } catch (refreshError) {
        console.log('Auto-refresh error:', refreshError);
      }
    }

    // Re-check expiry after potential refresh
    const finalIsTokenExpired = new Date() > account.tokenExpiresAt;

    // Fetch fresh account data to get real account type
    let freshAccountData = null;
    if (!finalIsTokenExpired) {
      try {
        const accountResponse = await fetch(
          `https://graph.facebook.com/v21.0/${account.instagramId}?fields=id,username,media_count,followers_count,follows_count,profile_picture_url,biography,website&access_token=${account.accessToken}`
        );
        
        if (accountResponse.ok) {
          freshAccountData = await accountResponse.json();
          
          // Try to fetch account type separately (optional)
          try {
            const accountTypeResponse = await fetch(
              `https://graph.facebook.com/v21.0/${account.instagramId}?fields=account_type&access_token=${account.accessToken}`
            );
            
            if (accountTypeResponse.ok) {
              const accountTypeData = await accountTypeResponse.json();
              freshAccountData.account_type = accountTypeData.account_type;
              console.log('Instagram status: Fresh account type fetched:', freshAccountData.account_type);
            } else {
              console.log('Instagram status: Account type not available');
              freshAccountData.account_type = account.accountType; // Use stored value
            }
          } catch (error) {
            console.log('Instagram status: Could not fetch account type');
            freshAccountData.account_type = account.accountType; // Use stored value
          }
          
          // Update stored account data
          const hasChanges = 
            (freshAccountData.account_type && freshAccountData.account_type !== account.accountType) ||
            (freshAccountData.followers_count !== account.followersCount) ||
            (freshAccountData.media_count !== account.mediaCount);
            
          if (hasChanges) {
            console.log(`Instagram status: Updating account data`);
            if (freshAccountData.account_type) account.accountType = freshAccountData.account_type;
            account.followersCount = freshAccountData.followers_count || account.followersCount;
            account.followingCount = freshAccountData.follows_count || account.followingCount;
            account.mediaCount = freshAccountData.media_count || account.mediaCount;
            account.profilePictureUrl = freshAccountData.profile_picture_url || account.profilePictureUrl;
            account.biography = freshAccountData.biography || account.biography;
            account.website = freshAccountData.website || account.website;
            account.lastSyncAt = new Date();
            await account.save();
          }
        }
      } catch (error) {
        console.log('Instagram status: Could not fetch fresh account data:', error);
      }
    }

    const response = { 
      connected: !finalIsTokenExpired, 
      account: {
        username: freshAccountData?.username || account.username,
        userId: account.instagramId,
        accountType: freshAccountData?.account_type || account.accountType,
        profilePictureUrl: freshAccountData?.profile_picture_url || account.profilePictureUrl,
        followersCount: freshAccountData?.followers_count || account.followersCount,
        followingCount: freshAccountData?.follows_count || account.followingCount,
        mediaCount: freshAccountData?.media_count || account.mediaCount,
        biography: freshAccountData?.biography || account.biography,
        website: freshAccountData?.website || account.website,
        connectedAt: account.createdAt,
        lastUpdated: account.updatedAt,
        tokenExpired: finalIsTokenExpired,
        tokenExpiresAt: account.tokenExpiresAt,
        daysUntilExpiry: Math.ceil((account.tokenExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error checking Instagram status:', error);
    return NextResponse.json({ connected: false, error: 'Failed to check status' });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email && !session?.user?.name) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ 
      $or: [
        { email: session.user.email },
        { name: session.user.name, email: { $regex: /@facebook\.local$/ } }
      ]
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (user.instagram) {
      user.instagram.connected = false;
      user.instagram.accessToken = undefined;
      user.instagram.refreshToken = undefined;
      user.instagram.tokenExpiresAt = undefined;
      user.instagram.instagramId = undefined;
      user.instagram.username = undefined;
      user.instagram.accountType = undefined;
      user.instagram.profilePictureUrl = undefined;
      user.instagram.followersCount = 0;
      user.instagram.followingCount = 0;
      user.instagram.mediaCount = 0;
      user.instagram.biography = undefined;
      user.instagram.connectedAt = undefined;
      await user.save();
    }

    await InstagramAccount.deleteMany({ userId: user._id });

    // Invalidate analytics cache
    try {
      const cacheResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/cache/invalidate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Cookie': request.headers.get('Cookie') || '',
        },
        body: JSON.stringify({ platform: 'instagram' }),
      });
      console.log('Instagram cache invalidation:', cacheResponse.ok ? 'Success' : 'Failed');
    } catch (error) {
      console.log('Instagram cache invalidation failed:', error);
    }

    await Promise.all([
      Content.deleteMany({ userId: user._id, platform: 'instagram' }),
      PublishJob.deleteMany({ userId: user._id.toString(), platform: 'instagram' }),
      SocialAccount.deleteMany({ userId: user._id, provider: 'instagram' }),
    ]);

    return NextResponse.json({ 
      success: true, 
      message: 'Instagram account disconnected successfully and data cleared' 
    });
  } catch (error) {
    console.error('Instagram disconnect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
