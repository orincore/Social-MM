'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, Heart, DollarSign, Calendar, Zap, Target, Award, Clock, Eye, Users2, MessageCircle, Bell, Send } from 'lucide-react';
import ProtectedRoute from '@/components/protected-route';
import { ProductAd } from '@/components/store/product-ad';

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

interface CreatorMatch {
  id: string;
  name: string;
  category: string;
  followers: string;
  overlap: number;
  matchScore: number;
  platforms: string[];
  bio: string;
  availability: string;
  latestIdea: string;
}

interface CollaborationNotification {
  id: string;
  type: 'match' | 'invite' | 'message';
  title: string;
  description: string;
  timeAgo: string;
  status: 'new' | 'seen';
}

interface ChatMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: string;
  type: 'sent' | 'received';
}

const mockCreatorMatches: CreatorMatch[] = [
  {
    id: 'aria-chen',
    name: 'Aria Chen',
    category: 'Sustainable Fashion',
    followers: '182K',
    overlap: 78,
    matchScore: 92,
    platforms: ['Instagram', 'YouTube'],
    bio: 'Slow fashion storyteller sharing capsule wardrobes & styling tips.',
    availability: 'Open for March launch content',
    latestIdea: 'Co-create a 5-look capsule challenge featuring artisan brands.'
  },
  {
    id: 'leo-ramirez',
    name: 'Leo Ramirez',
    category: 'Wellness & Productivity',
    followers: '96K',
    overlap: 64,
    matchScore: 88,
    platforms: ['YouTube', 'Threads'],
    bio: 'Mindful routines + solo founder productivity experiments.',
    availability: 'Available for Q2 drops',
    latestIdea: 'Run a "Creators reset week" live series with dual POV shorts.'
  },
  {
    id: 'mira-patel',
    name: 'Mira Patel',
    category: 'Beauty & Skin Tech',
    followers: '210K',
    overlap: 71,
    matchScore: 85,
    platforms: ['Instagram', 'TikTok'],
    bio: 'Chemist-backed skincare reviews & live routine breakdowns.',
    availability: 'Planning April brand collabs',
    latestIdea: '"Lab-to-vanity" split screen reels featuring both routines.'
  }
];

const mockCollabNotifications: CollaborationNotification[] = [
  {
    id: 'notif-1',
    type: 'match',
    title: 'New AI match: Aria Chen',
    description: '81% niche overlap · strong performance on reels this month.',
    timeAgo: '2h ago',
    status: 'new'
  },
  {
    id: 'notif-2',
    type: 'invite',
    title: 'Joint campaign invite',
    description: 'Mira sent a brief for "Glow Lab" UGC series.',
    timeAgo: '5h ago',
    status: 'new'
  },
  {
    id: 'notif-3',
    type: 'message',
    title: 'Draft feedback ready',
    description: 'Leo dropped comments on your Notion board.',
    timeAgo: 'Yesterday',
    status: 'seen'
  }
];

const mockChatHistory: Record<string, ChatMessage[]> = {
  'aria-chen': [
    {
      id: '1',
      sender: 'Aria',
      content: 'Love the capsule concept. Can we align drop dates with Earth Week?',
      timestamp: '2h ago',
      type: 'received'
    },
    {
      id: '2',
      sender: 'You',
      content: 'Absolutely. I can prep teaser clips for April 18-20.',
      timestamp: '1h ago',
      type: 'sent'
    },
    {
      id: '3',
      sender: 'Aria',
      content: 'Perfect. Let’s swap brand talking points tomorrow.',
      timestamp: '55m ago',
      type: 'received'
    }
  ],
  'leo-ramirez': [
    {
      id: '1',
      sender: 'Leo',
      content: 'Sharing the outline for the reset week edits in Notion.',
      timestamp: 'Yesterday',
      type: 'received'
    },
    {
      id: '2',
      sender: 'You',
      content: 'Got it. I’ll review the timers section tonight.',
      timestamp: 'Yesterday',
      type: 'sent'
    }
  ],
  'mira-patel': [
    {
      id: '1',
      sender: 'Mira',
      content: 'Sending over BTS stills for the lab shots.',
      timestamp: 'Mon',
      type: 'received'
    }
  ]
};

export default function CreatorDashboard() {
  const [metrics, setMetrics] = useState<CreatorMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedMatchId, setSelectedMatchId] = useState<string>(mockCreatorMatches[0].id);
  const [chatHistory, setChatHistory] = useState<Record<string, ChatMessage[]>>(mockChatHistory);
  const [chatInput, setChatInput] = useState('');

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

  const selectedMatch = mockCreatorMatches.find((match) => match.id === selectedMatchId) || mockCreatorMatches[0];
  const selectedMessages = chatHistory[selectedMatchId] || [];

  const handleSendMessage = () => {
    if (!chatInput.trim()) return;

    setChatHistory((prev) => {
      const existing = prev[selectedMatchId] || [];
      const newMessage: ChatMessage = {
        id: `${Date.now()}`,
        sender: 'You',
        content: chatInput.trim(),
        timestamp: 'Just now',
        type: 'sent'
      };

      return {
        ...prev,
        [selectedMatchId]: [...existing, newMessage]
      };
    });

    setChatInput('');
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

          {/* Commerce Spotlight */}
          <ProductAd />

          {/* Collaboration Intelligence */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 mt-8">
            <div className="xl:col-span-2 space-y-8">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                      <Users2 className="h-5 w-5 text-purple-500 mr-2" />
                      AI Collaboration Matches
                    </h3>
                    <p className="text-sm text-gray-500">Recommended creators with overlapping audiences</p>
                  </div>
                  <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-3 py-1 rounded-full">
                    Auto-refreshed hourly
                  </span>
                </div>
                <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-4">
                    {mockCreatorMatches.map((match) => (
                      <button
                        key={match.id}
                        onClick={() => setSelectedMatchId(match.id)}
                        className={`w-full text-left p-4 rounded-xl border transition-all ${
                          selectedMatchId === match.id
                            ? 'border-purple-500 bg-purple-50 shadow-sm'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{match.name}</p>
                            <p className="text-xs text-gray-500">{match.category}</p>
                          </div>
                          <span className="text-sm font-semibold text-purple-600">{match.matchScore}%</span>
                        </div>
                        <div className="mt-3 flex items-center justify-between text-sm">
                          <span className="text-gray-600">{match.followers} audience</span>
                          <span className="text-gray-500">{match.platforms.join(' • ')}</span>
                        </div>
                      </button>
                    ))}
                  </div>

                  <div className="lg:col-span-2 bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600 text-white rounded-2xl p-6 flex flex-col justify-between">
                    <div>
                      <p className="text-xs uppercase tracking-widest text-white/80">Top match insight</p>
                      <h4 className="text-2xl font-bold mt-2">{selectedMatch.name}</h4>
                      <p className="text-sm text-white/80 mt-1">{selectedMatch.bio}</p>
                      <div className="mt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white/80">Audience overlap</span>
                          <span className="text-lg font-semibold">{selectedMatch.overlap}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white/80">Availability</span>
                          <span className="text-sm font-medium">{selectedMatch.availability}</span>
                        </div>
                        <div className="flex items-start justify-between">
                          <span className="text-sm text-white/80">AI idea</span>
                          <p className="text-sm font-medium text-right max-w-xs">{selectedMatch.latestIdea}</p>
                        </div>
                      </div>
                    </div>
                    <div className="mt-6 flex flex-wrap gap-3">
                      <button className="flex-1 bg-white text-purple-600 font-semibold py-2 px-4 rounded-lg shadow-sm hover:bg-purple-50 transition-colors">
                        Send collab brief
                      </button>
                      <button className="flex items-center justify-center px-4 py-2 border border-white/40 rounded-lg text-sm font-medium hover:bg-white/10 transition-colors">
                        View media kit
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Bell className="h-5 w-5 text-amber-500 mr-2" />
                    Collaboration Feed
                  </h3>
                  <span className="text-xs text-gray-500">AI scanned 128 creators today</span>
                </div>
                <div className="p-6 space-y-4">
                  {mockCollabNotifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`p-4 rounded-xl border flex items-start gap-3 ${
                        notification.status === 'new'
                          ? 'border-amber-300 bg-amber-50'
                          : 'border-gray-200'
                      }`}
                    >
                      <div className="mt-1">
                        {notification.type === 'match' && <Users2 className="h-5 w-5 text-purple-600" />}
                        {notification.type === 'invite' && <MessageCircle className="h-5 w-5 text-pink-500" />}
                        {notification.type === 'message' && <Bell className="h-5 w-5 text-blue-500" />}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-gray-900">{notification.title}</p>
                          <span className="text-xs text-gray-500">{notification.timeAgo}</span>
                        </div>
                        <p className="text-sm text-gray-600 mt-1">{notification.description}</p>
                      </div>
                      {notification.status === 'new' && (
                        <span className="text-xs font-semibold text-amber-600 bg-white px-2 py-1 rounded-full">New</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm flex flex-col">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                  <MessageCircle className="h-5 w-5 text-sky-500 mr-2" />
                  Live Collab Chat
                </h3>
                <p className="text-sm text-gray-500">Sync on briefs without leaving Socialos</p>
              </div>
              <div className="flex-1 flex flex-col p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="bg-sky-100 text-sky-700 text-sm font-semibold px-3 py-1 rounded-full">
                    {selectedMatch.platforms.join(' • ')}
                  </div>
                  <span className="text-sm text-gray-500">Chatting with {selectedMatch.name}</span>
                </div>
                <div className="flex-1 overflow-y-auto space-y-3 pr-2">
                  {selectedMessages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.type === 'sent' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs rounded-2xl px-4 py-2 text-sm shadow ${
                          message.type === 'sent'
                            ? 'bg-sky-600 text-white rounded-br-none'
                            : 'bg-gray-100 text-gray-900 rounded-bl-none'
                        }`}
                      >
                        <p className="font-semibold text-xs mb-1">
                          {message.type === 'sent' ? 'You' : message.sender}
                          <span className="ml-2 text-[10px] opacity-70">{message.timestamp}</span>
                        </p>
                        <p>{message.content}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center gap-3">
                  <input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Share talking points, files or timelines..."
                    className="flex-1 border border-gray-200 rounded-full px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500"
                  />
                  <button
                    onClick={handleSendMessage}
                    className="bg-sky-600 hover:bg-sky-500 text-white rounded-full p-3 transition-colors"
                  >
                    <Send className="h-4 w-4" />
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
