import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { dbConnect } from '@/lib/db';
import Content from '@/models/Content';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    await dbConnect();

    // Create sample content for the last 7 days
    const samplePosts = [];
    const now = new Date();

    for (let i = 0; i < 7; i++) {
      const postDate = new Date(now);
      postDate.setDate(postDate.getDate() - i);

      // Instagram post
      samplePosts.push({
        userId: session.user.id,
        platform: 'instagram',
        caption: `Sample Instagram post from ${postDate.toDateString()}`,
        mediaUrl: 'https://via.placeholder.com/400x400',
        status: i % 3 === 0 ? 'published' : i % 3 === 1 ? 'scheduled' : 'draft',
        scheduledAt: postDate,
        createdAt: postDate,
        updatedAt: postDate,
        instagramOptions: {
          shareToFeed: true,
          thumbOffset: 0
        }
      });

      // YouTube post
      if (i % 2 === 0) {
        samplePosts.push({
          userId: session.user.id,
          platform: 'youtube',
          title: `Sample YouTube Video ${i + 1}`,
          description: `Sample YouTube video description from ${postDate.toDateString()}`,
          tags: ['sample', 'test', 'youtube'],
          categoryId: '22',
          privacyStatus: 'public',
          mediaUrl: 'https://via.placeholder.com/1280x720',
          status: i % 2 === 0 ? 'published' : 'scheduled',
          scheduledAt: postDate,
          createdAt: postDate,
          updatedAt: postDate
        });
      }
    }

    // Insert sample posts
    const insertedPosts = await Content.insertMany(samplePosts);

    return NextResponse.json({
      success: true,
      message: `Created ${insertedPosts.length} sample posts`,
      data: insertedPosts
    });

  } catch (error) {
    console.error('Error creating sample posts:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to create sample posts' 
      },
      { status: 500 }
    );
  }
}
