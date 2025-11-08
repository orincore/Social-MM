'use client';

import { usePhoneCheck } from '@/lib/usePhoneCheck';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isChecking } = usePhoneCheck();

  if (isChecking) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Checking account...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
