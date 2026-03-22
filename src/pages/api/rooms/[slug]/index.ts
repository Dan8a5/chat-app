import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db/index.js';
import { rooms } from '../../../../lib/db/schema.js';
import { eq } from 'drizzle-orm';

export const DELETE: APIRoute = async ({ params, cookies }) => {
  const nick = cookies.get('nickname')?.value;
  if (!nick) return new Response('Unauthorized', { status: 401 });

  const slug = params.slug!;
  await db.delete(rooms).where(eq(rooms.slug, slug));
  return new Response(null, {
    status: 204,
    headers: { 'HX-Redirect': '/rooms' },
  });
};
