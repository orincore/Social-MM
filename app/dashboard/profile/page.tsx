'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { User, Camera, Save, Mail, Phone, Globe, Clock, Crown, CheckCircle, LogOut, ArrowRight } from 'lucide-react';
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [processingUpgrade, setProcessingUpgrade] = useState(false);

  const isPro = profileData.subscriptionPlan?.toLowerCase() === 'pro';

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

  const handleUpgradeClick = () => {
    setShowUpgradeModal(true);
  };

  const handleConfirmUpgrade = () => {
    setProcessingUpgrade(true);
    setTimeout(() => {
      setProfileData(prev => ({
        ...prev,
        subscriptionPlan: 'pro',
        subscriptionStatus: 'active'
      }));
      setMessage('Payment successful! You are now a Pro member.');
      setShowUpgradeModal(false);
      setProcessingUpgrade(false);
      setTimeout(() => setMessage(''), 4000);
    }, 1500);
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
    <>
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

        {/* Subscription Banner */}
        <div
          className={`mb-8 rounded-2xl border shadow-sm overflow-hidden ${
            isPro
              ? 'bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 border-transparent text-white'
              : 'bg-white border-indigo-100'
          }`}
        >
          <div className="p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wide mb-3 bg-white/20 text-white">
                <Crown className="h-4 w-4 mr-1" />
                {isPro ? 'Premium Member' : 'Free Member'}
              </div>
              <h2 className={`text-xl font-semibold ${isPro ? 'text-white' : 'text-gray-900'}`}>
                {isPro
                  ? 'Thanks for being a Pro creator!'
                  : 'Unlock the full SocialOS experience'}
              </h2>
              <p className={`mt-2 text-sm ${isPro ? 'text-white/80' : 'text-gray-600'}`}>
                {isPro
                  ? 'You have unlimited scheduling, AI-powered captioning, auto-publishing across all platforms and priority support.'
                  : 'Upgrade to Pro for ₹149/month to unlock unlimited scheduling, multi-platform auto-publishing, AI caption studio, analytics exports and priority support.'}
              </p>
            </div>

            {isPro ? (
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex flex-col text-left">
                  <span className="font-semibold">Plan Status</span>
                  <span className="text-white/80">Active Pro subscription</span>
                </div>
                <div className="h-12 w-px bg-white/30 hidden md:block" />
                <div className="flex flex-col text-left">
                  <span className="font-semibold">Next Billing</span>
                  <span className="text-white/80">View details in Billing</span>
                </div>
              </div>
            ) : (
              <button
                onClick={handleUpgradeClick}
                className="group inline-flex items-center justify-center px-6 py-3 text-sm font-semibold rounded-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500 text-white shadow-[0_12px_35px_rgba(99,102,241,0.35)] hover:shadow-[0_18px_45px_rgba(99,102,241,0.45)] transition-all duration-300"
              >
                <span className="flex items-center">
                  Upgrade to Pro
                  <ArrowRight className="h-4 w-4 ml-2 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
                <span className="ml-3 text-xs font-medium bg-white/20 px-2 py-1 rounded-full">
                  ₹149 / month
                </span>
              </button>
            )}
          </div>
        </div>

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
                          console.log('Image failed to load:', session?.user?.image);
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

    {/* Dummy Payment Modal */}
    {showUpgradeModal && (
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Complete your upgrade</h3>
            <button
              onClick={() => !processingUpgrade && setShowUpgradeModal(false)}
              className="text-gray-400 hover:text-gray-600"
            >
              ✕
            </button>
          </div>
          <p className="text-sm text-gray-600 mb-6">
            Dummy payment gateway — no real charges. Click confirm to simulate a successful payment and activate your Pro plan.
          </p>

          <div className="space-y-4 mb-6">
            <div className="p-4 border rounded-lg">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Plan</span>
                <span className="font-semibold text-gray-900">SocialOS Pro</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 mt-2">
                <span>Amount</span>
                <span className="font-semibold text-gray-900">₹149 / month</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <input type="text" placeholder="Card Holder" className="col-span-2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              <input type="text" placeholder="Card Number" className="col-span-2 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              <input type="text" placeholder="MM/YY" className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
              <input type="text" placeholder="CVV" className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-end gap-3">
            <button
              onClick={() => setShowUpgradeModal(false)}
              disabled={processingUpgrade}
              className="px-4 py-2 rounded-lg border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmUpgrade}
              disabled={processingUpgrade}
              className="flex-1 sm:flex-none px-4 py-2 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {processingUpgrade ? 'Processing...' : 'Confirm Payment'}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
