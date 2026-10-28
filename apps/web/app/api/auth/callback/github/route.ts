import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  const cookieStore = await cookies();
  const stateCookie = cookieStore.get('oauth_state');

  let returnTo = '/';
  if (stateCookie?.value) {
    try {
      const parsed = JSON.parse(stateCookie.value);
      if (parsed.state === state) {
        returnTo = parsed.returnTo || '/';
      }
    } catch {}
  }

  // Clear state cookie
  cookieStore.delete('oauth_state');

  if (!code) {
    return NextResponse.redirect(`${req.nextUrl.origin}/?error=no_code`);
  }

  const clientId = process.env.GITHUB_CLIENT_ID;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    return NextResponse.json(
      { error: 'GitHub OAuth Client ID or Secret not configured' },
      { status: 500 },
    );
  }

  try {
    // 1. Exchange code for GitHub Access Token
    const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code,
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) {
      return NextResponse.redirect(
        `${req.nextUrl.origin}/?error=${encodeURIComponent(
          tokenData.error_description || 'OAuth token exchange failed',
        )}`,
      );
    }

    const accessToken = tokenData.access_token;

    // 2. Fetch User Profile
    const userRes = await fetch('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'User-Agent': 'GitForensics-App',
      },
    });

    const userData = await userRes.json();
    if (!userData.login) {
      return NextResponse.redirect(`${req.nextUrl.origin}/?error=user_fetch_failed`);
    }

    // 3. Store in secure, HTTP-only cookie
    const userPayload = {
      token: accessToken,
      login: userData.login,
      name: userData.name || userData.login,
      avatarUrl: userData.avatar_url,
    };

    cookieStore.set('gitforensics_user', JSON.stringify(userPayload), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    // Ensure returnTo starts with / to avoid open-redirect security risks
    const safeReturnTo = returnTo.startsWith('/') ? returnTo : '/';
    return NextResponse.redirect(`${req.nextUrl.origin}${safeReturnTo}`);
  } catch (err: any) {
    return NextResponse.redirect(
      `${req.nextUrl.origin}/?error=${encodeURIComponent(err.message || 'OAuth error')}`,
    );
  }
}
