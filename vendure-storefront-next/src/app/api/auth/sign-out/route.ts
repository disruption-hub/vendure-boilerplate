import { NextResponse } from 'next/server';

export async function POST() {
  const cookieName = process.env.VENDURE_AUTH_TOKEN_COOKIE || 'vendure-auth-token';
  const res = NextResponse.json({ success: true });

  // Clear Vendure session cookie (httpOnly)
  res.cookies.set(cookieName, '', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
  });

  // Best-effort: also clear ZKey token if it was ever set server-side.
  res.cookies.set('zkey_token', '', {
    path: '/',
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: new Date(0),
  });

  return res;
}
