import type { APIRoute } from 'astro';
import { db } from '../../../../../lib/db/index.js';
import { bannedNicknames } from '../../../../../lib/db/schema.js';
import { eq } from 'drizzle-orm';

export const DELETE: APIRoute = async ({ params }) => {
  const nick = params.nick!;
  await db.delete(bannedNicknames).where(eq(bannedNicknames.nickname, nick));
  return new Response(null, { status: 204 });
};
