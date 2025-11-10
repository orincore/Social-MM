import { NextRequest, NextResponse } from 'next/server';
import { validateUserSession } from '@/lib/session-validator';

export async function POST(request: NextRequest) {
  try {
    const validation = await validateUserSession();

    if (!validation.isValid) {
      if (validation.error?.includes('User not found')) {
        // User was deleted from database
        return NextResponse.json({
          error: 'User account not found',
          message: 'Your account has been deleted'
        }, { status: 404 });
      } else if (validation.error?.includes('No active session')) {
        // No session found
        return NextResponse.json({
          error: 'No active session'
        }, { status: 401 });
      } else {
        // Other validation error
        return NextResponse.json({
          error: 'Validation failed',
          message: validation.error
        }, { status: 400 });
      }
    }

    // User exists and session is valid
    return NextResponse.json({
      valid: true,
      user: {
        id: validation.user._id,
        email: validation.user.email,
        name: validation.user.name,
        lastValidated: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('User validation API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to validate user'
    }, { status: 500 });
  }
}
