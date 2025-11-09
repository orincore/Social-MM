'use client';

import { useState, useEffect } from 'react';
import { Play, Users, Eye, Clock, TrendingUp, Video, Upload, Settings } from 'lucide-react';
import ProtectedRoute from '@/components/protected-route';

interface YouTubeAnalytics {
  channel: {
    channelTitle: string;
    subscriberCount: number;
    videoCount: number;
    viewCount: number;
    thumbnailUrl: string;
    channelHandle: string;
  };
  analytics: {
    views: number;
    estimatedMinutesWatched: number;
    averageViewDuration: number;
    subscribersGained: number;
    subscribersLost: number;
    likes: number;
    comments: number;
    shares: number;
    impressions: number;
    impressionClickThroughRate: number;
    engagementRate: number;
  };
  recentVideos: Array<{
    id: string;
    title: string;
    description: string;
    publishedAt: string;
    thumbnailUrl: string;
    statistics: any;
    duration: string;
    privacyStatus: string;
  }>;
  topVideos: Array<{
    id: string;
    title: string;
    thumbnailUrl: string;
    views: number;
    estimatedMinutesWatched: number;
    likes: number;
    comments: number;
    publishedAt: string;
    url: string;
  }>;
}

export default function YouTubePage() {
  const [analytics, setAnalytics] = useState<YouTubeAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'videos' | 'upload'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | '3months' | '6months' | 'year'>('month');

  useEffect(() => {
    checkConnection();
    
    // Check for error/success parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const success = urlParams.get('success');
    
    if (error) {
      console.error('YouTube OAuth error:', error);
    }
    
    if (success) {
      console.log('YouTube OAuth success:', success);
    }
    
    // Clean up URL parameters
    if (error || success) {
      const newUrl = window.location.pathname;
      window.history.replaceState({}, '', newUrl);
    }
  }, []);

  // Check connection when page becomes visible (after OAuth redirect)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        checkConnection();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (connected) {
      fetchAnalytics();
    }
  }, [connected, selectedPeriod]);

  const checkConnection = async () => {
    try {
      const response = await fetch(`/api/youtube/status?t=${Date.now()}`);
      const data = await response.json();
      setConnected(data.connected);
      setAccountInfo(data.account);
    } catch (error) {
      console.error('Error checking YouTube connection:', error);
      setConnected(false);
      setAccountInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/youtube/analytics?period=${selectedPeriod}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      } else {
        console.log('Analytics API failed, but connection status unchanged');
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const connectYouTube = async () => {
    try {
      const response = await fetch('/api/youtube/connect');
      const data = await response.json();
      
      if (data.success) {
        window.location.href = data.authUrl;
      } else {
        console.error('Failed to get YouTube auth URL:', data.error);
      }
    } catch (error) {
      console.error('Error connecting YouTube:', error);
    }
  };

  const disconnectYouTube = async () => {
    if (!confirm('Are you sure you want to disconnect your YouTube channel? This will remove all stored data.')) {
      return;
    }

    try {
      const response = await fetch('/api/youtube/status', { method: 'DELETE' });
      const data = await response.json();
      
      if (data.success) {
        setConnected(false);
        setAccountInfo(null);
        setAnalytics(null);
        console.log('YouTube channel disconnected successfully');
      } else {
        console.error('Failed to disconnect YouTube channel:', data.error);
      }
    } catch (error) {
      console.error('Error disconnecting YouTube channel:', error);
    }
  };

  const formatNumber = (num: number | undefined | null) => {
    if (!num && num !== 0) return '0';
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const formatDuration = (duration: string) => {
    // Convert ISO 8601 duration (PT4M13S) to readable format
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;
    
    const hours = parseInt(match[1] || '0');
    const minutes = parseInt(match[2] || '0');
    const seconds = parseInt(match[3] || '0');
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading YouTube data...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!connected) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
            <Play className="h-16 w-16 text-red-500 mx-auto mb-6" />
            
            {accountInfo ? (
              // Previously connected channel - show reconnect option
              <>
                <div className="flex items-center justify-center mb-4">
                  {accountInfo.thumbnailUrl && (
                    <img 
                      src={accountInfo.thumbnailUrl} 
                      alt="Channel" 
                      className="w-12 h-12 rounded-full mr-3"
                    />
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{accountInfo.channelTitle}</h2>
                    <p className="text-sm text-gray-500">{accountInfo.channelHandle}</p>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-yellow-800 text-sm">
                    {accountInfo.tokenExpired 
                      ? 'Your YouTube connection has expired. Please reconnect to continue.'
                      : 'Your YouTube channel is disconnected. Reconnect to access your data.'
                    }
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={connectYouTube}
                    className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                  >
                    <Play className="h-5 w-5 mr-2" />
                    Reconnect YouTube
                  </button>
                  <button
                    onClick={disconnectYouTube}
                    className="w-full bg-gray-100 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Disconnect Channel
                  </button>
                </div>
              </>
            ) : (
              // No previous connection - show connect option
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect YouTube</h2>
                <p className="text-gray-600 mb-6">
                  Connect your YouTube channel to upload videos, view analytics, and manage your content.
                </p>
                <button
                  onClick={connectYouTube}
                  className="w-full bg-red-600 text-white py-3 px-6 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center"
                >
                  <Play className="h-5 w-5 mr-2" />
                  Connect YouTube Channel
                </button>
              </>
            )}
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-6">
              <div className="flex items-center">
                <Play className="h-8 w-8 text-red-500" />
                <div className="ml-3">
                  <h1 className="text-2xl font-bold text-gray-900">YouTube</h1>
                  {analytics && (
                    <p className="text-sm text-gray-600">{analytics.channel.channelTitle}</p>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={connectYouTube}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                >
                  Reconnect
                </button>
                
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500"
                >
                  <option value="day">Last Day</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="3months">Last 3 Months</option>
                  <option value="6months">Last 6 Months</option>
                  <option value="year">Last Year</option>
                </select>
                
                <button 
                  onClick={disconnectYouTube}
                  className="p-2 text-red-400 hover:text-red-600"
                  title="Disconnect YouTube Channel"
                >
                  <Settings className="h-5 w-5" />
                </button>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="border-b">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'overview', name: 'Overview', icon: TrendingUp },
                  { id: 'videos', name: 'Videos', icon: Video },
                  { id: 'upload', name: 'Upload Video', icon: Upload },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-red-500 text-red-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="h-4 w-4 mr-2" />
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {activeTab === 'overview' && analytics && (
            <div className="space-y-8">
              {/* Channel Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-red-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Subscribers</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(analytics.channel.subscriberCount)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <Eye className="h-8 w-8 text-blue-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Views</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(analytics.analytics.views)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-green-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Watch Time</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(analytics.analytics.estimatedMinutesWatched)} min
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <Video className="h-8 w-8 text-purple-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Videos</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(analytics.channel.videoCount)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Videos */}
              {analytics.topVideos && analytics.topVideos.length > 0 && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Videos</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {analytics.topVideos.slice(0, 6).map((video) => (
                      <div key={video.id} className="border rounded-lg p-4">
                        <img 
                          src={video.thumbnailUrl} 
                          alt={video.title}
                          className="w-full h-32 object-cover rounded mb-3"
                        />
                        <h4 className="font-medium text-sm text-gray-900 mb-2 line-clamp-2">
                          {video.title}
                        </h4>
                        <div className="text-xs text-gray-600 space-y-1">
                          <div className="flex justify-between">
                            <span>Views:</span>
                            <span>{formatNumber(video.views)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Likes:</span>
                            <span>{formatNumber(video.likes)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span>Comments:</span>
                            <span>{formatNumber(video.comments)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'videos' && analytics && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Videos</h3>
              <div className="space-y-4">
                {analytics.recentVideos.map((video) => (
                  <div key={video.id} className="flex items-center space-x-4 p-4 border rounded-lg">
                    <img 
                      src={video.thumbnailUrl} 
                      alt={video.title}
                      className="w-24 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{video.title}</h4>
                      <p className="text-sm text-gray-600 mt-1">
                        Published: {new Date(video.publishedAt).toLocaleDateString()}
                      </p>
                      <p className="text-sm text-gray-600">
                        Duration: {formatDuration(video.duration)} • Status: {video.privacyStatus}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">
                        {formatNumber(parseInt(video.statistics.viewCount || '0'))} views
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatNumber(parseInt(video.statistics.likeCount || '0'))} likes
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upload Video</h3>
              <p className="text-gray-600 mb-4">
                Video upload functionality will be integrated with the main composer. 
                Use the main dashboard to create and schedule YouTube content.
              </p>
              <a 
                href="/dashboard"
                className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              >
                <Upload className="h-4 w-4 mr-2" />
                Go to Composer
              </a>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
