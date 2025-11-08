import { NextResponse } from 'next/server';

export async function GET() {
  // Try Instagram Basic Display API as fallback
  const params = new URLSearchParams({
    client_id: process.env.IG_APP_ID!,
    redirect_uri: process.env.IG_REDIRECT_URI!,
    response_type: 'code',
    scope: 'user_profile,user_media'  // Basic Display API scopes
  });
  
  const url = `https://api.instagram.com/oauth/authorize?${params.toString()}`;
  console.log('Instagram Basic Display OAuth URL:', url);
  
  return NextResponse.redirect(url);
}
