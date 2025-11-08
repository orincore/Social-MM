import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { InstagramAccount } from '@/models/InstagramAccount';

export async function GET() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Get all Instagram accounts for this user
    const instagramAccounts = await InstagramAccount.find({ userId: user._id });

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      },
      instagramAccounts: instagramAccounts.map(acc => ({
        id: acc._id,
        instagramId: acc.instagramId,
        username: acc.username,
        accountType: acc.accountType,
        isActive: acc.isActive,
        tokenExpiresAt: acc.tokenExpiresAt,
        lastSyncAt: acc.lastSyncAt,
        createdAt: acc.createdAt
      }))
    });
  } catch (error) {
    console.error('Debug Instagram error:', error);
    return NextResponse.json({ 
      error: 'Failed to debug Instagram accounts',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
