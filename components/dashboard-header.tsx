'use client';

import { ReactNode } from 'react';
import UserProfileHeader from './user-profile-header';
import { cn } from '@/lib/utils';

interface DashboardHeaderProps {
  title: string;
  description?: string | ReactNode;
  children?: ReactNode;
  className?: string;
}

export default function DashboardHeader({ 
  title, 
  description, 
  children, 
  className 
}: DashboardHeaderProps) {
  return (
    <header className={cn(
      "w-full bg-white rounded-xl shadow-sm border border-gray-100 p-4 sm:p-6 mb-6 transition-all duration-200",
      className
    )}>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 w-full">
        <div className="flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            {title}
          </h1>
          {description && (
            <p className="text-sm sm:text-base text-gray-500 mt-1.5 max-w-3xl">
              {description}
            </p>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
            {children}
          </div>
          <div className="hidden sm:block h-6 w-px bg-gray-200 mx-1"></div>
          <div className="w-full sm:w-auto">
            <UserProfileHeader />
          </div>
        </div>
      </div>
    </header>
  );
}
