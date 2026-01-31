// Instagram Graph API integration
// Note: For publishing content, we need to use Facebook Graph API with Instagram Business Account
const FACEBOOK_API_BASE = 'https://graph.facebook.com/v18.0';
const INSTAGRAM_API_BASE = 'https://graph.instagram.com';

async function resolveInstagramVideoUrl(videoUrl: string): Promise<string> {
  const r2PublicUrl = process.env.R2_PUBLIC_URL?.replace(/\/$/, '');

  if (!r2PublicUrl || !videoUrl.startsWith(`${r2PublicUrl}/`)) {
    return videoUrl;
  }

  try {
    const headResponse = await fetch(videoUrl, { method: 'HEAD' });
    if (headResponse.ok) {
      return videoUrl;
    }

    console.warn('Direct R2 URL HEAD request failed, falling back to signed URL', {
      status: headResponse.status,
      statusText: headResponse.statusText,
    });
  } catch (error) {
    console.warn('Direct R2 URL HEAD request threw error, falling back to signed URL', error);
  }

  const r2Key = videoUrl.slice(r2PublicUrl.length + 1);
  if (!r2Key) {
    throw new Error('Unable to derive R2 key from media URL');
  }

  const { r2Storage } = await import('@/lib/r2-storage');
  return r2Storage.getSignedDownloadUrl(r2Key, 3600); // give Instagram 1 hour to download
}

export interface InstagramAccount {
  id: string;
  username: string;
  account_type: 'PERSONAL' | 'BUSINESS';
  media_count: number;
  followers_count: number;
  follows_count: number;
  profile_picture_url: string;
  biography: string;
  website: string;
}

export interface InstagramMedia {
  id: string;
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM' | 'REELS';
  media_url: string;
  thumbnail_url?: string;
  permalink: string;
  caption: string;
  timestamp: string;
  like_count: number;
  comments_count: number;
  insights?: {
    impressions: number;
    reach: number;
    engagement: number;
    saves: number;
    shares: number;
  };
}

export interface InstagramInsights {
  impressions: number;
  reach: number;
  profile_views: number;
  website_clicks: number;
  follower_count: number;
  email_contacts: number;
  phone_call_clicks: number;
  text_message_clicks: number;
  get_directions_clicks: number;
}

export class InstagramAPI {
  private accessToken: string;

  constructor(accessToken: string) {
    this.accessToken = accessToken;
  }

  // Get Instagram Business Account
  async getInstagramAccount(): Promise<InstagramAccount> {
    try {
      const response = await fetch(
        `${INSTAGRAM_API_BASE}/me?fields=id,username,account_type,media_count,followers_count,follows_count,profile_picture_url,biography,website&access_token=${this.accessToken}`
      );
      
      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching Instagram account:', error);
      throw error;
    }
  }

  // Get Instagram Media (posts, reels, videos)
  async getMedia(limit: number = 25): Promise<InstagramMedia[]> {
    try {
      const response = await fetch(
        `${INSTAGRAM_API_BASE}/me/media?fields=id,media_type,media_url,thumbnail_url,permalink,caption,timestamp,like_count,comments_count&limit=${limit}&access_token=${this.accessToken}`
      );
      
      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching Instagram media:', error);
      throw error;
    }
  }

  // Get Media Insights (for business accounts)
  async getMediaInsights(mediaId: string): Promise<any> {
    try {
      const response = await fetch(
        `${INSTAGRAM_API_BASE}/${mediaId}/insights?metric=impressions,reach,engagement,saves,video_views&access_token=${this.accessToken}`
      );
      
      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.status}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Error fetching media insights:', error);
      throw error;
    }
  }

  // Get Account Insights
  async getAccountInsights(period: 'day' | 'week' | 'days_28' = 'week'): Promise<InstagramInsights> {
    try {
      const metrics = [
        'impressions',
        'reach',
        'profile_views',
        'website_clicks',
        'follower_count',
        'email_contacts',
        'phone_call_clicks',
        'text_message_clicks',
        'get_directions_clicks'
      ];

      const response = await fetch(
        `${INSTAGRAM_API_BASE}/me/insights?metric=${metrics.join(',')}&period=${period}&access_token=${this.accessToken}`
      );
      
      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Transform the response into a more usable format
      const insights: any = {};
      data.data?.forEach((metric: any) => {
        insights[metric.name] = metric.values[0]?.value || 0;
      });
      
      return insights;
    } catch (error) {
      console.error('Error fetching account insights:', error);
      throw error;
    }
  }

  // Post Image to Instagram (requires Instagram Business Account)
  async postImage(imageUrl: string, caption: string, instagramAccountId?: string): Promise<string> {
    try {
      // First, get the Instagram Business Account ID if not provided
      if (!instagramAccountId) {
        const accountResponse = await fetch(
          `${FACEBOOK_API_BASE}/me/accounts?access_token=${this.accessToken}`
        );
        
        if (!accountResponse.ok) {
          throw new Error(`Facebook API error: ${accountResponse.status}`);
        }
        
        const accountData = await accountResponse.json();
        const page = accountData.data?.[0];
        
        if (!page) {
          throw new Error('No Facebook page found. Instagram Business Account requires a connected Facebook page.');
        }
        
        // Get Instagram Business Account from the page
        const igAccountResponse = await fetch(
          `${FACEBOOK_API_BASE}/${page.id}?fields=instagram_business_account&access_token=${this.accessToken}`
        );
        
        const igAccountData = await igAccountResponse.json();
        instagramAccountId = igAccountData.instagram_business_account?.id;
        
        if (!instagramAccountId) {
          throw new Error('No Instagram Business Account found. Please connect an Instagram Business Account to your Facebook page.');
        }
      }

      // Step 1: Create media object using Facebook Graph API
      const createResponse = await fetch(
        `${FACEBOOK_API_BASE}/${instagramAccountId}/media`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            image_url: imageUrl,
            caption: caption,
            access_token: this.accessToken,
          }),
        }
      );

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Instagram API error: ${createResponse.status} - ${errorText}`);
      }

      const createData = await createResponse.json();
      const creationId = createData.id;

      // Step 2: Publish the media
      const publishResponse = await fetch(
        `${FACEBOOK_API_BASE}/${instagramAccountId}/media_publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            creation_id: creationId,
            access_token: this.accessToken,
          }),
        }
      );

      if (!publishResponse.ok) {
        const errorText = await publishResponse.text();
        throw new Error(`Instagram API error: ${publishResponse.status} - ${errorText}`);
      }

      const publishData = await publishResponse.json();
      return publishData.id;
    } catch (error) {
      console.error('Error posting image to Instagram:', error);
      throw error;
    }
  }

  // Create Instagram video container without waiting for processing
  // Returns the creation ID for later polling
  async createVideoContainer(
    videoUrl: string,
    caption: string,
    options: {
      isReel?: boolean;
      instagramAccountId?: string;
      shareToFeed?: boolean;
      thumbOffset?: number;
    } = {}
  ): Promise<string> {
    try {
      const {
        isReel = true,
        instagramAccountId: providedInstagramAccountId,
        shareToFeed = true,
        thumbOffset = 0,
      } = options;

      let instagramAccountId = providedInstagramAccountId;

      const rawThumbOffset = Number(thumbOffset);
      const normalizedThumbOffset = Number.isFinite(rawThumbOffset)
        ? Math.max(0, Math.min(60, Math.floor(rawThumbOffset)))
        : 0;

      // Get the Instagram Business Account ID if not provided
      if (!instagramAccountId) {
        const accountResponse = await fetch(
          `${FACEBOOK_API_BASE}/me/accounts?access_token=${this.accessToken}`
        );
        
        if (!accountResponse.ok) {
          throw new Error(`Facebook API error: ${accountResponse.status}`);
        }
        
        const accountData = await accountResponse.json();
        const pages = accountData.data;
        
        if (!pages || pages.length === 0) {
          throw new Error('No Facebook pages found');
        }
        
        const page = pages[0];
        const igAccountResponse = await fetch(
          `${FACEBOOK_API_BASE}/${page.id}?fields=instagram_business_account&access_token=${this.accessToken}`
        );
        
        const igAccountData = await igAccountResponse.json();
        instagramAccountId = igAccountData.instagram_business_account?.id;
        
        if (!instagramAccountId) {
          throw new Error('No Instagram Business Account found');
        }
      }

      // Resolve video URL (use signed URL if public URL fails)
      const resolvedVideoUrl = await resolveInstagramVideoUrl(videoUrl);
      
      console.log('Creating Instagram media container...', {
        mediaType: isReel ? 'REELS' : 'VIDEO',
        shareToFeed,
        thumbOffset: normalizedThumbOffset,
        originalUrl: videoUrl,
        resolvedUrl: resolvedVideoUrl,
        urlType: resolvedVideoUrl.includes('X-Amz-') ? 'signed' : 'public'
      });

      // Create media container
      const params: Record<string, string> = {
        video_url: resolvedVideoUrl,
        caption: caption,
        media_type: isReel ? 'REELS' : 'VIDEO',
        share_to_feed: shareToFeed.toString(),
        access_token: this.accessToken,
      };

      if (normalizedThumbOffset > 0) {
        params.thumb_offset = normalizedThumbOffset.toString();
      }

      const createResponse = await fetch(
        `${FACEBOOK_API_BASE}/${instagramAccountId}/media`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams(params),
        }
      );

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Instagram API error: ${createResponse.status} - ${errorText}`);
      }

      const createData = await createResponse.json();
      const creationId = createData.id;

      if (!creationId) {
        throw new Error('Failed to create Instagram media container');
      }

      console.log('Instagram container created:', creationId);
      return creationId;
    } catch (error) {
      console.error('Error creating Instagram container:', error);
      throw error;
    }
  }

  // Post Video/Reel to Instagram (requires Instagram Business Account)
  // Default to Reel since we're only posting Reels and Shorts
  async postVideo(
    videoUrl: string,
    caption: string,
    options: {
      isReel?: boolean;
      instagramAccountId?: string;
      shareToFeed?: boolean;
      thumbOffset?: number;
    } = {}
  ): Promise<string> {
    try {
      const {
        isReel = true,
        instagramAccountId: providedInstagramAccountId,
        shareToFeed = true,
        thumbOffset = 0,
      } = options;

      let instagramAccountId = providedInstagramAccountId;

      const rawThumbOffset = Number(thumbOffset);
      const normalizedThumbOffset = Number.isFinite(rawThumbOffset)
        ? Math.max(0, Math.min(60, Math.floor(rawThumbOffset)))
        : 0;

      // First, get the Instagram Business Account ID if not provided
      if (!instagramAccountId) {
        const accountResponse = await fetch(
          `${FACEBOOK_API_BASE}/me/accounts?access_token=${this.accessToken}`
        );
        
        if (!accountResponse.ok) {
          throw new Error(`Facebook API error: ${accountResponse.status}`);
        }
        
        const accountData = await accountResponse.json();
        const page = accountData.data?.[0];
        
        if (!page) {
          throw new Error('No Facebook page found. Instagram Business Account requires a connected Facebook page.');
        }
        
        // Get Instagram Business Account from the page
        const igAccountResponse = await fetch(
          `${FACEBOOK_API_BASE}/${page.id}?fields=instagram_business_account&access_token=${this.accessToken}`
        );
        
        const igAccountData = await igAccountResponse.json();
        instagramAccountId = igAccountData.instagram_business_account?.id;
        
        if (!instagramAccountId) {
          throw new Error('No Instagram Business Account found. Please connect an Instagram Business Account to your Facebook page.');
        }
      }

      const mediaType = isReel ? 'REELS' : 'VIDEO';
      console.log('Creating Instagram media container...', {
        mediaType,
        shareToFeed,
        thumbOffset: normalizedThumbOffset,
      });
      const instagramVideoUrl = await resolveInstagramVideoUrl(videoUrl);

      const payload: Record<string, any> = {
        media_type: mediaType,
        caption,
        video_url: instagramVideoUrl,
        access_token: this.accessToken,
      };

      if (isReel) {
        payload.share_to_feed = shareToFeed;
        payload.thumb_offset = normalizedThumbOffset;
      }

      const createResponse = await fetch(
        `${FACEBOOK_API_BASE}/${instagramAccountId}/media`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams(payload),
        }
      );

      if (!createResponse.ok) {
        const errorText = await createResponse.text();
        throw new Error(`Instagram API error: ${createResponse.status} - ${errorText}`);
      }

      const createData = await createResponse.json();
      const creationId = createData.id;

      if (!creationId) {
        console.error('Unexpected media creation response:', createData);
        throw new Error('Failed to create Instagram media container.');
      }

      // Step 2: Wait for media to be ready and then publish
      console.log('Waiting for media to be ready for publishing...');
      
      // Poll the media status until it's ready (max 90 seconds)
      const maxAttempts = 18; // 18 attempts * 5 seconds = 90 seconds max
      let attempt = 0;
      let isReady = false;
      
      while (attempt < maxAttempts && !isReady) {
        // Wait 5 seconds before checking
        await new Promise(resolve => setTimeout(resolve, 5000));
        attempt++;
        
        console.log(`Checking media status (attempt ${attempt}/${maxAttempts})...`);
        
        // Check if media is ready
        const statusResponse = await fetch(
          `${FACEBOOK_API_BASE}/${creationId}?fields=status_code&access_token=${this.accessToken}`
        );
        
        if (statusResponse.ok) {
          const statusData = await statusResponse.json();
          console.log('Media status:', statusData);
          
          // Status codes: EXPIRED, ERROR, FINISHED, IN_PROGRESS, PUBLISHED
          if (statusData.status_code === 'FINISHED' || statusData.status_code === 'PUBLISHED') {
            isReady = true;
            break;
          } else if (statusData.status_code === 'ERROR' || statusData.status_code === 'EXPIRED') {
            // Get more detailed error information
            const errorResponse = await fetch(
              `${FACEBOOK_API_BASE}/${creationId}?fields=status_code,status&access_token=${this.accessToken}`
            );
            
            let errorDetails = '';
            let specificError = 'Video format incompatible with Instagram Reels';
            
            if (errorResponse.ok) {
              const errorData = await errorResponse.json();
              console.log('Detailed error info:', errorData);
              errorDetails = errorData.status ? ` - ${errorData.status}` : '';
              
              // Check for specific error codes
              if (errorDetails.includes('2207076') || errorDetails.includes('codec') || errorDetails.includes('format')) {
                specificError = 'Video codec/format issue. Instagram requires: MP4 container, H.264/AVC video codec (not H.265/HEVC), AAC audio codec, vertical 9:16 aspect ratio, 3-60 seconds duration';
              } else if (errorDetails.includes('aspect') || errorDetails.includes('ratio') || errorDetails.includes('dimension')) {
                specificError = 'Video aspect ratio issue. Instagram Reels require vertical 9:16 aspect ratio (e.g., 1080x1920)';
              } else if (errorDetails.includes('duration') || errorDetails.includes('length')) {
                specificError = 'Video duration issue. Instagram Reels must be between 3 and 60 seconds';
              }
            }
            
            throw new Error(`${specificError}${errorDetails}. Please re-encode your video with these exact specs: MP4 format, H.264 video codec, AAC audio, 9:16 vertical, 3-60s duration.`);
          }
        }
      }

      if (!isReady) {
        throw new Error('Instagram media processing timed out before reaching FINISHED status.');
      }

      // Step 3: Publish the media
      const publishResponse = await fetch(
        `${FACEBOOK_API_BASE}/${instagramAccountId}/media_publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: new URLSearchParams({
            creation_id: creationId,
            access_token: this.accessToken,
          }),
        }
      );

      if (!publishResponse.ok) {
        const errorText = await publishResponse.text();
        throw new Error(`Instagram API error: ${publishResponse.status} - ${errorText}`);
      }

      const publishData = await publishResponse.json();
      console.log('Successfully published to Instagram with ID:', publishData.id);
      return publishData.id;
    } catch (error) {
      console.error('Error posting video to Instagram:', error);
      throw error;
    }
  }

  // Get Comments on a Media
  async getComments(mediaId: string): Promise<any[]> {
    try {
      const response = await fetch(
        `${INSTAGRAM_API_BASE}/${mediaId}/comments?fields=id,text,timestamp,username,like_count&access_token=${this.accessToken}`
      );
      
      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.status}`);
      }
      
      const data = await response.json();
      return data.data || [];
    } catch (error) {
      console.error('Error fetching comments:', error);
      throw error;
    }
  }

  // Reply to a Comment
  async replyToComment(commentId: string, message: string): Promise<string> {
    try {
      const response = await fetch(
        `${INSTAGRAM_API_BASE}/${commentId}/replies`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            message: message,
            access_token: this.accessToken,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`Instagram API error: ${response.status}`);
      }

      const data = await response.json();
      return data.id;
    } catch (error) {
      console.error('Error replying to comment:', error);
      throw error;
    }
  }
}
