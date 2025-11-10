import connectDB from '@/lib/db';
import User from '@/models/User';
import { InstagramAccount } from '@/models/InstagramAccount';

export async function getInstagramAnalytics(userEmail: string, period: string = 'month') {
  try {
    await connectDB();
    
    const user = await User.findOne({ email: userEmail });
    if (!user) {
      throw new Error('User not found');
    }

    const instagramAccount = await InstagramAccount.findOne({ userId: user._id, isActive: true });
    if (!instagramAccount) {
      throw new Error('Instagram account not connected');
    }

    if (instagramAccount.tokenExpiresAt && new Date() > instagramAccount.tokenExpiresAt) {
      throw new Error('Instagram token expired');
    }

    console.log('Direct Instagram Analytics: Starting fetch for', instagramAccount.username);

    // Use stored Instagram account data
    const ig_user_id = instagramAccount.instagramId;
    const page_access_token = instagramAccount.accessToken;

    if (!ig_user_id || !page_access_token) {
      throw new Error('Instagram account incomplete. Please reconnect.');
    }

    const baseUrl = 'https://graph.facebook.com/v21.0';
    
    // Get fresh account info from Instagram
    let accountInfo = {
      username: instagramAccount.username,
      followers_count: instagramAccount.followersCount || 0,
      following_count: instagramAccount.followingCount || 0,
      media_count: instagramAccount.mediaCount || 0,
      profile_picture_url: instagramAccount.profilePictureUrl || '',
      account_type: instagramAccount.accountType || 'BUSINESS',
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
          account_type: instagramAccount.accountType || 'BUSINESS', // Use stored account type
        };
        console.log('Direct Instagram Analytics: Fresh account data fetched');
        console.log('Direct Instagram Analytics: Using stored account type:', instagramAccount.accountType);
      }
    } catch (error) {
      console.log('Direct Instagram Analytics: Could not fetch fresh account data, using stored data');
    }

    // Get recent media
    let recentMedia = [];
    try {
      const mediaResponse = await fetch(
        `${baseUrl}/${ig_user_id}/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,like_count,comments_count&limit=5&access_token=${page_access_token}`
      );
      
      if (mediaResponse.ok) {
        const mediaData = await mediaResponse.json();
        recentMedia = mediaData.data || [];
        console.log('Direct Instagram Analytics: Recent media fetched:', recentMedia.length, 'posts');
      }
    } catch (error) {
      console.log('Direct Instagram Analytics: Could not fetch recent media');
    }

    // Get basic insights
    let insights = {
      reach: 0,
      impressions: 0,
      follower_count: accountInfo.followers_count,
      website_clicks: 0,
      profile_views: 0,
      accounts_engaged: 0,
      total_interactions: 0,
      likes: 0,
      comments: 0,
      shares: 0,
      saves: 0,
      engagement_rate: 0,
    };

    // Normalize period for Instagram API (reach metric supports day/week/days_28)
    const normalizedPeriod = period === 'lifetime' ? 'days_28' : period === 'month' ? 'days_28' : period;

    // Try to get account-level insights for the period
    // Note: Only use 'reach' metric - profile_views requires metric_type parameter
    try {
      console.log('Direct Instagram Analytics: Fetching insights...');
      const accountInsightsResponse = await fetch(
        `${baseUrl}/${ig_user_id}/insights?metric=reach&period=${normalizedPeriod}&access_token=${page_access_token}`
      );
      
      if (accountInsightsResponse.ok) {
        const accountInsightsData = await accountInsightsResponse.json();
        console.log('Direct Instagram Analytics: Account insights fetched:', accountInsightsData);
        
        accountInsightsData.data?.forEach((metric: any) => {
          const value = metric.values[0]?.value || 0;
          console.log(`Direct Instagram Analytics: ${metric.name} = ${value}`);
          if (metric.name === 'reach') insights.reach = value;
        });
      } else {
        const errorText = await accountInsightsResponse.text();
        console.log('Direct Instagram Analytics: Account insights failed:', errorText);
      }
    } catch (error) {
      console.log('Direct Instagram Analytics: Account insights error:', error);
    }

    // If account insights failed, try lifetime insights (28 days)
    if (insights.reach === 0) {
      try {
        console.log('Direct Instagram Analytics: Trying lifetime insights (28 days)...');
        const lifetimeInsightsResponse = await fetch(
          `${baseUrl}/${ig_user_id}/insights?metric=reach&period=days_28&access_token=${page_access_token}`
        );
        
        if (lifetimeInsightsResponse.ok) {
          const lifetimeInsightsData = await lifetimeInsightsResponse.json();
          console.log('Direct Instagram Analytics: Lifetime insights fetched:', lifetimeInsightsData);
          
          lifetimeInsightsData.data?.forEach((metric: any) => {
            const value = metric.values?.[0]?.value || 0;
            console.log(`Direct Instagram Analytics: ${metric.name} (28 days) = ${value}`);
            if (metric.name === 'reach') insights.reach = value;
          });
        } else {
          const errorText = await lifetimeInsightsResponse.text();
          console.log('Direct Instagram Analytics: Lifetime insights failed:', errorText);
        }
      } catch (error) {
        console.log('Direct Instagram Analytics: Lifetime insights error:', error);
      }
    }

    // Get insights from recent media if account insights are not available
    if (insights.reach === 0 && recentMedia.length > 0) {
      console.log('Direct Instagram Analytics: Trying media-level insights...');
      let mediaReach = 0;
      let mediaImpressions = 0;
      
      for (const media of recentMedia.slice(0, 10)) { // Check last 10 posts
        try {
          const mediaInsightsResponse = await fetch(
            `${baseUrl}/${media.id}/insights?metric=reach,impressions&access_token=${page_access_token}`
          );
          
          if (mediaInsightsResponse.ok) {
            const mediaInsightsData = await mediaInsightsResponse.json();
            mediaInsightsData.data?.forEach((metric: any) => {
              const value = metric.values[0]?.value || 0;
              if (metric.name === 'reach') mediaReach += value;
              if (metric.name === 'impressions') mediaImpressions += value;
            });
          }
        } catch (error) {
          // Continue with next media if this one fails
        }
      }
      
      if (mediaReach > 0) {
        insights.reach = mediaReach;
        insights.impressions = mediaImpressions;
        console.log(`Direct Instagram Analytics: Media insights - Reach: ${mediaReach}, Impressions: ${mediaImpressions}`);
      }
    }

    // Calculate engagement rate from recent media
    const totalEngagement = recentMedia.reduce((sum: number, media: any) => 
      sum + (media.like_count || 0) + (media.comments_count || 0), 0
    );
    const avgEngagement = recentMedia.length > 0 ? totalEngagement / recentMedia.length : 0;
    const engagementRate = accountInfo.followers_count > 0 ? (avgEngagement / accountInfo.followers_count) * 100 : 0;

    insights.engagement_rate = engagementRate;
    insights.total_interactions = totalEngagement;

    // If we still don't have reach data, estimate it based on engagement and followers
    if (insights.reach === 0 && totalEngagement > 0) {
      // Estimate reach as 2-5x the total engagement (typical Instagram reach-to-engagement ratio)
      const estimatedReach = Math.round(totalEngagement * 3);
      insights.reach = estimatedReach;
      console.log(`Direct Instagram Analytics: Estimated reach based on engagement: ${estimatedReach}`);
    }

    // If we still don't have impressions, estimate as 1.5x reach
    if (insights.impressions === 0 && insights.reach > 0) {
      insights.impressions = Math.round(insights.reach * 1.5);
    }

    const analytics = {
      account: accountInfo,
      insights: insights,
      recent_media: recentMedia,
      period: period,
    };

    console.log('Direct Instagram Analytics: Completed successfully');
    console.log('Direct Instagram Analytics: Key metrics:', {
      reach: insights.reach,
      impressions: insights.impressions,
      followers: accountInfo.followers_count,
      posts: accountInfo.media_count,
      engagement_rate: engagementRate.toFixed(2) + '%'
    });

    return analytics;
  } catch (error) {
    console.error('Direct Instagram Analytics error:', error);
    throw error;
  }
}
