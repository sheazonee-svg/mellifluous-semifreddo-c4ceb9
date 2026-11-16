import { Hono } from "hono";
import { timingSafeEqual, createHash } from "node:crypto";
import { asc, eq } from "drizzle-orm";
import { db } from "../../db/index.ts";
import { profile, fxItems } from "../../db/schema.ts";

export const config = { path: "/api/*" };

const DEFAULT_DESCRIPTION =
  "A little archive of vocal FX made with love. Find your favorite sound and explore the collection.";

const app = new Hono();

const hash = (v: string) => createHash("sha256").update(v).digest();

function isAdmin(req: Request): boolean {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) return false;
  const given = req.headers.get("x-admin-password") || "";
  return timingSafeEqual(hash(given), hash(expected));
}

const isHttpUrl = (v: string) => /^https?:\/\//i.test(v);
const clean = (v: unknown, max = 2000) => String(v ?? "").trim().slice(0, max);

app.use("/api/admin/*", async (c, next) => {
  if (!isAdmin(c.req.raw)) return c.json({ error: "Password salah." }, 401);
  await next();
});

app.get("/api/site", async (c) => {
  const [p] = await db.select().from(profile).where(eq(profile.id, 1));
  const items = await db.select().from(fxItems).orderBy(asc(fxItems.id));
  c.header("Cache-Control", "no-store");
  return c.json({
    profile: {
      avatar: p?.avatar ?? "",
      description: p ? p.description : DEFAULT_DESCRIPTION,
      wa: p?.wa ?? "",
      tiktok: p?.tiktok ?? "",
    },
    items: items.map((i) => ({ id: String(i.id), song: i.song, name: i.name, url: i.url, type: i.type })),
  });
});

app.post("/api/admin/login", (c) => c.json({ ok: true }));

app.put("/api/admin/profile", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const values = {
    avatar: clean(body.avatar),
    description: clean(body.description, 1000),
    wa: clean(body.wa),
    tiktok: clean(body.tiktok),
  };
  for (const key of ["avatar", "wa", "tiktok"] as const) {
    if (values[key] && !isHttpUrl(values[key])) {
      return c.json({ error: "Link harus diawali http:// atau https://" }, 400);
    }
  }
  await db
    .insert(profile)
    .values({ id: 1, ...values })
    .onConflictDoUpdate({ target: profile.id, set: { ...values, updatedAt: new Date() } });
  return c.json({ ok: true });
});

app.post("/api/admin/items", async (c) => {
  const body = await c.req.json().catch(() => ({}));
  const song = clean(body.song, 200);
  const name = clean(body.name, 200);
  const url = clean(body.url);
  const type = body.type === "favorite" ? "favorite" : "song";
  if (!song || !name || !url) return c.json({ error: "Isi nama/judul, nama FX, dan link BandLab dulu ya." }, 400);
  if (!isHttpUrl(url)) return c.json({ error: "Link harus diawali http:// atau https://" }, 400);
  const [item] = await db.insert(fxItems).values({ song, name, url, type }).returning();
  return c.json({ id: String(item.id) }, 201);
});

app.delete("/api/admin/items/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (!Number.isInteger(id)) return c.json({ error: "Invalid id" }, 400);
  await db.delete(fxItems).where(eq(fxItems.id, id));
  return c.json({ ok: true });
});

app.notFound((c) => c.json({ error: "Not found" }, 404));

export default app;
