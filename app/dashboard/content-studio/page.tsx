'use client';

import { useState } from 'react';
import { Sparkles, Image, Video, Type, Hash, Calendar, Upload, Wand2, Copy, Download } from 'lucide-react';
import ProtectedRoute from '@/components/protected-route';

export default function ContentStudio() {
  const [activeTab, setActiveTab] = useState<'ai-captions' | 'hashtags' | 'templates' | 'scheduler'>('ai-captions');
  const [captionPrompt, setCaptionPrompt] = useState('');
  const [generatedCaptions, setGeneratedCaptions] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const generateCaptions = async () => {
    if (!captionPrompt.trim()) return;
    
    setLoading(true);
    try {
      // Mock AI caption generation - replace with actual OpenAI API call
      const mockCaptions = [
        "✨ Embracing the magic of everyday moments! What's bringing you joy today? #MondayMotivation #LifeStyle #Positivity",
        "🌟 Sometimes the smallest steps lead to the biggest changes. Keep moving forward! #Growth #Inspiration #MondayVibes",
        "💫 Creating my own sunshine on this beautiful day! How are you brightening your world? #SelfCare #Happiness #Mindfulness"
      ];
      
      setTimeout(() => {
        setGeneratedCaptions(mockCaptions);
        setLoading(false);
      }, 2000);
    } catch (error) {
      console.error('Error generating captions:', error);
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    // Add toast notification here
  };

  const trendingHashtags = [
    { tag: '#MondayMotivation', posts: '2.1M' },
    { tag: '#ContentCreator', posts: '5.4M' },
    { tag: '#SmallBusiness', posts: '8.2M' },
    { tag: '#Entrepreneur', posts: '12.5M' },
    { tag: '#DigitalMarketing', posts: '3.8M' },
    { tag: '#SocialMedia', posts: '15.2M' },
  ];

  const contentTemplates = [
    {
      id: 1,
      name: 'Product Showcase',
      description: 'Perfect for highlighting your products',
      category: 'Business',
      thumbnail: '/api/placeholder/300/200'
    },
    {
      id: 2,
      name: 'Behind the Scenes',
      description: 'Show your audience the process',
      category: 'Lifestyle',
      thumbnail: '/api/placeholder/300/200'
    },
    {
      id: 3,
      name: 'Quote Card',
      description: 'Inspirational quotes with beautiful design',
      category: 'Motivation',
      thumbnail: '/api/placeholder/300/200'
    },
    {
      id: 4,
      name: 'Before & After',
      description: 'Show transformation or progress',
      category: 'Business',
      thumbnail: '/api/placeholder/300/200'
    },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between py-6">
              <div className="flex items-center">
                <Sparkles className="h-8 w-8 text-purple-600" />
                <div className="ml-3">
                  <h1 className="text-2xl font-bold text-gray-900">Content Studio</h1>
                  <p className="text-sm text-gray-600">AI-powered content creation tools</p>
                </div>
              </div>
            </div>
            
            {/* Tabs */}
            <div className="border-b">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: 'ai-captions', name: 'AI Captions', icon: Wand2 },
                  { id: 'hashtags', name: 'Hashtag Research', icon: Hash },
                  { id: 'templates', name: 'Templates', icon: Image },
                  { id: 'scheduler', name: 'Scheduler', icon: Calendar },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-purple-500 text-purple-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="h-4 w-4 mr-2" />
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* AI Captions Tab */}
          {activeTab === 'ai-captions' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Input Section */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <Wand2 className="h-5 w-5 text-purple-500 mr-2" />
                    AI Caption Generator
                  </h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Describe your content or mood
                      </label>
                      <textarea
                        value={captionPrompt}
                        onChange={(e) => setCaptionPrompt(e.target.value)}
                        placeholder="e.g., Motivational Monday post about starting fresh, new product launch, behind the scenes of my workspace..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 resize-none"
                        rows={4}
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                          <option>Professional</option>
                          <option>Casual</option>
                          <option>Inspirational</option>
                          <option>Funny</option>
                          <option>Educational</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Length</label>
                        <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500">
                          <option>Short (1-2 lines)</option>
                          <option>Medium (3-5 lines)</option>
                          <option>Long (6+ lines)</option>
                        </select>
                      </div>
                    </div>
                    
                    <button
                      onClick={generateCaptions}
                      disabled={loading || !captionPrompt.trim()}
                      className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Generate Captions
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Generated Captions */}
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Generated Captions</h3>
                </div>
                <div className="p-6">
                  {generatedCaptions.length > 0 ? (
                    <div className="space-y-4">
                      {generatedCaptions.map((caption, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4">
                          <p className="text-gray-800 mb-3 whitespace-pre-line">{caption}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500">Option {index + 1}</span>
                            <button
                              onClick={() => copyToClipboard(caption)}
                              className="flex items-center text-purple-600 hover:text-purple-700 text-sm font-medium"
                            >
                              <Copy className="h-4 w-4 mr-1" />
                              Copy
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Wand2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">Generated captions will appear here</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Hashtag Research Tab */}
          {activeTab === 'hashtags' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Trending Hashtags</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-3">
                    {trendingHashtags.map((hashtag, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium text-blue-600">{hashtag.tag}</span>
                        <div className="flex items-center space-x-3">
                          <span className="text-sm text-gray-500">{hashtag.posts} posts</span>
                          <button
                            onClick={() => copyToClipboard(hashtag.tag)}
                            className="text-purple-600 hover:text-purple-700"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow-sm">
                <div className="px-6 py-4 border-b">
                  <h3 className="text-lg font-semibold text-gray-900">Hashtag Generator</h3>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <input
                      type="text"
                      placeholder="Enter keywords (e.g., fitness, food, travel)"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <button className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700">
                      Generate Hashtags
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Templates Tab */}
          {activeTab === 'templates' && (
            <div>
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Content Templates</h3>
                  <button className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 flex items-center">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload Custom
                  </button>
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {contentTemplates.map((template) => (
                  <div key={template.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
                    <div className="aspect-video bg-gray-200 flex items-center justify-center">
                      <Image className="h-12 w-12 text-gray-400" />
                    </div>
                    <div className="p-4">
                      <h4 className="font-semibold text-gray-900 mb-1">{template.name}</h4>
                      <p className="text-sm text-gray-600 mb-2">{template.description}</p>
                      <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 text-xs rounded-full">
                        {template.category}
                      </span>
                      <button className="w-full mt-3 bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 text-sm">
                        Use Template
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Scheduler Tab */}
          {activeTab === 'scheduler' && (
            <div className="bg-white rounded-lg shadow-sm">
              <div className="px-6 py-4 border-b">
                <h3 className="text-lg font-semibold text-gray-900">Content Scheduler</h3>
              </div>
              <div className="p-6">
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-gray-900 mb-2">Advanced Scheduler Coming Soon</h4>
                  <p className="text-gray-600 mb-6">
                    Schedule your content across multiple platforms with our advanced calendar view.
                  </p>
                  <button className="bg-purple-600 text-white py-2 px-6 rounded-lg hover:bg-purple-700">
                    Get Notified
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
}
