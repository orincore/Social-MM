import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { InstagramAccount } from '@/models/InstagramAccount';
import { YouTubeAccount } from '@/models/YouTubeAccount';

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
    
    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check platform connections directly from database
    const instagramAccount = await InstagramAccount.findOne({ userId: user._id, isActive: true });
    const youtubeAccount = await YouTubeAccount.findOne({ userId: user._id, isActive: true });

    let instagramData = null;
    let instagramError = null;
    let youtubeData = null;
    let youtubeError = null;

    // Build query params for individual platform APIs
    const queryParams = new URLSearchParams({
      period,
      ...(customStartDate && { startDate: customStartDate }),
      ...(customEndDate && { endDate: customEndDate }),
    });

    // Fetch Instagram analytics if connected
    if (instagramAccount) {
      try {
        const igResponse = await fetch(`${request.nextUrl.origin}/api/instagram/analytics?${queryParams}`, {
          headers: {
            'Cookie': request.headers.get('Cookie') || '',
          },
        });
        
        if (igResponse.ok) {
          const igResult = await igResponse.json();
          instagramData = igResult.data;
        } else {
          instagramError = await igResponse.text();
        }
      } catch (error) {
        console.log('Instagram analytics failed:', error);
        instagramError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    // Fetch YouTube analytics if connected
    if (youtubeAccount) {
      try {
        const ytResponse = await fetch(`${request.nextUrl.origin}/api/youtube/analytics?${queryParams}`, {
          headers: {
            'Cookie': request.headers.get('Cookie') || '',
          },
        });
        
        if (ytResponse.ok) {
          const ytResult = await ytResponse.json();
          youtubeData = ytResult.data;
        } else {
          youtubeError = await ytResponse.text();
        }
      } catch (error) {
        console.log('YouTube analytics failed:', error);
        youtubeError = error instanceof Error ? error.message : 'Unknown error';
      }
    }

    // If both platforms failed, return error
    if (!instagramData && !youtubeData) {
      return NextResponse.json({
        error: 'No platform data available',
        details: {
          instagram: instagramError,
          youtube: youtubeError,
        }
      }, { status: 404 });
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
            topContent: instagramData.top_performing_posts?.slice(0, 5) || [],
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
        instagram: instagramData?.time_series || {},
        youtube: youtubeData?.timeSeriesData || [],
        combined: combineTimeSeries(
          instagramData?.time_series || {},
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

    console.log('Combined Analytics returned successfully');
    return NextResponse.json({ success: true, data: combinedAnalytics });
    
  } catch (error) {
    console.error('Combined Analytics error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch combined analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
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
