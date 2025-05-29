// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const protectedRoutes = ['/profile', '/orders', '/messages'];

export function middleware(request: NextRequest) {
  const token = request.cookies.get('auth-token')?.value;

  const isAuthenticated = !!token;
  const path = request.nextUrl.pathname;

  const isProtectedRoute = protectedRoutes.some(route =>
      path === route || path.startsWith(`${route}/`)
  );

  if (!isAuthenticated && isProtectedRoute) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }

  if (
      isAuthenticated &&
      (path.startsWith('/auth/signin') || path.startsWith('/auth/signup'))
  ) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/profile/:path*',
    '/orders/:path*',
    '/messages/:path*',
    '/auth/signin',
    '/auth/signup'
  ],
};
