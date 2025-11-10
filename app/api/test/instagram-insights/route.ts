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
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const instagramAccount = await InstagramAccount.findOne({ userId: user._id, isActive: true });
    if (!instagramAccount) {
      return NextResponse.json({ error: 'Instagram account not connected' }, { status: 404 });
    }

    console.log('Testing Instagram insights for:', instagramAccount.username);

    const results: { [key: string]: any } = {};
    const baseUrl = 'https://graph.facebook.com/v21.0';
    const accessToken = instagramAccount.accessToken;
    const igUserId = instagramAccount.instagramId;

    // Test different insight metrics and periods
    const testCases = [
      { metric: 'reach,impressions,profile_views', period: 'days_28', name: 'Account 28 days' },
      { metric: 'reach,impressions,profile_views', period: 'day', name: 'Account daily' },
      { metric: 'reach,impressions', period: 'lifetime', name: 'Account lifetime' },
    ];

    for (const testCase of testCases) {
      try {
        const response = await fetch(
          `${baseUrl}/${igUserId}/insights?metric=${testCase.metric}&period=${testCase.period}&access_token=${accessToken}`
        );
        
        if (response.ok) {
          const data = await response.json();
          results[testCase.name] = {
            success: true,
            data: data.data?.map((metric: any) => ({
              name: metric.name,
              period: metric.period,
              values: metric.values?.slice(0, 3) // Show first 3 values
            }))
          };
        } else {
          const errorText = await response.text();
          results[testCase.name] = {
            success: false,
            error: errorText
          };
        }
      } catch (error) {
        results[testCase.name] = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }

    // Test media insights
    try {
      const mediaResponse = await fetch(
        `${baseUrl}/${igUserId}/media?fields=id&limit=1&access_token=${accessToken}`
      );
      
      if (mediaResponse.ok) {
        const mediaData = await mediaResponse.json();
        if (mediaData.data && mediaData.data.length > 0) {
          const mediaId = mediaData.data[0].id;
          
          const mediaInsightsResponse = await fetch(
            `${baseUrl}/${mediaId}/insights?metric=reach,impressions&access_token=${accessToken}`
          );
          
          if (mediaInsightsResponse.ok) {
            const mediaInsightsData = await mediaInsightsResponse.json();
            results['Media insights'] = {
              success: true,
              mediaId: mediaId,
              data: mediaInsightsData.data
            };
          } else {
            const errorText = await mediaInsightsResponse.text();
            results['Media insights'] = {
              success: false,
              error: errorText
            };
          }
        }
      }
    } catch (error) {
      results['Media insights'] = {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }

    return NextResponse.json({
      success: true,
      account: {
        username: instagramAccount.username,
        accountType: instagramAccount.accountType,
        followers: instagramAccount.followersCount
      },
      insightTests: results
    });
  } catch (error) {
    console.error('Instagram insights test error:', error);
    return NextResponse.json({ 
      error: 'Test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
