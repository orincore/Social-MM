import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import connectDB from '@/lib/db';
import User from '@/models/User';
import { InstagramAccount } from '@/models/InstagramAccount';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');

    if (error) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/instagram?error=instagram_auth_failed`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/instagram?error=missing_params`);
    }

    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/instagram?error=unauthorized`);
    }

    // Validate state is a reasonable timestamp (within last 10 minutes)
    const stateTimestamp = parseInt(state);
    const now = Date.now();
    const tenMinutesAgo = now - (10 * 60 * 1000);
    
    if (isNaN(stateTimestamp) || stateTimestamp < tenMinutesAgo || stateTimestamp > now) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/instagram?error=invalid_state`);
    }

    // Exchange code for access token (Facebook OAuth)
    const tokenUrl = new URL('https://graph.facebook.com/v18.0/oauth/access_token');
    tokenUrl.searchParams.set('client_id', process.env.INSTAGRAM_CLIENT_ID!);
    tokenUrl.searchParams.set('client_secret', process.env.INSTAGRAM_CLIENT_SECRET!);
    tokenUrl.searchParams.set('redirect_uri', `${process.env.NEXTAUTH_URL}/api/instagram/callback`);
    tokenUrl.searchParams.set('code', code);

    const tokenResponse = await fetch(tokenUrl.toString());

    if (!tokenResponse.ok) {
      console.error('Token exchange failed:', await tokenResponse.text());
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/instagram?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    // Get long-lived access token
    const longLivedTokenResponse = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&access_token=${access_token}`
    );

    let longLivedToken = access_token;
    let expiresIn = 3600; // 1 hour default

    if (longLivedTokenResponse.ok) {
      const longLivedData = await longLivedTokenResponse.json();
      longLivedToken = longLivedData.access_token;
      expiresIn = longLivedData.expires_in || 5184000; // 60 days default
    }

    // Get Facebook Pages first (required for Instagram Business)
    const pagesResponse = await fetch(
      `https://graph.facebook.com/v18.0/me/accounts?access_token=${longLivedToken}`
    );

    if (!pagesResponse.ok) {
      console.error('Pages fetch failed:', await pagesResponse.text());
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/instagram?error=pages_fetch_failed`);
    }

    const pagesData = await pagesResponse.json();
    
    if (!pagesData.data || pagesData.data.length === 0) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/instagram?error=no_pages_found`);
    }

    // Find the page that has an Instagram Business account connected
    let selectedPage = null;
    let pageAccessToken = null;
    let igAccountData = null;

    for (const page of pagesData.data) {
      console.log('Checking page:', page.id, page.name);
      
      const igAccountResponse = await fetch(
        `https://graph.facebook.com/v18.0/${page.id}?fields=instagram_business_account&access_token=${page.access_token}`
      );

      if (igAccountResponse.ok) {
        const data = await igAccountResponse.json();
        console.log('Page IG check result:', { pageId: page.id, hasIG: !!data.instagram_business_account });
        
        if (data.instagram_business_account) {
          selectedPage = page;
          pageAccessToken = page.access_token;
          igAccountData = data;
          console.log('Selected page with Instagram:', { pageId: page.id, pageName: page.name, igId: data.instagram_business_account.id });
          break;
        }
      }
    }

    if (!selectedPage || !igAccountData?.instagram_business_account) {
      console.error('No page with Instagram business account found');
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/instagram?error=no_instagram_business_account`);
    }

    const instagramAccountId = igAccountData.instagram_business_account.id;

    // Get Instagram profile information
    const profileResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}?fields=id,username,media_count,followers_count,follows_count,profile_picture_url,biography,website&access_token=${pageAccessToken}`
    );

    if (!profileResponse.ok) {
      console.error('Profile fetch failed:', await profileResponse.text());
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/instagram?error=profile_fetch_failed`);
    }

    const profileData = await profileResponse.json();

    // Save to database
    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/instagram?error=user_not_found`);
    }

    // Check if Instagram account already exists
    const existingAccount = await InstagramAccount.findOne({ 
      $or: [
        { userId: user._id },
        { instagramId: profileData.id }
      ]
    });

    if (existingAccount) {
      // Update existing account
      existingAccount.accessToken = pageAccessToken; // Use page access token for Instagram Business
      existingAccount.tokenExpiresAt = new Date(Date.now() + expiresIn * 1000);
      existingAccount.username = profileData.username;
      existingAccount.accountType = 'BUSINESS'; // Instagram Business account connected via Facebook page
      existingAccount.profilePictureUrl = profileData.profile_picture_url;
      existingAccount.followersCount = profileData.followers_count || 0;
      existingAccount.followingCount = profileData.follows_count || 0;
      existingAccount.mediaCount = profileData.media_count || 0;
      existingAccount.biography = profileData.biography;
      existingAccount.website = profileData.website;
      existingAccount.isActive = true;
      existingAccount.lastSyncAt = new Date();
      await existingAccount.save();
    } else {
      // Create new account
      const newAccount = new InstagramAccount({
        userId: user._id,
        instagramId: profileData.id,
        username: profileData.username,
        accountType: 'BUSINESS', // Instagram Business account connected via Facebook page
        accessToken: pageAccessToken, // Use page access token for Instagram Business
        tokenExpiresAt: new Date(Date.now() + expiresIn * 1000),
        profilePictureUrl: profileData.profile_picture_url,
        followersCount: profileData.followers_count || 0,
        followingCount: profileData.follows_count || 0,
        mediaCount: profileData.media_count || 0,
        biography: profileData.biography,
        website: profileData.website,
        isActive: true,
        lastSyncAt: new Date(),
      });
      await newAccount.save();
    }

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/instagram?success=instagram_connected`);
  } catch (error) {
    console.error('Instagram callback error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/dashboard/instagram?error=callback_failed`);
  }
}
