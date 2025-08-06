import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const pathname = request.nextUrl.pathname;
  
  const isSandrasSubdomain = hostname.startsWith('sandras-sandwiches.');
  const isLocalhost = hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1');
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // If on sandras-sandwiches subdomain
  if (isSandrasSubdomain) {
    // Only allow /order routes on this subdomain
    if (!pathname.startsWith('/order')) {
      // Redirect any other route to /order
      return NextResponse.redirect(new URL('/order', request.url));
    }
  }
  
  // If accessing /order route
  if (pathname.startsWith('/order')) {
    // Only allow access from sandras-sandwiches subdomain (or localhost in dev)
    if (!(isDevelopment && isLocalhost) && !isSandrasSubdomain) {
      // Redirect to main site
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Protect dashboard routes (existing logic)
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
    '/((?!api|_next/static|_next/image|favicon.ico).*)', // Match all routes for subdomain check
  ],
};
