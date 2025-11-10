import connectDB from '@/lib/db';
import User from '@/models/User';
import Content from '@/models/Content';
import { InstagramAccount } from '@/models/InstagramAccount';
import { YouTubeAccount } from '@/models/YouTubeAccount';
import { PublishJob } from '@/models/PublishJob';
import SocialAccount from '@/models/SocialAccount';

/**
 * Helper function to actually delete user data (call this after manual review)
 */
export async function deleteUserData(userId: string) {
  try {
    await connectDB();

    console.log(`Starting data deletion for user: ${userId}`);

    // Delete in order to respect foreign key constraints
    
    // 1. Delete PublishJobs
    await PublishJob.deleteMany({ userId });
    console.log('Deleted PublishJobs');

    // 2. Delete Content
    await Content.deleteMany({ userId });
    console.log('Deleted Content');

    // 3. Delete Social Media Accounts
    await InstagramAccount.deleteMany({ userId });
    await YouTubeAccount.deleteMany({ userId });
    await SocialAccount.deleteMany({ userId });
    console.log('Deleted Social Media Accounts');

    // 4. Delete User account (this should be last)
    await User.findByIdAndDelete(userId);
    console.log('Deleted User account');

    // 5. Delete files from R2 storage (implement this)
    // await deleteUserFilesFromR2(userId);

    console.log(`Data deletion completed for user: ${userId}`);
    return { success: true };

  } catch (error) {
    console.error('Error deleting user data:', error);
    throw error;
  }
}
