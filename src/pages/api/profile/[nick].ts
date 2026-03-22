import type { APIRoute } from 'astro';
import { db } from '../../../lib/db/index.js';
import { userProfiles } from '../../../lib/db/schema.js';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ params }) => {
  const nick = params.nick!;
  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.nickname, nick))
    .limit(1);

  return new Response(JSON.stringify(profile ?? null), {
    headers: { 'Content-Type': 'application/json' },
  });
};
