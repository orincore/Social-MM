import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import User from '@/models/User';
import Content from '@/models/Content';
import { PublishJob } from '@/models/PublishJob';

export async function POST(req: NextRequest) {
  try {
    console.log('Content API called');
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      console.log('Content: No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const requestBody = await req.json();
    console.log('Content: Request body received:', requestBody);

    const { 
      platform, 
      caption, 
      title, 
      description, 
      tags, 
      mediaUrl, 
      scheduledAt, 
      status 
    } = requestBody;
    
    if (!platform) {
      console.log('Content: Platform missing');
      return NextResponse.json({ error: 'Platform is required' }, { status: 400 });
    }

    if (!caption && !title) {
      console.log('Content: Both caption and title missing');
      return NextResponse.json({ error: 'Caption or title is required' }, { status: 400 });
    }

    console.log('Content: Validation passed, creating content for platform:', platform);

    await connectDB();
    
    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }
    
    // Create content
    const contentData: any = {
      userId: user._id,
      platform,
      status: status || 'draft'
    };

    // Platform-specific fields
    if (platform === 'youtube') {
      contentData.title = title;
      contentData.description = description;
      contentData.caption = description; // Use description as caption for YouTube
      if (tags && Array.isArray(tags)) {
        contentData.tags = tags;
      }
    } else {
      contentData.caption = caption;
    }

    if (mediaUrl) {
      contentData.mediaUrl = mediaUrl;
    }

    if (scheduledAt) {
      contentData.scheduledAt = new Date(scheduledAt);
      contentData.status = 'scheduled';
    }
    
    const content = new Content(contentData);
    await content.save();

    // If scheduled, create a publish job
    if (scheduledAt && contentData.status === 'scheduled') {
      const publishJob = new PublishJob({
        userId: user._id.toString(),
        contentId: content._id.toString(),
        platform,
        scheduledAt: new Date(scheduledAt),
        status: 'pending'
      });
      await publishJob.save();
    }

    // If publishing now, trigger immediate publish
    if (status === 'publishing') {
      // Queue for immediate publishing
      try {
        // Use localhost for internal API calls to avoid SSL issues
        const baseUrl = process.env.NODE_ENV === 'production' 
          ? process.env.NEXTAUTH_URL 
          : 'http://localhost:3000';
          
        // Prepare publish data based on platform
        let publishData: any = { contentId: content._id.toString() };
        
        if (platform === 'youtube') {
          // For YouTube, we need title, description, and r2Key
          publishData = {
            contentId: content._id.toString(),
            title: content.title || 'Untitled Video',
            description: content.description || content.caption || 'No description',
            tags: content.tags || [],
            r2Key: mediaUrl ? mediaUrl.replace(/^https?:\/\/[^\/]+\//, '') : '', // Extract r2Key from mediaUrl
            privacyStatus: 'public'
          };
        } else if (platform === 'instagram') {
          // For Instagram, we need different data
          publishData = {
            contentId: content._id.toString(),
            caption: content.caption,
            mediaUrl: mediaUrl
          };
        }

        console.log('Content: Publishing with data:', publishData);

        const publishResponse = await fetch(`${baseUrl}/api/${platform}/publish`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': req.headers.get('Cookie') || '',
          },
          body: JSON.stringify(publishData)
        });

        if (publishResponse.ok) {
          content.status = 'published';
        } else {
          content.status = 'failed';
          content.publishError = await publishResponse.text();
        }
        await content.save();
      } catch (error) {
        console.error('Error publishing content immediately:', error);
        content.status = 'failed';
        content.publishError = error instanceof Error ? error.message : 'Unknown error';
        await content.save();
      }
    }
    
    return NextResponse.json({ 
      success: true, 
      id: content._id.toString(),
      content: {
        id: content._id.toString(),
        platform: content.platform,
        caption: content.caption,
        title: content.title,
        mediaUrl: content.mediaUrl,
        status: content.status,
        scheduledAt: content.scheduledAt,
        createdAt: content.createdAt
      }
    });
    
  } catch (error) {
    console.error('Error creating content:', error);
    return NextResponse.json({ 
      error: 'Failed to create content', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Get user
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get query parameters
    const { searchParams } = new URL(req.url);
    const platform = searchParams.get('platform');
    const status = searchParams.get('status');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Build query
    const query: any = { userId: user._id };
    if (platform) query.platform = platform;
    if (status) query.status = status;

    // Get content
    const content = await Content.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(offset)
      .lean();

    const total = await Content.countDocuments(query);

    return NextResponse.json({
      success: true,
      content,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total
      }
    });

  } catch (error) {
    console.error('Error fetching content:', error);
    return NextResponse.json({ 
      error: 'Failed to fetch content', 
      details: error instanceof Error ? error.message : 'Unknown error' 
    }, { status: 500 });
  }
}
