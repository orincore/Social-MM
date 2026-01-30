import { NextRequest, NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import { InstagramAccount } from '@/models/InstagramAccount';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    // Verify this is a legitimate cron request
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await dbConnect();
    
    console.log('Starting Instagram token refresh job...');
    
    // Find all Instagram accounts that need token refresh (expire within 30 days)
    // Instagram recommends refreshing tokens before they expire to maintain continuous access
    const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    
    const accountsNeedingRefresh = await InstagramAccount.find({
      isActive: true,
      tokenExpiresAt: { $lte: thirtyDaysFromNow }
    }).populate('userId');

    console.log(`Found ${accountsNeedingRefresh.length} Instagram accounts needing token refresh`);

    const results = {
      total: accountsNeedingRefresh.length,
      refreshed: 0,
      failed: 0,
      errors: [] as string[]
    };

    for (const account of accountsNeedingRefresh) {
      try {
        console.log(`Refreshing token for Instagram account: ${account.username}`);
        
        // Calculate days until expiry
        const now = new Date();
        const daysUntilExpiry = Math.ceil((account.tokenExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        console.log(`Token expires in ${daysUntilExpiry} days`);

        // Skip if token is already expired (requires manual reconnection)
        if (daysUntilExpiry < 0) {
          console.log(`Token already expired for ${account.username}, marking as inactive`);
          account.isActive = false;
          await account.save();
          
          // Also update user profile
          const user = await User.findById(account.userId);
          if (user?.instagram?.connected) {
            user.instagram.connected = false;
            await user.save();
          }
          
          results.failed++;
          results.errors.push(`${account.username}: Token expired, marked as inactive`);
          continue;
        }

        // Refresh the long-lived token
        const refreshUrl = `https://graph.instagram.com/refresh_access_token?grant_type=ig_refresh_token&access_token=${account.accessToken}`;
        
        const refreshResponse = await fetch(refreshUrl);
        
        if (!refreshResponse.ok) {
          const errorText = await refreshResponse.text();
          console.error(`Token refresh failed for ${account.username}:`, errorText);
          
          // If token is invalid, mark account as disconnected
          if (refreshResponse.status === 400 || refreshResponse.status === 401) {
            account.isActive = false;
            await account.save();
            
            // Also update user profile
            const user = await User.findById(account.userId);
            if (user?.instagram?.connected) {
              user.instagram.connected = false;
              await user.save();
            }
          }
          
          results.failed++;
          results.errors.push(`${account.username}: ${errorText}`);
          continue;
        }

        const refreshData = await refreshResponse.json();
        const newToken = refreshData.access_token;
        const expiresIn = refreshData.expires_in || 5184000; // 60 days default
        const newExpiryDate = new Date(Date.now() + expiresIn * 1000);

        console.log(`Token refreshed successfully for ${account.username}, new expiry: ${newExpiryDate}`);

        // Update InstagramAccount with new token
        account.accessToken = newToken;
        account.tokenExpiresAt = newExpiryDate;
        account.lastSyncAt = new Date();
        await account.save();

        // Update User profile for consistency
        const user = await User.findById(account.userId);
        if (user?.instagram) {
          user.instagram.accessToken = newToken;
          user.instagram.tokenExpiresAt = newExpiryDate;
          user.instagram.connected = true;
          await user.save();
        }

        results.refreshed++;

        // Optional: Fetch fresh profile data with new token
        try {
          const profileResponse = await fetch(
            `https://graph.facebook.com/v21.0/${account.instagramId}?fields=id,username,media_count,followers_count,follows_count,profile_picture_url,biography,website&access_token=${newToken}`
          );

          if (profileResponse.ok) {
            const profileData = await profileResponse.json();
            
            // Update account with fresh data
            account.username = profileData.username;
            account.followersCount = profileData.followers_count || 0;
            account.followingCount = profileData.follows_count || 0;
            account.mediaCount = profileData.media_count || 0;
            account.profilePictureUrl = profileData.profile_picture_url;
            account.biography = profileData.biography;
            account.website = profileData.website;
            await account.save();

            // Update user profile too
            if (user?.instagram) {
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
          console.log(`Could not fetch fresh profile data for ${account.username}, but token was refreshed successfully`);
        }

      } catch (error) {
        console.error(`Error refreshing token for ${account.username}:`, error);
        results.failed++;
        results.errors.push(`${account.username}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log('Instagram token refresh job completed:', results);

    return NextResponse.json({
      success: true,
      message: 'Instagram token refresh job completed',
      results
    });

  } catch (error) {
    console.error('Instagram token refresh job error:', error);
    return NextResponse.json({ 
      error: 'Failed to refresh Instagram tokens',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET endpoint for manual trigger (development/testing)
export async function GET() {
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json({ error: 'Manual trigger only available in development' }, { status: 403 });
  }
  
  // Create a mock request with the cron secret
  const mockRequest = new Request('http://localhost:3000/api/cron/refresh-instagram-tokens', {
    method: 'POST',
    headers: {
      'authorization': `Bearer ${process.env.CRON_SECRET}`
    }
  });
  
  return POST(mockRequest as NextRequest);
}
