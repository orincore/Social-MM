'use client';

import { signIn, getProviders } from 'next-auth/react';
import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Zap, Github, AlertTriangle } from 'lucide-react';

interface Provider {
  id: string;
  name: string;
  type: string;
  signinUrl: string;
  callbackUrl: string;
}

export default function SignInPage() {
  const [providers, setProviders] = useState<Record<string, Provider> | null>(null);
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  useEffect(() => {
    const fetchProviders = async () => {
      const res = await getProviders();
      setProviders(res);
    };
    fetchProviders();
  }, []);

  const getProviderIcon = (providerId: string) => {
    switch (providerId) {
      case 'github':
        return <Github className="h-5 w-5" />;
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <div className="flex justify-center">
            <Link href="/" className="flex items-center">
              <Zap className="h-12 w-12 text-indigo-600" />
              <span className="ml-2 text-3xl font-bold text-gray-900">Social MM</span>
            </Link>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Or{' '}
            <Link href="/" className="font-medium text-indigo-600 hover:text-indigo-500">
              go back to homepage
            </Link>
          </p>
        </div>

        {/* Error Message */}
        {error === 'account_deleted' && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
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
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-5 w-5 text-red-500 mr-3" />
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

        <div className="mt-8 space-y-4">
          {providers &&
            Object.values(providers).map((provider) => (
              <div key={provider.name}>
                <button
                  onClick={async () => {
                    console.log('Attempting to sign in with:', provider.id);
                    try {
                      const result = await signIn(provider.id, { 
                        redirect: false 
                      });
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
                  className="group relative w-full flex justify-center py-3 px-4 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
                >
                  <span className="absolute left-0 inset-y-0 flex items-center pl-4">
                    {getProviderIcon(provider.id)}
                  </span>
                  Continue with {provider.name}
                </button>
              </div>
            ))}
        </div>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-50 text-gray-500">Features you'll get</span>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            <div className="flex items-center text-sm text-gray-600">
              <span className="text-green-500 mr-2">✓</span>
              Schedule posts across Instagram, Facebook & YouTube
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="text-green-500 mr-2">✓</span>
              AI-powered caption and content generation
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="text-green-500 mr-2">✓</span>
              Detailed analytics and performance tracking
            </div>
            <div className="flex items-center text-sm text-gray-600">
              <span className="text-green-500 mr-2">✓</span>
              Free plan with 10 posts per month
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
