import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
    const token = request.cookies.get('zkey_token')?.value;

    const protectedPaths = ['/account', '/checkout', '/orders'];
    const path = request.nextUrl.pathname;

    const isPrefetch = request.headers.get('x-middleware-prefetch') === '1' ||
        request.headers.get('purpose') === 'prefetch';
    const isRSC = request.headers.get('rsc') === '1';

    if (protectedPaths.some((p) => path.startsWith(p)) && !token) {
        if (isPrefetch || isRSC) {
            // For prefetch/RSC requests, don't redirect (causes CORS issues).
            // Return a 401 and let the actual navigation trigger the redirect.
            return new NextResponse(null, { status: 401 });
        }
        const signInUrl = new URL('/sign-in', request.url);
        signInUrl.searchParams.set('redirect', path); // preserve intended destination
        return NextResponse.redirect(signInUrl);
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/account/:path*', '/checkout/:path*', '/orders/:path*'],
};
