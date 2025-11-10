import { NextResponse } from 'next/server';
import { TogetherAI } from '@/lib/ai/together';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    const { 
      title,
      caption, 
      description,
      tags,
      platforms,
      tone = 'professional',
      niche = 'general'
    } = await req.json();

    if (!platforms || platforms.length === 0) {
      return NextResponse.json(
        { error: 'At least one platform must be selected' },
        { status: 400 }
      );
    }

    const results: any = {};

    // Process each platform
    for (const platform of platforms) {
      try {
        const platformResults: any = {};

        // Generate optimized title (for YouTube)
        if (platform === 'youtube' && title) {
          const titlePrompt = `Optimize this YouTube video title for maximum engagement and SEO: "${title}". Make it compelling, clickable, and under 60 characters. Include relevant keywords.`;
          const optimizedTitles = await TogetherAI.generateCaption(titlePrompt, platform, tone);
          platformResults.optimizedTitle = optimizedTitles[0] || title;
        }

        // Generate optimized caption
        if (caption) {
          const captionPrompt = platform === 'youtube' 
            ? `Create an engaging YouTube video description based on: "${caption}". Include hooks, value propositions, and call-to-actions. Make it ${tone} in tone.`
            : `Create an engaging Instagram caption based on: "${caption}". Include emojis, line breaks, and make it ${tone} in tone.`;
          
          const optimizedCaptions = await TogetherAI.generateCaption(captionPrompt, platform, tone);
          platformResults.optimizedCaption = optimizedCaptions[0] || caption;
        }

        // Generate optimized description (for YouTube)
        if (platform === 'youtube' && description) {
          const descPrompt = `Optimize this YouTube video description for better engagement and SEO: "${description}". Include timestamps, links sections, and relevant keywords. Make it comprehensive and ${tone}.`;
          const optimizedDescriptions = await TogetherAI.generateCaption(descPrompt, platform, tone);
          platformResults.optimizedDescription = optimizedDescriptions[0] || description;
        }

        // Generate hashtags
        const hashtagContent = title || caption || description || 'content';
        const hashtags = await TogetherAI.generateHashtags(hashtagContent, platform, platform === 'instagram' ? 15 : 8);
        platformResults.hashtags = hashtags;

        // Generate tags (for YouTube)
        if (platform === 'youtube') {
          try {
            const tagPrompt = `Generate 25 relevant YouTube tags for content about: "${hashtagContent}". Focus on searchable keywords and trending terms in the ${niche} niche. Return ONLY comma-separated tags without hashtag symbols. Example: fitness, workout, health, motivation, exercise`;
            const generatedTags = await TogetherAI.generateCaption(tagPrompt, platform, 'professional');
            
            // Parse the response and clean the tags
            let tagsList: string[] = [];
            if (generatedTags && generatedTags[0]) {
              tagsList = generatedTags[0]
                .split(',')
                .map((tag: string) => tag.replace(/[#]/g, '').trim())
                .filter((tag: string) => tag.length > 0 && tag.split(' ').length <= 3)
                .slice(0, 25);
            }
            
            // If we don't have enough tags, add some default ones based on niche
            if (tagsList.length < 20) {
              const defaultTags = {
                fitness: ['fitness', 'workout', 'health', 'exercise', 'gym', 'training', 'muscle', 'strength'],
                food: ['food', 'recipe', 'cooking', 'kitchen', 'meal', 'nutrition', 'healthy', 'delicious'],
                travel: ['travel', 'adventure', 'explore', 'vacation', 'journey', 'destination', 'culture', 'tourism'],
                technology: ['tech', 'technology', 'innovation', 'digital', 'software', 'gadgets', 'review', 'tutorial'],
                general: ['content', 'viral', 'trending', 'popular', 'entertainment', 'lifestyle', 'tips', 'guide']
              };
              
              const nicheDefaults = defaultTags[niche as keyof typeof defaultTags] || defaultTags.general;
              const missingCount = 25 - tagsList.length;
              tagsList = [...tagsList, ...nicheDefaults.slice(0, missingCount)];
            }
            
            platformResults.tags = tagsList.slice(0, 25);
          } catch (error) {
            console.error('Tag generation failed:', error);
            // Fallback tags
            platformResults.tags = ['content', 'viral', 'trending', 'popular', 'entertainment'];
          }
        }

        // Performance prediction
        try {
          const performance = await TogetherAI.predictPerformance(hashtagContent, platform, []);
          platformResults.performancePrediction = performance;
        } catch (error) {
          console.error('Performance prediction failed:', error);
          platformResults.performancePrediction = null;
        }

        // Optimal posting times
        try {
          const optimalTimes = await TogetherAI.optimizePostingSchedule(hashtagContent, platform, []);
          platformResults.optimalTimes = optimalTimes;
        } catch (error) {
          console.error('Optimal times prediction failed:', error);
          platformResults.optimalTimes = null;
        }

        results[platform] = platformResults;
      } catch (error) {
        console.error(`Error optimizing for ${platform}:`, error);
        results[platform] = {
          error: `Failed to optimize content for ${platform}`
        };
      }
    }

    return NextResponse.json({ 
      success: true, 
      data: results,
      message: 'Content optimized successfully!'
    });

  } catch (error) {
    console.error('Content optimization error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'An unknown error occurred' 
      },
      { status: 500 }
    );
  }
}
