import { db } from '../src/lib/db/index.js';
import { rooms } from '../src/lib/db/schema.js';

await db.insert(rooms).values({ name: 'Lobby', slug: 'lobby' }).onConflictDoNothing();
console.log('Seeded lobby room');
process.exit(0);
