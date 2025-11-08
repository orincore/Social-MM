'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { User, Camera, Save, Mail, Phone, Globe, Clock, Crown, CheckCircle, LogOut } from 'lucide-react';
import Link from 'next/link';
import CountryCodeSelector, { defaultCountry, countries } from '@/components/country-code-selector';

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  timezone: string;
  locale: string;
  subscriptionPlan: string;
  subscriptionStatus: string;
  lastLoginAt: string;
  createdAt: string;
}

export default function ProfilePage() {
  const { data: session, update } = useSession();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    email: '',
    phone: '',
    timezone: 'UTC+05:30',
    locale: 'en',
    subscriptionPlan: 'free',
    subscriptionStatus: 'active',
    lastLoginAt: '',
    createdAt: '',
  });

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setProfileData(data.data);
          
          // Parse existing phone number to extract country code and number
          if (data.data.phone) {
            const phone = data.data.phone;
            // Find matching country code
            const matchingCountry = countries.find(country => 
              phone.startsWith(country.dialCode)
            );
            
            if (matchingCountry) {
              setSelectedCountry(matchingCountry);
              setPhoneNumber(phone.substring(matchingCountry.dialCode.length));
            } else {
              // If no matching country found, assume it's the full number
              setPhoneNumber(phone);
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    
    // Combine country code with phone number
    const fullPhoneNumber = phoneNumber.trim() ? `${selectedCountry.dialCode}${phoneNumber.trim()}` : '';
    
    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: profileData.name,
          phone: fullPhoneNumber,
          timezone: profileData.timezone,
          locale: profileData.locale,
        }),
      });

      const result = await response.json();
      if (result.success) {
        setMessage('Profile updated successfully!');
        // Update the session with new data
        await update();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('Failed to update profile: ' + result.error);
      }
    } catch (error) {
      console.error('Profile update error:', error);
      setMessage('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    if (confirm('Are you sure you want to sign out?')) {
      await signOut({ 
        callbackUrl: '/',
        redirect: true 
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
              <p className="text-gray-600">Manage your account information and preferences</p>
            </div>
            <Link 
              href="/dashboard"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              ← Back to Dashboard
            </Link>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Success/Error Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg ${
            message.includes('successfully') 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            <div className="flex items-center">
              {message.includes('successfully') ? (
                <CheckCircle className="h-5 w-5 mr-2" />
              ) : (
                <div className="h-5 w-5 mr-2">⚠️</div>
              )}
              {message}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Picture & Basic Info */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="text-center">
                <div className="relative inline-block">
                  <div className="w-32 h-32 rounded-full overflow-hidden mx-auto mb-4">
                    {session?.user?.image ? (
                      <img 
                        src={session.user.image} 
                        alt={session.user.name || 'Profile'} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          console.log('Image failed to load:', session.user.image);
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : (
                      <div className="w-full h-full bg-indigo-100 flex items-center justify-center">
                        <User className="h-16 w-16 text-indigo-600" />
                      </div>
                    )}
                    {/* Fallback for broken images */}
                    <div className="w-full h-full bg-indigo-100 flex items-center justify-center hidden">
                      <User className="h-16 w-16 text-indigo-600" />
                    </div>
                  </div>
                  <button className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors">
                    <Camera className="h-4 w-4" />
                  </button>
                </div>
                
                <h3 className="text-xl font-semibold text-gray-900 mb-1">
                  {profileData.name || session?.user?.name}
                </h3>
                <p className="text-gray-600 mb-4">{profileData.email}</p>
                
                {/* Subscription Badge */}
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  {profileData.subscriptionPlan === 'pro' && (
                    <Crown className="h-4 w-4 text-yellow-500 mr-1" />
                  )}
                  {profileData.subscriptionPlan === 'pro' ? 'Pro Plan' : 'Free Plan'}
                </div>
              </div>
            </div>

            {/* Account Stats */}
            <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
              <h4 className="font-semibold text-gray-900 mb-4">Account Information</h4>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Member since:</span>
                  <span className="font-medium">
                    {profileData.createdAt ? new Date(profileData.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last login:</span>
                  <span className="font-medium">
                    {profileData.lastLoginAt ? new Date(profileData.lastLoginAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium capitalize">{profileData.subscriptionStatus}</span>
                </div>
              </div>
              
              {/* Logout Button */}
              <div className="mt-6 pt-4 border-t">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium text-red-600 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 hover:text-red-700 transition-colors"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Profile Form */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-6">Personal Information</h3>
              
              <div className="space-y-6">
                {/* Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <User className="h-4 w-4 inline mr-1" />
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    placeholder="Enter your full name"
                  />
                </div>

                {/* Email (Read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Mail className="h-4 w-4 inline mr-1" />
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Phone className="h-4 w-4 inline mr-1" />
                    Phone Number
                  </label>
                  <div className="flex">
                    <CountryCodeSelector
                      selectedCountry={selectedCountry}
                      onCountryChange={setSelectedCountry}
                    />
                    <input
                      type="tel"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="123 456 7890"
                      required
                    />
                  </div>
                  {!phoneNumber && (
                    <p className="text-xs text-red-600 mt-1">
                      ⚠️ Phone number is required for account security and notifications.
                    </p>
                  )}
                </div>

                {/* Timezone */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Clock className="h-4 w-4 inline mr-1" />
                    Timezone
                  </label>
                  <select 
                    value={profileData.timezone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, timezone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="UTC+05:30">UTC+05:30 (India Standard Time)</option>
                    <option value="UTC+00:00">UTC+00:00 (GMT)</option>
                    <option value="UTC-05:00">UTC-05:00 (EST)</option>
                    <option value="UTC-08:00">UTC-08:00 (PST)</option>
                    <option value="UTC+01:00">UTC+01:00 (CET)</option>
                    <option value="UTC+09:00">UTC+09:00 (JST)</option>
                  </select>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    <Globe className="h-4 w-4 inline mr-1" />
                    Language
                  </label>
                  <select 
                    value={profileData.locale}
                    onChange={(e) => setProfileData(prev => ({ ...prev, locale: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  >
                    <option value="en">English</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="de">German</option>
                    <option value="hi">Hindi</option>
                    <option value="zh">Chinese</option>
                  </select>
                </div>

                {/* Save Button */}
                <div className="pt-4">
                  <button 
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    {saving ? (
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
          </div>
        </div>
      </div>
    </div>
  );
}
