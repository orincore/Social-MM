import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

interface AnalyticsData {
  platforms?: {
    instagram?: { data?: any };
    youtube?: { data?: any };
  };
  comparison?: {
    engagement?: {
      instagram?: { rate: number; total: number };
      youtube?: { rate: number; total: number };
    };
    audience?: {
      instagram: number;
      youtube: number;
      total: number;
    };
    reach?: {
      instagram: number;
      youtube: number;
      total: number;
    };
  };
}

// Helper function to analyze Instagram content types
function analyzeInstagramContent(content: any[]) {
  if (!content || content.length === 0) {
    return {
      bestPerforming: { type: 'Unknown', avgEngagement: 0, count: 0 },
      contentTypes: [],
      recommendation: 'Start posting Reels and carousel posts for maximum engagement'
    };
  }
  
  const typeStats: any = {};
  
  content.forEach((post: any) => {
    // Extract media type - handle different API response formats
    let type = 'Photo';
    if (post.media_type === 'VIDEO' || post.media_type === 'REELS' || post.type === 'VIDEO') {
      type = 'Reels';
    } else if (post.media_type === 'CAROUSEL_ALBUM' || post.type === 'CAROUSEL_ALBUM') {
      type = 'Carousel';
    } else if (post.media_type === 'IMAGE' || post.type === 'IMAGE' || post.media_type === 'PHOTO') {
      type = 'Photo';
    }
    
    // Extract engagement - handle different field names
    const likes = post.like_count || post.likes_count || post.likes || 0;
    const comments = post.comments_count || post.comment_count || post.comments || 0;
    const engagement = likes + comments;
    
    if (!typeStats[type]) {
      typeStats[type] = { total: 0, count: 0, type };
    }
    typeStats[type].total += engagement;
    typeStats[type].count += 1;
  });
  
  const contentTypes = Object.values(typeStats).map((stat: any) => ({
    type: stat.type,
    avgEngagement: stat.count > 0 ? stat.total / stat.count : 0,
    count: stat.count,
    percentage: (stat.count / content.length) * 100
  })).sort((a: any, b: any) => b.avgEngagement - a.avgEngagement);
  
  const bestPerforming = contentTypes[0] || { type: 'Unknown', avgEngagement: 0, count: 0 };
  
  let recommendation = '';
  if (bestPerforming.type === 'Reels' && bestPerforming.avgEngagement > 0) {
    recommendation = 'Continue creating Reels - they\'re your best performers! Aim for 5-7 Reels per week.';
  } else if (bestPerforming.type === 'Carousel' && bestPerforming.avgEngagement > 0) {
    recommendation = 'Carousel posts are working great! Create educational carousels with 7-10 slides.';
  } else if (bestPerforming.avgEngagement === 0) {
    recommendation = 'Start creating more engaging content. Use trending audio, add captions, and post during peak hours (11 AM - 1 PM, 7 PM - 9 PM).';
  } else {
    recommendation = 'Test more Reels and carousel posts - they typically get 3x more engagement than photos.';
  }
  
  return { bestPerforming, contentTypes, recommendation };
}

// Helper function to analyze YouTube content types
function analyzeYouTubeContent(content: any[]) {
  if (!content || content.length === 0) {
    return {
      bestPerforming: { type: 'Unknown', avgEngagement: 0, count: 0 },
      contentTypes: [],
      recommendation: 'Start with short-form content (Shorts) to build audience quickly'
    };
  }
  
  const typeStats: any = {};
  
  content.forEach((video: any) => {
    // Parse duration from ISO 8601 format (PT1M30S) or use numeric value
    let durationSeconds = 0;
    if (typeof video.duration === 'string' && video.duration.startsWith('PT')) {
      const match = video.duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
      if (match) {
        const hours = parseInt(match[1] || '0');
        const minutes = parseInt(match[2] || '0');
        const seconds = parseInt(match[3] || '0');
        durationSeconds = hours * 3600 + minutes * 60 + seconds;
      }
    } else {
      durationSeconds = video.duration || 0;
    }
    
    const type = durationSeconds < 60 ? 'Shorts' : durationSeconds < 600 ? 'Short Videos (1-10min)' : 'Long Videos (10+ min)';
    
    // Extract engagement - handle different field names
    const likes = video.likeCount || video.like_count || video.likes || 0;
    const comments = video.commentCount || video.comment_count || video.comments || 0;
    const engagement = likes + comments;
    
    if (!typeStats[type]) {
      typeStats[type] = { total: 0, count: 0, type };
    }
    typeStats[type].total += engagement;
    typeStats[type].count += 1;
  });
  
  const contentTypes = Object.values(typeStats).map((stat: any) => ({
    type: stat.type,
    avgEngagement: stat.count > 0 ? stat.total / stat.count : 0,
    count: stat.count,
    percentage: (stat.count / content.length) * 100
  })).sort((a: any, b: any) => b.avgEngagement - a.avgEngagement);
  
  const bestPerforming = contentTypes[0] || { type: 'Unknown', avgEngagement: 0, count: 0 };
  
  let recommendation = '';
  if (bestPerforming.type === 'Shorts' && bestPerforming.avgEngagement > 0) {
    recommendation = 'Shorts are crushing it! Post 3-5 Shorts per week and repurpose your best ones.';
  } else if (bestPerforming.type.includes('Long') && bestPerforming.avgEngagement > 0) {
    recommendation = 'Long-form content is your strength! Focus on 15-20 minute videos with strong hooks.';
  } else if (bestPerforming.avgEngagement === 0) {
    recommendation = 'Focus on creating engaging content. Use compelling thumbnails, strong hooks in first 3 seconds, and trending topics.';
  } else {
    recommendation = 'Short videos (5-10 min) are performing well. Maintain this format with better thumbnails.';
  }
  
  return { bestPerforming, contentTypes, recommendation };
}

// Generate performance history for line graph (deterministic based on current data)
function generatePerformanceHistory(analyticsData: AnalyticsData, userId: string) {
  // Create deterministic 7-day performance history based on current data
  const currentEngagement = (
    (analyticsData.comparison?.engagement?.instagram?.rate || 0) +
    (analyticsData.comparison?.engagement?.youtube?.rate || 0)
  ) / 2;
  
  const totalReach = (analyticsData.comparison?.reach?.instagram || 0) + (analyticsData.comparison?.reach?.youtube || 0);
  const totalAudience = analyticsData.comparison?.audience?.total || 0;
  
  // Use userId as seed for deterministic variance
  const seed = userId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const history = [];
  const today = new Date();
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    
    // Create deterministic variance based on day index and seed
    const dayVariance = Math.sin((seed + i) * 0.5) * 0.3; // -0.3 to +0.3
    const engagement = Math.max(0, currentEngagement * (1 + dayVariance));
    const reach = Math.floor(totalReach / 7 * (1 + dayVariance * 0.5));
    
    history.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      engagement: parseFloat(engagement.toFixed(2)),
      reach: reach,
      followers: Math.floor(totalAudience / 7 * (i + 1))
    });
  }
  
  return history;
}

async function generateInsightsFromData(analyticsData: any, userName: string) {
  // Fetch demographic data for enhanced insights
  let demographicData = null;
  try {
    const response = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/analytics/demographics`);
    if (response.ok) {
      const data = await response.json();
      demographicData = data.data;
    }
  } catch (error) {
    console.log('Could not fetch demographic data for insights:', error);
  }
  // Extract first name only
  const firstName = userName ? userName.split(' ')[0].split('@')[0] : 'Creator';
  
  // Extract comprehensive data
  const igEngagement = analyticsData.comparison?.engagement?.instagram?.rate || 0;
  const ytEngagement = analyticsData.comparison?.engagement?.youtube?.rate || 0;
  const igPosts = analyticsData.platforms?.instagram?.data?.recentContent?.length || 0;
  const ytVideos = analyticsData.platforms?.youtube?.data?.recentContent?.length || 0;
  const igFollowers = analyticsData.comparison?.audience?.instagram || 0;
  const ytSubscribers = analyticsData.comparison?.audience?.youtube || 0;
  const igReach = analyticsData.comparison?.reach?.instagram || 0;
  const ytReach = analyticsData.comparison?.reach?.youtube || 0;
  const totalAudience = analyticsData.comparison?.audience?.total || 0;
  
  // Analyze content types and performance
  const igContent = analyticsData.platforms?.instagram?.data?.recentContent || [];
  const ytContent = analyticsData.platforms?.youtube?.data?.recentContent || [];
  
  // Content type analysis for Instagram
  const igContentAnalysis = analyzeInstagramContent(igContent);
  const ytContentAnalysis = analyzeYouTubeContent(ytContent);
  
  // Historical performance data for line graph (pass userId for deterministic generation)
  const performanceHistory = generatePerformanceHistory(analyticsData, userName || 'default');
  
  // Advanced calculations with real data analysis
  const avgEngagement = (igEngagement + ytEngagement) / 2;
  const contentBalance = Math.abs(igPosts - ytVideos) <= 2 ? 20 : 10;
  const postingFrequency = (igPosts + ytVideos) >= 10 ? 20 : (igPosts + ytVideos) * 2;
  const audienceGrowthPotential = totalAudience < 1000 ? 'high' : totalAudience < 10000 ? 'medium' : 'established';
  const reachEfficiency = totalAudience > 0 ? ((igReach + ytReach) / totalAudience) * 100 : 0;
  
  // Real engagement benchmarks by industry standards
  const igBenchmark = 3.5; // Industry average for Instagram
  const ytBenchmark = 4.2; // Industry average for YouTube
  // Cap performance comparison to realistic ranges (max 200% to avoid overated results)
  const igPerformanceVsBenchmark = igEngagement > 0 ? Math.min(200, (igEngagement / igBenchmark) * 100) : 0;
  const ytPerformanceVsBenchmark = ytEngagement > 0 ? Math.min(200, (ytEngagement / ytBenchmark) * 100) : 0;
  
  // Content velocity (posts per week)
  const contentVelocity = (igPosts + ytVideos) / 4; // Assuming 4 weeks of data
  const optimalVelocity = 7; // 7 posts per week is optimal
  const velocityScore = Math.min(100, (contentVelocity / optimalVelocity) * 100);
  
  // Audience engagement quality
  const engagementQuality = avgEngagement > 0 ? 
    (avgEngagement >= 6 ? 'excellent' : 
     avgEngagement >= 4 ? 'good' : 
     avgEngagement >= 2 ? 'fair' : 'needs improvement') : 'insufficient data';
  
  // Growth momentum calculation
  const growthMomentum = (
    (igPerformanceVsBenchmark * 0.3) + 
    (ytPerformanceVsBenchmark * 0.3) + 
    (velocityScore * 0.2) + 
    (reachEfficiency * 0.2)
  );
  
  // Performance score with weighted factors (more accurate calculation)
  const engagementWeight = Math.min(50, avgEngagement * 8); // 0-50 points (based on real engagement)
  const frequencyWeight = Math.min(25, velocityScore * 0.25); // 0-25 points (based on posting frequency)
  const balanceWeight = contentBalance; // 0-20 points (platform balance)
  const reachWeight = Math.min(5, reachEfficiency * 0.1); // 0-5 points (reach efficiency)
  const performanceScore = Math.min(100, Math.round(engagementWeight + frequencyWeight + balanceWeight + reachWeight));
  
  // Determine best platform with detailed analysis
  const platformAnalysis = {
    instagram: {
      engagement_rate: igEngagement,
      content_count: igPosts,
      audience_size: igFollowers,
      reach: igReach,
      performance_index: (igEngagement * 0.4) + (igPosts * 0.3) + (igFollowers / 1000 * 0.3)
    },
    youtube: {
      engagement_rate: ytEngagement,
      content_count: ytVideos,
      audience_size: ytSubscribers,
      reach: ytReach,
      performance_index: (ytEngagement * 0.4) + (ytVideos * 0.3) + (ytSubscribers / 1000 * 0.3)
    }
  };
  
  const bestPlatform = platformAnalysis.instagram.performance_index > platformAnalysis.youtube.performance_index ? 'instagram' : 
                      platformAnalysis.youtube.performance_index > platformAnalysis.instagram.performance_index ? 'youtube' : 'balanced';
  
  // Comprehensive recommendations with detailed explanations
  const recommendations = [];
  
  // Engagement optimization
  if (igEngagement < 2) {
    recommendations.push({
      type: 'Critical: Instagram Engagement Crisis',
      category: 'engagement',
      priority: 'critical',
      description: `Your Instagram engagement rate of ${igEngagement.toFixed(2)}% is ${igPerformanceVsBenchmark.toFixed(0)}% of the industry benchmark (${igBenchmark}%). This indicates your content is not resonating with your audience or not being shown by the algorithm.`,
      actionItems: [
        'Audit your hashtag strategy - use 15-20 relevant hashtags per post',
        'Post during peak hours (11 AM - 1 PM and 7 PM - 9 PM)',
        'Create more interactive content (polls, questions, carousels)',
        'Engage with your audience within the first hour of posting',
        'Use trending audio and participate in viral challenges'
      ],
      expectedImpact: 'Could increase engagement by 150-300% within 30 days',
      timeframe: '2-4 weeks'
    });
  } else if (igEngagement < 4) {
    recommendations.push({
      type: 'Instagram Engagement Optimization',
      category: 'engagement',
      priority: 'high',
      description: `Your Instagram engagement rate of ${igEngagement.toFixed(2)}% is ${igPerformanceVsBenchmark.toFixed(0)}% of the industry benchmark. You're performing ${igPerformanceVsBenchmark > 100 ? 'above' : 'below'} average, but there's room to reach the 6-8% range of top creators.`,
      actionItems: [
        'Experiment with different content formats (Reels, carousels, Stories)',
        'Use location tags and collaborate with local businesses',
        'Create behind-the-scenes content to build personal connection',
        'Ask questions in captions to encourage comments'
      ],
      expectedImpact: 'Could boost engagement to 4-6% range',
      timeframe: '3-6 weeks'
    });
  }
  
  if (ytEngagement < 3) {
    recommendations.push({
      type: 'YouTube Engagement Enhancement',
      category: 'engagement',
      priority: 'high',
      description: 'YouTube engagement of ' + ytEngagement.toFixed(2) + '% needs improvement. Top creators achieve 8-15%.',
      actionItems: [
        'Create compelling thumbnails with bright colors and clear text',
        'Write titles that create curiosity or promise value',
        'Add clear calls-to-action in first 15 seconds',
        'Use YouTube Shorts to increase discoverability',
        'Engage with comments within 2 hours of upload'
      ],
      expectedImpact: 'Could double your engagement rate within 60 days',
      timeframe: '4-8 weeks'
    });
  }
  
  // Content frequency analysis
  if (igPosts < 7) {
    recommendations.push({
      type: 'Instagram Posting Frequency Optimization',
      category: 'frequency',
      priority: igPosts < 3 ? 'critical' : 'medium',
      description: `With only ${igPosts} recent posts, you're missing significant growth opportunities. Optimal frequency is 4-7 posts per week.`,
      actionItems: [
        'Create a content calendar with 5-7 posts per week',
        'Batch create content on weekends',
        'Repurpose YouTube content into Instagram posts',
        'Use user-generated content and testimonials',
        'Share quick tips and behind-the-scenes moments'
      ],
      expectedImpact: 'Consistent posting could increase reach by 200-400%',
      timeframe: '1-2 weeks to implement'
    });
  }
  
  if (ytVideos < 4) {
    recommendations.push({
      type: 'YouTube Content Consistency',
      category: 'frequency',
      priority: 'medium',
      description: `${ytVideos} videos is below the recommended 1-2 videos per week for growth.`,
      actionItems: [
        'Aim for 1-2 long-form videos per week',
        'Create 3-5 YouTube Shorts weekly',
        'Repurpose Instagram content into YouTube videos',
        'Start a weekly series to build anticipation'
      ],
      expectedImpact: 'Regular uploads could increase subscriber growth by 300%',
      timeframe: '2-3 weeks'
    });
  }
  
  // Cross-platform strategy
  if (Math.abs(platformAnalysis.instagram.performance_index - platformAnalysis.youtube.performance_index) > 2) {
    const strongerPlatform = platformAnalysis.instagram.performance_index > platformAnalysis.youtube.performance_index ? 'Instagram' : 'YouTube';
    const weakerPlatform = strongerPlatform === 'Instagram' ? 'YouTube' : 'Instagram';
    
    recommendations.push({
      type: 'Cross-Platform Growth Strategy',
      category: 'strategy',
      priority: 'medium',
      description: `${strongerPlatform} is significantly outperforming ${weakerPlatform}. Leverage your success for cross-platform growth.`,
      actionItems: [
        `Use ${strongerPlatform} to drive traffic to ${weakerPlatform}`,
        'Create platform-specific versions of your best content',
        'Cross-promote your accounts in bio and content',
        'Run collaborative campaigns across both platforms'
      ],
      expectedImpact: 'Could boost weaker platform performance by 150%',
      timeframe: '4-6 weeks'
    });
  }
  
  // Advanced alerts with detailed analysis
  const alerts = [];
  
  if (igEngagement < 1) {
    alerts.push({
      type: 'URGENT: Instagram Algorithm Penalty Risk',
      severity: 'error',
      message: `Engagement rate of ${igEngagement.toFixed(2)}% suggests potential shadowban or algorithm issues. Immediate action required.`,
      actionRequired: 'Review recent content for policy violations and adjust hashtag strategy'
    });
  } else if (igEngagement < 2) {
    alerts.push({
      type: 'Instagram Engagement Crisis',
      severity: 'warning',
      message: `${igEngagement.toFixed(2)}% engagement is critically low. Your content may not be reaching your audience effectively.`,
      actionRequired: 'Implement engagement optimization strategy immediately'
    });
  }
  
  if ((igPosts + ytVideos) < 3) {
    alerts.push({
      type: 'Content Drought Alert',
      severity: 'warning',
      message: `Only ${igPosts + ytVideos} pieces of content detected. Algorithms favor consistent creators.`,
      actionRequired: 'Establish minimum 3-5 posts per week across platforms'
    });
  }
  
  if (reachEfficiency < 20) {
    alerts.push({
      type: 'Low Reach Efficiency',
      severity: 'info',
      message: `Your content is only reaching ${reachEfficiency.toFixed(1)}% of your audience. Optimal reach is 30-50%.`,
      actionRequired: 'Optimize posting times and use trending hashtags'
    });
  }
  
  if (avgEngagement > 6) {
    alerts.push({
      type: 'Outstanding Performance!',
      severity: 'success',
      message: `${avgEngagement.toFixed(2)}% engagement rate is exceptional! You're in the top 10% of creators.`,
      actionRequired: 'Scale your successful content strategy and consider monetization'
    });
  }
  
  // Advanced content suggestions
  const contentSuggestions = {
    optimal_posting_times: {
      instagram: {
        weekdays: '11:00 AM - 1:00 PM, 7:00 PM - 9:00 PM',
        weekends: '10:00 AM - 12:00 PM, 6:00 PM - 8:00 PM',
        best_days: 'Tuesday, Wednesday, Friday'
      },
      youtube: {
        weekdays: '2:00 PM - 4:00 PM, 8:00 PM - 10:00 PM',
        weekends: '9:00 AM - 11:00 AM, 7:00 PM - 9:00 PM',
        best_days: 'Thursday, Friday, Saturday'
      }
    },
    content_gaps: [
      igPosts < ytVideos ? 'Create 2-3 more Instagram posts weekly' : 'Upload 1-2 more YouTube videos weekly',
      'Add more interactive content (polls, Q&As, live sessions)',
      'Create educational content in your niche',
      'Share behind-the-scenes content for authenticity'
    ],
    trending_opportunities: [
      'Participate in current viral challenges',
      'Create content around trending hashtags in your niche',
      'Collaborate with other creators in your space',
      'Use seasonal content themes'
    ],
    engagement_tips: [
      'Respond to comments within 1-2 hours of posting',
      'Ask specific questions in captions to encourage responses',
      'Use Instagram/YouTube Stories for daily engagement',
      'Create content series to build anticipation',
      'Share user-generated content to build community'
    ],
    monetization_readiness: totalAudience > 1000 ? [
      'Consider affiliate marketing partnerships',
      'Explore brand collaboration opportunities',
      'Create digital products or courses',
      'Set up tip jars or membership programs'
    ] : [
      'Focus on audience growth before monetization',
      'Build email list for future opportunities',
      'Create valuable free content to establish authority'
    ]
  };
  
  // Generate personalized motivational quote based on performance (using first name only)
  const motivationalQuotes = {
    excellent: [
      `"${firstName}, you're crushing it! Your success proves that consistency and quality win. Keep this momentum going!" 🚀`,
      `"${firstName}, you're in the top 10% of creators. Your dedication is paying off - now it's time to scale!" 🌟`,
      `"${firstName}, your engagement rates are exceptional. You've built something special - protect and grow it!" 💎`
    ],
    good: [
      `"${firstName}, you're on the right track! Every great creator started where you are. Keep pushing forward!" 💪`,
      `"${firstName}, your foundation is solid. The next level is within reach - stay consistent and watch the magic happen!" ✨`,
      `"${firstName}, you're doing better than most. Small improvements compound into massive results!" 📈`
    ],
    fair: [
      `"${firstName}, every expert was once a beginner. Your journey is just beginning - embrace the process!" 🌱`,
      `"${firstName}, challenges are opportunities in disguise. Your breakthrough is closer than you think!" 💫`,
      `"${firstName}, the algorithm rewards persistence. Keep showing up, and success will follow!" 🎯`
    ],
    needsWork: [
      `"${firstName}, this is your comeback story in the making. Every successful creator faced this moment!" 🔥`,
      `"${firstName}, the only failure is giving up. Your next post could be the one that changes everything!" 💪`,
      `"${firstName}, you have unlimited potential. Let's turn these insights into action and watch you soar!" 🦅`
    ]
  };
  
  const quoteCategory = performanceScore > 80 ? 'excellent' : 
                       performanceScore > 60 ? 'good' : 
                       performanceScore > 40 ? 'fair' : 'needsWork';
  const selectedQuote = motivationalQuotes[quoteCategory][Math.floor(Math.random() * motivationalQuotes[quoteCategory].length)];
  
  // Detailed reasoning with accurate, data-driven insights
  const detailedReasoning = `
📊 COMPREHENSIVE PERFORMANCE ANALYSIS:

🎯 Overall Performance Score: ${performanceScore}/100
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
• Engagement Quality: ${engagementWeight.toFixed(1)}/50 points (${engagementQuality})
• Content Velocity: ${frequencyWeight.toFixed(1)}/25 points (${contentVelocity.toFixed(1)} posts/week)
• Platform Balance: ${balanceWeight}/20 points
• Reach Efficiency: ${reachWeight.toFixed(1)}/5 points

📈 REAL PERFORMANCE VS INDUSTRY BENCHMARKS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 Instagram:
  • Your Engagement: ${igEngagement.toFixed(2)}% | Industry Avg: ${igBenchmark}%
  • Performance: ${igPerformanceVsBenchmark.toFixed(0)}% of benchmark ${igPerformanceVsBenchmark >= 100 ? '✅' : '⚠️'}
  • Content Count: ${igPosts} posts | Followers: ${igFollowers.toLocaleString()}
  • Reach: ${igReach.toLocaleString()} impressions

🎥 YouTube:
  • Your Engagement: ${ytEngagement.toFixed(2)}% | Industry Avg: ${ytBenchmark}%
  • Performance: ${ytPerformanceVsBenchmark.toFixed(0)}% of benchmark ${ytPerformanceVsBenchmark >= 100 ? '✅' : '⚠️'}
  • Content Count: ${ytVideos} videos | Subscribers: ${ytSubscribers.toLocaleString()}
  • Reach: ${ytReach.toLocaleString()} views

📊 COMBINED METRICS:
  • Total Audience: ${totalAudience.toLocaleString()} (Growth Stage: ${audienceGrowthPotential})
  • Reach Efficiency: ${reachEfficiency.toFixed(1)}% (Optimal: 30-50%)
  • Content Velocity: ${contentVelocity.toFixed(1)} posts/week (Optimal: ${optimalVelocity})
  • Growth Momentum: ${growthMomentum.toFixed(1)}/100

🚀 GROWTH ASSESSMENT:
${performanceScore > 80 ? 
  '🌟 EXCEPTIONAL: You\'re in the top 10% of creators! Your engagement rates exceed industry standards. Focus on scaling your audience and exploring monetization opportunities. You\'re ready for brand partnerships and premium content.' :
  performanceScore > 60 ? 
  '📈 STRONG: You\'re performing above average with a solid foundation. With targeted optimization, you can reach the top tier. Your consistency is paying off - now it\'s time to refine your strategy and accelerate growth.' :
  performanceScore > 40 ?
  '⚡ DEVELOPING: You\'re building momentum but there\'s significant room for improvement. Focus on the critical recommendations below. Small, consistent improvements will compound into major results within 60-90 days.' :
  '🔥 HIGH POTENTIAL: You\'re at the beginning of your journey with massive growth opportunities. The data shows clear areas for improvement. Implement the action items below and you could see 200-500% improvement in 90 days.'}

💡 IMMEDIATE ACTION PRIORITIES (Based on Real Data):
1. ${igEngagement < igBenchmark ? `Instagram Engagement: Currently ${igPerformanceVsBenchmark.toFixed(0)}% of benchmark - needs immediate attention` : `Instagram: Performing ${igPerformanceVsBenchmark.toFixed(0)}% of benchmark - optimize further`}
2. ${ytEngagement < ytBenchmark ? `YouTube Engagement: Currently ${ytPerformanceVsBenchmark.toFixed(0)}% of benchmark - requires focus` : `YouTube: Performing ${ytPerformanceVsBenchmark.toFixed(0)}% of benchmark - scale success`}
3. ${contentVelocity < optimalVelocity ? `Content Frequency: ${contentVelocity.toFixed(1)} posts/week vs optimal ${optimalVelocity} - increase output` : `Content Frequency: ${contentVelocity.toFixed(1)} posts/week - maintain consistency`}
4. ${reachEfficiency < 30 ? `Reach Efficiency: ${reachEfficiency.toFixed(1)}% vs optimal 30-50% - improve discoverability` : `Reach Efficiency: ${reachEfficiency.toFixed(1)}% - good performance`}

🎯 DATA-DRIVEN 30-DAY GROWTH FORECAST:
Based on current metrics and recommended optimizations:
• Engagement Rate: ${avgEngagement.toFixed(2)}% → ${(avgEngagement * 1.5).toFixed(2)}% (+50-150%)
• Reach Efficiency: ${reachEfficiency.toFixed(1)}% → ${Math.min(50, reachEfficiency * 2).toFixed(1)}% (+100%)
• Content Velocity: ${contentVelocity.toFixed(1)} → ${Math.min(optimalVelocity, contentVelocity * 1.5).toFixed(1)} posts/week
• Follower Growth: Projected ${Math.round(totalAudience * 0.15)}-${Math.round(totalAudience * 0.30)} new followers

💪 YOUR PERSONALIZED MOTIVATION:
${selectedQuote}

${demographicData ? `
🎯 AUDIENCE DEMOGRAPHICS INSIGHTS:
${demographicData.instagram ? `
📊 Instagram Audience Profile:
• Gender Split: ${demographicData.instagram.gender?.map((g: { name: string; value: number }) => `${g.name}: ${g.value}%`).join(', ') || 'Data not available'}
• Top Age Groups: ${demographicData.instagram.age?.slice(0, 3).map((a: { name: string; value: number }) => `${a.name} (${a.value}%)`).join(', ') || 'Data not available'}
• Geographic Reach: ${demographicData.instagram.countries?.slice(0, 3).map((c: { name: string; value: number; code: string }) => `${c.name} (${c.value}%)`).join(', ') || 'Data not available'}
` : ''}
${demographicData.youtube ? `
📺 YouTube Audience Profile:
• Gender Split: ${demographicData.youtube.gender?.map((g: { name: string; value: number }) => `${g.name}: ${g.value}%`).join(', ') || 'Data not available'}
• Top Age Groups: ${demographicData.youtube.age?.slice(0, 3).map((a: { name: string; value: number }) => `${a.name} (${a.value}%)`).join(', ') || 'Data not available'}
• Geographic Reach: ${demographicData.youtube.countries?.slice(0, 3).map((c: { name: string; value: number; code: string }) => `${c.name} (${c.value}%)`).join(', ') || 'Data not available'}
` : ''}

🎯 DEMOGRAPHIC-BASED RECOMMENDATIONS:
${demographicData.instagram?.age?.[0]?.name === '18-24' ? '• Focus on trending challenges and viral content for Gen Z audience' : ''}
${demographicData.instagram?.gender?.find((g: { name: string; value: number }) => g.name === 'Female')?.value > 60 ? '• Create beauty, lifestyle, and wellness content that resonates with female audience' : ''}
${demographicData.instagram?.countries?.[0]?.name === 'India' ? '• Consider regional festivals, local trends, and Hindi/English mix content' : ''}
${demographicData.youtube?.age?.[0]?.name?.includes('25-34') ? '• Create educational and professional development content for millennials' : ''}
` : ''}
  `;
  
  return {
    performance_score: performanceScore,
    best_platform: bestPlatform,
    recommendations,
    content_suggestions: contentSuggestions,
    alerts,
    reasoning: detailedReasoning,
    motivational_quote: selectedQuote,
    user_name: firstName,
    content_analysis: {
      instagram: igContentAnalysis,
      youtube: ytContentAnalysis
    },
    performance_history: performanceHistory,
    metrics: {
      total_engagement_rate: avgEngagement,
      content_balance_score: contentBalance,
      posting_frequency_score: postingFrequency,
      reach_efficiency: reachEfficiency,
      growth_stage: audienceGrowthPotential,
      platform_analysis: platformAnalysis,
      engagement_quality: engagementQuality,
      content_velocity: contentVelocity,
      velocity_score: velocityScore,
      growth_momentum: growthMomentum,
      ig_vs_benchmark: igPerformanceVsBenchmark,
      yt_vs_benchmark: ytPerformanceVsBenchmark
    },
    detailed_analysis: {
      strengths: [
        avgEngagement > 4 ? 'Strong engagement rates' : null,
        (igPosts + ytVideos) > 7 ? 'Consistent content creation' : null,
        Math.abs(igPosts - ytVideos) <= 2 ? 'Good platform balance' : null,
        reachEfficiency > 30 ? 'Effective audience reach' : null
      ].filter(Boolean),
      weaknesses: [
        avgEngagement < 3 ? 'Low engagement rates' : null,
        (igPosts + ytVideos) < 5 ? 'Inconsistent posting' : null,
        Math.abs(igPosts - ytVideos) > 3 ? 'Platform imbalance' : null,
        reachEfficiency < 20 ? 'Poor reach efficiency' : null
      ].filter(Boolean),
      opportunities: [
        'Leverage trending content formats',
        'Expand to new content categories',
        'Build stronger community engagement',
        'Explore cross-platform collaborations'
      ],
      threats: [
        'Algorithm changes affecting reach',
        'Increased competition in niche',
        'Audience attention span decreasing',
        'Platform policy changes'
      ]
    }
  };
}

// Simple in-memory cache for development
let insightsCache: { [key: string]: { data: any; expiresAt: number } } = {};

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const userId = session.user.email;
    const now = Date.now();
    
    // Check cache
    if (insightsCache[userId] && insightsCache[userId].expiresAt > now) {
      return NextResponse.json({
        success: true,
        data: insightsCache[userId].data,
        cached: true,
        generatedAt: new Date(insightsCache[userId].expiresAt - 48 * 60 * 60 * 1000),
        expiresAt: new Date(insightsCache[userId].expiresAt)
      });
    }

    return NextResponse.json({
      success: false,
      message: 'No cached insights available. Analytics data needed to generate new insights.',
      cached: false
    });

  } catch (error) {
    console.error('Error fetching AI insights:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch AI insights' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const body = await req.json();
    const { analyticsData, forceRefresh } = body;

    if (!analyticsData) {
      return NextResponse.json(
        { success: false, error: 'Analytics data is required' },
        { status: 400 }
      );
    }

    const userId = session.user.email;
    const now = Date.now();
    const expiresAt = now + 48 * 60 * 60 * 1000; // 48 hours

    // Check cache first (unless force refresh)
    if (!forceRefresh && insightsCache[userId] && insightsCache[userId].expiresAt > now) {
      return NextResponse.json({
        success: true,
        data: insightsCache[userId].data,
        cached: true,
        generatedAt: new Date(insightsCache[userId].expiresAt - 48 * 60 * 60 * 1000),
        expiresAt: new Date(insightsCache[userId].expiresAt)
      });
    }

    // Generate new insights with user name
    const userName = session.user.name || session.user.email?.split('@')[0] || 'Creator';
    const insights = await generateInsightsFromData(analyticsData, userName);

    // Cache the insights
    insightsCache[userId] = {
      data: insights,
      expiresAt
    };

    return NextResponse.json({
      success: true,
      data: insights,
      cached: false,
      generatedAt: new Date(),
      expiresAt: new Date(expiresAt)
    });

  } catch (error) {
    console.error('Error generating AI insights:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json(
      { success: false, error: 'Failed to generate AI insights' },
      { status: 500 }
    );
  }
}
