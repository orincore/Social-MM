'use client';

import { useState, useEffect } from 'react';
import { Send, MessageCircle, Upload, Image, CheckCircle, XCircle, Instagram } from 'lucide-react';
import ProtectedRoute from '@/components/protected-route';

export default function InstagramTestPage() {
  const [connectedAccount, setConnectedAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'messages' | 'publish' | 'status'>('messages');
  
  // Message state
  const [message, setMessage] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [sendingMessage, setSendingMessage] = useState(false);
  const [messageResult, setMessageResult] = useState<any>(null);
  
  // Publish state
  const [caption, setCaption] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [publishing, setPublishing] = useState(false);
  const [publishResult, setPublishResult] = useState<any>(null);

  useEffect(() => {
    checkConnection();
  }, []);

  const checkConnection = async () => {
    try {
      const response = await fetch('/api/instagram/status');
      const data = await response.json();
      setConnectedAccount(data.connected ? data.account : null);
    } catch (error) {
      console.error('Error checking connection:', error);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!message.trim() || !recipientId.trim()) return;
    
    setSendingMessage(true);
    setMessageResult(null);
    
    try {
      const response = await fetch('/api/instagram/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message.trim(),
          recipientId: recipientId.trim()
        })
      });
      
      const result = await response.json();
      setMessageResult(result);
      
      if (result.success) {
        setMessage('');
      }
    } catch (error) {
      setMessageResult({ success: false, error: 'Network error' });
    } finally {
      setSendingMessage(false);
    }
  };

  const publishContent = async () => {
    if (!caption.trim() || !imageUrl.trim()) return;
    
    setPublishing(true);
    setPublishResult(null);
    
    try {
      // First create content
      const contentResponse = await fetch('/api/content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform: 'instagram',
          caption: caption.trim(),
          mediaUrl: imageUrl.trim(),
          status: 'draft'
        })
      });
      
      const contentData = await contentResponse.json();
      
      if (!contentResponse.ok) {
        throw new Error(contentData.error || 'Failed to create content');
      }
      
      // Then publish it
      const publishResponse = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contentId: contentData.id
        })
      });
      
      const result = await publishResponse.json();
      setPublishResult(result);
      
      if (result.ok) {
        setCaption('');
        setImageUrl('');
      }
    } catch (error) {
      setPublishResult({ ok: false, error: error instanceof Error ? error.message : 'Network error' });
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (!connectedAccount) {
    return (
      <ProtectedRoute>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
            <Instagram className="h-16 w-16 text-pink-500 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Connect Instagram First</h2>
            <p className="text-gray-600 mb-6">
              You need to connect your Instagram account before you can test the API functionality.
            </p>
            <a
              href="/dashboard/settings"
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors flex items-center justify-center"
            >
              <Instagram className="h-5 w-5 mr-2" />
              Go to Settings
            </a>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Instagram API Testing</h1>
            <p className="text-gray-600">
              Connected as <span className="font-medium">@{connectedAccount.username}</span>
            </p>
          </div>

          {/* Tabs */}
          <div className="bg-white rounded-lg shadow-sm mb-8">
            <div className="border-b">
              <nav className="-mb-px flex">
                {[
                  { id: 'messages', name: 'Send Messages', icon: MessageCircle },
                  { id: 'publish', name: 'Publish Content', icon: Upload },
                  { id: 'status', name: 'Connection Status', icon: CheckCircle },
                ].map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center px-6 py-4 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-pink-500 text-pink-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <tab.icon className="h-4 w-4 mr-2" />
                    {tab.name}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {activeTab === 'messages' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Send Instagram Message</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Recipient ID
                        </label>
                        <input
                          type="text"
                          value={recipientId}
                          onChange={(e) => setRecipientId(e.target.value)}
                          placeholder="e.g., 874531157567769"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Message
                        </label>
                        <textarea
                          value={message}
                          onChange={(e) => setMessage(e.target.value)}
                          placeholder="Hello World"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        />
                      </div>
                      <button
                        onClick={sendMessage}
                        disabled={sendingMessage || !message.trim() || !recipientId.trim()}
                        className="flex items-center px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {sendingMessage ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Send className="h-4 w-4 mr-2" />
                        )}
                        {sendingMessage ? 'Sending...' : 'Send Message'}
                      </button>
                    </div>
                  </div>

                  {messageResult && (
                    <div className={`p-4 rounded-lg ${
                      messageResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                      <div className="flex items-center">
                        {messageResult.success ? (
                          <CheckCircle className="h-5 w-5 mr-2" />
                        ) : (
                          <XCircle className="h-5 w-5 mr-2" />
                        )}
                        <div>
                          <p className="font-medium">
                            {messageResult.success ? 'Message Sent!' : 'Failed to Send'}
                          </p>
                          {messageResult.success && messageResult.messageId && (
                            <p className="text-sm">Message ID: {messageResult.messageId}</p>
                          )}
                          {messageResult.error && (
                            <p className="text-sm">{messageResult.error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'publish' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Publish Instagram Post</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Image URL
                        </label>
                        <input
                          type="url"
                          value={imageUrl}
                          onChange={(e) => setImageUrl(e.target.value)}
                          placeholder="https://picsum.photos/1080/1080.jpg"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Caption
                        </label>
                        <textarea
                          value={caption}
                          onChange={(e) => setCaption(e.target.value)}
                          placeholder="Hello from API test 👋"
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                        />
                      </div>
                      <button
                        onClick={publishContent}
                        disabled={publishing || !caption.trim() || !imageUrl.trim()}
                        className="flex items-center px-4 py-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {publishing ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        ) : (
                          <Image className="h-4 w-4 mr-2" />
                        )}
                        {publishing ? 'Publishing...' : 'Publish Post'}
                      </button>
                    </div>
                  </div>

                  {publishResult && (
                    <div className={`p-4 rounded-lg ${
                      publishResult.ok ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                    }`}>
                      <div className="flex items-center">
                        {publishResult.ok ? (
                          <CheckCircle className="h-5 w-5 mr-2" />
                        ) : (
                          <XCircle className="h-5 w-5 mr-2" />
                        )}
                        <div>
                          <p className="font-medium">
                            {publishResult.ok ? 'Post Published!' : 'Failed to Publish'}
                          </p>
                          {publishResult.permalink && (
                            <a 
                              href={publishResult.permalink} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm underline"
                            >
                              View Post on Instagram
                            </a>
                          )}
                          {publishResult.error && (
                            <p className="text-sm">{publishResult.error}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {activeTab === 'status' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">Connection Details</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <dl className="space-y-2">
                      <div>
                        <dt className="text-sm font-medium text-gray-600">Username:</dt>
                        <dd className="text-sm text-gray-900">@{connectedAccount.username}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-600">User ID:</dt>
                        <dd className="text-sm text-gray-900">{connectedAccount.userId}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-600">Scopes:</dt>
                        <dd className="text-sm text-gray-900">{connectedAccount.scopes?.join(', ')}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-600">Connected:</dt>
                        <dd className="text-sm text-gray-900">
                          {new Date(connectedAccount.connectedAt).toLocaleString()}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
}
