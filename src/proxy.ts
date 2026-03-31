import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const pathname = request.nextUrl.pathname;

  // Next-Auth check for protected dashboard routes
  // We check if it contains /dashboard to account for locale paths like /es/dashboard
  if (pathname.includes("/dashboard")) {
    if (!token) {
      // Create new URL, keep locale intact ideally, but for now redirecting to /login
      // If we want localized login we can redirect to `/${routing.defaultLocale}/login`
      // For simplicity, we redirect to login using the current request URL
      return NextResponse.redirect(new URL("/login", request.url));
    }

    if (pathname.includes("/dashboard/conserje")) {
      if (token.role !== "CONSERJE") {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    } else if (pathname.includes("/dashboard/resident")) {
      if (token.role !== "RESIDENTE") {
        return NextResponse.redirect(new URL("/login", request.url));
      }
    }
  }

  // Next-intl middleware for all matched paths
  return intlMiddleware(request);
}

export const config = {
  // Match only internationalized pathnames
  matcher: [
    '/', 
    '/(es|en)/:path*', 
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
