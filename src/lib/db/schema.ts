import { pgTable, text, uuid, timestamp, integer } from 'drizzle-orm/pg-core';

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

export const bannedNicknames = pgTable('banned_nicknames', {
  id: uuid('id').primaryKey().defaultRandom(),
  nickname: text('nickname').notNull().unique(),
  bannedAt: timestamp('banned_at').defaultNow().notNull(),
  reason: text('reason'),
});

export const userProfiles = pgTable('user_profiles', {
  nickname: text('nickname').primaryKey(),
  bio: text('bio'),
  messageCount: integer('message_count').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export type Room = typeof rooms.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type BannedNickname = typeof bannedNicknames.$inferSelect;
export type UserProfile = typeof userProfiles.$inferSelect;
