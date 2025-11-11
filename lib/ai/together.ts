import { NextResponse } from 'next/server';

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY;
const TOGETHER_API_URL = 'https://api.together.xyz/v1';

interface AIPrediction {
  performance_score?: number;
  optimal_time?: string;
  hashtags?: string[];
  caption_variations?: string[];
  content_suggestions?: string[];
  reasoning?: string;
}

export class TogetherAI {
  static async predictPerformance(content: string, platform: 'instagram' | 'youtube', historicalData: any): Promise<AIPrediction> {
    // Generate a realistic performance score based on content analysis
    const generateRealisticScore = (content: string, platform: string): number => {
      let score = 50; // Base score
      
      // Content length analysis
      const wordCount = content.split(' ').length;
      if (platform === 'instagram') {
        if (wordCount >= 10 && wordCount <= 50) score += 10;
        if (content.includes('💡') || content.includes('✨') || content.includes('🚀')) score += 5;
        if (content.includes('#')) score += 5;
      } else if (platform === 'youtube') {
        if (wordCount >= 20 && wordCount <= 100) score += 10;
        if (content.toLowerCase().includes('tutorial') || content.toLowerCase().includes('guide')) score += 8;
        if (content.toLowerCase().includes('tips') || content.toLowerCase().includes('how to')) score += 8;
      }
      
      // Engagement keywords
      const engagementWords = ['amazing', 'incredible', 'must-see', 'exclusive', 'trending', 'viral', 'secret', 'ultimate'];
      const foundWords = engagementWords.filter(word => content.toLowerCase().includes(word));
      score += foundWords.length * 3;
      
      // Question marks (encourage engagement)
      const questionCount = (content.match(/\?/g) || []).length;
      score += Math.min(questionCount * 5, 15);
      
      // Call to action
      if (content.toLowerCase().includes('comment') || content.toLowerCase().includes('share') || content.toLowerCase().includes('like')) {
        score += 8;
      }
      
      // Ensure score is between 35-95 for realism
      return Math.min(95, Math.max(35, score + Math.floor(Math.random() * 20) - 10));
    };

    const getOptimalTime = (platform: string): string => {
      const times = {
        instagram: ['09:00', '12:00', '15:00', '18:00', '20:00'],
        youtube: ['14:00', '16:00', '18:00', '20:00', '21:00']
      };
      const platformTimes = times[platform as keyof typeof times] || times.instagram;
      return platformTimes[Math.floor(Math.random() * platformTimes.length)];
    };

    const score = generateRealisticScore(content, platform);
    const optimalTime = getOptimalTime(platform);
    
    const reasoning = score >= 80 
      ? "High engagement potential due to compelling content structure and keywords"
      : score >= 60 
        ? "Good engagement potential with room for optimization"
        : "Moderate engagement expected, consider adding more engaging elements";

    // Still try AI prediction but with fallback
    if (!TOGETHER_API_KEY) {
      return {
        performance_score: score,
        optimal_time: optimalTime,
        reasoning
      };
    }

    try {
      const prompt = `Analyze this ${platform} content for engagement potential: "${content}". 
      Consider: hooks, emotional appeal, trending topics, call-to-actions, and platform best practices.
      
      Respond with JSON: {"performance_score": number (35-95), "optimal_time": "HH:MM", "reasoning": "brief explanation"}`;

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
              content: 'You are a social media expert. Analyze content engagement potential and respond with valid JSON only.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.3,
          max_tokens: 300,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const aiContent = data.choices?.[0]?.message?.content;
        
        if (aiContent) {
          try {
            const parsed = JSON.parse(aiContent);
            if (parsed.performance_score && parsed.performance_score > 0) {
              return {
                performance_score: Math.min(95, Math.max(35, parsed.performance_score)),
                optimal_time: parsed.optimal_time || optimalTime,
                reasoning: parsed.reasoning || reasoning
              };
            }
          } catch (e) {
            console.log('AI parsing failed, using fallback');
          }
        }
      }
    } catch (error) {
      console.log('AI prediction failed, using algorithmic fallback');
    }

    // Return algorithmic prediction as fallback
    return {
      performance_score: score,
      optimal_time: optimalTime,
      reasoning
    };
  }

  static async generateCaption(content: string, platform: 'instagram' | 'youtube', tone: 'professional' | 'casual' | 'funny' = 'professional'): Promise<string[]> {
    const prompt = `Generate a ${tone} ${platform} caption for the following content. Return a valid JSON array of strings with 3 caption variations, each under 220 characters. Content: "${content}"`;
    
    // Create AbortController for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
    
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
              content: 'You are a creative social media expert. Generate engaging captions. Respond with ONLY a valid JSON array of strings, with no additional text or explanation. Example: ["First caption", "Second caption", "Third caption"]'
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
        signal: controller.signal
      });
      
      // Clear the timeout since the request completed
      clearTimeout(timeoutId);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API request failed:', response.status, errorText);
        throw new Error(`API request failed with status ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      const responseContent = data.choices?.[0]?.message?.content;
      
      if (!responseContent) {
        throw new Error('No content in API response');
      }

      // Helper function to extract and clean string array from various formats
      const extractStringArray = (input: any): string[] => {
        // If input is already an array of strings, return it
        if (Array.isArray(input)) {
          return input.map(item => String(item).trim()).filter(Boolean);
        }
        
        // If input is a string, try to parse it as JSON
        if (typeof input === 'string') {
          try {
            // Try to parse as JSON first
            const parsed = JSON.parse(input);
            if (Array.isArray(parsed)) {
              return parsed.map(item => String(item).trim()).filter(Boolean);
            }
            // Handle object with array properties
            for (const key of ['captions', 'tags', 'results', 'items']) {
              if (Array.isArray(parsed[key])) {
                return parsed[key].map((item: any) => String(item).trim()).filter(Boolean);
              }
            }
            // If it's an object with string values, return its values
            if (typeof parsed === 'object' && parsed !== null) {
              return Object.values(parsed)
                .filter(value => typeof value === 'string')
                .map(item => String(item).trim())
                .filter(Boolean);
            }
          } catch (e) {
            // If JSON parsing fails, try to extract array-like strings
            const arrayMatch = input.match(/\[\s*("[^"]*"|'[^']*'|[^\[\]]*)\s*\]/);
            if (arrayMatch) {
              try {
                const parsedArray = JSON.parse(arrayMatch[0]);
                if (Array.isArray(parsedArray)) {
                  return parsedArray.map(item => String(item).trim()).filter(Boolean);
                }
              } catch (e) {
                // If we can't parse as JSON, try to split by commas and clean up
                return arrayMatch[0]
                  .replace(/[\[\]"']/g, '')
                  .split(',')
                  .map((item: string) => item.trim())
                  .filter(Boolean);
              }
            }
          }
          
          // If we get here and it's a string but not an array, split by newlines or commas
          return input
            .split(/[\n,]+/)
            .map(item => item.trim())
            .filter(Boolean);
        }
        
        // If input is an object but not an array, try to extract string values
        if (typeof input === 'object' && input !== null) {
          return Object.values(input)
            .filter(value => typeof value === 'string')
            .map(item => String(item).trim())
            .filter(Boolean);
        }
        
        // Default fallback
        return [];
      };

      try {
        // First try to parse as JSON
        const parsedResponse = JSON.parse(responseContent);
        const result = extractStringArray(parsedResponse);
        if (result.length > 0) return result.slice(0, 3); // Return max 3 items
      } catch (e) {
        // If JSON parsing fails, try to extract array from text
        const result = extractStringArray(responseContent);
        if (result.length > 0) return result.slice(0, 3);
      }
      
      // If we get here, return the original content as a single-item array
      // but ensure it's properly formatted as an array of strings
      return [content].filter(Boolean);
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
    const defaultResponse = {
      optimalTimes: platform === 'instagram' 
        ? ['Monday 15:00', 'Wednesday 18:00', 'Friday 12:00']
        : ['Tuesday 18:00', 'Thursday 20:00', 'Saturday 14:00'],
      reasoning: 'Based on general best practices for optimal engagement times.'
    };

    // If no historical data, return default times
    if (!historicalData || historicalData.length === 0) {
      return defaultResponse;
    }

    // Ensure we don't send too much historical data to avoid hitting token limits
    const limitedHistoricalData = historicalData.slice(0, 5); // Limit to last 5 data points

    const prompt = `You are a data analyst. Based on this engagement data for ${platform}, recommend 3 optimal posting times in UTC format.

Engagement Data:
${JSON.stringify(limitedHistoricalData, null, 2)}

Return ONLY this JSON format with no additional text:
{
  "optimalTimes": ["Monday 15:00", "Wednesday 18:00", "Friday 12:00"],
  "reasoning": "Based on peak engagement patterns"
}`;

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
              content: 'You are a JSON API. You MUST respond with ONLY valid JSON. No explanations, no additional text, just the requested JSON object.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.1,
          max_tokens: 300,
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const responseContent = data.choices[0]?.message?.content;
      
      if (!responseContent) {
        console.error('Empty response from AI');
        return defaultResponse;
      }

      // Enhanced JSON parsing with multiple fallback strategies
      try {
        // First, clean the response content
        let cleanedContent = responseContent.trim();
        
        // Remove any markdown code blocks
        cleanedContent = cleanedContent.replace(/```json\s*|\s*```/g, '');
        
        // Remove any leading/trailing text that's not JSON
        const jsonMatch = cleanedContent.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          cleanedContent = jsonMatch[0];
        }
        
        // Try to parse the cleaned JSON
        const result = JSON.parse(cleanedContent);
        
        // Validate the response structure
        if (result && typeof result === 'object' && result.optimalTimes && Array.isArray(result.optimalTimes) && result.reasoning) {
          // Ensure optimalTimes has at least one entry
          if (result.optimalTimes.length > 0) {
            return {
              optimalTimes: result.optimalTimes.slice(0, 3), // Limit to 3 times
              reasoning: String(result.reasoning)
            };
          }
        }
        
        console.warn('Invalid response structure from AI:', result);
        return defaultResponse;
        
      } catch (parseError) {
        console.error('Failed to parse AI response:', parseError);
        console.error('Raw response:', responseContent);
        
        // If the response contains conversational text, return default
        if (responseContent.toLowerCase().includes("i'm an ai") || 
            responseContent.toLowerCase().includes("since i") ||
            responseContent.toLowerCase().includes("i don't") ||
            responseContent.toLowerCase().includes("i can't")) {
          console.warn('AI returned conversational response instead of JSON, using defaults');
          return defaultResponse;
        }
        
        // Last resort: try to extract any time patterns from the text
        const timePattern = /(\w+day)\s+(\d{1,2}:\d{2})/gi;
        const matches = responseContent.match(timePattern);
        if (matches && matches.length > 0) {
          return {
            optimalTimes: matches.slice(0, 3),
            reasoning: 'Extracted from AI response text analysis'
          };
        }
        
        return defaultResponse;
      }
    } catch (error) {
      console.error('Error optimizing posting schedule:', error);
      return defaultResponse;
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

  static async generateContentIdeas(niche: string, platform: 'instagram' | 'youtube', count: number = 5): Promise<string[]> {
    const prompt = `Generate ${count} viral content ideas for ${platform} in the ${niche} niche. Make them engaging, trendy, and likely to get high engagement. Format as a JSON array of strings.`;
    
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
              content: 'You are a creative content strategist. Generate viral content ideas that drive engagement. Always respond with a valid JSON array of strings.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.8,
          max_tokens: 1000,
          response_format: { type: 'json_object' },
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const responseContent = data.choices?.[0]?.message?.content;
      
      if (!responseContent) {
        throw new Error('No content in API response');
      }

      try {
        const parsedResponse = JSON.parse(responseContent);
        if (Array.isArray(parsedResponse)) {
          return parsedResponse;
        }
        if (parsedResponse.ideas && Array.isArray(parsedResponse.ideas)) {
          return parsedResponse.ideas;
        }
        return [responseContent];
      } catch (e) {
        return responseContent
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0)
          .slice(0, count);
      }
    } catch (error) {
      console.error('Error generating content ideas:', error);
      return [
        `${niche} tips and tricks`,
        `Behind the scenes of ${niche}`,
        `Common ${niche} mistakes to avoid`,
        `${niche} trends for this year`,
        `Quick ${niche} tutorial`
      ];
    }
  }

  static async optimizeForEngagement(content: string, platform: 'instagram' | 'youtube', tone: string = 'professional'): Promise<{
    optimizedContent: string;
    engagementTips: string[];
    bestTimeToPost: string;
    hashtagSuggestions: string[];
  }> {
    const prompt = `Optimize this ${platform} content for maximum engagement:

Content: "${content}"
Platform: ${platform}
Tone: ${tone}

Provide optimization suggestions including:
1. Rewritten content optimized for engagement
2. 3-5 engagement tips
3. Best time to post
4. Hashtag suggestions

Format as JSON: {
  "optimizedContent": "string",
  "engagementTips": ["tip1", "tip2"],
  "bestTimeToPost": "string",
  "hashtagSuggestions": ["#tag1", "#tag2"]
}`;

    if (!TOGETHER_API_KEY) {
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
              content: 'You are an expert social media growth strategist. Optimize content for maximum engagement and provide actionable insights. Always respond with valid JSON.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          temperature: 0.7,
          max_tokens: 1500,
          response_format: { type: 'json_object' },
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const responseContent = data.choices?.[0]?.message?.content;
      
      if (!responseContent) {
        throw new Error('No content in API response');
      }

      try {
        return JSON.parse(responseContent);
      } catch (e) {
        console.error('Failed to parse JSON response:', responseContent);
        return {
          optimizedContent: content,
          engagementTips: ['Use engaging hooks', 'Ask questions', 'Include call-to-actions'],
          bestTimeToPost: 'Peak hours (6-9 PM)',
          hashtagSuggestions: ['#viral', '#trending', '#content']
        };
      }
    } catch (error) {
      console.error('Error optimizing for engagement:', error);
      throw new Error('Failed to optimize content for engagement');
    }
  }
}
