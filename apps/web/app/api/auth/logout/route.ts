import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  cookieStore.delete('gitforensics_user');

  return NextResponse.redirect(`${req.nextUrl.origin}/`);
}

export async function POST() {
  const cookieStore = await cookies();
  cookieStore.delete('gitforensics_user');

  return NextResponse.json({ success: true });
}
