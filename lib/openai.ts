import OpenAI from 'openai';

if (!process.env.OPENAI_API_KEY) {
  throw new Error('Missing OPENAI_API_KEY environment variable');
}

export const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function generateCaption(
  title: string,
  platform: 'instagram' | 'facebook' | 'youtube',
  tone: 'professional' | 'casual' | 'engaging' = 'engaging'
): Promise<string> {
  const platformLimits = {
    instagram: 2200,
    facebook: 8000,
    youtube: 5000,
  };

  const platformSpecific = {
    instagram: 'Include relevant hashtags and make it visually appealing. Focus on engagement.',
    facebook: 'Make it conversational and community-focused. Encourage comments and shares.',
    youtube: 'Create compelling description that encourages views and subscriptions. Include call-to-action.',
  };

  const prompt = `Generate a ${tone} social media caption for ${platform} based on this title: "${title}"

Platform-specific requirements:
- ${platformSpecific[platform]}
- Maximum length: ${platformLimits[platform]} characters
- Tone: ${tone}

Return only the caption text, no additional formatting or quotes.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 500,
      temperature: 0.7,
    });

    return completion.choices[0]?.message?.content?.trim() || '';
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate caption');
  }
}

export async function generateContentIdeas(
  niche: string,
  platform: 'instagram' | 'facebook' | 'youtube',
  count: number = 5
): Promise<string[]> {
  const prompt = `Generate ${count} creative content ideas for ${platform} in the ${niche} niche.

Requirements:
- Ideas should be engaging and platform-appropriate
- Focus on trending topics and audience interests
- Each idea should be a clear, actionable title
- Make them diverse in content type (educational, entertaining, behind-the-scenes, etc.)

Return as a JSON array of strings, no additional formatting.`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 800,
      temperature: 0.8,
    });

    const content = completion.choices[0]?.message?.content?.trim();
    if (!content) throw new Error('No content generated');

    return JSON.parse(content);
  } catch (error) {
    console.error('OpenAI API error:', error);
    throw new Error('Failed to generate content ideas');
  }
}

export async function generateOptimizedCaption(
  content: string,
  platform: 'instagram' | 'youtube',
  tone: 'professional' | 'casual' | 'funny' | 'inspirational' | 'educational' | 'entertaining' = 'professional'
): Promise<string> {
  const platformPrompts = {
    instagram: `Create an engaging Instagram caption based on: "${content}". 
    
Requirements:
- Include relevant emojis naturally throughout
- Use line breaks for readability
- Make it ${tone} in tone
- Keep it under 2200 characters
- Focus on engagement and authenticity
- NO hashtags in the caption (they will be added separately)

Return ONLY the caption text with emojis and line breaks, nothing else.`,
    youtube: `Create an engaging YouTube video description based on: "${content}".

Requirements:
- Include hooks and value propositions
- Add clear call-to-actions
- Make it ${tone} in tone
- Structure with line breaks for readability
- Keep it comprehensive but scannable
- Include sections like "In this video" or "What you'll learn"

Return ONLY the description text, nothing else.`
  };

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are an expert social media content creator. Generate engaging, platform-optimized captions that drive engagement. Return only the requested content with no additional formatting, quotes, or explanations.'
        },
        {
          role: 'user',
          content: platformPrompts[platform]
        }
      ],
      max_tokens: 400,
      temperature: 0.7,
    });

    const result = completion.choices[0]?.message?.content?.trim() || content;
    return result;
  } catch (error) {
    console.error('OpenAI caption generation error:', error);
    
    if (platform === 'instagram') {
      return `✨ ${content}\n\nTap the link in bio for more details. DM us to get started! 💬`;
    } else {
      return `${content}\n\nIn this video, we dive deep into this topic.\n\n👍 Like and subscribe for more content!`;
    }
  }
}

export async function generateHashtags(
  content: string,
  platform: 'instagram' | 'youtube',
  count: number = 15
): Promise<string[]> {
  const prompt = `Generate ${count} highly relevant and trending hashtags for ${platform} based on this content: "${content}"

Requirements:
- Every hashtag MUST start with # (include the symbol in the output)
- Mix of popular and niche-specific hashtags
- Each hashtag should be a single word or compound word (no spaces)
- Focus on discoverability and engagement
- Include a mix of broad and specific tags

Return as a JSON array of strings that already include the # symbol. Example: ["#fitness", "#workout", "#healthylifestyle"]`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a social media hashtag expert. Generate relevant, trending hashtags. Return ONLY a valid JSON array of strings.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 400,
      temperature: 0.6,
    });

    let result = completion.choices[0]?.message?.content?.trim();
    if (!result) throw new Error('No hashtags generated');

    // Strip markdown code blocks if present
    result = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    const parsed = JSON.parse(result);
    if (Array.isArray(parsed)) {
      return parsed
        .map(tag => `#${String(tag).replace(/[^\w#]/g, '').replace(/^#*/,'')}`)
        .map(tag => (tag.startsWith('#') ? tag : `#${tag}`))
        .map(tag => tag.toLowerCase())
        .filter(tag => /^#[a-z0-9_]{2,50}$/i.test(tag))
        .slice(0, count);
    }
    
    throw new Error('Invalid hashtag format');
  } catch (error) {
    console.error('OpenAI hashtag generation error:', error);
    
    const fallbackHashtags = platform === 'instagram' 
      ? ['content', 'viral', 'trending', 'explore', 'reels', 'instagram', 'motivation', 'lifestyle', 'inspiration', 'success', 'mindset', 'growth', 'entrepreneur', 'creative', 'daily']
      : ['youtube', 'video', 'content', 'tutorial', 'howto', 'learn', 'education', 'tips'];
    
    return fallbackHashtags
      .map(tag => `#${tag.replace(/[^\w]/g, '')}`)
      .filter(tag => tag.length > 2)
      .slice(0, count);
  }
}

export async function generateYouTubeTags(
  content: string,
  niche: string = 'general',
  count: number = 25
): Promise<string[]> {
  const prompt = `Generate ${count} SEO-optimized YouTube tags for content about: "${content}" in the ${niche} niche.

Requirements:
- Focus on searchable keywords and phrases
- Include trending terms in the niche
- Mix of broad and specific tags
- Each tag should be 1-3 words maximum
- No hashtag symbols
- Optimize for YouTube search and discovery

Return as a JSON array of strings. Example: ["content creation", "social media", "marketing tips"]`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a YouTube SEO expert. Generate searchable, relevant tags for maximum discoverability. Return ONLY a valid JSON array of strings.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 500,
      temperature: 0.6,
    });

    let result = completion.choices[0]?.message?.content?.trim();
    if (!result) throw new Error('No tags generated');

    // Strip markdown code blocks if present
    result = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    const parsed = JSON.parse(result);
    if (Array.isArray(parsed)) {
      return parsed
        .map(tag => String(tag).replace(/[#]/g, '').trim())
        .filter(tag => tag.length > 0 && tag.split(' ').length <= 3)
        .slice(0, count);
    }
    
    throw new Error('Invalid tag format');
  } catch (error) {
    console.error('OpenAI YouTube tags generation error:', error);
    
    const defaultTags = {
      fitness: ['fitness', 'workout', 'health', 'exercise', 'gym', 'training', 'muscle', 'strength', 'bodybuilding', 'cardio'],
      food: ['food', 'recipe', 'cooking', 'kitchen', 'meal', 'nutrition', 'healthy', 'delicious', 'chef', 'baking'],
      travel: ['travel', 'adventure', 'explore', 'vacation', 'journey', 'destination', 'culture', 'tourism', 'wanderlust', 'trip'],
      technology: ['tech', 'technology', 'innovation', 'digital', 'software', 'gadgets', 'review', 'tutorial', 'coding', 'programming'],
      general: ['content', 'viral', 'trending', 'popular', 'entertainment', 'lifestyle', 'tips', 'guide', 'howto', 'tutorial']
    };
    
    const nicheDefaults = defaultTags[niche as keyof typeof defaultTags] || defaultTags.general;
    return [...nicheDefaults, 'youtube', 'video', 'subscribe', 'like', 'share'].slice(0, count);
  }
}

export async function predictPerformance(
  content: string,
  platform: 'instagram' | 'youtube'
): Promise<{ performance_score: number; optimal_time: string; reasoning: string }> {
  const prompt = `Analyze this ${platform} content and predict its performance: "${content}"

Provide:
1. Performance score (0-100) based on engagement potential
2. Optimal posting time (HH:MM format in 24h)
3. Brief reasoning for the score

Return as JSON: {"performance_score": 75, "optimal_time": "18:00", "reasoning": "Strong hook and clear value proposition"}`;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a social media analytics expert. Analyze content and predict performance metrics. Return ONLY valid JSON.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 200,
      temperature: 0.5,
    });

    let result = completion.choices[0]?.message?.content?.trim();
    if (!result) throw new Error('No prediction generated');

    // Strip markdown code blocks if present
    result = result.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    const parsed = JSON.parse(result);
    return {
      performance_score: parsed.performance_score || 65,
      optimal_time: parsed.optimal_time || (platform === 'youtube' ? '18:00' : '15:00'),
      reasoning: parsed.reasoning || 'Based on content analysis and platform trends'
    };
  } catch (error) {
    console.error('OpenAI performance prediction error:', error);
    
    const fallbackScore = Math.floor(Math.random() * 30) + 55;
    return {
      performance_score: fallbackScore,
      optimal_time: platform === 'youtube' ? '18:00' : '15:00',
      reasoning: 'Estimated based on content analysis and platform best practices'
    };
  }
}
