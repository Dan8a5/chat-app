import type { APIRoute } from 'astro';
import { db } from '../../../../../lib/db/index.js';
import { bannedNicknames } from '../../../../../lib/db/schema.js';
import { kickFromAllRooms } from '../../../../../lib/sse/emitter.js';

export const POST: APIRoute = async ({ params, request }) => {
  const nick = params.nick!;
  let reason: string | null = null;
  const ct = request.headers.get('content-type') ?? '';
  if (ct.includes('form')) {
    const form = await request.formData();
    reason = (form.get('reason') as string | null)?.trim() || null;
  }

  await db.insert(bannedNicknames).values({ nickname: nick, reason }).onConflictDoNothing();
  kickFromAllRooms(nick);

  return new Response(null, {
    status: 302,
    headers: { Location: '/admin/dashboard' },
  });
};
