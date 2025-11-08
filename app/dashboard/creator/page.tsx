'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, Heart, DollarSign, Calendar, Zap, Target, Award, Clock, Eye } from 'lucide-react';
import ProtectedRoute from '@/components/protected-route';

interface CreatorMetrics {
  totalFollowers: number;
  totalEngagement: number;
  monthlyGrowth: number;
  avgEngagementRate: number;
  topPerformingPost: {
    id: string;
    engagement: number;
    reach: number;
  };
  upcomingPosts: number;
  brandDeals: {
    active: number;
    pending: number;
    completed: number;
  };
  revenue: {
    thisMonth: number;
    lastMonth: number;
    growth: number;
  };
}

export default function CreatorDashboard() {
  const [metrics, setMetrics] = useState<CreatorMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchCreatorMetrics();
  }, [selectedPeriod]);

  const fetchCreatorMetrics = async () => {
    setLoading(true);
    try {
      // Mock data for now - replace with actual API call
      const mockData: CreatorMetrics = {
        totalFollowers: 45200,
        totalEngagement: 125400,
        monthlyGrowth: 12.5,
        avgEngagementRate: 4.8,
        topPerformingPost: {
          id: '1',
          engagement: 2400,
          reach: 15600
        },
        upcomingPosts: 8,
        brandDeals: {
          active: 3,
          pending: 2,
          completed: 12
        },
        revenue: {
          thisMonth: 8500,
          lastMonth: 7200,
          growth: 18.1
        }
      };
      
      setTimeout(() => {
        setMetrics(mockData);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching creator metrics:', error);
      setLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading creator dashboard...</p>
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
                <Zap className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <h1 className="text-2xl font-bold text-gray-900">Creator Studio</h1>
                  <p className="text-sm text-gray-600">Grow your brand and monetize your content</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="7d">Last 7 days</option>
                  <option value="30d">Last 30 days</option>
                  <option value="90d">Last 90 days</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Followers */}
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Followers</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics?.totalFollowers || 0)}</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +{metrics?.monthlyGrowth}% this month
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            {/* Engagement Rate */}
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-pink-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Avg. Engagement Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics?.avgEngagementRate}%</p>
                  <p className="text-sm text-gray-500 mt-1">Industry avg: 3.2%</p>
                </div>
                <Heart className="h-8 w-8 text-pink-500" />
              </div>
            </div>

            {/* Monthly Revenue */}
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Monthly Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">{formatCurrency(metrics?.revenue.thisMonth || 0)}</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +{metrics?.revenue.growth}% from last month
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </div>

            {/* Scheduled Posts */}
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Upcoming Posts</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics?.upcomingPosts}</p>
                  <p className="text-sm text-gray-500 mt-1">Next 7 days</p>
                </div>
                <Calendar className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Content Performance & Brand Deals */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Top Performing Content */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Award className="h-5 w-5 text-yellow-500 mr-2" />
                  Top Performing Content
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                        <Eye className="h-6 w-6 text-white" />
                      </div>
                      <div className="ml-4">
                        <p className="font-medium text-gray-900">Latest Reel</p>
                        <p className="text-sm text-gray-500">Posted 2 days ago</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">{formatNumber(metrics?.topPerformingPost.reach || 0)} reach</p>
                      <p className="text-sm text-gray-500">{formatNumber(metrics?.topPerformingPost.engagement || 0)} engagements</p>
                    </div>
                  </div>
                  
                  <button className="w-full text-purple-600 hover:text-purple-700 font-medium py-2">
                    View All Performance Analytics →
                  </button>
                </div>
              </div>
            </div>

            {/* Brand Partnerships */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <Target className="h-5 w-5 text-blue-500 mr-2" />
                  Brand Partnerships
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">{metrics?.brandDeals.active}</p>
                    <p className="text-sm text-gray-500">Active</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-yellow-600">{metrics?.brandDeals.pending}</p>
                    <p className="text-sm text-gray-500">Pending</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-600">{metrics?.brandDeals.completed}</p>
                    <p className="text-sm text-gray-500">Completed</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <button className="w-full bg-blue-50 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors">
                    Browse Brand Opportunities
                  </button>
                  <button className="w-full text-blue-600 hover:text-blue-700 font-medium py-2">
                    Manage Current Partnerships →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Creator Tools</h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-center">
                  <Calendar className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Content Calendar</p>
                  <p className="text-sm text-gray-500">Plan your posts</p>
                </button>
                
                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-colors text-center">
                  <Zap className="h-8 w-8 text-pink-500 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">AI Content Ideas</p>
                  <p className="text-sm text-gray-500">Generate captions</p>
                </button>
                
                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center">
                  <TrendingUp className="h-8 w-8 text-green-500 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Growth Analytics</p>
                  <p className="text-sm text-gray-500">Track progress</p>
                </button>
                
                <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center">
                  <DollarSign className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                  <p className="font-medium text-gray-900">Monetization</p>
                  <p className="text-sm text-gray-500">Track earnings</p>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
