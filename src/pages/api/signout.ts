import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ cookies }) => {
  cookies.delete('nickname', { path: '/' });
  return new Response(null, { status: 204 });
};
