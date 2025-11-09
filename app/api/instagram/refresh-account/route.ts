import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { InstagramAccount } from '@/models/InstagramAccount';

export async function POST() {
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

    const instagramAccount = await InstagramAccount.findOne({ userId: user._id, isActive: true });
    if (!instagramAccount) {
      return NextResponse.json({ error: 'Instagram account not connected' }, { status: 404 });
    }

    console.log('Refreshing Instagram account data for:', instagramAccount.username);

    // Fetch fresh account data from Instagram API
    try {
      const accountResponse = await fetch(
        `https://graph.facebook.com/v21.0/${instagramAccount.instagramId}?fields=id,username,media_count,followers_count,follows_count,profile_picture_url,biography,website&access_token=${instagramAccount.accessToken}`
      );

      if (accountResponse.ok) {
        const freshData = await accountResponse.json();
        
        // Try to fetch account type separately (optional)
        let accountType = instagramAccount.accountType || 'BUSINESS';
        try {
          const accountTypeResponse = await fetch(
            `https://graph.facebook.com/v21.0/${instagramAccount.instagramId}?fields=account_type&access_token=${instagramAccount.accessToken}`
          );
          
          if (accountTypeResponse.ok) {
            const accountTypeData = await accountTypeResponse.json();
            accountType = accountTypeData.account_type || accountType;
          }
        } catch (error) {
          console.log('Could not fetch account type, keeping existing:', accountType);
        }

        console.log('Fresh Instagram data received:', {
          username: freshData.username,
          account_type: accountType,
          followers: freshData.followers_count
        });

        // Update account with fresh data
        instagramAccount.username = freshData.username;
        instagramAccount.accountType = accountType;
        instagramAccount.followersCount = freshData.followers_count || 0;
        instagramAccount.followingCount = freshData.follows_count || 0;
        instagramAccount.mediaCount = freshData.media_count || 0;
        instagramAccount.profilePictureUrl = freshData.profile_picture_url;
        instagramAccount.biography = freshData.biography;
        instagramAccount.website = freshData.website;
        instagramAccount.lastSyncAt = new Date();

        await instagramAccount.save();

        console.log('Instagram account refreshed successfully with account type:', freshData.account_type);

        return NextResponse.json({
          success: true,
          message: 'Instagram account data refreshed successfully',
          accountType: freshData.account_type,
          data: {
            username: freshData.username,
            accountType: freshData.account_type,
            followersCount: freshData.followers_count,
            followingCount: freshData.follows_count,
            mediaCount: freshData.media_count
          }
        });
      } else {
        const errorText = await accountResponse.text();
        console.error('Instagram API error:', errorText);
        return NextResponse.json({ 
          error: 'Failed to fetch fresh Instagram data',
          details: errorText
        }, { status: 400 });
      }
    } catch (fetchError) {
      console.error('Instagram refresh fetch error:', fetchError);
      return NextResponse.json({ 
        error: 'Failed to connect to Instagram API',
        details: fetchError instanceof Error ? fetchError.message : 'Unknown error'
      }, { status: 500 });
    }
  } catch (error) {
    console.error('Instagram refresh error:', error);
    return NextResponse.json({ 
      error: 'Failed to refresh Instagram account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
