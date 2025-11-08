import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { InstagramAccount } from '@/models/InstagramAccount';

export async function POST() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Find or create user
    let user = await User.findOne({ email: session.user.email });
    if (!user) {
      user = new User({
        email: session.user.email,
        name: session.user.name,
        image: session.user.image,
        lastLoginAt: new Date()
      });
      await user.save();
      console.log('Created test user:', user.email);
    }

    // Try to create a test Instagram account
    const testInstagramAccount = new InstagramAccount({
      userId: user._id,
      instagramId: 'test_' + Date.now(),
      username: 'test_username',
      accountType: 'BUSINESS',
      accessToken: 'test_token_' + Date.now(),
      tokenExpiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days
      profilePictureUrl: 'https://example.com/pic.jpg',
      followersCount: 1000,
      followingCount: 500,
      mediaCount: 50,
      biography: 'Test biography',
      website: 'https://example.com',
      isActive: true,
      lastSyncAt: new Date()
    });

    await testInstagramAccount.save();
    console.log('Test Instagram account saved successfully');

    return NextResponse.json({
      success: true,
      message: 'Test Instagram account created successfully',
      account: {
        id: testInstagramAccount._id,
        instagramId: testInstagramAccount.instagramId,
        username: testInstagramAccount.username,
        userId: testInstagramAccount.userId
      }
    });

  } catch (error) {
    console.error('Test Instagram save error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}
