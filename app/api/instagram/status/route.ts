import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { InstagramAccount } from '@/models/InstagramAccount';

export async function GET() {
  try {
    const session = await getServerSession();
    
    if (!session?.user?.email && !session?.user?.name) {
      return NextResponse.json({ connected: false, error: 'Unauthorized' });
    }

    await connectDB();
    const user = await User.findOne({ 
      $or: [
        { email: session.user.email },
        { name: session.user.name, email: { $regex: /@facebook\.local$/ } }
      ]
    });
    
    if (!user) {
      return NextResponse.json({ connected: false, error: 'User not found' });
    }
    
    // Get the user's Instagram account
    const account = await InstagramAccount.findOne({ 
      userId: user._id, 
      isActive: true 
    });
    
    if (!account) {
      return NextResponse.json({ connected: false });
    }

    // Check if token is expired
    const isTokenExpired = new Date() > account.tokenExpiresAt;

    const response = { 
      connected: !isTokenExpired, 
      account: {
        username: account.username,
        userId: account.instagramId,
        accountType: account.accountType,
        profilePictureUrl: account.profilePictureUrl,
        followersCount: account.followersCount,
        followingCount: account.followingCount,
        mediaCount: account.mediaCount,
        biography: account.biography,
        website: account.website,
        connectedAt: account.createdAt,
        lastUpdated: account.updatedAt,
        tokenExpired: isTokenExpired
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error checking Instagram status:', error);
    return NextResponse.json({ connected: false, error: 'Failed to check status' });
  }
}

export async function DELETE() {
  try {
    const session = await getServerSession();
    if (!session?.user?.email && !session?.user?.name) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findOne({ 
      $or: [
        { email: session.user.email },
        { name: session.user.name, email: { $regex: /@facebook\.local$/ } }
      ]
    });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete Instagram account connection
    await InstagramAccount.deleteMany({ userId: user._id });

    return NextResponse.json({ 
      success: true, 
      message: 'Instagram account disconnected successfully' 
    });
  } catch (error) {
    console.error('Instagram disconnect error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
