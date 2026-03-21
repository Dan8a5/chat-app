import { pgTable, text, uuid, timestamp } from 'drizzle-orm/pg-core';

export const rooms = pgTable('rooms', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const messages = pgTable('messages', {
  id: uuid('id').primaryKey().defaultRandom(),
  roomId: uuid('room_id').references(() => rooms.id, { onDelete: 'cascade' }).notNull(),
  nickname: text('nickname').notNull(),
  content: text('content').notNull(),
  type: text('type').notNull().default('user'), // 'user' | 'system'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Room = typeof rooms.$inferSelect;
export type Message = typeof messages.$inferSelect;
