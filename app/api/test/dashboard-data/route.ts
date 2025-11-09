import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test the combined analytics endpoint
    const response = await fetch('http://127.0.0.1:3000/api/analytics/combined?period=month', {
      headers: {
        'Cookie': `next-auth.session-token=test`, // This won't work but let's see
      },
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      status: response.status,
      data: result,
      sessionEmail: session.user.email,
      testUrl: 'http://127.0.0.1:3000/api/analytics/combined?period=month'
    });
  } catch (error) {
    console.error('Dashboard data test error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
