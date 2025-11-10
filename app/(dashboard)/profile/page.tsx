'use client';

import { useSession } from 'next-auth/react';
import { User, Mail, Calendar, Crown, Edit, Camera, Shield, Bell, Globe } from 'lucide-react';
import { useState } from 'react';

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: session?.user?.name || '',
    email: session?.user?.email || '',
  });

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    // TODO: Implement profile update API call
    console.log('Saving profile:', formData);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setFormData({
      name: session?.user?.name || '',
      email: session?.user?.email || '',
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="px-6 py-4 border-b">
          <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
          <p className="text-gray-600 mt-1">Manage your account information and preferences</p>
        </div>

        {/* Profile Section */}
        <div className="p-6">
          <div className="flex items-start space-x-6">
            {/* Profile Picture */}
            <div className="relative">
              <div className="w-24 h-24 rounded-full overflow-hidden bg-gray-100 border-4 border-white shadow-lg">
                {session?.user?.image ? (
                  <img 
                    src={session.user.image} 
                    alt={session.user.name || 'Profile'} 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-indigo-100 flex items-center justify-center">
                    <User className="h-12 w-12 text-indigo-600" />
                  </div>
                )}
              </div>
              <button className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors shadow-lg">
                <Camera className="h-4 w-4" />
              </button>
            </div>

            {/* Profile Info */}
            <div className="flex-1">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900">{session?.user?.name}</h2>
                  <div className="flex items-center mt-1">
                    <p className="text-gray-600">{session?.user?.email}</p>
                    <div className="ml-3 flex items-center">
                      {(session?.user as any)?.subscriptionPlan === 'pro' ? (
                        <>
                          <Crown className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-sm font-medium text-yellow-600">Pro Plan</span>
                        </>
                      ) : (
                        <span className="text-sm text-gray-500">Free Plan</span>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  {isEditing ? 'Cancel' : 'Edit Profile'}
                </button>
              </div>

              {/* Account Stats */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-sm text-gray-600">Posts Created</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">0</p>
                  <p className="text-sm text-gray-600">Posts Scheduled</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">2</p>
                  <p className="text-sm text-gray-600">Platforms Connected</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Edit Form */}
      {isEditing && (
        <div className="bg-white rounded-lg shadow-sm border mb-6">
          <div className="px-6 py-4 border-b">
            <h3 className="text-lg font-semibold text-gray-900">Edit Profile Information</h3>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter your email address"
                disabled
              />
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed for security reasons</p>
            </div>
            <div className="flex space-x-3 pt-4">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Save Changes
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account Information */}
      <div className="bg-white rounded-lg shadow-sm border mb-6">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Account Information</h3>
        </div>
        <div className="p-6 space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center">
              <Mail className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Email Address</p>
                <p className="text-sm text-gray-600">{session?.user?.email}</p>
              </div>
            </div>
            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Verified</span>
          </div>
          
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center">
              <Calendar className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Member Since</p>
                <p className="text-sm text-gray-600">November 2024</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div className="flex items-center">
              <Shield className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Account Security</p>
                <p className="text-sm text-gray-600">Two-factor authentication disabled</p>
              </div>
            </div>
            <button className="text-sm text-indigo-600 hover:text-indigo-700">Enable</button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div className="flex items-center">
              <Globe className="h-5 w-5 text-gray-400 mr-3" />
              <div>
                <p className="text-sm font-medium text-gray-900">Language & Region</p>
                <p className="text-sm text-gray-600">English (US)</p>
              </div>
            </div>
            <button className="text-sm text-indigo-600 hover:text-indigo-700">Change</button>
          </div>
        </div>
      </div>

      {/* Subscription */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="px-6 py-4 border-b">
          <h3 className="text-lg font-semibold text-gray-900">Subscription</h3>
        </div>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Crown className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-lg font-semibold text-gray-900">
                  {(session?.user as any)?.subscriptionPlan === 'pro' ? 'Pro Plan' : 'Free Plan'}
                </p>
                <p className="text-sm text-gray-600">
                  {(session?.user as any)?.subscriptionPlan === 'pro' 
                    ? 'Unlimited posts, advanced analytics, priority support' 
                    : 'Limited to 10 posts per month'}
                </p>
              </div>
            </div>
            {(session?.user as any)?.subscriptionPlan !== 'pro' && (
              <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">
                Upgrade to Pro
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
