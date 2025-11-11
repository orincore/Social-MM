'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { Calendar, BarChart3, Settings, Zap, Plus, User, LogOut, Crown, PenTool, ChevronDown, FileText } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import ClientOnly from '@/components/client-only';
import UserValidationWrapper from '@/components/user-validation-wrapper';
import { usePhoneCheck } from '@/lib/usePhoneCheck';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const { isChecking } = usePhoneCheck();
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const sidebarDropdownRef = useRef<HTMLDivElement>(null);
  const topDropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sidebarDropdownRef.current && 
        !sidebarDropdownRef.current.contains(event.target as Node) &&
        topDropdownRef.current && 
        !topDropdownRef.current.contains(event.target as Node)
      ) {
        setShowProfileDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (status === 'loading' || isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Zap className="h-12 w-12 text-indigo-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">Please sign in to access the dashboard</p>
          <Link href="/auth/signin" className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors">
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <UserValidationWrapper>
      <div className="min-h-screen bg-gray-50">
        {/* Sidebar */}
        <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex items-center px-6 py-4 border-b">
          <Zap className="h-8 w-8 text-indigo-600" />
          <h1 className="ml-2 text-xl font-bold text-gray-900">Social MM</h1>
        </div>
        
        <nav className="mt-6">
          <div className="px-3">
            <Link
              href="/dashboard/content/create"
              className="flex items-center px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <PenTool className="h-5 w-5 mr-3" />
              Create Content
            </Link>
            <Link
              href="/dashboard/posts"
              className="flex items-center px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors mt-1"
            >
              <FileText className="h-5 w-5 mr-3" />
              Posts History
            </Link>
            <Link
              href="/dashboard/calendar"
              className="flex items-center px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors mt-1"
            >
              <Calendar className="h-5 w-5 mr-3" />
              Calendar
            </Link>
            <Link
              href="/dashboard/analytics"
              className="flex items-center px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors mt-1"
            >
              <BarChart3 className="h-5 w-5 mr-3" />
              Analytics
            </Link>
            <Link
              href="/dashboard/settings"
              className="flex items-center px-3 py-2 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors mt-1"
            >
              <Settings className="h-5 w-5 mr-3" />
              Settings
            </Link>
          </div>
        </nav>

        {/* Bottom section */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <ClientOnly fallback={
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse"></div>
                <div className="ml-3 flex-1">
                  <div className="h-4 bg-gray-200 rounded animate-pulse mb-1"></div>
                  <div className="h-3 bg-gray-200 rounded animate-pulse w-16"></div>
                </div>
              </div>
            </div>
          }>
            <div className="relative" ref={sidebarDropdownRef}>
              {/* User Profile - Clickable */}
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="w-full flex items-center p-2 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <img 
                  src={session?.user?.image || ''} 
                  alt={session?.user?.name || ''} 
                  className="w-10 h-10 rounded-full border-2 border-indigo-100"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                    e.currentTarget.nextElementSibling?.classList.remove('hidden');
                  }}
                />
                <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center hidden border-2 border-indigo-200">
                  <User className="h-5 w-5 text-indigo-600" />
                </div>
                <div className="ml-3 flex-1 text-left">
                  <p className="text-sm font-medium text-gray-900 truncate">{session?.user?.name}</p>
                  <div className="flex items-center">
                    <p className="text-xs text-gray-500">
                      {(session?.user as any)?.subscriptionPlan === 'pro' ? 'Pro Plan' : 'Free Plan'}
                    </p>
                    {(session?.user as any)?.subscriptionPlan === 'pro' && (
                      <Crown className="h-3 w-3 text-yellow-500 ml-1" />
                    )}
                  </div>
                </div>
                <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Profile Dropdown */}
              {showProfileDropdown && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white border border-gray-200 rounded-lg shadow-lg py-1">
                  <Link
                    href="/dashboard/profile"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowProfileDropdown(false)}
                  >
                    <User className="h-4 w-4 mr-3" />
                    View Profile
                  </Link>
                  <Link
                    href="/dashboard/settings"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setShowProfileDropdown(false)}
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Settings
                  </Link>
                  <hr className="my-1" />
                  <button
                    onClick={() => {
                      setShowProfileDropdown(false);
                      signOut({ callbackUrl: '/' });
                    }}
                    className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </ClientOnly>
        </div>
      </div>

      {/* Main content */}
      <div className="ml-64">
        {/* Top bar */}
        <header className="bg-white shadow-sm border-b">
          <div className="flex items-center justify-between px-6 py-4">
            <h2 className="text-2xl font-semibold text-gray-900">Dashboard</h2>
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard/content/create"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Post
              </Link>
              
              {/* Top Profile Section */}
              <div className="relative" ref={topDropdownRef}>
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <img 
                    src={session?.user?.image || ''} 
                    alt={session?.user?.name || ''} 
                    className="w-8 h-8 rounded-full border-2 border-indigo-100"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center hidden border-2 border-indigo-200">
                    <User className="h-4 w-4 text-indigo-600" />
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${showProfileDropdown ? 'rotate-180' : ''}`} />
                </button>

                {/* Top Profile Dropdown */}
                {showProfileDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100">
                      <p className="text-sm font-medium text-gray-900 truncate">{session?.user?.name}</p>
                      <p className="text-xs text-gray-500 truncate">{session?.user?.email}</p>
                    </div>
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowProfileDropdown(false)}
                    >
                      <User className="h-4 w-4 mr-3" />
                      View Profile
                    </Link>
                    <Link
                      href="/dashboard/settings"
                      className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowProfileDropdown(false)}
                    >
                      <Settings className="h-4 w-4 mr-3" />
                      Settings
                    </Link>
                    <hr className="my-1" />
                    <button
                      onClick={() => {
                        setShowProfileDropdown(false);
                        signOut({ callbackUrl: '/' });
                      }}
                      className="w-full flex items-center px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut className="h-4 w-4 mr-3" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
    </UserValidationWrapper>
  );
}
