import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import { InstagramAccount } from '@/models/InstagramAccount';

export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Find all Instagram accounts that might have hardcoded account types
    const accounts = await InstagramAccount.find({ 
      isActive: true,
      $or: [
        { accountType: 'BUSINESS' },
        { accountType: { $exists: false } }
      ]
    });

    console.log(`Found ${accounts.length} Instagram accounts to migrate`);

    const results = [];

    for (const account of accounts) {
      try {
        console.log(`Migrating account: ${account.username} (${account.accountType})`);
        
        // Fetch fresh account data from Instagram API
        const accountResponse = await fetch(
          `https://graph.facebook.com/v21.0/${account.instagramId}?fields=id,username,account_type,media_count,followers_count,follows_count,profile_picture_url,biography,website&access_token=${account.accessToken}`
        );

        if (accountResponse.ok) {
          const freshData = await accountResponse.json();
          
          const oldType = account.accountType;
          const newType = freshData.account_type;
          
          console.log(`Account ${account.username}: ${oldType} → ${newType}`);
          
          // Update account with fresh data
          account.accountType = newType || 'BUSINESS';
          account.followersCount = freshData.followers_count || account.followersCount;
          account.followingCount = freshData.follows_count || account.followingCount;
          account.mediaCount = freshData.media_count || account.mediaCount;
          account.profilePictureUrl = freshData.profile_picture_url || account.profilePictureUrl;
          account.biography = freshData.biography || account.biography;
          account.website = freshData.website || account.website;
          account.lastSyncAt = new Date();

          await account.save();

          results.push({
            username: account.username,
            oldType: oldType,
            newType: newType,
            status: 'updated'
          });
        } else {
          const errorText = await accountResponse.text();
          console.error(`Failed to fetch data for ${account.username}:`, errorText);
          
          results.push({
            username: account.username,
            oldType: account.accountType,
            newType: null,
            status: 'failed',
            error: errorText
          });
        }
      } catch (error) {
        console.error(`Error migrating account ${account.username}:`, error);
        
        results.push({
          username: account.username,
          oldType: account.accountType,
          newType: null,
          status: 'error',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Migration completed for ${accounts.length} accounts`,
      results: results,
      summary: {
        total: accounts.length,
        updated: results.filter(r => r.status === 'updated').length,
        failed: results.filter(r => r.status === 'failed').length,
        errors: results.filter(r => r.status === 'error').length
      }
    });
  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({ 
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
