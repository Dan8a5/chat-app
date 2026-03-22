import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db/index.js';
import { rooms, messages } from '../../../../lib/db/schema.js';
import { messageHtml, loadMoreSentinelHtml } from '../../../../lib/html/fragments.js';
import { getRoomEmitter, getPresence } from '../../../../lib/sse/emitter.js';
import { presenceHtml } from '../../../../lib/html/fragments.js';
import { eq, lt, desc, and } from 'drizzle-orm';

async function getRoom(slug: string) {
  const [room] = await db.select().from(rooms).where(eq(rooms.slug, slug)).limit(1);
  return room;
}

export const GET: APIRoute = async ({ params, url, cookies }) => {
  const nick = cookies.get('nickname')?.value;
  if (!nick) return new Response('Unauthorized', { status: 401 });

  const slug = params.slug!;
  const room = await getRoom(slug);
  if (!room) return new Response('Not found', { status: 404 });

  const beforeId = url.searchParams.get('before');
  const limit = 50;

  let rows;
  if (beforeId) {
    // Get the createdAt of the cursor message
    const [cursor] = await db.select({ createdAt: messages.createdAt })
      .from(messages)
      .where(eq(messages.id, beforeId))
      .limit(1);

    if (!cursor) return new Response('', { status: 200 });

    rows = await db.select()
      .from(messages)
      .where(and(eq(messages.roomId, room.id), lt(messages.createdAt, cursor.createdAt)))
      .orderBy(desc(messages.createdAt))
      .limit(limit + 1);
  } else {
    rows = await db.select()
      .from(messages)
      .where(eq(messages.roomId, room.id))
      .orderBy(desc(messages.createdAt))
      .limit(limit + 1);
  }

  const hasMore = rows.length > limit;
  const batch = hasMore ? rows.slice(0, limit) : rows;
  // rows are desc; reverse for display (oldest first in this batch)
  const ordered = [...batch].reverse();

  let html = '';
  if (hasMore) {
    html += loadMoreSentinelHtml(slug, ordered[0].id);
  }
  html += ordered.map(messageHtml).join('');

  return new Response(html, {
    headers: { 'Content-Type': 'text/html' },
  });
};

export const POST: APIRoute = async ({ params, request, cookies }) => {
  const slug = params.slug!;
  const nick = cookies.get('nickname')?.value;
  if (!nick) return new Response('Unauthorized', { status: 401 });

  const room = await getRoom(slug);
  if (!room) return new Response('Not found', { status: 404 });

  const form = await request.formData();
  const content = (form.get('content') as string | null)?.trim() ?? '';

  if (!content || content.length > 2000) {
    return new Response('Invalid message', { status: 400 });
  }

  const [msg] = await db.insert(messages)
    .values({ roomId: room.id, nickname: nick, content, type: 'user' })
    .returning();

  const emitter = getRoomEmitter(slug);
  emitter.emit('message', messageHtml(msg));
  emitter.emit('presence', presenceHtml(getPresence(slug)));

  return new Response(null, { status: 204 });
};
