import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies }) => {
  const form = await request.formData();
  const nickname = (form.get('nickname') as string | null)?.trim() ?? '';

  if (!/^[a-zA-Z0-9_]{3,20}$/.test(nickname)) {
    return new Response('Invalid nickname', { status: 400 });
  }

  cookies.set('nickname', nickname, {
    httpOnly: false,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 365,
    path: '/',
  });

  return new Response(null, { status: 204 });
};
