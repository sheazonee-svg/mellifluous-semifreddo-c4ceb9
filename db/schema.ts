import { pgTable, serial, text, integer, timestamp } from "drizzle-orm/pg-core";

export const profile = pgTable("profile", {
  id: integer().primaryKey(),
  avatar: text().notNull().default(""),
  description: text().notNull().default(""),
  wa: text().notNull().default(""),
  tiktok: text().notNull().default(""),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const fxItems = pgTable("fx_items", {
  id: serial().primaryKey(),
  song: text().notNull(),
  name: text().notNull(),
  url: text().notNull(),
  type: text().notNull().default("song"),
  createdAt: timestamp("created_at").defaultNow(),
});
