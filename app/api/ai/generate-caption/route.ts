import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { openai } from '@/lib/openai';

export async function POST(req: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { prompt } = await req.json();
    
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt is required' }, { status: 400 });
    }

    // Generate caption using OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `You are a social media expert. Create engaging, authentic captions for social media posts. 
          Include relevant hashtags and emojis where appropriate. Keep it conversational and engaging.
          The caption should be suitable for both Instagram and other social platforms.
          Maximum length should be around 150-200 characters for optimal engagement.`
        },
        {
          role: 'user',
          content: `Create a social media caption for: ${prompt}`
        }
      ],
      max_tokens: 200,
      temperature: 0.7
    });

    const caption = completion.choices[0]?.message?.content?.trim();
    
    if (!caption) {
      throw new Error('Failed to generate caption');
    }

    return NextResponse.json({
      success: true,
      caption,
      originalPrompt: prompt
    });

  } catch (error: any) {
    console.error('AI caption generation error:', error);
    
    // Fallback to a simple template-based caption if OpenAI fails
    const { prompt } = await req.json().catch(() => ({ prompt: 'content' }));
    const fallbackCaption = `✨ Excited to share this ${prompt}! What do you think? 💭 #content #socialmedia #sharing`;
    
    return NextResponse.json({
      success: true,
      caption: fallbackCaption,
      originalPrompt: prompt,
      fallback: true
    });
  }
}
