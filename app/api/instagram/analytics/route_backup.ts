import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { InstagramAccount } from '@/models/InstagramAccount';

export async function GET(request: NextRequest) {
  console.log('Analytics API called');
  try {
    const session = await getServerSession();
    console.log('Session check:', { hasSession: !!session, email: session?.user?.email });
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') as 'day' | 'week' | 'days_28' || 'week';

    await connectDB();
    const user = await User.findOne({ 
      email: session.user.email,
      // Only Google/GitHub users, not Facebook OAuth users
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
      return NextResponse.json({ error: 'Instagram token expired' }, { status: 401 });
    }

    // Get the correct Instagram Business Account by checking all pages
    async function getConnectedInstagram(access_token: string) {
      const pagesResp = await fetch(
        `https://graph.facebook.com/v21.0/me/accounts?access_token=${access_token}`
      );

      if (!pagesResp.ok) {
        throw new Error('Failed to fetch pages');
      }

      const pagesData = await pagesResp.json();

      for (const page of pagesData.data) {
        const r = await fetch(
          `https://graph.facebook.com/v21.0/${page.id}?fields=instagram_business_account&access_token=${access_token}`
        );

        if (r.ok) {
          const pageData = await r.json();
          if (pageData.instagram_business_account) {
            return {
              page_id: page.id,
              ig_user_id: pageData.instagram_business_account.id,
              page_access_token: page.access_token
            };
          }
        }
      }

      throw new Error("No IG business account found on any of the pages");
    }

    // Get the correct Instagram account dynamically
    let ig_user_id, page_access_token;
    try {
      const result = await getConnectedInstagram(instagramAccount.accessToken);
      ig_user_id = result.ig_user_id;
      page_access_token = result.page_access_token;
    } catch (error) {
      console.error('Error getting connected Instagram:', error);
      // Fallback to stored values if dynamic detection fails
      ig_user_id = instagramAccount.instagramId;
      page_access_token = instagramAccount.accessToken;
    }
    
    console.log('Detected Instagram account:', { ig_user_id, stored_id: instagramAccount.instagramId });

    const baseUrl = 'https://graph.facebook.com/v21.0';
    
    // Get fresh account info from the correct Instagram account
    let accountInfo = {
      username: instagramAccount.username,
      followers_count: instagramAccount.followersCount,
      following_count: instagramAccount.followingCount,
      media_count: instagramAccount.mediaCount,
      profile_picture_url: instagramAccount.profilePictureUrl,
      account_type: instagramAccount.accountType,
    };

    try {
      const accountResponse = await fetch(
        `${baseUrl}/${ig_user_id}?fields=id,username,media_count,followers_count,follows_count,profile_picture_url,biography,website&access_token=${page_access_token}`
      );
      
      if (accountResponse.ok) {
        const freshAccountData = await accountResponse.json();
        accountInfo = {
          username: freshAccountData.username,
          followers_count: freshAccountData.followers_count,
          following_count: freshAccountData.follows_count,
          media_count: freshAccountData.media_count,
          profile_picture_url: freshAccountData.profile_picture_url,
          account_type: 'BUSINESS',
        };
      }
    } catch (error) {
      console.log('Using stored account info:', error);
    }

    // Get recent media using the correct Instagram ID
    let recentMedia = [];
    try {
      const mediaResponse = await fetch(
        `${baseUrl}/${ig_user_id}/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,like_count,comments_count&limit=10&access_token=${page_access_token}`
      );
      
      if (mediaResponse.ok) {
        const mediaData = await mediaResponse.json();
        recentMedia = mediaData.data || [];
      }
    } catch (error) {
      console.log('Could not fetch recent media:', error);
      recentMedia = [];
    }

    // Get account insights using the correct Instagram ID
    let insights = {
      impressions: 0,
      reach: 0,
      profile_views: 0,
      website_clicks: 0,
      follower_count: accountInfo.followers_count,
    };

    try {
      const metrics = ['impressions', 'reach', 'profile_views'];
      const insightsResponse = await fetch(
        `${baseUrl}/${ig_user_id}/insights?metric=${metrics.join(',')}&period=days_28&access_token=${page_access_token}`
      );
      
      if (insightsResponse.ok) {
        const insightsData = await insightsResponse.json();
        console.log('Insights data:', insightsData);
        insightsData.data?.forEach((metric: any) => {
          insights[metric.name as keyof typeof insights] = metric.values[0]?.value || 0;
        });
      } else {
        console.log('Insights response not ok:', await insightsResponse.text());
      }
    } catch (error) {
      console.log('Could not fetch insights:', error);
    }

    // Calculate engagement rate
    const totalEngagement = recentMedia.reduce((sum: number, media: any) => 
      sum + (media.like_count || 0) + (media.comments_count || 0), 0
    );
    const totalReach = recentMedia.length > 0 ? accountInfo.followers_count * recentMedia.length : 1;
    const engagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;

    const analytics = {
      account: accountInfo,
      insights: {
        ...insights,
        engagement_rate: Math.round(engagementRate * 100) / 100,
      },
      recent_media: recentMedia.slice(0, 5), // Return top 5 recent posts
      period: period,
    };

    return NextResponse.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Instagram analytics error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
