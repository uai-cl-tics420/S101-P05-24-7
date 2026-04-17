import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

const intlMiddleware = createMiddleware(routing);

export default async function proxy(request: NextRequest) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
  const pathname = request.nextUrl.pathname;

  // Protect routes that require authentication
  if (pathname.includes("/dashboard") || pathname.includes("/onboarding")) {
    if (!token) {
      // Create new URL, keep locale intact ideally, but for now redirecting to /login
      // If we want localized login we can redirect to `/${routing.defaultLocale}/login`
      // For simplicity, we redirect to login using the current request URL
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Onboarding redirection logic
    const isOnboarding = pathname.includes("/onboarding");
    if (!token.onboardingComplete && !isOnboarding) {
      return NextResponse.redirect(new URL("/onboarding", request.url));
    }
    if (token.onboardingComplete && isOnboarding) {
      const dashboardPath = token.role === "CONSERJE" ? "/dashboard/conserje" : "/dashboard/resident";
      return NextResponse.redirect(new URL(dashboardPath, request.url));
    }

    // Role-based protection for dashboard routes
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
