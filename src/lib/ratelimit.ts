type Bucket = { count: number; resetAt: number };

const msgBuckets = new Map<string, Bucket>();
const roomBuckets = new Map<string, Bucket>();

const MSG_LIMIT = 10;
const MSG_WINDOW = 10_000;    // 10 seconds
const ROOM_LIMIT = 5;
const ROOM_WINDOW = 3_600_000; // 1 hour

function check(map: Map<string, Bucket>, key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  let bucket = map.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + windowMs };
    map.set(key, bucket);
  }
  if (bucket.count >= limit) return false;
  bucket.count++;
  return true;
}

export function checkMessageRate(nick: string): boolean {
  return check(msgBuckets, nick, MSG_LIMIT, MSG_WINDOW);
}

export function checkRoomCreationRate(ip: string): boolean {
  return check(roomBuckets, ip, ROOM_LIMIT, ROOM_WINDOW);
}
