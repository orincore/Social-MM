import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { YouTubeAccount } from '@/models/YouTubeAccount';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/youtube?error=youtube_auth_failed`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/youtube?error=missing_params`);
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/youtube?error=unauthorized`);
    }

    // Validate state matches user email
    if (state !== session.user.email) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/youtube?error=invalid_state`);
    }

    // Exchange code for access token
    const tokenUrl = 'https://oauth2.googleapis.com/token';
    const tokenResponse = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: process.env.YOUTUBE_CLIENT_ID!,
        client_secret: process.env.YOUTUBE_CLIENT_SECRET!,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: `${process.env.NEXTAUTH_URL}/api/youtube/callback`,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/youtube?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token, refresh_token, expires_in } = tokenData;

    if (!refresh_token) {
      console.error('No refresh token received - user may have already authorized');
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/youtube?error=no_refresh_token`);
    }

    // Get channel information using YouTube Data API v3
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=snippet,statistics,contentDetails&mine=true&access_token=${access_token}`
    );

    if (!channelResponse.ok) {
      console.error('Channel fetch failed:', await channelResponse.text());
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/youtube?error=channel_fetch_failed`);
    }

    const channelData = await channelResponse.json();
    
    if (!channelData.items || channelData.items.length === 0) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/youtube?error=no_channel_found`);
    }

    const channel = channelData.items[0];
    const channelId = channel.id;
    const channelTitle = channel.snippet.title;
    const channelHandle = channel.snippet.customUrl || '';
    const uploadsPlaylistId = channel.contentDetails.relatedPlaylists.uploads;
    const subscriberCount = parseInt(channel.statistics.subscriberCount || '0');
    const videoCount = parseInt(channel.statistics.videoCount || '0');
    const viewCount = parseInt(channel.statistics.viewCount || '0');
    const thumbnailUrl = channel.snippet.thumbnails?.default?.url || '';
    const description = channel.snippet.description || '';
    const country = channel.snippet.country || '';

    // Save to database
    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/youtube?error=user_not_found`);
    }

    // Check if YouTube account already exists
    const existingAccount = await YouTubeAccount.findOne({ 
      $or: [
        { userId: user._id },
        { channelId: channelId }
      ]
    });

    const expiresAt = new Date(Date.now() + expires_in * 1000);

    if (existingAccount) {
      // Update existing account
      existingAccount.accessToken = access_token;
      existingAccount.refreshToken = refresh_token;
      existingAccount.tokenExpiresAt = expiresAt;
      existingAccount.channelTitle = channelTitle;
      existingAccount.channelHandle = channelHandle;
      existingAccount.uploadsPlaylistId = uploadsPlaylistId;
      existingAccount.subscriberCount = subscriberCount;
      existingAccount.videoCount = videoCount;
      existingAccount.viewCount = viewCount;
      existingAccount.thumbnailUrl = thumbnailUrl;
      existingAccount.description = description;
      existingAccount.country = country;
      existingAccount.isActive = true;
      existingAccount.lastSyncAt = new Date();
      await existingAccount.save();
    } else {
      // Create new account
      const newAccount = new YouTubeAccount({
        userId: user._id,
        channelId: channelId,
        channelTitle: channelTitle,
        channelHandle: channelHandle,
        accessToken: access_token,
        refreshToken: refresh_token,
        tokenExpiresAt: expiresAt,
        uploadsPlaylistId: uploadsPlaylistId,
        subscriberCount: subscriberCount,
        videoCount: videoCount,
        viewCount: viewCount,
        thumbnailUrl: thumbnailUrl,
        description: description,
        country: country,
        isActive: true,
        lastSyncAt: new Date(),
      });
      await newAccount.save();
    }

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/youtube?success=youtube_connected`);
  } catch (error) {
    console.error('YouTube callback error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/youtube?error=callback_failed`);
  }
}
