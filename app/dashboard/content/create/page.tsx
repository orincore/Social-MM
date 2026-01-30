'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, Image, Video, Type, Hash, Send, Clock, CheckCircle, AlertCircle, Upload, X, Instagram, Youtube, Sparkles, Lightbulb, TrendingUp, Target, Zap, RefreshCw, Copy, ThumbsUp, Eye, BarChart3, Clock3 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { uploadToR2 } from '@/lib/client-upload';

interface ConnectedAccount {
  platform: string;
  username: string;
  connected: boolean;
}

export default function CreateContent() {
  const { data: session } = useSession();
  const router = useRouter();
  
  // Form state
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [title, setTitle] = useState(''); // For YouTube
  const [description, setDescription] = useState(''); // For YouTube
  const [tags, setTags] = useState(''); // For YouTube
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string>('');
  const [scheduleType, setScheduleType] = useState<'now' | 'later'>('now');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [shareToFeed, setShareToFeed] = useState(true);
  const [thumbOffset, setThumbOffset] = useState(0);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  
  // AI Enhancement States
  const [aiOptimizing, setAiOptimizing] = useState(false);
  const [aiOptimized, setAiOptimized] = useState(false);
  const [aiResults, setAiResults] = useState<any>(null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [contentIdeas, setContentIdeas] = useState<string[]>([]);
  const [loadingIdeas, setLoadingIdeas] = useState(false);
  const [niche, setNiche] = useState('general');
  const [customNiche, setCustomNiche] = useState('');
  const [tone, setTone] = useState<'professional' | 'casual' | 'funny' | 'inspirational' | 'educational' | 'entertaining'>('professional');
  const [showOptimizationResults, setShowOptimizationResults] = useState(false);
  const [activeTab, setActiveTab] = useState<'content'>('content');
  
  // Load connected accounts
  useEffect(() => {
    const fetchConnectedAccounts = async () => {
      try {
        const [igResponse, ytResponse] = await Promise.all([
          fetch('/api/instagram/status'),
          fetch('/api/youtube/status')
        ]);
        
        const igData = await igResponse.json();
        const ytData = await ytResponse.json();
        
        const accounts: ConnectedAccount[] = [];
        
        if (igData.connected) {
          accounts.push({
            platform: 'instagram',
            username: igData.account?.username || 'Instagram',
            connected: true
          });
        }
        
        if (ytData.connected) {
          accounts.push({
            platform: 'youtube',
            username: ytData.channel?.title || 'YouTube',
            connected: true
          });
        }
        
        setConnectedAccounts(accounts);
      } catch (error) {
        console.error('Error fetching connected accounts:', error);
      }
    };
    
    fetchConnectedAccounts();
  }, []);

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type for Instagram compatibility
      const isVideo = file.type.startsWith('video/');
      const isMp4 = file.type === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4');
      
      if (isVideo && !isMp4) {
        alert('⚠️ Instagram Reels only support MP4 format.\n\nPlease convert your video to MP4 with these specs:\n• Format: MP4 (H.264 video codec, AAC audio)\n• Aspect Ratio: Vertical 9:16 (e.g., 1080x1920)\n• Duration: 3-60 seconds\n• Max Size: 100MB');
        e.target.value = ''; // Clear the input
        return;
      }
      
      // Validate file size
      const maxSize = 100 * 1024 * 1024; // 100MB
      if (file.size > maxSize) {
        alert('⚠️ File size too large!\n\nMaximum size: 100MB\nYour file: ' + (file.size / (1024 * 1024)).toFixed(2) + 'MB\n\nPlease compress your video or reduce its duration.');
        e.target.value = '';
        return;
      }
      
      const minSize = 10 * 1024; // 10KB
      if (file.size < minSize) {
        alert('⚠️ File size too small. The video file may be corrupted.\n\nPlease upload a valid video file.');
        e.target.value = '';
        return;
      }
      
      setMediaFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setMediaPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeMedia = () => {
    setMediaFile(null);
    setMediaPreview('');
  };

  const togglePlatform = (platform: string) => {
    setSelectedPlatforms(prev => {
      const next = prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform];
      if (!next.includes('instagram')) {
        setShareToFeed(true);
        setThumbOffset(0);
      }
      
      // Keep on content tab
      
      return next;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform');
      return;
    }
    
    if (!caption.trim() && !title.trim()) {
      alert('Please add content text');
      return;
    }

    // Validate platform-specific requirements with fallbacks
    if (selectedPlatforms.includes('youtube')) {
      if (!title.trim() && !caption.trim()) {
        alert('YouTube videos require either a title or caption to generate a title');
        return;
      }
    }

    if (selectedPlatforms.includes('instagram')) {
      if (!caption.trim()) {
        alert('Instagram posts require a caption');
        return;
      }
    }
    
    setLoading(true);
    
    try {
      // Upload media if present using direct R2 upload (bypasses serverless size limits)
      let mediaUrl = '';
      if (mediaFile) {
        const uploadResult = await uploadToR2(mediaFile);
        
        if (!uploadResult.success) {
          throw new Error(uploadResult.error || 'Upload failed');
        }
        
        mediaUrl = uploadResult.fileUrl;
      }
      
      // Create content for each selected platform
      const contentPromises = selectedPlatforms.map(async (platform) => {
        const contentData: any = {
          platform,
          mediaUrl,
          scheduledAt: scheduleType === 'later' && scheduledDate && scheduledTime 
            ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
            : new Date(Date.now() + 10000).toISOString(), // Publish in 10 seconds for "now"
          status: 'scheduled' // Always use scheduled status - let queue handle publishing
        };

        // Platform-specific fields with fallbacks
        if (platform === 'youtube') {
          // Generate fallback title if not provided
          let finalTitle = title.trim();
          if (!finalTitle) {
            // Use first 60 characters of caption as title
            finalTitle = caption.trim().substring(0, 60).replace(/\n/g, ' ').trim();
            if (!finalTitle) {
              finalTitle = 'Untitled Video';
            }
          }
          
          // Generate fallback description if not provided
          let finalDescription = description.trim();
          if (!finalDescription) {
            finalDescription = caption.trim() || 'No description provided';
          }
          
          contentData.title = finalTitle;
          contentData.description = finalDescription;
          contentData.caption = finalDescription; // YouTube uses description as caption
          contentData.tags = tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [];
        } else if (platform === 'instagram') {
          contentData.caption = caption;
          contentData.instagramOptions = {
            shareToFeed,
            thumbOffset
          };
        }
        
        const response = await fetch('/api/content', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(contentData)
        });
        
        if (!response.ok) {
          throw new Error(`Failed to create content for ${platform}`);
        }
        
        return response.json();
      });
      
      await Promise.all(contentPromises);
      
      const message = scheduleType === 'now' 
        ? 'Content queued for publishing! It will be published in a few seconds.'
        : 'Content scheduled successfully!';
      
      alert(message);
      router.push('/dashboard');
      setMediaFile(null);
      setMediaPreview('');
      setCaption('');
      setTitle('');
      setDescription('');
      setTags('');
      setScheduleType('now');
      setScheduledDate('');
      setScheduledTime('');
      setSelectedPlatforms([]);
      setShareToFeed(true);
      setThumbOffset(0);
      
      alert('Content published successfully! You can create another post.');
      
    } catch (error) {
      console.error('Error creating content:', error);
      alert('Error creating content. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const generateContentIdeas = async () => {
    setLoadingIdeas(true);
    try {
      const selectedNiche = niche === 'custom' ? customNiche : niche;
      const response = await fetch('/api/ai/optimize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: `Generate content ideas for ${selectedNiche} niche with ${tone} tone`,
          platform: selectedPlatforms[0] || 'instagram',
          action: 'analyze-gap',
          niche: selectedNiche,
          tone: tone
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          // Process the data to extract strings from objects
          const processedIdeas = data.data.slice(0, 5).map((item: any) => {
            if (typeof item === 'string') {
              return item;
            }
            if (item && typeof item === 'object') {
              // If it has title and description, combine them
              if (item.title && item.description) {
                return `${item.title}: ${item.description}`;
              }
              // If it only has description, use that
              if (item.description) {
                return item.description;
              }
              // If it only has title, use that
              if (item.title) {
                return item.title;
              }
              // Fallback to JSON string
              return JSON.stringify(item);
            }
            // Fallback to string conversion
            return String(item);
          });
          setContentIdeas(processedIdeas);
        }
      }
    } catch (error) {
      console.error('Error generating content ideas:', error);
    } finally {
      setLoadingIdeas(false);
    }
  };

  const optimizeWithAI = async () => {
    if (selectedPlatforms.length === 0) {
      alert('Please select at least one platform first');
      return;
    }

    if (!title.trim() && !caption.trim() && !description.trim()) {
      alert('Please enter some content to optimize');
      return;
    }

    setAiOptimizing(true);
    try {
      const response = await fetch('/api/ai/optimize-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title,
          caption,
          description,
          tags,
          platforms: selectedPlatforms,
          tone,
          niche
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('AI Optimization Response:', data);
        if (data.success) {
          setAiResults(data.data);
          setAiOptimized(true);
          setShowOptimizationResults(true);
          
          // Apply optimizations to form fields
          selectedPlatforms.forEach(platform => {
            const platformData = data.data[platform];
            if (platformData) {
              if (platform === 'youtube' && platformData.optimizedTitle) {
                setTitle(platformData.optimizedTitle);
              }
              if (platformData.optimizedCaption) {
                if (platform === 'instagram') {
                  // Format Instagram caption with proper structure
                  let formattedCaption = platformData.optimizedCaption;
                  if (platformData.hashtags && Array.isArray(platformData.hashtags)) {
                    const hashtags = platformData.hashtags
                      .map((tag: string) => (tag.startsWith('#') ? tag : `#${tag}`))
                      .slice(0, 20)
                      .join(' ');
                    formattedCaption = `${formattedCaption}\n.\n.\n.\n.\n.\n.\n${hashtags}`;
                  }
                  setCaption(formattedCaption);
                } else if (platform === 'youtube') {
                  setDescription(platformData.optimizedCaption);
                }
              }
              if (platform === 'youtube' && platformData.tags) {
                console.log('Raw tags from API:', platformData.tags);
                // Generate 20-25 tags without '#' symbols, separated by commas
                const cleanTags = Array.isArray(platformData.tags) 
                  ? platformData.tags
                      .map((tag: string) => tag.replace(/[#]/g, '').trim())
                      .filter((tag: string) => tag.length > 0 && tag.split(' ').length <= 3)
                      .slice(0, 25)
                  : [];
                
                console.log('Processed tags:', cleanTags);
                if (cleanTags.length > 0) {
                  setTags(cleanTags.join(', '));
                }
              }
            }
          });
        }
      }
    } catch (error) {
      console.error('Error optimizing content:', error);
      alert('Failed to optimize content. Please try again.');
    } finally {
      setAiOptimizing(false);
    }
  };

  const applyContentIdea = (idea: string) => {
    if (selectedPlatforms.includes('youtube')) {
      setTitle(idea);
      setDescription(`Learn about ${idea}. This comprehensive guide will help you understand everything you need to know.`);
    }
    if (selectedPlatforms.includes('instagram')) {
      const hashtags = '#content #viral #trending #explore #fyp #reels #instagram #motivation #lifestyle #inspiration #success #mindset #growth #entrepreneur #creative';
      setCaption(`✨ ${idea}\n\nWhat do you think about this? Let me know in the comments! 👇\n.\n.\n.\n.\n.\n.\n${hashtags}`);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Content</h1>
              <p className="mt-1 text-gray-600">Create and schedule content across your social media platforms</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Column - Main Form */}
          <div className="lg:col-span-2">
            <form onSubmit={handleSubmit} className="space-y-6">

              {/* Platform Selection */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Select Platforms</h2>
                  <div className="text-sm text-gray-500">
                    {selectedPlatforms.length > 0 ? (
                      <span className="bg-indigo-100 text-indigo-800 px-2 py-1 rounded-full">
                        {selectedPlatforms.length} selected
                      </span>
                    ) : (
                      'Choose platforms to get started'
                    )}
                  </div>
                </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {connectedAccounts.map((account) => (
                <div
                  key={account.platform}
                  onClick={() => togglePlatform(account.platform)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all transform hover:scale-105 ${
                    selectedPlatforms.includes(account.platform)
                      ? account.platform === 'instagram' 
                        ? 'border-pink-500 bg-gradient-to-r from-pink-50 to-purple-50 shadow-md'
                        : 'border-red-500 bg-gradient-to-r from-red-50 to-orange-50 shadow-md'
                      : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-center">
                    {account.platform === 'instagram' ? (
                      <Instagram className="h-6 w-6 text-pink-500 mr-3" />
                    ) : (
                      <Youtube className="h-6 w-6 text-red-500 mr-3" />
                    )}
                    <div>
                      <p className="font-medium text-gray-900 capitalize">{account.platform}</p>
                      <p className="text-sm text-gray-600">{account.username}</p>
                    </div>
                    {selectedPlatforms.includes(account.platform) && (
                      <CheckCircle className="h-5 w-5 text-indigo-500 ml-auto" />
                    )}
                  </div>
                </div>
              ))}
            </div>
            
            {connectedAccounts.length === 0 && (
              <div className="text-center py-8">
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No social media accounts connected</p>
                <div className="space-x-4">
                  <Link
                    href="/connect/instagram"
                    className="bg-pink-600 text-white px-4 py-2 rounded-lg hover:bg-pink-700 transition-colors inline-flex items-center"
                  >
                    <Instagram className="h-4 w-4 mr-2" />
                    Connect Instagram
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors inline-flex items-center"
                  >
                    <Youtube className="h-4 w-4 mr-2" />
                    Connect YouTube
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Media Upload */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900">Media Upload</h2>
              {mediaFile && (
                <div className="flex items-center text-green-600 bg-green-50 px-2 py-1 rounded-full">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">File Ready</span>
                </div>
              )}
            </div>
            
                {!mediaPreview ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-indigo-400 transition-colors">
                    <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4 font-medium">Upload Media for Your Content</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                      <div className="bg-pink-50 border border-pink-200 rounded-lg p-3">
                        <Instagram className="h-5 w-5 text-pink-600 mx-auto mb-2" />
                        <p className="text-xs font-medium text-pink-800 mb-1">Instagram Reels</p>
                        <p className="text-xs text-pink-600">9:16 ratio, MP4, max 60s</p>
                      </div>
                      <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                        <Youtube className="h-5 w-5 text-red-600 mx-auto mb-2" />
                        <p className="text-xs font-medium text-red-800 mb-1">YouTube Shorts</p>
                        <p className="text-xs text-red-600">9:16 ratio, MP4, max 60s</p>
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mb-4">
                      <strong>Supported formats:</strong> MP4, MOV, AVI, WebM (Max 100MB)
                    </p>
                    <input
                      type="file"
                      accept="video/*"
                      onChange={handleMediaUpload}
                      className="hidden"
                      id="media-upload"
                    />
                    <label
                      htmlFor="media-upload"
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all cursor-pointer inline-flex items-center font-medium"
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Choose Media File
                    </label>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <div>
                          <span className="font-medium text-gray-900">Media Ready</span>
                          <p className="text-xs text-gray-600">
                            {mediaFile?.name} ({((mediaFile?.size || 0) / 1024 / 1024).toFixed(2)} MB)
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeMedia}
                        className="bg-red-500 text-white p-2 rounded-full hover:bg-red-600 transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Preview available in the sidebar →
                    </p>
                  </div>
                )}
          </div>


              {/* Instagram Section */}
              {selectedPlatforms.includes('instagram') && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-2 rounded-lg mr-3">
                        <Instagram className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">Instagram Content</h2>
                        <p className="text-sm text-gray-600">Create engaging content for Instagram Reels</p>
                        <p className="text-xs text-gray-500">AI optimization is optional - you can publish without it</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={optimizeWithAI}
                      disabled={aiOptimizing || !caption.trim()}
                      className="flex items-center px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {aiOptimizing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Optimizing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Optimize with AI
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Instagram Caption
                    </label>
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Write your Instagram caption here... AI will format it with proper hashtags!"
                      rows={8}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      AI will automatically format your caption with dots and 15-20 powerful hashtags
                    </p>
                  </div>
                </div>
              )}

              {/* YouTube Section */}
              {selectedPlatforms.includes('youtube') && (
                <div className="bg-white rounded-lg shadow-sm border p-6">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="bg-gradient-to-r from-red-500 to-orange-500 p-2 rounded-lg mr-3">
                        <Youtube className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-gray-900">YouTube Content</h2>
                        <p className="text-sm text-gray-600">Create optimized content for YouTube Shorts</p>
                        <p className="text-xs text-gray-500">AI optimization is optional - you can publish without it</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={optimizeWithAI}
                      disabled={aiOptimizing || (!title.trim() && !description.trim())}
                      className="flex items-center px-4 py-2 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-lg hover:from-red-700 hover:to-orange-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {aiOptimizing ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Optimizing...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-4 w-4 mr-2" />
                          Optimize with AI
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Video Title
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="Enter your YouTube video title..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Video Description
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="Write your YouTube video description..."
                        rows={4}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tags (Keywords)
                      </label>
                      <input
                        type="text"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="fitness, workout, health, motivation, exercise, gym, training, bodybuilding, nutrition, wellness"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        AI will generate 20-25 relevant tags without '#' symbols, separated by commas
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Scheduling Section */}
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center mb-6">
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-500 p-2 rounded-lg mr-3">
                    <Clock className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900">Schedule & Publish</h2>
                    <p className="text-sm text-gray-600">Choose when to publish your content</p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="scheduleType"
                        value="now"
                        checked={scheduleType === 'now'}
                        onChange={(e) => setScheduleType(e.target.value as 'now' | 'later')}
                        className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">Publish Now</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="scheduleType"
                        value="later"
                        checked={scheduleType === 'later'}
                        onChange={(e) => setScheduleType(e.target.value as 'now' | 'later')}
                        className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                      />
                      <span className="ml-2 text-sm font-medium text-gray-700">Schedule for Later</span>
                    </label>
                  </div>

                  {scheduleType === 'later' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                        <input
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                        <input
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={loading || selectedPlatforms.length === 0}
                  className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {scheduleType === 'now' ? 'Publishing...' : 'Scheduling...'}
                    </>
                  ) : (
                    <>
                      {scheduleType === 'now' ? (
                        <>
                          <Send className="h-4 w-4 mr-2" />
                          Publish Now
                        </>
                      ) : (
                        <>
                          <Calendar className="h-4 w-4 mr-2" />
                          Schedule Post
                        </>
                      )}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Sidebar - AI Insights & Content Ideas */}
          <div className="lg:col-span-1 space-y-6">
            {/* Media Preview */}
            {mediaPreview && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <Video className="h-5 w-5 text-indigo-500 mr-2" />
                    <h3 className="text-lg font-semibold text-gray-900">Media Preview</h3>
                  </div>
                  <div className="text-xs text-gray-500">
                    9:16 Format
                  </div>
                </div>
                
                <div className="flex justify-center">
                  {mediaFile?.type.startsWith('image/') ? (
                    <img
                      src={mediaPreview}
                      alt="Preview"
                      className="w-48 h-80 object-cover rounded-lg border-2 border-gray-200 shadow-lg"
                      style={{ aspectRatio: '9/16' }}
                    />
                  ) : (
                    <video
                      src={mediaPreview}
                      controls
                      className="w-48 h-80 object-cover rounded-lg border-2 border-gray-200 shadow-lg"
                      style={{ aspectRatio: '9/16' }}
                    />
                  )}
                </div>
                
                <div className="mt-4 text-center">
                  <p className="text-xs text-gray-600">
                    {mediaFile?.name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {((mediaFile?.size || 0) / 1024 / 1024).toFixed(2)} MB • Perfect for Reels & Shorts
                  </p>
                </div>
              </div>
            )}

            {/* Content Ideas */}
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <Lightbulb className="h-5 w-5 text-yellow-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">Content Ideas</h3>
                </div>
              </div>

              {/* Category Selection */}
              <div className="space-y-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Category
                  </label>
                  <select
                    value={niche}
                    onChange={(e) => setNiche(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="general">General</option>
                    <option value="fitness">Fitness & Health</option>
                    <option value="food">Food & Cooking</option>
                    <option value="travel">Travel & Adventure</option>
                    <option value="fashion">Fashion & Style</option>
                    <option value="technology">Technology</option>
                    <option value="business">Business & Entrepreneurship</option>
                    <option value="lifestyle">Lifestyle</option>
                    <option value="education">Education & Learning</option>
                    <option value="entertainment">Entertainment</option>
                    <option value="beauty">Beauty & Skincare</option>
                    <option value="photography">Photography</option>
                    <option value="art">Art & Design</option>
                    <option value="music">Music</option>
                    <option value="sports">Sports</option>
                    <option value="parenting">Parenting & Family</option>
                    <option value="finance">Finance & Investment</option>
                    <option value="motivation">Motivation & Self-Help</option>
                    <option value="custom">Custom Category</option>
                  </select>
                </div>

                {/* Custom Category Input */}
                {niche === 'custom' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Category
                    </label>
                    <input
                      type="text"
                      value={customNiche}
                      onChange={(e) => setCustomNiche(e.target.value)}
                      placeholder="Enter your custom category..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                    />
                  </div>
                )}

                {/* Tone Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content Tone
                  </label>
                  <select
                    value={tone}
                    onChange={(e) => setTone(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  >
                    <option value="professional">Professional</option>
                    <option value="casual">Casual & Friendly</option>
                    <option value="funny">Funny & Humorous</option>
                    <option value="inspirational">Inspirational & Motivational</option>
                    <option value="educational">Educational & Informative</option>
                    <option value="entertaining">Entertaining & Engaging</option>
                  </select>
                </div>

                {/* Generate Button */}
                <button
                  onClick={generateContentIdeas}
                  disabled={loadingIdeas || (niche === 'custom' && !customNiche.trim())}
                  className="w-full px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {loadingIdeas ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Generating Ideas...
                    </>
                  ) : (
                    <>
                      <Lightbulb className="h-4 w-4 mr-2" />
                      Generate Content Ideas
                    </>
                  )}
                </button>
              </div>
              
              {contentIdeas.length > 0 ? (
                <div className="space-y-3">
                  {contentIdeas.map((idea, index) => (
                    <div key={index} className="p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                      <p className="text-sm text-gray-700 mb-2">{idea}</p>
                      <button
                        onClick={() => applyContentIdea(idea)}
                        className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
                      >
                        Use This Idea
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Lightbulb className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 text-sm">Click "Get Content Ideas" to generate viral content suggestions</p>
                </div>
              )}
            </div>

            {/* AI Optimization Results */}
            {showOptimizationResults && aiResults && (
              <div className="bg-white rounded-lg shadow-sm border p-6">
                <div className="flex items-center mb-4">
                  <TrendingUp className="h-5 w-5 text-green-500 mr-2" />
                  <h3 className="text-lg font-semibold text-gray-900">AI Insights</h3>
                </div>
                
                {selectedPlatforms.map(platform => {
                  const platformData = aiResults[platform];
                  if (!platformData || platformData.error) return null;
                  
                  return (
                    <div key={platform} className="mb-6 last:mb-0">
                      <div className="flex items-center mb-3">
                        {platform === 'instagram' ? (
                          <Instagram className="h-4 w-4 text-pink-500 mr-2" />
                        ) : (
                          <Youtube className="h-4 w-4 text-red-500 mr-2" />
                        )}
                        <h4 className="font-medium text-gray-900 capitalize">{platform}</h4>
                      </div>
                      
                      {/* Performance Prediction */}
                      {platformData.performancePrediction && (
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                          <div className="flex items-center mb-2">
                            <BarChart3 className="h-4 w-4 text-blue-600 mr-2" />
                            <span className="text-sm font-medium text-blue-900">Performance Score</span>
                          </div>
                          <div className="flex items-center">
                            <div className="flex-1 bg-blue-200 rounded-full h-2 mr-3">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${platformData.performancePrediction.performance_score || 0}%` }}
                              ></div>
                            </div>
                            <span className="text-sm font-bold text-blue-900">
                              {platformData.performancePrediction.performance_score || 0}%
                            </span>
                          </div>
                        </div>
                      )}
                      
                      {/* Optimal Times */}
                      {platformData.optimalTimes && platformData.optimalTimes.optimalTimes && (
                        <div className="mb-4 p-3 bg-green-50 rounded-lg">
                          <div className="flex items-center mb-2">
                            <Clock3 className="h-4 w-4 text-green-600 mr-2" />
                            <span className="text-sm font-medium text-green-900">Best Times to Post</span>
                          </div>
                          <div className="space-y-1">
                            {platformData.optimalTimes.optimalTimes.slice(0, 3).map((time: string, idx: number) => (
                              <p key={idx} className="text-xs text-green-800">{time}</p>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Hashtags Preview */}
                      {platformData.hashtags && platformData.hashtags.length > 0 && (
                        <div className="mb-4 p-3 bg-purple-50 rounded-lg">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center">
                              <Hash className="h-4 w-4 text-purple-600 mr-2" />
                              <span className="text-sm font-medium text-purple-900">AI Hashtags</span>
                            </div>
                            <button
                              onClick={() => copyToClipboard(platformData.hashtags.join(' '))}
                              className="text-xs text-purple-600 hover:text-purple-700"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                          <div className="flex flex-wrap gap-1">
                            {platformData.hashtags.slice(0, 8).map((tag: string, idx: number) => (
                              <span key={idx} className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            {/* AI Tips */}
            <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg border border-indigo-200 p-6">
              <div className="flex items-center mb-4">
                <Target className="h-5 w-5 text-indigo-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Growth Tips</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-start">
                  <ThumbsUp className="h-4 w-4 text-green-500 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">Use AI optimization to increase engagement by up to 300%</p>
                </div>
                <div className="flex items-start">
                  <Eye className="h-4 w-4 text-blue-500 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">Post during optimal times for maximum visibility</p>
                </div>
                <div className="flex items-start">
                  <Sparkles className="h-4 w-4 text-purple-500 mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm text-gray-700">Include trending hashtags to reach new audiences</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
