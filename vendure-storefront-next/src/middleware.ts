import { NextRequest, NextResponse } from 'next/server';
import { getLogtoContext } from '@logto/next/server-actions';
import { logtoConfig } from './lib/auth-config';

export async function middleware(request: NextRequest) {
    const { isAuthenticated } = await getLogtoContext(logtoConfig);

    const protectedPaths = ['/account', '/checkout', '/orders'];
    const path = request.nextUrl.pathname;

    if (protectedPaths.some((p) => path.startsWith(p)) && !isAuthenticated) {
        const signInUrl = new URL('/api/auth/sign-in', request.url);
        signInUrl.searchParams.set('redirectUrl', path); // preserve intended destination
        return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/account/:path*', '/checkout/:path*', '/orders/:path*'],
};
