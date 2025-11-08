import { NextResponse } from 'next/server';

export async function GET() {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://localhost:3443';
  
  return NextResponse.json({
    success: true,
    nextauth_url: process.env.NEXTAUTH_URL,
    expected_redirect_uri: `${baseUrl}/api/auth/callback/meta`,
    facebook_app_settings_needed: {
      valid_oauth_redirect_uris: [
        `${baseUrl}/api/auth/callback/meta`
      ],
      app_domains: [
        new URL(baseUrl).hostname
      ]
    },
    current_env_vars: {
      NEXTAUTH_URL: process.env.NEXTAUTH_URL,
      INSTAGRAM_CLIENT_ID: process.env.INSTAGRAM_CLIENT_ID ? 'Set' : 'Not Set',
      INSTAGRAM_CLIENT_SECRET: process.env.INSTAGRAM_CLIENT_SECRET ? 'Set' : 'Not Set'
    }
  });
}
