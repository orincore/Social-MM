import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { InstagramAccount } from '@/models/InstagramAccount';
import { YouTubeAccount } from '@/models/YouTubeAccount';
import { withCache } from '@/lib/analytics-cache';
import { getInstagramAnalytics } from '@/lib/instagram-analytics';

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
          metrics: {
            reach: instagramData.insights?.reach || 0,
            impressions: instagramData.insights?.impressions || 0,
            profileViews: instagramData.insights?.profile_views || 0,
            websiteClicks: instagramData.insights?.website_clicks || 0,
            engagement: {
              total: instagramData.insights?.total_interactions || 0,
              likes: instagramData.insights?.likes || 0,
              comments: instagramData.insights?.comments || 0,
              shares: instagramData.insights?.shares || 0,
              saves: instagramData.insights?.saves || 0,
              rate: instagramData.insights?.engagement_rate || 0,
            }
          },
          recentContent: instagramData.recent_media?.slice(0, 5) || [],
          topContent: [],
        } : null
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
          metrics: {
            views: youtubeData.analytics?.views || 0,
            watchTime: youtubeData.analytics?.estimatedMinutesWatched || 0,
            averageViewDuration: youtubeData.analytics?.averageViewDuration || 0,
            subscribersGained: youtubeData.analytics?.subscribersGained || 0,
            subscribersLost: youtubeData.analytics?.subscribersLost || 0,
            impressions: youtubeData.analytics?.impressions || 0,
            ctr: youtubeData.analytics?.impressionClickThroughRate || 0,
            engagement: {
              likes: youtubeData.analytics?.likes || 0,
              dislikes: youtubeData.analytics?.dislikes || 0,
              comments: youtubeData.analytics?.comments || 0,
              shares: youtubeData.analytics?.shares || 0,
              rate: youtubeData.analytics?.engagementRate || 0,
            }
          },
          recentContent: youtubeData.recentVideos?.slice(0, 5) || [],
          topContent: youtubeData.topVideos?.slice(0, 5) || [],
        } : null
      }
    },
    
    // Combined metrics for comparison
    comparison: {
      audience: {
        instagram: instagramData?.account?.followers_count || 0,
        youtube: youtubeData?.channel?.subscriberCount || 0,
        total: (instagramData?.account?.followers_count || 0) + (youtubeData?.channel?.subscriberCount || 0),
      },
      reach: {
        instagram: instagramData?.insights?.reach || 0,
        youtube: youtubeData?.analytics?.views || 0,
        total: (instagramData?.insights?.reach || 0) + (youtubeData?.analytics?.views || 0),
      },
      engagement: {
        instagram: {
          total: instagramData?.insights?.total_interactions || 0,
          rate: instagramData?.insights?.engagement_rate || 0,
        },
        youtube: {
          total: (youtubeData?.analytics?.likes || 0) + (youtubeData?.analytics?.comments || 0) + (youtubeData?.analytics?.shares || 0),
          rate: youtubeData?.analytics?.engagementRate || 0,
        }
      },
      content: {
        instagram: {
          posts: instagramData?.account?.media_count || 0,
          recent: instagramData?.recent_media?.length || 0,
        },
        youtube: {
          videos: youtubeData?.channel?.videoCount || 0,
          recent: youtubeData?.recentVideos?.length || 0,
        }
      }
    },

    // Time series data for charts (combine both platforms)
    timeSeries: {
      instagram: {},
      youtube: youtubeData?.timeSeriesData || [],
      combined: combineTimeSeries(
        {},
        youtubeData?.timeSeriesData || []
      )
    },

    // Performance insights
    insights: generateCombinedInsights(instagramData, youtubeData),

    // Metadata
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
