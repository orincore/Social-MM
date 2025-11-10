import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { YouTubeAccount } from '@/models/YouTubeAccount';
import { YouTubeAPI } from '@/lib/youtube-api';

export async function GET(request: NextRequest) {
  console.log('YouTube Analytics API called');
  
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

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get YouTube account
    const youtubeAccount = await YouTubeAccount.findOne({ 
      userId: user._id, 
      isActive: true 
    });

    if (!youtubeAccount) {
      return NextResponse.json({ 
        error: 'YouTube account not connected' 
      }, { status: 404 });
    }

    // Check if token is expired and refresh if needed
    let accessToken = youtubeAccount.accessToken;
    if (new Date() > youtubeAccount.tokenExpiresAt) {
      try {
        const refreshedTokens = await YouTubeAPI.refreshToken(youtubeAccount.refreshToken);
        accessToken = refreshedTokens.access_token;
        
        // Update stored tokens
        youtubeAccount.accessToken = accessToken;
        youtubeAccount.tokenExpiresAt = new Date(Date.now() + refreshedTokens.expires_in * 1000);
        await youtubeAccount.save();
      } catch (error) {
        console.error('Failed to refresh YouTube token:', error);
        return NextResponse.json({ 
          error: 'YouTube token expired and refresh failed. Please reconnect your account.' 
        }, { status: 401 });
      }
    }

    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    let endDate: Date = now;
    
    if (period === 'custom' && customStartDate && customEndDate) {
      startDate = new Date(customStartDate);
      endDate = new Date(customEndDate);
    } else {
      switch (period) {
        case 'day':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'lifetime':
          startDate = new Date('2006-01-01T00:00:00Z');
          break;
        case '3months':
          startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
          break;
        case '6months':
          startDate = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    }

    const startDateStr = startDate.toISOString().split('T')[0];
    const endDateStr = endDate.toISOString().split('T')[0];
    
    console.log(`YouTube Analytics for period: ${period}, from ${startDateStr} to ${endDateStr}`);

    // Initialize YouTube API
    const youtubeAPI = new YouTubeAPI(accessToken);

    // Get fresh channel info
    let channelInfo = {
      channelTitle: youtubeAccount.channelTitle,
      subscriberCount: youtubeAccount.subscriberCount,
      videoCount: youtubeAccount.videoCount,
      viewCount: youtubeAccount.viewCount,
      thumbnailUrl: youtubeAccount.thumbnailUrl,
      channelHandle: youtubeAccount.channelHandle,
    };

    try {
      const channelData = await youtubeAPI.getChannelInfo();
      if (channelData.items && channelData.items.length > 0) {
        const channel = channelData.items[0];
        channelInfo = {
          channelTitle: channel.snippet.title,
          subscriberCount: parseInt(channel.statistics.subscriberCount || '0'),
          videoCount: parseInt(channel.statistics.videoCount || '0'),
          viewCount: parseInt(channel.statistics.viewCount || '0'),
          thumbnailUrl: channel.snippet.thumbnails?.default?.url || '',
          channelHandle: channel.snippet.customUrl || '',
        };
        
        // Update cached data
        youtubeAccount.subscriberCount = channelInfo.subscriberCount;
        youtubeAccount.videoCount = channelInfo.videoCount;
        youtubeAccount.viewCount = channelInfo.viewCount;
        youtubeAccount.lastSyncAt = new Date();
        await youtubeAccount.save();
      }
    } catch (error) {
      console.log('Could not fetch fresh channel data:', error);
    }

    // Get analytics data
    let analytics = {
      views: 0,
      estimatedMinutesWatched: 0,
      averageViewDuration: 0,
      subscribersGained: 0,
      subscribersLost: 0,
      likes: 0,
      dislikes: 0,
      comments: 0,
      shares: 0,
      impressions: 0,
      impressionClickThroughRate: 0,
    };

    try {
      // Get basic channel analytics (core metrics that are always available)
      const basicAnalyticsData = await youtubeAPI.getAnalytics({
        channelId: youtubeAccount.channelId,
        startDate: startDateStr,
        endDate: endDateStr,
        metrics: [
          'views',
          'estimatedMinutesWatched',
          'averageViewDuration',
          'subscribersGained',
          'subscribersLost'
        ]
      });

      if (basicAnalyticsData.rows && basicAnalyticsData.rows.length > 0) {
        const row = basicAnalyticsData.rows[0];
        analytics.views = row[0] || 0;
        analytics.estimatedMinutesWatched = row[1] || 0;
        analytics.averageViewDuration = row[2] || 0;
        analytics.subscribersGained = row[3] || 0;
        analytics.subscribersLost = row[4] || 0;
      }

      // Try to get engagement metrics separately (may not be available for all channels)
      try {
        const engagementData = await youtubeAPI.getAnalytics({
          channelId: youtubeAccount.channelId,
          startDate: startDateStr,
          endDate: endDateStr,
          metrics: ['likes', 'dislikes', 'comments', 'shares']
        });

        if (engagementData.rows && engagementData.rows.length > 0) {
          const row = engagementData.rows[0];
          analytics.likes = row[0] || 0;
          analytics.dislikes = row[1] || 0;
          analytics.comments = row[2] || 0;
          analytics.shares = row[3] || 0;
        }
      } catch (engagementError) {
        console.log('Engagement metrics not available:', engagementError);
      }

      // Note: impressionClickThroughRate is not available in YouTube Analytics API v2
      // Keeping it as 0 for now
      analytics.impressionClickThroughRate = 0;

      // If we couldn't get engagement data from analytics, try to aggregate from recent videos
      if (analytics.likes === 0 && analytics.comments === 0) {
        try {
          const recentVideosForEngagement = await youtubeAPI.getVideos(youtubeAccount.uploadsPlaylistId, 50);
          if (recentVideosForEngagement.items && recentVideosForEngagement.items.length > 0) {
            const videoIds = recentVideosForEngagement.items.map((item: any) => item.contentDetails.videoId);
            const videoDetails = await youtubeAPI.getVideoDetails(videoIds);
            
            // Aggregate engagement from recent videos in the date range
            let totalLikes = 0;
            let totalComments = 0;
            let totalShares = 0;
            
            videoDetails.items.forEach((video: any) => {
              const publishedAt = new Date(video.snippet.publishedAt);
              if (publishedAt >= startDate && publishedAt <= endDate) {
                totalLikes += parseInt(video.statistics.likeCount || '0');
                totalComments += parseInt(video.statistics.commentCount || '0');
                // Shares are not available in video statistics
              }
            });
            
            analytics.likes = totalLikes;
            analytics.comments = totalComments;
            console.log('Aggregated engagement from video statistics:', { totalLikes, totalComments });
          }
        } catch (aggregationError) {
          console.log('Could not aggregate engagement from videos:', aggregationError);
        }
      }

      console.log('YouTube analytics fetched:', analytics);
    } catch (error) {
      console.log('Could not fetch basic analytics data:', error);
    }

    // Get time series data for charts
    let timeSeriesData: any[] = [];
    try {
      const timeSeriesAnalytics = await youtubeAPI.getAnalytics({
        channelId: youtubeAccount.channelId,
        startDate: startDateStr,
        endDate: endDateStr,
        metrics: ['views', 'estimatedMinutesWatched', 'subscribersGained'],
        dimensions: ['day']
      });

      if (timeSeriesAnalytics.rows) {
        timeSeriesData = timeSeriesAnalytics.rows.map((row: any) => ({
          date: row[0], // day dimension
          views: row[1] || 0,
          estimatedMinutesWatched: row[2] || 0,
          subscribersGained: row[3] || 0,
        }));
      }
    } catch (error) {
      console.log('Could not fetch time series data:', error);
    }

    // Get recent videos
    let recentVideos: any[] = [];
    try {
      const videosData = await youtubeAPI.getVideos(youtubeAccount.uploadsPlaylistId, 25);
      
      if (videosData.items && videosData.items.length > 0) {
        // Get video IDs to fetch detailed statistics
        const videoIds = videosData.items.map((item: any) => item.contentDetails.videoId);
        const videoDetails = await youtubeAPI.getVideoDetails(videoIds);
        
        // Get all recent videos (not just in date range) and combine data
        recentVideos = videosData.items
          .map((item: any) => {
            const videoId = item.contentDetails.videoId;
            const details = videoDetails.items.find((d: any) => d.id === videoId);
            
            return {
              id: videoId,
              title: item.snippet.title,
              description: item.snippet.description,
              publishedAt: item.snippet.publishedAt,
              thumbnailUrl: item.snippet.thumbnails?.medium?.url || '',
              statistics: details?.statistics || {
                viewCount: '0',
                likeCount: '0',
                commentCount: '0'
              },
              duration: details?.contentDetails?.duration || '',
              privacyStatus: details?.status?.privacyStatus || 'public',
            };
          })
          .filter(Boolean)
          .slice(0, 10);
      }
    } catch (error) {
      console.log('Could not fetch recent videos:', error);
    }

    // Get top performing videos analytics
    let topVideos: any[] = [];
    try {
      const topVideosData = await youtubeAPI.getAnalytics({
        channelId: youtubeAccount.channelId,
        startDate: startDateStr,
        endDate: endDateStr,
        metrics: ['views', 'estimatedMinutesWatched'],
        dimensions: ['video'],
        sort: '-views',
        maxResults: 10
      });

      if (topVideosData.rows) {
        // Get video details for top videos
        const topVideoIds = topVideosData.rows.map((row: any) => row[0]);
        const topVideoDetails = await youtubeAPI.getVideoDetails(topVideoIds);
        
        topVideos = topVideosData.rows.map((row: any, index: number) => {
          const videoId = row[0];
          const details = topVideoDetails.items.find((d: any) => d.id === videoId);
          
          return {
            id: videoId,
            title: details?.snippet?.title || 'Unknown Title',
            thumbnailUrl: details?.snippet?.thumbnails?.medium?.url || '',
            views: row[1] || 0,
            estimatedMinutesWatched: row[2] || 0,
            likes: parseInt(details?.statistics?.likeCount || '0'),
            comments: parseInt(details?.statistics?.commentCount || '0'),
            publishedAt: details?.snippet?.publishedAt || '',
            url: `https://www.youtube.com/watch?v=${videoId}`,
          };
        });
      }
    } catch (error) {
      console.log('Could not fetch top videos:', error);
    }

    const response = {
      channel: channelInfo,
      analytics: {
        ...analytics,
        // Calculate engagement rate
        engagementRate: analytics.views > 0 
          ? ((analytics.likes + analytics.comments + analytics.shares) / analytics.views) * 100 
          : 0,
      },
      timeSeriesData,
      recentVideos,
      topVideos,
      period,
      dateRange: {
        startDate: startDateStr,
        endDate: endDateStr,
      }
    };

    console.log('YouTube Analytics returned successfully');
    return NextResponse.json({ success: true, data: response });
    
  } catch (error) {
    console.error('YouTube Analytics error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch YouTube analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
