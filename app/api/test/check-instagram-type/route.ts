import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    console.log('Testing Instagram account type detection...');

    // Test the status endpoint
    const statusResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/instagram/status`);
    const statusData = await statusResponse.json();

    return NextResponse.json({
      success: true,
      message: 'Instagram account type check completed',
      statusEndpoint: {
        connected: statusData.connected,
        accountType: statusData.account?.accountType,
        username: statusData.account?.username,
        followers: statusData.account?.followersCount
      },
      expectedType: 'MEDIA_CREATOR',
      isCorrect: statusData.account?.accountType === 'MEDIA_CREATOR'
    });
  } catch (error) {
    console.error('Instagram type check error:', error);
    return NextResponse.json({ 
      error: 'Check failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
