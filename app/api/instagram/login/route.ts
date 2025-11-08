import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const method = searchParams.get('method') || 'basic';

  let url: string;
  
  if (method === 'facebook') {
    // Try Facebook Login approach
    const params = new URLSearchParams({
      client_id: process.env.IG_APP_ID!,
      redirect_uri: process.env.IG_REDIRECT_URI!,
      response_type: 'code',
      scope: 'instagram_basic'
    });
    url = `https://www.facebook.com/v20.0/dialog/oauth?${params.toString()}`;
    console.log('Facebook OAuth URL:', url);
  } else if (method === 'basic-display') {
    // Try Instagram Basic Display API
    const params = new URLSearchParams({
      client_id: process.env.IG_APP_ID!,
      redirect_uri: process.env.IG_REDIRECT_URI!,
      response_type: 'code',
      scope: 'user_profile,user_media'
    });
    url = `https://api.instagram.com/oauth/authorize?${params.toString()}`;
    console.log('Instagram Basic Display OAuth URL:', url);
  } else {
    // Default: Try minimal Instagram Business scope
    const params = new URLSearchParams({
      client_id: process.env.IG_APP_ID!,
      redirect_uri: process.env.IG_REDIRECT_URI!,
      response_type: 'code',
      scope: 'instagram_business_basic'
    });
    url = `https://www.instagram.com/oauth/authorize?${params.toString()}`;
    console.log('Instagram Business OAuth URL:', url);
  }
  
  return NextResponse.redirect(url);
}
