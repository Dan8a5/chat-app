import { defineMiddleware } from 'astro:middleware';

export const onRequest = defineMiddleware(async (ctx, next) => {
  const nick = ctx.cookies.get('nickname')?.value;
  const { pathname } = new URL(ctx.request.url);

  // Always allow: nickname picker + all API routes
  if (pathname === '/' || pathname.startsWith('/api/')) return next();

  if (!nick) return ctx.redirect('/');
  return next();
});
