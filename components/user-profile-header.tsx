'use client';

import { useSession, signOut } from 'next-auth/react';
import { User, LogOut, Settings, ChevronDown } from 'lucide-react';
import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';

export default function UserProfileHeader() {
  const { data: session } = useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!session?.user) {
    return null;
  }

  const userImage = session.user.image;
  const userName = session.user.name || session.user.email || 'User';
  const userEmail = session.user.email;

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-100 transition-colors"
      >
        {/* Profile Picture */}
        <div className="relative">
          {userImage ? (
            <img
              src={userImage}
              alt={userName}
              className="w-8 h-8 rounded-full object-cover border-2 border-gray-200"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* User Info */}
        <div className="text-left hidden sm:block">
          <p className="text-sm font-medium text-gray-900 truncate max-w-32">
            {userName}
          </p>
          <p className="text-xs text-gray-500 truncate max-w-32">
            {userEmail}
          </p>
        </div>

        {/* Dropdown Arrow */}
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isDropdownOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
          {/* User Info in Dropdown (for mobile) */}
          <div className="px-4 py-3 border-b border-gray-100 sm:hidden">
            <p className="text-sm font-medium text-gray-900">{userName}</p>
            <p className="text-xs text-gray-500">{userEmail}</p>
          </div>

          {/* Menu Items */}
          <Link
            href="/dashboard/profile"
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setIsDropdownOpen(false)}
          >
            <User className="w-4 h-4" />
            Profile Settings
          </Link>

          <Link
            href="/dashboard/settings"
            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
            onClick={() => setIsDropdownOpen(false)}
          >
            <Settings className="w-4 h-4" />
            Account Settings
          </Link>

          <div className="border-t border-gray-100 mt-1 pt-1">
            <button
              onClick={() => {
                setIsDropdownOpen(false);
                signOut({ callbackUrl: '/auth/signin' });
              }}
              className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors w-full text-left"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
