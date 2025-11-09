import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Test direct call to Instagram analytics
    const response = await fetch('http://127.0.0.1:3000/api/instagram/analytics?period=month', {
      headers: {
        'Cookie': `next-auth.session-token=${session.user.email}`, // This won't work, just for testing
      },
    });

    const result = await response.json();

    return NextResponse.json({
      success: true,
      status: response.status,
      data: result,
      sessionEmail: session.user.email
    });
  } catch (error) {
    console.error('Test endpoint error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
