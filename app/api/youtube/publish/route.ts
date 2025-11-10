import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { YouTubeAccount } from '@/models/YouTubeAccount';
import Content from '@/models/Content';
import { PublishJob } from '@/models/PublishJob';
import { YouTubeAPI } from '@/lib/youtube-api';
import { r2Storage } from '@/lib/r2-storage';

export async function POST(request: NextRequest) {
  try {
    console.log('YouTube Publish API called');
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('YouTube Publish: No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('YouTube Publish: Request body:', body);
    
    let { 
      title, 
      description, 
      tags = [], 
      categoryId = '22', // Default to People & Blogs
      privacyStatus = 'public', 
      scheduledAt, 
      r2Key, 
      thumbnailR2Key,
      contentId 
    } = body;

    // If contentId is provided but other fields are missing, fetch from database
    if (contentId && (!title || !description || !r2Key)) {
      console.log('YouTube Publish: Fetching content data from database');
      await connectDB();
      
      const content = await Content.findById(contentId);
      if (!content) {
        return NextResponse.json({ error: 'Content not found' }, { status: 404 });
      }
      
      // Ensure title is valid (not empty, not just whitespace)
      title = (title || content.title || '').trim();
      if (!title) {
        // Generate title from caption or description
        const fallbackText = (content.caption || content.description || '').trim();
        if (fallbackText) {
          title = fallbackText.substring(0, 60).replace(/\n/g, ' ').trim();
        }
        if (!title) {
          title = 'Untitled Video';
        }
      }
      
      // Ensure description is valid
      description = (description || content.description || content.caption || '').trim();
      if (!description) {
        description = 'No description provided';
      }
      
      // Ensure tags is an array
      tags = Array.isArray(tags) && tags.length > 0 ? tags : (Array.isArray(content.tags) ? content.tags : []);
      
      // Extract r2Key from mediaUrl if not provided
      if (!r2Key && content.mediaUrl) {
        r2Key = content.mediaUrl.replace(/^https?:\/\/[^\/]+\//, '');
      }
      
      console.log('YouTube Publish: Content data fetched:', {
        title,
        description,
        tags,
        r2Key
      });
    }

    // Final validation with additional fallbacks
    title = (title || '').trim();
    if (!title) {
      title = 'Untitled Video';
    }
    
    description = (description || '').trim();
    if (!description) {
      description = 'No description provided';
    }
    
    if (!r2Key) {
      console.log('YouTube Publish: Missing required fields');
      return NextResponse.json({ 
        error: 'Missing required field: r2Key (media file)' 
      }, { status: 400 });
    }
    
    console.log('YouTube Publish: Final validation passed:', {
      title: title.substring(0, 50) + '...',
      description: description.substring(0, 50) + '...',
      r2Key,
      tagsCount: Array.isArray(tags) ? tags.length : 0
    });

    await connectDB();

    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get YouTube account
    const youtubeAccount = await YouTubeAccount.findOne({ 
      userId: user._id, 
      isActive: true 
    });

    if (!youtubeAccount) {
      return NextResponse.json({ 
        error: 'YouTube account not connected' 
      }, { status: 404 });
    }

    // Check if token is expired and refresh if needed
    let accessToken = youtubeAccount.accessToken;
    if (new Date() > youtubeAccount.tokenExpiresAt) {
      try {
        const refreshedTokens = await YouTubeAPI.refreshToken(youtubeAccount.refreshToken);
        accessToken = refreshedTokens.access_token;
        
        // Update stored tokens
        youtubeAccount.accessToken = accessToken;
        youtubeAccount.tokenExpiresAt = new Date(Date.now() + refreshedTokens.expires_in * 1000);
        await youtubeAccount.save();
      } catch (error) {
        console.error('Failed to refresh YouTube token:', error);
        return NextResponse.json({ 
          error: 'YouTube token expired and refresh failed. Please reconnect your account.' 
        }, { status: 401 });
      }
    }

    // Get video file from R2
    const videoBlob = await r2Storage.getFile(r2Key);
    if (!videoBlob) {
      return NextResponse.json({ 
        error: 'Video file not found in storage' 
      }, { status: 404 });
    }

    // Get thumbnail file from R2 if provided
    let thumbnailBlob: Blob | undefined;
    if (thumbnailR2Key) {
      try {
        thumbnailBlob = await r2Storage.getFile(thumbnailR2Key);
      } catch (error) {
        console.warn('Failed to get thumbnail from R2:', error);
        // Continue without thumbnail
      }
    }

    // Initialize YouTube API
    const youtubeAPI = new YouTubeAPI(accessToken);

    // Prepare upload parameters
    const uploadParams = {
      title,
      description,
      tags: Array.isArray(tags) ? tags : [],
      categoryId,
      privacyStatus: privacyStatus as 'private' | 'public' | 'unlisted',
      videoBlob,
      thumbnailBlob,
      ...(scheduledAt && { publishAt: new Date(scheduledAt).toISOString() })
    };

    // Upload video to YouTube
    const uploadResult = await youtubeAPI.uploadVideo(uploadParams);

    // Update content record if contentId provided
    if (contentId) {
      const content = await Content.findById(contentId);
      if (content && content.userId.toString() === user._id.toString()) {
        content.status = 'published';
        content.remote = {
          ...content.remote,
          youtubeVideoId: uploadResult.id,
          youtubeUrl: `https://www.youtube.com/watch?v=${uploadResult.id}`,
        };
        await content.save();
      }
    }

    // Update publish job if exists
    const publishJob = await PublishJob.findOne({ 
      contentId, 
      userId: user._id.toString(), 
      platform: 'youtube' 
    });

    if (publishJob) {
      publishJob.status = 'completed';
      publishJob.result = {
        success: true,
        postId: uploadResult.id,
        response: {
          videoId: uploadResult.id,
          title: uploadResult.snippet?.title,
          publishedAt: uploadResult.snippet?.publishedAt,
          privacyStatus: uploadResult.status?.privacyStatus,
        }
      };
      await publishJob.save();
    }

    // Clean up R2 files after successful upload (optional)
    try {
      await r2Storage.deleteFile(r2Key);
      if (thumbnailR2Key) {
        await r2Storage.deleteFile(thumbnailR2Key);
      }
    } catch (error) {
      console.warn('Failed to clean up R2 files:', error);
      // Don't fail the request if cleanup fails
    }

    return NextResponse.json({
      success: true,
      data: {
        videoId: uploadResult.id,
        title: uploadResult.snippet?.title,
        publishedAt: uploadResult.snippet?.publishedAt,
        privacyStatus: uploadResult.status?.privacyStatus,
        url: `https://www.youtube.com/watch?v=${uploadResult.id}`,
      }
    });

  } catch (error) {
    console.error('YouTube publish error:', error);
    
    // Update publish job with error if exists
    const { contentId } = await request.json().catch(() => ({}));
    if (contentId) {
      try {
        const publishJob = await PublishJob.findOne({ 
          contentId, 
          platform: 'youtube' 
        });
        if (publishJob) {
          publishJob.status = 'failed';
          publishJob.result = {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error'
          };
          await publishJob.save();
        }
      } catch (dbError) {
        console.error('Failed to update publish job:', dbError);
      }
    }

    return NextResponse.json({
      error: 'Failed to publish to YouTube',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
