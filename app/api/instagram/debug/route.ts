import { NextResponse } from 'next/server';

export async function GET() {
  // Return current configuration for debugging
  const config = {
    appId: process.env.IG_APP_ID,
    redirectUri: process.env.IG_REDIRECT_URI,
    hasAppSecret: !!process.env.IG_APP_SECRET,
    currentLoginUrl: `https://www.instagram.com/oauth/authorize?client_id=${process.env.IG_APP_ID}&redirect_uri=${encodeURIComponent(process.env.IG_REDIRECT_URI!)}&response_type=code&scope=instagram_business_basic,instagram_business_manage_messages`,
    alternativeUrls: {
      basicDisplay: `https://api.instagram.com/oauth/authorize?client_id=${process.env.IG_APP_ID}&redirect_uri=${encodeURIComponent(process.env.IG_REDIRECT_URI!)}&response_type=code&scope=user_profile,user_media`,
      facebookLogin: `https://www.facebook.com/v20.0/dialog/oauth?client_id=${process.env.IG_APP_ID}&redirect_uri=${encodeURIComponent(process.env.IG_REDIRECT_URI!)}&response_type=code&scope=instagram_basic`
    }
  };

  return NextResponse.json(config);
}
