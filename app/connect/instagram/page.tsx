'use client';

import { useEffect } from 'react';
import { signIn, useSession } from 'next-auth/react';
import { Instagram } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ConnectInstagramPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin');
    }
  }, [status, router]);

  const handleConnect = () => {
    signIn('meta', { callbackUrl: '/dashboard/instagram' });
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-md w-full bg-white rounded-lg shadow-sm p-8 text-center">
        <Instagram className="h-16 w-16 text-pink-500 mx-auto mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Connect Instagram</h1>
        <p className="text-gray-600 mb-6">
          Connect your Instagram Business account to manage posts, view analytics, and engage with your audience.
        </p>
        <div className="space-y-4">
          <button
            onClick={handleConnect}
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white py-3 px-6 rounded-lg hover:from-purple-600 hover:to-pink-600 transition-colors flex items-center justify-center"
          >
            <Instagram className="h-5 w-5 mr-2" />
            Connect via Meta
          </button>
          <p className="text-sm text-gray-500">
            You'll be redirected to Meta to authorize access to your Instagram Business account.
          </p>
        </div>
      </div>
    </div>
  );
}
