import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../auth/[...nextauth]/route';
import { connectDB } from '@/lib/db';
import { Content } from '@/models/Content';
import { PublishJob } from '@/models/PublishJob';

// Upstash Redis client for simple queue operations
let redisClient: any = null;

// Initialize Upstash Redis client
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
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const {
      title,
      caption,
      mediaUrl,
      mediaType = 'IMAGE',
      platforms = ['instagram'],
      scheduledAt,
      isReel = false,
      hashtags = [],
      mentions = []
    } = body;

    // Validate required fields
    if (!caption || !mediaUrl || !scheduledAt) {
      return NextResponse.json({
        error: 'Missing required fields: caption, mediaUrl, scheduledAt'
      }, { status: 400 });
    }

    // Validate scheduled time is in the future
    const scheduledDate = new Date(scheduledAt);
    if (scheduledDate <= new Date()) {
      return NextResponse.json({
        error: 'Scheduled time must be in the future'
      }, { status: 400 });
    }

    // Create content record
    const content = await Content.create({
      userEmail: session.user.email,
      title: title || `Post scheduled for ${scheduledDate.toLocaleDateString()}`,
      caption,
      mediaUrl,
      mediaType,
      platforms,
      scheduledAt: scheduledDate,
      status: 'scheduled',
      isReel,
      hashtags,
      mentions,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // Initialize Redis client for simple queue operations
    const redis = await initializeRedis();

    if (redis) {
      try {
        // Add job to Redis queue for processing at scheduled time
        const jobPayload = {
          contentId: content._id.toString(),
          userEmail: session.user.email,
          mediaUrl,
          caption,
          mediaType,
          platforms,
          isReel,
          scheduledAt: scheduledDate.toISOString()
        };

        // Store in Redis with expiration (TTL of 7 days)
        const jobKey = `scheduled_post:${content._id}`;
        await redis.setex(jobKey, 7 * 24 * 60 * 60, JSON.stringify(jobPayload));

        console.log(`Scheduled post job stored in Redis: ${jobKey}`);
      } catch (redisError) {
        console.error('Failed to store job in Redis:', redisError);
        // Continue without Redis - the cron job will pick it up from MongoDB
      }
    }

    // Create initial publish job record
    await PublishJob.create({
      userEmail: session.user.email,
      contentId: content._id,
      platform: 'scheduler',
      status: 'scheduled',
      scheduledAt: scheduledDate,
      metadata: {
        platforms,
        mediaType,
        isReel,
        queueJobId: `publish_${content._id}`
      }
    });

    return NextResponse.json({
      success: true,
      contentId: content._id,
      scheduledAt: scheduledDate,
      message: 'Post scheduled successfully'
    });

  } catch (error: any) {
    console.error('Schedule API error:', error);
    return NextResponse.json({
      error: 'Failed to schedule post',
      details: error.message
    }, { status: 500 });
  }
}

// GET endpoint to retrieve scheduled posts
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'scheduled';
    const limit = parseInt(searchParams.get('limit') || '20');
    const page = parseInt(searchParams.get('page') || '1');

    await connectDB();

    const skip = (page - 1) * limit;

    const query: any = { userEmail: session.user.email };
    if (status !== 'all') {
      query.status = status;
    }

    const [contents, total] = await Promise.all([
      Content.find(query)
        .sort({ scheduledAt: status === 'scheduled' ? 1 : -1 })
        .skip(skip)
        .limit(limit),
      Content.countDocuments(query)
    ]);

    return NextResponse.json({
      success: true,
      contents,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error: any) {
    console.error('Get scheduled posts error:', error);
    return NextResponse.json({
      error: 'Failed to retrieve scheduled posts',
      details: error.message
    }, { status: 500 });
  }
}

// DELETE endpoint to cancel scheduled posts
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const contentId = searchParams.get('contentId');

    if (!contentId) {
      return NextResponse.json({ error: 'Content ID is required' }, { status: 400 });
    }

    await connectDB();

    // Find and verify ownership
    const content = await Content.findOne({
      _id: contentId,
      userEmail: session.user.email,
      status: 'scheduled'
    });

    if (!content) {
      return NextResponse.json({
        error: 'Scheduled post not found or already processed'
      }, { status: 404 });
    }

    // Update content status
    await Content.findByIdAndUpdate(contentId, {
      status: 'cancelled',
      updatedAt: new Date()
    });

    // Try to remove from Redis if possible
    const redis = await initializeRedis();
    if (redis) {
      try {
        const jobKey = `scheduled_post:${contentId}`;
        await redis.del(jobKey);
        console.log(`Removed scheduled job from Redis: ${jobKey}`);
      } catch (redisError) {
        console.error('Failed to remove job from Redis:', redisError);
        // Continue - the job will be skipped when processed
      }
    }

    // Update publish job
    await PublishJob.findOneAndUpdate(
      { contentId, status: 'scheduled' },
      { status: 'cancelled', updatedAt: new Date() }
    );

    return NextResponse.json({
      success: true,
      message: 'Scheduled post cancelled successfully'
    });

  } catch (error: any) {
    console.error('Cancel scheduled post error:', error);
    return NextResponse.json({
      error: 'Failed to cancel scheduled post',
      details: error.message
    }, { status: 500 });
  }
}
