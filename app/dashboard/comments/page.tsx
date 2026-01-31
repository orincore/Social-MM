'use client';

import { useState, useEffect } from 'react';
import ProtectedRoute from '@/components/protected-route';
import { 
  MessageSquare, 
  AlertTriangle, 
  ThumbsUp, 
  ThumbsDown, 
  Flame, 
  Shield,
  TrendingUp,
  Clock,
  Filter,
  Loader2,
  ExternalLink,
  Instagram,
  Youtube,
  RefreshCw
} from 'lucide-react';

interface Comment {
  id: string;
  text: string;
  author: string;
  timestamp: string;
  platform: string;
  contentId: string;
  contentTitle: string;
  contentUrl?: string;
  category: 'positive' | 'neutral' | 'negative' | 'hateful' | 'violent' | 'spam';
  sentiment: number;
  toxicity: number;
  reasoning?: string;
}

interface Summary {
  totalComments: number;
  positiveCount: number;
  neutralCount: number;
  negativeCount: number;
  hatefulCount: number;
  violentCount: number;
  spamCount: number;
  averageSentiment: number;
  criticalInsights: string;
  topConcerns: string[];
  recommendations: string[];
}

export default function CommentsAnalysisPage() {
  const [timeRange, setTimeRange] = useState<'24h' | '7d' | '28d' | '1y' | '5y'>('7d');
  const [platform, setPlatform] = useState<'all' | 'instagram' | 'youtube'>('all');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [comments, setComments] = useState<Comment[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [activeTab, setActiveTab] = useState<'all' | 'positive' | 'negative' | 'problematic'>('all');
  const [refreshedAt, setRefreshedAt] = useState<string | null>(null);
  const [fromCache, setFromCache] = useState(false);
  const [isStale, setIsStale] = useState(false);

  useEffect(() => {
    loadComments();
  }, [timeRange, platform]);

  const loadComments = async (options: { refresh?: boolean } = {}) => {
    const { refresh = false } = options;

    if (refresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
      setComments([]);
      setSummary(null);
    }

    try {
      const url = `/api/comments/fetch?timeRange=${timeRange}&platform=${platform}${refresh ? '&refresh=true' : ''}`;
      const response = await fetch(url);
      const data = await response.json();

      if (!data.success) {
        throw new Error('Failed to load comments');
      }

      setComments(data.comments || []);
      setSummary(data.summary || null);
      setRefreshedAt(data.refreshedAt || null);
      setFromCache(Boolean(data.fromCache));
      setIsStale(Boolean(data.isStale));
    } catch (error) {
      console.error('Comment load error:', error);
      if (!options.refresh) {
        setComments([]);
        setSummary(null);
      }
    } finally {
      if (refresh) {
        setRefreshing(false);
      } else {
        setLoading(false);
      }
    }
  };

  const platformFilteredComments = comments.filter(comment => {
    if (platform === 'all') return true;
    return comment.platform === platform;
  });

  const filteredComments = platformFilteredComments.filter(comment => {
    if (activeTab === 'all') return true;
    if (activeTab === 'positive') return comment.category === 'positive';
    if (activeTab === 'negative') return comment.category === 'negative' || comment.category === 'neutral';
    if (activeTab === 'problematic') return ['hateful', 'violent', 'spam'].includes(comment.category || '');
    return true;
  });

  const getCategoryColor = (category?: string) => {
    switch (category) {
      case 'positive': return 'text-green-600 bg-green-50 border-green-200';
      case 'neutral': return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'negative': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'hateful': return 'text-red-600 bg-red-50 border-red-200';
      case 'violent': return 'text-red-700 bg-red-100 border-red-300';
      case 'spam': return 'text-purple-600 bg-purple-50 border-purple-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'positive': return <ThumbsUp className="h-4 w-4" />;
      case 'negative': return <ThumbsDown className="h-4 w-4" />;
      case 'hateful': return <Flame className="h-4 w-4" />;
      case 'violent': return <AlertTriangle className="h-4 w-4" />;
      case 'spam': return <Shield className="h-4 w-4" />;
      default: return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getPlatformIcon = (platform?: string) => {
    const normalized = (platform || '').trim().toLowerCase();
    if (normalized === 'instagram') {
      return <Instagram className="h-5 w-5 text-pink-500" />;
    }
    if (normalized === 'youtube') {
      return <Youtube className="h-5 w-5 text-red-600" />;
    }
    if (normalized && process.env.NODE_ENV !== 'production') {
      console.warn('Unknown platform for comment icon:', platform);
    }
    return <MessageSquare className="h-5 w-5 text-gray-400" />;
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Comment Analysis</h1>
            <p className="text-gray-600 mt-2">AI-powered sentiment and toxicity detection across your content</p>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Time Range:</span>
                <div className="flex gap-2">
                  {(['24h', '7d', '28d', '1y', '5y'] as const).map(range => (
                    <button
                      key={range}
                      onClick={() => setTimeRange(range)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        timeRange === range
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {
                        range === '24h'
                          ? '24 Hours'
                          : range === '7d'
                            ? '7 Days'
                            : range === '28d'
                              ? '28 Days'
                              : range === '1y'
                                ? '1 Year'
                                : '5 Years'
                      }
                    </button>
                  ))}
                </div>
              </div>

              <div className="h-6 w-px bg-gray-200" />

              <div className="flex items-center gap-2">
                <Filter className="h-5 w-5 text-gray-400" />
                <span className="text-sm font-medium text-gray-700">Platform:</span>
                <div className="flex gap-2">
                  {(['all', 'instagram', 'youtube'] as const).map(p => (
                    <button
                      key={p}
                      onClick={() => setPlatform(p)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                        platform === p
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      {p === 'all' ? 'All' : p === 'instagram' ? 'Instagram' : 'YouTube'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="ml-auto flex items-center gap-3">
                <button
                  onClick={() => loadComments({ refresh: true })}
                  disabled={refreshing || loading}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border transition ${
                    refreshing || loading
                      ? 'bg-gray-100 text-gray-400 border-gray-200'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-100 hover:bg-indigo-100'
                  }`}
                >
                  {refreshing ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Refreshing...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      Refresh Data
                    </>
                  )}
                </button>

                {refreshedAt && (
                  <div className="flex flex-col text-xs text-gray-500">
                    <span>
                      Last updated: {new Date(refreshedAt).toLocaleString()}{' '}
                      {fromCache ? '(cached)' : '(live)'}
                    </span>
                    {isStale && (
                      <span className="text-amber-600">Data is stale — refresh recommended.</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="h-12 w-12 text-indigo-600 animate-spin mb-4" />
              <p className="text-gray-600">Loading latest comments and insights…</p>
            </div>
          ) : comments.length === 0 ? (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-12 text-center">
              <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No comments found</h3>
              <p className="text-gray-600">Try adjusting your filters or publish more content to see comment analysis.</p>
            </div>
          ) : (
            <>
              {/* Summary Cards */}
              {summary && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                  {(() => {
                    const negativeAndNeutral = summary.negativeCount + summary.neutralCount;
                    const negativePercentage = summary.totalComments
                      ? ((negativeAndNeutral / summary.totalComments) * 100).toFixed(1)
                      : '0.0';
                    return (
                      <>
                        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-600">Total Comments</span>
                            <MessageSquare className="h-5 w-5 text-gray-400" />
                          </div>
                          <p className="text-3xl font-bold text-gray-900">{summary.totalComments}</p>
                        </div>

                        <div className="bg-green-50 rounded-2xl shadow-sm border border-green-200 p-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-green-700">Positive</span>
                            <ThumbsUp className="h-5 w-5 text-green-600" />
                          </div>
                          <p className="text-3xl font-bold text-green-900">{summary.positiveCount}</p>
                          <p className="text-xs text-green-600 mt-1">
                            {summary.totalComments ? ((summary.positiveCount / summary.totalComments) * 100).toFixed(1) : '0.0'}%
                          </p>
                        </div>

                        <div className="bg-orange-50 rounded-2xl shadow-sm border border-orange-200 p-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-orange-700">Negative / Neutral</span>
                            <ThumbsDown className="h-5 w-5 text-orange-600" />
                          </div>
                          <p className="text-3xl font-bold text-orange-900">{negativeAndNeutral}</p>
                          <p className="text-xs text-orange-600 mt-1">{negativePercentage}%</p>
                        </div>

                        <div className="bg-red-50 rounded-2xl shadow-sm border border-red-200 p-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-red-700">Problematic</span>
                            <AlertTriangle className="h-5 w-5 text-red-600" />
                          </div>
                          <p className="text-3xl font-bold text-red-900">
                            {summary.hatefulCount + summary.violentCount + summary.spamCount}
                          </p>
                          <p className="text-xs text-red-600 mt-1">
                            {summary.totalComments
                              ? (((summary.hatefulCount + summary.violentCount + summary.spamCount) / summary.totalComments) * 100).toFixed(1)
                              : '0.0'}%
                          </p>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {/* Critical Insights */}
              {summary && (
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl shadow-sm border border-indigo-200 p-6 mb-6">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-6 w-6 text-indigo-600 mt-1" />
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Critical Insights</h3>
                      <p className="text-gray-700 mb-4">{summary.criticalInsights}</p>

                      {summary.topConcerns.length > 0 && (
                        <div className="mb-4">
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Top Concerns:</h4>
                          <ul className="space-y-1">
                            {summary.topConcerns.map((concern, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-red-500 mt-1">•</span>
                                <span>{concern}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {summary.recommendations.length > 0 && (
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900 mb-2">Recommendations:</h4>
                          <ul className="space-y-1">
                            {summary.recommendations.map((rec, idx) => (
                              <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                                <span className="text-green-500 mt-1">✓</span>
                                <span>{rec}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Tabs */}
              <div className="bg-white rounded-t-2xl shadow-sm border border-gray-200 border-b-0">
                <div className="flex gap-1 p-2">
                  {[
                    { id: 'all', label: 'All Comments', count: comments.length },
                    { id: 'positive', label: 'Positive', count: comments.filter(c => c.category === 'positive').length },
                    { id: 'negative', label: 'Negative', count: comments.filter(c => c.category === 'negative' || c.category === 'neutral').length },
                    { id: 'problematic', label: 'Problematic', count: comments.filter(c => ['hateful', 'violent', 'spam'].includes(c.category || '')).length },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as any)}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition ${
                        activeTab === tab.id
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {tab.label} ({tab.count})
                    </button>
                  ))}
                </div>
              </div>

              {/* Comments List */}
              <div className="bg-white rounded-b-2xl shadow-sm border border-gray-200 p-6">
                <div className="space-y-4">
                  {filteredComments.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                      <p>No comments in this category</p>
                    </div>
                  ) : (
                    filteredComments.map(comment => (
                      <div key={comment.id} className="border border-gray-100 rounded-xl p-4 hover:shadow-sm transition">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div className="flex items-center gap-3">
                            {getPlatformIcon(comment.platform)}
                            <div>
                              <p className="font-semibold text-gray-900">{comment.author}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(comment.timestamp).toLocaleDateString()} at {new Date(comment.timestamp).toLocaleTimeString()}
                              </p>
                            </div>
                          </div>
                          {comment.category && (
                            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${getCategoryColor(comment.category)}`}>
                              {getCategoryIcon(comment.category)}
                              {comment.category}
                            </div>
                          )}
                        </div>

                        <p className="text-gray-800 mb-3">{comment.text}</p>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <div className="flex items-center gap-4">
                            <span>On: {comment.contentTitle}</span>
                            {comment.contentUrl && (
                              <a
                                href={comment.contentUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-700"
                              >
                                View content <ExternalLink className="h-3 w-3" />
                              </a>
                            )}
                          </div>
                          {comment.sentiment !== undefined && (
                            <span className="flex items-center gap-2">
                              <span>Sentiment: {(comment.sentiment * 100).toFixed(0)}%</span>
                              {comment.toxicity !== undefined && (
                                <span className={comment.toxicity > 0.5 ? 'text-red-600 font-medium' : ''}>
                                  | Toxicity: {(comment.toxicity * 100).toFixed(0)}%
                                </span>
                              )}
                            </span>
                          )}
                        </div>

                        {comment.reasoning && (
                          <div className="mt-2 pt-2 border-t border-gray-100">
                            <p className="text-xs text-gray-600 italic">{comment.reasoning}</p>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
