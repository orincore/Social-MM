import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import { AnalyticsCacheManager } from '@/lib/analytics-cache';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { platform } = await request.json();

    console.log('Cache invalidation requested for platform:', platform);
    
    // Invalidate cache for the user and platform
    await AnalyticsCacheManager.invalidateCache(session.user.email, platform);
    
    console.log('Cache invalidated successfully');
    
    return NextResponse.json({ 
      success: true, 
      message: `Cache invalidated for ${platform || 'all platforms'}` 
    });
  } catch (error) {
    console.error('Cache invalidation error:', error);
    return NextResponse.json({ 
      error: 'Failed to invalidate cache',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
