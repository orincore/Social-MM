'use client';

import { ReactNode } from 'react';
import UserProfileHeader from './user-profile-header';

interface DashboardHeaderProps {
  title: string;
  description?: string;
  children?: ReactNode;
}

export default function DashboardHeader({ title, description, children }: DashboardHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
          {description && (
            <p className="text-gray-600 mt-1">{description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {children}
        <UserProfileHeader />
      </div>
    </div>
  );
}
