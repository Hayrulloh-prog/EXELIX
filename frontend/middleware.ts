import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Register service worker
  if (request.nextUrl.pathname === '/sw.js') {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/sw.js'],
};
