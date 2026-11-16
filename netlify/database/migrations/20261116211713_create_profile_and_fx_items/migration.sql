CREATE TABLE "fx_items" (
	"id" serial PRIMARY KEY,
	"song" text NOT NULL,
	"name" text NOT NULL,
	"url" text NOT NULL,
	"type" text DEFAULT 'song' NOT NULL,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "profile" (
	"id" integer PRIMARY KEY,
	"avatar" text DEFAULT '' NOT NULL,
	"description" text DEFAULT '' NOT NULL,
	"wa" text DEFAULT '' NOT NULL,
	"tiktok" text DEFAULT '' NOT NULL,
	"updated_at" timestamp DEFAULT now()
);
