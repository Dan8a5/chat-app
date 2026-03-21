import type { APIRoute } from 'astro';
import { db } from '../../../lib/db/index.js';
import { rooms } from '../../../lib/db/schema.js';

export const POST: APIRoute = async ({ request }) => {
  const form = await request.formData();
  const name = (form.get('name') as string | null)?.trim() ?? '';

  if (!name || name.length < 2 || name.length > 50) {
    return new Response('Room name must be 2–50 characters.', { status: 400 });
  }

  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);

  await db.insert(rooms).values({ name, slug }).onConflictDoNothing();

  return new Response(null, {
    status: 204,
    headers: { 'HX-Redirect': `/rooms/${slug}` },
  });
};
