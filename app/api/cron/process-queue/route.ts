import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Content from '@/models/Content';
import { PublishJob } from '@/models/PublishJob';
import { InstagramAccount } from '@/models/InstagramAccount';
import { YouTubeAccount } from '@/models/YouTubeAccount';
import { InstagramAPI } from '@/lib/instagram-api';
import { YouTubeAPI } from '@/lib/youtube-api';
import User from '@/models/User';

// Upstash Redis client for queue operations
let redisClient: any = null;

const initializeRedis = async () => {
  if (!redisClient && process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Redis } = await import('@upstash/redis');
      
      redisClient = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
    } catch (error) {
      console.error('Failed to initialize Upstash Redis:', error);
    }
  }
  return redisClient;
};

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

    console.log(`Processing Redis queue jobs at ${currentTime} from ${source}`);

    // Initialize Redis client
    const redis = await initializeRedis();
    if (!redis) {
      console.log('Redis not available, skipping queue processing');
      return NextResponse.json({
        success: true,
        processedCount: 0,
        errorCount: 0,
        message: 'Redis not available',
        processedAt: currentTime
      });
    }

    await connectDB();

    let processedCount = 0;
    let errorCount = 0;

    try {
      // Get all scheduled post keys from Redis
      const keys = await redis.keys('scheduled_post:*');
      console.log(`Found ${keys.length} scheduled jobs in Redis`);
      
      // Process up to 10 jobs per run
      const maxJobs = Math.min(10, keys.length);
      
      for (let i = 0; i < maxJobs; i++) {
        const jobKey = keys[i];
        let jobData: any = null;
        
        try {
          // Get job data from Redis
          const jobDataStr = await redis.get(jobKey);
          if (!jobDataStr) {
            continue; // Job was already processed or expired
          }

          jobData = JSON.parse(jobDataStr);
          console.log('Processing Redis job:', jobData);

          // Check if the job is due (with 1 minute buffer)
          const scheduledTime = new Date(jobData.scheduledAt);
          const now = new Date(currentTime);
          const bufferTime = new Date(now.getTime() + 60000); // 1 minute buffer

          if (scheduledTime > bufferTime) {
            console.log(`Job ${jobKey} not yet due, skipping`);
            continue;
          }

          const { 
            contentId, 
            userEmail, 
            userId,
            mediaUrl, 
            caption, 
            mediaType, 
            platforms, 
            isReel,
            shareToFeed,
            thumbOffset
          } = jobData;

          // Check if content still exists and is scheduled
          const content = await Content.findById(contentId);
          if (!content) {
            console.log(`Content ${contentId} not found, skipping job`);
            continue;
          }

          if (content.status !== 'scheduled') {
            console.log(`Content ${contentId} status is ${content.status}, skipping job`);
            continue;
          }

          // Update status to processing
          await Content.findByIdAndUpdate(contentId, {
            status: 'processing',
            updatedAt: new Date()
          });

          let publishedPostId: string;
          
          if (content.platform === 'instagram') {
            // Get user with Instagram tokens
            const user = await User.findById(userId || content.userId);
            if (!user || !user.instagram?.connected || !user.instagram?.accessToken) {
              throw new Error('Instagram account not connected or tokens missing');
            }

            // Check if token is expired
            if (user.instagram.tokenExpiresAt && new Date() > user.instagram.tokenExpiresAt) {
              throw new Error('Instagram token expired. Please reconnect your account.');
            }

            // Initialize Instagram API
            const instagramAPI = new InstagramAPI(user.instagram.accessToken);

            // Publish Instagram Reel
            console.log('Publishing queued Instagram Reel:', {
              mediaUrl,
              caption: caption?.substring(0, 50) + '...',
              shareToFeed: shareToFeed ?? content.instagramOptions?.shareToFeed,
              thumbOffset: thumbOffset ?? content.instagramOptions?.thumbOffset
            });
            
            publishedPostId = await instagramAPI.postVideo(mediaUrl, caption, {
              isReel: true,
              instagramAccountId: user.instagram.instagramId,
              shareToFeed: shareToFeed ?? content.instagramOptions?.shareToFeed ?? true,
              thumbOffset: thumbOffset ?? content.instagramOptions?.thumbOffset ?? 0
            });
          } else if (content.platform === 'youtube') {
            // Get user with YouTube tokens
            const user = await User.findById(userId || content.userId);
            if (!user || !user.youtube?.connected || !user.youtube?.accessToken) {
              throw new Error('YouTube account not connected or tokens missing');
            }

            // Check if token is expired and refresh if needed
            let accessToken = user.youtube.accessToken;
            if (new Date() > user.youtube.tokenExpiresAt) {
              try {
                const { YouTubeAPI } = await import('@/lib/youtube-api');
                const refreshedTokens = await YouTubeAPI.refreshToken(user.youtube.refreshToken);
                accessToken = refreshedTokens.access_token;
                
                // Update stored tokens
                user.youtube.accessToken = accessToken;
                user.youtube.tokenExpiresAt = new Date(Date.now() + refreshedTokens.expires_in * 1000);
                await user.save();
              } catch (error) {
                throw new Error('YouTube token expired and refresh failed. Please reconnect your account.');
              }
            }

            // Initialize YouTube API
            const { YouTubeAPI } = await import('@/lib/youtube-api');
            const youtubeAPI = new YouTubeAPI(accessToken);

            // Validate and prepare title
            let videoTitle = (content.title || '').trim();
            if (!videoTitle) {
              // Generate title from caption or description
              const fallbackText = (content.caption || content.description || '').trim();
              if (fallbackText) {
                videoTitle = fallbackText.substring(0, 60).replace(/\n/g, ' ').trim();
              }
              if (!videoTitle) {
                videoTitle = 'Untitled Video';
              }
            }

            // Get video file from R2
            const { r2Storage } = await import('@/lib/r2-storage');
            const r2Key = mediaUrl.replace(/^https?:\/\/[^\/]+\//, '');
            const videoBlob = await r2Storage.getFile(r2Key);
            if (!videoBlob) {
              throw new Error('Video file not found in storage');
            }

            console.log('Publishing queued YouTube video:', {
              title: videoTitle,
              description: (content.description || content.caption || '').substring(0, 50) + '...',
              tags: content.tags
            });

            // Upload video to YouTube
            const uploadResult = await youtubeAPI.uploadVideo({
              title: videoTitle,
              description: content.description || content.caption || 'No description',
              tags: content.tags || [],
              categoryId: '22', // People & Blogs
              privacyStatus: content.privacyStatus || 'public',
              videoBlob
            });

            publishedPostId = uploadResult.id;
          } else {
            throw new Error(`Unsupported platform in queue: ${content.platform}`);
          }

          // Update content status to published
          const updateData: any = {
            status: 'published',
            publishedAt: new Date(),
            publishedPostId,
            updatedAt: new Date()
          };

          if (content.platform === 'instagram') {
            updateData['remote.mediaId'] = publishedPostId;
          } else if (content.platform === 'youtube') {
            updateData['remote.youtubeVideoId'] = publishedPostId;
            updateData['remote.youtubeUrl'] = `https://www.youtube.com/watch?v=${publishedPostId}`;
          }

          await Content.findByIdAndUpdate(contentId, updateData);

          // Create successful publish job record
          const jobMetadata: any = {
            processedBy: 'redis-queue',
            source,
            redisJobKey: jobKey
          };

          if (content.platform === 'instagram') {
            jobMetadata.mediaType = 'VIDEO';
            jobMetadata.isReel = true;
            jobMetadata.shareToFeed = shareToFeed ?? content.instagramOptions?.shareToFeed ?? true;
            jobMetadata.thumbOffset = thumbOffset ?? content.instagramOptions?.thumbOffset ?? 0;
          } else if (content.platform === 'youtube') {
            jobMetadata.title = content.title;
            jobMetadata.description = content.description;
            jobMetadata.tags = content.tags;
            jobMetadata.privacyStatus = content.privacyStatus;
          }

          await PublishJob.create({
            userId: userId || content.userId,
            contentId,
            platform: content.platform,
            status: 'completed',
            scheduledAt: content.scheduledAt,
            result: {
              success: true,
              postId: publishedPostId
            },
            metadata: jobMetadata
          });

          // Remove the job from Redis after successful processing
          await redis.del(jobKey);
          
          processedCount++;
          console.log(`Successfully published queued post ${contentId} to ${content.platform}`);

        } catch (jobError: any) {
          console.error(`Failed to process Redis job ${jobKey}:`, jobError);
          errorCount++;

          const contentId = jobData?.contentId;
          if (contentId) {
            // Update content status to failed
            await Content.findByIdAndUpdate(contentId, {
              status: 'failed',
              error: jobError.message,
              updatedAt: new Date()
            });

            // Create failed publish job record
            const jobUserEmail = jobData?.userEmail || 'unknown';

            const failedJobMetadata: any = {
              processedBy: 'redis-queue',
              source,
              redisJobKey: jobKey
            };

            const content = await Content.findById(contentId);
            if (content?.platform === 'instagram') {
              failedJobMetadata.mediaType = 'VIDEO';
              failedJobMetadata.isReel = true;
              failedJobMetadata.shareToFeed = jobData?.shareToFeed ?? true;
              failedJobMetadata.thumbOffset = jobData?.thumbOffset ?? 0;
            } else if (content?.platform === 'youtube') {
              failedJobMetadata.title = content.title;
              failedJobMetadata.description = content.description;
              failedJobMetadata.tags = content.tags;
              failedJobMetadata.privacyStatus = content.privacyStatus;
            }

            await PublishJob.create({
              userId: jobData?.userId || contentId,
              contentId,
              platform: content?.platform || 'unknown',
              status: 'failed',
              scheduledAt: jobData?.scheduledAt ? new Date(jobData.scheduledAt) : new Date(),
              result: {
                success: false,
                error: jobError.message
              },
              metadata: failedJobMetadata
            });

            // Remove the failed job from Redis
            await redis.del(jobKey);
          }
        }
      }

    } catch (queueError: any) {
      console.error('Queue processing error:', queueError);
      return NextResponse.json({
        success: false,
        error: queueError.message,
        processedAt: currentTime
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      processedCount,
      errorCount,
      processedAt: currentTime,
      source
    });

  } catch (error: any) {
    console.error('Process queue error:', error);
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

  // Manually trigger queue processing
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
