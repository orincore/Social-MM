'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AIOptimizationPanel } from '@/components/ai/AIOptimizationPanel';
import { AIMediaEditor } from '@/components/ai/AIMediaEditor';
import { AIContentRepurposer } from '@/components/ai/AIContentRepurposer';

type Platform = 'instagram' | 'youtube';

export default function AIStudioPage() {
  const [content, setContent] = useState('');
  const [mediaUrl, setMediaUrl] = useState('');
  const [platform, setPlatform] = useState<Platform>('instagram');
  const [hashtags, setHashtags] = useState<string[]>([]);

  const handleOptimizeComplete = (optimizedContent: string, newHashtags: string[]) => {
    setContent(optimizedContent);
    setHashtags(newHashtags);
  };

  const handleMediaProcessed = (file: File, previewUrl: string) => {
    setMediaUrl(previewUrl);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">AI Content Studio</h1>
        <p className="text-gray-600 mt-2">Leverage AI to create, optimize, and schedule your social media content</p>
      </div>

      <Tabs defaultValue="optimize" className="w-full">
        <TabsList className="grid w-full grid-cols-3 mb-6">
          <TabsTrigger value="optimize">Content Optimizer</TabsTrigger>
          <TabsTrigger value="media">Media Editor</TabsTrigger>
          <TabsTrigger value="repurpose">Content Repurposer</TabsTrigger>
        </TabsList>

        <TabsContent value="optimize">
          <Card>
            <CardHeader>
              <CardTitle>AI Content Optimizer</CardTitle>
              <p className="text-sm text-gray-500">Generate and optimize your social media content with AI</p>
            </CardHeader>
            <CardContent>
              <AIOptimizationPanel 
                initialContent={content}
                platform={platform}
                onOptimizeComplete={handleOptimizeComplete}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="media">
          <Card>
            <CardHeader>
              <CardTitle>AI Media Editor</CardTitle>
              <p className="text-sm text-gray-500">Enhance your images and videos with AI-powered editing</p>
            </CardHeader>
            <CardContent>
              <AIMediaEditor 
                onMediaProcessed={handleMediaProcessed}
                aspectRatio={platform === 'instagram' ? '1:1' : '16:9'}
              />
              {mediaUrl && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-2">Preview:</p>
                  <div className="border rounded-lg p-2 max-w-md">
                    {mediaUrl.endsWith('.mp4') || mediaUrl.endsWith('.webm') ? (
                      <video src={mediaUrl} controls className="w-full rounded" />
                    ) : (
                      <img src={mediaUrl} alt="Preview" className="w-full rounded" />
                    )}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="repurpose">
          <Card>
            <CardHeader>
              <CardTitle>Content Repurposer</CardTitle>
              <p className="text-sm text-gray-500">Adapt your content for different social media platforms</p>
            </CardHeader>
            <CardContent>
              {content ? (
                <AIContentRepurposer 
                  originalContent={content}
                  originalPlatform={platform}
                  onContentGenerated={(platform, content) => {
                    console.log(`Generated content for ${platform}:`, content);
                  }}
                />
              ) : (
                <div className="text-center py-12">
                  <p className="text-gray-500">
                    Generate or enter content in the Content Optimizer first to repurpose it for other platforms.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">Tips for Best Results</h3>
        <ul className="list-disc pl-5 space-y-1 text-sm text-blue-700">
          <li>Use clear and specific prompts when generating content</li>
          <li>Review and edit AI-generated content before posting</li>
          <li>Experiment with different tones and styles to find what works best</li>
          <li>Use high-quality images and videos for the best results</li>
        </ul>
      </div>
    </div>
  );
}
