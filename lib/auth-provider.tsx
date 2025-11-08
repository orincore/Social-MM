'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode } from 'react';
import ClientOnly from '@/components/client-only';

interface AuthProviderProps {
  children: ReactNode;
}

export default function AuthProvider({ children }: AuthProviderProps) {
  return (
    <ClientOnly fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    }>
      <SessionProvider>{children}</SessionProvider>
    </ClientOnly>
  );
}
