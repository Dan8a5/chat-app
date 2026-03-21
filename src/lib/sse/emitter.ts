import { EventEmitter } from 'node:events';

// Pin shared state to globalThis so Vite dev mode module re-evaluations
// don't create separate instances for different requests.
const g = globalThis as any;
if (!g.__chatEmitters) g.__chatEmitters = new Map<string, EventEmitter>();
if (!g.__chatPresence) g.__chatPresence = new Map<string, Set<string>>();
if (!g.__chatTyping) g.__chatTyping = new Map<string, Map<string, ReturnType<typeof setTimeout>>>();

const emitters: Map<string, EventEmitter> = g.__chatEmitters;
const presence: Map<string, Set<string>> = g.__chatPresence;
const typingTimeouts: Map<string, Map<string, ReturnType<typeof setTimeout>>> = g.__chatTyping;

export function getRoomEmitter(slug: string): EventEmitter {
  if (!emitters.has(slug)) {
    const ee = new EventEmitter();
    ee.setMaxListeners(500);
    emitters.set(slug, ee);
  }
  return emitters.get(slug)!;
}

export function addPresence(slug: string, nick: string) {
  if (!presence.has(slug)) presence.set(slug, new Set());
  presence.get(slug)!.add(nick);
}

export function removePresence(slug: string, nick: string) {
  presence.get(slug)?.delete(nick);
}

export function getPresence(slug: string): string[] {
  return Array.from(presence.get(slug) ?? []).sort();
}

export function setTyping(slug: string, nick: string, onExpire: () => void) {
  if (!typingTimeouts.has(slug)) typingTimeouts.set(slug, new Map());
  const map = typingTimeouts.get(slug)!;
  if (map.has(nick)) clearTimeout(map.get(nick)!);
  map.set(nick, setTimeout(() => {
    map.delete(nick);
    onExpire();
  }, 3000));
}

export function getTyping(slug: string): string[] {
  return Array.from(typingTimeouts.get(slug)?.keys() ?? []);
}
