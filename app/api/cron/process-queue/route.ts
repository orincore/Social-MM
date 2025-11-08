import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Content } from '@/models/Content';
import { PublishJob } from '@/models/PublishJob';
import { InstagramAccount } from '@/models/InstagramAccount';
import { InstagramAPI } from '@/lib/instagram-api';

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
        
        try {
          // Get job data from Redis
          const jobDataStr = await redis.get(jobKey);
          if (!jobDataStr) {
            continue; // Job was already processed or expired
          }

          const jobData = JSON.parse(jobDataStr);
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
            mediaUrl, 
            caption, 
            mediaType, 
            platforms, 
            isReel 
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

          // Get user's Instagram account
          const instagramAccount = await InstagramAccount.findOne({
            userEmail
          });

          if (!instagramAccount) {
            throw new Error('Instagram account not found');
          }

          // Initialize Instagram API
          const instagramAPI = new InstagramAPI(instagramAccount.accessToken);

          let publishedPostId: string;

          // Publish based on media type
          if (mediaType === 'VIDEO' || isReel) {
            publishedPostId = await instagramAPI.postVideo(mediaUrl, caption, isReel);
          } else {
            publishedPostId = await instagramAPI.postImage(mediaUrl, caption);
          }

          // Update content status to published
          await Content.findByIdAndUpdate(contentId, {
            status: 'published',
            publishedAt: new Date(),
            publishedPostId,
            publishedPlatforms: platforms,
            updatedAt: new Date()
          });

          // Create successful publish job record
          await PublishJob.create({
            userEmail,
            contentId,
            platform: 'instagram',
            status: 'completed',
            publishedPostId,
            publishedAt: new Date(),
            metadata: {
              mediaType,
              isReel,
              processedBy: 'redis-queue',
              source,
              redisJobKey: jobKey
            }
          });

          // Remove the job from Redis after successful processing
          await redis.del(jobKey);
          
          processedCount++;
          console.log(`Successfully published queued post ${contentId} to Instagram`);

        } catch (jobError: any) {
          console.error(`Failed to process Redis job ${jobKey}:`, jobError);
          errorCount++;

          const contentId = jobData.contentId;
          if (contentId) {
            // Update content status to failed
            await Content.findByIdAndUpdate(contentId, {
              status: 'failed',
              error: jobError.message,
              updatedAt: new Date()
            });

            // Create failed publish job record
            await PublishJob.create({
              userEmail: jobData.userEmail,
              contentId,
              platform: 'instagram',
              status: 'failed',
              error: jobError.message,
              metadata: {
                mediaType: jobData.mediaType,
                isReel: jobData.isReel,
                processedBy: 'redis-queue',
                source,
                redisJobKey: jobKey
              }
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
