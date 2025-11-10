import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Content from '@/models/Content';
import { PublishJob } from '@/models/PublishJob';
import { InstagramAccount } from '@/models/InstagramAccount';
import { YouTubeAccount } from '@/models/YouTubeAccount';
import { InstagramAPI } from '@/lib/instagram-api';
import { YouTubeAPI } from '@/lib/youtube-api';
import { r2Storage } from '@/lib/r2-storage';
import User from '@/models/User';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('Authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    if (!authHeader || authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { currentTime, source } = body;

    console.log(`Processing scheduled posts at ${currentTime} from ${source}`);

    await connectDB();

    // Find posts that are scheduled and due for publishing
    const now = new Date(currentTime);
    const dueDate = new Date(now.getTime() + 60000); // 1 minute buffer

    const scheduledPosts = await Content.find({
      status: 'scheduled',
      scheduledAt: { $lte: dueDate }
    }).limit(50); // Process max 50 posts per run

    console.log(`Found ${scheduledPosts.length} posts due for publishing`);

    let processedCount = 0;
    let errorCount = 0;

    for (const post of scheduledPosts) {
      try {
        // Update status to processing
        await Content.findByIdAndUpdate(post._id, {
          status: 'processing',
          updatedAt: new Date()
        });

        let publishedPostId: string;
        
        if (post.platform === 'instagram') {
          // Get user with Instagram tokens
          const user = await User.findById(post.userId);
          if (!user || !user.instagram?.connected || !user.instagram?.accessToken) {
            throw new Error('Instagram account not connected or tokens missing');
          }

          // Check if token is expired (Instagram tokens don't refresh automatically)
          if (user.instagram.tokenExpiresAt && new Date() > user.instagram.tokenExpiresAt) {
            throw new Error('Instagram token expired. Please reconnect your account.');
          }

          // Initialize Instagram API
          const instagramAPI = new InstagramAPI(user.instagram.accessToken);

          // Publish Instagram Reel
          console.log('Publishing scheduled Instagram Reel:', {
            mediaUrl: post.mediaUrl,
            caption: post.caption?.substring(0, 50) + '...',
            shareToFeed: post.instagramOptions?.shareToFeed,
            thumbOffset: post.instagramOptions?.thumbOffset
          });
          
          // For Instagram, only create the container - don't wait for processing
          // This prevents Vercel timeout (Instagram processing takes 30-60s)
          const creationId = await instagramAPI.createVideoContainer(post.mediaUrl, post.caption, {
            isReel: true,
            instagramAccountId: user.instagram.instagramId,
            shareToFeed: post.instagramOptions?.shareToFeed ?? true,
            thumbOffset: post.instagramOptions?.thumbOffset ?? 0
          });
          
          // Mark as processing and store the creation ID
          await Content.findByIdAndUpdate(post._id, {
            status: 'processing',
            'remote.instagramCreationId': creationId,
            updatedAt: new Date()
          });
          
          console.log(`Instagram container created: ${creationId}. Will poll for completion separately.`);
          
          // Skip the rest of the processing for Instagram
          // A separate polling mechanism will complete the publish
          processedCount++;
          continue;
        } else if (post.platform === 'youtube') {
          // Get user with YouTube tokens
          const user = await User.findById(post.userId);
          
          console.log('YouTube publish check:', {
            userId: post.userId,
            userFound: !!user,
            youtubeConnected: user?.youtube?.connected,
            hasAccessToken: !!user?.youtube?.accessToken,
            hasRefreshToken: !!user?.youtube?.refreshToken,
            tokenExpiry: user?.youtube?.tokenExpiresAt
          });

          if (!user || !user.youtube?.connected || !user.youtube?.accessToken) {
            throw new Error('YouTube account not connected or tokens missing');
          }

          // Check if token is expired and refresh if needed
          let accessToken = user.youtube.accessToken;
          if (new Date() > user.youtube.tokenExpiresAt) {
            try {
              const refreshedTokens = await YouTubeAPI.refreshToken(user.youtube.refreshToken);
              accessToken = refreshedTokens.access_token;
              
              // Update stored tokens in User profile
              user.youtube.accessToken = accessToken;
              user.youtube.tokenExpiresAt = new Date(Date.now() + refreshedTokens.expires_in * 1000);
              await user.save();
            } catch (error) {
              throw new Error('YouTube token expired and refresh failed');
            }
          }

          // Get video file from R2
          const r2Key = post.mediaUrl ? post.mediaUrl.replace(/^https?:\/\/[^\/]+\//, '') : '';
          const videoBlob = await r2Storage.getFile(r2Key);
          if (!videoBlob) {
            throw new Error('Video file not found in storage');
          }

          // Initialize YouTube API
          const youtubeAPI = new YouTubeAPI(accessToken);

          console.log('Publishing scheduled YouTube video:', {
            title: post.title,
            description: post.description?.substring(0, 50) + '...',
            tags: post.tags
          });

          // Upload video to YouTube
          const uploadResult = await youtubeAPI.uploadVideo({
            title: post.title || 'Untitled Video',
            description: post.description || post.caption || 'No description',
            tags: post.tags || [],
            categoryId: '22', // People & Blogs
            privacyStatus: post.privacyStatus || 'public',
            videoBlob
          });

          publishedPostId = uploadResult.id;

          // Clean up R2 file after successful upload
          try {
            await r2Storage.deleteFile(r2Key);
          } catch (error) {
            console.warn('Failed to clean up R2 file:', error);
          }
        } else {
          throw new Error(`Unsupported platform: ${post.platform}`);
        }

        // Update content status to published
        const updateData: any = {
          status: 'published',
          publishedAt: new Date(),
          publishedPostId,
          updatedAt: new Date()
        };

        if (post.platform === 'instagram') {
          updateData['remote.mediaId'] = publishedPostId;
        } else if (post.platform === 'youtube') {
          updateData['remote.youtubeVideoId'] = publishedPostId;
          updateData['remote.youtubeUrl'] = `https://www.youtube.com/watch?v=${publishedPostId}`;
        }

        await Content.findByIdAndUpdate(post._id, updateData);

        // Create successful publish job record
        const jobMetadata: any = {
          processedBy: 'cron',
          source
        };

        if (post.platform === 'instagram') {
          jobMetadata.mediaType = 'VIDEO';
          jobMetadata.isReel = true;
          jobMetadata.shareToFeed = post.instagramOptions?.shareToFeed ?? true;
          jobMetadata.thumbOffset = post.instagramOptions?.thumbOffset ?? 0;
        } else if (post.platform === 'youtube') {
          jobMetadata.title = post.title;
          jobMetadata.description = post.description;
          jobMetadata.tags = post.tags;
          jobMetadata.privacyStatus = post.privacyStatus;
        }

        await PublishJob.updateOne(
          {
            contentId: post._id,
            platform: post.platform
          },
          {
            $set: {
              userId: post.userId,
              status: 'completed',
              scheduledAt: post.scheduledAt,
              completedAt: new Date(),
              result: {
                success: true,
                postId: publishedPostId
              },
              metadata: jobMetadata
            }
          },
          { upsert: true }
        );

        processedCount++;
        console.log(`Successfully published post ${post._id} to ${post.platform}`);

      } catch (error: any) {
        console.error(`Failed to publish post ${post._id}:`, error);
        errorCount++;

        // Update content status to failed
        await Content.findByIdAndUpdate(post._id, {
          status: 'failed',
          error: error.message,
          updatedAt: new Date()
        });

        // Create failed publish job record
        const failedJobMetadata: any = {
          processedBy: 'cron',
          source
        };

        if (post.platform === 'instagram') {
          failedJobMetadata.mediaType = 'VIDEO';
          failedJobMetadata.isReel = true;
          failedJobMetadata.shareToFeed = post.instagramOptions?.shareToFeed ?? true;
          failedJobMetadata.thumbOffset = post.instagramOptions?.thumbOffset ?? 0;
        } else if (post.platform === 'youtube') {
          failedJobMetadata.title = post.title;
          failedJobMetadata.description = post.description;
          failedJobMetadata.tags = post.tags;
          failedJobMetadata.privacyStatus = post.privacyStatus;
        }

        await PublishJob.updateOne(
          {
            contentId: post._id,
            platform: post.platform
          },
          {
            $set: {
              userId: post.userId,
              status: 'failed',
              scheduledAt: post.scheduledAt,
              completedAt: new Date(),
              result: {
                success: false,
                error: error.message
              },
              metadata: failedJobMetadata
            }
          },
          { upsert: true }
        );
      }
    }

    // Clean up old completed and failed jobs (keep last 1000)
    try {
      const oldJobs = await PublishJob.find({
        status: { $in: ['completed', 'failed'] }
      })
      .sort({ createdAt: -1 })
      .skip(1000);

      if (oldJobs.length > 0) {
        const oldJobIds = oldJobs.map(job => job._id);
        await PublishJob.deleteMany({ _id: { $in: oldJobIds } });
        console.log(`Cleaned up ${oldJobs.length} old publish jobs`);
      }
    } catch (cleanupError) {
      console.error('Cleanup error:', cleanupError);
    }

    return NextResponse.json({
      success: true,
      processedCount,
      errorCount,
      totalFound: scheduledPosts.length,
      processedAt: currentTime,
      source
    });

  } catch (error: any) {
    console.error('Process scheduled posts error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      processedAt: new Date().toISOString()
    }, { status: 500 });
  }
}

// GET endpoint for manual testing
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Manually trigger processing
  return POST(new NextRequest(request.url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.CRON_SECRET}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      currentTime: new Date().toISOString(),
      source: 'manual-test'
    })
  }));
}
