CREATE TABLE "banned_nicknames" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"nickname" text NOT NULL,
	"banned_at" timestamp DEFAULT now() NOT NULL,
	"reason" text,
	CONSTRAINT "banned_nicknames_nickname_unique" UNIQUE("nickname")
);
