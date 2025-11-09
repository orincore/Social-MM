'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Calendar, BarChart3, Settings, Plus, Users, TrendingUp, User, LogOut, Instagram, Play, RefreshCw, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import { DashboardSkeleton, AnalyticsCardSkeleton } from '@/components/ui/skeleton';
import { formatNumber, getRelativeTime } from '@/lib/utils';

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
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [combinedAnalytics, setCombinedAnalytics] = useState<CombinedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [platformLoading, setPlatformLoading] = useState({
    instagram: false,
    youtube: false
  });
  const [platformStatus, setPlatformStatus] = useState<{
    instagram: PlatformStatus;
    youtube: PlatformStatus;
  }>({
    instagram: { connected: false },
    youtube: { connected: false }
  });
  const [lastPlatformStatus, setLastPlatformStatus] = useState<string>('');

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
        ? '/api/analytics/combined?period=month&refresh=true'
        : '/api/analytics/combined?period=month';
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        console.log('Dashboard: Combined analytics received:', data.data);
        console.log('Dashboard: Instagram data structure:', data.data?.platforms?.instagram);
        console.log('Dashboard: Comparison data:', data.data?.comparison);
        console.log('Dashboard: Instagram followers from analytics:', data.data?.platforms?.instagram?.data?.account?.followers);
        console.log('Dashboard: Total audience:', data.data?.comparison?.audience?.total);
        setCombinedAnalytics(data.data);
      } else {
        console.error('Dashboard: Failed to fetch combined analytics:', response.status);
      }
    } catch (error) {
      console.error('Error fetching combined analytics:', error);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([
        fetchPlatformStatus(),
        fetchCombinedAnalytics()
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
  }, [session]);

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
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome back! Here's your social media overview.
              {combinedAnalytics?.fromCache && (
                <span className="ml-2 text-sm text-blue-600">
                  {combinedAnalytics.isStale ? '(Updating...)' : '(Cached)'}
                </span>
              )}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {hasConnectedPlatforms && (
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            )}
            <Link 
              href="/dashboard/accounts" 
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
            >
              Manage Accounts
            </Link>
            <Link 
              href="/dashboard/content/create" 
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Post
            </Link>
          </div>
        </div>

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
          <>
            {/* Platform Status Cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
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
              <>
                {/* Key Metrics */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
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

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                      href="/dashboard/analytics/combined"
                      className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-center flex items-center justify-center gap-2"
                    >
                      <BarChart3 className="w-4 h-4" />
                      View Combined Analytics
                    </Link>
                    <Link
                      href="/dashboard/calendar"
                      className="bg-green-50 hover:bg-green-100 text-green-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-center flex items-center justify-center gap-2"
                    >
                      <Calendar className="w-4 h-4" />
                      Content Calendar
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-center flex items-center justify-center gap-2"
                    >
                      <Settings className="w-4 h-4" />
                      Settings
                    </Link>
                  </div>
                </div>
              </>
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
          </>
        )}
      </div>
    </div>
  );
}
