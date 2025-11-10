'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Calendar, Image, Video, Type, Hash, Send, Clock, CheckCircle, AlertCircle, Upload, X, Instagram, Youtube } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

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

    // Validate platform-specific requirements
    if (selectedPlatforms.includes('youtube')) {
      if (!title.trim()) {
        alert('YouTube videos require a title');
        return;
      }
      if (!description.trim()) {
        alert('YouTube videos require a description');
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
      // Upload media if present
      let mediaUrl = '';
      if (mediaFile) {
        const formData = new FormData();
        formData.append('file', mediaFile);
        
        // Auto-detect and include file type
        const fileType = mediaFile.type.startsWith('video/') ? 'video' : 'image';
        formData.append('type', fileType);
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          mediaUrl = uploadData.fileUrl;
        } else {
          const errorData = await uploadResponse.json();
          throw new Error(`Upload failed: ${errorData.error || 'Unknown error'}`);
        }
      }
      
      // Create content for each selected platform
      const contentPromises = selectedPlatforms.map(async (platform) => {
        const contentData: any = {
          platform,
          mediaUrl,
          scheduledAt: scheduleType === 'later' && scheduledDate && scheduledTime 
            ? new Date(`${scheduledDate}T${scheduledTime}`).toISOString()
            : undefined,
          status: scheduleType === 'now' ? 'publishing' : 'scheduled'
        };

        // Platform-specific fields
        if (platform === 'youtube') {
          contentData.title = title;
          contentData.description = description;
          contentData.caption = description; // YouTube uses description as caption
          contentData.tags = tags.split(',').map(t => t.trim()).filter(Boolean);
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
      
      // Reset form for next content creation
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

  const generateAICaption = async () => {
    if (!caption.trim()) {
      alert('Please enter a topic or description first');
      return;
    }
    
    try {
      const response = await fetch('/api/ai/generate-caption', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt: caption })
      });
      
      if (response.ok) {
        const data = await response.json();
        setCaption(data.caption);
      }
    } catch (error) {
      console.error('Error generating AI caption:', error);
    }
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Platform Selection */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Select Platforms</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {connectedAccounts.map((account) => (
                <div
                  key={account.platform}
                  onClick={() => togglePlatform(account.platform)}
                  className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                    selectedPlatforms.includes(account.platform)
                      ? 'border-indigo-500 bg-indigo-50'
                      : 'border-gray-200 hover:border-gray-300'
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Media</h2>
            
            {!mediaPreview ? (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">Upload a video for Instagram Reels & YouTube Shorts</p>
                <p className="text-xs text-gray-500 mb-4">
                  <strong>Best for Instagram Reels:</strong> MP4 format, 9:16 aspect ratio (vertical), max 60 seconds<br/>
                  <strong>Supported:</strong> MP4, MOV, AVI, WebM (Max 100MB)
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
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
                >
                  Choose File
                </label>
              </div>
            ) : (
              <div className="relative">
                {mediaFile?.type.startsWith('image/') ? (
                  <img
                    src={mediaPreview}
                    alt="Preview"
                    className="max-w-full h-64 object-cover rounded-lg"
                  />
                ) : (
                  <video
                    src={mediaPreview}
                    controls
                    className="max-w-full h-64 rounded-lg"
                  />
                )}
                <button
                  type="button"
                  onClick={removeMedia}
                  className="absolute top-2 right-2 bg-red-500 text-white p-1 rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>

          {selectedPlatforms.includes('instagram') && (
            <div className="bg-white rounded-lg shadow-sm border p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Instagram Reel Options</h2>
              <div className="space-y-4">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    checked={shareToFeed}
                    onChange={(e) => setShareToFeed(e.target.checked)}
                  />
                  <span className="text-sm text-gray-700">Share Reel to Instagram feed</span>
                </label>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">Cover frame offset</label>
                    <span className="text-xs text-gray-500">{thumbOffset}s</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={60}
                    step={1}
                    value={thumbOffset}
                    onChange={(e) => setThumbOffset(Number(e.target.value))}
                    className="w-full"
                  />
                  <div className="mt-2 flex items-center space-x-3">
                    <input
                      type="number"
                      min={0}
                      max={60}
                      value={thumbOffset}
                      onChange={(e) => {
                        const value = Number(e.target.value);
                        if (Number.isFinite(value)) {
                          setThumbOffset(Math.max(0, Math.min(60, value)));
                        }
                      }}
                      className="w-20 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-sm"
                    />
                    <p className="text-xs text-gray-500">Instagram uses this offset to capture the cover frame (0-60s).</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Content Text */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Content</h2>
            
            {/* YouTube Title (only show if YouTube is selected) */}
            {selectedPlatforms.includes('youtube') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video Title (YouTube)
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter video title..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  maxLength={100}
                />
                <p className="text-xs text-gray-500 mt-1">{title.length}/100 characters</p>
              </div>
            )}
            
            {/* Instagram Caption */}
            {selectedPlatforms.includes('instagram') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Instagram Caption
                </label>
                <textarea
                  value={caption}
                  onChange={(e) => setCaption(e.target.value)}
                  placeholder="What's on your mind?"
                  rows={3}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  maxLength={2200}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    {caption.length}/2200 characters
                  </p>
                  <button
                    type="button"
                    onClick={generateAICaption}
                    className="text-sm bg-purple-600 text-white px-3 py-1 rounded-md hover:bg-purple-700 transition-colors"
                  >
                    ✨ AI Generate
                  </button>
                </div>
              </div>
            )}

            {/* YouTube Description */}
            {selectedPlatforms.includes('youtube') && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  YouTube Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter video description..."
                  rows={4}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  maxLength={5000}
                />
                <div className="flex justify-between items-center mt-2">
                  <p className="text-xs text-gray-500">
                    {description.length}/5000 characters
                  </p>
                </div>
              </div>
            )}
            
            {/* YouTube Tags */}
            {selectedPlatforms.includes('youtube') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tags (YouTube)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Enter tags separated by commas..."
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
                <p className="text-xs text-gray-500 mt-1">Separate tags with commas</p>
              </div>
            )}
          </div>

          {/* Scheduling */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Schedule</h2>
            
            <div className="space-y-4">
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="now"
                    checked={scheduleType === 'now'}
                    onChange={(e) => setScheduleType(e.target.value as 'now' | 'later')}
                    className="mr-2"
                  />
                  <Send className="h-4 w-4 mr-2" />
                  Post Now
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    value="later"
                    checked={scheduleType === 'later'}
                    onChange={(e) => setScheduleType(e.target.value as 'now' | 'later')}
                    className="mr-2"
                  />
                  <Clock className="h-4 w-4 mr-2" />
                  Schedule for Later
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required={scheduleType === 'later'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                    <input
                      type="time"
                      value={scheduledTime}
                      onChange={(e) => setScheduledTime(e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      required={scheduleType === 'later'}
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
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
    </div>
  );
}
