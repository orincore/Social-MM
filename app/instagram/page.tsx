'use client';

import { useState, useEffect } from 'react';

interface MediaItem {
  id: string;
  caption: string;
  timestamp: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS';
}

interface MediaInsights {
  likes: number | null;
  comments: number | null;
  saved: number | null;
  plays: number | null;
}

interface MediaWithInsights extends MediaItem {
  insights?: MediaInsights;
  loading?: boolean;
  error?: string;
}

interface MediaResponse {
  success: boolean;
  data: MediaItem[];
  total_count: number;
}

interface InsightsResponse {
  mediaId: string;
  insights: MediaInsights;
}

export default function InstagramAnalyticsPage() {
  const [media, setMedia] = useState<MediaWithInsights[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMediaAndInsights();
  }, []);

  const fetchMediaAndInsights = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all media
      const mediaResponse = await fetch('/api/instagram/media');
      
      if (!mediaResponse.ok) {
        const errorData = await mediaResponse.json();
        throw new Error(errorData.error || 'Failed to fetch media');
      }

      const mediaData: MediaResponse = await mediaResponse.json();
      
      if (!mediaData.success || !mediaData.data) {
        throw new Error('Invalid media response');
      }

      // Initialize media with loading state for insights
      const mediaWithLoading: MediaWithInsights[] = mediaData.data.map(item => ({
        ...item,
        loading: true,
      }));

      setMedia(mediaWithLoading);

      // Fetch insights for each media item
      const insightsPromises = mediaData.data.map(async (item, index) => {
        try {
          const insightsResponse = await fetch(`/api/instagram/${item.id}`);
          
          if (!insightsResponse.ok) {
            const errorData = await insightsResponse.json();
            throw new Error(errorData.error || 'Failed to fetch insights');
          }

          const insightsData: InsightsResponse = await insightsResponse.json();
          
          // Update the specific media item with insights
          setMedia(prevMedia => 
            prevMedia.map((mediaItem, i) => 
              i === index 
                ? { 
                    ...mediaItem, 
                    insights: insightsData.insights,
                    loading: false,
                    error: undefined
                  }
                : mediaItem
            )
          );
        } catch (error) {
          // Update the specific media item with error
          setMedia(prevMedia => 
            prevMedia.map((mediaItem, i) => 
              i === index 
                ? { 
                    ...mediaItem, 
                    loading: false,
                    error: error instanceof Error ? error.message : 'Failed to load insights'
                  }
                : mediaItem
            )
          );
        }
      });

      // Wait for all insights to complete
      await Promise.allSettled(insightsPromises);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncateCaption = (caption: string, maxLength: number = 50) => {
    if (!caption) return 'No caption';
    return caption.length > maxLength 
      ? caption.substring(0, maxLength) + '...' 
      : caption;
  };

  const formatNumber = (num: number | null) => {
    if (num === null) return 'N/A';
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  if (loading && media.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Instagram Analytics</h1>
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">Loading media...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Instagram Analytics</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex items-center">
              <div className="text-red-600 mr-3">⚠️</div>
              <div>
                <h3 className="text-red-800 font-medium">Error loading data</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={fetchMediaAndInsights}
              className="mt-4 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Instagram Analytics</h1>
          <button
            onClick={fetchMediaAndInsights}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Refresh
          </button>
        </div>

        {media.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No media found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {media.map((item) => (
              <div key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {item.media_type}
                    </span>
                    <span className="text-sm text-gray-500">
                      {formatDate(item.timestamp)}
                    </span>
                  </div>

                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    {truncateCaption(item.caption)}
                  </h3>

                  {item.loading ? (
                    <div className="flex items-center justify-center py-8">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      <span className="ml-2 text-sm text-gray-600">Loading insights...</span>
                    </div>
                  ) : item.error ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-sm text-red-700">{item.error}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-4">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatNumber(item.insights?.likes ?? null)}
                        </div>
                        <div className="text-sm text-gray-600">Likes</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatNumber(item.insights?.comments ?? null)}
                        </div>
                        <div className="text-sm text-gray-600">Comments</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatNumber(item.insights?.saved ?? null)}
                        </div>
                        <div className="text-sm text-gray-600">Saved</div>
                      </div>
                      <div className="text-center">
                        <div className="text-2xl font-bold text-gray-900">
                          {formatNumber(item.insights?.plays ?? null)}
                        </div>
                        <div className="text-sm text-gray-600">Plays</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
