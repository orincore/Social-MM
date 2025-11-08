'use client';

import { BarChart3, TrendingUp, Users, Eye, Heart, MessageCircle, Instagram, Facebook, Youtube } from 'lucide-react';

const mockAnalytics = {
  overview: {
    totalPosts: 45,
    totalReach: 12500,
    totalEngagement: 2340,
    engagementRate: 18.7,
  },
  platformStats: [
    {
      platform: 'Instagram',
      icon: Instagram,
      posts: 20,
      followers: 5200,
      reach: 8500,
      engagement: 1560,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
    },
    {
      platform: 'Facebook',
      icon: Facebook,
      posts: 15,
      followers: 3800,
      reach: 2800,
      engagement: 520,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      platform: 'YouTube',
      icon: Youtube,
      posts: 10,
      followers: 1200,
      reach: 1200,
      engagement: 260,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
    },
  ],
  recentPosts: [
    {
      id: 1,
      title: 'Summer Collection Launch',
      platform: 'Instagram',
      publishedAt: '2024-11-10',
      reach: 1250,
      likes: 89,
      comments: 12,
      shares: 5,
    },
    {
      id: 2,
      title: 'Behind the Scenes Video',
      platform: 'YouTube',
      publishedAt: '2024-11-08',
      reach: 890,
      likes: 45,
      comments: 8,
      shares: 3,
    },
    {
      id: 3,
      title: 'Customer Testimonial',
      platform: 'Facebook',
      publishedAt: '2024-11-06',
      reach: 650,
      likes: 32,
      comments: 6,
      shares: 8,
    },
  ],
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <BarChart3 className="h-6 w-6 text-indigo-600 mr-2" />
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-50 rounded-lg">
              <BarChart3 className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Posts</p>
              <p className="text-2xl font-bold text-gray-900">{mockAnalytics.overview.totalPosts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-green-50 rounded-lg">
              <Eye className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reach</p>
              <p className="text-2xl font-bold text-gray-900">{mockAnalytics.overview.totalReach.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Heart className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Engagement</p>
              <p className="text-2xl font-bold text-gray-900">{mockAnalytics.overview.totalEngagement.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-50 rounded-lg">
              <TrendingUp className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Engagement Rate</p>
              <p className="text-2xl font-bold text-gray-900">{mockAnalytics.overview.engagementRate}%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Platform Performance */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Platform Performance</h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {mockAnalytics.platformStats.map((platform) => {
              const Icon = platform.icon;
              return (
                <div key={platform.platform} className={`p-6 rounded-lg ${platform.bgColor}`}>
                  <div className="flex items-center mb-4">
                    <Icon className={`h-8 w-8 ${platform.color}`} />
                    <h4 className="ml-3 text-lg font-semibold text-gray-900">{platform.platform}</h4>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Posts</span>
                      <span className="font-semibold text-gray-900">{platform.posts}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Followers</span>
                      <span className="font-semibold text-gray-900">{platform.followers.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Reach</span>
                      <span className="font-semibold text-gray-900">{platform.reach.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-gray-600">Engagement</span>
                      <span className="font-semibold text-gray-900">{platform.engagement.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent Posts Performance */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Recent Posts Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Post
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Platform
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Published
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reach
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Engagement
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {mockAnalytics.recentPosts.map((post) => (
                <tr key={post.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{post.title}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {post.platform}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(post.publishedAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {post.reach.toLocaleString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <Heart className="h-4 w-4 mr-1" />
                        {post.likes}
                      </div>
                      <div className="flex items-center">
                        <MessageCircle className="h-4 w-4 mr-1" />
                        {post.comments}
                      </div>
                      <div className="flex items-center">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {post.shares}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
