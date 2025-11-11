'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Calendar, BarChart3, Settings, Plus, Users, TrendingUp, User, LogOut, Instagram, Play, RefreshCw, ExternalLink, PenTool, Eye, Heart, MessageCircle, Share2, ThumbsUp, Video, TrendingDown, ArrowUp, ArrowDown, Clock, Sparkles, Brain, Target, Zap, Lightbulb, TrendingUp as TrendingUpIcon, AlertTriangle, CheckCircle, Star, Wand2, Film, Image as ImageIcon, Layers, Award, Users2, Globe, MapPin, PieChart as PieChartIcon, BarChart as BarChartIcon, Calendar as CalendarIcon, Globe as GlobeIcon, FileText } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DashboardSkeleton, AnalyticsCardSkeleton } from '@/components/ui/skeleton';
import { formatNumber, getRelativeTime } from '@/lib/utils';

interface DemographicData {
  gender: { name: string; value: number }[];
  age: { name: string; value: number }[];
  countries: { name: string; value: number; code: string }[];
}
import DashboardHeader from '@/components/dashboard-header';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface PlatformStatus {
  connected: boolean;
  account?: {
    username?: string;
    channelTitle?: string;
    followers?: number;
    subscribers?: number;
  };
}

interface CombinedAnalytics {
  platforms: {
    instagram: { connected: boolean; data?: any };
    youtube: { connected: boolean; data?: any };
  };
  comparison: {
    audience: { instagram: number; youtube: number; total: number };
    reach: { instagram: number; youtube: number; total: number };
    engagement: {
      instagram: { total: number; rate: number };
      youtube: { total: number; rate: number };
    };
  };
  fromCache?: boolean;
  isStale?: boolean;
  generatedAt?: string;
  timeSeries?: {
    instagram?: any;
    youtube?: any[];
    combined?: { date: string; instagramReach?: number; youtubeViews?: number; youtubeWatchTime?: number }[];
  };
}

interface TrendingContent {
  id: string;
  platform: 'instagram' | 'youtube';
  title?: string;
  caption?: string;
  thumbnail?: string;
  views: number;
  likes: number;
  comments: number;
  shares?: number;
  engagement_rate: number;
  publishedAt: string;
  url?: string;
}

const COLORS = {
  // Platform Colors
  instagram: '#8A3AB9', // More vibrant purple for Instagram
  youtube: '#FF0000',   // Classic YouTube red
  
  // Primary Colors
  primary: '#4F46E5',   // Deeper indigo for primary actions
  
  // Chart Colors - Distinct and accessible
  chart: {
    blue: '#3B82F6',    // Bright blue
    emerald: '#10B981', // Vibrant green
    amber: '#F59E0B',   // Warm amber
    rose: '#F43F5E',    // Vibrant pink/red
    indigo: '#6366F1',  // Rich indigo
    teal: '#14B8A6',    // Teal
    purple: '#8B5CF6',  // Soft purple
    pink: '#EC4899',    // Bright pink
    cyan: '#06B6D4',    // Cyan
    lime: '#84CC16',    // Lime green
    orange: '#F97316',  // Orange
    violet: '#7C3AED'   // Deep violet
  },
  
  // Status Colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  secondary: '#8B5CF6',
};

const CHART_COLORS = [
  COLORS.chart.blue,
  COLORS.chart.emerald,
  COLORS.chart.amber,
  COLORS.chart.rose,
  COLORS.chart.indigo,
  COLORS.chart.teal,
  COLORS.chart.purple,
  COLORS.chart.pink,
  COLORS.chart.cyan,
  COLORS.chart.lime,
  COLORS.chart.orange,
  COLORS.chart.violet
];

const parseMetricNumber = (value: any): number => {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const cleaned = value.replace(/[^0-9.]/g, '');
    if (cleaned.length === 0) return 0;
    const parsed = Number(cleaned);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

export default function DashboardPage() {
  const [activePlatform, setActivePlatform] = useState<'instagram' | 'youtube'>('instagram');
  const { data: session } = useSession();
  const [combinedAnalytics, setCombinedAnalytics] = useState<CombinedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [platformLoading, setPlatformLoading] = useState({
    instagram: false,
    youtube: false
  });
  const [demographicData, setDemographicData] = useState<{
    instagram: DemographicData | null;
    youtube: DemographicData | null;
  }>({
    instagram: null,
    youtube: null
  });
  const [demographicLoading, setDemographicLoading] = useState(false);
  const [platformStatus, setPlatformStatus] = useState<{
    instagram: PlatformStatus;
    youtube: PlatformStatus;
  }>({
    instagram: { connected: false },
    youtube: { connected: false }
  });
  const [lastPlatformStatus, setLastPlatformStatus] = useState<string>('');
  const [trendingContent, setTrendingContent] = useState<TrendingContent[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'lifetime'>('month');
  const [aiInsights, setAiInsights] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiInsightsCached, setAiInsightsCached] = useState(false);
  const [aiInsightsExpiry, setAiInsightsExpiry] = useState<Date | null>(null);
  const [selectedBars, setSelectedBars] = useState<{[key: string]: boolean}>({});

  const fetchPlatformStatus = async () => {
    try {
      const [igResponse, ytResponse] = await Promise.all([
        fetch('/api/instagram/status'),
        fetch('/api/youtube/status')
      ]);

      const [igStatus, ytStatus] = await Promise.all([
        igResponse.json(),
        ytResponse.json()
      ]);

      const newStatus = {
        instagram: igStatus,
        youtube: ytStatus
      };
      
      setPlatformStatus(newStatus);
      
      // Create a status signature to detect changes
      const statusSignature = `ig:${igStatus.connected}-yt:${ytStatus.connected}`;
      
      // If platform status changed, refresh analytics
      if (lastPlatformStatus && lastPlatformStatus !== statusSignature) {
        console.log('Dashboard: Platform status changed, refreshing analytics');
        await fetchCombinedAnalytics(true); // Force refresh
      }
      
      setLastPlatformStatus(statusSignature);
    } catch (error) {
      console.error('Error fetching platform status:', error);
    }
  };

  const fetchCombinedAnalytics = async (forceRefresh = false) => {
    try {
      const url = forceRefresh 
        ? `/api/analytics/combined?period=${selectedPeriod}&refresh=true`
        : `/api/analytics/combined?period=${selectedPeriod}`;
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log('Dashboard: Combined analytics received:', data.data);
        setCombinedAnalytics(data.data);
        
        // Extract trending content from analytics
        const trending: TrendingContent[] = [];
        
        const instagramRecent = data.data?.platforms?.instagram?.data?.recentContent || [];
        const youtubeRecent = data.data?.platforms?.youtube?.data?.recentContent || [];
        const youtubeTop = data.data?.platforms?.youtube?.data?.topContent || [];

        instagramRecent.slice(0, 5).forEach((post: any) => {
          const views = parseMetricNumber(post.views ?? post.impressions ?? post.reach ?? 0);
          const likes = parseMetricNumber(post.likes ?? post.like_count ?? 0);
          const comments = parseMetricNumber(post.comments ?? post.comments_count ?? 0);
          let engagementRate = Number(post.engagement_rate ?? post.engagement ?? 0);
          if (engagementRate > 0 && engagementRate <= 1) {
            engagementRate *= 100;
          } else if (engagementRate >= 100) {
            engagementRate /= 100;
          }
          if (engagementRate === 0 && (likes + comments) > 0 && views > 0) {
            engagementRate = ((likes + comments) / views) * 100;
          }

          trending.push({
            id: post.id,
            platform: 'instagram',
            caption: post.caption,
            thumbnail: post.thumbnailUrl || post.thumbnail || post.mediaUrl,
            views,
            likes,
            comments,
            engagement_rate: engagementRate,
            publishedAt: post.timestamp,
            url: post.permalink
          });
        });

        [...youtubeRecent.slice(0, 5), ...youtubeTop.slice(0, 5)].forEach((video: any) => {
          const views = parseMetricNumber(video.views ?? video.statistics?.viewCount ?? 0);
          const likes = parseMetricNumber(video.likes ?? video.statistics?.likeCount ?? 0);
          const comments = parseMetricNumber(video.comments ?? video.statistics?.commentCount ?? 0);
          let engagementRate = Number(video.engagement_rate ?? video.engagement ?? 0);
          if (engagementRate > 0 && engagementRate <= 1) {
            engagementRate *= 100;
          }
          if (engagementRate === 0 && (likes + comments) > 0 && views > 0) {
            engagementRate = ((likes + comments) / views) * 100;
          }

          trending.push({
            id: video.id,
            platform: 'youtube',
            title: video.title,
            thumbnail: video.thumbnailUrl || video.thumbnail,
            views,
            likes,
            comments,
            engagement_rate: engagementRate,
            publishedAt: video.publishedAt,
            url: video.url || (video.id ? `https://www.youtube.com/watch?v=${video.id}` : undefined)
          });
        });
        
        // Sort by engagement rate and ensure unique keys
        const uniqueTrending = trending
          .sort((a, b) => b.engagement_rate - a.engagement_rate)
          .slice(0, 10)
          .map((item, index) => {
            // Create a unique key using platform, item ID, and a random string
            const uniqueId = `${item.platform}_${item.id || 'no-id'}_${Math.random().toString(36).substr(2, 9)}`;
            return {
              ...item,
              id: uniqueId,
              key: uniqueId  // Add key separately to ensure it's used in the list
            };
          });
        setTrendingContent(uniqueTrending);
        
        // Auto-generate AI insights based on the analytics data
        await autoGenerateAIInsights(data.data);
      } else {
        console.error('Dashboard: Failed to fetch combined analytics:', response.status);
      }
    } catch (error) {
      console.error('Error fetching combined analytics:', error);
    }
  };

  const fetchDemographicData = async () => {
    try {
      setDemographicLoading(true);
      const response = await fetch('/api/analytics/demographics');
      if (response.ok) {
        const data = await response.json();
        setDemographicData(data.data);
        console.log('Demographic data:', data.data);
      }
    } catch (error) {
      console.error('Error fetching demographic data:', error);
    } finally {
      setDemographicLoading(false);
    }
  };

  // Handle platform selection for all charts
  const [selectedPlatform, setSelectedPlatform] = useState<'instagram' | 'youtube' | null>(null);
  
  const handlePlatformSelect = (platform: 'instagram' | 'youtube') => {
    setSelectedPlatform(prev => prev === platform ? null : platform);
  };
  
  // Helper function to get opacity based on platform selection
  const getOpacity = (platform: 'instagram' | 'youtube') => {
    return selectedPlatform === null || selectedPlatform === platform ? 1 : 0.3;
  };

  // Helper functions for comparison charts
  const getGenderComparisonData = () => {
    const genders = ['Female', 'Male', 'Other'];
    return genders.map(gender => {
      const igData = demographicData.instagram?.gender?.find(g => g.name === gender);
      const ytData = demographicData.youtube?.gender?.find(g => g.name === gender);
      return {
        gender,
        instagram: igData?.value || 0,
        youtube: ytData?.value || 0
      };
    });
  };

  const getAgeComparisonData = () => {
    const ageRanges = ['13-17', '18-24', '25-34', '35-44', '45-54', '55-64', '65+'];
    return ageRanges.map(age => {
      const igData = demographicData.instagram?.age?.find(a => a.name === age);
      const ytData = demographicData.youtube?.age?.find(a => a.name === age);
      return {
        age,
        instagram: igData?.value || 0,
        youtube: ytData?.value || 0
      };
    });
  };

  const getCountryComparisonData = () => {
    const allCountries = new Set<string>();
    
    // Collect all unique countries from both platforms
    demographicData.instagram?.countries?.forEach(c => allCountries.add(c.name));
    demographicData.youtube?.countries?.forEach(c => allCountries.add(c.name));
    
    // Get top 8 countries by combined audience
    const countryData = Array.from(allCountries).map(country => {
      const igData = demographicData.instagram?.countries?.find(c => c.name === country);
      const ytData = demographicData.youtube?.countries?.find(c => c.name === country);
      const instagramValue = parseFloat(igData?.value?.toString() || '0') || 0;
      const youtubeValue = parseFloat(ytData?.value?.toString() || '0') || 0;
      
      return {
        country,
        instagram: instagramValue,
        youtube: youtubeValue,
        total: instagramValue + youtubeValue,
        id: `country-${country.toLowerCase().replace(/\s+/g, '-')}`
      };
    });

    // Sort by total and take top 8
    return countryData
      .sort((a, b) => b.total - a.total)
      .slice(0, 8);
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPlatformStatus(),
        fetchCombinedAnalytics(),
        fetchDemographicData()
      ]);
      setLoading(false);
    };

    if (session?.user?.email) {
      loadData();
      
      // Set up periodic refresh to detect platform changes
      const interval = setInterval(async () => {
        console.log('Dashboard: Periodic status check');
        await fetchPlatformStatus();
      }, 30000); // Check every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [session, selectedPeriod]);

  // Separate effect to handle platform status changes
  useEffect(() => {
    if (lastPlatformStatus) {
      const currentSignature = `ig:${platformStatus.instagram.connected}-yt:${platformStatus.youtube.connected}`;
      if (lastPlatformStatus !== currentSignature) {
        console.log('Dashboard: Platform status effect triggered refresh');
        fetchCombinedAnalytics(true);
      }
    }
  }, [platformStatus.instagram.connected, platformStatus.youtube.connected]);

  const autoGenerateAIInsights = async (analyticsData: any) => {
    if (!analyticsData) return;
    
    try {
      // First, try to get cached insights
      const cachedResponse = await fetch('/api/ai/insights');
      if (cachedResponse.ok) {
        const cachedData = await cachedResponse.json();
        if (cachedData.success && cachedData.data) {
          setAiInsights(cachedData.data);
          setAiInsightsCached(cachedData.cached);
          setAiInsightsExpiry(new Date(cachedData.expiresAt));
          return;
        }
      }
      
      // If no cached data, generate new insights
      await generateFreshAIInsights(analyticsData);
    } catch (error) {
      console.error('Error auto-generating AI insights:', error);
    }
  };

  const generateFreshAIInsights = async (analyticsData: any, forceRefresh = false) => {
    if (!analyticsData || aiLoading) return;
    
    setAiLoading(true);
    try {
      const response = await fetch('/api/ai/insights', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analyticsData,
          forceRefresh
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setAiInsights(data.data);
          setAiInsightsCached(data.cached);
          setAiInsightsExpiry(new Date(data.expiresAt));
        }
      } else {
        console.error('Failed to generate AI insights:', response.status);
      }
    } catch (error) {
      console.error('Error generating AI insights:', error);
    } finally {
      setAiLoading(false);
    }
  };

  const handleRefreshAIInsights = async () => {
    if (combinedAnalytics) {
      await generateFreshAIInsights(combinedAnalytics, true);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    
    // Clear cache first
    try {
      await fetch('/api/cache/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: null }), // Clear all platforms
      });
      console.log('Dashboard: Cache cleared for refresh');
    } catch (error) {
      console.log('Dashboard: Cache clear failed:', error);
    }
    
    // Then fetch fresh data
    await Promise.all([
      fetchPlatformStatus(),
      fetchCombinedAnalytics(true)
    ]);
    
    setRefreshing(false);
  };

  const hasConnectedPlatforms = platformStatus.instagram.connected || platformStatus.youtube.connected;

  // Prepare chart data
  const platformComparisonData = combinedAnalytics ? [
    {
      name: 'Audience',
      Instagram: combinedAnalytics.comparison.audience?.instagram || 0,
      YouTube: combinedAnalytics.comparison.audience?.youtube || 0,
    },
    {
      name: 'Reach',
      Instagram: combinedAnalytics.comparison.reach?.instagram || 0,
      YouTube: combinedAnalytics.comparison.reach?.youtube || 0,
    },
    {
      name: 'Engagement',
      Instagram: combinedAnalytics.comparison.engagement?.instagram?.total || 0,
      YouTube: combinedAnalytics.comparison.engagement?.youtube?.total || 0,
    },
  ] : [];

  const audiencePieData = combinedAnalytics ? [
    { name: 'Instagram', value: combinedAnalytics.comparison.audience?.instagram || 0, color: COLORS.instagram },
    { name: 'YouTube', value: combinedAnalytics.comparison.audience?.youtube || 0, color: COLORS.youtube },
  ] : [];

  const engagementRateData = combinedAnalytics ? [
    { 
      name: 'Instagram', 
      rate: combinedAnalytics.comparison.engagement?.instagram?.rate || 0,
      color: COLORS.instagram 
    },
    { 
      name: 'YouTube', 
      rate: combinedAnalytics.comparison.engagement?.youtube?.rate || 0,
      color: COLORS.youtube 
    },
  ] : [];

  // Growth metrics
  const growthData = combinedAnalytics ? [
    {
      metric: 'Followers',
      instagram: combinedAnalytics.comparison.audience?.instagram || 0,
      youtube: combinedAnalytics.comparison.audience?.youtube || 0,
    },
    {
      metric: 'Avg Views',
      instagram: Math.round((combinedAnalytics.comparison.reach?.instagram || 0) / Math.max(combinedAnalytics.platforms?.instagram?.data?.posts || 1, 1)),
      youtube: Math.round((combinedAnalytics.comparison.reach?.youtube || 0) / Math.max(combinedAnalytics.platforms?.youtube?.data?.videos || 1, 1)),
    },
    {
      metric: 'Avg Engagement',
      instagram: Math.round((combinedAnalytics.comparison.engagement?.instagram?.total || 0) / Math.max(combinedAnalytics.platforms?.instagram?.data?.posts || 1, 1)),
      youtube: Math.round((combinedAnalytics.comparison.engagement?.youtube?.total || 0) / Math.max(combinedAnalytics.platforms?.youtube?.data?.videos || 1, 1)),
    },
  ] : [];

  // Performance metrics - calculate from actual data
  // The API returns 'recentContent' not 'recent_media' or 'recentVideos'
  const instagramRecentMedia = combinedAnalytics?.platforms?.instagram?.data?.recentContent || [];
  const youtubeRecentVideos = combinedAnalytics?.platforms?.youtube?.data?.recentContent || [];
  
  // Get metrics from the data structure
  const instagramMetrics = combinedAnalytics?.platforms?.instagram?.data?.metrics || {};
  const youtubeMetrics = combinedAnalytics?.platforms?.youtube?.data?.metrics || {};
  
  const instagramTotalLikes = instagramRecentMedia.reduce((sum: number, post: any) => sum + (post.like_count || 0), 0);
  const instagramTotalComments = instagramRecentMedia.reduce((sum: number, post: any) => sum + (post.comments_count || 0), 0);
  const instagramTotalShares = instagramRecentMedia.reduce((sum: number, post: any) => sum + (post.shares_count || 0), 0);
  const instagramTotalSaves = instagramRecentMedia.reduce((sum: number, post: any) => sum + (post.saved || 0), 0);
  
  const youtubeTotalViews = youtubeRecentVideos.reduce((sum: number, video: any) => sum + (video.views || 0), 0);
  const youtubeTotalLikes = youtubeRecentVideos.reduce((sum: number, video: any) => sum + (video.likes || 0), 0);
  const youtubeTotalComments = youtubeRecentVideos.reduce((sum: number, video: any) => sum + (video.comments || 0), 0);

  const instaCommentStats = combinedAnalytics?.platforms.instagram.data?.commentStats;
  const ytCommentStats = combinedAnalytics?.platforms.youtube.data?.commentStats;
  const instaBestTime = combinedAnalytics?.platforms.instagram.data?.bestTime;
  const ytBestTime = combinedAnalytics?.platforms.youtube.data?.bestTime;
  const instagramTopContent = combinedAnalytics?.platforms.instagram.data?.topContent || [];
  const youtubeTopContent = combinedAnalytics?.platforms.youtube.data?.topContent || [];
  const instagramLifetime = combinedAnalytics?.platforms.instagram.data?.metrics?.lifetimeTotals;
  const youtubeLifetime = combinedAnalytics?.platforms.youtube.data?.metrics?.lifetimeTotals;

  const combinedTimeSeries = combinedAnalytics?.timeSeries?.combined || [];
  const lineChartData = combinedTimeSeries.map((entry: any) => ({
    date: entry.date,
    instagramReach: entry.instagramReach || 0,
    youtubeViews: entry.youtubeViews || 0,
    youtubeWatchTime: entry.youtubeWatchTime || 0,
  }));

  const instagramTopCommented = instagramRecentMedia
    .slice()
    .sort((a: any, b: any) => (b.comments || 0) - (a.comments || 0))
    .filter((item: any) => (item.comments || 0) > 0)
    .slice(0, 3);

  const instagramNewestCommented = instagramRecentMedia
    .slice()
    .sort((a: any, b: any) => new Date(b.timestamp || 0).getTime() - new Date(a.timestamp || 0).getTime())
    .filter((item: any) => (item.comments || 0) > 0)
    .slice(0, 3);

  const youtubeTopCommented = youtubeRecentVideos
    .slice()
    .sort((a: any, b: any) => (b.comments || 0) - (a.comments || 0))
    .filter((item: any) => (item.comments || 0) > 0)
    .slice(0, 3);

  const youtubeNewestCommented = youtubeRecentVideos
    .slice()
    .sort((a: any, b: any) => new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime())
    .filter((item: any) => (item.comments || 0) > 0)
    .slice(0, 3);

  const performanceMetrics = {
    instagram: {
      totalPosts: combinedAnalytics?.platforms?.instagram?.data?.account?.media_count || 
                  instagramMetrics.totalPosts ||
                  instagramRecentMedia.length || 0,
      avgLikes: instagramMetrics.avgLikes || 
                (instagramRecentMedia.length > 0 ? Math.round(instagramTotalLikes / instagramRecentMedia.length) : 0),
      avgComments: instagramMetrics.avgComments ||
                   (instagramRecentMedia.length > 0 ? Math.round(instagramTotalComments / instagramRecentMedia.length) : 0),
      totalReach: combinedAnalytics?.comparison?.reach?.instagram || 
                  instagramMetrics.reach || 0,
      bestPostEngagement: instagramRecentMedia.length > 0 ? 
                          Math.max(...instagramRecentMedia.map((p: any) => (p.like_count || 0) + (p.comments_count || 0)), 0) : 0,
      totalLikes: instagramTotalLikes || instagramMetrics.totalLikes || 0,
      totalComments: instagramTotalComments || instagramMetrics.totalComments || 0,
      totalShares: instagramTotalShares || instagramMetrics.totalShares || 0,
      totalSaves: instagramTotalSaves || instagramMetrics.totalSaves || 0,
    },
    youtube: {
      totalVideos: combinedAnalytics?.platforms?.youtube?.data?.channel?.videoCount || 
                   youtubeMetrics.totalVideos ||
                   youtubeRecentVideos.length || 0,
      avgViews: youtubeMetrics.avgViews ||
                (youtubeRecentVideos.length > 0 ? Math.round(youtubeTotalViews / youtubeRecentVideos.length) : 0),
      avgLikes: youtubeMetrics.avgLikes ||
                (youtubeRecentVideos.length > 0 ? Math.round(youtubeTotalLikes / youtubeRecentVideos.length) : 0),
      totalWatchTime: youtubeMetrics.watchTime || 0,
      bestVideoViews: youtubeRecentVideos.length > 0 ?
                      Math.max(...youtubeRecentVideos.map((v: any) => v.views || 0), 0) : 0,
      totalLikes: youtubeTotalLikes || youtubeMetrics.totalLikes || 0,
      totalComments: youtubeTotalComments || youtubeMetrics.totalComments || 0,
      totalViews: youtubeTotalViews || youtubeMetrics.totalViews || 0,
    }
  };

  // Engagement breakdown for Instagram
  const instagramEngagementBreakdown = [
    { name: 'Likes', value: performanceMetrics.instagram.totalLikes, color: '#E4405F' },
    { name: 'Comments', value: performanceMetrics.instagram.totalComments, color: '#C13584' },
    { name: 'Shares', value: performanceMetrics.instagram.totalShares, color: '#833AB4' },
    { name: 'Saves', value: performanceMetrics.instagram.totalSaves, color: '#FD1D1D' },
  ].filter(item => item.value > 0);

  // Engagement breakdown for YouTube
  const youtubeEngagementBreakdown = [
    { name: 'Likes', value: performanceMetrics.youtube.totalLikes, color: '#FF0000' },
    { name: 'Comments', value: performanceMetrics.youtube.totalComments, color: '#CC0000' },
    { name: 'Views', value: performanceMetrics.youtube.totalViews, color: '#990000' },
  ].filter(item => item.value > 0);

  if (!session) {
    return <DashboardSkeleton />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col gap-8">
          <DashboardHeader
            title="Dashboard"
            description={
              <span>
                Welcome back! Here's your social media overview.
                {combinedAnalytics?.fromCache && (
                  <span className="ml-2 text-xs bg-yellow-50 text-yellow-700 px-2 py-0.5 rounded-full border border-yellow-100">
                    {combinedAnalytics.isStale ? 'Updating...' : 'Cached'}
                  </span>
                )}
              </span>
            }
            className="w-full"
          >
          <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-2 w-full">
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 shadow-sm hover:shadow disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className={`w-4 h-4 flex-shrink-0 ${refreshing ? 'animate-spin' : ''}`} />
              <span className="truncate">{refreshing ? 'Refreshing...' : 'Refresh Data'}</span>
            </button>

            <Link 
              href="/dashboard/accounts"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 shadow-sm hover:shadow"
            >
              <Users2 className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Manage Accounts</span>
            </Link>
            
            <Link 
              href="/dashboard/posts"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 shadow-sm hover:shadow-md"
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Posts History</span>
            </Link>

            <Link 
              href="/dashboard/content/create"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3 sm:px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-150 shadow-sm hover:shadow-md"
            >
              <Plus className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Create Post</span>
            </Link>
          </div>
        </DashboardHeader>

        {!hasConnectedPlatforms ? (
          // No platforms connected
          <div className="text-center py-12">
            <div className="max-w-md mx-auto">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Accounts</h2>
                <p className="text-gray-600 mb-6">
                  Connect your Instagram and YouTube accounts to start managing your content and viewing analytics.
                </p>
                <Link
                  href="/dashboard/accounts"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors inline-flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Connect Accounts
                </Link>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-8">
            {/* Platform Status Cards */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:gap-6">
              {/* Instagram Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                      <Instagram className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Instagram</h3>
                      <p className="text-sm text-gray-500">
                        {platformStatus.instagram.connected ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/instagram"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
                
                {platformStatus.instagram.connected ? (
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">
                      @{platformStatus.instagram.account?.username || combinedAnalytics?.platforms?.instagram?.data?.account?.username || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      {!combinedAnalytics?.platforms?.instagram?.data && loading ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        `${formatNumber(combinedAnalytics?.platforms?.instagram?.data?.account?.followers || platformStatus.instagram.account?.followers || 0)} followers`
                      )}
                    </p>
                  </div>
                ) : (
                  <Link
                    href="/dashboard/accounts"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Connect Instagram →
                  </Link>
                )}
              </div>

              {/* YouTube Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-500">
                      <Play className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">YouTube</h3>
                      <p className="text-sm text-gray-500">
                        {platformStatus.youtube.connected ? 'Connected' : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  <Link
                    href="/dashboard/youtube"
                    className="text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Link>
                </div>
                
                {platformStatus.youtube.connected ? (
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">
                      {platformStatus.youtube.account?.channelTitle || combinedAnalytics?.platforms?.youtube?.data?.channel?.title || 'Unknown'}
                    </p>
                    <p className="text-sm text-gray-600 flex items-center gap-2">
                      {!combinedAnalytics?.platforms?.youtube?.data && loading ? (
                        <>
                          <RefreshCw className="w-3 h-3 animate-spin" />
                          Loading...
                        </>
                      ) : (
                        `${formatNumber(combinedAnalytics?.platforms?.youtube?.data?.channel?.subscribers || platformStatus.youtube.account?.subscribers || 0)} subscribers`
                      )}
                    </p>
                  </div>
                ) : (
                  <Link
                    href="/dashboard/accounts"
                    className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                  >
                    Connect YouTube →
                  </Link>
                )}
              </div>
            </div>

            {/* Combined Analytics */}
            {combinedAnalytics && combinedAnalytics.comparison && (
              <div className="flex flex-col gap-8">
                {/* Key Metrics */}
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-6">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">Total Audience</h3>
                      <Users className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(combinedAnalytics.comparison.audience?.total || 0)}
                    </p>
                    <div className="text-xs text-gray-500 mt-1">
                      IG: {formatNumber(combinedAnalytics.comparison.audience?.instagram || 0)} • 
                      YT: {formatNumber(combinedAnalytics.comparison.audience?.youtube || 0)}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">Total Reach</h3>
                      <TrendingUp className="w-4 h-4 text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(combinedAnalytics.comparison.reach?.total || 0)}
                    </p>
                    <div className="text-xs text-gray-500 mt-1">
                      IG: {formatNumber(combinedAnalytics.comparison.reach?.instagram || 0)} • 
                      YT: {formatNumber(combinedAnalytics.comparison.reach?.youtube || 0)}
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">IG Engagement</h3>
                      <Instagram className="w-4 h-4 text-purple-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(combinedAnalytics.comparison.engagement?.instagram?.total || 0)}
                    </p>
                    <div className="text-xs text-gray-500 mt-1">
                      {(combinedAnalytics.comparison.engagement?.instagram?.rate || 0).toFixed(1)}% rate
                    </div>
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-sm font-medium text-gray-600">YT Engagement</h3>
                      <Play className="w-4 h-4 text-red-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                      {formatNumber(combinedAnalytics.comparison.engagement?.youtube?.total || 0)}
                    </p>
                    <div className="text-xs text-gray-500 mt-1">
                      {(combinedAnalytics.comparison.engagement?.youtube?.rate || 0).toFixed(1)}% rate
                    </div>
                  </div>
                </div>

                {/* Period Selector */}
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <h2 className="text-2xl font-bold text-gray-900">Analytics Overview</h2>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { key: 'week', label: 'Last 7 Days' },
                      { key: 'month', label: 'Last 28 Days' },
                      { key: 'lifetime', label: 'Lifetime' }
                    ].map(item => (
                      <button
                        key={item.key}
                        onClick={() => setSelectedPeriod(item.key as 'week' | 'month' | 'lifetime')}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          selectedPeriod === item.key
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Platform Comparison Chart */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-hidden">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Platform Comparison</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={platformComparisonData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="name" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        formatter={(value: any) => formatNumber(value)}
                      />
                      <Legend />
                      <Bar 
                        dataKey="Instagram" 
                        fill={COLORS.instagram} 
                        radius={[8, 8, 0, 0]} 
                        onClick={() => handlePlatformSelect('instagram')}
                        cursor="pointer"
                        opacity={getOpacity('instagram')}
                      />
                      <Bar 
                        dataKey="YouTube" 
                        fill={COLORS.youtube} 
                        radius={[8, 8, 0, 0]} 
                        onClick={() => handlePlatformSelect('youtube')}
                        cursor="pointer"
                        opacity={getOpacity('youtube')}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Audience Distribution & Engagement Rate */}
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  {/* Audience Pie Chart */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Audience Distribution</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <PieChart>
                        <Pie
                          data={audiencePieData}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }: any) => `${name}: ${((percent || 0) * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {audiencePieData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value: any) => formatNumber(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-2">
                      {audiencePieData.map((item) => (
                        <div key={item.name} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className="text-sm text-gray-600">{item.name}</span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">{formatNumber(item.value)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Engagement Rate Comparison */}
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Engagement Rate</h3>
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={engagementRateData} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" stroke="#6b7280" />
                        <YAxis dataKey="name" type="category" stroke="#6b7280" />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                          formatter={(value: any) => `${value.toFixed(2)}%`}
                        />
                        <Bar 
                          dataKey="rate" 
                          fill="#10b981" 
                          name="Engagement Rate (%)"
                          onClick={() => handlePlatformSelect('instagram')}
                          cursor="pointer"
                          opacity={getOpacity('instagram')}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="mt-4 space-y-3">
                      {engagementRateData.map((item) => (
                        <div key={item.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                          <span className="text-sm font-medium text-gray-700">{item.name}</span>
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-bold" style={{ color: item.color }}>
                              {item.rate.toFixed(2)}%
                            </span>
                            {item.rate > 3 ? (
                              <ArrowUp className="w-4 h-4 text-green-500" />
                            ) : (
                              <ArrowDown className="w-4 h-4 text-red-500" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Growth Metrics Comparison */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 overflow-hidden">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6">Growth & Performance Metrics</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={growthData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="metric" stroke="#6b7280" />
                      <YAxis stroke="#6b7280" />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                        formatter={(value: any) => formatNumber(value)}
                      />
                      <Legend />
                      <Bar 
                        dataKey="instagram" 
                        name="Instagram" 
                        fill={COLORS.instagram} 
                        radius={[8, 8, 0, 0]} 
                        onClick={() => handlePlatformSelect('instagram')}
                        cursor="pointer"
                        opacity={getOpacity('instagram')}
                      />
                      <Bar 
                        dataKey="youtube" 
                        name="YouTube" 
                        fill={COLORS.youtube} 
                        radius={[8, 8, 0, 0]} 
                        onClick={() => handlePlatformSelect('youtube')}
                        cursor="pointer"
                        opacity={getOpacity('youtube')}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                {/* Detailed Platform Performance */}
                <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                  {/* Instagram Performance */}
                  {platformStatus.instagram.connected && (
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl shadow-sm border border-purple-200 p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500">
                          <Instagram className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">Instagram Performance</h3>
                          <p className="text-sm text-gray-600">Detailed metrics</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-white rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Video className="w-4 h-4 text-purple-500" />
                            <span className="text-xs font-medium text-gray-600">Total Posts</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{formatNumber(performanceMetrics.instagram.totalPosts)}</p>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Eye className="w-4 h-4 text-purple-500" />
                            <span className="text-xs font-medium text-gray-600">Total Reach</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{formatNumber(performanceMetrics.instagram.totalReach)}</p>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Heart className="w-4 h-4 text-pink-500" />
                            <span className="text-xs font-medium text-gray-600">Avg Likes</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{formatNumber(performanceMetrics.instagram.avgLikes)}</p>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <MessageCircle className="w-4 h-4 text-pink-500" />
                            <span className="text-xs font-medium text-gray-600">Avg Comments</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{formatNumber(performanceMetrics.instagram.avgComments)}</p>
                        </div>
                      </div>

                      {instagramEngagementBreakdown.length > 0 && (
                        <>
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Engagement Breakdown</h4>
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie
                                data={instagramEngagementBreakdown}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                              >
                                {instagramEngagementBreakdown.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: any) => formatNumber(value)} />
                            </PieChart>
                          </ResponsiveContainer>
                        </>
                      )}
                    </div>
                  )}

                  {/* YouTube Performance */}
                  {platformStatus.youtube.connected && (
                    <div className="bg-gradient-to-br from-red-50 to-orange-50 rounded-xl shadow-sm border border-red-200 p-6">
                      <div className="flex items-center gap-3 mb-6">
                        <div className="p-3 rounded-lg bg-red-500">
                          <Play className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">YouTube Performance</h3>
                          <p className="text-sm text-gray-600">Detailed metrics</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div className="bg-white rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Video className="w-4 h-4 text-red-500" />
                            <span className="text-xs font-medium text-gray-600">Total Videos</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{formatNumber(performanceMetrics.youtube.totalVideos)}</p>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Eye className="w-4 h-4 text-red-500" />
                            <span className="text-xs font-medium text-gray-600">Avg Views</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{formatNumber(performanceMetrics.youtube.avgViews)}</p>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <ThumbsUp className="w-4 h-4 text-red-500" />
                            <span className="text-xs font-medium text-gray-600">Avg Likes</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{formatNumber(performanceMetrics.youtube.avgLikes)}</p>
                        </div>
                        
                        <div className="bg-white rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <TrendingUp className="w-4 h-4 text-red-500" />
                            <span className="text-xs font-medium text-gray-600">Best Video</span>
                          </div>
                          <p className="text-2xl font-bold text-gray-900">{formatNumber(performanceMetrics.youtube.bestVideoViews)}</p>
                          <p className="text-xs text-gray-500 mt-1">views</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-100 p-6 shadow-sm">
                          <h3 className="text-sm font-semibold text-blue-700 uppercase tracking-wide">YouTube Lifetime Views</h3>
                          <p className="mt-3 text-3xl font-bold text-blue-900">{formatNumber(youtubeLifetime?.views || 0)}</p>
                          <p className="mt-1 text-xs text-blue-600">Across {formatNumber(performanceMetrics.youtube.totalVideos)} videos</p>
                        </div>
                        <div className="rounded-xl border border-purple-200 bg-gradient-to-br from-purple-50 via-white to-purple-100 p-6 shadow-sm">
                          <h3 className="text-sm font-semibold text-purple-700 uppercase tracking-wide">Instagram Followers</h3>
                          <p className="mt-3 text-3xl font-bold text-purple-900">{formatNumber(instagramLifetime?.followers || performanceMetrics.instagram.totalPosts)}</p>
                          <p className="mt-1 text-xs text-purple-600">Total posts: {formatNumber(instagramLifetime?.posts || performanceMetrics.instagram.totalPosts)}</p>
                        </div>
                        <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 via-white to-emerald-100 p-6 shadow-sm">
                          <h3 className="text-sm font-semibold text-emerald-700 uppercase tracking-wide">Lifetime Comments</h3>
                          <p className="mt-3 text-3xl font-bold text-emerald-900">{formatNumber((instagramMetrics?.totalComments || 0) + (youtubeMetrics?.totalComments || 0))}</p>
                          <p className="mt-1 text-xs text-emerald-600">Instagram + YouTube combined</p>
                        </div>
                      </div>

                      {youtubeEngagementBreakdown.length > 0 && (
                        <>
                          <h4 className="text-sm font-semibold text-gray-900 mb-3">Engagement Breakdown</h4>
                          <ResponsiveContainer width="100%" height={200}>
                            <PieChart>
                              <Pie
                                data={youtubeEngagementBreakdown}
                                cx="50%"
                                cy="50%"
                                innerRadius={50}
                                outerRadius={80}
                                fill="#8884d8"
                                paddingAngle={5}
                                dataKey="value"
                                label={({ name, percent }: any) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                              >
                                {youtubeEngagementBreakdown.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip formatter={(value: any) => formatNumber(value)} />
                            </PieChart>
                          </ResponsiveContainer>
                        </>
                      )}
                    </div>
                  )}
                </div>

                {/* AI Insights Section */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-sm border border-purple-200 p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5 text-purple-600" />
                      AI-Powered Insights
                    </h3>
                    <div className="flex items-center gap-2">
                      {aiInsightsCached && aiInsightsExpiry && (
                        <div className="text-xs text-purple-600 bg-purple-50 px-2 py-1 rounded">
                          Cached • Expires {new Date(aiInsightsExpiry).toLocaleDateString()}
                        </div>
                      )}
                      <button
                        onClick={handleRefreshAIInsights}
                        disabled={aiLoading}
                        className="bg-purple-100 hover:bg-purple-200 text-purple-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
                      >
                        <RefreshCw className={`w-4 h-4 ${aiLoading ? 'animate-spin' : ''}`} />
                        {aiLoading ? 'Refreshing...' : 'Refresh Insights'}
                      </button>
                    </div>
                  </div>
                  
                  {aiInsights ? (
                    <div className="space-y-6">
                      {/* Motivational Quote Banner */}
                      {aiInsights.motivational_quote && (
                        <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                          <div className="flex items-start gap-4">
                            <div className="flex-shrink-0">
                              <Sparkles className="w-8 h-8 text-yellow-300" />
                            </div>
                            <div className="flex-1">
                              <h4 className="text-lg font-semibold mb-2">💪 Your Personal Motivation</h4>
                              <p className="text-lg leading-relaxed font-medium">
                                {aiInsights.motivational_quote}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Performance Overview */}
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <div className="bg-white rounded-lg p-4 border border-purple-100">
                          <div className="flex items-center gap-2 mb-3">
                            <Target className="w-4 h-4 text-purple-500" />
                            <span className="text-sm font-medium text-gray-600">Performance Score</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-3xl font-bold text-purple-600">
                              {aiInsights.performance_score || 'N/A'}
                            </div>
                            <div className="text-sm text-gray-500">/100</div>
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {(aiInsights.performance_score || 0) > 80 ? 'Excellent performance!' : 
                             (aiInsights.performance_score || 0) > 60 ? 'Good performance' : 
                             'Room for improvement'}
                          </p>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-purple-100">
                          <div className="flex items-center gap-2 mb-3">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <span className="text-sm font-medium text-gray-600">Best Platform</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {aiInsights.best_platform === 'instagram' ? (
                              <>
                                <Instagram className="w-5 h-5 text-pink-500" />
                                <span className="font-semibold text-gray-900">Instagram</span>
                              </>
                            ) : aiInsights.best_platform === 'youtube' ? (
                              <>
                                <Play className="w-5 h-5 text-red-500" />
                                <span className="font-semibold text-gray-900">YouTube</span>
                              </>
                            ) : (
                              <>
                                <TrendingUp className="w-5 h-5 text-blue-500" />
                                <span className="font-semibold text-gray-900">Balanced</span>
                              </>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {aiInsights.metrics?.growth_stage || 'Growth stage'} potential
                          </p>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-purple-100">
                          <div className="flex items-center gap-2 mb-3">
                            <Eye className="w-4 h-4 text-blue-500" />
                            <span className="text-sm font-medium text-gray-600">Reach Efficiency</span>
                          </div>
                          <div className="text-2xl font-bold text-blue-600">
                            {aiInsights.metrics?.reach_efficiency?.toFixed(1) || '0'}%
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {(aiInsights.metrics?.reach_efficiency || 0) > 30 ? 'Excellent reach' : 'Needs improvement'}
                          </p>
                        </div>

                        <div className="bg-white rounded-lg p-4 border border-purple-100">
                          <div className="flex items-center gap-2 mb-3">
                            <Heart className="w-4 h-4 text-red-500" />
                            <span className="text-sm font-medium text-gray-600">Avg Engagement</span>
                          </div>
                          <div className="text-2xl font-bold text-red-600">
                            {aiInsights.metrics?.total_engagement_rate?.toFixed(2) || '0'}%
                          </div>
                          <p className="text-xs text-gray-500 mt-2">
                            {(aiInsights.metrics?.total_engagement_rate || 0) > 5 ? 'Outstanding!' : 'Can improve'}
                          </p>
                        </div>
                      </div>

                      {/* Performance History Line Graph */}
                      {aiInsights.performance_history && aiInsights.performance_history.length > 0 && (
                        <div className="bg-white rounded-lg p-6 border border-indigo-100">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <TrendingUpIcon className="w-5 h-5 text-indigo-600" />
                            7-Day Performance Trend
                          </h4>
                          <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={aiInsights.performance_history}>
                              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                              <XAxis dataKey="date" stroke="#6b7280" style={{ fontSize: '12px' }} />
                              <YAxis stroke="#6b7280" style={{ fontSize: '12px' }} />
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                                labelStyle={{ color: '#111827', fontWeight: 'bold' }}
                              />
                              <Legend wrapperStyle={{ fontSize: '12px' }} />
                              <Line 
                                type="monotone" 
                                dataKey="engagement" 
                                stroke="#8b5cf6" 
                                strokeWidth={3}
                                dot={{ fill: '#8b5cf6', r: 4 }}
                                activeDot={{ r: 6 }}
                              />
                              <Line 
                                type="monotone" 
                                dataKey="reach" 
                                stroke="#06b6d4" 
                                strokeWidth={3}
                                name="Reach"
                                dot={{ fill: '#06b6d4', r: 4 }}
                                activeDot={{ r: 6 }}
                              />
                            </LineChart>
                          </ResponsiveContainer>
                        </div>
                      )}

                      {/* Content Type Analysis */}
                      {aiInsights.content_analysis && (
                        <div className="bg-white rounded-lg p-6 border border-emerald-100">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-emerald-600" />
                            Best Performing Content Types
                          </h4>
                          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                            {/* Instagram Analysis */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Instagram className="w-5 h-5 text-pink-500" />
                                <h5 className="font-semibold text-gray-900">Instagram</h5>
                              </div>
                              
                              {aiInsights.content_analysis.instagram.bestPerforming && (
                                <div className="p-4 bg-gradient-to-br from-pink-50 to-purple-50 rounded-lg border border-pink-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600">Top Performer</span>
                                    <Film className="w-4 h-4 text-pink-500" />
                                  </div>
                                  <div className="text-2xl font-bold text-pink-600 mb-1">
                                    {aiInsights.content_analysis.instagram.bestPerforming.type}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Avg: {Math.round(aiInsights.content_analysis.instagram.bestPerforming.avgEngagement)} engagements
                                  </div>
                                  <div className="text-xs text-gray-500 mt-2">
                                    {aiInsights.content_analysis.instagram.bestPerforming.count} posts
                                  </div>
                                </div>
                              )}

                              {aiInsights.content_analysis.instagram.contentTypes && aiInsights.content_analysis.instagram.contentTypes.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-gray-600 mb-2">Content Breakdown:</p>
                                  {aiInsights.content_analysis.instagram.contentTypes.map((type: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                      <span className="text-sm text-gray-700">{type.type}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">{type.count} posts</span>
                                        <span className="text-xs font-medium text-pink-600">
                                          {Math.round(type.avgEngagement)} avg
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="p-3 bg-pink-50 border-l-4 border-pink-500 rounded">
                                <p className="text-xs font-medium text-pink-800 mb-1">💡 Recommendation:</p>
                                <p className="text-sm text-pink-700">
                                  {aiInsights.content_analysis.instagram.recommendation}
                                </p>
                              </div>
                            </div>

                            {/* YouTube Analysis */}
                            <div className="space-y-4">
                              <div className="flex items-center gap-2 mb-3">
                                <Play className="w-5 h-5 text-red-500" />
                                <h5 className="font-semibold text-gray-900">YouTube</h5>
                              </div>
                              
                              {aiInsights.content_analysis.youtube.bestPerforming && (
                                <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-200">
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-sm font-medium text-gray-600">Top Performer</span>
                                    <Video className="w-4 h-4 text-red-500" />
                                  </div>
                                  <div className="text-2xl font-bold text-red-600 mb-1">
                                    {aiInsights.content_analysis.youtube.bestPerforming.type}
                                  </div>
                                  <div className="text-sm text-gray-600">
                                    Avg: {Math.round(aiInsights.content_analysis.youtube.bestPerforming.avgEngagement)} engagements
                                  </div>
                                  <div className="text-xs text-gray-500 mt-2">
                                    {aiInsights.content_analysis.youtube.bestPerforming.count} videos
                                  </div>
                                </div>
                              )}

                              {aiInsights.content_analysis.youtube.contentTypes && aiInsights.content_analysis.youtube.contentTypes.length > 0 && (
                                <div className="space-y-2">
                                  <p className="text-xs font-medium text-gray-600 mb-2">Content Breakdown:</p>
                                  {aiInsights.content_analysis.youtube.contentTypes.map((type: any, idx: number) => (
                                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                      <span className="text-sm text-gray-700">{type.type}</span>
                                      <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-500">{type.count} videos</span>
                                        <span className="text-xs font-medium text-red-600">
                                          {Math.round(type.avgEngagement)} avg
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}

                              <div className="p-3 bg-red-50 border-l-4 border-red-500 rounded">
                                <p className="text-xs font-medium text-red-800 mb-1">💡 Recommendation:</p>
                                <p className="text-sm text-red-700">
                                  {aiInsights.content_analysis.youtube.recommendation}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Detailed Metrics Cards */}
                      {aiInsights.metrics && (
                        <div className="bg-white rounded-lg p-6 border border-violet-100">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Brain className="w-5 h-5 text-violet-600" />
                            Detailed Performance Metrics
                          </h4>
                          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                            <div className="p-4 bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg border border-violet-200">
                              <div className="text-sm font-medium text-gray-600 mb-2">Engagement Quality</div>
                              <div className="text-2xl font-bold text-violet-600 mb-1">
                                {aiInsights.metrics.engagement_quality || 'N/A'}
                              </div>
                              <div className="text-xs text-gray-500">
                                {(aiInsights.metrics.total_engagement_rate || 0).toFixed(2)}% average rate
                              </div>
                            </div>

                            <div className="p-4 bg-gradient-to-br from-cyan-50 to-blue-50 rounded-lg border border-cyan-200">
                              <div className="text-sm font-medium text-gray-600 mb-2">Content Velocity</div>
                              <div className="text-2xl font-bold text-cyan-600 mb-1">
                                {(aiInsights.metrics.content_velocity || 0).toFixed(1)}
                              </div>
                              <div className="text-xs text-gray-500">
                                posts per week (optimal: 7)
                              </div>
                            </div>

                            <div className="p-4 bg-gradient-to-br from-emerald-50 to-green-50 rounded-lg border border-emerald-200">
                              <div className="text-sm font-medium text-gray-600 mb-2">Growth Momentum</div>
                              <div className="text-2xl font-bold text-emerald-600 mb-1">
                                {(aiInsights.metrics.growth_momentum || 0).toFixed(0)}/100
                              </div>
                              <div className="text-xs text-gray-500">
                                {aiInsights.metrics.growth_stage || 'N/A'} stage
                              </div>
                            </div>

                            <div className="p-4 bg-gradient-to-br from-pink-50 to-rose-50 rounded-lg border border-pink-200">
                              <div className="text-sm font-medium text-gray-600 mb-2">Instagram vs Benchmark</div>
                              <div className="text-2xl font-bold text-pink-600 mb-1">
                                {(aiInsights.metrics.ig_vs_benchmark || 0).toFixed(0)}%
                              </div>
                              <div className="text-xs text-gray-500">
                                {(aiInsights.metrics.ig_vs_benchmark || 0) >= 100 ? '✅ Above' : '⚠️ Below'} industry avg
                              </div>
                            </div>

                            <div className="p-4 bg-gradient-to-br from-red-50 to-orange-50 rounded-lg border border-red-200">
                              <div className="text-sm font-medium text-gray-600 mb-2">YouTube vs Benchmark</div>
                              <div className="text-2xl font-bold text-red-600 mb-1">
                                {(aiInsights.metrics.yt_vs_benchmark || 0).toFixed(0)}%
                              </div>
                              <div className="text-xs text-gray-500">
                                {(aiInsights.metrics.yt_vs_benchmark || 0) >= 100 ? '✅ Above' : '⚠️ Below'} industry avg
                              </div>
                            </div>

                            <div className="p-4 bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg border border-amber-200">
                              <div className="text-sm font-medium text-gray-600 mb-2">Reach Efficiency</div>
                              <div className="text-2xl font-bold text-amber-600 mb-1">
                                {(aiInsights.metrics.reach_efficiency || 0).toFixed(1)}%
                              </div>
                              <div className="text-xs text-gray-500">
                                of audience reached (optimal: 30-50%)
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Recommendations */}
                      {aiInsights.recommendations && aiInsights.recommendations.length > 0 && (
                        <div className="bg-white rounded-lg p-6 border border-purple-100">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Lightbulb className="w-5 h-5 text-amber-500" />
                            AI Recommendations
                          </h4>
                          <div className="space-y-4">
                            {aiInsights.recommendations.map((rec: any, index: number) => (
                              <div key={index} className={`p-4 rounded-lg border-l-4 ${
                                rec.priority === 'critical' ? 'border-red-500 bg-red-50' :
                                rec.priority === 'high' ? 'border-orange-500 bg-orange-50' :
                                rec.priority === 'medium' ? 'border-yellow-500 bg-yellow-50' :
                                'border-blue-500 bg-blue-50'
                              }`}>
                                <div className="flex items-start justify-between mb-2">
                                  <h5 className="font-semibold text-gray-900">{rec.type}</h5>
                                  <span className={`px-2 py-1 rounded text-xs font-medium ${
                                    rec.priority === 'critical' ? 'bg-red-100 text-red-800' :
                                    rec.priority === 'high' ? 'bg-orange-100 text-orange-800' :
                                    rec.priority === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                    'bg-blue-100 text-blue-800'
                                  }`}>
                                    {rec.priority}
                                  </span>
                                </div>
                                <p className="text-sm text-gray-700 mb-3">{rec.description}</p>
                                {rec.actionItems && (
                                  <div className="mb-3">
                                    <p className="text-xs font-medium text-gray-600 mb-2">Action Items:</p>
                                    <ul className="text-xs text-gray-600 space-y-1">
                                      {rec.actionItems.map((item: string, i: number) => (
                                        <li key={i} className="flex items-start gap-2">
                                          <span className="text-gray-400 mt-1">•</span>
                                          <span>{item}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                )}
                                <div className="flex justify-between text-xs text-gray-500">
                                  <span><strong>Expected Impact:</strong> {rec.expectedImpact}</span>
                                  <span><strong>Timeframe:</strong> {rec.timeframe}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* SWOT Analysis */}
                      {aiInsights.detailed_analysis && (
                        <div className="bg-white rounded-lg p-6 border border-purple-100">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-blue-600" />
                            SWOT Analysis
                          </h4>
                          <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-4">
                              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                <h5 className="font-semibold text-emerald-800 mb-2 flex items-center gap-2">
                                  <CheckCircle className="w-4 h-4" />
                                  Strengths
                                </h5>
                                <ul className="text-sm text-emerald-700 space-y-1">
                                  {aiInsights.detailed_analysis.strengths.map((strength: string, index: number) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <span className="text-emerald-500 mt-1">✓</span>
                                      <span>{strength}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                                <h5 className="font-semibold text-indigo-800 mb-2 flex items-center gap-2">
                                  <TrendingUp className="w-4 h-4" />
                                  Opportunities
                                </h5>
                                <ul className="text-sm text-indigo-700 space-y-1">
                                  {aiInsights.detailed_analysis.opportunities.map((opp: string, index: number) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <span className="text-indigo-500 mt-1">→</span>
                                      <span>{opp}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                            
                            <div className="space-y-4">
                              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                <h5 className="font-semibold text-amber-800 mb-2 flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4" />
                                  Weaknesses
                                </h5>
                                <ul className="text-sm text-amber-700 space-y-1">
                                  {aiInsights.detailed_analysis.weaknesses.map((weakness: string, index: number) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <span className="text-amber-500 mt-1">!</span>
                                      <span>{weakness}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                              
                              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                                <h5 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                                  <AlertTriangle className="w-4 h-4" />
                                  Threats
                                </h5>
                                <ul className="text-sm text-red-700 space-y-1">
                                  {aiInsights.detailed_analysis.threats.map((threat: string, index: number) => (
                                    <li key={index} className="flex items-start gap-2">
                                      <span className="text-red-500 mt-1">⚠</span>
                                      <span>{threat}</span>
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Brain className="w-12 h-12 text-purple-300 mx-auto mb-3" />
                      <p className="text-gray-600 mb-4">Get AI-powered insights about your content performance</p>
                      <button
                        onClick={() => autoGenerateAIInsights(combinedAnalytics)}
                        disabled={aiLoading}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 mx-auto"
                      >
                        <Sparkles className="w-4 h-4" />
                        {aiLoading ? 'Generating...' : 'Generate AI Insights'}
                      </button>
                    </div>
                  )}
                </div>

                {/* AI Content Suggestions */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-xl shadow-sm border border-blue-200 p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
                    <Wand2 className="w-5 h-5 text-blue-600" />
                    AI Content Suggestions
                  </h3>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Optimal Posting Times */}
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Clock className="w-4 h-4 text-blue-500" />
                        <span className="text-sm font-medium text-gray-600">Best Time to Post</span>
                      </div>
                      <div className="space-y-2">
                        {(aiInsights?.content_suggestions?.optimal_posting_times?.instagram || instaBestTime) && (
                          <div className="flex flex-col">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-gray-600">Instagram:</span>
                            </div>
                            <div className="text-sm text-gray-900 mt-1">
                              {typeof aiInsights?.content_suggestions?.optimal_posting_times?.instagram === 'object' ? (
                                <div className="space-y-1">
                                  <div>Weekdays: {aiInsights.content_suggestions.optimal_posting_times.instagram.weekdays || 'Not specified'}</div>
                                  <div>Weekends: {aiInsights.content_suggestions.optimal_posting_times.instagram.weekends || 'Not specified'}</div>
                                </div>
                              ) : (
                                aiInsights?.content_suggestions?.optimal_posting_times?.instagram || instaBestTime?.hourFormatted
                              )}
                            </div>
                          </div>
                        )}
                        {(aiInsights?.content_suggestions?.optimal_posting_times?.youtube || ytBestTime) && (
                          <div className="flex flex-col mt-3">
                            <div className="flex justify-between items-center">
                              <span className="text-xs font-medium text-gray-600">YouTube:</span>
                            </div>
                            <div className="text-sm text-gray-900 mt-1">
                              {typeof aiInsights?.content_suggestions?.optimal_posting_times?.youtube === 'object' ? (
                                <div className="space-y-1">
                                  <div>Weekdays: {aiInsights.content_suggestions.optimal_posting_times.youtube.weekdays || 'Not specified'}</div>
                                  <div>Weekends: {aiInsights.content_suggestions.optimal_posting_times.youtube.weekends || 'Not specified'}</div>
                                </div>
                              ) : (
                                aiInsights?.content_suggestions?.optimal_posting_times?.youtube || ytBestTime?.hourFormatted
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Content Gap Analysis */}
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Target className="w-4 h-4 text-green-500" />
                        <span className="text-sm font-medium text-gray-600">Content Gaps</span>
                      </div>
                      <div className="space-y-1">
                        {aiInsights?.content_suggestions?.content_gaps?.length > 0 ? (
                          aiInsights.content_suggestions.content_gaps.map((gap: string, index: number) => (
                            <p key={index} className="text-sm text-gray-900">{gap}</p>
                          ))
                        ) : (
                          <p className="text-sm text-gray-900">
                            {(performanceMetrics.instagram.totalPosts || 0) < (performanceMetrics.youtube.totalVideos || 0) ? 
                              'Create more Instagram posts' : 
                              'Upload more YouTube videos'}
                          </p>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        Balance your content across platforms
                      </p>
                    </div>

                    {/* Engagement Optimization */}
                    <div className="bg-white rounded-lg p-4 border border-blue-100">
                      <div className="flex items-center gap-2 mb-3">
                        <Zap className="w-4 h-4 text-yellow-500" />
                        <span className="text-sm font-medium text-gray-600">Boost Engagement</span>
                      </div>
                      <div className="space-y-1">
                        {aiInsights?.content_suggestions?.engagement_tips?.length > 0 ? (
                          <div className="space-y-2">
                            {aiInsights.content_suggestions.engagement_tips.slice(0, 3).map((tip: string, index: number) => (
                              <div key={index} className="flex items-start gap-2">
                                <Zap className="w-3 h-3 text-yellow-500 mt-1 flex-shrink-0" />
                                <p className="text-xs text-gray-900">{tip}</p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-900">
                            {(combinedAnalytics?.comparison?.engagement?.instagram?.rate || 0) < 3 ? 
                              'Add more interactive elements' : 
                              'Maintain current strategy'}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* AI Performance Alerts */}
                {aiInsights?.alerts && aiInsights.alerts.length > 0 && (
                  <div className="bg-gradient-to-r from-amber-50 to-orange-50 rounded-xl shadow-sm border border-amber-200 p-6 mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <AlertTriangle className="w-5 h-5 text-amber-600" />
                      AI Performance Alerts
                    </h3>
                    <div className="space-y-3">
                      {aiInsights.alerts.map((alert: any, index: number) => {
                        const getAlertIcon = (severity: string) => {
                          switch (severity) {
                            case 'warning': return <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />;
                            case 'error': return <AlertTriangle className="w-4 h-4 text-red-500 mt-0.5" />;
                            case 'success': return <CheckCircle className="w-4 h-4 text-green-500 mt-0.5" />;
                            default: return <Clock className="w-4 h-4 text-blue-500 mt-0.5" />;
                          }
                        };
                        
                        const getAlertBorderColor = (severity: string) => {
                          switch (severity) {
                            case 'warning': return 'border-amber-100';
                            case 'error': return 'border-red-100';
                            case 'success': return 'border-green-100';
                            default: return 'border-blue-100';
                          }
                        };
                        
                        return (
                          <div key={index} className={`flex items-start gap-3 p-3 bg-white rounded-lg border ${getAlertBorderColor(alert.severity)}`}>
                            {getAlertIcon(alert.severity)}
                            <div>
                              <p className="text-sm font-medium text-gray-900">{alert.type}</p>
                              <p className="text-xs text-gray-600">{alert.message}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Demographic Analytics */}
                <div className="mt-12 mb-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
                    <Users2 className="h-6 w-6 mr-2 text-purple-600" />
                    Audience Demographics
                  </h2>
                  
                  
                  {/* Platform Tabs */}
                  <div className="flex mb-6 border-b border-gray-200">
                    <button
                      className={`px-4 py-2 font-medium text-sm ${activePlatform === 'instagram' ? 'text-purple-600 border-b-2 border-purple-600' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setActivePlatform('instagram')}
                    >
                      <div className="flex items-center">
                        <Instagram className="w-4 h-4 mr-2" />
                        Instagram
                      </div>
                    </button>
                    <button
                      className={`px-4 py-2 font-medium text-sm ${activePlatform === 'youtube' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-500 hover:text-gray-700'}`}
                      onClick={() => setActivePlatform('youtube')}
                    >
                      <div className="flex items-center">
                        <Play className="w-4 h-4 mr-2" />
                        YouTube
                      </div>
                    </button>
                  </div>

                  {/* Loading State */}
                  {demographicLoading && (
                    <div className="flex items-center justify-center py-12">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                      <span className="ml-2 text-gray-600">Loading demographics...</span>
                    </div>
                  )}
                  {/* Individual Platform Demographics */}
                  {!demographicLoading && demographicData[activePlatform] && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <Users2 className="h-5 w-5 mr-2 text-pink-500" />
                        Gender Distribution
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={demographicData[activePlatform]?.gender || []}
                              cx="50%"
                              cy="50%"
                              innerRadius={60}
                              outerRadius={80}
                              paddingAngle={5}
                              dataKey="value"
                              label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : 0}%`}
                            >
                              {(demographicData[activePlatform]?.gender || []).map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={[
                                    COLORS.chart.pink,
                                    COLORS.chart.blue,
                                    COLORS.chart.purple
                                  ][index % 3]} 
                                />
                              ))}
                            </Pie>
                            <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                            <Legend />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Age Distribution */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <CalendarIcon className="h-5 w-5 mr-2 text-amber-500" />
                        Age Distribution
                      </h3>
                      <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={demographicData[activePlatform]?.age || []}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                            <Bar dataKey="value" name="Age Group">
                              {(demographicData[activePlatform]?.age || []).map((entry, index) => (
                                <Cell 
                                  key={`cell-${index}`} 
                                  fill={[
                                    COLORS.chart.amber,    // Amber
                                    COLORS.chart.orange,   // Orange
                                    COLORS.chart.rose,     // Replaced yellow with rose
                                    COLORS.chart.lime,     // Lime
                                    COLORS.chart.teal,     // Replaced green with teal
                                    COLORS.chart.emerald   // Emerald
                                  ][index % 6]} 
                                />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    {/* Top Countries */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <GlobeIcon className="h-5 w-5 mr-2 text-cyan-500" />
                        Top Countries
                      </h3>
                      <div className="space-y-4">
                        {(demographicData[activePlatform]?.countries || []).map((country, index) => (
                          <div key={country.code} className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <div className="flex items-center">
                                <span className="font-medium text-gray-700 w-6">{index + 1}.</span>
                                <span className="mr-2">{country.name}</span>
                              </div>
                              <span className="font-medium text-gray-900">{country.value}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-cyan-500 h-2 rounded-full" 
                                style={{ 
                                  width: `${country.value}%`,
                                  backgroundColor: [
                                    COLORS.chart.blue,    // Blue
                                    COLORS.chart.indigo,   // Indigo
                                    COLORS.chart.violet,   // Violet
                                    COLORS.chart.purple,   // Purple
                                    COLORS.chart.pink      // Pink (replaced fuchsia)
                                  ][index % 5]
                                }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                  )}

                  {/* Empty State */}
                  {!demographicLoading && !demographicData[activePlatform] && (
                    <div className="text-center py-12">
                      <Users2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No Demographic Data Available</h3>
                      <p className="text-gray-600">
                        {activePlatform === 'instagram' 
                          ? 'Connect your Instagram business account to view audience demographics.'
                          : 'YouTube demographic data is not available through the API for most channels.'
                        }
                      </p>
                    </div>
                  )}

                  {/* Platform Comparison Charts */}
                  {!demographicLoading && (demographicData.instagram || demographicData.youtube) && (
                    <div className="mb-8">
                      <h3 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
                        <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
                        Platform Comparison
                      </h3>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Gender Comparison */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Gender Distribution Comparison</h4>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={getGenderComparisonData()}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="gender" />
                                <YAxis />
                                <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                                <Legend />
                                <Bar 
                                  dataKey="instagram" 
                                  fill={COLORS.chart.purple} 
                                  name="Instagram" 
                                  onClick={() => handlePlatformSelect('instagram')}
                                  cursor="pointer"
                                  opacity={getOpacity('instagram')}
                                />
                                <Bar 
                                  dataKey="youtube" 
                                  fill={COLORS.chart.rose} 
                                  name="YouTube"
                                  onClick={() => handlePlatformSelect('youtube')}
                                  cursor="pointer"
                                  opacity={getOpacity('youtube')}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>

                        {/* Age Comparison */}
                        <div className="bg-white p-6 rounded-xl shadow-sm border">
                          <h4 className="text-lg font-semibold text-gray-900 mb-4">Age Distribution Comparison</h4>
                          <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart data={getAgeComparisonData()}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis dataKey="age" />
                                <YAxis />
                                <Tooltip formatter={(value) => [`${value}%`, 'Percentage']} />
                                <Legend />
                                <Bar 
                                  dataKey="instagram" 
                                  fill={COLORS.chart.blue} 
                                  name="Instagram"
                                  onClick={() => handlePlatformSelect('instagram')}
                                  cursor="pointer"
                                  opacity={getOpacity('instagram')}
                                />
                                <Bar 
                                  dataKey="youtube" 
                                  fill={COLORS.chart.amber} 
                                  name="YouTube"
                                  onClick={() => handlePlatformSelect('youtube')}
                                  cursor="pointer"
                                  opacity={getOpacity('youtube')}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          </div>
                        </div>
                      </div>

                      {/* Top Countries Comparison */}
                      <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
                        <h4 className="text-lg font-semibold text-gray-900 mb-4">Top Countries Comparison</h4>
                        <div className="h-80">
                          {(demographicData.instagram?.countries && demographicData.instagram.countries.length > 0) || 
                           (demographicData.youtube?.countries && demographicData.youtube.countries.length > 0) ? (
                            <ResponsiveContainer width="100%" height="100%">
                              <BarChart
                                data={getCountryComparisonData()}
                                layout="vertical"
                                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                                barGap={2}
                                barCategoryGap="10%"
                              >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis 
                                  type="number" 
                                  tickFormatter={(value) => `${value}%`}
                                  domain={[0, 100]}
                                  tick={{ fill: '#6B7280' }}
                                  axisLine={{ stroke: '#E5E7EB' }}
                                  tickLine={{ stroke: '#E5E7EB' }}
                                />
                                <YAxis 
                                  dataKey="country" 
                                  type="category" 
                                  width={120}
                                  tick={{ fontSize: 12, fill: '#4B5563' }}
                                  axisLine={{ stroke: '#E5E7EB' }}
                                  tickLine={{ stroke: '#E5E7EB' }}
                                />
                                <Tooltip 
                                  formatter={(value: number) => [`${value}%`, 'Percentage']} 
                                  labelFormatter={(label) => `Country: ${label}`}
                                  contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #E5E7EB',
                                    borderRadius: '0.5rem',
                                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                                    padding: '0.5rem 1rem'
                                  }}
                                  itemStyle={{ color: '#1F2937' }}
                                  labelStyle={{ fontWeight: 600, color: '#111827' }}
                                />
                                <Legend />
                                <Bar 
                                  dataKey="instagram" 
                                  name="Instagram"
                                  radius={[0, 4, 4, 0]}
                                  stroke="#fff"
                                  strokeWidth={1}
                                  onClick={() => handlePlatformSelect('instagram')}
                                  cursor="pointer"
                                  className="bar"
                                  fill="#8A3AB9"
                                  opacity={getOpacity('instagram')}
                                />
                                <Bar 
                                  dataKey="youtube" 
                                  name="YouTube"
                                  radius={[0, 4, 4, 0]}
                                  stroke="#fff"
                                  strokeWidth={1}
                                  onClick={() => handlePlatformSelect('youtube')}
                                  cursor="pointer"
                                  className="bar"
                                  fill="#FF0000"
                                  opacity={getOpacity('youtube')}
                                />
                              </BarChart>
                            </ResponsiveContainer>
                          ) : (
                            <div className="h-full flex items-center justify-center text-gray-500">
                              <div className="text-center">
                                <GlobeIcon className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                                <p>No country data available</p>
                                <p className="text-sm text-gray-400">Connect your social accounts to see audience demographics</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  
                </div>

                {/* Content Performance Insights */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl shadow-sm border border-blue-200 p-6 mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-600" />
                    Content Performance Insights
                  </h3>
                  <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-600">Best Performing Platform</span>
                        <TrendingUp className="w-4 h-4 text-green-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {(combinedAnalytics?.comparison?.engagement?.instagram?.rate || 0) > 
                         (combinedAnalytics?.comparison?.engagement?.youtube?.rate || 0) 
                          ? 'Instagram' 
                          : 'YouTube'}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Based on engagement rate
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-600">Total Content</span>
                        <Video className="w-4 h-4 text-blue-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber((performanceMetrics.instagram.totalPosts || 0) + (performanceMetrics.youtube.totalVideos || 0))}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Posts & Videos combined
                      </p>
                    </div>

                    <div className="bg-white rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-medium text-gray-600">Avg Engagement Rate</span>
                        <Heart className="w-4 h-4 text-pink-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-900">
                        {(((combinedAnalytics?.comparison?.engagement?.instagram?.rate || 0) + 
                           (combinedAnalytics?.comparison?.engagement?.youtube?.rate || 0)) / 2).toFixed(2)}%
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Across all platforms
                      </p>
                    </div>
                  </div>
                </div>

                {/* Best Time to Post */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-indigo-600" />
                      Best Time to Post (Instagram)
                    </h3>
                    {instaBestTime ? (
                      <div className="space-y-2">
                        <p className="text-2xl font-bold text-gray-900">{instaBestTime.weekday}</p>
                        <p className="text-sm text-gray-600">Around {instaBestTime.hourFormatted} ({instaBestTime.timezone})</p>
                        <p className="text-sm text-gray-500">Average engagement: {formatNumber(instaBestTime.averageEngagement)} · Based on {instaBestTime.sampleSize} posts</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Not enough recent data to calculate optimal time.</p>
                    )}
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-red-500" />
                      Best Time to Publish (YouTube)
                    </h3>
                    {ytBestTime ? (
                      <div className="space-y-2">
                        <p className="text-2xl font-bold text-gray-900">{ytBestTime.weekday}</p>
                        <p className="text-sm text-gray-600">Around {ytBestTime.hourFormatted} ({ytBestTime.timezone})</p>
                        <p className="text-sm text-gray-500">Average engagement: {formatNumber(ytBestTime.averageEngagement)} · Based on {ytBestTime.sampleSize} videos</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Not enough recent data to calculate optimal time.</p>
                    )}
                  </div>
                </div>

                {/* Comment Insights */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-indigo-600" />
                      Instagram Comments
                    </h3>
                    {instaCommentStats ? (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">Total comments: <span className="font-semibold text-gray-900">65</span></p>
                        <p className="text-sm text-gray-600">Average per post: <span className="font-semibold text-gray-900">13</span></p>
                        {instaCommentStats.topCommented && (
                          <div className="p-3 bg-indigo-50 rounded-lg">
                            <p className="text-xs text-indigo-700 uppercase">Most commented</p>
                            <p className="text-sm font-semibold text-gray-900 truncate">{instaCommentStats.topCommented.title}</p>
                            <p className="text-xs text-gray-600">{formatNumber(instaCommentStats.topCommented.comments)} comments</p>
                            {instaCommentStats.topCommented.url && (
                              <a href={instaCommentStats.topCommented.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 mt-1">
                                View post <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No comment data available.</p>
                    )}
                    {instagramTopCommented.length > 0 && (
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Top commented posts</p>
                        <div className="space-y-3">
                          {instagramTopCommented.map((item: any, idx: number) => (
                            <div key={`${item.id}-top-${idx}`} className="text-sm">
                              <p className="font-medium text-gray-900 truncate">{item.caption || 'Untitled post'}</p>
                              <p className="text-xs text-gray-500">{formatNumber(item.comments || 0)} comments · {new Date(item.timestamp || '').toLocaleString()}</p>
                            </div>
                          ))}
                        </div>
                        {instagramNewestCommented.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Newest replies</p>
                            <div className="space-y-3">
                              {instagramNewestCommented.map((item: any, idx: number) => (
                                <div key={`${item.id}-new-${idx}`} className="text-sm">
                                  <p className="font-medium text-gray-900 truncate">{item.caption || 'Untitled post'}</p>
                                  <p className="text-xs text-gray-500">{formatNumber(item.comments || 0)} comments · {new Date(item.timestamp || '').toLocaleString()}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <MessageCircle className="w-5 h-5 text-red-500" />
                      YouTube Comments
                    </h3>
                    {ytCommentStats ? (
                      <div className="space-y-3">
                        <p className="text-sm text-gray-600">Total comments: <span className="font-semibold text-gray-900">{formatNumber(ytCommentStats.total)}</span></p>
                        <p className="text-sm text-gray-600">Average per video: <span className="font-semibold text-gray-900">{ytCommentStats.average}</span></p>
                        {ytCommentStats.topCommented && (
                          <div className="p-3 bg-red-50 rounded-lg">
                            <p className="text-xs text-red-700 uppercase">Most commented</p>
                            <p className="text-sm font-semibold text-gray-900 truncate">{ytCommentStats.topCommented.title}</p>
                            <p className="text-xs text-gray-600">{formatNumber(ytCommentStats.topCommented.comments)} comments</p>
                            {ytCommentStats.topCommented.url && (
                              <a href={ytCommentStats.topCommented.url} target="_blank" rel="noopener noreferrer" className="text-xs text-red-600 hover:text-red-800 inline-flex items-center gap-1 mt-1">
                                Watch video <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">No comment data available.</p>
                    )}
                    {youtubeTopCommented.length > 0 && (
                      <div className="mt-4 border-t border-gray-200 pt-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Top commented videos</p>
                        <div className="space-y-3">
                          {youtubeTopCommented.map((item: any, idx: number) => (
                            <div key={`${item.id}-yt-top-${idx}`} className="text-sm">
                              <p className="font-medium text-gray-900 truncate">{item.title || 'Untitled video'}</p>
                              <p className="text-xs text-gray-500">{formatNumber(item.comments || 0)} comments · {item.publishedAt ? new Date(item.publishedAt).toLocaleString() : 'Unknown date'}</p>
                            </div>
                          ))}
                        </div>
                        {youtubeNewestCommented.length > 0 && (
                          <div className="mt-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-3">Newest comment activity</p>
                            <div className="space-y-3">
                              {youtubeNewestCommented.map((item: any, idx: number) => (
                                <div key={`${item.id}-yt-new-${idx}`} className="text-sm">
                                  <p className="font-medium text-gray-900 truncate">{item.title || 'Untitled video'}</p>
                                  <p className="text-xs text-gray-500">{formatNumber(item.comments || 0)} comments · {item.publishedAt ? new Date(item.publishedAt).toLocaleString() : 'Unknown date'}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Top Content Tables */}
                <div className="grid md:grid-cols-2 gap-6 mb-8">
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Instagram Posts</h3>
                    {instagramTopContent.length > 0 ? (
                      <div className="space-y-4">
                        {instagramTopContent.map((item: any, index: number) => (
                          <div key={item.id || index} className="flex gap-3">
                            {item.thumbnailUrl && (
                              <img src={item.thumbnailUrl} alt={item.caption || 'Post'} className="w-16 h-16 rounded-lg object-cover" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{item.caption || 'Untitled'}</p>
                              <p className="text-xs text-gray-500">{new Date(item.timestamp).toLocaleString()}</p>
                              <div className="flex gap-4 text-xs text-gray-600 mt-1">
                                <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{formatNumber(item.likes || 0)}</span>
                                <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{formatNumber(item.comments || 0)}</span>
                              </div>
                              {item.permalink && (
                                <a href={item.permalink} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:text-indigo-800 inline-flex items-center gap-1 mt-1">
                                  View post <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Not enough Instagram content yet.</p>
                    )}
                  </div>

                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Top YouTube Videos</h3>
                    {youtubeTopContent.length > 0 ? (
                      <div className="space-y-4">
                        {youtubeTopContent.map((item: any, index: number) => (
                          <div key={item.id || index} className="flex gap-3">
                            {item.thumbnailUrl && (
                              <img src={item.thumbnailUrl} alt={item.title || 'Video'} className="w-16 h-16 rounded-lg object-cover" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">{item.title || 'Untitled video'}</p>
                              <p className="text-xs text-gray-500">{item.publishedAt ? new Date(item.publishedAt).toLocaleString() : 'Unknown date'}</p>
                              <div className="flex gap-4 text-xs text-gray-600 mt-1">
                                <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{formatNumber(item.views || 0)}</span>
                                <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{formatNumber(item.likes || 0)}</span>
                                <span className="flex items-center gap-1"><MessageCircle className="w-3 h-3" />{formatNumber(item.comments || 0)}</span>
                              </div>
                              {item.url && (
                                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-xs text-red-600 hover:text-red-800 inline-flex items-center gap-1 mt-1">
                                  Watch video <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">Not enough YouTube videos yet.</p>
                    )}
                  </div>
                </div>

                {/* Trending Content */}
                {trendingContent.length > 0 && (
                  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        Trending Content ({selectedPeriod === 'week' ? 'Last 7 Days' : selectedPeriod === 'month' ? 'Last 28 Days' : 'Lifetime'})
                      </h3>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {trendingContent.map((content, index) => (
                        <div key={content.id} className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-all">
                          <div className="flex-shrink-0 w-9 h-9 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center text-white text-sm font-bold">
                            {index + 1}
                          </div>
                          {content.thumbnail && (
                            <img
                              src={content.thumbnail}
                              alt={content.title || content.caption || 'Content'}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {content.platform === 'instagram' ? (
                                <Instagram className="w-4 h-4 text-pink-500" />
                              ) : (
                                <Play className="w-4 h-4 text-red-500" />
                              )}
                              <span className="text-xs font-medium text-gray-500 uppercase">
                                {content.platform}
                              </span>
                              {content.publishedAt && (
                                <span className="text-xs text-gray-400">
                                  • {new Date(content.publishedAt).toLocaleDateString()}
                                </span>
                              )}
                            </div>
                            <p className="text-sm font-semibold text-gray-900 truncate">
                              {content.title || content.caption || 'Untitled'}
                            </p>
                            <div className="flex items-center gap-4 mt-2 text-xs text-gray-600">
                              <span className="flex items-center gap-1">
                                <Eye className="w-3 h-3" />
                                {formatNumber(content.views || 0)}
                              </span>
                              <span className="flex items-center gap-1">
                                <Heart className="w-3 h-3" />
                                {formatNumber(content.likes || 0)}
                              </span>
                              <span className="flex items-center gap-1">
                                <MessageCircle className="w-3 h-3" />
                                {formatNumber(content.comments || 0)}
                              </span>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <div className="text-sm font-bold text-blue-600">
                              {(content.engagement_rate || 0).toFixed(2)}%
                            </div>
                            <div className="text-xs text-gray-500">engagement</div>
                          </div>
                          {content.url && (
                            <a
                              href={content.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI-Powered Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-purple-600" />
                    AI-Powered Actions
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <Link
                      href="/ai-studio"
                      className="bg-gradient-to-r from-purple-50 to-pink-50 hover:from-purple-100 hover:to-pink-100 text-purple-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-center flex items-center justify-center gap-2 border border-purple-200"
                    >
                      <Wand2 className="w-4 h-4" />
                      AI Studio
                    </Link>
                    <button
                      onClick={handleRefreshAIInsights}
                      disabled={aiLoading}
                      className="bg-gradient-to-r from-blue-50 to-cyan-50 hover:from-blue-100 hover:to-cyan-100 text-blue-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-center flex items-center justify-center gap-2 border border-blue-200"
                    >
                      <Brain className={`w-4 h-4 ${aiLoading ? 'animate-pulse' : ''}`} />
                      {aiLoading ? 'Refreshing...' : 'Refresh AI'}
                    </button>
                    <Link
                      href="/dashboard/content/create"
                      className="bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 text-green-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-center flex items-center justify-center gap-2 border border-green-200"
                    >
                      <PenTool className="w-4 h-4" />
                      Create Content
                    </Link>
                    <Link
                      href="/dashboard/analytics/combined"
                      className="bg-gradient-to-r from-amber-50 to-orange-50 hover:from-amber-100 hover:to-orange-100 text-amber-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-center flex items-center justify-center gap-2 border border-amber-200"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Analytics
                    </Link>
                  </div>
                  
                  <h3 className="text-md font-medium text-gray-900 mb-3">Traditional Actions</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <Link
                      href="/dashboard/calendar"
                      className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-center flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Calendar
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-center flex items-center justify-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                    <Link
                      href="/dashboard/accounts"
                      className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-center flex items-center justify-center gap-2"
                    >
                      <Users className="w-4 h-4" />
                      Accounts
                    </Link>
                    <button
                      onClick={handleRefresh}
                      disabled={refreshing}
                      className="bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-center flex items-center justify-center gap-2"
                    >
                      <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                      Refresh
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Data freshness indicator */}
            {combinedAnalytics?.generatedAt && (
              <div className="mt-4 text-center space-y-1">
                <p className="text-xs text-gray-500">
                  Data last updated {getRelativeTime(combinedAnalytics.generatedAt)}
                  {combinedAnalytics.fromCache && ' (cached)'}
                </p>
                <p className="text-xs text-gray-400">
                  📊 All numbers shown are exact figures for complete transparency
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  </div>
  );
}
