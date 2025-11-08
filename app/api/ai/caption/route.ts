import { NextRequest, NextResponse } from 'next/server';
import { generateCaption } from '@/lib/openai';
import { z } from 'zod';

const captionRequestSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  platform: z.enum(['instagram', 'facebook', 'youtube']),
  tone: z.enum(['professional', 'casual', 'engaging']).optional().default('engaging'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = captionRequestSchema.parse(body);

    const caption = await generateCaption(
      validatedData.title,
      validatedData.platform,
      validatedData.tone
    );

    return NextResponse.json({
      success: true,
      data: {
        caption,
        platform: validatedData.platform,
        tone: validatedData.tone,
      },
    });
  } catch (error) {
    console.error('Caption generation error:', error);

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
        error: error instanceof Error ? error.message : 'Failed to generate caption',
      },
      { status: 500 }
    );
  }
}
