import type { APIRoute } from 'astro';
import { db } from '../../../../lib/db/index.js';
import { rooms, messages } from '../../../../lib/db/schema.js';
import {
  getRoomEmitter,
  addPresence,
  removePresence,
  getPresence,
  cleanupRoom,
} from '../../../../lib/sse/emitter.js';
import { messageHtml, presenceHtml } from '../../../../lib/html/fragments.js';
import { eq } from 'drizzle-orm';

export const GET: APIRoute = async ({ params, cookies, request }) => {
  const slug = params.slug!;
  const nick = cookies.get('nickname')?.value;
  if (!nick) return new Response('Unauthorized', { status: 401 });

  const [room] = await db.select().from(rooms).where(eq(rooms.slug, slug)).limit(1);
  if (!room) return new Response('Not found', { status: 404 });

  const encoder = new TextEncoder();
  const emitter = getRoomEmitter(slug);

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: string, data: string) => {
        try {
          const lines = data.split('\n').map(l => `data: ${l}`).join('\n');
          controller.enqueue(encoder.encode(`event: ${event}\n${lines}\n\n`));
        } catch {
          // controller already closed
        }
      };

      // Add presence & send initial state
      addPresence(slug, nick);
      send('presence', presenceHtml(getPresence(slug)));

      // Broadcast join system message
      (async () => {
        const [msg] = await db.insert(messages).values({
          roomId: room.id,
          nickname: 'system',
          content: `${nick} joined`,
          type: 'system',
        }).returning();
        emitter.emit('message', messageHtml(msg));
        emitter.emit('presence', presenceHtml(getPresence(slug)));
      })();

      const onMessage = (html: string) => send('message', html);
      const onPresence = (html: string) => send('presence', html);
      const onTyping = (html: string) => send('typing', html);
      const onKicked = (kickedNick: string) => send('kicked', kickedNick);

      emitter.on('message', onMessage);
      emitter.on('presence', onPresence);
      emitter.on('typing', onTyping);
      emitter.on('kicked', onKicked);

      request.signal.addEventListener('abort', async () => {
        emitter.off('message', onMessage);
        emitter.off('presence', onPresence);
        emitter.off('typing', onTyping);
        emitter.off('kicked', onKicked);
        removePresence(slug, nick);

        try {
          const [msg] = await db.insert(messages).values({
            roomId: room.id,
            nickname: 'system',
            content: `${nick} left`,
            type: 'system',
          }).returning();
          emitter.emit('message', messageHtml(msg));
          emitter.emit('presence', presenceHtml(getPresence(slug)));
        } catch {
          // DB may be unavailable on shutdown
        }
        try { controller.close(); } catch { /* already closed */ }
        cleanupRoom(slug);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
};
