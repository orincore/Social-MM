import { NextResponse } from 'next/server';
import { dbConnect } from '@/lib/db';
import Content from '@/models/Content';

export async function POST(req: Request) {
  try {
    const { platform, caption, mediaUrl, status } = await req.json();
    
    if (!platform || !caption || !mediaUrl) {
      return NextResponse.json({ error: 'platform, caption, and mediaUrl are required' }, { status: 400 });
    }

    await dbConnect();
    
    const content = new Content({
      platform,
      caption,
      mediaUrl,
      status: status || 'draft'
    });
    
    await content.save();
    
    return NextResponse.json({ 
      success: true, 
      id: content._id.toString(),
      content: {
        id: content._id.toString(),
        platform: content.platform,
        caption: content.caption,
        mediaUrl: content.mediaUrl,
        status: content.status
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
