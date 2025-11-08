'use client';

import { useState, useEffect } from 'react';
import { Building2, Users, ShoppingCart, TrendingUp, DollarSign, Target, MessageSquare, Calendar, BarChart3, Globe } from 'lucide-react';
import ProtectedRoute from '@/components/protected-route';

interface BusinessMetrics {
  totalReach: number;
  websiteClicks: number;
  leadGeneration: number;
  conversionRate: number;
  socialROI: number;
  customerAcquisitionCost: number;
  brandMentions: number;
  sentimentScore: number;
  topPerformingCampaign: {
    name: string;
    reach: number;
    conversions: number;
    roi: number;
  };
  upcomingCampaigns: number;
  teamActivity: {
    postsScheduled: number;
    commentsReplied: number;
    campaignsLaunched: number;
  };
}

export default function BusinessDashboard() {
  const [metrics, setMetrics] = useState<BusinessMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    fetchBusinessMetrics();
  }, [selectedPeriod]);

  const fetchBusinessMetrics = async () => {
    setLoading(true);
    try {
      // Mock data for now - replace with actual API call
      const mockData: BusinessMetrics = {
        totalReach: 125000,
        websiteClicks: 3420,
        leadGeneration: 156,
        conversionRate: 4.2,
        socialROI: 285,
        customerAcquisitionCost: 45,
        brandMentions: 89,
        sentimentScore: 78,
        topPerformingCampaign: {
          name: 'Summer Sale 2024',
          reach: 45000,
          conversions: 234,
          roi: 320
        },
        upcomingCampaigns: 5,
        teamActivity: {
          postsScheduled: 24,
          commentsReplied: 67,
          campaignsLaunched: 3
        }
      };
      
      setTimeout(() => {
        setMetrics(mockData);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error('Error fetching business metrics:', error);
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading business dashboard...</p>
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
                <Building2 className="h-8 w-8 text-blue-600" />
                <div className="ml-3">
                  <h1 className="text-2xl font-bold text-gray-900">Business Hub</h1>
                  <p className="text-sm text-gray-600">Drive growth through social media marketing</p>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <select
                  value={selectedPeriod}
                  onChange={(e) => setSelectedPeriod(e.target.value as any)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          {/* Key Business Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {/* Total Reach */}
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-blue-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Reach</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics?.totalReach || 0)}</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +15.2% vs last period
                  </p>
                </div>
                <Globe className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            {/* Website Clicks */}
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-green-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Website Clicks</p>
                  <p className="text-2xl font-bold text-gray-900">{formatNumber(metrics?.websiteClicks || 0)}</p>
                  <p className="text-sm text-green-600 flex items-center mt-1">
                    <TrendingUp className="h-4 w-4 mr-1" />
                    +8.7% conversion rate
                  </p>
                </div>
                <Target className="h-8 w-8 text-green-500" />
              </div>
            </div>

            {/* Lead Generation */}
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-purple-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Leads Generated</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics?.leadGeneration}</p>
                  <p className="text-sm text-gray-500 mt-1">CAC: {formatCurrency(metrics?.customerAcquisitionCost || 0)}</p>
                </div>
                <Users className="h-8 w-8 text-purple-500" />
              </div>
            </div>

            {/* Social ROI */}
            <div className="bg-white p-6 rounded-lg shadow-sm border-l-4 border-orange-500">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Social ROI</p>
                  <p className="text-2xl font-bold text-gray-900">{metrics?.socialROI}%</p>
                  <p className="text-sm text-green-600 mt-1">Above industry avg</p>
                </div>
                <DollarSign className="h-8 w-8 text-orange-500" />
              </div>
            </div>
          </div>

          {/* Campaign Performance & Brand Monitoring */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Top Performing Campaign */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BarChart3 className="h-5 w-5 text-blue-500 mr-2" />
                  Campaign Performance
                </h3>
              </div>
              <div className="p-6">
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg mb-4">
                  <h4 className="font-semibold text-gray-900 mb-2">{metrics?.topPerformingCampaign.name}</h4>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-lg font-bold text-blue-600">{formatNumber(metrics?.topPerformingCampaign.reach || 0)}</p>
                      <p className="text-xs text-gray-500">Reach</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-green-600">{metrics?.topPerformingCampaign.conversions}</p>
                      <p className="text-xs text-gray-500">Conversions</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-purple-600">{metrics?.topPerformingCampaign.roi}%</p>
                      <p className="text-xs text-gray-500">ROI</p>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <button className="w-full bg-blue-50 text-blue-700 py-2 px-4 rounded-lg hover:bg-blue-100 transition-colors">
                    Create Similar Campaign
                  </button>
                  <button className="w-full text-blue-600 hover:text-blue-700 font-medium py-2">
                    View All Campaigns →
                  </button>
                </div>
              </div>
            </div>

            {/* Brand Monitoring */}
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MessageSquare className="h-5 w-5 text-green-500 mr-2" />
                  Brand Monitoring
                </h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">{metrics?.brandMentions}</p>
                    <p className="text-sm text-gray-500">Brand Mentions</p>
                    <p className="text-xs text-green-600 mt-1">+12% this week</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{metrics?.sentimentScore}%</p>
                    <p className="text-sm text-gray-500">Positive Sentiment</p>
                    <p className="text-xs text-gray-500 mt-1">Industry avg: 65%</p>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <button className="w-full bg-green-50 text-green-700 py-2 px-4 rounded-lg hover:bg-green-100 transition-colors">
                    View Mention Alerts
                  </button>
                  <button className="w-full text-green-600 hover:text-green-700 font-medium py-2">
                    Sentiment Analysis Report →
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Team Activity & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Team Activity */}
            <div className="lg:col-span-1 bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Team Activity</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Posts Scheduled</span>
                    <span className="font-semibold text-gray-900">{metrics?.teamActivity.postsScheduled}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Comments Replied</span>
                    <span className="font-semibold text-gray-900">{metrics?.teamActivity.commentsReplied}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Campaigns Launched</span>
                    <span className="font-semibold text-gray-900">{metrics?.teamActivity.campaignsLaunched}</span>
                  </div>
                </div>
                
                <button className="w-full mt-4 text-blue-600 hover:text-blue-700 font-medium py-2">
                  View Team Performance →
                </button>
              </div>
            </div>

            {/* Business Tools */}
            <div className="lg:col-span-2 bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Business Tools</h3>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center">
                    <Target className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                    <p className="font-medium text-gray-900">Ad Campaigns</p>
                    <p className="text-sm text-gray-500">Create & manage</p>
                  </button>
                  
                  <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-center">
                    <BarChart3 className="h-8 w-8 text-green-500 mx-auto mb-2" />
                    <p className="font-medium text-gray-900">Analytics</p>
                    <p className="text-sm text-gray-500">Deep insights</p>
                  </button>
                  
                  <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-purple-500 hover:bg-purple-50 transition-colors text-center">
                    <Users className="h-8 w-8 text-purple-500 mx-auto mb-2" />
                    <p className="font-medium text-gray-900">Audience</p>
                    <p className="text-sm text-gray-500">Segment & target</p>
                  </button>
                  
                  <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-colors text-center">
                    <ShoppingCart className="h-8 w-8 text-orange-500 mx-auto mb-2" />
                    <p className="font-medium text-gray-900">E-commerce</p>
                    <p className="text-sm text-gray-500">Product catalog</p>
                  </button>
                  
                  <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-colors text-center">
                    <MessageSquare className="h-8 w-8 text-pink-500 mx-auto mb-2" />
                    <p className="font-medium text-gray-900">Customer Care</p>
                    <p className="text-sm text-gray-500">Manage inquiries</p>
                  </button>
                  
                  <button className="p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-indigo-500 hover:bg-indigo-50 transition-colors text-center">
                    <Calendar className="h-8 w-8 text-indigo-500 mx-auto mb-2" />
                    <p className="font-medium text-gray-900">Content Planner</p>
                    <p className="text-sm text-gray-500">Schedule posts</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
