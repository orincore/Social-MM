'use client';

import { signIn, getProviders } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Zap, AlertTriangle, Shield, Sparkles, TrendingUp, Users, Building2, ArrowRight } from 'lucide-react';
import { AGENCY_DEMO_STORAGE_KEY } from '@/components/agency-workflow-experience';

interface Provider {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
}

export default function SignInPage() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null);
  const [agencyEmail, setAgencyEmail] = useState('');
  const [agencyAccessCode, setAgencyAccessCode] = useState('');
  const [agencyError, setAgencyError] = useState<string | null>(null);
  const [agencyLoading, setAgencyLoading] = useState(false);
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const router = useRouter();

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders();
      setProviders(res);
    };
    fetchProviders();
  }, []);

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'google':
        return (
          <svg className="h-5 w-5" viewBox="0 0 24 24">
            <path
              fill="currentColor"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="currentColor"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="currentColor"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="currentColor"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center mb-6">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg blur opacity-75"></div>
              <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 p-3 rounded-lg">
                <Zap className="h-8 w-8 text-white" />
              </div>
            </div>
            <span className="ml-3 text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Social OS
            </span>
          </Link>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Welcome back
          </h1>
          <p className="text-lg text-gray-600">
            Sign in to manage your social media empire
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white/80 backdrop-blur-md rounded-2xl shadow-xl border border-gray-200 p-8">

          {/* Error Messages */}
          {error === 'account_deleted' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Account Deleted</h3>
                  <p className="text-sm text-red-700 mt-1">
                    Your account has been deleted. Please contact support if you believe this is an error.
                  </p>
                </div>
              </div>
            </div>
          )}

          {error && error !== 'account_deleted' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6">
              <div className="flex items-center">
                <AlertTriangle className="h-5 w-5 text-red-500 mr-3 flex-shrink-0" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Sign In Error</h3>
                  <p className="text-sm text-red-700 mt-1">
                    {error === 'OAuthCallback' ? 'Authentication failed. Please try again.' : 
                     error === 'AccessDenied' ? 'Access denied. Please check your permissions.' :
                     'An error occurred during sign in. Please try again.'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Sign In Buttons */}
          <div className="space-y-3 mb-8">
            {providers &&
              Object.values(providers)
                .filter((provider) => provider.id !== 'github')
                .map((provider) => (
                  <button
                    key={provider.name}
                    onClick={async () => {
                      console.log('Attempting to sign in with:', provider.id);
                      try {
                        const result = await signIn(provider.id, { redirect: false });
                        console.log('SignIn result:', result);
                        if (result?.error) {
                          console.error('SignIn error:', result.error);
                          alert('Sign in failed: ' + result.error);
                        } else if (result?.url) {
                          window.location.href = result.url;
                        }
                      } catch (error) {
                        console.error('SignIn exception:', error);
                        alert('Sign in failed: ' + error);
                      }
                    }}
                    className="group relative w-full flex items-center justify-center py-4 px-6 border border-gray-200 text-base font-medium rounded-xl text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <span className="absolute left-6 flex items-center">
                      {getProviderIcon(provider.id)}
                    </span>
                    Continue with {provider.name}
                  </button>
                ))}
          </div>

          {/* Agency Login CTA */}
          <div className="mb-8">
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-2xl p-5 text-white shadow-lg space-y-5">
              <div className="flex items-start gap-3">
                <div className="bg-white/20 p-3 rounded-xl">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-sm uppercase tracking-widest text-white/70">Agency seats</p>
                  <h3 className="text-xl font-semibold">Host events & source creators</h3>
                  <p className="text-sm text-white/80 mt-1">
                    Use any agency email + access code to preview the workflow. We’ll route you to an interactive demo that sends dummy notifications to creators.
                  </p>
                </div>
              </div>

              <form
                className="space-y-3"
                onSubmit={(event) => {
                  event.preventDefault();
                  setAgencyError(null);
                  if (!agencyEmail || !agencyAccessCode) {
                    setAgencyError('Enter both email and access code to continue.');
                    return;
                  }

                  try {
                    setAgencyLoading(true);
                    if (typeof window !== 'undefined') {
                      window.sessionStorage.setItem(
                        AGENCY_DEMO_STORAGE_KEY,
                        JSON.stringify({ email: agencyEmail, accessCode: agencyAccessCode })
                      );
                    }
                    router.push('/agency/demo');
                  } catch (demoError) {
                    console.error('Failed to start agency demo:', demoError);
                    setAgencyError('Something went wrong. Please try again.');
                    setAgencyLoading(false);
                  }
                }}
              >
                <label className="block text-sm font-medium text-white/80">
                  Agency email
                  <input
                    type="email"
                    value={agencyEmail}
                    onChange={(event) => setAgencyEmail(event.target.value)}
                    placeholder="events@agency.com"
                    className="mt-2 w-full rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-white placeholder:text-white/60 focus:border-white focus:outline-none"
                  />
                </label>
                <label className="block text-sm font-medium text-white/80">
                  Access code
                  <input
                    type="password"
                    value={agencyAccessCode}
                    onChange={(event) => setAgencyAccessCode(event.target.value)}
                    placeholder="••••••"
                    className="mt-2 w-full rounded-xl border border-white/30 bg-white/10 px-3 py-2 text-white placeholder:text-white/60 focus:border-white focus:outline-none"
                  />
                </label>
                {agencyError && (
                  <p className="text-sm text-amber-200">{agencyError}</p>
                )}
                <button
                  type="submit"
                  disabled={agencyLoading}
                  className={`w-full inline-flex items-center justify-center gap-2 bg-white text-purple-700 font-semibold px-4 py-2 rounded-xl shadow hover:bg-purple-50 transition ${agencyLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {agencyLoading ? 'Loading demo…' : 'Login as Agency'}
                  {!agencyLoading && <ArrowRight className="h-4 w-4" />}
                </button>
              </form>
            </div>
          </div>

          {/* Divider */}
          <div className="relative mb-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-gray-500 font-medium">What you'll get</span>
            </div>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center p-3 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                <Sparkles className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">AI-Powered Content</p>
                <p className="text-xs text-gray-600">Generate captions and ideas instantly</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                <TrendingUp className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Advanced Analytics</p>
                <p className="text-xs text-gray-600">Track performance across platforms</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 w-8 h-8 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                <Users className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Multi-Platform</p>
                <p className="text-xs text-gray-600">Instagram, YouTube & Facebook</p>
              </div>
            </div>
            
            <div className="flex items-center p-3 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl">
              <div className="bg-gradient-to-r from-gray-600 to-slate-700 w-8 h-8 rounded-lg flex items-center justify-center mr-3 flex-shrink-0">
                <Shield className="h-4 w-4 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Secure & Reliable</p>
                <p className="text-xs text-gray-600">Bank-level security standards</p>
              </div>
            </div>
          </div>

          {/* Back to Homepage */}
          <div className="mt-8 text-center">
            <Link 
              href="/" 
              className="text-sm text-gray-500 hover:text-indigo-600 transition-colors"
            >
              ← Back to homepage
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
