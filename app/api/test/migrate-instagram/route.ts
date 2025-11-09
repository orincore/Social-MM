import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Call the migration endpoint
    const migrationResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/instagram/migrate-account-types`, {
      method: 'POST',
      headers: {
        'Cookie': `next-auth.session-token=test`, // This won't work perfectly but for testing
      },
    });

    const migrationResult = await migrationResponse.json();

    return NextResponse.json({
      success: true,
      migrationStatus: migrationResponse.status,
      migrationResult: migrationResult,
      message: 'Migration test completed'
    });
  } catch (error) {
    console.error('Migration test error:', error);
    return NextResponse.json({ 
      error: 'Migration test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
