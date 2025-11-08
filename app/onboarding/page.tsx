'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Phone, User, Zap, ArrowRight } from 'lucide-react';
import CountryCodeSelector, { defaultCountry } from '@/components/country-code-selector';

export default function OnboardingPage() {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [selectedCountry, setSelectedCountry] = useState(defaultCountry);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Redirect if not authenticated
    if (!session) {
      router.push('/auth/signin');
      return;
    }

    // Check if user already has phone number
    checkPhoneNumber();
  }, [session, router]);

  const checkPhoneNumber = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data.phone) {
          // User already has phone number, redirect to dashboard
          router.push('/dashboard');
        }
      }
    } catch (error) {
      console.error('Error checking phone number:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate phone number
    if (!phone.trim()) {
      setError('Phone number is required');
      setLoading(false);
      return;
    }

    // Basic phone validation (you can make this more sophisticated)
    const phoneRegex = /^[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(phone.replace(/[\s\-\(\)]/g, ''))) {
      setError('Please enter a valid phone number');
      setLoading(false);
      return;
    }

    // Combine country code with phone number
    const fullPhoneNumber = `${selectedCountry.dialCode}${phone.trim()}`;

    try {
      const response = await fetch('/api/user/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phone: fullPhoneNumber,
        }),
      });

      const result = await response.json();
      if (result.success) {
        // Update session
        await update();
        // Small delay to ensure session is updated
        setTimeout(() => {
          // Redirect to dashboard
          router.push('/dashboard');
        }, 500);
      } else {
        setError(result.error || 'Failed to update phone number');
      }
    } catch (error) {
      console.error('Phone update error:', error);
      setError('Failed to update phone number');
    } finally {
      setLoading(false);
    }
  };

  const handleSkip = () => {
    // For now, we'll redirect to dashboard but you might want to prevent this
    // if phone number is truly mandatory
    router.push('/dashboard');
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="flex justify-center">
            <Zap className="h-12 w-12 text-indigo-600" />
          </div>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Complete Your Profile
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We need your phone number to complete your account setup
          </p>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <div className="flex items-center space-x-4">
            <img 
              src={session.user?.image || ''} 
              alt={session.user?.name || ''} 
              className="w-12 h-12 rounded-full"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center hidden">
              <User className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">{session.user?.name}</h3>
              <p className="text-sm text-gray-500">{session.user?.email}</p>
            </div>
          </div>
        </div>

        {/* Phone Number Form */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-2">
              <Phone className="h-4 w-4 inline mr-1" />
              Phone Number *
            </label>
            <div className="flex">
              <CountryCodeSelector
                selectedCountry={selectedCountry}
                onCountryChange={setSelectedCountry}
              />
              <input
                id="phone"
                name="phone"
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-r-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="123 456 7890"
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              We'll use this for account security and important notifications
            </p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div className="space-y-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  Continue to Dashboard
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>

            {/* Optional: Add skip button if phone is not truly mandatory */}
            <button
              type="button"
              onClick={handleSkip}
              className="w-full py-2 px-4 text-sm font-medium text-gray-600 hover:text-gray-800"
            >
              Skip for now
            </button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-xs text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </div>
    </div>
  );
}
