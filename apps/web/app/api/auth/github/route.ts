import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  const searchParams = req.nextUrl.searchParams;
  const returnTo = searchParams.get('returnTo') || '/';

  if (!clientId) {
    return NextResponse.json(
      {
        error: 'Missing GITHUB_CLIENT_ID',
        message: 'Please set GITHUB_CLIENT_ID and GITHUB_CLIENT_SECRET in apps/web/.env.local',
      },
      { status: 500 },
    );
  }

  // Store returnTo in a short-lived state cookie
  const cookieStore = await cookies();
  const state = Math.random().toString(36).substring(2, 15);
  cookieStore.set('oauth_state', JSON.stringify({ state, returnTo }), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  });

  const redirectUri = `${req.nextUrl.origin}/api/auth/callback/github`;
  const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(
    redirectUri,
  )}&scope=read:user&state=${state}`;

  return NextResponse.redirect(githubAuthUrl);
}
