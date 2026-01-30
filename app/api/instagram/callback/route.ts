import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth-options';
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
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=instagram_auth_failed`);
    }

    if (!code || !state) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=missing_params`);
    }

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=unauthorized`);
    }

    // Validate state is a reasonable timestamp (within last 10 minutes)
    const stateTimestamp = parseInt(state);
    const now = Date.now();
    const tenMinutesAgo = now - (10 * 60 * 1000);
    
    if (isNaN(stateTimestamp) || stateTimestamp < tenMinutesAgo || stateTimestamp > now) {
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=invalid_state`);
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
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=token_exchange_failed`);
    }

    const tokenData = await tokenResponse.json();
    const { access_token } = tokenData;

    // Get long-lived access token (60 days)
    const longLivedTokenResponse = await fetch(
      `https://graph.instagram.com/access_token?grant_type=ig_exchange_token&client_secret=${process.env.INSTAGRAM_CLIENT_SECRET}&access_token=${access_token}`
    );

    let longLivedToken = access_token;
    let longLivedExpiresIn = 3600; // 1 hour default

    if (longLivedTokenResponse.ok) {
      const longLivedData = await longLivedTokenResponse.json();
      longLivedToken = longLivedData.access_token;
      longLivedExpiresIn = longLivedData.expires_in || 5184000; // 60 days default
      console.log('Long-lived token obtained, expires in:', longLivedExpiresIn, 'seconds (', Math.floor(longLivedExpiresIn / 86400), 'days)');
    } else {
      const errorText = await longLivedTokenResponse.text();
      console.error('Failed to get long-lived token:', errorText);
      console.warn('Using short-lived token - this will expire quickly!');
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
    let pageTokenExpiresIn = 0;
    let igAccountData = null;

    for (const page of pagesData.data) {
      console.log('Checking page:', page.id, page.name);
      
      // Get page long-lived token info
      const pageDebugResponse = await fetch(
        `https://graph.facebook.com/v18.0/debug_token?input_token=${page.access_token}&access_token=${longLivedToken}`
      );
      
      if (pageDebugResponse.ok) {
        const debugData = await pageDebugResponse.json();
        pageTokenExpiresIn = debugData.data?.expires_at ? (debugData.data.expires_at - Math.floor(Date.now() / 1000)) : 5184000;
        console.log('Page token expires in:', Math.floor(pageTokenExpiresIn / 86400), 'days');
      }
      
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
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=no_instagram_business_account`);
    }

    const instagramAccountId = igAccountData.instagram_business_account.id;

    // Get Instagram profile information (account_type may not be available for all accounts)
    const profileResponse = await fetch(
      `https://graph.facebook.com/v18.0/${instagramAccountId}?fields=id,username,media_count,followers_count,follows_count,profile_picture_url,biography,website&access_token=${pageAccessToken}`
    );

    if (!profileResponse.ok) {
      console.error('Profile fetch failed:', await profileResponse.text());
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=profile_fetch_failed`);
    }

    const profileData = await profileResponse.json();
    console.log('Instagram profile data fetched:', profileData);

    // Try to fetch account type separately (optional)
    let accountType = 'BUSINESS'; // Default fallback
    try {
      const accountTypeResponse = await fetch(
        `https://graph.facebook.com/v18.0/${instagramAccountId}?fields=account_type&access_token=${pageAccessToken}`
      );
      
      if (accountTypeResponse.ok) {
        const accountTypeData = await accountTypeResponse.json();
        accountType = accountTypeData.account_type || 'BUSINESS';
        console.log('Instagram account type detected:', accountType);
      } else {
        console.log('Account type not available, using default: BUSINESS');
      }
    } catch (error) {
      console.log('Could not fetch account type, using default: BUSINESS');
    }

    // Add account type to profile data
    profileData.account_type = accountType;

    // Save to database
    await connectDB();
    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      console.error('User not found for email:', session.user.email);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=user_not_found`);
    }
    
    console.log('User found:', { id: user._id, email: user.email });

    // Check if Instagram account already exists
    const existingAccount = await InstagramAccount.findOne({ 
      $or: [
        { userId: user._id },
        { instagramId: profileData.id }
      ]
    });

    // Use the longer expiration time between page token and long-lived token
    const effectiveExpiresIn = Math.max(pageTokenExpiresIn, longLivedExpiresIn);
    const tokenExpiryDate = new Date(Date.now() + effectiveExpiresIn * 1000);
    
    console.log('Token will expire at:', tokenExpiryDate, '(in', Math.floor(effectiveExpiresIn / 86400), 'days)');

    if (existingAccount) {
      console.log('Updating existing Instagram account:', existingAccount._id);
      // Update existing account - store page access token which is needed for API calls
      existingAccount.accessToken = pageAccessToken;
      existingAccount.tokenExpiresAt = tokenExpiryDate;
      existingAccount.username = profileData.username;
      existingAccount.accountType = profileData.account_type || 'BUSINESS';
      existingAccount.profilePictureUrl = profileData.profile_picture_url;
      existingAccount.followersCount = profileData.followers_count || 0;
      existingAccount.followingCount = profileData.follows_count || 0;
      existingAccount.mediaCount = profileData.media_count || 0;
      existingAccount.biography = profileData.biography;
      existingAccount.website = profileData.website;
      existingAccount.isActive = true;
      existingAccount.lastSyncAt = new Date();
      await existingAccount.save();
      console.log('Instagram account updated successfully');
    } else {
      console.log('Creating new Instagram account');
      // Create new account
      const newAccount = new InstagramAccount({
        userId: user._id,
        instagramId: profileData.id,
        username: profileData.username,
        accountType: profileData.account_type || 'BUSINESS',
        accessToken: pageAccessToken,
        tokenExpiresAt: tokenExpiryDate,
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
      console.log('New Instagram account created successfully:', newAccount._id);
    }

    // ALSO store Instagram tokens directly in User profile for better persistence
    user.instagram = {
      connected: true,
      accessToken: pageAccessToken,
      refreshToken: null, // Instagram doesn't use refresh tokens
      tokenExpiresAt: tokenExpiryDate,
      instagramId: profileData.id,
      username: profileData.username,
      accountType: profileData.account_type || 'BUSINESS',
      profilePictureUrl: profileData.profile_picture_url,
      followersCount: profileData.followers_count || 0,
      followingCount: profileData.follows_count || 0,
      mediaCount: profileData.media_count || 0,
      biography: profileData.biography,
      connectedAt: new Date()
    };
    await user.save();
    console.log('Instagram tokens stored in User profile for persistence');

    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?success=instagram_connected`);
  } catch (error) {
    console.error('Instagram callback error:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/?error=callback_failed`);
  }
}
