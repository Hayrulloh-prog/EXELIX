import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // Allow service worker file to be served without interruption
  if (request.nextUrl.pathname === "/sw.js") {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/sw.js"],
};
