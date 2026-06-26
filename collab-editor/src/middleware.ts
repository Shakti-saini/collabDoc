import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;

  // Protect dashboard and editor routes
  if ((pathname.startsWith('/dashboard') || pathname.startsWith('/editor')) && !isLoggedIn) {
    return NextResponse.redirect(new URL('/auth/signin', req.nextUrl));
  }

  // Redirect logged-in users away from auth pages
  if (pathname.startsWith('/auth/') && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.nextUrl));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
