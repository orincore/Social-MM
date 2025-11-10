import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import { InstagramAccount } from '@/models/InstagramAccount';
import Content from '@/models/Content';
import { PublishJob } from '@/models/PublishJob';
import { InstagramAPI } from '@/lib/instagram-api';

export async function POST(request: NextRequest) {
  try {
    console.log('Instagram Publish API called');
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('Instagram Publish: No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    console.log('Instagram Publish: Request body:', body);
    
    let { 
      contentId, 
      mediaUrl, 
      caption, 
      mediaType = 'IMAGE',
      isReel = false,
      scheduledAt,
      shareToFeed,
      thumbOffset
    } = body;

    // If contentId is provided but other fields are missing, fetch from database
    if (contentId && (!mediaUrl || !caption)) {
      console.log('Instagram Publish: Fetching content data from database');
      const content = await Content.findById(contentId);
      if (!content) {
        return NextResponse.json({ error: 'Content not found' }, { status: 404 });
      }
      
      mediaUrl = mediaUrl || content.mediaUrl;
      caption = caption || content.caption;
      shareToFeed = shareToFeed ?? content.instagramOptions?.shareToFeed;
      thumbOffset = thumbOffset ?? content.instagramOptions?.thumbOffset;

      console.log('Instagram Publish: Content data fetched:', {
        mediaUrl,
        caption,
        shareToFeed,
        thumbOffset
      });
    }

    // Validate required fields
    if (!mediaUrl || !caption) {
      console.log('Instagram Publish: Missing required fields');
      return NextResponse.json({ 
        error: 'Missing required fields: mediaUrl and caption' 
      }, { status: 400 });
    }

    // Since we're only posting Reels, always set as VIDEO and isReel = true
    mediaType = 'VIDEO';
    isReel = true;

    console.log('Instagram Publish: Media type set to VIDEO (Reel):', mediaType);

    const normalizedShareToFeed = typeof shareToFeed === 'boolean' ? shareToFeed : true;
    const parsedThumbOffset = Number.isFinite(Number(thumbOffset))
      ? Math.max(0, Math.min(60, Math.floor(Number(thumbOffset))))
      : 0;

    // Get user first
    const User = (await import('@/models/User')).default;
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      console.log('Instagram Publish: User not found');
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Find the user's Instagram account
    const instagramAccount = await InstagramAccount.findOne({ 
      userId: user._id,
      isActive: true
    });

    if (!instagramAccount) {
      console.log('Instagram Publish: Instagram account not connected');
      return NextResponse.json({ 
        error: 'Instagram account not connected' 
      }, { status: 400 });
    }

    console.log('Instagram Publish: Found Instagram account:', {
      username: instagramAccount.username,
      accountType: instagramAccount.accountType
    });

    // Initialize Instagram API
    const instagramAPI = new InstagramAPI(instagramAccount.accessToken);

    let publishedPostId: string;

    try {
      console.log('Instagram Publish: Starting publish process...', {
        mediaType,
        isReel,
        mediaUrl,
        captionLength: caption.length,
        shareToFeed: normalizedShareToFeed,
        thumbOffset: parsedThumbOffset
      });

      console.log('Instagram Publish: Attempting to publish as Reel (MP4 only)...');
      publishedPostId = await instagramAPI.postVideo(mediaUrl, caption, {
        isReel: true,
        instagramAccountId: instagramAccount.instagramId,
        shareToFeed: normalizedShareToFeed,
        thumbOffset: parsedThumbOffset
      });
      console.log('Instagram Publish: Successfully published as Reel with ID:', publishedPostId);

      // Update content status if contentId provided
      if (contentId) {
        await Content.findByIdAndUpdate(contentId, {
          status: 'published',
          publishedAt: new Date(),
          publishedPostId,
          publishedPlatforms: ['instagram']
        });
      }

      // Create publish job record (only if contentId is provided)
      if (contentId) {
        await PublishJob.create({
          userId: user._id.toString(),
          contentId: contentId,
          platform: 'instagram',
          status: 'completed',
          scheduledAt: new Date(), // Add required scheduledAt field
          result: {
            success: true,
            postId: publishedPostId
          },
          metadata: {
            mediaType,
            isReel,
            shareToFeed: normalizedShareToFeed,
            thumbOffset: parsedThumbOffset,
            caption: caption.substring(0, 100) + (caption.length > 100 ? '...' : '')
          }
        });
      }

      return NextResponse.json({
        success: true,
        publishedPostId,
        message: 'Post published successfully to Instagram'
      });

    } catch (publishError: any) {
      console.error('Instagram publish error:', publishError);
      console.error('Error details:', {
        message: publishError.message,
        stack: publishError.stack,
        mediaUrl,
        caption,
        mediaType,
        instagramAccountId: instagramAccount.instagramId
      });

      // Update content status to failed if contentId provided
      if (contentId) {
        await Content.findByIdAndUpdate(contentId, {
          status: 'failed',
          error: publishError.message
        });
      }

      // Create failed publish job record (only if contentId is provided)
      if (contentId) {
        await PublishJob.create({
          userId: user._id.toString(),
          contentId: contentId,
          platform: 'instagram',
          status: 'failed',
          scheduledAt: new Date(), // Add required scheduledAt field
          result: {
            success: false,
            error: publishError.message
          },
          metadata: {
            mediaType,
            isReel,
            caption: caption.substring(0, 100) + (caption.length > 100 ? '...' : '')
          }
        });
      }

      return NextResponse.json({
        error: 'Failed to publish to Instagram',
        details: publishError.message,
        hint: 'Instagram requires MP4 videos (H.264/AAC), vertical 9:16 aspect ratio, and less than 60 seconds.'
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
