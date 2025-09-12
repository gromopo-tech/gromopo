import { NextRequest, NextResponse } from 'next/server';
import { getSubdomain } from '@/lib/utils';

export function middleware(request: NextRequest) {
  // Get the original hostname from various possible headers
  const hostname = 
    request.headers.get('x-forwarded-host') ||     // Most common
    request.headers.get('x-original-host') ||      // Some platforms
    request.headers.get('host') ||                 // Fallback
    '';
    
  const pathname = request.nextUrl.pathname;
  const isDevelopment = process.env.NODE_ENV === 'development';

  // Disable employees routes for now. Return 404
  if (pathname.startsWith('/dashboard/employees')) {
    return new NextResponse('Not Found', { status: 404 });
  }

  // Extract subdomain using utility function
  const subdomain = getSubdomain(hostname);

  // If we have a subdomain, rewrite to dynamic subdomain routes
  if (subdomain) {
    // Don't rewrite auth pages, API routes, or static files
    if (!pathname.startsWith('/signin') && 
        !pathname.startsWith('/signup') && 
        !pathname.startsWith('/verify-email') &&
        !pathname.startsWith(`/${subdomain}`) && 
        !pathname.startsWith('/api') && 
        !pathname.startsWith('/_next')) {
      const rewriteUrl = `/${subdomain}${pathname}`;
      return NextResponse.rewrite(new URL(rewriteUrl, request.url));
    }
  }
  
  // If accessing /order route from main domain without subdomain
  if (pathname.startsWith('/order') && !subdomain) {
    const isLocalhost = hostname.includes('localhost') || hostname.includes('127.0.0.1');
    if (!(isDevelopment && isLocalhost)) {
      return NextResponse.redirect(new URL('/', request.url));
    }
  }

  // Protect dashboard routes
  if (pathname.startsWith('/dashboard')) {
    const token = request.cookies.get('__session')?.value;
    if (!token) {
      return NextResponse.redirect(new URL('/signin', request.url));
    }
    
    try {
      // Basic JWT decode to check email verification without full verification
      // This is less secure but works in Edge Runtime
      const payload = JSON.parse(atob(token.split('.')[1]));
      
      // Check if email is verified
      if (payload.email_verified === false) {
        return NextResponse.redirect(new URL('/verify-email', request.url));
      }
      
    } catch (error) {
      // If we can't decode the token, redirect to signin
      console.error('Token decode failed:', error);
      const response = NextResponse.redirect(new URL('/signin', request.url));
      response.cookies.delete('__session');
      return response;
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
