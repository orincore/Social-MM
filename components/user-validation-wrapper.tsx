'use client';

import { useUserValidationOnMount } from '@/hooks/useUserValidation';

interface UserValidationWrapperProps {
  children: React.ReactNode;
}

/**
 * Client component that validates user existence on mount
 * Automatically logs out users if their account has been deleted
 */
export default function UserValidationWrapper({ children }: UserValidationWrapperProps) {
  // Validate user existence when component mounts or session changes
  useUserValidationOnMount();

  return <>{children}</>;
}
