import { NextResponse } from 'next/server';
import { TogetherAI } from '@/lib/ai/together';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

type Platform = 'instagram' | 'youtube' | 'tiktok' | 'twitter' | 'linkedin' | 'facebook';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { 
      content, 
      platform, 
      action, 
      historicalData, 
      niche,
      tone = 'professional',
      hashtagCount = 10
    } = await req.json();

    if (!content || !platform || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: content, platform, and action are required' },
        { status: 400 }
      );
    }

    try {
      let result;
      
      switch (action) {
        case 'predict-performance':
          result = await TogetherAI.predictPerformance(content, platform, historicalData || []);
          break;
        
        case 'generate-caption':
          result = await TogetherAI.generateCaption(content, platform, tone);
          break;
        
        case 'generate-hashtags':
          result = await TogetherAI.generateHashtags(content, platform, hashtagCount);
          break;
        
        case 'analyze-gap':
          result = await TogetherAI.analyzeContentGap(content, historicalData || [], niche || 'general');
          break;
        
        case 'optimal-times':
          result = await TogetherAI.optimizePostingSchedule(content, platform, historicalData || []);
          break;
      
        case 'repurpose-content': {
          const { fromPlatform, toPlatform } = await req.json();
          if (!fromPlatform || !toPlatform) {
            return NextResponse.json(
              { error: 'Missing platform information' },
              { status: 400 }
            );
          }
          
          result = await TogetherAI.repurposeContent(content, fromPlatform, toPlatform);
          break;
        }
        
        default:
          return NextResponse.json(
            { error: 'Invalid action' },
            { status: 400 }
          );
      }

      return NextResponse.json({ success: true, data: result });
    } catch (error) {
      console.error('AI optimization error:', error);
      return NextResponse.json(
        { 
          success: false, 
          error: error instanceof Error ? error.message : 'An unknown error occurred' 
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in AI optimization route:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred' 
      },
      { status: 500 }
    );
  }
}
