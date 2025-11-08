'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Settings as SettingsIcon, User, Bell, CreditCard, Shield, Instagram, Facebook, Youtube, Plus, Check, X, Save } from 'lucide-react';

const mockConnectedAccounts = [
  {
    id: 1,
    platform: 'Instagram',
    icon: Instagram,
    accountName: '@mybusiness',
    followers: '5.2K',
    isConnected: true,
    color: 'text-pink-600',
  },
  {
    id: 2,
    platform: 'Facebook',
    icon: Facebook,
    accountName: 'My Business Page',
    followers: '3.8K',
    isConnected: true,
    color: 'text-blue-600',
  },
  {
    id: 3,
    platform: 'YouTube',
    icon: Youtube,
    accountName: 'My Channel',
    followers: '1.2K',
    isConnected: false,
    color: 'text-red-600',
  },
];

export default function SettingsPage() {
  const { data: session } = useSession();
  const [activeTab, setActiveTab] = useState('profile');
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    timezone: 'UTC+05:30',
  });
  const [notifications, setNotifications] = useState({
    postPublished: true,
    postFailed: true,
    weeklyReport: false,
    newFeatures: true,
  });

  useEffect(() => {
    if (session?.user) {
      setProfileData({
        name: session.user.name || '',
        email: session.user.email || '',
        phone: (session.user as any)?.phone || '',
        timezone: (session.user as any)?.timezone || 'UTC+05:30',
      });
    }
  }, [session]);

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'accounts', label: 'Social Accounts', icon: Instagram },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'billing', label: 'Billing', icon: CreditCard },
    { id: 'security', label: 'Security', icon: Shield },
  ];

  const handleNotificationChange = (key: string) => {
    setNotifications(prev => ({
      ...prev,
      [key]: !prev[key as keyof typeof prev],
    }));
  };

  const handleProfileUpdate = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileData.name,
          phone: profileData.phone,
          timezone: profileData.timezone,
        }),
      });

      if (response.ok) {
        // Show success message (you can add a toast notification here)
        alert('Profile updated successfully!');
      } else {
        alert('Failed to update profile');
      }
    } catch (error) {
      console.error('Profile update error:', error);
      alert('Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center">
        <SettingsIcon className="h-6 w-6 text-indigo-600 mr-2" />
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <div className="lg:col-span-1">
          <nav className="space-y-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Content */}
        <div className="lg:col-span-3">
          <div className="bg-white rounded-lg shadow">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Profile Information</h3>
                <div className="space-y-6">
                  <div className="flex items-center space-x-6">
                    <div className="w-20 h-20 rounded-full overflow-hidden">
                      {session?.user?.image ? (
                        <img 
                          src={session.user.image} 
                          alt={session.user.name || ''} 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-indigo-100 flex items-center justify-center">
                          <User className="h-10 w-10 text-indigo-600" />
                        </div>
                      )}
                    </div>
                    <div>
                      <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                        Change Photo
                      </button>
                      <p className="text-sm text-gray-500 mt-1">JPG, GIF or PNG. 1MB max.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={profileData.name}
                        onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={profileData.email}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                      <input
                        type="tel"
                        value={profileData.phone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                        placeholder="+1 (555) 123-4567"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Time Zone</label>
                      <select 
                        value={profileData.timezone}
                        onChange={(e) => setProfileData(prev => ({ ...prev, timezone: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="UTC+05:30">UTC+05:30 (India Standard Time)</option>
                        <option value="UTC+00:00">UTC+00:00 (GMT)</option>
                        <option value="UTC-05:00">UTC-05:00 (EST)</option>
                        <option value="UTC-08:00">UTC-08:00 (PST)</option>
                      </select>
                    </div>
                  </div>

                  <div className="flex justify-end">
                    <button 
                      onClick={handleProfileUpdate}
                      disabled={loading}
                      className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {loading ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="h-4 w-4 mr-2" />
                          Save Changes
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Social Accounts Tab */}
            {activeTab === 'accounts' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Connected Social Accounts</h3>
                <div className="space-y-4">
                  {mockConnectedAccounts.map((account) => {
                    const Icon = account.icon;
                    return (
                      <div key={account.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <Icon className={`h-8 w-8 ${account.color}`} />
                          <div>
                            <h4 className="font-medium text-gray-900">{account.platform}</h4>
                            <p className="text-sm text-gray-500">
                              {account.isConnected ? `${account.accountName} • ${account.followers} followers` : 'Not connected'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {account.isConnected ? (
                            <>
                              <div className="flex items-center text-green-600">
                                <Check className="h-4 w-4 mr-1" />
                                <span className="text-sm font-medium">Connected</span>
                              </div>
                              <button className="text-red-600 hover:text-red-700 text-sm font-medium">
                                Disconnect
                              </button>
                            </>
                          ) : (
                            <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center">
                              <Plus className="h-4 w-4 mr-1" />
                              Connect
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Notification Preferences</h3>
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Post Published</h4>
                      <p className="text-sm text-gray-500">Get notified when your posts are successfully published</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange('postPublished')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifications.postPublished ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifications.postPublished ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Post Failed</h4>
                      <p className="text-sm text-gray-500">Get notified when posts fail to publish</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange('postFailed')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifications.postFailed ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifications.postFailed ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">Weekly Report</h4>
                      <p className="text-sm text-gray-500">Receive weekly analytics summary</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange('weeklyReport')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifications.weeklyReport ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifications.weeklyReport ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900">New Features</h4>
                      <p className="text-sm text-gray-500">Get notified about new features and updates</p>
                    </div>
                    <button
                      onClick={() => handleNotificationChange('newFeatures')}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        notifications.newFeatures ? 'bg-indigo-600' : 'bg-gray-200'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          notifications.newFeatures ? 'translate-x-6' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Billing Tab */}
            {activeTab === 'billing' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Billing & Subscription</h3>
                <div className="space-y-6">
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-gray-900 flex items-center">
                          Current Plan: {(session?.user as any)?.subscriptionPlan === 'pro' ? 'Pro' : 'Free'}
                          {(session?.user as any)?.subscriptionPlan === 'pro' && (
                            <Crown className="h-4 w-4 text-yellow-500 ml-2" />
                          )}
                        </h4>
                        <p className="text-sm text-gray-500">
                          {(session?.user as any)?.subscriptionPlan === 'pro' 
                            ? 'Unlimited accounts • Unlimited posts • AI features'
                            : '3 social accounts • 10 posts/month • 5 AI captions'
                          }
                        </p>
                      </div>
                      {(session?.user as any)?.subscriptionPlan !== 'pro' && (
                        <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                          Upgrade to Pro
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Usage This Month</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Posts Scheduled</span>
                          <span>7 / 10</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '70%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>AI Captions Generated</span>
                          <span>3 / 5</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div className="bg-indigo-600 h-2 rounded-full" style={{ width: '60%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-6">Security Settings</h3>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-4">Change Password</h4>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                        <input
                          type="password"
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                      </div>
                      <button className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
                        Update Password
                      </button>
                    </div>
                  </div>

                  <div className="border-t pt-6">
                    <h4 className="font-medium text-gray-900 mb-4">Two-Factor Authentication</h4>
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div>
                        <p className="font-medium text-gray-900">SMS Authentication</p>
                        <p className="text-sm text-gray-500">Receive verification codes via SMS</p>
                      </div>
                      <button className="text-indigo-600 hover:text-indigo-700 font-medium">
                        Enable
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
