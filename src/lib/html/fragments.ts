import type { Message } from '../db/schema.js';

export function esc(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

const AVATAR_COLORS = [
  '#3b82f6', '#22c55e', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#f97316',
];

function avatarBg(nick: string): string {
  let h = 0;
  for (let i = 0; i < nick.length; i++) h = (h * 31 + nick.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function highlightMentions(escaped: string): string {
  return escaped.replace(/@([a-zA-Z0-9_]+)/g, '<span class="mention">@$1</span>');
}

export function messageHtml(msg: Message): string {
  if (msg.type === 'system') {
    return `<div class="system-msg"><span>${esc(msg.content)}</span></div>`;
  }
  const time = new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const initial = msg.nickname.charAt(0).toUpperCase();
  const bg = avatarBg(msg.nickname);
  const content = highlightMentions(esc(msg.content));
  return `<div class="chat-msg" data-nick="${esc(msg.nickname)}" id="msg-${msg.id}">
    <span class="chat-avatar" style="background:${bg}">${initial}</span>
    <div class="chat-body">
      <div class="chat-meta">
        <span class="chat-nick">${esc(msg.nickname).toUpperCase()}</span>
        <span class="chat-time">${time}</span>
      </div>
      <p class="chat-content">${content}</p>
    </div>
  </div>`;
}

export function presenceHtml(nicks: string[]): string {
  if (nicks.length === 0) {
    return `<div class="pres-empty">No one here</div>`;
  }
  return nicks.map(n => {
    const initial = n.charAt(0).toUpperCase();
    const bg = avatarBg(n);
    return `<div class="pres-item" data-nick="${esc(n)}">
      <span class="pres-avatar" style="background:${bg}">${initial}</span>
      <span class="pres-nick">${esc(n)}</span>
    </div>`;
  }).join('');
}

export function typingHtml(users: string[]): string {
  if (users.length === 0) return '';
  const who = users.length === 1
    ? `${esc(users[0])} IS TYPING`
    : `${users.slice(0, -1).map(esc).join(', ')} AND ${esc(users.at(-1)!)} ARE TYPING`;
  return `<span class="typing-text">${who}...</span>`;
}

export function loadMoreSentinelHtml(slug: string, beforeId: string): string {
  return `<div id="load-more-sentinel"
    hx-get="/api/rooms/${slug}/messages?before=${beforeId}"
    hx-trigger="intersect once"
    hx-target="this"
    hx-swap="outerHTML"
    class="h-4"></div>`;
}
