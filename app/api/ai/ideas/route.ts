import { NextRequest, NextResponse } from 'next/server';
import { generateContentIdeas } from '@/lib/openai';
import { z } from 'zod';

const ideasRequestSchema = z.object({
  niche: z.string().min(1, 'Niche is required'),
  platform: z.enum(['instagram', 'facebook', 'youtube']),
  count: z.number().min(1).max(20).optional().default(5),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = ideasRequestSchema.parse(body);

    const ideas = await generateContentIdeas(
      validatedData.niche,
      validatedData.platform,
      validatedData.count
    );

    return NextResponse.json({
      success: true,
      data: {
        ideas,
        niche: validatedData.niche,
        platform: validatedData.platform,
        count: ideas.length,
      },
    });
  } catch (error) {
    console.error('Content ideas generation error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid request data',
          details: error.errors,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate content ideas',
      },
      { status: 500 }
    );
  }
}
