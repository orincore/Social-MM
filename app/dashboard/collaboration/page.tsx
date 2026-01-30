'use client';

import ProtectedRoute from '@/components/protected-route';
import CreatorCollaborationHub from '@/components/creator-collaboration-hub';
import { Users2, Bell } from 'lucide-react';

export default function CollaborationPage() {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-16 py-10 space-y-8">
          <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6 flex flex-col gap-4">
            <div className="inline-flex items-center gap-2 text-sm font-medium text-purple-600 bg-purple-50 px-3 py-1 rounded-full w-max">
              <Users2 className="h-4 w-4" />
              AI Collaboration
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Connect with aligned creators</h1>
              <p className="mt-2 text-gray-600 max-w-3xl">
                Our AI scans your connected platforms, finds overlapping audiences, and routes warm collaboration
                requests complete with notifications and a focused chat workspace. Use the mock data below to explore the flow.
              </p>
            </div>

            <div className="inline-flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-2xl p-4 text-sm text-amber-900">
              <div className="p-2 rounded-full bg-white text-amber-500">
                <Bell className="h-4 w-4" />
              </div>
              <div>
                <p className="font-semibold">Hey Adarsh!</p>
                <p>We found a creator who makes similar content—want to open their profile and explore a collab?</p>
              </div>
            </div>
          </div>

          <CreatorCollaborationHub className="mt-4" />
        </div>
      </div>
    </ProtectedRoute>
  );
}
