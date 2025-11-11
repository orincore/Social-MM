'use client';

import React from 'react';
import Link from 'next/link';
import { useSession, signIn } from 'next-auth/react';
import type { Session } from 'next-auth';
import { Calendar, BarChart3, Settings, Zap, Users, Clock, LogOut, Instagram, Youtube, Facebook, Sparkles, TrendingUp, Shield, Star } from 'lucide-react';
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
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg blur opacity-75"></div>
                <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
              </div>
              <h1 className="ml-3 text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Social OS
              </h1>
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
                      className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-2.5 rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl font-medium"
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center">
          <div className="flex justify-center mb-8">
            <div className="flex items-center space-x-4 bg-white/60 backdrop-blur-sm rounded-full px-6 py-3 border border-gray-200">
              <Instagram className="h-6 w-6 text-pink-500" />
              <Youtube className="h-6 w-6 text-red-500" />
              <Facebook className="h-6 w-6 text-blue-500" />
              <span className="text-sm font-medium text-gray-700">All platforms, one dashboard</span>
            </div>
          </div>
          
          <h2 className="text-5xl font-extrabold text-gray-900 sm:text-6xl lg:text-7xl leading-tight">
            Your Social Media
            <br />
            <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              Operating System
            </span>
          </h2>
          
          <p className="mt-8 text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
            The complete platform for content creators and businesses. Schedule posts, generate AI-powered content, 
            track analytics, and grow your audience across Instagram, YouTube, and Facebook.
          </p>
          
          <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
            <ClientOnly fallback={
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold inline-block shadow-lg">
                Get Started Free
              </div>
            }>
              <button 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:from-indigo-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {session ? 'Go to Dashboard' : 'Get Started Free'}
              </button>
            </ClientOnly>
            
            <div className="flex items-center text-sm text-gray-500">
              <Star className="h-4 w-4 text-yellow-400 mr-1" />
              <span className="font-medium">Free forever</span>
              <span className="mx-2">•</span>
              <span>No credit card required</span>
            </div>
          </div>
          
        </div>

        {/* Features Grid */}
        <div id="features" className="mt-32">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              Everything You Need to Succeed
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powerful features designed to help you create, schedule, and optimize your social media presence
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-indigo-200">
              <div className="bg-gradient-to-r from-indigo-500 to-purple-600 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Calendar className="h-7 w-7 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Smart Calendar</h4>
              <p className="text-gray-600 leading-relaxed">
                Plan and schedule your posts across all platforms with our intuitive calendar interface and optimal timing suggestions.
              </p>
            </div>
            
            <div className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-purple-200">
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Sparkles className="h-7 w-7 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">AI Content Studio</h4>
              <p className="text-gray-600 leading-relaxed">
                Generate engaging captions, hashtags, and content ideas using advanced AI technology tailored to your brand.
              </p>
            </div>
            
            <div className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200">
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="h-7 w-7 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Advanced Analytics</h4>
              <p className="text-gray-600 leading-relaxed">
                Track performance across all platforms with detailed analytics, insights, and actionable recommendations.
              </p>
            </div>
            
            <div className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-green-200">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Users className="h-7 w-7 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Multi-Platform Hub</h4>
              <p className="text-gray-600 leading-relaxed">
                Connect Instagram, YouTube, and Facebook accounts seamlessly with unified management and cross-posting.
              </p>
            </div>
            
            <div className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-orange-200">
              <div className="bg-gradient-to-r from-orange-500 to-red-600 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Clock className="h-7 w-7 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Auto Publishing</h4>
              <p className="text-gray-600 leading-relaxed">
                Set it and forget it with reliable automated posting at optimal times for maximum engagement.
              </p>
            </div>
            
            <div className="group bg-white p-8 rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-gray-300">
              <div className="bg-gradient-to-r from-gray-600 to-gray-800 w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                <Shield className="h-7 w-7 text-white" />
              </div>
              <h4 className="text-xl font-semibold text-gray-900 mb-3">Enterprise Security</h4>
              <p className="text-gray-600 leading-relaxed">
                Bank-level security with encrypted data storage, secure API connections, and compliance-ready features.
              </p>
            </div>
          </div>
        </div>

        {/* Pricing Section */}
        <div id="pricing" className="mt-32">
          <div className="text-center mb-16">
            <h3 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h3>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Choose the plan that fits your needs. Start free and upgrade as you grow.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-200 hover:shadow-lg transition-all duration-300">
              <div className="text-center mb-8">
                <h4 className="text-2xl font-bold text-gray-900 mb-2">Free Forever</h4>
                <p className="text-gray-600 mb-6">Perfect for getting started</p>
                <div className="text-5xl font-bold text-gray-900 mb-2">₹0</div>
                <div className="text-gray-500">per month</div>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center text-gray-700">
                  <div className="bg-green-100 rounded-full p-1 mr-3">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Up to 3 social accounts
                </li>
                <li className="flex items-center text-gray-700">
                  <div className="bg-green-100 rounded-full p-1 mr-3">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  10 scheduled posts per month
                </li>
                <li className="flex items-center text-gray-700">
                  <div className="bg-green-100 rounded-full p-1 mr-3">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Basic analytics dashboard
                </li>
                <li className="flex items-center text-gray-700">
                  <div className="bg-green-100 rounded-full p-1 mr-3">
                    <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  AI caption generation (5/month)
                </li>
              </ul>
              
              <button 
                onClick={handleGetStarted}
                className="w-full bg-gray-100 text-gray-900 py-3 rounded-xl font-semibold hover:bg-gray-200 transition-colors"
              >
                Get Started Free
              </button>
            </div>
            
            <div className="relative bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-2xl shadow-xl text-white transform hover:scale-105 transition-all duration-300">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <div className="bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-4 py-2 rounded-full text-sm font-bold shadow-lg">
                  Most Popular
                </div>
              </div>
              
              <div className="text-center mb-8 mt-4">
                <h4 className="text-2xl font-bold mb-2">Pro Plan</h4>
                <p className="text-indigo-100 mb-6">For serious content creators</p>
                <div className="text-5xl font-bold mb-2">₹149</div>
                <div className="text-indigo-200">per month</div>
              </div>
              
              <ul className="space-y-4 mb-8">
                <li className="flex items-center">
                  <div className="bg-white/20 rounded-full p-1 mr-3">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Unlimited social accounts
                </li>
                <li className="flex items-center">
                  <div className="bg-white/20 rounded-full p-1 mr-3">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Unlimited scheduled posts
                </li>
                <li className="flex items-center">
                  <div className="bg-white/20 rounded-full p-1 mr-3">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Advanced analytics & insights
                </li>
                <li className="flex items-center">
                  <div className="bg-white/20 rounded-full p-1 mr-3">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Unlimited AI features
                </li>
                <li className="flex items-center">
                  <div className="bg-white/20 rounded-full p-1 mr-3">
                    <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                  Priority support
                </li>
              </ul>
              
              <button 
                onClick={handleGetStarted}
                className="w-full bg-white text-indigo-600 py-3 rounded-xl font-semibold hover:bg-gray-100 transition-colors shadow-lg"
              >
                Start 14-Day Free Trial
              </button>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <footer className="mt-32 border-t border-gray-200 pt-16 pb-8">
          <div className="text-center">
            <div className="flex items-center justify-center mb-6">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg blur opacity-75"></div>
                <div className="relative bg-gradient-to-r from-indigo-600 to-purple-600 p-2 rounded-lg">
                  <Zap className="h-6 w-6 text-white" />
                </div>
              </div>
              <h3 className="ml-3 text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Social OS
              </h3>
            </div>
            <p className="text-gray-600 mb-6 max-w-md mx-auto">
              The complete social media operating system for creators and businesses.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              An app by <span className="font-medium text-gray-700">ORINCORE Technologies</span>
            </p>
            <div className="flex justify-center space-x-6 text-gray-400">
              <span>© 2024 Social OS. All rights reserved.</span>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
