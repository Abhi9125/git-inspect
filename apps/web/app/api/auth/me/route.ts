import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET() {
  const cookieStore = await cookies();
  const userCookie = cookieStore.get('gitforensics_user');

  if (!userCookie?.value) {
    return NextResponse.json({
      isAuthenticated: false,
      user: null,
      token: null,
    });
  }

  try {
    const parsed = JSON.parse(userCookie.value);
    return NextResponse.json({
      isAuthenticated: true,
      user: {
        login: parsed.login,
        name: parsed.name,
        avatarUrl: parsed.avatarUrl,
      },
      token: parsed.token,
    });
  } catch {
    return NextResponse.json({
      isAuthenticated: false,
      user: null,
      token: null,
    });
  }
}
