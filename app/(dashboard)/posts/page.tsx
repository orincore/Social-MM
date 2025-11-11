'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Filter, RefreshCw, Eye, Clock, CheckCircle, XCircle, AlertCircle, Play } from 'lucide-react';
import { format } from 'date-fns';

interface PublishJob {
  _id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: string;
}

interface Post {
  _id: string;
  title?: string;
  caption?: string;
  description?: string;
  platform: 'instagram' | 'youtube';
  status: 'draft' | 'scheduled' | 'published' | 'failed';
  scheduledAt?: string;
  publishedAt?: string;
  createdAt: string;
  mediaUrl?: string;
  publishJobs: PublishJob[];
  lastPublishAttempt?: string;
  publishStatus: string;
  errorMessage?: string;
}

interface PostsResponse {
  success: boolean;
  data?: {
    posts: Post[];
    pagination: {
      currentPage: number;
      totalPages: number;
      totalCount: number;
      hasNextPage: boolean;
      hasPrevPage: boolean;
      limit: number;
    };
  };
  message?: string;
  error?: string;
}

const StatusBadge = ({ status, publishStatus }: { status: string; publishStatus?: string }) => {
  const getStatusConfig = () => {
    if (publishStatus === 'failed' || status === 'failed') {
      return { variant: 'destructive' as const, icon: XCircle, text: 'Failed' };
    }
    if (publishStatus === 'completed' || status === 'published') {
      return { variant: 'default' as const, icon: CheckCircle, text: 'Published' };
    }
    if (publishStatus === 'processing' || status === 'processing') {
      return { variant: 'secondary' as const, icon: RefreshCw, text: 'Processing' };
    }
    if (status === 'scheduled') {
      return { variant: 'outline' as const, icon: Clock, text: 'Scheduled' };
    }
    return { variant: 'secondary' as const, icon: AlertCircle, text: 'Draft' };
  };

  const { variant, icon: Icon, text } = getStatusConfig();

  return (
    <Badge variant={variant} className="flex items-center gap-1">
      <Icon className="w-3 h-3" />
      {text}
    </Badge>
  );
};

const PlatformBadge = ({ platform }: { platform: string }) => {
  const config = {
    instagram: { 
      bg: 'bg-gradient-to-r from-purple-500 to-pink-500', 
      text: 'Instagram' 
    },
    youtube: { 
      bg: 'bg-red-500', 
      text: 'YouTube' 
    }
  };

  const { bg, text } = config[platform as keyof typeof config] || { bg: 'bg-gray-500', text: platform };

  return (
    <Badge className={`${bg} text-white border-0`}>
      {text}
    </Badge>
  );
};

export default function PostsHistoryPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 20
  });

  // Filters
  const [filters, setFilters] = useState({
    platform: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    search: ''
  });

  const fetchPosts = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(filters.platform !== 'all' && { platform: filters.platform }),
        ...(filters.status !== 'all' && { status: filters.status }),
        ...(filters.dateFrom && { dateFrom: filters.dateFrom }),
        ...(filters.dateTo && { dateTo: filters.dateTo })
      });

      // First, try the direct API endpoint
      let response = await fetch(`/api/posts?${params}`);
      
      // If that fails, try the history endpoint (for backward compatibility)
      if (!response.ok) {
        response = await fetch(`/api/posts/history?${params}`);
      }
      
      const data: PostsResponse = await response.json();

      if (data.success && data.data) {
        // Handle both response formats for backward compatibility
        if (Array.isArray(data.data)) {
          setPosts(data.data);
          setPagination({
            currentPage: 1,
            totalPages: 1,
            totalCount: data.data.length,
            hasNextPage: false,
            hasPrevPage: false,
            limit: 20
          });
        } else {
          setPosts(data.data.posts || []);
          setPagination(data.data.pagination || {
            currentPage: 1,
            totalPages: 1,
            totalCount: 0,
            hasNextPage: false,
            hasPrevPage: false,
            limit: 20
          });
        }
      } else {
        console.error('Failed to fetch posts:', data.message || data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [filters]);

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const clearFilters = () => {
    setFilters({
      platform: 'all',
      status: 'all',
      dateFrom: '',
      dateTo: '',
      search: ''
    });
  };

  const retryPost = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/retry`, {
        method: 'POST'
      });
      
      if (response.ok) {
        // Refresh the posts list
        fetchPosts(pagination.currentPage);
      }
    } catch (error) {
      console.error('Error retrying post:', error);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Posts History</h1>
          <p className="text-muted-foreground">
            View and manage all your social media posts
          </p>
        </div>
        <Button onClick={() => fetchPosts(pagination.currentPage)} disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Platform</label>
              <Select value={filters.platform} onValueChange={(value) => handleFilterChange('platform', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Platforms</SelectItem>
                  <SelectItem value="instagram">Instagram</SelectItem>
                  <SelectItem value="youtube">YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Status</label>
              <Select value={filters.status} onValueChange={(value) => handleFilterChange('status', value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="scheduled">Scheduled</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">From Date</label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              />
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">To Date</label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-between items-center mt-4">
            <div className="text-sm text-muted-foreground">
              Showing {posts.length} of {pagination.totalCount} posts
            </div>
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <div className="space-y-4">
        {loading ? (
          <div className="flex justify-center items-center py-12">
            <RefreshCw className="w-8 h-8 animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">No posts found matching your criteria.</p>
            </CardContent>
          </Card>
        ) : (
          posts.map((post) => (
            <Card key={post._id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <PlatformBadge platform={post.platform} />
                      <StatusBadge status={post.status} publishStatus={post.publishStatus} />
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-2">
                      {post.title || post.caption?.substring(0, 50) + '...' || 'Untitled Post'}
                    </h3>
                    
                    {post.caption && (
                      <p className="text-muted-foreground text-sm mb-2 line-clamp-2">
                        {post.caption}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {post.publishStatus === 'failed' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => retryPost(post._id)}
                      >
                        <Play className="w-4 h-4 mr-1" />
                        Retry
                      </Button>
                    )}
                    <Button size="sm" variant="ghost">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Created:</span>
                    <p className="text-muted-foreground">
                      {format(new Date(post.createdAt), 'MMM dd, yyyy HH:mm')}
                    </p>
                  </div>

                  {post.scheduledAt && (
                    <div>
                      <span className="font-medium">Scheduled:</span>
                      <p className="text-muted-foreground">
                        {format(new Date(post.scheduledAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  )}

                  {post.publishedAt && (
                    <div>
                      <span className="font-medium">Published:</span>
                      <p className="text-muted-foreground">
                        {format(new Date(post.publishedAt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  )}

                  {post.lastPublishAttempt && (
                    <div>
                      <span className="font-medium">Last Attempt:</span>
                      <p className="text-muted-foreground">
                        {format(new Date(post.lastPublishAttempt), 'MMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                  )}
                </div>

                {post.errorMessage && (
                  <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-700 text-sm font-medium">Error:</p>
                    <p className="text-red-600 text-sm">{post.errorMessage}</p>
                  </div>
                )}

                {post.publishJobs.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-medium mb-2">Publish History:</p>
                    <div className="space-y-1">
                      {post.publishJobs.slice(0, 3).map((job) => (
                        <div key={job._id} className="flex items-center justify-between text-xs bg-gray-50 p-2 rounded">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={job.status} />
                            <span>{format(new Date(job.createdAt), 'MMM dd, HH:mm')}</span>
                          </div>
                          {job.error && (
                            <span className="text-red-600 truncate max-w-xs">
                              {job.error}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2">
          <Button
            variant="outline"
            disabled={!pagination.hasPrevPage}
            onClick={() => fetchPosts(pagination.currentPage - 1)}
          >
            Previous
          </Button>
          
          <span className="text-sm text-muted-foreground">
            Page {pagination.currentPage} of {pagination.totalPages}
          </span>
          
          <Button
            variant="outline"
            disabled={!pagination.hasNextPage}
            onClick={() => fetchPosts(pagination.currentPage + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
