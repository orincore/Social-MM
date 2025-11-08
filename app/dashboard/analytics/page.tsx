'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { 
  BarChart3, TrendingUp, Users, Eye, Heart, MessageCircle, 
  Share2, Bookmark, Clock, Calendar, Award, Target,
  ArrowUp, ArrowDown, Filter, Download, RefreshCw
} from 'lucide-react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

export default function AnalyticsPage() {
  const { data: session } = useSession();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState('month');
  const [showCustomRange, setShowCustomRange] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      let url = `/api/instagram/analytics?period=${selectedPeriod}`;
      
      // Add custom date range parameters if selected
      if (selectedPeriod === 'custom' && customStartDate && customEndDate) {
        url += `&startDate=${customStartDate}&endDate=${customEndDate}`;
      }
      
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        setAnalytics(data.data);
        console.log('Complete analytics data:', data.data);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading comprehensive analytics...</p>
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
              <h1 className="text-3xl font-bold text-gray-900">Instagram Analytics</h1>
              <p className="text-gray-600 mt-1">
                Comprehensive performance insights and data visualization
                {analytics && (
                  <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                    {selectedPeriod === '24h' ? 'Last 24 Hours' :
                     selectedPeriod === '48h' ? 'Last 48 Hours' :
                     selectedPeriod === 'week' ? 'Last Week' :
                     selectedPeriod === 'month' ? 'Last Month' :
                     selectedPeriod === '3months' ? 'Last 3 Months' :
                     selectedPeriod === '6months' ? 'Last 6 Months' :
                     selectedPeriod === 'year' ? 'Last Year' :
                     selectedPeriod === '2years' ? 'Last 2 Years' :
                     selectedPeriod === '5years' ? 'Last 5 Years' :
                     selectedPeriod === 'custom' ? `${customStartDate} to ${customEndDate}` : selectedPeriod}
                  </span>
                )}
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
                <option value="24h">Last 24 Hours</option>
                <option value="48h">Last 48 Hours</option>
                <option value="week">Last Week</option>
                <option value="month">Last Month</option>
                <option value="3months">Last 3 Months</option>
                <option value="6months">Last 6 Months</option>
                <option value="year">Last Year</option>
                <option value="2years">Last 2 Years</option>
                <option value="5years">Last 5 Years</option>
                <option value="custom">Custom Date Range</option>
              </select>
              {showCustomRange && (
                <div className="flex items-center space-x-2">
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="Start Date"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    placeholder="End Date"
                  />
                </div>
              )}
              <button 
                onClick={() => fetchAnalytics()}
                disabled={loading || (selectedPeriod === 'custom' && (!customStartDate || !customEndDate))}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center disabled:opacity-50"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                {loading ? 'Loading...' : 'Refresh'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {analytics && (
          <>
            {/* Key Metrics Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 rounded-xl shadow-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm font-medium">Total Posts Analyzed</p>
                    <p className="text-3xl font-bold">{analytics.performance_analysis?.total_posts_analyzed || 0}</p>
                    <div className="flex items-center mt-2">
                      <BarChart3 className="h-4 w-4 mr-1" />
                      <span className="text-sm">Comprehensive Analysis</span>
                    </div>
                  </div>
                  <Target className="h-12 w-12 text-blue-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 rounded-xl shadow-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm font-medium">Avg Engagement/Post</p>
                    <p className="text-3xl font-bold">{formatNumber(analytics.performance_analysis?.avg_engagement_per_post)}</p>
                    <div className="flex items-center mt-2">
                      <ArrowUp className="h-4 w-4 mr-1" />
                      <span className="text-sm">Per Post Average</span>
                    </div>
                  </div>
                  <Heart className="h-12 w-12 text-green-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 rounded-xl shadow-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm font-medium">Avg Reach/Post</p>
                    <p className="text-3xl font-bold">{formatNumber(analytics.performance_analysis?.avg_reach_per_post)}</p>
                    <div className="flex items-center mt-2">
                      <Eye className="h-4 w-4 mr-1" />
                      <span className="text-sm">Average Reach</span>
                    </div>
                  </div>
                  <Users className="h-12 w-12 text-purple-200" />
                </div>
              </div>

              <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 rounded-xl shadow-lg text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm font-medium">Avg Saves/Post</p>
                    <p className="text-3xl font-bold">{formatNumber(analytics.performance_analysis?.avg_saves_per_post)}</p>
                    <div className="flex items-center mt-2">
                      <Bookmark className="h-4 w-4 mr-1" />
                      <span className="text-sm">Save Rate</span>
                    </div>
                  </div>
                  <Bookmark className="h-12 w-12 text-orange-200" />
                </div>
              </div>
            </div>

            {/* Top Performing Posts */}
            <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-bold text-gray-900 flex items-center">
                  <Award className="h-6 w-6 mr-2 text-yellow-500" />
                  Top Performing Posts
                </h3>
                <span className="text-sm text-gray-500">Ranked by performance score</span>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {analytics.charts_data?.top_posts_detailed?.map((post: any, index: number) => (
                  <div key={post.id} className="relative group">
                    <div className="relative">
                      <img
                        src={post.media_url}
                        alt="Top post"
                        className="w-full aspect-square object-cover rounded-lg"
                      />
                      <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-bold">
                        #{index + 1}
                      </div>
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-70 transition-opacity rounded-lg flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity text-white text-center p-4">
                          <div className="space-y-2 text-sm">
                            <div className="flex items-center justify-center">
                              <Award className="h-4 w-4 mr-1" />
                              Score: {post.performance_score}
                            </div>
                            <div className="flex items-center justify-center">
                              <TrendingUp className="h-4 w-4 mr-1" />
                              {post.engagement_rate}% Engagement
                            </div>
                            <div className="flex items-center justify-center space-x-4">
                              <span className="flex items-center">
                                <Heart className="h-3 w-3 mr-1" />
                                {formatNumber(post.like_count)}
                              </span>
                              <span className="flex items-center">
                                <MessageCircle className="h-3 w-3 mr-1" />
                                {formatNumber(post.comments_count)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-3">
                      <p className="text-xs text-gray-600 line-clamp-2">{post.caption}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(post.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance by Content Type */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <BarChart3 className="h-6 w-6 mr-2 text-blue-500" />
                  Performance by Content Type
                </h3>
                <div className="space-y-4">
                  {analytics.performance_analysis?.by_content_type?.map((type: any, index: number) => (
                    type.count > 0 && (
                      <div key={index} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-semibold text-gray-900 capitalize">
                            {type.type.toLowerCase()}s ({type.count} posts)
                          </span>
                          <span className="text-sm text-gray-500">
                            {Math.round((type.count / analytics.performance_analysis.total_posts_analyzed) * 100)}%
                          </span>
                        </div>
                        
                        <div className="grid grid-cols-3 gap-4 text-sm">
                          <div className="text-center">
                            <p className="text-gray-600">Avg Engagement</p>
                            <p className="font-bold text-lg">{formatNumber(type.avg_engagement)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-600">Avg Reach</p>
                            <p className="font-bold text-lg">{formatNumber(type.avg_reach)}</p>
                          </div>
                          <div className="text-center">
                            <p className="text-gray-600">Avg Saves</p>
                            <p className="font-bold text-lg">{formatNumber(type.avg_saves)}</p>
                          </div>
                        </div>

                        <div className="mt-3">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full ${
                                type.type === 'IMAGE' ? 'bg-pink-500' : 
                                type.type === 'VIDEO' ? 'bg-blue-500' : 
                                type.type === 'REELS' ? 'bg-purple-500' : 'bg-green-500'
                              }`}
                              style={{
                                width: `${Math.min(100, (type.total_engagement / Math.max(...analytics.performance_analysis.by_content_type.map((t: any) => t.total_engagement))) * 100)}%`
                              }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>

              {/* Best Posting Times */}
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Clock className="h-6 w-6 mr-2 text-green-500" />
                  Best Posting Times
                </h3>
                
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-700 mb-3">Top 5 Hours</h4>
                  <div className="space-y-3">
                    {analytics.performance_analysis?.best_posting_hours?.map((hour: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold mr-3">
                            {index + 1}
                          </div>
                          <span className="font-medium">
                            {hour.hour}:00 - {hour.hour + 1}:00
                          </span>
                        </div>
                        <div className="text-right">
                          <p className="font-bold">{formatNumber(hour.avg_engagement)}</p>
                          <p className="text-xs text-gray-500">{hour.posts_count} posts</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">Best Days</h4>
                  <div className="space-y-2">
                    {analytics.performance_analysis?.best_posting_days?.slice(0, 3).map((day: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="font-medium">{day.dayName}</span>
                        <div className="text-right">
                          <span className="font-bold">{formatNumber(day.avg_engagement)}</span>
                          <span className="text-xs text-gray-500 ml-2">({day.posts_count} posts)</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Real Data Visualizations with Beautiful Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Real Engagement Timeline */}
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <TrendingUp className="h-6 w-6 mr-2 text-blue-500" />
                  Real Engagement Timeline
                </h3>
                
                {analytics.charts_data?.engagement_trends?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={analytics.charts_data.engagement_trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value: any, name: string) => [formatNumber(value), name]}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="engagement" 
                        stroke="#3b82f6" 
                        strokeWidth={3}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                        name="Engagement"
                      />
                      <Line 
                        type="monotone" 
                        dataKey="reach" 
                        stroke="#10b981" 
                        strokeWidth={2}
                        dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
                        name="Reach"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No engagement data available</p>
                      <p className="text-sm">Posts need insights data for timeline</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Real Impressions vs Reach Comparison */}
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Eye className="h-6 w-6 mr-2 text-purple-500" />
                  Impressions vs Reach
                </h3>
                
                {analytics.charts_data?.engagement_trends?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={analytics.charts_data.engagement_trends}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value: any, name: string) => [formatNumber(value), name]}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="impressions"
                        stackId="1"
                        stroke="#8b5cf6"
                        fill="#8b5cf6"
                        fillOpacity={0.6}
                        name="Impressions"
                      />
                      <Area
                        type="monotone"
                        dataKey="reach"
                        stackId="2"
                        stroke="#06b6d4"
                        fill="#06b6d4"
                        fillOpacity={0.6}
                        name="Reach"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Eye className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No impression/reach data available</p>
                      <p className="text-sm">Insights needed for comparison</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Content Performance Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Content Type Performance Bar Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <BarChart3 className="h-6 w-6 mr-2 text-green-500" />
                  Content Type Performance
                </h3>
                
                {analytics.charts_data?.engagement_by_type?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={analytics.charts_data.engagement_by_type}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="type" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip formatter={(value: any) => [formatNumber(value), 'Average']} />
                      <Legend />
                      <Bar 
                        dataKey="avg_engagement" 
                        fill="#10b981" 
                        name="Avg Engagement"
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="avg_reach" 
                        fill="#3b82f6" 
                        name="Avg Reach"
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No content performance data</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Content Distribution Pie Chart */}
              <div className="bg-white p-6 rounded-xl shadow-sm border">
                <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                  <Target className="h-6 w-6 mr-2 text-orange-500" />
                  Content Distribution
                </h3>
                
                {analytics.charts_data?.content_distribution?.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={analytics.charts_data.content_distribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ type, percentage }) => `${type}: ${percentage}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {analytics.charts_data.content_distribution.map((entry: any, index: number) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]} 
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => [value, 'Posts']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-64 flex items-center justify-center text-gray-500">
                    <div className="text-center">
                      <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>No content distribution data</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Real Data Summary */}
            <div className="bg-white p-6 rounded-xl shadow-sm border mb-8">
              <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                <Award className="h-6 w-6 mr-2 text-yellow-500" />
                Real Data Summary
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600 font-medium">Posts with Real Insights</p>
                  <p className="text-3xl font-bold text-blue-900">
                    {analytics.performance_analysis?.posts_with_real_insights || 0}
                  </p>
                  <p className="text-sm text-blue-600">
                    of {analytics.performance_analysis?.total_posts_analyzed || 0} analyzed
                  </p>
                </div>
                
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-sm text-green-600 font-medium">Avg Real Engagement</p>
                  <p className="text-3xl font-bold text-green-900">
                    {analytics.performance_analysis?.avg_engagement_per_post 
                      ? formatNumber(analytics.performance_analysis.avg_engagement_per_post)
                      : 'N/A'
                    }
                  </p>
                  <p className="text-sm text-green-600">Per post with insights</p>
                </div>
                
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600 font-medium">Avg Real Reach</p>
                  <p className="text-3xl font-bold text-purple-900">
                    {analytics.performance_analysis?.avg_reach_per_post 
                      ? formatNumber(analytics.performance_analysis.avg_reach_per_post)
                      : 'N/A'
                    }
                  </p>
                  <p className="text-sm text-purple-600">Per post with insights</p>
                </div>
              </div>
            </div>

            {/* Raw Data Export */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900">Data Export & Insights</h3>
                <button className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center">
                  <Download className="h-4 w-4 mr-2" />
                  Export Data
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Available Metrics</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Engagement Rate</li>
                    <li>• Reach & Impressions</li>
                    <li>• Saves & Shares</li>
                    <li>• Profile Visits</li>
                    <li>• Website Clicks</li>
                    <li>• Video Views</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Analysis Period</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Posts Analyzed: {analytics.performance_analysis?.total_posts_analyzed}</li>
                    <li>• Time Range: {selectedPeriod}</li>
                    <li>• Data Points: {analytics.charts_data?.follower_growth?.length}</li>
                    <li>• Content Types: {analytics.performance_analysis?.by_content_type?.filter((t: any) => t.count > 0).length}</li>
                  </ul>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold mb-2">Key Insights</h4>
                  <ul className="space-y-1 text-gray-600">
                    <li>• Best Hour: {analytics.performance_analysis?.best_posting_hours?.[0]?.hour}:00</li>
                    <li>• Best Day: {analytics.performance_analysis?.best_posting_days?.[0]?.dayName}</li>
                    <li>• Top Content: {analytics.performance_analysis?.by_content_type?.sort((a: any, b: any) => b.avg_engagement - a.avg_engagement)?.[0]?.type}</li>
                    <li>• Engagement Rate: {analytics.insights?.engagement_rate}%</li>
                  </ul>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
