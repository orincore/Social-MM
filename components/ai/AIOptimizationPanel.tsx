'use client';

import { useState } from 'react';
import { useAIOptimization } from '@/hooks/useAIOptimization';
import { Button } from '@/components/ui/button';
import { Loader2, Sparkles, Clock, Hash, Lightbulb, BarChart2 } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
type Platform = 'instagram' | 'youtube';

// Simple cn utility for class name concatenation
function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

interface AIOptimizationPanelProps {
  initialContent?: string;
  platform: Platform;
  historicalData?: any[];
  niche?: string;
  onOptimizeComplete?: (optimizedContent: string, hashtags: string[]) => void;
}

export function AIOptimizationPanel({
  initialContent = '',
  platform,
  historicalData = [],
  niche = 'general',
  onOptimizeComplete,
}: AIOptimizationPanelProps) {
  const [content, setContent] = useState(initialContent);
  const [tone, setTone] = useState<'professional' | 'casual' | 'funny'>('professional');
  const [activeTab, setActiveTab] = useState('captions');
  const [uiError, setUiError] = useState<string | null>(null);
  
  const {
    isLoading,
    error: apiError,
    predictPerformance,
    generateCaption,
    generateHashtags,
    analyzeContentGap,
    getOptimalPostingTimes,
  } = useAIOptimization();

  interface ContentIdea {
    title: string;
    description: string;
  }

  const [suggestions, setSuggestions] = useState<{
    captions: string[];
    hashtags: string[];
    performance?: {
      score: number;
      optimalTime: string;
      reasoning: string;
    };
    contentIdeas: ContentIdea[];
    optimalTimes: { times: string[]; reasoning: string };
  }>({
    captions: [],
    hashtags: [],
    contentIdeas: [],
    optimalTimes: { times: [], reasoning: '' },
  });

  const handleGenerateAll = async () => {
    if (!content.trim()) {
      setUiError('Please enter some content to analyze');
      return;
    }

    try {
      setUiError(null);
      
      // Clear previous suggestions
      setSuggestions({
        captions: [],
        hashtags: [],
        contentIdeas: [],
        optimalTimes: { times: [], reasoning: '' },
        performance: undefined
      });
      
      // Process requests in parallel for better performance
      const [captions, hashtags, performance, gapAnalysis, optimalTimes] = await Promise.all([
        generateCaption(content, platform, tone).catch(e => {
          console.warn('Caption generation failed:', e);
          return [];
        }),
        generateHashtags(content, platform, 10).catch(e => {
          console.warn('Hashtag generation failed:', e);
          return [];
        }),
        predictPerformance(content, platform, historicalData || []).catch(e => {
          console.warn('Performance prediction failed:', e);
          return { performance_score: 0, optimal_time: '', reasoning: 'Unable to generate prediction at this time.' };
        }),
        analyzeContentGap(content, historicalData || [], niche || 'general', platform).catch(e => {
          console.warn('Gap analysis failed:', e);
          return [];
        }),
        getOptimalPostingTimes(content, platform, historicalData || []).catch(e => {
          console.warn('Optimal times analysis failed:', e);
          return { times: [], reasoning: 'Unable to determine optimal posting times.' };
        })
      ]);

      // Map performance data to match the expected interface
      const mappedPerformance = performance ? {
        score: performance.performance_score ?? 0,
        optimalTime: performance.optimal_time ?? '',
        reasoning: performance.reasoning ?? ''
      } : undefined;

      // Process content ideas to ensure they're in the correct format
      const processedContentIdeas = (() => {
        if (!Array.isArray(gapAnalysis)) return [];
        
        return gapAnalysis.map(item => {
          try {
            // If it's already in the correct format, return as is
            if (item && typeof item === 'object' && 'title' in item && 'description' in item) {
              return {
                title: String(item.title || 'Content Idea'),
                description: String(item.description || '')
              };
            }
            
            // If it's a string, convert to the expected format
            if (typeof item === 'string') {
              return { 
                title: 'Content Idea', 
                description: item 
              };
            }
            
            // If it's an object but not in the expected format, try to extract values
            if (item && typeof item === 'object') {
              const safeItem = item as Record<string, any>;
              return {
                title: String(safeItem.title || safeItem.heading || 'Content Idea'),
                description: String(safeItem.description || safeItem.content || JSON.stringify(item))
              };
            }
            
            // Fallback for any other case
            return { 
              title: 'Content Idea', 
              description: String(item) 
            };
          } catch (error) {
            console.error('Error processing content idea:', item, error);
            return { 
              title: 'Content Idea', 
              description: 'Failed to process this content idea' 
            };
          }
        });
      })();

      setSuggestions(prev => ({
        ...prev,
        captions: Array.isArray(captions) ? captions : [],
        hashtags: Array.isArray(hashtags) ? hashtags : [],
        performance: mappedPerformance,
        contentIdeas: processedContentIdeas.length > 0 ? processedContentIdeas : prev.contentIdeas,
        optimalTimes: optimalTimes && typeof optimalTimes === 'object' ? 
          { 
            times: 'optimalTimes' in optimalTimes && Array.isArray(optimalTimes.optimalTimes) 
              ? optimalTimes.optimalTimes 
              : 'times' in optimalTimes && Array.isArray(optimalTimes.times) 
                ? optimalTimes.times 
                : [],
            reasoning: optimalTimes.reasoning || ''
          } : 
          prev.optimalTimes,
      }));

      // Auto-select the first caption and hashtags if available
      if (captions?.[0] && hashtags?.length > 0) {
        onOptimizeComplete?.(captions[0], hashtags);
      }
      
      // If we're on a different tab, switch to captions tab after generation
      if (activeTab !== 'captions') {
        setActiveTab('captions');
      }
    } catch (err) {
      console.error('Error generating AI content:', err);
      setUiError('Failed to generate AI suggestions. Please try again later.');
    }
  };

  const PerformanceMeter = ({ score }: { score?: number | null }) => {
    // Handle null, undefined, or non-number scores
    if (score === null || score === undefined || typeof score !== 'number' || isNaN(score)) {
      return (
        <div className="w-full bg-gray-200 rounded-full h-4">
          <div className="h-4 rounded-full bg-gray-300"></div>
          <div className="text-sm text-center mt-1 text-gray-500">N/A</div>
        </div>
      );
    }
    
    // Ensure score is between 0 and 100
    const safeScore = Math.min(100, Math.max(0, score));
    
    // Determine color based on score
    const getColor = (s: number) => {
      if (s >= 80) return 'bg-green-500';
      if (s >= 50) return 'bg-yellow-500';
      return 'bg-red-500';
    };

    return (
      <div className="w-full bg-gray-200 rounded-full h-4">
        <div 
          className={`h-4 rounded-full ${getColor(safeScore)}`}
          style={{ width: `${safeScore}%` }}
        ></div>
        <div className="text-sm text-center mt-1">
          {`${safeScore.toFixed(1)}/100`}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter your post content or topic..."
          rows={4}
          className="min-h-[120px]"
        />
        
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium">Tone:</span>
            <select
              value={tone}
              onChange={(e) => setTone(e.target.value as any)}
              className="rounded-md border p-2 text-sm"
              disabled={isLoading}
            >
              <option value="professional">Professional</option>
              <option value="casual">Casual</option>
              <option value="funny">Funny</option>
            </select>
          </div>
          
          <Button
            onClick={handleGenerateAll}
            disabled={isLoading || !content.trim()}
            className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                Optimize with AI
              </>
            )}
          </Button>
        </div>
      </div>

      {(uiError || apiError) && (
        <div className="p-4 bg-red-50 text-red-700 rounded-md text-sm">
          {uiError || apiError}
        </div>
      )}

      {(suggestions.captions.length > 0 || isLoading) && (
        <Tabs 
          value={activeTab} 
          onValueChange={setActiveTab}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="captions" className="flex items-center gap-2">
              <span className="text-sm">Captions</span>
            </TabsTrigger>
            <TabsTrigger value="hashtags" className="flex items-center gap-2">
              <Hash className="h-4 w-4" />
              <span className="text-sm">Hashtags</span>
            </TabsTrigger>
            <TabsTrigger value="performance" className="flex items-center gap-2">
              <BarChart2 className="h-4 w-4" />
              <span className="text-sm">Performance</span>
            </TabsTrigger>
            <TabsTrigger value="insights" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              <span className="text-sm">Insights</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="captions" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {suggestions.captions.map((caption, idx) => (
                  <Card 
                    key={idx} 
                    className="cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      setContent(caption);
                      onOptimizeComplete?.(caption, suggestions.hashtags);
                    }}
                  >
                    <CardContent className="p-4">
                      <p className="whitespace-pre-line">{caption}</p>
                      <div className="mt-3 flex justify-end">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigator.clipboard.writeText(caption);
                          }}
                        >
                          Copy
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="hashtags" className="space-y-4">
            {isLoading ? (
              <div className="flex justify-center p-8">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <div className="flex flex-wrap gap-2">
                {suggestions.hashtags.map((tag, idx) => (
                  <Button
                    key={idx}
                    variant="outline"
                    size="sm"
                    className="rounded-full"
                    onClick={() => {
                      const newContent = `${content}\n\n${tag}`;
                      setContent(newContent);
                      onOptimizeComplete?.(newContent, suggestions.hashtags);
                    }}
                  >
                    {tag}
                  </Button>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="performance" className="space-y-4">
            {isLoading && activeTab === 'performance' ? (
              <div className="flex flex-col items-center justify-center p-8 space-y-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-gray-500">Analyzing content and predicting performance...</p>
              </div>
            ) : suggestions.performance?.score !== undefined ? (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Performance Prediction</CardTitle>
                    <div className="text-2xl font-bold">
                      {suggestions.performance?.score !== undefined && 
                      suggestions.performance.score !== null &&
                      !isNaN(suggestions.performance.score) ? 
                        `${suggestions.performance.score.toFixed(1)}/100` : 'N/A'}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Engagement Score</h4>
                      <PerformanceMeter score={suggestions.performance?.score} />
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Optimal Posting Time</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-700">
                        <Clock className="h-4 w-4" />
                        <span>{suggestions.performance.optimalTime || 'Not available'}</span>
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-2">Analysis</h4>
                      <p className="text-sm text-gray-600">
                        {suggestions.performance.reasoning || 
                         (historicalData?.length === 0 ? 
                          'No historical data available for analysis. Performance predictions will improve as you post more content.' : 
                          'No analysis available.')}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="text-center p-8 text-gray-500">
                <BarChart2 className="h-10 w-10 mx-auto mb-2 text-gray-300" />
                <p className="font-medium">Performance Prediction</p>
                <p className="text-sm mt-1">Generate content to see performance predictions and insights</p>
              </div>
            )}
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Optimal Posting Times
                </CardTitle>
              </CardHeader>
              <CardContent>
                {suggestions.optimalTimes?.times?.length > 0 ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {suggestions.optimalTimes.times.map((time, idx) => (
                        <div key={idx} className="bg-gray-50 p-3 rounded-md">
                          <div className="font-medium">{time}</div>
                        </div>
                      ))}
                    </div>
                    {suggestions.optimalTimes.reasoning && (
                      <p className="text-sm text-gray-600 mt-2">
                        {suggestions.optimalTimes.reasoning}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="text-center p-4 text-gray-500">
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    ) : (
                      <Clock className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                    )}
                    <p>Generate content to see optimal posting times</p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  Content Ideas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {suggestions.contentIdeas.length > 0 ? (
                  <div className="space-y-4">
                    {suggestions.contentIdeas.map((idea, idx) => {
                      // Handle case where idea is a string (legacy format) or an object with title/description
                      if (typeof idea === 'string') {
                        return (
                          <div key={idx} className="border-b pb-3 last:border-0 last:pb-0">
                            <p className="text-sm text-gray-600">{idea}</p>
                          </div>
                        );
                      }
                      
                      // Handle object format with title and description
                      return (
                        <div key={idx} className="border-b pb-3 last:border-0 last:pb-0">
                          {idea.title && <h4 className="font-medium">{idea.title}</h4>}
                          <p className="text-sm text-gray-600">
                            {typeof idea.description === 'string' 
                              ? idea.description 
                              : JSON.stringify(idea)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center p-4 text-gray-500">
                    {isLoading ? (
                      <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2" />
                    ) : (
                      <Lightbulb className="h-6 w-6 mx-auto mb-2 text-gray-300" />
                    )}
                    <p>Generate content to see personalized content ideas</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
