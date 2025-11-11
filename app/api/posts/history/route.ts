import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { dbConnect } from '@/lib/db';
import Content from '@/models/Content';
import PublishJob from '@/models/PublishJob';

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await dbConnect();

    console.log('Session user:', session.user);
    
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    // Build filter query - handle both string and ObjectId formats
    const userId = session.user.id;
    const filter: any = { 
      $or: [
        { userId: userId },
        { userId: userId.toString() }
      ]
    };

    if (platform && platform !== 'all') {
      filter.platform = platform;
    }

    if (status && status !== 'all') {
      filter.status = status;
    }

    // Default to last 7 days if no date range specified
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.createdAt.$lte = new Date(dateTo);
      }
    } else {
      // Show last 7 days by default
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      filter.createdAt = { $gte: sevenDaysAgo };
    }

    console.log('Filter being used:', JSON.stringify(filter, null, 2));

    // Get total count for pagination
    const totalCount = await Content.countDocuments(filter);
    console.log('Total count found:', totalCount);

    // Fetch posts with pagination
    const posts = await Content.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();
    
    console.log('Posts found:', posts.length);

    // Get associated publish jobs for each post
    const postsWithJobs = await Promise.all(
      posts.map(async (post) => {
        const publishJobs = await PublishJob.find({ 
          contentId: post._id 
        }).sort({ createdAt: -1 }).lean();

        return {
          ...post,
          publishJobs,
          lastPublishAttempt: publishJobs[0]?.createdAt || null,
          publishStatus: publishJobs[0]?.status || 'pending',
          errorMessage: publishJobs[0]?.error || null
        };
      })
    );

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        posts: postsWithJobs,
        pagination: {
          currentPage: page,
          totalPages,
          totalCount,
          hasNextPage,
          hasPrevPage,
          limit
        }
      }
    });

  } catch (error) {
    console.error('Error fetching posts history:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to fetch posts history' 
      },
      { status: 500 }
    );
  }
}
