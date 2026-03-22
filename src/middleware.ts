import { defineMiddleware } from 'astro:middleware';
import { checkMessageRate, checkRoomCreationRate } from './lib/ratelimit.js';
import { db } from './lib/db/index.js';
import { bannedNicknames } from './lib/db/schema.js';
import { eq } from 'drizzle-orm';

const SECURITY_HEADERS: Record<string, string> = {
  'X-Frame-Options': 'DENY',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data:",
    "connect-src 'self'",
    "font-src 'self'",
    "frame-ancestors 'none'",
  ].join('; '),
};

export const onRequest = defineMiddleware(async (ctx, next) => {
  const nick = ctx.cookies.get('nickname')?.value;
  const { pathname } = new URL(ctx.request.url);

  // Admin route protection
  const isAdminPage = pathname === '/admin' || pathname === '/admin/';
  const isAdminLoginApi = pathname === '/api/admin/login';
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (!isAdminPage && !isAdminLoginApi) {
      const session = ctx.cookies.get('admin_session')?.value;
      const adminToken = import.meta.env.ADMIN_TOKEN;
      if (!session || !adminToken || session !== adminToken) {
        return pathname.startsWith('/api/')
          ? new Response('Unauthorized', { status: 401 })
          : ctx.redirect('/admin');
      }
    }
  }

  // Check if user is banned (skip for admin routes and login/logout)
  if (nick && !pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    try {
      const [ban] = await db
        .select({ id: bannedNicknames.id })
        .from(bannedNicknames)
        .where(eq(bannedNicknames.nickname, nick))
        .limit(1);
      if (ban) {
        ctx.cookies.delete('nickname', { path: '/' });
        return pathname.startsWith('/api/')
          ? new Response('Banned', { status: 403 })
          : ctx.redirect('/');
      }
    } catch (err) {
      console.error('[middleware] ban check failed:', err);
    }
  }

  // Rate limiting — checked before handlers run
  if (ctx.request.method === 'POST') {
    if (/^\/api\/rooms\/[^/]+\/messages$/.test(pathname)) {
      if (!nick || !checkMessageRate(nick)) {
        return new Response('Too many requests', { status: 429 });
      }
    }
    if (pathname === '/api/rooms') {
      const ip = ctx.request.headers.get('x-forwarded-for')?.split(',')[0].trim() ?? 'unknown';
      if (!checkRoomCreationRate(ip)) {
        return new Response('Too many requests', { status: 429 });
      }
    }
  }

  // Auth redirect for page routes (admin has its own guard above)
  if (pathname !== '/' && !pathname.startsWith('/api/') && !pathname.startsWith('/admin')) {
    if (!nick) return ctx.redirect('/');
  }

  const response = await next();

  // Security headers on every response
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
});
