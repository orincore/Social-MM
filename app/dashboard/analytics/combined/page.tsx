'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  BarChart3, TrendingUp, Users, Eye, Heart, MessageCircle, 
  Share2, Clock, Calendar, Award, Target, ArrowUp, ArrowDown, 
  Filter, Download, RefreshCw, Instagram, Play, Zap, Activity
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ComposedChart
} from 'recharts';

export default function CombinedAnalyticsPage() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      let url = `/api/analytics/combined?period=${selectedPeriod}`;
      
      if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
        url += `&startDate=${customStartDate}&endDate=${customEndDate}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
        console.log('Combined analytics data:', data.data);
      }
    } catch (error) {
      console.error('Error fetching combined analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setExporting(true);
      let url = `/api/analytics/combined/export?period=${selectedPeriod}`;
      if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
        url += `&startDate=${customStartDate}&endDate=${customEndDate}`;
      }

      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `combined-analytics-report-${new Date().toISOString().split('T')[0]}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Failed to export combined analytics report:', error);
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  useEffect(() => {
    if (session) {
      fetchAnalytics();
    }
  }, [session, selectedPeriod, customStartDate, customEndDate]);

  const formatNumber = (num: number | undefined | null) => {
    if (!num && num !== 0) return '0';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPercentage = (num: number | undefined | null) => {
    if (!num && num !== 0) return '0.0';
    return num.toFixed(1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading cross-platform analytics...</p>
        </div>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Zap className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">No Platform Data Available</h2>
          <p className="text-gray-600 mb-6">Connect Instagram and YouTube to see combined analytics.</p>
          <div className="space-x-4">
            <a href="/dashboard/instagram" className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors">
              Connect Instagram
            </a>
            <a href="/dashboard/youtube" className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors">
              Connect YouTube
            </a>
          </div>
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
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Combined Analytics</h1>
              <p className="text-gray-600 mt-1">
                Cross-platform insights and performance comparison
                <span className="ml-2 px-2 py-1 bg-indigo-100 text-indigo-800 text-xs rounded-full">
                  {selectedPeriod === 'day' ? 'Last Day' :
                   selectedPeriod === 'week' ? 'Last Week' :
                   selectedPeriod === 'month' ? 'Last Month' :
                   selectedPeriod === '3months' ? 'Last 3 Months' :
                   selectedPeriod === '6months' ? 'Last 6 Months' :
                   selectedPeriod === 'year' ? 'Last Year' :
                   selectedPeriod === 'custom' ? `${customStartDate} to ${customEndDate}` : selectedPeriod}
                </span>
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <select 
                value={selectedPeriod} 
                onChange={(e) => {
                  setSelectedPeriod(e.target.value);
                  setShowCustomRange(e.target.value === 'custom');
                }}
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white min-w-[160px]"
              >
                <option value="day">Last Day</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="year">Last Year</option>
                <option value="custom">Custom Date Range</option>
              </select>
              {showCustomRange && (
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  />
                </div>
              )}
              <button 
                onClick={() => fetchAnalytics()}
                disabled={loading}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Platform Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className={`p-6 rounded-xl shadow-sm border ${analytics.platforms.instagram.connected ? 'bg-pink-50 border-pink-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Instagram className="h-8 w-8 text-pink-500 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Instagram</h3>
                  <p className="text-sm text-gray-600">
                    {analytics.platforms.instagram.connected ? 'Connected & Active' : 'Not Connected'}
                  </p>
                </div>
              </div>
              {analytics.platforms.instagram.connected ? (
                <div className="text-right">
                  <p className="text-2xl font-bold text-pink-600">
                    {formatNumber(analytics.platforms.instagram.data?.account?.followers)}
                  </p>
                  <p className="text-sm text-gray-600">Followers</p>
                </div>
              ) : (
                <a href="/dashboard/instagram" className="bg-pink-500 text-white px-4 py-2 rounded-lg hover:bg-pink-600 transition-colors text-sm">
                  Connect
                </a>
              )}
            </div>
          </div>

          <div className={`p-6 rounded-xl shadow-sm border ${analytics.platforms.youtube.connected ? 'bg-red-50 border-red-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <Play className="h-8 w-8 text-red-500 mr-3" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">YouTube</h3>
                  <p className="text-sm text-gray-600">
                    {analytics.platforms.youtube.connected ? 'Connected & Active' : 'Not Connected'}
                  </p>
                </div>
              </div>
              {analytics.platforms.youtube.connected ? (
                <div className="text-right">
                  <p className="text-2xl font-bold text-red-600">
                    {formatNumber(analytics.platforms.youtube.data?.channel?.subscribers)}
                  </p>
                  <p className="text-sm text-gray-600">Subscribers</p>
                </div>
              ) : (
                <a href="/dashboard/youtube" className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors text-sm">
                  Connect
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Cross-Platform Comparison */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-gradient-to-r from-blue-500 to-cyan-500 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-100 text-sm font-medium">Total Audience</p>
                <p className="text-3xl font-bold">{formatNumber(analytics.comparison.audience.total)}</p>
                <div className="flex items-center mt-2 text-sm">
                  <Instagram className="h-4 w-4 mr-1" />
                  <span>{formatNumber(analytics.comparison.audience.instagram)}</span>
                  <Play className="h-4 w-4 ml-2 mr-1" />
                  <span>{formatNumber(analytics.comparison.audience.youtube)}</span>
                </div>
              </div>
              <Users className="h-12 w-12 text-blue-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-100 text-sm font-medium">Total Reach/Views</p>
                <p className="text-3xl font-bold">{formatNumber(analytics.comparison.reach.total)}</p>
                <div className="flex items-center mt-2 text-sm">
                  <Instagram className="h-4 w-4 mr-1" />
                  <span>{formatNumber(analytics.comparison.reach.instagram)}</span>
                  <Play className="h-4 w-4 ml-2 mr-1" />
                  <span>{formatNumber(analytics.comparison.reach.youtube)}</span>
                </div>
              </div>
              <Eye className="h-12 w-12 text-purple-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-100 text-sm font-medium">IG Engagement Rate</p>
                <p className="text-3xl font-bold">
                  {formatPercentage(analytics.comparison.engagement.instagram.rate)}%
                </p>
                <div className="flex items-center mt-2">
                  <Heart className="h-4 w-4 mr-1" />
                  <span className="text-sm">{formatNumber(analytics.comparison.engagement.instagram.total)} total</span>
                </div>
              </div>
              <Instagram className="h-12 w-12 text-green-200" />
            </div>
          </div>

          <div className="bg-gradient-to-r from-red-500 to-orange-500 p-6 rounded-xl shadow-lg text-white">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-red-100 text-sm font-medium">YT Engagement Rate</p>
                <p className="text-3xl font-bold">
                  {formatPercentage(analytics.comparison.engagement.youtube.rate)}%
                </p>
                <div className="flex items-center mt-2">
                  <Heart className="h-4 w-4 mr-1" />
                  <span className="text-sm">{formatNumber(analytics.comparison.engagement.youtube.total)} total</span>
                </div>
              </div>
              <Play className="h-12 w-12 text-red-200" />
            </div>
          </div>
        </div>

        {/* Performance Insights */}
        {analytics.insights && analytics.insights.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Award className="h-6 w-6 mr-2 text-yellow-500" />
              AI-Powered Insights
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {analytics.insights.map((insight: any, index: number) => (
                <div key={index} className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg border border-indigo-200">
                  <div className="flex items-start">
                    <div className={`p-2 rounded-lg mr-3 ${
                      insight.type === 'performance' ? 'bg-green-100 text-green-600' :
                      insight.type === 'growth' ? 'bg-blue-100 text-blue-600' :
                      insight.type === 'reach' ? 'bg-purple-100 text-purple-600' :
                      'bg-gray-100 text-gray-600'
                    }`}>
                      {insight.type === 'performance' ? <TrendingUp className="h-4 w-4" /> :
                       insight.type === 'growth' ? <ArrowUp className="h-4 w-4" /> :
                       insight.type === 'reach' ? <Eye className="h-4 w-4" /> :
                       <Activity className="h-4 w-4" />}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
                      <p className="text-sm text-gray-600 mb-2">{insight.description}</p>
                      <p className="text-xs text-indigo-600 font-medium">{insight.recommendation}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Cross-Platform Time Series */}
        {analytics.timeSeries.combined && analytics.timeSeries.combined.length > 0 && (
          <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="h-6 w-6 mr-2 text-blue-500" />
              Cross-Platform Performance Timeline
            </h3>
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={analytics.timeSeries.combined}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                />
                <YAxis yAxisId="left" tick={{ fontSize: 12 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} />
                <Tooltip 
                  labelFormatter={(value) => new Date(value).toLocaleDateString()}
                  formatter={(value: any, name: string) => [formatNumber(value), name]}
                />
                <Legend />
                <Bar 
                  yAxisId="left"
                  dataKey="instagramReach" 
                  fill="#e91e63" 
                  name="Instagram Reach"
                  opacity={0.8}
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="youtubeViews" 
                  stroke="#f44336" 
                  strokeWidth={3}
                  dot={{ fill: '#f44336', strokeWidth: 2, r: 4 }}
                  name="YouTube Views"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="youtubeSubscribers" 
                  stroke="#ff9800" 
                  strokeWidth={2}
                  dot={{ fill: '#ff9800', strokeWidth: 2, r: 3 }}
                  name="YouTube Subscribers Gained"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Platform Comparison Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Audience Comparison */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Users className="h-6 w-6 mr-2 text-purple-500" />
              Audience Comparison
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                {
                  platform: 'Instagram',
                  followers: analytics.comparison.audience.instagram,
                  color: '#e91e63'
                },
                {
                  platform: 'YouTube',
                  subscribers: analytics.comparison.audience.youtube,
                  color: '#f44336'
                }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="platform" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: any) => [formatNumber(value), 'Audience']} />
                <Bar dataKey="followers" fill="#e91e63" name="Followers" />
                <Bar dataKey="subscribers" fill="#f44336" name="Subscribers" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Engagement Comparison */}
          <div className="bg-white p-6 rounded-xl shadow-sm border">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
              <Heart className="h-6 w-6 mr-2 text-red-500" />
              Engagement Rate Comparison
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                {
                  platform: 'Instagram',
                  rate: analytics.comparison.engagement.instagram.rate,
                  total: analytics.comparison.engagement.instagram.total
                },
                {
                  platform: 'YouTube',
                  rate: analytics.comparison.engagement.youtube.rate,
                  total: analytics.comparison.engagement.youtube.total
                }
              ]}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="platform" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    name === 'rate' ? `${value.toFixed(1)}%` : formatNumber(value), 
                    name === 'rate' ? 'Engagement Rate' : 'Total Engagement'
                  ]} 
                />
                <Bar dataKey="rate" fill="#10b981" name="Engagement Rate (%)" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Content Performance */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Instagram Recent Content */}
          {analytics.platforms.instagram.connected && analytics.platforms.instagram.data?.recentContent && (
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Instagram className="h-6 w-6 mr-2 text-pink-500" />
                Recent Instagram Posts
              </h3>
              <div className="grid grid-cols-2 gap-4">
                {analytics.platforms.instagram.data.recentContent.slice(0, 4).map((post: any, index: number) => (
                  <div key={index} className="relative group">
                    <img
                      src={post.thumbnail_url || post.media_url}
                      alt="Instagram post"
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
          )}

          {/* YouTube Recent Content */}
          {analytics.platforms.youtube.connected && analytics.platforms.youtube.data?.recentContent && (
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Play className="h-6 w-6 mr-2 text-red-500" />
                Recent YouTube Videos
              </h3>
              <div className="space-y-4">
                {analytics.platforms.youtube.data.recentContent.slice(0, 3).map((video: any, index: number) => (
                  <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg">
                    <img
                      src={video.thumbnailUrl}
                      alt="YouTube video"
                      className="w-20 h-12 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 text-sm line-clamp-2">{video.title}</h4>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-600">
                        <span className="flex items-center">
                          <Eye className="h-3 w-3 mr-1" />
                          {formatNumber(parseInt(video.statistics?.viewCount || '0'))}
                        </span>
                        <span className="flex items-center">
                          <Heart className="h-3 w-3 mr-1" />
                          {formatNumber(parseInt(video.statistics?.likeCount || '0'))}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Export and Summary */}
        <div className="bg-white p-6 rounded-xl shadow-sm border">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-gray-900">Cross-Platform Summary</h3>
            <button
              onClick={handleExport}
              disabled={exporting}
              className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center disabled:opacity-60"
            >
              <Download className="h-4 w-4 mr-2" />
              {exporting ? 'Preparing...' : 'Export Report'}
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <p className="text-sm text-blue-600 font-medium">Total Platforms Connected</p>
              <p className="text-3xl font-bold text-blue-900">
                {(analytics.platforms.instagram.connected ? 1 : 0) + (analytics.platforms.youtube.connected ? 1 : 0)}
              </p>
              <p className="text-sm text-blue-600">of 2 available</p>
            </div>
            
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <p className="text-sm text-green-600 font-medium">Combined Audience</p>
              <p className="text-3xl font-bold text-green-900">
                {formatNumber(analytics.comparison.audience.total)}
              </p>
              <p className="text-sm text-green-600">Total followers & subscribers</p>
            </div>
            
            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <p className="text-sm text-purple-600 font-medium">Period Analyzed</p>
              <p className="text-3xl font-bold text-purple-900">
                {selectedPeriod === 'custom' ? 'Custom' : selectedPeriod}
              </p>
              <p className="text-sm text-purple-600">
                {analytics.dateRange?.startDate} to {analytics.dateRange?.endDate}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
