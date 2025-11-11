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

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build filter query for user's posts - handle both string and ObjectId formats
    const userId = session.user.id;
    const filter: any = { 
      $or: [
        { userId: userId },
        { userId: userId.toString() }
      ]
    };

    // Default to last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    filter.createdAt = { $gte: thirtyDaysAgo };

    console.log('Posts API Filter:', JSON.stringify(filter, null, 2));

    // Get total count for pagination
    const totalCount = await Content.countDocuments(filter);
    console.log('Posts API Total count:', totalCount);

    // Fetch posts with pagination
    const posts = await Content.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    console.log('Posts API Found:', posts.length);

    // Calculate pagination info
    const totalPages = Math.ceil(totalCount / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    return NextResponse.json({
      success: true,
      data: {
        posts,
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
    console.error('Error in posts API:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
