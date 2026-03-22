import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request, cookies }) => {
  const form = await request.formData();
  const password = (form.get('password') as string | null) ?? '';

  if (!password || password !== import.meta.env.ADMIN_PASSWORD) {
    return new Response(null, {
      status: 302,
      headers: { Location: '/admin?error=1' },
    });
  }

  cookies.set('admin_session', import.meta.env.ADMIN_TOKEN, {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
    maxAge: 60 * 60 * 8, // 8 hours
    path: '/',
  });

  return new Response(null, {
    status: 302,
    headers: { Location: '/admin/dashboard' },
  });
};
