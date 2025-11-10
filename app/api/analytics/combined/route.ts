import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { InstagramAccount } from '@/models/InstagramAccount';
import { YouTubeAccount } from '@/models/YouTubeAccount';
import { withCache } from '@/lib/analytics-cache';
import { getInstagramAnalytics } from '@/lib/instagram-analytics';

function computeBestTime(content: any[], timestampKey: 'timestamp' | 'publishedAt') {
  if (!content || content.length === 0) return null;

  const buckets: Record<string, { weekdayIndex: number; weekday: string; hour: number; totalEngagement: number; count: number }> = {};
  const weekDays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  content.forEach(item => {
    const rawTimestamp = item[timestampKey];
    if (!rawTimestamp) return;
    const date = new Date(rawTimestamp);
    if (Number.isNaN(date.getTime())) return;

    const weekdayIndex = date.getUTCDay();
    const hour = date.getUTCHours();
    const key = `${weekdayIndex}-${hour}`;
    const engagement = (item.engagement || 0) + (item.likes || 0) + (item.comments || 0) + (item.views || 0);

    if (!buckets[key]) {
      buckets[key] = {
        weekdayIndex,
        weekday: weekDays[weekdayIndex],
        hour,
        totalEngagement: 0,
        count: 0,
      };
    }

    buckets[key].totalEngagement += engagement;
    buckets[key].count += 1;
  });

  const bucketList = Object.values(buckets);
  if (bucketList.length === 0) return null;

  const bestBucket = bucketList.reduce((best, current) => {
    const bestAvg = best.totalEngagement / best.count;
    const currentAvg = current.totalEngagement / current.count;
    if (currentAvg > bestAvg) return current;
    if (currentAvg === bestAvg && current.count > best.count) return current;
    return best;
  }, bucketList[0]);

  return {
    weekday: bestBucket.weekday,
    hour: bestBucket.hour,
    hourFormatted: formatHour(bestBucket.hour),
    timezone: 'UTC',
    averageEngagement: Math.round(bestBucket.totalEngagement / bestBucket.count),
    sampleSize: bestBucket.count,
  };
}

function formatHour(hour: number) {
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const normalized = hour % 12 === 0 ? 12 : hour % 12;
  return `${normalized}:00 ${suffix}`;
}

function computeCommentStats(content: any[]) {
  if (!content || content.length === 0) {
    return {
      total: 0,
      average: 0,
      sampleSize: 0,
      topCommented: null,
    };
  }

  const total = content.reduce((sum, item) => sum + (item.comments || 0), 0);
  const average = total / content.length;

  const topCommentedItem = content
    .slice()
    .sort((a, b) => (b.comments || 0) - (a.comments || 0))[0];

  return {
    total,
    average: Math.round(average * 10) / 10,
    sampleSize: content.length,
    topCommented: topCommentedItem ? {
      id: topCommentedItem.id,
      title: topCommentedItem.title || topCommentedItem.caption || 'Untitled',
      comments: topCommentedItem.comments || 0,
      url: topCommentedItem.url || topCommentedItem.permalink || null,
    } : null,
  };
}

export async function GET(request: NextRequest) {
  console.log('Combined Analytics API called');
  
  try {
    // Check session
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const customStartDate = searchParams.get('startDate');
    const customEndDate = searchParams.get('endDate');
    const forceRefresh = searchParams.get('refresh') === 'true';

    // Use cache if not forcing refresh
    if (!forceRefresh) {
      const cacheResult = await withCache(
        {
          userId: session.user.email,
          platform: 'combined',
          period,
          customStartDate: customStartDate || undefined,
          customEndDate: customEndDate || undefined,
          ttlMinutes: 30, // Cache for 30 minutes
          staleMinutes: 10, // Consider stale after 10 minutes
        },
        async () => {
          return await fetchCombinedAnalytics(request, session.user!.email!, period, customStartDate, customEndDate);
        }
      );

      return NextResponse.json({ 
        success: true, 
        data: cacheResult.data,
        fromCache: cacheResult.fromCache,
        isStale: cacheResult.isStale,
        generatedAt: new Date().toISOString()
      });
    }

    // Force refresh - fetch fresh data
    const freshData = await fetchCombinedAnalytics(request, session.user.email, period, customStartDate, customEndDate);
    
    console.log('Combined Analytics returned successfully');
    return NextResponse.json({ 
      success: true, 
      data: freshData,
      fromCache: false,
      isStale: false,
      generatedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Combined Analytics error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch combined analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

async function fetchCombinedAnalytics(
  request: NextRequest, 
  userEmail: string, 
  period: string, 
  customStartDate: string | null, 
  customEndDate: string | null
) {
  await connectDB();
  const user = await User.findOne({ email: userEmail });
  if (!user) {
    throw new Error('User not found');
  }

  // Check platform connections directly from database
  const instagramAccount = await InstagramAccount.findOne({ userId: user._id, isActive: true });
  const youtubeAccount = await YouTubeAccount.findOne({ userId: user._id, isActive: true });
  
  console.log('Combined Analytics: Platform connections found:', {
    instagram: instagramAccount ? instagramAccount.username : 'None',
    youtube: youtubeAccount ? youtubeAccount.channelTitle : 'None'
  });

  let instagramData: any = null;
  let instagramError: string | null = null;
  let youtubeData: any = null;
  let youtubeError: string | null = null;

  // Build query params for individual platform APIs
  const queryParams = new URLSearchParams({
    period,
    ...(customStartDate && { startDate: customStartDate }),
    ...(customEndDate && { endDate: customEndDate }),
  });

  // Compute internal base URL for same-origin API calls.
  const host = request.headers.get('host') || 'localhost:3000';
  const internalBase = process.env.VERCEL ? `https://${host}` : 'http://127.0.0.1:3000';

  // Fetch both platforms in parallel
  const fetchPromises = [];

  if (instagramAccount) {
    console.log('Combined Analytics: Fetching Instagram analytics for account:', instagramAccount.username);
    fetchPromises.push(
      getInstagramAnalytics(userEmail, period)
        .then(data => {
          instagramData = data;
          console.log('Combined Analytics: Instagram analytics data received:', {
            hasData: !!data,
            followers: data?.account?.followers_count,
            reach: data?.insights?.reach,
            posts: data?.account?.media_count
          });
        })
        .catch(error => {
          console.log('Combined Analytics: Instagram analytics failed:', error);
          instagramError = error instanceof Error ? error.message : 'Unknown error';
        })
    );
  } else {
    console.log('Combined Analytics: No Instagram account found');
  }

  if (youtubeAccount) {
    console.log('Combined Analytics: Fetching YouTube analytics for account:', youtubeAccount.channelTitle);
    fetchPromises.push(
      fetch(`${internalBase}/api/youtube/analytics?${queryParams}`, {
        headers: {
          'Cookie': request.headers.get('Cookie') || '',
        },
      })
        .then(async ytResponse => {
          if (ytResponse.ok) {
            const ytResult = await ytResponse.json();
            youtubeData = ytResult.data;
            console.log('Combined Analytics: YouTube analytics data received');
          } else {
            youtubeError = await ytResponse.text();
            console.log('Combined Analytics: YouTube analytics error:', youtubeError);
          }
        })
        .catch(error => {
          console.log('Combined Analytics: YouTube analytics failed:', error);
          youtubeError = error instanceof Error ? error.message : 'Unknown error';
        })
    );
  } else {
    console.log('Combined Analytics: No YouTube account found');
  }

  // Wait for all platform analytics to complete
  if (fetchPromises.length > 0) {
    await Promise.all(fetchPromises);
    console.log('Combined Analytics: All platform data fetched');
  }

  // If both platforms failed, throw error
  if (!instagramData && !youtubeData) {
    throw new Error('No platform data available');
  }

  // Normalize and combine data
  const instagramRecentContent = instagramData?.recent_media?.map((media: any) => ({
    id: media.id,
    caption: media.caption,
    mediaType: media.media_type,
    mediaUrl: media.media_url,
    thumbnailUrl: media.thumbnail_url || media.media_url,
    permalink: media.permalink,
    timestamp: media.timestamp,
    likes: media.like_count || 0,
    comments: media.comments_count || 0,
    engagement: (media.like_count || 0) + (media.comments_count || 0),
  })) || [];

  const instagramTopContent = instagramRecentContent
    .slice()
    .sort((a: Record<string, any>, b: Record<string, any>) => (b.engagement || 0) - (a.engagement || 0))
    .slice(0, 3);

  const instagramBestTime = computeBestTime(instagramRecentContent, 'timestamp');
  const instagramCommentStats = computeCommentStats(instagramRecentContent);

  const instagramMetrics = instagramData ? (() => {
    const totalPosts = instagramData.account?.media_count || 0;
    const followers = instagramData.account?.followers_count || 0;
    const reach = instagramData.insights?.reach || 0;
    const impressions = instagramData.insights?.impressions || 0;
    const totalEngagement = instagramData.insights?.total_interactions || 0;
    const engagementRate = instagramData.insights?.engagement_rate || 0;
    const totalLikesRecent = instagramRecentContent.reduce((sum: number, item: Record<string, any>) => sum + (item.likes || 0), 0);
    const totalCommentsRecent = instagramRecentContent.reduce((sum: number, item: Record<string, any>) => sum + (item.comments || 0), 0);
    const avgLikesRecent = instagramRecentContent.length > 0
      ? Math.round(totalLikesRecent / instagramRecentContent.length)
      : 0;
    const avgCommentsRecent = instagramRecentContent.length > 0
      ? Math.round(totalCommentsRecent / instagramRecentContent.length)
      : 0;

    return {
      totalPosts,
      followers,
      reach,
      impressions,
      engagementRate,
      totalEngagement,
      avgLikes: avgLikesRecent,
      avgComments: avgCommentsRecent,
      totalLikes: totalLikesRecent,
      totalComments: totalCommentsRecent,
      estimatedReach: reach,
      lifetimeTotals: {
        posts: totalPosts,
        followers,
      },
    };
  })() : null;

  const youtubeRecentContent = youtubeData?.recentVideos?.map((video: any) => ({
    id: video.id,
    title: video.title,
    description: video.description,
    thumbnailUrl: video.thumbnail,
    views: parseInt(video.views ?? video.statistics?.viewCount ?? '0', 10),
    likes: parseInt(video.likes ?? video.statistics?.likeCount ?? '0', 10),
    comments: parseInt(video.comments ?? video.statistics?.commentCount ?? '0', 10),
    publishedAt: video.publishedAt,
    url: `https://www.youtube.com/watch?v=${video.id}`,
  })) || [];

  const youtubeTopContent = (youtubeData?.topVideos?.map((video: any) => ({
    id: video.id,
    title: video.title,
    thumbnailUrl: video.thumbnail,
    views: video.views || 0,
    likes: video.likes || 0,
    comments: video.comments || 0,
    publishedAt: video.publishedAt,
    url: `https://www.youtube.com/watch?v=${video.id}`,
  })) || youtubeRecentContent.slice())
    .slice(0, 5);

  const youtubeBestTime = computeBestTime(youtubeRecentContent, 'publishedAt');
  const youtubeCommentStats = computeCommentStats(youtubeRecentContent);

  const youtubeMetrics = youtubeData ? (() => {
    const totalVideos = youtubeData.channel?.videoCount || 0;
    const subscribers = youtubeData.channel?.subscriberCount || 0;
    const analyticsViews = youtubeData.analytics?.views || 0;
    const watchTime = youtubeData.analytics?.estimatedMinutesWatched || 0;
    const averageViewDuration = youtubeData.analytics?.averageViewDuration || 0;
    const subscribersGained = youtubeData.analytics?.subscribersGained || 0;
    const subscribersLost = youtubeData.analytics?.subscribersLost || 0;
    const impressions = youtubeData.analytics?.impressions || 0;
    const ctr = youtubeData.analytics?.impressionClickThroughRate || 0;
    const totalChannelViews = parseInt(youtubeData.channel?.viewCount || '0', 10);
    const totalLikesRecent = youtubeRecentContent.reduce((sum: number, item: Record<string, any>) => sum + (item.likes || 0), 0);
    const totalCommentsRecent = youtubeRecentContent.reduce((sum: number, item: Record<string, any>) => sum + (item.comments || 0), 0);
    const aggregatedLikes = (youtubeData.analytics?.likes || 0) + totalLikesRecent;
    const aggregatedComments = (youtubeData.analytics?.comments || 0) + totalCommentsRecent;

    const avgViewsRecent = youtubeRecentContent.length > 0
      ? Math.round(youtubeRecentContent.reduce((sum: number, item: Record<string, any>) => sum + (item.views || 0), 0) / youtubeRecentContent.length)
      : 0;
    const avgViewsLifetime = totalVideos > 0 ? Math.round(totalChannelViews / totalVideos) : 0;
    const avgLikesRecent = youtubeRecentContent.length > 0
      ? Math.round(totalLikesRecent / youtubeRecentContent.length)
      : 0;

    return {
      totalVideos,
      subscribers,
      views: analyticsViews,
      watchTime,
      averageViewDuration,
      subscribersGained,
      subscribersLost,
      impressions,
      ctr,
      avgViews: avgViewsRecent || avgViewsLifetime,
      avgLikes: avgLikesRecent,
      totalLikes: aggregatedLikes,
      totalComments: aggregatedComments,
      engagementRate: youtubeData.analytics?.engagementRate || 0,
      lifetimeTotals: {
        views: totalChannelViews,
        comments: aggregatedComments,
        likes: aggregatedLikes,
      },
    };
  })() : null;

  const combinedAnalytics = {
    platforms: {
      instagram: {
        connected: !!instagramData,
        error: instagramError,
        data: instagramData ? {
          account: {
            username: instagramData.account?.username,
            followers: instagramData.account?.followers_count || 0,
            following: instagramData.account?.following_count || 0,
            posts: instagramData.account?.media_count || 0,
            profilePicture: instagramData.account?.profile_picture_url,
          },
          metrics: instagramMetrics,
          recentContent: instagramRecentContent,
          topContent: instagramTopContent,
          commentStats: instagramCommentStats,
          bestTime: instagramBestTime,
        } : null,
      },
      youtube: {
        connected: !!youtubeData,
        error: youtubeError,
        data: youtubeData ? {
          channel: {
            title: youtubeData.channel?.channelTitle,
            subscribers: youtubeData.channel?.subscriberCount || 0,
            videos: youtubeData.channel?.videoCount || 0,
            totalViews: youtubeData.channel?.viewCount || 0,
            thumbnail: youtubeData.channel?.thumbnailUrl,
            handle: youtubeData.channel?.channelHandle,
          },
          metrics: youtubeMetrics,
          recentContent: youtubeRecentContent,
          topContent: youtubeTopContent,
          commentStats: youtubeCommentStats,
          bestTime: youtubeBestTime,
        } : null,
      },
    },

    comparison: {
      audience: {
        instagram: instagramMetrics?.followers || 0,
        youtube: youtubeMetrics?.subscribers || 0,
        total: (instagramMetrics?.followers || 0) + (youtubeMetrics?.subscribers || 0),
      },
      reach: {
        instagram: instagramMetrics?.reach || 0,
        youtube: youtubeMetrics?.views || 0,
        total: (instagramMetrics?.reach || 0) + (youtubeMetrics?.views || 0),
      },
      engagement: {
        instagram: {
          total: instagramMetrics?.totalEngagement || 0,
          rate: instagramMetrics?.engagementRate || 0,
        },
        youtube: {
          total: (youtubeMetrics?.totalLikes || 0) + (youtubeMetrics?.totalComments || 0),
          rate: youtubeMetrics?.engagementRate || 0,
        },
      },
      content: {
        instagram: {
          posts: instagramMetrics?.totalPosts || 0,
          recent: instagramRecentContent.length,
        },
        youtube: {
          videos: youtubeMetrics?.totalVideos || 0,
          recent: youtubeRecentContent.length,
        },
      },
    },

    timeSeries: {
      instagram: {},
      youtube: youtubeData?.timeSeriesData || [],
      combined: combineTimeSeries({}, youtubeData?.timeSeriesData || []),
    },

    insights: generateCombinedInsights(instagramData, youtubeData),

    period,
    dateRange: youtubeData?.dateRange || {
      startDate: customStartDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      endDate: customEndDate || new Date().toISOString().split('T')[0],
    },
    generatedAt: new Date().toISOString(),
  };

  return combinedAnalytics;
}

// Helper function to combine time series data from both platforms
function combineTimeSeries(instagramTimeSeries: any, youtubeTimeSeries: any[]): any[] {
  const combined: { [date: string]: any } = {};

  // Process Instagram time series
  if (instagramTimeSeries.reach) {
    instagramTimeSeries.reach.forEach((item: any) => {
      const date = item.date?.split('T')[0] || new Date().toISOString().split('T')[0];
      if (!combined[date]) combined[date] = { date };
      combined[date].instagramReach = item.value || 0;
    });
  }

  // Process YouTube time series
  youtubeTimeSeries.forEach((item: any) => {
    const date = item.date;
    if (!combined[date]) combined[date] = { date };
    combined[date].youtubeViews = item.views || 0;
    combined[date].youtubeWatchTime = item.estimatedMinutesWatched || 0;
    combined[date].youtubeSubscribers = item.subscribersGained || 0;
  });

  // Convert to array and sort by date
  return Object.values(combined).sort((a: any, b: any) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

// Helper function to generate combined insights
function generateCombinedInsights(instagramData: any, youtubeData: any): any {
  const insights = [];

  // Platform performance comparison
  if (instagramData && youtubeData) {
    const igEngagementRate = instagramData.insights?.engagement_rate || 0;
    const ytEngagementRate = youtubeData.analytics?.engagementRate || 0;
    
    if (igEngagementRate > ytEngagementRate) {
      insights.push({
        type: 'performance',
        title: 'Instagram outperforming YouTube',
        description: `Instagram has ${(igEngagementRate - ytEngagementRate).toFixed(2)}% higher engagement rate`,
        recommendation: 'Consider adapting successful Instagram content strategies for YouTube'
      });
    } else if (ytEngagementRate > igEngagementRate) {
      insights.push({
        type: 'performance',
        title: 'YouTube outperforming Instagram',
        description: `YouTube has ${(ytEngagementRate - igEngagementRate).toFixed(2)}% higher engagement rate`,
        recommendation: 'Consider adapting successful YouTube content strategies for Instagram'
      });
    }
  }

  // Audience growth insights
  if (youtubeData?.analytics?.subscribersGained > 0) {
    insights.push({
      type: 'growth',
      title: 'YouTube subscriber growth',
      description: `Gained ${youtubeData.analytics.subscribersGained} subscribers in this period`,
      recommendation: 'Maintain consistent upload schedule to sustain growth'
    });
  }

  if (instagramData?.insights?.reach > 0) {
    insights.push({
      type: 'reach',
      title: 'Instagram reach performance',
      description: `Reached ${instagramData.insights.reach.toLocaleString()} unique accounts`,
      recommendation: 'Use trending hashtags and post at optimal times to increase reach'
    });
  }

  return insights;
}
