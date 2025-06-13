import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Protect all routes under /(private)
  if (
    request.nextUrl.pathname.startsWith('/dashboard')
  ) {
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
  ],
};
