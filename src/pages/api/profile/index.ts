import type { APIRoute } from 'astro';
import { db } from '../../../lib/db/index.js';
import { userProfiles } from '../../../lib/db/schema.js';

export const POST: APIRoute = async ({ request, cookies }) => {
  const nick = cookies.get('nickname')?.value;
  if (!nick) return new Response('Unauthorized', { status: 401 });

  const form = await request.formData();
  const bio = ((form.get('bio') as string | null) ?? '').trim().slice(0, 200);

  await db.insert(userProfiles)
    .values({ nickname: nick, bio, messageCount: 0 })
    .onConflictDoUpdate({
      target: userProfiles.nickname,
      set: { bio },
    });

  return new Response(null, { status: 204 });
};
