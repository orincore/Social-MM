'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Settings, User, Bell, Shield, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();

  if (!session) {
    router.push('/auth/signin');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Settings className="w-8 h-8" />
            Settings
          </h1>
          <p className="text-gray-600 mt-2">Manage your account and preferences</p>
        </div>

        {/* Settings Sections */}
        <div className="space-y-6">
          {/* Account Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <User className="w-5 h-5 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-900">Account Information</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={session.user?.email || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={session.user?.name || ''}
                  disabled
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-600"
                />
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-900">Notifications</h2>
            </div>
            
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-blue-600" defaultChecked />
                <span className="text-gray-700">Email notifications for scheduled posts</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-blue-600" defaultChecked />
                <span className="text-gray-700">Publishing success notifications</span>
              </label>
              
              <label className="flex items-center gap-3 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 text-blue-600" />
                <span className="text-gray-700">Weekly analytics summary</span>
              </label>
            </div>
          </div>

          {/* Privacy & Security */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Shield className="w-5 h-5 text-gray-700" />
              <h2 className="text-xl font-semibold text-gray-900">Privacy & Security</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Connected Accounts</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Manage your connected social media accounts
                </p>
                <Link
                  href="/dashboard/accounts"
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Manage Accounts
                </Link>
              </div>
            </div>
          </div>

          {/* Danger Zone */}
          <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Trash2 className="w-5 h-5 text-red-600" />
              <h2 className="text-xl font-semibold text-red-900">Danger Zone</h2>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-900 mb-2">Delete Account</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <Link
                  href="/legal/deletion"
                  className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Request Account Deletion
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Back to Dashboard */}
        <div className="mt-8">
          <Link
            href="/dashboard"
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
