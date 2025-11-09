export class YouTubeAPI {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  // Refresh access token using refresh token
  static async refreshToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.YOUTUBE_CLIENT_ID!,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to refresh token: ${error}`);
    }

    return response.json();
  }

  // Get channel information
  async getChannelInfo(channelId?: string): Promise<any> {
    const url = new URL('https://www.googleapis.com/youtube/v3/channels');
    url.searchParams.set('part', 'snippet,statistics,contentDetails');
    if (channelId) {
      url.searchParams.set('id', channelId);
    } else {
      url.searchParams.set('mine', 'true');
    }
    url.searchParams.set('access_token', this.accessToken);

    const response = await fetch(url.toString());
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get channel info: ${error}`);
    }

    return response.json();
  }

  // Get videos from uploads playlist
  async getVideos(uploadsPlaylistId: string, maxResults: number = 50): Promise<any> {
    const url = new URL('https://www.googleapis.com/youtube/v3/playlistItems');
    url.searchParams.set('part', 'snippet,contentDetails');
    url.searchParams.set('playlistId', uploadsPlaylistId);
    url.searchParams.set('maxResults', maxResults.toString());
    url.searchParams.set('access_token', this.accessToken);

    const response = await fetch(url.toString());
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get videos: ${error}`);
    }

    return response.json();
  }

  // Get video details including statistics
  async getVideoDetails(videoIds: string[]): Promise<any> {
    if (videoIds.length === 0) return { items: [] };

    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part', 'snippet,statistics,contentDetails,status');
    url.searchParams.set('id', videoIds.join(','));
    url.searchParams.set('access_token', this.accessToken);

    const response = await fetch(url.toString());
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get video details: ${error}`);
    }

    return response.json();
  }

  // Upload video to YouTube
  async uploadVideo(params: {
    title: string;
    description: string;
    tags?: string[];
    categoryId?: string;
    privacyStatus: 'private' | 'public' | 'unlisted';
    publishAt?: string; // ISO 8601 format for scheduled publishing
    videoBlob: Blob;
    thumbnailBlob?: Blob;
  }): Promise<any> {
    const { title, description, tags = [], categoryId = '22', privacyStatus, publishAt, videoBlob, thumbnailBlob } = params;

    // Step 1: Create video metadata
    const metadata = {
      snippet: {
        title,
        description,
        tags,
        categoryId,
      },
      status: {
        privacyStatus,
        ...(publishAt && { publishAt }),
      },
    };

    // Step 2: Upload video using resumable upload
    const uploadUrl = await this.initiateResumableUpload(metadata);
    const videoResponse = await this.uploadVideoFile(uploadUrl, videoBlob);

    // Step 3: Upload thumbnail if provided
    if (thumbnailBlob && videoResponse.id) {
      try {
        await this.uploadThumbnail(videoResponse.id, thumbnailBlob);
      } catch (error) {
        console.warn('Failed to upload thumbnail:', error);
        // Don't fail the entire upload if thumbnail fails
      }
    }

    return videoResponse;
  }

  // Initiate resumable upload
  private async initiateResumableUpload(metadata: any): Promise<string> {
    const response = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': 'video/*',
      },
      body: JSON.stringify(metadata),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to initiate upload: ${error}`);
    }

    const location = response.headers.get('Location');
    if (!location) {
      throw new Error('No upload URL returned');
    }

    return location;
  }

  // Upload video file
  private async uploadVideoFile(uploadUrl: string, videoBlob: Blob): Promise<any> {
    const response = await fetch(uploadUrl, {
      method: 'PUT',
      headers: {
        'Content-Type': 'video/*',
      },
      body: videoBlob,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload video: ${error}`);
    }

    return response.json();
  }

  // Upload thumbnail
  private async uploadThumbnail(videoId: string, thumbnailBlob: Blob): Promise<void> {
    const response = await fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${videoId}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Content-Type': 'image/*',
      },
      body: thumbnailBlob,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to upload thumbnail: ${error}`);
    }
  }

  // Get analytics data using YouTube Analytics API
  async getAnalytics(params: {
    channelId: string;
    startDate: string; // YYYY-MM-DD
    endDate: string; // YYYY-MM-DD
    metrics: string[]; // e.g., ['views', 'estimatedMinutesWatched', 'subscribersGained']
    dimensions?: string[]; // e.g., ['day', 'video']
    filters?: string; // e.g., 'video==VIDEO_ID'
    sort?: string; // e.g., '-views'
    maxResults?: number;
  }): Promise<any> {
    const { channelId, startDate, endDate, metrics, dimensions, filters, sort, maxResults } = params;

    const url = new URL('https://youtubeanalytics.googleapis.com/v2/reports');
    url.searchParams.set('ids', `channel==${channelId}`);
    url.searchParams.set('startDate', startDate);
    url.searchParams.set('endDate', endDate);
    url.searchParams.set('metrics', metrics.join(','));
    
    if (dimensions) {
      url.searchParams.set('dimensions', dimensions.join(','));
    }
    if (filters) {
      url.searchParams.set('filters', filters);
    }
    if (sort) {
      url.searchParams.set('sort', sort);
    }
    if (maxResults) {
      url.searchParams.set('maxResults', maxResults.toString());
    }

    const response = await fetch(url.toString(), {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Failed to get analytics: ${error}`);
    }

    return response.json();
  }
}
