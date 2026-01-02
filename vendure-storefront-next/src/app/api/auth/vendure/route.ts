import { NextResponse } from 'next/server';
import { graphql } from 'gql.tada';
import { mutate } from '@/lib/vendure/api';

const AuthenticateWithZKeyMutation = graphql(`
  mutation AuthenticateWithZKey($token: String!) {
    authenticate(input: { zkey: { token: $token } }) {
      __typename
      ... on CurrentUser {
        id
        identifier
      }
      ... on ErrorResult {
        errorCode
        message
      }
    }
  }
`);

export async function POST(req: Request) {
  try {
    const body = (await req.json().catch(() => null)) as null | { token?: unknown };
    const token = body?.token;

    if (typeof token !== 'string' || !token.trim()) {
      return NextResponse.json({ success: false, error: 'Missing token' }, { status: 400 });
    }

    const result = await mutate(AuthenticateWithZKeyMutation, { token }, { fetch: { cache: 'no-store' } });

    const authResult = (result.data as any)?.authenticate;

    if (!authResult || authResult.__typename !== 'CurrentUser') {
      const message =
        typeof authResult?.message === 'string' && authResult.message.trim()
          ? authResult.message
          : `Vendure authentication failed${authResult?.__typename ? ` (${authResult.__typename})` : ''}`;
      return NextResponse.json(
        { success: false, error: message },
        { status: 401 },
      );
    }

    if (!result.token) {
      return NextResponse.json(
        { success: false, error: 'Vendure did not return an auth token' },
        { status: 401 },
      );
    }

    const cookieName = process.env.VENDURE_AUTH_TOKEN_COOKIE || 'vendure-auth-token';
    const res = NextResponse.json({ success: true });
    res.cookies.set(cookieName, result.token, {
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });
    return res;
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    console.error('[api/auth/vendure] Failed:', e);
    return NextResponse.json({ success: false, error: message }, { status: 500 });
  }
}
