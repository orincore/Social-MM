import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { getInstagramAnalytics } from '@/lib/instagram-analytics';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Test: Calling direct Instagram analytics for:', session.user.email);
    
    const result = await getInstagramAnalytics(session.user.email, 'month');
    
    console.log('Test: Direct Instagram analytics result:', {
      hasData: !!result,
      followers: result?.account?.followers_count,
      reach: result?.insights?.reach,
      posts: result?.account?.media_count
    });

    return NextResponse.json({
      success: true,
      data: result,
      sessionEmail: session.user.email
    });
  } catch (error) {
    console.error('Test direct Instagram analytics error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
