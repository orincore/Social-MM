import { NextResponse } from 'next/server';

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
const TOGETHER_API_URL = 'https://api.together.xyz/v1';

interface AIPrediction {
  performance_score?: number;
  optimal_time?: string;
  hashtags?: string[];
  caption_variations?: string[];
  content_suggestions?: string[];
}

export class TogetherAI {
  static async predictPerformance(content: string, platform: 'instagram' | 'youtube', historicalData: any): Promise<AIPrediction> {
    const prompt = `Based on the following historical performance data and new content, predict the engagement score (1-100) and suggest optimal posting time:
    
Historical Data (last 10 posts):
${JSON.stringify(historicalData, null, 2)}

New Content:
${content}

Platform: ${platform}

Format response as JSON with: {"performance_score": number, "optimal_time": "HH:MM", "reasoning": "brief explanation"}`;

    if (!TOGETHER_API_KEY) {
      console.error('TOGETHER_API_KEY is not set');
      throw new Error('AI service configuration error');
    }

    try {
      const response = await fetch(`${TOGETHER_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOGETHER_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
          messages: [
            {
              role: 'system',
              content: 'You are an expert social media analyst. Provide data-driven predictions in JSON format. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 500,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API request failed:', response.status, errorText);
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      // Extract the content and parse it as JSON
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        throw new Error('No content in API response');
      }

      // Try to parse the content as JSON
      try {
        return JSON.parse(content);
      } catch (e) {
        console.error('Failed to parse JSON response:', content);
        // If parsing fails, try to extract JSON from markdown code blocks
        const jsonMatch = content.match(/```(?:json)?\n([\s\S]*?)\n```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            return JSON.parse(jsonMatch[1]);
          } catch (e) {
            console.error('Failed to parse JSON from markdown:', jsonMatch[1]);
          }
        }
        throw new Error('Invalid JSON response from AI');
      }
    } catch (error) {
      console.error('Error predicting performance:', error);
      throw new Error('Failed to generate performance prediction');
    }
  }

  static async generateCaption(content: string, platform: 'instagram' | 'youtube', tone: 'professional' | 'casual' | 'funny' = 'professional'): Promise<string[]> {
    const prompt = `Generate 3 engaging ${tone} captions for ${platform} about: ${content}. Include relevant emojis and line breaks. Return the captions as a JSON array of strings.`;
    
    if (!TOGETHER_API_KEY) {
      console.error('TOGETHER_API_KEY is not set');
      throw new Error('AI service configuration error');
    }

    try {
      const response = await fetch(`${TOGETHER_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOGETHER_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
          messages: [
            {
              role: 'system',
              content: 'You are a creative social media expert. Generate engaging captions. Always respond with a valid JSON array of strings.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 500,
          response_format: { type: 'json_object' },
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API request failed:', response.status, errorText);
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const responseContent = data.choices?.[0]?.message?.content;
      
      if (!responseContent) {
        throw new Error('No content in API response');
      }

      // Try to parse the response as JSON
      try {
        const parsedResponse = JSON.parse(responseContent);
        // If the response is an array, return it directly
        if (Array.isArray(parsedResponse)) {
          return parsedResponse;
        }
        // If the response is an object with a 'captions' property
        if (parsedResponse.captions && Array.isArray(parsedResponse.captions)) {
          return parsedResponse.captions;
        }
        // If the response is an object with a 'result' property
        if (parsedResponse.result && Array.isArray(parsedResponse.result)) {
          return parsedResponse.result;
        }
        // If we can't find an array in the response, return the content as a single-item array
        return [responseContent];
      } catch (e) {
        console.error('Failed to parse JSON response, falling back to text processing');
        // Fallback: try to split by newlines and filter out empty lines
        return responseContent
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0);
      }
    } catch (error) {
      console.error('Error generating captions:', error);
      // Return a fallback caption if there's an error
      return [
        `Check out my ${tone} post about: ${content}`,
        `Sharing my thoughts on: ${content}`,
        `New ${platform} post: ${content}`
      ];
    }
  }

  static async generateHashtags(content: string, platform: 'instagram' | 'youtube', count: number = 10): Promise<string[]> {
    const prompt = `Generate ${count} relevant hashtags for ${platform} about: ${content}. Return only the hashtags, one per line.`;
    
    try {
      const response = await fetch(`${TOGETHER_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOGETHER_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
          messages: [
            {
              role: 'system',
              content: 'You are a social media expert. Generate relevant hashtags.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.5,
          max_tokens: 100,
        }),
      });

      const data = await response.json();
      return data.choices[0].message.content
        .split('\n')
        .map((tag: string) => tag.trim())
        .filter((tag: string) => tag.startsWith('#'));
    } catch (error) {
      console.error('Error generating hashtags:', error);
      return [];
    }
  }

  static async analyzeContentGap(content: string, historicalPosts: any[], niche: string): Promise<string[]> {
    const prompt = `Analyze the following content and suggest 5 content ideas that would fill gaps in the ${niche} niche.

Current Content:
${content}

Previous Posts:
${JSON.stringify(historicalPosts.map(p => ({
      content: p.caption || p.title,
      engagement: p.engagement_rate || 0,
      date: p.publishedAt
    })), null, 2)}

Provide the response as a JSON array of content ideas with title and description.`;

    try {
      const response = await fetch(`${TOGETHER_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOGETHER_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
          messages: [
            {
              role: 'system',
              content: 'You are a content strategist. Analyze content gaps and suggest new ideas.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1000,
        }),
      });

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Error analyzing content gap:', error);
      return [];
    }
  }

  static async optimizePostingSchedule(content: string, platform: 'instagram' | 'youtube', historicalData: any[]): Promise<{optimalTimes: string[], reasoning: string}> {
    const prompt = `Based on the following content and engagement data, suggest the 3 best times to post on ${platform} (in UTC). Consider day of week and hour.

Content to be posted:
${content}

Engagement Data:
${JSON.stringify(historicalData, null, 2)}

Respond with a JSON object containing: {"optimalTimes": ["Day HH:MM"], "reasoning": "brief explanation"}`;

    try {
      const response = await fetch(`${TOGETHER_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOGETHER_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
          messages: [
            {
              role: 'system',
              content: 'You are a social media scheduling expert. Analyze engagement patterns to recommend optimal posting times.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 500,
        }),
      });

      const data = await response.json();
      return JSON.parse(data.choices[0].message.content);
    } catch (error) {
      console.error('Error optimizing posting schedule:', error);
      return {
        optimalTimes: [],
        reasoning: 'Not enough data to determine optimal posting times.'
      };
    }
  }

  static async repurposeContent(content: string, fromPlatform: string, toPlatform: string): Promise<{ content: string }> {
    if (!TOGETHER_API_KEY) {
      console.error('TOGETHER_API_KEY is not set');
      throw new Error('AI service configuration error');
    }

    const prompt = `Repurpose the following ${fromPlatform} content for ${toPlatform}. Consider the platform's best practices and formatting requirements.

Original ${fromPlatform} content:
${content}

Repurposed for ${toPlatform} (include appropriate formatting, hashtags, and emojis):`;

    try {
      const response = await fetch(`${TOGETHER_API_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TOGETHER_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
          messages: [
            {
              role: 'system',
              content: 'You are a social media expert specializing in content repurposing. Format the content appropriately for each platform, using the right tone, style, and formatting.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 2000,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API request failed:', response.status, errorText);
        throw new Error(`Failed to repurpose content: ${response.statusText}`);
      }

      const data = await response.json();
      const repurposedContent = data.choices[0].message.content;
      
      return { content: repurposedContent };
    } catch (error) {
      console.error('Error repurposing content:', error);
      throw new Error('Failed to repurpose content');
    }
  }
}
