import type { APIRoute } from 'astro';
import { getRoomEmitter, setTyping, getTyping } from '../../../../lib/sse/emitter.js';
import { typingHtml } from '../../../../lib/html/fragments.js';

export const POST: APIRoute = async ({ params, cookies }) => {
  const slug = params.slug!;
  const nick = cookies.get('nickname')?.value;
  if (!nick) return new Response('Unauthorized', { status: 401 });

  const emitter = getRoomEmitter(slug);

  setTyping(slug, nick, () => {
    emitter.emit('typing', typingHtml(getTyping(slug)));
  });

  emitter.emit('typing', typingHtml(getTyping(slug)));

  return new Response(null, { status: 204 });
};
