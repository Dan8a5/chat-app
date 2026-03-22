import { defineMiddleware } from 'astro:middleware';
import { checkMessageRate, checkRoomCreationRate } from './lib/ratelimit.js';

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

  // Auth redirect for page routes
  if (pathname !== '/' && !pathname.startsWith('/api/')) {
    if (!nick) return ctx.redirect('/');
  }

  const response = await next();

  // Security headers on every response
  for (const [key, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(key, value);
  }

  return response;
});
