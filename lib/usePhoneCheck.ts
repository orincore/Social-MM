'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export function usePhoneCheck() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);
  const [hasPhone, setHasPhone] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    
    if (!session) {
      setIsChecking(false);
      return;
    }

    checkPhoneNumber();
  }, [session, status]);

  const checkPhoneNumber = async () => {
    try {
      const response = await fetch('/api/user/profile');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          const userHasPhone = !!data.data.phone;
          setHasPhone(userHasPhone);
          
          // If user doesn't have phone and is not on onboarding page, redirect
          if (!userHasPhone && window.location.pathname !== '/onboarding') {
            router.push('/onboarding');
            return;
          }
        }
      }
    } catch (error) {
      console.error('Error checking phone number:', error);
    } finally {
      setIsChecking(false);
    }
  };

  return { isChecking, hasPhone, session };
}
