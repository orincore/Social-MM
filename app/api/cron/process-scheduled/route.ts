import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Content from '@/models/Content';
import { PublishJob } from '@/models/PublishJob';
import { InstagramAccount } from '@/models/InstagramAccount';
import { InstagramAPI } from '@/lib/instagram-api';

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

        // Get user's Instagram account
        const instagramAccount = await InstagramAccount.findOne({
          userEmail: post.userEmail
        });

        if (!instagramAccount) {
          throw new Error('Instagram account not found');
        }

        // Initialize Instagram API
        const instagramAPI = new InstagramAPI(instagramAccount.accessToken);

        let publishedPostId: string;

        // Publish based on media type
        if (post.mediaType === 'VIDEO' || post.isReel) {
          publishedPostId = await instagramAPI.postVideo(
            post.mediaUrl, 
            post.caption, 
            post.isReel
          );
        } else {
          publishedPostId = await instagramAPI.postImage(
            post.mediaUrl, 
            post.caption
          );
        }

        // Update content status to published
        await Content.findByIdAndUpdate(post._id, {
          status: 'published',
          publishedAt: new Date(),
          publishedPostId,
          publishedPlatforms: post.platforms,
          updatedAt: new Date()
        });

        // Create successful publish job record
        await PublishJob.create({
          userEmail: post.userEmail,
          contentId: post._id,
          platform: 'instagram',
          status: 'completed',
          publishedPostId,
          publishedAt: new Date(),
          scheduledAt: post.scheduledAt,
          metadata: {
            mediaType: post.mediaType,
            isReel: post.isReel,
            processedBy: 'cron',
            source
          }
        });

        processedCount++;
        console.log(`Successfully published post ${post._id} to Instagram`);

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
        await PublishJob.create({
          userEmail: post.userEmail,
          contentId: post._id,
          platform: 'instagram',
          status: 'failed',
          error: error.message,
          scheduledAt: post.scheduledAt,
          metadata: {
            mediaType: post.mediaType,
            isReel: post.isReel,
            processedBy: 'cron',
            source
          }
        });
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
