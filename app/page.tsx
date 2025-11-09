'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';
import type { Session } from 'next-auth';
import { Calendar, BarChart3, Settings, Zap, Users, Clock, LogOut } from 'lucide-react';
import ClientOnly from '@/components/client-only';

export default function HomePage() {
  const { data: session, status } = useSession();

  // Redirect logged-in users to dashboard
  React.useEffect(() => {
    if (status === 'authenticated' && session) {
      window.location.href = '/dashboard';
    }
  }, [session, status]);

  // Show loading state while checking authentication
  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show loading state while redirecting authenticated users
  if (status === 'authenticated' && session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to dashboard...</p>
        </div>
      </div>
    );
  }

  const handleGetStarted = () => {
    if (session) {
      window.location.href = '/dashboard';
    } else {
      signIn();
    }
  };

  const typedSession = session as Session | null;
  const user = typedSession?.user;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <Zap className="h-8 w-8 text-indigo-600" />
              <h1 className="ml-2 text-2xl font-bold text-gray-900">Social MM</h1>
            </div>
            <nav className="flex items-center space-x-8">
              <ClientOnly fallback={
                <div className="flex items-center space-x-8">
                  <Link href="#features" className="text-gray-600 hover:text-indigo-600 transition-colors">
                    Features
                  </Link>
                  <Link href="#pricing" className="text-gray-600 hover:text-indigo-600 transition-colors">
                    Pricing
                  </Link>
                  <div className="w-16 h-8 bg-gray-200 rounded animate-pulse"></div>
                </div>
              }>
                {session ? (
                  <>
                    <Link href="/dashboard" className="text-gray-600 hover:text-indigo-600 transition-colors">
                      Dashboard
                    </Link>
                    <div className="flex items-center space-x-3">
                      <img 
                        src={user?.image || ''} 
                        alt={user?.name || ''} 
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="text-sm font-medium text-gray-700">{user?.name || 'User'}</span>
                    </div>
                  </>
                ) : (
                  <>
                    <Link href="#features" className="text-gray-600 hover:text-indigo-600 transition-colors">
                      Features
                    </Link>
                    <Link href="#pricing" className="text-gray-600 hover:text-indigo-600 transition-colors">
                      Pricing
                    </Link>
                    <button 
                      onClick={() => signIn()}
                      className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                      Sign In
                    </button>
                  </>
                )}
              </ClientOnly>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-gray-900 sm:text-5xl">
            Manage All Your Social Media
            <span className="text-indigo-600"> In One Place</span>
          </h2>
          <p className="mt-6 text-xl text-gray-600 max-w-3xl mx-auto">
            Schedule posts across Instagram, Facebook, and YouTube. Generate AI-powered captions and content ideas. 
            Track analytics and grow your audience effortlessly.
          </p>
          <div className="mt-10">
            <ClientOnly fallback={
              <div className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold inline-block">
                Get Started Free
              </div>
            }>
              <button 
                onClick={handleGetStarted}
                className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-indigo-700 transition-colors inline-block"
              >
                {session ? 'Go to Dashboard' : 'Get Started Free'}
              </button>
            </ClientOnly>
          </div>
        </div>

        {/* Features Grid */}
        <div id="features" className="mt-20">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Everything You Need to Succeed
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Calendar className="h-12 w-12 text-indigo-600 mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Content Calendar</h4>
              <p className="text-gray-600">
                Plan and schedule your posts across all platforms with our intuitive calendar interface.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Zap className="h-12 w-12 text-indigo-600 mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">AI-Powered Content</h4>
              <p className="text-gray-600">
                Generate engaging captions and content ideas using advanced AI technology.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <BarChart3 className="h-12 w-12 text-indigo-600 mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Analytics Dashboard</h4>
              <p className="text-gray-600">
                Track performance across all platforms with detailed analytics and insights.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Users className="h-12 w-12 text-indigo-600 mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Multi-Platform</h4>
              <p className="text-gray-600">
                Connect Instagram, Facebook, and YouTube accounts seamlessly.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Clock className="h-12 w-12 text-indigo-600 mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Auto Publishing</h4>
              <p className="text-gray-600">
                Set it and forget it with reliable automated posting at optimal times.
              </p>
            </div>
            <div className="bg-white p-6 rounded-xl shadow-sm">
              <Settings className="h-12 w-12 text-indigo-600 mb-4" />
              <h4 className="text-xl font-semibold text-gray-900 mb-2">Easy Management</h4>
              <p className="text-gray-600">
                Simple, intuitive interface that makes social media management effortless.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div id="pricing" className="mt-20">
          <h3 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Simple, Transparent Pricing
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-xl shadow-sm">
              <h4 className="text-2xl font-bold text-gray-900 mb-2">Free</h4>
              <p className="text-gray-600 mb-6">Perfect for getting started</p>
              <div className="text-4xl font-bold text-gray-900 mb-6">₹0<span className="text-lg text-gray-600">/month</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-2">✓</span>
                  Up to 3 social accounts
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-2">✓</span>
                  10 scheduled posts per month
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-2">✓</span>
                  Basic analytics
                </li>
                <li className="flex items-center text-gray-600">
                  <span className="text-green-500 mr-2">✓</span>
                  AI caption generation (5/month)
                </li>
              </ul>
              <Link 
                href="/dashboard/calendar"
                className="w-full bg-gray-100 text-gray-900 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors block text-center"
              >
                Get Started
              </Link>
            </div>
            <div className="bg-indigo-600 p-8 rounded-xl shadow-sm text-white relative">
              <div className="absolute top-0 right-0 bg-yellow-400 text-gray-900 px-3 py-1 rounded-bl-lg rounded-tr-xl text-sm font-semibold">
                Popular
              </div>
              <h4 className="text-2xl font-bold mb-2">Pro</h4>
              <p className="text-indigo-100 mb-6">For serious content creators</p>
              <div className="text-4xl font-bold mb-6">₹149<span className="text-lg text-indigo-200">/month</span></div>
              <ul className="space-y-3 mb-8">
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Unlimited social accounts
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Unlimited scheduled posts
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Advanced analytics
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Unlimited AI features
                </li>
                <li className="flex items-center">
                  <span className="text-green-400 mr-2">✓</span>
                  Priority support
                </li>
              </ul>
              <Link 
                href="/dashboard/calendar"
                className="w-full bg-white text-indigo-600 py-3 rounded-lg font-semibold hover:bg-gray-100 transition-colors block text-center"
              >
                Start Pro Trial
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
