'use client';

import { useState, useEffect } from 'react';
import { Instagram, Users, Heart, MessageCircle, Eye, TrendingUp, Image, Video, Play, Upload, Settings } from 'lucide-react';
import ProtectedRoute from '@/components/protected-route';

interface InstagramAnalytics {
  account: {
    username: string;
    followers_count: number;
    following_count: number;
    media_count: number;
    profile_picture_url: string;
    account_type: string;
  };
  insights: {
    impressions: number;
    reach: number;
    profile_views: number;
    website_clicks: number;
    engagement_rate: number;
  };
  recent_media: Array<{
    id: string;
    media_type: string;
    media_url: string;
    thumbnail_url?: string;
    caption: string;
    like_count: number;
    comments_count: number;
    timestamp: string;
  }>;
}

export default function InstagramPage() {
  const [analytics, setAnalytics] = useState<InstagramAnalytics | null>(null);
  const [media, setMedia] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [connected, setConnected] = useState(false);
  const [accountInfo, setAccountInfo] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'media' | 'post'>('overview');
  const [selectedPeriod, setSelectedPeriod] = useState<'day' | 'week' | 'month' | '3months' | '6months' | 'year' | 'days_28'>('year');

  useEffect(() => {
    checkConnection();
    
    // Check for error/success parameters in URL
    const urlParams = new URLSearchParams(window.location.search);
    const error = urlParams.get('error');
    const success = urlParams.get('success');
    
    if (error) {
      console.error('Instagram OAuth error:', error);
      // You can show a toast notification here if you have one
    }
    
    if (success) {
      console.log('Instagram OAuth success:', success);
      // You can show a success toast notification here if you have one
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
      if (activeTab === 'media') {
        fetchMedia();
      }
    }
  }, [connected, selectedPeriod, activeTab]);

  const checkConnection = async () => {
    try {
      // Add cache-busting parameter to ensure fresh data
      const response = await fetch(`/api/instagram/status?t=${Date.now()}`);
      const data = await response.json();
      setConnected(data.connected);
      setAccountInfo(data.account);
    } catch (error) {
      console.error('Error checking Instagram connection:', error);
      setConnected(false);
      setAccountInfo(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`/api/instagram/analytics?period=${selectedPeriod}`);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
      } else {
        console.log('Analytics API failed, but connection status unchanged');
        // Don't set connected to false - analytics failure doesn't mean disconnected
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      // Don't set connected to false - analytics failure doesn't mean disconnected
    }
  };

  const fetchMedia = async () => {
    try {
      const response = await fetch('/api/instagram/media?limit=50');
      if (response.ok) {
        const data = await response.json();
        setMedia(data.data);
      }
    } catch (error) {
      console.error('Error fetching media:', error);
    }
  };

  const connectInstagram = async () => {
    // Use direct OAuth flow instead of NextAuth to avoid session conflicts
    const clientId = '1391259419088183';
    const redirectUri = encodeURIComponent(`${window.location.origin}/api/instagram/callback`);
    const scope = encodeURIComponent('instagram_basic,instagram_manage_messages,instagram_content_publish,instagram_manage_insights,instagram_manage_comments,pages_show_list,pages_read_engagement,business_management');
    
    const authUrl = `https://www.facebook.com/v21.0/dialog/oauth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&state=${Date.now()}`;
    
    // Open OAuth in same window
    window.location.href = authUrl;
  };

  const disconnectInstagram = async () => {
    if (!confirm('Are you sure you want to disconnect your Instagram account? This will remove all stored data.')) {
      return;
    }

    try {
      const response = await fetch('/api/instagram/status', { method: 'DELETE' });
      const data = await response.json();
      
      if (data.success) {
        setConnected(false);
        setAccountInfo(null);
        setAnalytics(null);
        setMedia([]);
        console.log('Instagram account disconnected successfully');
      } else {
        console.error('Failed to disconnect Instagram account:', data.error);
      }
    } catch (error) {
      console.error('Error disconnecting Instagram account:', error);
    }
  };

  const refreshInstagramData = async () => {
    try {
      const response = await fetch('/api/instagram/refresh', { method: 'POST' });
      const data = await response.json();
      
      if (data.success) {
        // Refresh the analytics and media data
        await fetchAnalytics();
        if (activeTab === 'media') {
          await fetchMedia();
        }
        console.log('Instagram data refreshed successfully');
      } else {
        console.error('Failed to refresh Instagram data:', data.error);
        if (response.status === 401) {
          // Token expired, need to reconnect
          setConnected(false);
        }
      }
    } catch (error) {
      console.error('Error refreshing Instagram data:', error);
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

  const getMediaIcon = (mediaType: string) => {
    switch (mediaType) {
      case 'VIDEO':
      case 'REELS':
        return <Video className="h-4 w-4" />;
      case 'CAROUSEL_ALBUM':
        return <Image className="h-4 w-4" />;
      default:
        return <Image className="h-4 w-4" />;
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading Instagram data...</p>
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
            <Instagram className="h-16 w-16 text-pink-500 mx-auto mb-6" />
            
            {accountInfo ? (
              // Previously connected account - show reconnect option
              <>
                <div className="flex items-center justify-center mb-4">
                  {accountInfo.profilePictureUrl && (
                    <img 
                      src={accountInfo.profilePictureUrl} 
                      alt="Profile" 
                      className="w-12 h-12 rounded-full mr-3"
                    />
                  )}
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">@{accountInfo.username}</h2>
                    <p className="text-sm text-gray-500">{accountInfo.accountType}</p>
                  </div>
                </div>
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                  <p className="text-yellow-800 text-sm">
                    {accountInfo.tokenExpired 
                      ? 'Your Instagram connection has expired. Please reconnect to continue.'
                      : 'Your Instagram account is disconnected. Reconnect to access your data.'
                    }
                  </p>
                </div>
                <div className="space-y-3">
                  <button
                    onClick={connectInstagram}
                    className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors flex items-center justify-center"
                  >
                    <Instagram className="h-5 w-5 mr-2" />
                    Reconnect Instagram
                  </button>
                  <button
                    onClick={disconnectInstagram}
                    className="w-full bg-gray-100 text-gray-700 py-2 px-6 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Disconnect Account
                  </button>
                </div>
              </>
            ) : (
              // No previous connection - show connect option
              <>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Instagram</h2>
                <p className="text-gray-600 mb-6">
                  Connect your Instagram Business account to manage posts, view analytics, and engage with your audience.
                </p>
                <button
                  onClick={connectInstagram}
                  className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors flex items-center justify-center"
                >
                  <Instagram className="h-5 w-5 mr-2" />
                  Connect Instagram Account
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
                <Instagram className="h-8 w-8 text-pink-500" />
                <div className="ml-3">
                  <h1 className="text-2xl font-bold text-gray-900">Instagram</h1>
                  {analytics && (
                    <p className="text-sm text-gray-600">@{analytics.account.username}</p>
                  )}
                </div>
              </div>
              
              {/* Actions */}
              <div className="flex items-center space-x-4">
                <button
                  onClick={refreshInstagramData}
                  className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
                >
                  Refresh Data
                </button>
                
                <button
                  onClick={connectInstagram}
                  className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
                >
                  Reconnect
                </button>
                
                <a
                  href="/dashboard/instagram/test"
                  className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors text-sm font-medium"
                >
                  API Test
                </a>
                
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="day">Last Day</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last 30 Days</option>
                  <option value="3months">Last 3 Months</option>
                  <option value="6months">Last 6 Months</option>
                  <option value="year">Last Year</option>
                  <option value="days_28">Last 28 Days</option>
                </select>
                
                <button 
                  onClick={disconnectInstagram}
                  className="p-2 text-red-400 hover:text-red-600"
                  title="Disconnect Instagram Account"
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
                  { id: 'media', name: 'Media', icon: Image },
                  { id: 'post', name: 'Create Post', icon: Upload },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-pink-500 text-pink-600'
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
              {/* Account Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <Users className="h-8 w-8 text-blue-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Followers</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(analytics?.account?.followers_count)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <Eye className="h-8 w-8 text-green-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Reach</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(analytics?.insights?.reach)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-purple-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Impressions</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {formatNumber(analytics?.insights?.impressions)}
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <div className="flex items-center">
                    <Heart className="h-8 w-8 text-red-500" />
                    <div className="ml-4">
                      <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
                      <p className="text-2xl font-bold text-gray-900">
                        {analytics.insights.engagement_rate}%
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Posts */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Recent Posts</h3>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {analytics.recent_media.map((post) => (
                      <div key={post.id} className="border rounded-lg overflow-hidden">
                        <div className="aspect-square relative">
                          <img
                            src={post.thumbnail_url || post.media_url}
                            alt="Post"
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-2 right-2">
                            {getMediaIcon(post.media_type)}
                          </div>
                        </div>
                        <div className="p-4">
                          <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                            {post.caption}
                          </p>
                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <div className="flex items-center space-x-4">
                              <span className="flex items-center">
                                <Heart className="h-4 w-4 mr-1" />
                                {formatNumber(post?.like_count)}
                              </span>
                              <span className="flex items-center">
                                <MessageCircle className="h-4 w-4 mr-1" />
                                {formatNumber(post?.comments_count)}
                              </span>
                            </div>
                            <span>{new Date(post.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'media' && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">All Media</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {media.map((item) => (
                    <div key={item.id} className="aspect-square relative group cursor-pointer">
                      <img
                        src={item.thumbnail_url || item.media_url}
                        alt="Media"
                        className="w-full h-full object-cover rounded-lg"
                      />
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-opacity rounded-lg flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center">
                          <div className="flex items-center justify-center space-x-4 mb-2">
                            <span className="flex items-center">
                              <Heart className="h-4 w-4 mr-1" />
                              {formatNumber(item?.like_count)}
                            </span>
                            <span className="flex items-center">
                              <MessageCircle className="h-4 w-4 mr-1" />
                              {formatNumber(item?.comments_count)}
                            </span>
                          </div>
                          {getMediaIcon(item.media_type)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'post' && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Create New Post</h3>
              </div>
              <div className="p-6">
                <div className="text-center py-12">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Post Creation</h4>
                  <p className="text-gray-600 mb-6">
                    Upload and schedule your Instagram posts, reels, and stories.
                  </p>
                  <button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors">
                    Coming Soon
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
