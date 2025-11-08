'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Zap, AlertCircle } from 'lucide-react';

export default function AuthErrorPage() {
  const searchParams = useSearchParams();
  const error = searchParams.get('error');

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.';
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.';
      case 'Verification':
        return 'The verification token has expired or has already been used.';
      case 'OAuthSignin':
        return 'Error in constructing an authorization URL.';
      case 'OAuthCallback':
        return 'Error in handling the response from an OAuth provider.';
      case 'OAuthCreateAccount':
        return 'Could not create OAuth account in the database.';
      case 'EmailCreateAccount':
        return 'Could not create email account in the database.';
      case 'Callback':
        return 'Error in the OAuth callback handler route.';
      case 'OAuthAccountNotLinked':
        return 'The email on the account is already linked, but not with this OAuth account.';
      case 'EmailSignin':
        return 'Sending the e-mail with the verification token failed.';
      case 'CredentialsSignin':
        return 'The authorize callback returned null in the Credentials provider.';
      case 'SessionRequired':
        return 'The content of this page requires you to be signed in at all times.';
      default:
        return 'An unexpected error occurred during authentication.';
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
          <div className="mt-6 flex justify-center">
            <AlertCircle className="h-16 w-16 text-red-500" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Authentication Error
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            We encountered an issue while trying to sign you in
          </p>
        </div>

        <div className="mt-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error Details</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{getErrorMessage(error)}</p>
                  {error && (
                    <p className="mt-1 text-xs text-red-600">Error code: {error}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            <Link
              href="/auth/signin"
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Try Again
            </Link>
            <Link
              href="/"
              className="w-full flex justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
            >
              Go to Homepage
            </Link>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              If this problem persists, please contact support at{' '}
              <a href="mailto:support@socialmm.com" className="text-indigo-600 hover:text-indigo-500">
                support@socialmm.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
