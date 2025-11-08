// Instagram Graph API integration
const INSTAGRAM_API_BASE = 'https://graph.instagram.com';
const FACEBOOK_API_BASE = 'https://graph.facebook.com/v18.0';

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

  // Post Image to Instagram
  async postImage(imageUrl: string, caption: string): Promise<string> {
    try {
      // Step 1: Create media object
      const createResponse = await fetch(
        `${INSTAGRAM_API_BASE}/me/media`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            image_url: imageUrl,
            caption: caption,
            access_token: this.accessToken,
          }),
        }
      );

      if (!createResponse.ok) {
        throw new Error(`Instagram API error: ${createResponse.status}`);
      }

      const createData = await createResponse.json();
      const creationId = createData.id;

      // Step 2: Publish the media
      const publishResponse = await fetch(
        `${INSTAGRAM_API_BASE}/me/media_publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creation_id: creationId,
            access_token: this.accessToken,
          }),
        }
      );

      if (!publishResponse.ok) {
        throw new Error(`Instagram API error: ${publishResponse.status}`);
      }

      const publishData = await publishResponse.json();
      return publishData.id;
    } catch (error) {
      console.error('Error posting image to Instagram:', error);
      throw error;
    }
  }

  // Post Video/Reel to Instagram
  async postVideo(videoUrl: string, caption: string, isReel: boolean = false): Promise<string> {
    try {
      // Step 1: Create media object
      const createResponse = await fetch(
        `${INSTAGRAM_API_BASE}/me/media`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            video_url: videoUrl,
            caption: caption,
            media_type: isReel ? 'REELS' : 'VIDEO',
            access_token: this.accessToken,
          }),
        }
      );

      if (!createResponse.ok) {
        throw new Error(`Instagram API error: ${createResponse.status}`);
      }

      const createData = await createResponse.json();
      const creationId = createData.id;

      // Step 2: Publish the media
      const publishResponse = await fetch(
        `${INSTAGRAM_API_BASE}/me/media_publish`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            creation_id: creationId,
            access_token: this.accessToken,
          }),
        }
      );

      if (!publishResponse.ok) {
        throw new Error(`Instagram API error: ${publishResponse.status}`);
      }

      const publishData = await publishResponse.json();
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
