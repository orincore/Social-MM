'use client';

import { useSession, signOut } from 'next-auth/react';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * Hook to validate user existence and handle automatic logout
 * Checks periodically if the user still exists in the database
 */
export function useUserValidation(intervalMs: number = 60000) { // Check every minute
  const { data: session, status } = useSession();
  const router = useRouter();
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Only run validation for authenticated users
    if (status !== 'authenticated' || !session?.user?.email) {
      return;
    }

    const validateUser = async () => {
      try {
        const response = await fetch('/api/auth/validate-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 404) {
          // User not found in database
          console.log('User not found in database, logging out...');
          
          // Sign out and redirect to login with error message
          await signOut({ 
            redirect: false,
            callbackUrl: '/auth/signin?error=account_deleted'
          });
          
          router.push('/auth/signin?error=account_deleted');
        } else if (!response.ok) {
          console.warn('User validation failed:', response.status);
        }
      } catch (error) {
        console.error('User validation error:', error);
        // Don't logout on network errors, just log the issue
      }
    };

    // Run initial validation
    validateUser();

    // Set up periodic validation
    intervalRef.current = setInterval(validateUser, intervalMs);

    // Cleanup interval on unmount
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [session, status, router, intervalMs]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);
}

/**
 * Lightweight version that only checks on mount/session change
 */
export function useUserValidationOnMount() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user?.email) {
      return;
    }

    const validateUser = async () => {
      try {
        const response = await fetch('/api/auth/validate-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (response.status === 404) {
          console.log('User not found in database, logging out...');
          await signOut({ 
            redirect: false,
            callbackUrl: '/auth/signin?error=account_deleted'
          });
          router.push('/auth/signin?error=account_deleted');
        }
      } catch (error) {
        console.error('User validation error:', error);
      }
    };

    validateUser();
  }, [session, status, router]);
}
