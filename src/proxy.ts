import { detectBot } from '@arcjet/next';
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import createMiddleware from 'next-intl/middleware';
import type { NextFetchEvent, NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import arcjet from '@/libs/Arcjet';
import { routing } from './libs/I18nRouting';

const handleI18nRouting = createMiddleware(routing);

const isProtectedRoute = createRouteMatcher([
  '/dashboard(.*)',
  '/:locale/dashboard(.*)',
  '/admin(.*)',
  '/:locale/admin(.*)',
]);

const isAdminRoute = createRouteMatcher(['/admin(.*)', '/:locale/admin(.*)']);

const isSuperAdminRoute = createRouteMatcher([
  '/admin/users(.*)',
  '/:locale/admin/users(.*)',
  '/admin/company(.*)',
  '/:locale/admin/company(.*)',
]);

const isDashboardRoute = createRouteMatcher(['/dashboard(.*)', '/:locale/dashboard(.*)']);

type UserMetadata = {
  role?: 'ADMIN' | 'SUPER_ADMIN' | 'USER';
  isActive?: boolean;
};

const aj = arcjet.withRule(
  detectBot({
    mode: 'LIVE',
    allow: ['CATEGORY:SEARCH_ENGINE', 'CATEGORY:PREVIEW', 'CATEGORY:MONITOR'],
  }),
);

function getLocalePrefix(req: NextRequest): string {
  const firstSegment = req.nextUrl.pathname.split('/')[1] ?? '';
  const nonDefaultLocales = routing.locales.filter((l) => l !== routing.defaultLocale);
  return nonDefaultLocales.includes(firstSegment) ? `/${firstSegment}` : '';
}

export const config = {
  // Run on all page routes (excluding assets, _next, etc.) AND the upload API route
  matcher: ['/((?!_next|_vercel|monitoring|api|.*\\..*).*)', '/api/uploadthing'],
};

export default async function proxy(request: NextRequest, event: NextFetchEvent) {
  if (process.env.ARCJET_KEY) {
    const decision = await aj.protect(request);
    if (decision.isDenied()) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Always run clerkMiddleware so auth() is available on all pages (including public ones)
  return await clerkMiddleware(async (auth, req) => {
    // API routes only need Clerk auth context — skip i18n routing
    if (req.nextUrl.pathname.startsWith('/api/')) {
      return NextResponse.next();
    }

    if (isProtectedRoute(req)) {
      const localePrefix = getLocalePrefix(req);
      const signInUrl = new URL(`${localePrefix}/sign-in`, req.url);

      await auth.protect({ unauthenticatedUrl: signInUrl.toString() });

      const { sessionClaims } = await auth();
      const metadata = (sessionClaims?.metadata ?? {}) as UserMetadata;
      const isActive = metadata.isActive ?? true;
      const { role } = metadata;
      const isAdminRole = role === 'ADMIN' || role === 'SUPER_ADMIN';

      if (!isActive) {
        return NextResponse.redirect(new URL(`${localePrefix}/`, req.url));
      }

      if (isAdminRoute(req) && !isAdminRole) {
        return NextResponse.redirect(new URL(`${localePrefix}/`, req.url));
      }

      if (isSuperAdminRoute(req) && role !== 'SUPER_ADMIN') {
        return NextResponse.redirect(new URL(`${localePrefix}/admin`, req.url));
      }

      if (isDashboardRoute(req) && isAdminRole) {
        return NextResponse.redirect(new URL(`${localePrefix}/admin`, req.url));
      }
    }

    return handleI18nRouting(req);
  })(request, event);
}
