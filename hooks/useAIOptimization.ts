import { useState } from 'react';

type AIPrediction = {
  performance_score?: number;
  optimal_time?: string;
  reasoning?: string;
};

type AIContentSuggestion = {
  title: string;
  description: string;
};

export const useAIOptimization = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAIData = async (endpoint: string, body: any) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const requestBody = {
        ...body,
        action: endpoint,
      };

      console.log(`Sending ${endpoint} request:`, requestBody);
      
      const response = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const responseData = await response.json();
      console.log(`Received ${endpoint} response:`, responseData);
      
      if (!response.ok) {
        console.error(`AI ${endpoint} error:`, response.status, responseData);
        throw new Error(responseData.error || 'Failed to fetch AI data');
      }

      // Return the data property if it exists, otherwise return the entire response
      return responseData.data || responseData;
    } catch (err) {
      console.error(`AI ${endpoint} error:`, err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      throw err; // Re-throw to allow individual functions to handle specific errors
    } finally {
      setIsLoading(false);
    }
  };

  const predictPerformance = async (content: string, platform: 'instagram' | 'youtube', historicalData: any[]) => {
    return await fetchAIData('predict-performance', {
      content,
      platform,
      historicalData,
    }) as AIPrediction;
  };

  const generateCaption = async (content: string, platform: 'instagram' | 'youtube', tone: 'professional' | 'casual' | 'funny' = 'professional') => {
    return await fetchAIData('generate-caption', {
      content,
      platform,
      tone,
    }) as string[];
  };

  const generateHashtags = async (content: string, platform: 'instagram' | 'youtube', count: number = 10) => {
    return await fetchAIData('generate-hashtags', {
      content,
      platform,
      hashtagCount: count,
    }) as string[];
  };

  const analyzeContentGap = async (content: string, historicalPosts: any[], niche: string, platform: 'instagram' | 'youtube') => {
    return await fetchAIData('analyze-gap', {
      content,
      platform,
      historicalData: historicalPosts,
      niche,
    }) as AIContentSuggestion[];
  };

  const getOptimalPostingTimes = async (content: string, platform: 'instagram' | 'youtube', historicalData: any[]) => {
    return await fetchAIData('optimal-times', {
      content,
      platform,
      historicalData,
    }) as { optimalTimes: string[], reasoning: string };
  };

  return {
    isLoading,
    error,
    predictPerformance,
    generateCaption,
    generateHashtags,
    analyzeContentGap,
    getOptimalPostingTimes,
  };
};
