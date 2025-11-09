'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Calendar, BarChart3, Settings, Zap, Plus, Users, TrendingUp, User, LogOut, Instagram, Sparkles, Building2, Eye, Heart, MessageCircle, Share2, Activity, ArrowUp, ArrowDown, Play } from 'lucide-react';
import { usePhoneCheck } from '@/lib/usePhoneCheck';
import { useState, useEffect } from 'react';

export default function DashboardPage() {
  const { data: session } = useSession();
  const { isChecking } = usePhoneCheck();
  const [analytics, setAnalytics] = useState<any>(null);
  const [youtubeAnalytics, setYoutubeAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [instagramConnected, setInstagramConnected] = useState(false);
  const [youtubeConnected, setYoutubeConnected] = useState(false);

  // Fetch combined analytics data
  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        // Check Instagram connection
        const igStatusResponse = await fetch('/api/instagram/status');
        const igStatus = await igStatusResponse.json();
        setInstagramConnected(igStatus.connected);

        // Check YouTube connection
        const ytStatusResponse = await fetch('/api/youtube/status');
        const ytStatus = await ytStatusResponse.json();
        setYoutubeConnected(ytStatus.connected);

        // Fetch Instagram analytics if connected
        if (igStatus.connected) {
          const igResponse = await fetch('/api/instagram/analytics?period=days_28');
          if (igResponse.ok) {
            const igData = await igResponse.json();
            setAnalytics(igData.data);
          }
        }

        // Fetch YouTube analytics if connected
        if (ytStatus.connected) {
          const ytResponse = await fetch('/api/youtube/analytics?period=month');
          if (ytResponse.ok) {
            const ytData = await ytResponse.json();
            setYoutubeAnalytics(ytData.data);
          }
        }
      } catch (error) {
        console.error('Error fetching analytics:', error);
      } finally {
        setLoading(false);
      }
    };

    if (session) {
      fetchAnalytics();
    }
  }, [session]);

  const formatNumber = (num: number | undefined | null) => {
    if (!num && num !== 0) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-indigo-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">Social MM</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/dashboard/profile" className="flex items-center space-x-3 hover:bg-gray-50 rounded-lg px-3 py-2 transition-colors">
                <img 
                  src={session?.user?.image || ''} 
                  alt={session?.user?.name || ''} 
                  className="w-8 h-8 rounded-full"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center hidden">
                  <User className="h-4 w-4 text-indigo-600" />
                </div>
                <span className="text-sm font-medium text-gray-700">{session?.user?.name}</span>
              </Link>
              
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="flex items-center space-x-2 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {session?.user?.name?.split(' ')[0]}! 👋
          </h2>
          <p className="text-gray-600">
            Manage your social media presence from one powerful dashboard.
          </p>
        </div>

        {/* Real-time Analytics Dashboard */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-pink-500 to-rose-500 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pink-100 text-sm font-medium">Instagram Followers</p>
                <div className="text-3xl font-bold">
                  {loading ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-pink-300 rounded w-20"></div>
                    </div>
                  ) : instagramConnected ? formatNumber(analytics?.account?.followers_count) : '—'}
                </div>
                <div className="flex items-center mt-2">
                  {instagramConnected ? (
                    <>
                      <ArrowUp className="h-4 w-4 mr-1" />
                      <span className="text-sm">+2.4% this month</span>
                    </>
                  ) : (
                    <Link href="/dashboard/instagram" className="text-sm underline">
                      Connect Instagram
                    </Link>
                  )}
                </div>
              </div>
              <Instagram className="h-12 w-12 text-pink-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-red-500 to-red-600 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">YouTube Subscribers</p>
                <div className="text-3xl font-bold">
                  {loading ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-red-300 rounded w-20"></div>
                    </div>
                  ) : youtubeConnected ? formatNumber(youtubeAnalytics?.channel?.subscriberCount) : '—'}
                </div>
                <div className="flex items-center mt-2">
                  {youtubeConnected ? (
                    <>
                      <ArrowUp className="h-4 w-4 mr-1" />
                      <span className="text-sm">+{formatNumber(youtubeAnalytics?.analytics?.subscribersGained || 0)} this month</span>
                    </>
                  ) : (
                    <Link href="/dashboard/youtube" className="text-sm underline">
                      Connect YouTube
                    </Link>
                  )}
                </div>
              </div>
              <Play className="h-12 w-12 text-red-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Views</p>
                <div className="text-3xl font-bold">
                  {loading ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-blue-300 rounded w-20"></div>
                    </div>
                  ) : formatNumber(((analytics?.insights?.reach || analytics?.account?.reach) || 0) + (youtubeAnalytics?.analytics?.views || 0))}
                </div>
                <div className="flex items-center mt-2">
                  <ArrowUp className="h-4 w-4 mr-1" />
                  <span className="text-sm">IG + YT combined</span>
                </div>
              </div>
              <Eye className="h-12 w-12 text-blue-200" />
            </div>
          </div>
          
          <div className="bg-gradient-to-r from-purple-500 to-indigo-500 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Avg Engagement</p>
                <div className="text-3xl font-bold">
                  {loading ? (
                    <div className="animate-pulse">
                      <div className="h-8 bg-purple-300 rounded w-20"></div>
                    </div>
                  ) : (
                    (((analytics?.insights?.engagement_rate || analytics?.account?.engagement_rate) || 0) + (youtubeAnalytics?.analytics?.engagementRate || 0)) / 
                    ((instagramConnected ? 1 : 0) + (youtubeConnected ? 1 : 0) || 1)
                  ).toFixed(1)}%
                </div>
                <div className="flex items-center mt-2">
                  <TrendingUp className="h-4 w-4 mr-1" />
                  <span className="text-sm">Cross-platform</span>
                </div>
              </div>
              <TrendingUp className="h-12 w-12 text-purple-200" />
            </div>
          </div>
        </div>

        {/* Platform Connection Prompts */}
        {(!instagramConnected || !youtubeConnected) && (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">🚀 Connect Your Social Platforms</h3>
              <p className="text-gray-600 mb-6">
                Get the most out of Social MM by connecting all your social media accounts for unified analytics and scheduling.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {!instagramConnected && (
                  <Link href="/dashboard/instagram" className="flex items-center p-4 bg-white border border-pink-200 rounded-lg hover:border-pink-300 transition-colors">
                    <Instagram className="h-8 w-8 text-pink-500 mr-3" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Connect Instagram</h4>
                      <p className="text-sm text-gray-600">View analytics and schedule posts</p>
                    </div>
                  </Link>
                )}
                {!youtubeConnected && (
                  <Link href="/dashboard/youtube" className="flex items-center p-4 bg-white border border-red-200 rounded-lg hover:border-red-300 transition-colors">
                    <Play className="h-8 w-8 text-red-500 mr-3" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Connect YouTube</h4>
                      <p className="text-sm text-gray-600">Upload videos and track performance</p>
                    </div>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Visual Analytics Section */}
        {(analytics || youtubeAnalytics) && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-900">Analytics Overview</h3>
              <div className="flex space-x-3">
                {analytics && (
                  <Link href="/dashboard/instagram" className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors flex items-center">
                    <Instagram className="h-4 w-4 mr-2" />
                    Instagram
                  </Link>
                )}
                {youtubeAnalytics && (
                  <Link href="/dashboard/youtube" className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors flex items-center">
                    <Play className="h-4 w-4 mr-2" />
                    YouTube
                  </Link>
                )}
                {analytics && youtubeAnalytics && (
                  <Link href="/dashboard/analytics/combined" className="bg-indigo-500 text-white px-4 py-2 rounded-lg hover:bg-indigo-600 transition-colors flex items-center">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    Combined
                  </Link>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              {/* Engagement Metrics */}
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h4 className="text-lg font-semibold mb-4 flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-red-500" />
                  Engagement Breakdown
                </h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Website Clicks</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div className="bg-blue-500 h-2 rounded-full" style={{width: '75%'}}></div>
                      </div>
                      <span className="font-semibold">{formatNumber(analytics?.insights?.website_clicks || 0)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Accounts Engaged</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div className="bg-green-500 h-2 rounded-full" style={{width: '60%'}}></div>
                      </div>
                      <span className="font-semibold">{formatNumber(analytics?.insights?.accounts_engaged || 0)}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Profile Views</span>
                    <div className="flex items-center">
                      <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                        <div className="bg-purple-500 h-2 rounded-full" style={{width: '85%'}}></div>
                      </div>
                      <span className="font-semibold">{formatNumber(analytics?.insights?.profile_views || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Performance */}
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h4 className="text-lg font-semibold mb-4 flex items-center">
                  <BarChart3 className="h-5 w-5 mr-2 text-blue-500" />
                  Content Performance
                </h4>
                <div className="space-y-4">
                  {analytics?.charts_data?.engagement_by_type?.map((item: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <span className="text-gray-600 capitalize">{item.type.toLowerCase()}s</span>
                      <div className="flex items-center">
                        <div className="w-32 bg-gray-200 rounded-full h-2 mr-3">
                          <div 
                            className={`h-2 rounded-full ${
                              item.type === 'IMAGE' ? 'bg-pink-500' : 
                              item.type === 'VIDEO' ? 'bg-blue-500' : 'bg-green-500'
                            }`} 
                            style={{width: `${(item.engagement / Math.max(...(analytics?.charts_data?.engagement_by_type?.map((i: any) => i.engagement) || [1]))) * 100}%`}}
                          ></div>
                        </div>
                        <span className="font-semibold">{formatNumber(item.engagement)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Posts Preview */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h4 className="text-lg font-semibold mb-4 flex items-center">
                <Instagram className="h-5 w-5 mr-2 text-pink-500" />
                Recent Posts Performance
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {analytics?.recent_media?.slice(0, 5).map((post: any, index: number) => (
                  <div key={index} className="relative group cursor-pointer">
                    <img
                      src={post.thumbnail_url || post.media_url}
                      alt="Post"
                      className="w-full aspect-square object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-opacity rounded-lg flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center">
                        <div className="flex items-center justify-center space-x-4 text-sm">
                          <span className="flex items-center">
                            <Heart className="h-4 w-4 mr-1" />
                            {formatNumber(post.like_count)}
                          </span>
                          <span className="flex items-center">
                            <MessageCircle className="h-4 w-4 mr-1" />
                            {formatNumber(post.comments_count)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Creator & Business Hubs */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Link href="/dashboard/creator" className="group">
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-white">
              <div className="flex items-center mb-4">
                <Sparkles className="h-8 w-8" />
                <h3 className="ml-3 text-xl font-bold">Creator Studio</h3>
              </div>
              <p className="mb-4 opacity-90">
                AI-powered tools for content creators. Generate captions, track growth, and monetize your content.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm opacity-75">Perfect for influencers & creators</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>

          <Link href="/dashboard/business" className="group">
            <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow text-white">
              <div className="flex items-center mb-4">
                <Building2 className="h-8 w-8" />
                <h3 className="ml-3 text-xl font-bold">Business Hub</h3>
              </div>
              <p className="mb-4 opacity-90">
                Advanced analytics, team management, and ROI tracking for businesses and agencies.
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm opacity-75">Perfect for businesses & agencies</span>
                <span className="group-hover:translate-x-1 transition-transform">→</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Link href="/dashboard/calendar" className="group">
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <Calendar className="h-8 w-8 text-indigo-600" />
                <h3 className="ml-3 text-lg font-semibold text-gray-900">Content Calendar</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Schedule and manage your posts across all platforms in one place.
              </p>
              <div className="text-indigo-600 group-hover:text-indigo-700 font-medium">
                View Calendar →
              </div>
            </div>
          </Link>

          <Link href="/dashboard/analytics" className="group">
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <BarChart3 className="h-8 w-8 text-green-600" />
                <h3 className="ml-3 text-lg font-semibold text-gray-900">Analytics</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Track your performance and engagement across all social platforms.
              </p>
              <div className="text-green-600 group-hover:text-green-700 font-medium">
                View Analytics →
              </div>
            </div>
          </Link>

          <Link href="/dashboard/settings" className="group">
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <Settings className="h-8 w-8 text-gray-600" />
                <h3 className="ml-3 text-lg font-semibold text-gray-900">Settings</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Manage your account, connected platforms, and subscription.
              </p>
              <div className="text-gray-600 group-hover:text-gray-700 font-medium">
                Manage Settings →
              </div>
            </div>
          </Link>

          <Link href="/dashboard/instagram" className="group">
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <Instagram className="h-8 w-8 text-pink-500" />
                <h3 className="ml-3 text-lg font-semibold text-gray-900">Instagram</h3>
                {instagramConnected && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Connected</span>
                )}
              </div>
              <p className="text-gray-600 mb-4">
                {instagramConnected 
                  ? "Manage your Instagram posts, stories, reels, and analytics."
                  : "Connect your Instagram account to view analytics and schedule posts."
                }
              </p>
              <div className="text-pink-500 group-hover:text-pink-600 font-medium">
                {instagramConnected ? "Open Instagram →" : "Connect Instagram →"}
              </div>
            </div>
          </Link>

          <Link href="/dashboard/youtube" className="group">
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <Play className="h-8 w-8 text-red-500" />
                <h3 className="ml-3 text-lg font-semibold text-gray-900">YouTube</h3>
                {youtubeConnected && (
                  <span className="ml-2 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Connected</span>
                )}
              </div>
              <p className="text-gray-600 mb-4">
                {youtubeConnected 
                  ? "Upload videos, track performance, and manage your YouTube channel."
                  : "Connect your YouTube channel to upload videos and view analytics."
                }
              </p>
              <div className="text-red-500 group-hover:text-red-600 font-medium">
                {youtubeConnected ? "Open YouTube →" : "Connect YouTube →"}
              </div>
            </div>
          </Link>

          <Link href="/dashboard/content-studio" className="group">
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <Sparkles className="h-8 w-8 text-purple-600" />
                <h3 className="ml-3 text-lg font-semibold text-gray-900">Content Studio</h3>
              </div>
              <p className="text-gray-600 mb-4">
                AI-powered content creation, captions, and hashtag tools.
              </p>
              <div className="text-purple-600 group-hover:text-purple-700 font-medium">
                Create Content →
              </div>
            </div>
          </Link>

          <Link href="/dashboard/profile" className="group">
            <div className="bg-white p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center mb-4">
                <User className="h-8 w-8 text-gray-600" />
                <h3 className="ml-3 text-lg font-semibold text-gray-900">Profile</h3>
              </div>
              <p className="text-gray-600 mb-4">
                Update your personal information and account preferences.
              </p>
              <div className="text-gray-600 group-hover:text-gray-700 font-medium">
                Edit Profile →
              </div>
            </div>
          </Link>
        </div>

        {/* Create Post Section */}
        <div className="mt-8">
          <div className="bg-white p-8 rounded-xl shadow-sm border">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-gray-600 mt-1">Welcome back! Here's your social media overview.</p>
              </div>
              <div className="flex items-center gap-4">
                <a 
                  href="/dashboard/accounts" 
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Manage Accounts
                </a>
                <a 
                  href="/dashboard/content/create" 
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Create Post
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Content Type Selection */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Content Type</h4>
                <div className="space-y-3">
                  <button className="w-full p-4 border-2 border-indigo-200 bg-indigo-50 rounded-lg hover:border-indigo-300 transition-colors text-left">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center mr-3">
                        <Instagram className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Instagram Post</p>
                        <p className="text-sm text-gray-600">Image or video post</p>
                      </div>
                    </div>
                  </button>
                  
                  <button className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors text-left">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center mr-3">
                        <Instagram className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Instagram Reel</p>
                        <p className="text-sm text-gray-600">Short video content</p>
                      </div>
                    </div>
                  </button>
                  
                  <button className="w-full p-4 border-2 border-gray-200 rounded-lg hover:border-gray-300 transition-colors text-left opacity-50 cursor-not-allowed">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center mr-3">
                        <Users className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">Facebook Post</p>
                        <p className="text-sm text-gray-600">Coming soon</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Quick Actions</h4>
                <div className="space-y-3">
                  <Link href="/dashboard/content-studio" className="block w-full p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors">
                    <div className="flex items-center">
                      <Sparkles className="h-5 w-5 mr-3" />
                      <div>
                        <p className="font-medium">AI Caption Generator</p>
                        <p className="text-sm opacity-90">Generate engaging captions</p>
                      </div>
                    </div>
                  </Link>
                  
                  <Link href="/dashboard/calendar" className="block w-full p-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg hover:from-blue-600 hover:to-cyan-600 transition-colors">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-3" />
                      <div>
                        <p className="font-medium">Schedule Posts</p>
                        <p className="text-sm opacity-90">Plan your content calendar</p>
                      </div>
                    </div>
                  </Link>
                  
                  <button className="w-full p-4 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition-colors">
                    <div className="flex items-center">
                      <TrendingUp className="h-5 w-5 mr-3" />
                      <div>
                        <p className="font-medium">Best Time Suggestions</p>
                        <p className="text-sm opacity-90">AI-powered timing</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>

              {/* Upload & Schedule */}
              <div className="space-y-4">
                <h4 className="font-semibold text-gray-900">Upload & Schedule</h4>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition-colors cursor-pointer">
                  <div className="mb-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                      <Plus className="h-6 w-6 text-gray-400" />
                    </div>
                    <p className="text-sm font-medium text-gray-900">Drop files here or click to upload</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG, MP4 up to 100MB</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Schedule for</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 bg-white">
                      <option>Post now</option>
                      <option>Schedule for later</option>
                      <option>Add to queue</option>
                    </select>
                  </div>
                  
                  <button className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition-colors font-medium">
                    Create Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
