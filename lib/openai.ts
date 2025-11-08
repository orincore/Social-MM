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
