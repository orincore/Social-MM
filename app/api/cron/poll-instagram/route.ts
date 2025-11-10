import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/db';
import Content from '@/models/Content';
import { PublishJob } from '@/models/PublishJob';
import User from '@/models/User';

const FACEBOOK_API_BASE = 'https://graph.facebook.com/v18.0';

export async function POST(request: NextRequest) {
  try {
    // Verify cron secret
    const authHeader = request.headers.get('Authorization');
    const expectedAuth = `Bearer ${process.env.CRON_SECRET}`;
    
    if (!authHeader || authHeader !== expectedAuth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Find Instagram posts that are in "processing" state
    const processingPosts = await Content.find({
      platform: 'instagram',
      status: 'processing',
      'remote.instagramCreationId': { $exists: true }
    }).limit(20); // Process max 20 at a time

    console.log(`Found ${processingPosts.length} Instagram posts to poll`);

    let completedCount = 0;
    let stillProcessingCount = 0;
    let failedCount = 0;

    for (const post of processingPosts) {
      try {
        const creationId = post.remote?.instagramCreationId;
        if (!creationId) continue;

        // Get user's Instagram access token
        const user = await User.findById(post.userId);
        if (!user || !user.instagram?.accessToken) {
          throw new Error('Instagram access token not found');
        }

        // Check media status
        const statusResponse = await fetch(
          `${FACEBOOK_API_BASE}/${creationId}?fields=status_code,status&access_token=${user.instagram.accessToken}`
        );

        if (!statusResponse.ok) {
          console.error(`Failed to check status for ${creationId}`);
          continue;
        }

        const statusData = await statusResponse.json();
        console.log(`Instagram ${creationId} status:`, statusData.status_code);

        if (statusData.status_code === 'FINISHED') {
          // Media is ready - publish it!
          const publishResponse = await fetch(
            `${FACEBOOK_API_BASE}/${user.instagram.instagramId}/media_publish`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
              body: new URLSearchParams({
                creation_id: creationId,
                access_token: user.instagram.accessToken,
              }),
            }
          );

          if (!publishResponse.ok) {
            const errorText = await publishResponse.text();
            throw new Error(`Publish failed: ${errorText}`);
          }

          const publishData = await publishResponse.json();
          const publishedPostId = publishData.id;

          // Update content to published
          await Content.findByIdAndUpdate(post._id, {
            status: 'published',
            publishedAt: new Date(),
            publishedPostId,
            'remote.mediaId': publishedPostId,
            updatedAt: new Date()
          });

          // Update publish job
          await PublishJob.updateOne(
            { contentId: post._id, platform: 'instagram' },
            {
              $set: {
                status: 'completed',
                completedAt: new Date(),
                result: {
                  success: true,
                  postId: publishedPostId
                }
              }
            },
            { upsert: true }
          );

          completedCount++;
          console.log(`✅ Published Instagram post ${post._id}`);

        } else if (statusData.status_code === 'ERROR' || statusData.status_code === 'EXPIRED') {
          // Failed
          const errorMessage = statusData.status || 'Media processing failed';
          
          await Content.findByIdAndUpdate(post._id, {
            status: 'failed',
            error: errorMessage,
            updatedAt: new Date()
          });

          await PublishJob.updateOne(
            { contentId: post._id, platform: 'instagram' },
            {
              $set: {
                status: 'failed',
                completedAt: new Date(),
                result: {
                  success: false,
                  error: errorMessage
                }
              }
            },
            { upsert: true }
          );

          failedCount++;
          console.log(`❌ Instagram post ${post._id} failed: ${errorMessage}`);

        } else if (statusData.status_code === 'IN_PROGRESS') {
          // Still processing - check if it's been too long (> 5 minutes)
          const createdAt = post.createdAt || post.scheduledAt;
          const ageMinutes = (Date.now() - new Date(createdAt).getTime()) / 60000;
          
          if (ageMinutes > 5) {
            // Timeout after 5 minutes
            await Content.findByIdAndUpdate(post._id, {
              status: 'failed',
              error: 'Instagram processing timeout (>5 minutes)',
              updatedAt: new Date()
            });
            failedCount++;
            console.log(`⏱️ Instagram post ${post._id} timed out`);
          } else {
            stillProcessingCount++;
          }
        }

      } catch (error: any) {
        console.error(`Error polling Instagram post ${post._id}:`, error);
        failedCount++;
        
        await Content.findByIdAndUpdate(post._id, {
          status: 'failed',
          error: error.message,
          updatedAt: new Date()
        });
      }
    }

    return NextResponse.json({
      success: true,
      completedCount,
      stillProcessingCount,
      failedCount,
      totalPolled: processingPosts.length
    });

  } catch (error: any) {
    console.error('Instagram polling error:', error);
    return NextResponse.json({
      error: 'Polling failed',
      details: error.message
    }, { status: 500 });
  }
}
