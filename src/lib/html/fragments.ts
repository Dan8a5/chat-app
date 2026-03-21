import type { Message } from '../db/schema.js';

export function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function messageHtml(msg: Message): string {
  if (msg.type === 'system') {
    return `<div class="system-msg text-center text-xs text-gray-400 py-1">${esc(msg.content)}</div>`;
  }
  const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return `<div class="message group flex gap-2 px-3 py-1 hover:bg-gray-50 dark:hover:bg-gray-800" id="msg-${msg.id}">
    <div class="flex-1 min-w-0">
      <span class="font-semibold text-sm text-indigo-600 dark:text-indigo-400">${esc(msg.nickname)}</span>
      <span class="text-xs text-gray-400 ml-1">${time}</span>
      <p class="text-sm text-gray-800 dark:text-gray-200 break-words">${esc(msg.content)}</p>
    </div>
  </div>`;
}

export function presenceHtml(nicks: string[]): string {
  if (nicks.length === 0) return '<p class="text-xs text-gray-400 px-2">No one here</p>';
  return nicks.map(n =>
    `<div class="flex items-center gap-2 px-2 py-1">
       <span class="w-2 h-2 rounded-full bg-green-400"></span>
       <span class="text-sm text-gray-700 dark:text-gray-300">${esc(n)}</span>
     </div>`
  ).join('');
}

export function typingHtml(users: string[]): string {
  if (users.length === 0) return '';
  const who = users.length === 1
    ? `${esc(users[0])} is typing`
    : `${users.slice(0, -1).map(esc).join(', ')} and ${esc(users.at(-1)!)} are typing`;
  return `<span class="text-xs text-gray-400 italic">${who}…</span>`;
}

export function loadMoreSentinelHtml(slug: string, beforeId: string): string {
  return `<div id="load-more-sentinel"
    hx-get="/api/rooms/${slug}/messages?before=${beforeId}"
    hx-trigger="intersect once"
    hx-target="this"
    hx-swap="outerHTML"
    class="h-4"></div>`;
}
