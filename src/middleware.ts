import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Get the original hostname from various possible headers
  const hostname = 
    request.headers.get('x-forwarded-host') ||     // Most common
    request.headers.get('x-original-host') ||      // Some platforms
    request.headers.get('host') ||                 // Fallback
    '';
    
  const pathname = request.nextUrl.pathname;
  
  const isSandrasSubdomain = hostname.startsWith('sandras-sandwiches.');
  const isLocalhost = hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1');
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Disable employees routes for now. Return 404
  if (pathname.startsWith('/dashboard/employees')) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // If on sandras-sandwiches subdomain, rewrite to subdomain routes
  if (isSandrasSubdomain) {
    if (!pathname.startsWith('/sandras-sandwiches')) {
      const rewriteUrl = `/sandras-sandwiches${pathname}`;
      return NextResponse.rewrite(new URL(rewriteUrl, request.url));
    }
  }
  
  // If accessing /order route from main domain
  if (pathname.startsWith('/order')) {
    if (!(isDevelopment && isLocalhost) && !isSandrasSubdomain) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('__session')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/order/:path*',
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};
