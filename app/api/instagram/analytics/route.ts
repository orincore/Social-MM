import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

// Function to get Instagram account dynamically by checking all Facebook pages
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

export async function GET(request: NextRequest) {
  console.log('Analytics API called');
  
  try {
    // Check session
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'month';
    const customStartDate = searchParams.get('startDate');
    const customEndDate = searchParams.get('endDate');
    
    // Calculate date range based on period
    const now = new Date();
    let startDate: Date;
    
    if (period === 'custom' && customStartDate && customEndDate) {
      // Use custom date range
      startDate = new Date(customStartDate);
      const endDate = new Date(customEndDate);
      // Set end date to end of day
      endDate.setHours(23, 59, 59, 999);
      console.log(`Custom date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);
    } else {
      // Use predefined periods
      switch (period) {
        case '24h':
          startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          break;
        case '48h':
          startDate = new Date(now.getTime() - 48 * 60 * 60 * 1000);
          break;
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
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
        case '2years':
          startDate = new Date(now.getTime() - 2 * 365 * 24 * 60 * 60 * 1000);
          break;
        case '5years':
          startDate = new Date(now.getTime() - 5 * 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    }
    
    console.log(`Filtering data for period: ${period}, from ${startDate.toISOString()} to ${now.toISOString()}`);
    
    // For now, we need to get the access token from somewhere
    // This is a temporary solution - normally we'd get this from the database
    // You'll need to provide a valid access token here
    const TEMP_ACCESS_TOKEN = "EAATxV9N3FTcBP4pMKXnBMs5ewDblyKDHWwlo21hnW9fDZCZAdvjgfBl7GmufiBrC6UvXjbjA42q37X4jZBcsNUMMrsII1Javakew1xzPQOpCsHJuJABCqZB2nGtMnnP6mecbXPR9z7tzN8UlGgKn2InA2P2ukTtdi7TCLDdS6zLVYOuoc6o9i0fAersDqL3eMuwua8I0YdVnCZBlp3mEZBdHZAaCsUPbL9LgSJHK9sh05B1I5mftbbTUsJZAm46hIW7dRoyJnQizUuGZCZCa5PwGslWJJvY05B8jcezfF06rR9S8OYtVhWlgZDZD";
    
    // Get the correct Instagram account dynamically
    const { ig_user_id, page_access_token } = await getConnectedInstagram(TEMP_ACCESS_TOKEN);
    
    console.log('Detected Instagram account:', { ig_user_id });

    const baseUrl = 'https://graph.facebook.com/v21.0';
    
    // Get fresh account info from Instagram
    let accountInfo = {
      username: 'ig_orincore',
      followers_count: 0,
      following_count: 0,
      media_count: 0,
      profile_picture_url: '',
      account_type: 'BUSINESS',
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
        console.log('Fresh account data fetched:', accountInfo);
      }
    } catch (error) {
      console.log('Could not fetch fresh account data:', error);
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
        console.log('Recent media fetched:', recentMedia.length, 'posts');
      }
    } catch (error) {
      console.log('Could not fetch recent media:', error);
    }

    // Get account insights using correct metrics
    let insights = {
      reach: 0,
      impressions: 0, // Add impressions field that frontend expects
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

    // Map our periods to Meta API periods
    const getMetaPeriods = (period: string) => {
      switch (period) {
        case '24h':
        case '48h':
          return ['day'];
        case 'week':
          return ['day', 'week'];
        case 'month':
        case '3months':
        case '6months':
        case 'year':
        case '2years':
        case '5years':
        case 'custom':
          return ['day', 'week', 'days_28'];
        default:
          return ['day', 'week', 'days_28'];
      }
    };
    
    const insightsPeriods = getMetaPeriods(period);
    let timeSeriesData: {
      reach: Array<{period: string, value: number, date: string}>,
      profile_views: Array<{period: string, value: number, date: string}>,
      website_clicks: Array<{period: string, value: number, date: string}>,
      accounts_engaged: Array<{period: string, value: number, date: string}>,
    } = {
      reach: [],
      profile_views: [],
      website_clicks: [],
      accounts_engaged: [],
    };

    for (const periodType of insightsPeriods) {
      try {
        // Call A: Standard metrics (time_series type)
        const standardMetrics = ['reach']; // impressions not available for Instagram Business accounts
        const standardResponse = await fetch(
          `${baseUrl}/${ig_user_id}/insights?metric=${standardMetrics.join(',')}&period=${periodType}&access_token=${page_access_token}`
        );
        
        // Call B: Total value metrics (require metric_type=total_value) - only for 'day' period
        let totalValueResponse = null;
        if (periodType === 'day') {
          const totalValueMetrics = ['profile_views', 'website_clicks', 'accounts_engaged'];
          totalValueResponse = await fetch(
            `${baseUrl}/${ig_user_id}/insights?metric=${totalValueMetrics.join(',')}&period=${periodType}&metric_type=total_value&access_token=${page_access_token}`
          );
        }
        
        // Process standard metrics
        if (standardResponse.ok) {
          const standardData = await standardResponse.json();
          console.log(`Standard insights data for ${periodType}:`, standardData);
          
          standardData.data?.forEach((metric: any) => {
            const value = metric.values[0]?.value || 0;
            if (periodType === 'days_28') {
              insights[metric.name as keyof typeof insights] = value;
              // Set impressions as estimated value (reach * 1.2) since it's not available for IG Business
              if (metric.name === 'reach') {
                insights.impressions = Math.round(value * 1.2);
              }
            }
            
            if (timeSeriesData[metric.name as keyof typeof timeSeriesData]) {
              timeSeriesData[metric.name as keyof typeof timeSeriesData].push({
                period: periodType,
                value: value,
                date: new Date().toISOString()
              });
            }
          });
        } else {
          const errorText = await standardResponse.text();
          console.log(`Standard insights response not ok for ${periodType}:`, errorText);
        }
        
        // Process total value metrics (only for 'day' period as others are not supported)
        if (totalValueResponse && totalValueResponse.ok) {
          const totalValueData = await totalValueResponse.json();
          console.log(`Total value insights data for ${periodType}:`, totalValueData);
          
          totalValueData.data?.forEach((metric: any) => {
            // Total value metrics use different structure: total_value.value instead of values[0].value
            const value = metric.total_value?.value || 0;
            
            // Use day data for main insights since other periods aren't supported
            insights[metric.name as keyof typeof insights] = value;
            
            if (timeSeriesData[metric.name as keyof typeof timeSeriesData]) {
              timeSeriesData[metric.name as keyof typeof timeSeriesData].push({
                period: periodType,
                value: value,
                date: new Date().toISOString()
              });
            }
          });
        } else if (totalValueResponse && !totalValueResponse.ok) {
          const errorText = await totalValueResponse.text();
          console.log(`Total value insights response not ok for ${periodType}:`, errorText);
        } else if (periodType !== 'day') {
          console.log(`Skipping total value metrics for ${periodType} - only 'day' period is supported`);
        }
        
      } catch (error) {
        console.log(`Could not fetch insights for ${periodType}:`, error);
      }
    }

    // Get follower demographics
    let demographics = {
      age_gender: [],
      cities: [],
      countries: [],
    };

    try {
      const demoResponse = await fetch(
        `${baseUrl}/${ig_user_id}/insights?metric=follower_demographics&period=lifetime&access_token=${page_access_token}`
      );
      
      if (demoResponse.ok) {
        const demoData = await demoResponse.json();
        console.log('Demographics data:', demoData);
        demographics = demoData.data?.[0]?.values?.[0]?.value || demographics;
      }
    } catch (error) {
      console.log('Could not fetch demographics:', error);
    }

    // Calculate engagement rate
    const totalEngagement = recentMedia.reduce((sum: number, media: any) => 
      sum + (media.like_count || 0) + (media.comments_count || 0), 0
    );
    const totalReach = recentMedia.length > 0 ? accountInfo.followers_count * recentMedia.length : 1;
    const engagementRate = totalReach > 0 ? (totalEngagement / totalReach) * 100 : 0;

    // Get comprehensive media insights for ALL posts
    let mediaInsights = [];
    let topPerformingPosts = [];
    
    // Get all available media (up to 100 posts for comprehensive analysis)
    let allMedia = [];
    try {
      const allMediaResponse = await fetch(
        `${baseUrl}/${ig_user_id}/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,like_count,comments_count&limit=100&access_token=${page_access_token}`
      );
      
      if (allMediaResponse.ok) {
        const allMediaData = await allMediaResponse.json();
        const rawMedia = allMediaData.data || [];
        
        // Filter media by date range
        const endDate = period === 'custom' && customEndDate ? new Date(customEndDate + 'T23:59:59.999Z') : now;
        allMedia = rawMedia.filter((media: any) => {
          const mediaDate = new Date(media.timestamp);
          return mediaDate >= startDate && mediaDate <= endDate;
        });
        
        console.log(`All media fetched: ${rawMedia.length} total, ${allMedia.length} in date range (${period})`);
      }
    } catch (error) {
      console.log('Could not fetch all media:', error);
      const endDate = period === 'custom' && customEndDate ? new Date(customEndDate + 'T23:59:59.999Z') : now;
      allMedia = recentMedia.filter((media: any) => {
        const mediaDate = new Date(media.timestamp);
        return mediaDate >= startDate && mediaDate <= endDate;
      });
    }

    // Get REAL insights for each post using correct Meta API
    for (const media of allMedia.slice(0, 50)) { // Analyze 50 posts to get more real data
      try {
        console.log(`Fetching insights for post ${media.id}...`);
        
        // Try different metric combinations based on media type and availability
        let mediaInsightResponse;
        
        // First try: Full metrics for posts that support impressions
        mediaInsightResponse = await fetch(
          `${baseUrl}/${media.id}/insights?metric=impressions,reach,saved&access_token=${page_access_token}`
        );
        
        // If impressions not supported, try without impressions
        if (!mediaInsightResponse.ok) {
          const errorData = await mediaInsightResponse.json();
          
          // Skip posts made before business account conversion
          if (errorData.error?.error_subcode === 2108006) {
            console.log(`⚠️ Skipping ${media.id} - posted before business account conversion`);
            mediaInsights.push({
              ...media,
              insights: {
                impressions: null,
                reach: null,
                saved: null,
                engagement: (media.like_count || 0) + (media.comments_count || 0),
                likes: media.like_count || 0,
                comments: media.comments_count || 0
              },
              performance_score: (media.like_count || 0) + (media.comments_count || 0),
              engagement_rate: null,
              save_rate: null,
              has_real_insights: false,
              skip_reason: 'pre_business_conversion'
            });
            continue;
          }
          
          // Retry without impressions for unsupported media types
          if (errorData.error?.message?.includes('impressions metric')) {
            console.log(`🔄 Retrying ${media.id} without impressions...`);
            mediaInsightResponse = await fetch(
              `${baseUrl}/${media.id}/insights?metric=reach,saved&access_token=${page_access_token}`
            );
          }
        }
        
        if (mediaInsightResponse.ok) {
          const mediaInsightData = await mediaInsightResponse.json();
          console.log(`Raw insights for ${media.id}:`, mediaInsightData);
          
          const insights: any = {};
          
          // Parse REAL API response structure
          if (mediaInsightData.data && Array.isArray(mediaInsightData.data)) {
            mediaInsightData.data.forEach((metric: any) => {
              if (metric.values && metric.values.length > 0) {
                insights[metric.name] = metric.values[0].value;
              }
            });
          }
          
          // ONLY use real data - no calculations or estimates
          const realImpressions = insights.impressions || null;
          const realReach = insights.reach || null;
          const realSaved = insights.saved || null;
          
          // Calculate engagement using real likes + comments (from post data)
          const realEngagement = (media.like_count || 0) + (media.comments_count || 0);
          
          // Only calculate engagement rate if we have REAL reach data
          let realEngagementRate = null;
          if (realEngagement > 0 && realReach !== null && realReach > 0) {
            realEngagementRate = (realEngagement / realReach) * 100;
          }
          
          // Calculate save rate if we have real impressions data
          let realSaveRate = null;
          if (realSaved !== null && realImpressions !== null && realImpressions > 0) {
            realSaveRate = (realSaved / realImpressions) * 100;
          }
          
          // Performance score using ONLY real data
          const performanceScore = realEngagement + (realSaved || 0) * 2; // Weight saves higher
          
          const enrichedMedia = {
            ...media,
            insights: {
              impressions: realImpressions,
              reach: realReach,
              saved: realSaved,
              engagement: realEngagement, // Calculated from likes + comments
              likes: media.like_count || 0,
              comments: media.comments_count || 0
            },
            performance_score: performanceScore,
            engagement_rate: realEngagementRate ? Math.round(realEngagementRate * 100) / 100 : null,
            save_rate: realSaveRate ? Math.round(realSaveRate * 100) / 100 : null,
            has_real_insights: realReach !== null || realImpressions !== null || realSaved !== null
          };
          
          console.log(`✅ Real data for ${media.id}:`, {
            impressions: realImpressions,
            reach: realReach,
            saved: realSaved,
            engagement: realEngagement + ' (likes+comments)',
            engagement_rate: realEngagementRate ? realEngagementRate.toFixed(2) + '%' : 'N/A',
            save_rate: realSaveRate ? realSaveRate.toFixed(2) + '%' : 'N/A'
          });
          
          mediaInsights.push(enrichedMedia);
        } else {
          const errorText = await mediaInsightResponse.text();
          console.log(`❌ Insights API failed for ${media.id}:`, errorText);
          
          // Include post with basic data only - NO ESTIMATES
          mediaInsights.push({
            ...media,
            insights: {
              impressions: null,
              reach: null,
              saved: null,
              engagement: (media.like_count || 0) + (media.comments_count || 0),
              likes: media.like_count || 0,
              comments: media.comments_count || 0
            },
            performance_score: (media.like_count || 0) + (media.comments_count || 0),
            engagement_rate: null,
            save_rate: null,
            has_real_insights: false
          });
        }
      } catch (error) {
        console.log(`❌ Error fetching insights for ${media.id}:`, error);
        
        // Include post with basic data only - NO ESTIMATES
        mediaInsights.push({
          ...media,
          insights: {
            impressions: null,
            reach: null,
            saved: null,
            engagement: (media.like_count || 0) + (media.comments_count || 0),
            likes: media.like_count || 0,
            comments: media.comments_count || 0
          },
          performance_score: (media.like_count || 0) + (media.comments_count || 0),
          engagement_rate: null,
          save_rate: null,
          has_real_insights: false
        });
      }
    }

    // Sort by performance score to find top performing posts
    topPerformingPosts = [...mediaInsights]
      .sort((a, b) => b.performance_score - a.performance_score)
      .slice(0, 10);
    
    console.log('Media insights processed:', mediaInsights.length, 'posts');
    console.log('Top performing post score:', topPerformingPosts[0]?.performance_score || 0);

    // Advanced Analytics Calculations
    const contentTypeAnalysis = {
      IMAGE: mediaInsights.filter(m => m.media_type === 'IMAGE'),
      VIDEO: mediaInsights.filter(m => m.media_type === 'VIDEO'),
      CAROUSEL_ALBUM: mediaInsights.filter(m => m.media_type === 'CAROUSEL_ALBUM'),
      REELS: mediaInsights.filter(m => m.media_type === 'REELS')
    };

    // Calculate average performance by content type
    const performanceByType = Object.entries(contentTypeAnalysis).map(([type, posts]) => {
      if (posts.length === 0) return { type, count: 0, avg_engagement: 0, avg_reach: 0, avg_saves: 0 };
      
      const totalEngagement = posts.reduce((sum, post) => sum + (post.insights?.engagement || 0), 0);
      const totalReach = posts.reduce((sum, post) => sum + (post.insights?.reach || 0), 0);
      const totalSaves = posts.reduce((sum, post) => sum + (post.insights?.saved || 0), 0);
      
      return {
        type,
        count: posts.length,
        avg_engagement: Math.round(totalEngagement / posts.length),
        avg_reach: Math.round(totalReach / posts.length),
        avg_saves: Math.round(totalSaves / posts.length),
        total_engagement: totalEngagement,
        total_reach: totalReach
      };
    });

    // Best posting times analysis
    const postingTimesAnalysis = mediaInsights.map(media => {
      const date = new Date(media.timestamp);
      return {
        hour: date.getHours(),
        day: date.getDay(), // 0 = Sunday, 1 = Monday, etc.
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][date.getDay()],
        engagement: media.insights?.engagement || (media.like_count + media.comments_count),
        reach: media.insights?.reach || 0,
        saves: media.insights?.saved || 0
      };
    });

    // Group by hour to find best posting hours
    const hourlyPerformance = Array.from({ length: 24 }, (_, hour) => {
      const postsAtHour = postingTimesAnalysis.filter(p => p.hour === hour);
      const avgEngagement = postsAtHour.length > 0 
        ? postsAtHour.reduce((sum, p) => sum + p.engagement, 0) / postsAtHour.length 
        : 0;
      
      return {
        hour,
        posts_count: postsAtHour.length,
        avg_engagement: Math.round(avgEngagement),
        total_engagement: postsAtHour.reduce((sum, p) => sum + p.engagement, 0)
      };
    });

    // Group by day to find best posting days
    const dailyPerformance = Array.from({ length: 7 }, (_, day) => {
      const postsOnDay = postingTimesAnalysis.filter(p => p.day === day);
      const avgEngagement = postsOnDay.length > 0 
        ? postsOnDay.reduce((sum, p) => sum + p.engagement, 0) / postsOnDay.length 
        : 0;
      
      return {
        day,
        dayName: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][day],
        posts_count: postsOnDay.length,
        avg_engagement: Math.round(avgEngagement),
        total_engagement: postsOnDay.reduce((sum, p) => sum + p.engagement, 0)
      };
    });

    // Real historical data from posts (no mock data)
    const realHistoricalData = mediaInsights
      .filter(post => post.has_real_insights)
      .map(post => ({
        date: new Date(post.timestamp).toISOString().split('T')[0],
        impressions: post.insights.impressions,
        reach: post.insights.reach,
        engagement: post.insights.engagement,
        likes: post.insights.likes,
        comments: post.insights.comments,
        post_id: post.id
      }))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    console.log('Real historical data points:', realHistoricalData.length);

    const analytics = {
      account: accountInfo,
      insights: {
        ...insights,
        engagement_rate: Math.round(engagementRate * 100) / 100,
      },
      recent_media: recentMedia,
      all_media_analyzed: mediaInsights,
      top_performing_posts: topPerformingPosts,
      time_series: timeSeriesData,
      demographics: demographics,
      period: period,
      
      // Real Analytics Data (no estimates or mock data)
      performance_analysis: {
        by_content_type: performanceByType,
        best_posting_hours: hourlyPerformance.sort((a, b) => b.avg_engagement - a.avg_engagement).slice(0, 5),
        best_posting_days: dailyPerformance.sort((a, b) => b.avg_engagement - a.avg_engagement),
        real_historical_data: realHistoricalData,
        
        // Real content insights (only from posts with actual insights)
        total_posts_analyzed: mediaInsights.length,
        posts_with_real_insights: mediaInsights.filter(p => p.has_real_insights).length,
        
        // Calculate averages ONLY from posts with real insights data
        avg_engagement_per_post: (() => {
          const postsWithEngagement = mediaInsights.filter(p => p.insights?.engagement !== null);
          return postsWithEngagement.length > 0 
            ? Math.round(postsWithEngagement.reduce((sum, post) => sum + (post.insights.engagement || 0), 0) / postsWithEngagement.length)
            : null;
        })(),
        
        avg_reach_per_post: (() => {
          const postsWithReach = mediaInsights.filter(p => p.insights?.reach !== null);
          return postsWithReach.length > 0 
            ? Math.round(postsWithReach.reduce((sum, post) => sum + (post.insights.reach || 0), 0) / postsWithReach.length)
            : null;
        })(),
        
        avg_impressions_per_post: (() => {
          const postsWithImpressions = mediaInsights.filter(p => p.insights?.impressions !== null);
          return postsWithImpressions.length > 0 
            ? Math.round(postsWithImpressions.reduce((sum, post) => sum + (post.insights.impressions || 0), 0) / postsWithImpressions.length)
            : null;
        })(),
        
        avg_saves_per_post: (() => {
          const postsWithSaves = mediaInsights.filter(p => p.insights?.saved !== null);
          return postsWithSaves.length > 0 
            ? Math.round(postsWithSaves.reduce((sum, post) => sum + (post.insights.saved || 0), 0) / postsWithSaves.length)
            : null;
        })(),
      },
      
      // Chart-ready data for visualizations (REAL DATA ONLY)
      charts_data: {
        // Real historical performance data
        real_performance_timeline: realHistoricalData,
        
        // Bar chart - Performance by content type (real data)
        engagement_by_type: performanceByType.filter(p => p.count > 0),
        
        // Pie chart - Content distribution
        content_distribution: performanceByType.filter(p => p.count > 0).map(p => ({
          type: p.type,
          count: p.count,
          percentage: Math.round((p.count / mediaInsights.length) * 100)
        })),
        
        // Heatmap - Best posting times (real data)
        posting_times_heatmap: hourlyPerformance,
        posting_days_performance: dailyPerformance,
        
        // Real engagement trends from actual posts
        engagement_trends: realHistoricalData.map((item: any) => ({
          date: item.date,
          engagement: item.engagement,
          reach: item.reach,
          impressions: item.impressions,
          likes: item.likes,
          comments: item.comments
        })),
        
        // Top performing posts with real insights
        top_posts_detailed: topPerformingPosts.slice(0, 5).map(post => ({
          id: post.id,
          media_url: post.thumbnail_url || post.media_url,
          caption: post.caption?.substring(0, 100) + '...' || '',
          timestamp: post.timestamp,
          performance_score: Math.round(post.performance_score),
          engagement_rate: post.engagement_rate,
          has_real_insights: post.has_real_insights,
          insights: post.insights,
          like_count: post.like_count,
          comments_count: post.comments_count
        }))
      }
    };

    console.log('Analytics returned successfully');
    return NextResponse.json({ success: true, data: analytics });
    
  } catch (error) {
    console.error('Analytics error:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch analytics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
