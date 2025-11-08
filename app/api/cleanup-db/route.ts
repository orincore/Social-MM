import { NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import { InstagramAccount } from '@/models/InstagramAccount';

export async function POST() {
  try {
    await connectDB();
    
    // Drop all indexes on InstagramAccount collection to fix duplicate index issue
    const collection = InstagramAccount.collection;
    
    try {
      await collection.dropIndexes();
      console.log('Dropped all indexes on InstagramAccount collection');
    } catch (error) {
      console.log('No indexes to drop or error dropping indexes:', error);
    }

    // Recreate the model to ensure proper indexes
    delete require('mongoose').models.InstagramAccount;
    const { InstagramAccount: NewInstagramAccount } = require('@/models/InstagramAccount');
    
    // Ensure indexes are created properly
    await NewInstagramAccount.createIndexes();
    console.log('Recreated indexes for InstagramAccount');

    return NextResponse.json({
      success: true,
      message: 'Database indexes cleaned up successfully'
    });

  } catch (error) {
    console.error('Database cleanup error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
