import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db/index.js';
import { messages } from '../../../../lib/db/schema.js';
import { eq } from 'drizzle-orm';

export const DELETE: APIRoute = async ({ params }) => {
  const id = params.id!;
  await db.delete(messages).where(eq(messages.id, id));
  return new Response(null, { status: 204 });
};
