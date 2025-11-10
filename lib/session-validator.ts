import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import User from '@/models/User';

export interface SessionValidationResult {
  isValid: boolean;
  user?: any;
  session?: any;
  error?: string;
}

/**
 * Validates if the current session user still exists in the database
 * Returns validation result with user data if valid
 */
export async function validateUserSession(): Promise<SessionValidationResult> {
  try {
    // Get current session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return {
        isValid: false,
        error: 'No active session found'
      };
    }

    // Connect to database and check if user exists
    await connectDB();
    const user = await User.findOne({ email: session.user.email });

    if (!user) {
      return {
        isValid: false,
        session,
        error: 'User not found in database - may have been deleted'
      };
    }

    return {
      isValid: true,
      user,
      session
    };

  } catch (error) {
    console.error('Session validation error:', error);
    return {
      isValid: false,
      error: 'Session validation failed'
    };
  }
}

/**
 * Middleware helper to validate user existence and redirect to logout if deleted
 */
export async function validateUserExistence(email: string): Promise<boolean> {
  try {
    await connectDB();
    const user = await User.findOne({ email });
    return !!user;
  } catch (error) {
    console.error('User existence check failed:', error);
    return false;
  }
}
