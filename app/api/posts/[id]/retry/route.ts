import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { connectDB } from '@/lib/mongodb';
import Content from '@/models/Content';
import PublishJob from '@/models/PublishJob';

export async function POST(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await connectDB();

    const { id: postId } = await context.params;

    // Find the post and verify ownership
    const post = await Content.findOne({
      _id: postId,
      userId: session.user.id
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Post not found' },
        { status: 404 }
      );
    }

    // Check if post is in a retryable state
    if (post.status === 'published') {
      return NextResponse.json(
        { success: false, error: 'Post is already published' },
        { status: 400 }
      );
    }

    // Create a new publish job
    const publishJob = new PublishJob({
      contentId: post._id,
      userId: session.user.id,
      platform: post.platform,
      status: 'pending',
      scheduledAt: new Date(), // Retry immediately
      createdAt: new Date()
    });

    await publishJob.save();

    // Update post status
    post.status = 'scheduled';
    post.scheduledAt = new Date();
    await post.save();

    // Here you would typically trigger your publishing queue/cron job
    // For now, we'll just return success
    
    return NextResponse.json({
      success: true,
      message: 'Post queued for retry',
      data: {
        postId: post._id,
        jobId: publishJob._id,
        scheduledAt: publishJob.scheduledAt
      }
    });

  } catch (error) {
    console.error('Error retrying post:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to retry post' 
      },
      { status: 500 }
    );
  }
}
