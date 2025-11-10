import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { InstagramAccount } from '@/models/InstagramAccount';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Find user
    const user = await User.findOne({ email: session.user.email });
    console.log('Debug - User lookup:', { 
      email: session.user.email, 
      found: !!user, 
      userId: user?._id 
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found',
        sessionEmail: session.user.email
      });
    }

    // Find all Instagram accounts for this user
    const allAccounts = await InstagramAccount.find({ userId: user._id });
    const activeAccounts = await InstagramAccount.find({ userId: user._id, isActive: true });

    console.log('Debug - Instagram accounts:', {
      userId: user._id,
      totalAccounts: allAccounts.length,
      activeAccounts: activeAccounts.length,
      accounts: allAccounts.map(acc => ({
        id: acc._id,
        instagramId: acc.instagramId,
        username: acc.username,
        isActive: acc.isActive,
        tokenExpiresAt: acc.tokenExpiresAt,
        createdAt: acc.createdAt
      }))
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      },
      instagramAccounts: {
        total: allAccounts.length,
        active: activeAccounts.length,
        accounts: allAccounts.map(acc => ({
          id: acc._id,
          instagramId: acc.instagramId,
          username: acc.username,
          isActive: acc.isActive,
          tokenExpiresAt: acc.tokenExpiresAt,
          tokenExpired: new Date() > acc.tokenExpiresAt,
          createdAt: acc.createdAt,
          lastSyncAt: acc.lastSyncAt
        }))
      }
    });
  } catch (error) {
    console.error('Debug endpoint error:', error);
    return NextResponse.json({ 
      error: 'Debug failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
