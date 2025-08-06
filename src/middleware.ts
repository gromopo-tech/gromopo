import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  
  console.log('🚀 Middleware running:', { hostname, pathname });
  
  const isSandrasSubdomain = hostname.startsWith('sandras-sandwiches.');
  
  // Handle sandras-sandwiches subdomain
  if (isSandrasSubdomain) {
    // Rewrite all requests to the sandras-sandwiches subdomain routes
    if (!pathname.startsWith('/sandras-sandwiches')) {
      console.log('🔄 Rewriting subdomain request:', pathname, '→', `/sandras-sandwiches${pathname}`);
      return NextResponse.rewrite(new URL(`/sandras-sandwiches${pathname}`, request.url));
    }
  } else {
    // Main domain - block access to subdomain routes
    if (pathname.startsWith('/sandras-sandwiches')) {
      console.log('❌ Blocking subdomain route access from main domain');
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Protect dashboard routes (existing logic)
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('__session')?.value;
    if (!token) {
      console.log('❌ Redirecting to signin - no auth token');
      return NextResponse.redirect(new URL('/signin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/sandras-sandwiches/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
