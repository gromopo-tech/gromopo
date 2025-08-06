import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  
  // Check if accessing the order page
  if (request.nextUrl.pathname.startsWith('/order')) {
    // Only allow access from sandras-sandwiches subdomain
    if (!hostname.startsWith('sandras-sandwiches.')) {
      // Redirect to main site or show 404
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Protect dashboard routes (existing logic)
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
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
    '/order/:path*',  // Add order routes to matcher
  ],
};
