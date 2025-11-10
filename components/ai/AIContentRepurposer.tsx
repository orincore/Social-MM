'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2, RefreshCw, Copy, Check, Sparkles } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { PlatformBadge } from '@/components/ui/platform-badge';

type Platform = 'instagram' | 'youtube' | 'tiktok' | 'twitter' | 'linkedin' | 'facebook';

interface PlatformConfig {
  id: Platform;
  name: string;
  icon: string;
  maxLength: number;
  placeholder: string;
  apiValue: string;
}

const PLATFORMS: PlatformConfig[] = [
  {
    id: 'instagram',
    name: 'Instagram',
    icon: '📷',
    maxLength: 2200,
    placeholder: 'Write an engaging Instagram caption...',
    apiValue: 'instagram',
  },
  {
    id: 'youtube',
    name: 'YouTube',
    icon: '▶️',
    maxLength: 5000,
    placeholder: 'Write a YouTube description...',
    apiValue: 'youtube',
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    icon: '🎵',
    maxLength: 150,
    placeholder: 'Write a TikTok caption...',
    apiValue: 'tiktok',
  },
  {
    id: 'twitter',
    name: 'Twitter',
    icon: '🐦',
    maxLength: 280,
    placeholder: 'Write a Tweet...',
    apiValue: 'twitter',
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: '💼',
    maxLength: 3000,
    placeholder: 'Write a LinkedIn post...',
    apiValue: 'linkedin',
  },
  {
    id: 'facebook',
    name: 'Facebook',
    icon: '👍',
    maxLength: 63206,
    placeholder: 'Write a Facebook post that encourages engagement and sharing...',
    apiValue: 'facebook',
  },
];

interface AIContentRepurposerProps {
  originalContent: string;
  originalPlatform: Platform;
  onContentGenerated?: (platform: Platform, content: string) => void;
}

export function AIContentRepurposer({
  originalContent,
  originalPlatform,
  onContentGenerated,
}: AIContentRepurposerProps) {
  const [isLoading, setIsLoading] = useState<Record<Platform, boolean>>(
    PLATFORMS.reduce((acc, platform) => ({
      ...acc,
      [platform.id]: false,
    }), {} as Record<Platform, boolean>)
  );
  
  const [generatedContent, setGeneratedContent] = useState<Record<Platform, string>>(
    PLATFORMS.reduce((acc, platform) => ({
      ...acc,
      [platform.id]: '',
    }), {} as Record<Platform, string>)
  );
  
  const [copied, setCopied] = useState<Record<Platform, boolean>>(
    PLATFORMS.reduce((acc, platform) => ({
      ...acc,
      [platform.id]: false,
    }), {} as Record<Platform, boolean>)
  );
  
  const [activeTab, setActiveTab] = useState<Platform>('instagram');
  
  const generateForPlatform = async (platform: Platform) => {
    if (!originalContent.trim()) return;
    
    setIsLoading(prev => ({ ...prev, [platform]: true }));
    setGeneratedContent(prev => ({
      ...prev,
      [platform]: '',
    }));
    
    try {
      const response = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: 'repurpose-content',
          content: originalContent,
          platform: PLATFORMS.find(p => p.id === platform)?.apiValue || platform,
          fromPlatform: originalPlatform,
          toPlatform: platform,
        }),
      });
      
      // First, read the response as text
      const responseText = await response.text();
      
      // Then try to parse it as JSON if possible
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (error) {
        // If not JSON, use the raw text as an error message
        if (!response.ok) {
          throw new Error(responseText || 'Failed to parse response');
        }
        responseData = { content: responseText };
      }
      
      if (!response.ok) {
        throw new Error(responseData.error || response.statusText || 'Failed to generate content');
      }
      
      // Use the parsed response data
      const data = responseData;
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to process content');
      }
      
      const repurposedContent = data.data?.content || data.content;
      
      if (!repurposedContent) {
        throw new Error('No content was generated');
      }
      
      setGeneratedContent(prev => ({
        ...prev,
        [platform]: repurposedContent,
      }));
      
      onContentGenerated?.(platform, data.content);
    } catch (error) {
      console.error('Error generating content for', platform, error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to generate content';
      setGeneratedContent(prev => ({
        ...prev,
        [platform]: `Error: ${errorMessage}`,
      }));
    } finally {
      setIsLoading(prev => ({ ...prev, [platform]: false }));
    }
  };
  
  const generateForAllPlatforms = async () => {
    for (const platform of PLATFORMS) {
      if (platform.id !== originalPlatform) {
        await generateForPlatform(platform.id);
      }
    }
  };
  
  const handleCopy = (platform: Platform) => {
    navigator.clipboard.writeText(generatedContent[platform] || '');
    setCopied(prev => ({
      ...prev,
      [platform]: true,
    }));
    
    setTimeout(() => {
      setCopied(prev => ({
        ...prev,
        [platform]: false,
      }));
    }, 2000);
  };
  
  const currentPlatform = PLATFORMS.find(p => p.id === activeTab);
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="font-medium">Repurpose for Different Platforms</h3>
        <Button 
          size="sm" 
          variant="outline"
          onClick={generateForAllPlatforms}
          disabled={!originalContent.trim() || Object.values(isLoading).some(Boolean)}
        >
          {Object.values(isLoading).some(Boolean) ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Generate All
            </>
          )}
        </Button>
      </div>
      
      <Tabs 
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as Platform)}
        className="w-full"
      >
        <div className="relative">
          <TabsList className="w-full justify-start overflow-x-auto">
            {PLATFORMS
              .filter(platform => platform.id !== originalPlatform)
              .map((platform) => (
                <TabsTrigger 
                  key={platform.id} 
                  value={platform.id}
                  className="flex items-center gap-2"
                >
                  <span>{platform.icon}</span>
                  <span className="hidden sm:inline">{platform.name}</span>
                </TabsTrigger>
              ))}
          </TabsList>
        </div>
        
        {PLATFORMS
          .filter(platform => platform.id !== originalPlatform)
          .map((platform) => (
            <TabsContent key={platform.id} value={platform.id} className="mt-4">
              <div className="relative">
                <Textarea
                  value={generatedContent[platform.id]}
                  onChange={(e) => {
                    setGeneratedContent(prev => ({
                      ...prev,
                      [platform.id]: e.target.value,
                    }));
                  }}
                  placeholder={platform.placeholder}
                  className="min-h-[200px] w-full"
                  maxLength={platform.maxLength}
                />
                <div className="absolute top-2 right-2 flex gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleCopy(platform.id)}
                    disabled={!generatedContent[platform.id]}
                    className="h-8 w-8"
                  >
                    {copied[platform.id] ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => generateForPlatform(platform.id)}
                    disabled={isLoading[platform.id] || !originalContent.trim()}
                    className="h-8"
                  >
                    {isLoading[platform.id] ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Sparkles className="h-4 w-4 mr-2" />
                    )}
                    Regenerate
                  </Button>
                </div>
                <div className="text-xs text-right mt-1 text-gray-500">
                  {generatedContent[platform.id]?.length || 0} / {platform.maxLength} characters
                </div>
              </div>
              
              {platform.id === 'instagram' && (
                <div className="mt-4 p-4 bg-amber-50 rounded-md text-amber-800 text-sm">
                  <h4 className="font-medium mb-2 flex items-center">
                    <span className="mr-2">💡</span> Instagram Tips
                  </h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Use 3-5 relevant hashtags for better discoverability</li>
                    <li>Include a call-to-action to boost engagement</li>
                    <li>Add line breaks for better readability</li>
                    <li>Consider adding a question to encourage comments</li>
                  </ul>
                </div>
              )}
              
              {platform.id === 'youtube' && (
                <div className="mt-4 p-4 bg-blue-50 rounded-md text-blue-800 text-sm">
                  <h4 className="font-medium mb-2 flex items-center">
                    <span className="mr-2">📺</span> YouTube Best Practices
                  </h4>
                  <ul className="list-disc pl-5 space-y-1">
                    <li>Include timestamps for key moments in the video</li>
                    <li>Add relevant links in the description</li>
                    <li>Use keywords naturally in the first 2-3 lines</li>
                    <li>Include a call-to-action to like, comment, and subscribe</li>
                  </ul>
                </div>
              )}
            </TabsContent>
          ))}
      </Tabs>
      
      <div className="flex items-center justify-between text-sm text-gray-500 mt-4">
        <div>
          Original content from: <PlatformBadge platform={originalPlatform} />
        </div>
        <div className="text-xs">
          AI-generated content may require review and editing
        </div>
      </div>
    </div>
  );
}
