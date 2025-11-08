import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '../../auth/[...nextauth]/route';
import { connectDB } from '@/lib/db';
import { InstagramAccount } from '@/models/InstagramAccount';
import { Content } from '@/models/Content';
import { PublishJob } from '@/models/PublishJob';
import { InstagramAPI } from '@/lib/instagram-api';
import { r2Storage } from '@/lib/r2-storage';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { 
      contentId, 
      mediaUrl, 
      caption, 
      mediaType = 'IMAGE',
      isReel = false,
      scheduledAt 
    } = body;

    // Find the user's Instagram account
    const instagramAccount = await InstagramAccount.findOne({ 
      userEmail: session.user.email 
    });

    if (!instagramAccount) {
      return NextResponse.json({ 
        error: 'Instagram account not connected' 
      }, { status: 400 });
    }

    // Initialize Instagram API
    const instagramAPI = new InstagramAPI(instagramAccount.accessToken);

    let publishedPostId: string;

    try {
      // Publish based on media type
      if (mediaType === 'VIDEO' || isReel) {
        publishedPostId = await instagramAPI.postVideo(mediaUrl, caption, isReel);
      } else {
        publishedPostId = await instagramAPI.postImage(mediaUrl, caption);
      }

      // Update content status if contentId provided
      if (contentId) {
        await Content.findByIdAndUpdate(contentId, {
          status: 'published',
          publishedAt: new Date(),
          publishedPostId,
          publishedPlatforms: ['instagram']
        });
      }

      // Create publish job record
      await PublishJob.create({
        userEmail: session.user.email,
        contentId: contentId || null,
        platform: 'instagram',
        status: 'completed',
        publishedPostId,
        publishedAt: new Date(),
        metadata: {
          mediaType,
          isReel,
          caption: caption.substring(0, 100) + (caption.length > 100 ? '...' : '')
        }
      });

      return NextResponse.json({
        success: true,
        publishedPostId,
        message: 'Post published successfully to Instagram'
      });

    } catch (publishError: any) {
      console.error('Instagram publish error:', publishError);

      // Update content status to failed if contentId provided
      if (contentId) {
        await Content.findByIdAndUpdate(contentId, {
          status: 'failed',
          error: publishError.message
        });
      }

      // Create failed publish job record
      await PublishJob.create({
        userEmail: session.user.email,
        contentId: contentId || null,
        platform: 'instagram',
        status: 'failed',
        error: publishError.message,
        metadata: {
          mediaType,
          isReel,
          caption: caption.substring(0, 100) + (caption.length > 100 ? '...' : '')
        }
      });

      return NextResponse.json({
        error: 'Failed to publish to Instagram',
        details: publishError.message
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Publish API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}

// GET endpoint to check publish job status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const jobId = searchParams.get('jobId');
    const contentId = searchParams.get('contentId');

    await connectDB();

    let query: any = { userEmail: session.user.email };
    
    if (jobId) {
      query._id = jobId;
    } else if (contentId) {
      query.contentId = contentId;
    }

    const publishJobs = await PublishJob.find(query)
      .sort({ createdAt: -1 })
      .limit(10);

    return NextResponse.json({
      success: true,
      jobs: publishJobs
    });

  } catch (error: any) {
    console.error('Get publish jobs error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error.message
    }, { status: 500 });
  }
}
