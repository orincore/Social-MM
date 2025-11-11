'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Instagram, Youtube, CheckCircle, XCircle, Loader2, ExternalLink, RefreshCw, Link2Off, Info } from 'lucide-react';

interface AccountDetails {
  username?: string;
  userId?: string;
  accountType?: string;
  profilePictureUrl?: string;
  followersCount?: number;
  followingCount?: number;
  mediaCount?: number;
  biography?: string;
  website?: string;
  channelId?: string;
  channelTitle?: string;
  channelHandle?: string;
  subscriberCount?: number;
  videoCount?: number;
  viewCount?: number;
  thumbnailUrl?: string;
  description?: string;
  country?: string;
  connectedAt?: string;
  lastUpdated?: string;
  tokenExpired?: boolean;
  tokenExpiresAt?: string;
  daysUntilExpiry?: number;
}

interface AccountStatus {
  connected: boolean;
  account?: AccountDetails;
  error?: string;
}

export default function AccountsPage() {
  const { data: session } = useSession();
  const [instagramStatus, setInstagramStatus] = useState<AccountStatus>({ connected: false });
  const [youtubeStatus, setYoutubeStatus] = useState<AccountStatus>({ connected: false });
  const [loading, setLoading] = useState({ instagram: false, youtube: false });
  const [refreshing, setRefreshing] = useState({ instagram: false, youtube: false });

  const fetchAccountStatus = async () => {
    if (!session?.user?.email) return;

    try {
      // Fetch Instagram status
      const igResponse = await fetch('/api/instagram/status');
      const igData = await igResponse.json();
      const normalizedInstagram: AccountStatus = {
        connected: Boolean(igData?.connected && !igData?.account?.tokenExpired),
        account: igData?.account ? {
          ...igData.account,
          username: igData.account.username || igData.account.instagramId,
        } : undefined,
        error: igData?.error,
      };
      setInstagramStatus(normalizedInstagram);

      // Fetch YouTube status
      const ytResponse = await fetch('/api/youtube/status');
      const ytData = await ytResponse.json();
      const youtubeAccount: AccountDetails | undefined = ytData?.account
        ? {
            ...ytData.account,
            username: ytData.account.channelHandle || ytData.account.channelTitle,
          }
        : ytData?.channel
        ? {
            username: ytData.channel.channelHandle || ytData.channel.title,
            channelId: ytData.channel.channelId,
            channelTitle: ytData.channel.title || ytData.channel.channelTitle,
            channelHandle: ytData.channel.channelHandle,
            subscriberCount: ytData.channel.subscriberCount,
            videoCount: ytData.channel.videoCount,
            viewCount: ytData.channel.viewCount,
            thumbnailUrl: ytData.channel.thumbnailUrl,
            description: ytData.channel.description,
            country: ytData.channel.country,
            connectedAt: ytData.channel.connectedAt,
            lastUpdated: ytData.channel.lastUpdated,
            tokenExpired: false,
          }
        : undefined;

      const normalizedYoutube: AccountStatus = {
        connected: Boolean(ytData?.connected && youtubeAccount && !youtubeAccount.tokenExpired),
        account: youtubeAccount,
        error: ytData?.error,
      };
      setYoutubeStatus(normalizedYoutube);
    } catch (error) {
      console.error('Failed to fetch account status:', error);
    }
  };

  useEffect(() => {
    fetchAccountStatus();
  }, [session]);

  const connectInstagram = async () => {
    setLoading({ ...loading, instagram: true });
    try {
      const response = await fetch('/api/instagram/connect');
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Failed to connect Instagram:', error);
    } finally {
      setLoading({ ...loading, instagram: false });
    }
  };

  const connectYoutube = async () => {
    setLoading({ ...loading, youtube: true });
    try {
      const response = await fetch('/api/youtube/connect');
      const data = await response.json();
      if (data.authUrl) {
        window.location.href = data.authUrl;
      }
    } catch (error) {
      console.error('Failed to connect YouTube:', error);
    } finally {
      setLoading({ ...loading, youtube: false });
    }
  };

  const disconnectInstagram = async () => {
    if (!confirm('Are you sure you want to disconnect Instagram? This will delete all your content and scheduled posts.')) {
      return;
    }

    setLoading(prev => ({ ...prev, instagram: true }));
    try {
      const response = await fetch('/api/instagram/status', { method: 'DELETE' });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to disconnect Instagram');
      }

      setInstagramStatus({ connected: false });
      await fetchAccountStatus();
    } catch (error) {
      console.error('Failed to disconnect Instagram:', error);
      alert('Could not disconnect Instagram. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, instagram: false }));
    }
  };

  const disconnectYoutube = async () => {
    if (!confirm('Are you sure you want to disconnect YouTube? This will delete all your content and scheduled posts.')) {
      return;
    }

    setLoading(prev => ({ ...prev, youtube: true }));
    try {
      const response = await fetch('/api/youtube/status', { method: 'DELETE' });
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Failed to disconnect YouTube');
      }

      setYoutubeStatus({ connected: false });
      await fetchAccountStatus();
    } catch (error) {
      console.error('Failed to disconnect YouTube:', error);
      alert('Could not disconnect YouTube. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, youtube: false }));
    }
  };

  const refreshAccount = async (platform: 'instagram' | 'youtube') => {
    setRefreshing({ ...refreshing, [platform]: true });
    
    // Clear cache first
    try {
      await fetch('/api/cache/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform }),
      });
      console.log(`Accounts: Cache cleared for ${platform}`);
    } catch (error) {
      console.log(`Accounts: Cache clear failed for ${platform}:`, error);
    }
    
    // Refresh account data from platform API
    if (platform === 'instagram') {
      try {
        const refreshResponse = await fetch('/api/instagram/refresh-account', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        });
        
        if (refreshResponse.ok) {
          const refreshData = await refreshResponse.json();
          console.log('Instagram account refreshed:', refreshData);
        } else {
          console.log('Instagram refresh failed:', await refreshResponse.text());
        }
      } catch (error) {
        console.log('Instagram refresh error:', error);
      }
    }
    
    // Fetch updated status
    await fetchAccountStatus();
    
    setTimeout(() => {
      setRefreshing({ ...refreshing, [platform]: false });
    }, 1000);
  };

  const AccountCard = ({ 
    platform, 
    status, 
    icon: Icon, 
    color, 
    onConnect, 
    onDisconnect, 
    onRefresh,
    isLoading, 
    isRefreshing 
  }: {
    platform: 'instagram' | 'youtube';
    status: AccountStatus;
    icon: any;
    color: string;
    onConnect: () => void;
    onDisconnect: () => void;
    onRefresh: () => void;
    isLoading: boolean;
    isRefreshing: boolean;
  }) => (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${color}`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 capitalize">{platform}</h3>
            <div className="flex items-center gap-2 mt-1">
              {status.connected ? (
                <>
                  <CheckCircle className="w-4 h-4 text-green-500" />
                  <span className="text-sm text-green-600">Connected</span>
                  {status.account?.tokenExpired && (
                    <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                      Token Expired
                    </span>
                  )}
                </>
              ) : (
                <>
                  <XCircle className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">Not connected</span>
                </>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {status.connected && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
              title="Refresh account info"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          )}
        </div>
      </div>

      {status.connected && status.account ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {status.account.profilePictureUrl || status.account.thumbnailUrl ? (
              <img
                src={status.account.profilePictureUrl || status.account.thumbnailUrl}
                alt="Profile"
                className="w-12 h-12 rounded-full object-cover"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center">
                <Icon className="w-6 h-6 text-gray-400" />
              </div>
            )}
            <div>
              <p className="font-medium text-gray-900">
                {status.account.username || status.account.channelTitle}
              </p>
              <p className="text-sm text-gray-500">
                {status.account.followersCount ? `${status.account.followersCount.toLocaleString()} followers` : 
                 status.account.subscriberCount ? `${status.account.subscriberCount.toLocaleString()} subscribers` : 
                 'No stats available'}
              </p>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-2 gap-4 mt-3 pt-3 border-t border-gray-100">
            {status.account.followersCount && (
              <>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">{status.account.followersCount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Followers</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">{status.account.followingCount?.toLocaleString() || 0}</p>
                  <p className="text-xs text-gray-500">Following</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">{status.account.mediaCount?.toLocaleString() || 0}</p>
                  <p className="text-xs text-gray-500">Posts</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">
                    {status.account.accountType === 'BUSINESS' ? 'Business' :
                     status.account.accountType === 'MEDIA_CREATOR' ? 'Creator' :
                     status.account.accountType === 'PERSONAL' ? 'Personal' :
                     status.account.accountType || 'Business'}
                  </p>
                  <p className="text-xs text-gray-500">Account Type</p>
                </div>
              </>
            )}
            
            {status.account.subscriberCount && (
              <>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">{status.account.subscriberCount.toLocaleString()}</p>
                  <p className="text-xs text-gray-500">Subscribers</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">{status.account.videoCount?.toLocaleString() || 0}</p>
                  <p className="text-xs text-gray-500">Videos</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">{status.account.viewCount?.toLocaleString() || 0}</p>
                  <p className="text-xs text-gray-500">Total Views</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-gray-900">{status.account.country || 'Global'}</p>
                  <p className="text-xs text-gray-500">Country</p>
                </div>
              </>
            )}
          </div>

          {status.account.connectedAt && (
            <p className="text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
              Connected on {new Date(status.account.connectedAt).toLocaleDateString()}
            </p>
          )}

          <div className="flex gap-2">
            <a
              href={platform === 'instagram' ? '/dashboard/instagram' : '/dashboard/youtube'}
              className="flex-1 bg-gray-50 hover:bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2"
            >
              <ExternalLink className="w-4 h-4" />
              View Analytics
            </a>
            <button
              onClick={onDisconnect}
              disabled={isLoading}
              className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Link2Off className="w-4 h-4" />
              )}
              Unlink
            </button>
          </div>

          {(status.account?.biography || status.account?.description) && (
            <div className="mt-4 bg-gray-50 border border-gray-100 rounded-lg p-3">
              {status.account?.biography && (
                <p className="text-sm text-gray-600 whitespace-pre-line">{status.account.biography}</p>
              )}
              {status.account?.description && (
                <p className="text-sm text-gray-600 whitespace-pre-line">{status.account.description}</p>
              )}
            </div>
          )}

          {status.account?.website && (
            <a
              href={status.account.website}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700"
            >
              <ExternalLink className="w-4 h-4" />
              {status.account.website}
            </a>
          )}

          {(status.account?.tokenExpiresAt || typeof status.account?.daysUntilExpiry === 'number') && (
            <div className="mt-3 text-xs text-gray-500">
              {status.account?.tokenExpiresAt && (
                <p>
                  Token expires on {new Date(status.account.tokenExpiresAt).toLocaleDateString()}
                </p>
              )}
              {typeof status.account?.daysUntilExpiry === 'number' && status.account.daysUntilExpiry >= 0 && (
                <p>{status.account.daysUntilExpiry} day(s) remaining before token refresh is required.</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Connect your {platform} account to start managing your content and viewing analytics.
          </p>
          <button
            onClick={onConnect}
            disabled={isLoading}
            className={`w-full ${color} text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50`}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Icon className="w-4 h-4" />
            )}
            Connect {platform}
          </button>
          {status.error && (
            <p className="text-sm text-red-600">{status.error}</p>
          )}
        </div>
      )}
    </div>
  );

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-gray-400" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Connected Accounts</h1>
          <p className="text-gray-600">
            Manage your social media accounts and view connection status.
          </p>
        </div>

        <div className="mb-8 bg-blue-50 border border-blue-100 rounded-xl p-5 flex gap-3">
          <div className="mt-1">
            <Info className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-sm text-blue-900 leading-relaxed">
            <p className="font-semibold mb-2">Instagram Business requirement</p>
            <ol className="list-decimal list-inside space-y-2">
              <li>Use a Professional (Business or Creator) Instagram profile.</li>
              <li>In Instagram → Settings &amp; privacy → Accounts Center → Linked accounts, choose “Add accounts”.</li>
              <li>Log in with the Facebook profile that manages your Facebook Page.</li>
              <li>Select the Facebook Page to connect and confirm.</li>
              <li>Return here and complete the Facebook Login prompt so we can sync analytics and publishing.</li>
            </ol>
            <p className="mt-2 text-xs text-blue-800">
              Need extra help? Review the{' '}
              <a
                href="https://developers.facebook.com/docs/instagram-api/getting-started"
                target="_blank"
                rel="noopener noreferrer"
                className="underline font-medium"
              >
                official Instagram Graph API documentation
              </a>
              .
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <AccountCard
            platform="instagram"
            status={instagramStatus}
            icon={Instagram}
            color="bg-gradient-to-r from-purple-500 to-pink-500"
            onConnect={connectInstagram}
            onDisconnect={disconnectInstagram}
            onRefresh={() => refreshAccount('instagram')}
            isLoading={loading.instagram}
            isRefreshing={refreshing.instagram}
          />

          <AccountCard
            platform="youtube"
            status={youtubeStatus}
            icon={Youtube}
            color="bg-red-500"
            onConnect={connectYoutube}
            onDisconnect={disconnectYoutube}
            onRefresh={() => refreshAccount('youtube')}
            isLoading={loading.youtube}
            isRefreshing={refreshing.youtube}
          />
        </div>

        {(instagramStatus.connected || youtubeStatus.connected) && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid md:grid-cols-3 gap-4">
              <a
                href="/dashboard/analytics/combined"
                className="bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-center"
              >
                Combined Analytics
              </a>
              <a
                href="/dashboard/content/create"
                className="bg-green-50 hover:bg-green-100 text-green-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-center"
              >
                Create Content
              </a>
              <a
                href="/dashboard/calendar"
                className="bg-purple-50 hover:bg-purple-100 text-purple-700 px-4 py-3 rounded-lg text-sm font-medium transition-colors text-center"
              >
                Content Calendar
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
