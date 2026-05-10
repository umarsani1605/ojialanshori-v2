/**
 * Migration script: Posts & Categories
 * Source: WordPress XML export (scripts/omahngajial-anshori.WordPress.2026-05-10.xml)
 *
 * Usage:
 *   npx tsx scripts/migrate-content.ts
 *
 * Requirements:
 *   - MYSQL_URL set in .env
 *   - E1-002 schema & migrations already applied to the database
 */
import "dotenv/config";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { eq } from "drizzle-orm";
import fs from "node:fs";
import path from "node:path";
import { XMLParser } from "fast-xml-parser";
import * as schema from "../server/db/schema.js";
import type { CategoryType, PostStatus } from "../server/db/schema.js";

// ─── Types ────────────────────────────────────────────────────────────────────

interface WPPostmeta {
  "wp:meta_key": unknown;
  "wp:meta_value": unknown;
}

interface WPCategoryRef {
  "@_domain": string;
  "@_nicename": string;
  __cdata?: string;
}

interface WPItem {
  title: unknown;
  "wp:post_id": number;
  "wp:post_name": unknown;
  "wp:post_type": string;
  "wp:status": string;
  "wp:post_date": unknown;
  "wp:post_date_gmt": unknown;
  "wp:post_parent": number;
  "wp:attachment_url"?: unknown;
  "content:encoded"?: unknown;
  "excerpt:encoded"?: unknown;
  "dc:creator"?: unknown;
  category?: WPCategoryRef[];
  "wp:postmeta"?: WPPostmeta[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function cdata(val: unknown): string {
  if (val == null) return "";
  if (typeof val === "object" && "__cdata" in (val as object))
    return String((val as Record<string, unknown>).__cdata);
  return String(val);
}

function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, "")
    .replace(/&hellip;/g, "...")
    .replace(/&#8230;/g, "...")
    .replace(/\[&hellip;\]/g, "...")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .trim();
}

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .substring(0, 200);
}

function resolveSlug(item: WPItem): string {
  const postName = cdata(item["wp:post_name"]).trim();
  if (postName) return postName;

  const title = cdata(item.title).trim();
  if (title) {
    const s = slugify(title);
    if (s) return s;
  }

  const catNicename =
    item.category?.find((c) => c["@_domain"] === "category")?.["@_nicename"] ??
    "post";
  return `${catNicename}-${item["wp:post_id"]}`;
}

function resolveStatus(wpStatus: string): PostStatus | null {
  switch (wpStatus) {
    case "publish":
      return "published";
    case "draft":
    case "draft-revision":
      return "draft";
    case "pending":
      return "pending_review";
    default:
      return null; // trash, inherit → skip
  }
}

function resolveDate(item: WPItem): Date {
  const gmt = cdata(item["wp:post_date_gmt"]).trim();
  if (gmt && !gmt.startsWith("0000")) return new Date(gmt.replace(" ", "T") + "Z");
  const local = cdata(item["wp:post_date"]).trim();
  return local ? new Date(local.replace(" ", "T")) : new Date();
}

function getThumbnailUrl(
  item: WPItem,
  attachmentMap: Map<number, string>,
): string | null {
  const metas = item["wp:postmeta"] ?? [];
  const thumbMeta = metas.find(
    (m) => cdata(m["wp:meta_key"]) === "_thumbnail_id",
  );
  if (!thumbMeta) return null;
  const attachId = Number(cdata(thumbMeta["wp:meta_value"]));
  return attachmentMap.get(attachId) ?? null;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.MYSQL_URL) {
    throw new Error("MYSQL_URL is not set. Check your .env file.");
  }

  const XML_PATH = path.join(
    process.cwd(),
    "scripts/omahngajial-anshori.WordPress.2026-05-10.xml",
  );

  // ── Parse XML ────────────────────────────────────────────────────────────────

  console.log("📖 Parsing XML export...");
  const xml = fs.readFileSync(XML_PATH, "utf-8");

  const parser = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: "@_",
    cdataPropName: "__cdata",
    isArray: (name) =>
      ["item", "category", "wp:postmeta"].includes(name),
  });

  const parsed = parser.parse(xml);
  const items: WPItem[] = parsed.rss.channel.item ?? [];

  const SKIP_STATUSES = new Set(["trash", "inherit"]);

  const wpPosts = items.filter(
    (i) =>
      cdata(i["wp:post_type"]) === "post" &&
      !SKIP_STATUSES.has(cdata(i["wp:status"])),
  );
  const wpAttachments = items.filter(
    (i) => cdata(i["wp:post_type"]) === "attachment",
  );

  console.log(
    `  Posts to migrate: ${wpPosts.length}  (attachments indexed: ${wpAttachments.length})`,
  );

  // Build attachment map: wp_post_id → attachment_url
  const attachmentMap = new Map<number, string>();
  for (const att of wpAttachments) {
    const id = Number(att["wp:post_id"]);
    const url = cdata(att["wp:attachment_url"]).trim();
    if (id && url) attachmentMap.set(id, url);
  }

  // ── Connect DB ───────────────────────────────────────────────────────────────

  console.log("\n🔌 Connecting to database...");
  const connection = await mysql.createConnection(process.env.MYSQL_URL);
  const db = drizzle(connection, {
    schema,
    casing: "snake_case",
    mode: "default",
  });

  // Disable FK checks for migration — re-enabled at the end
  await connection.execute("SET FOREIGN_KEY_CHECKS = 0");

  const mapping = {
    categories: {} as Record<number, number>,
    posts: {} as Record<number, number>,
  };

  // ── 1. Collect & upsert categories from post references ───────────────────

  console.log("\n📁 Resolving categories...");

  // Gather all unique category slugs from posts (domain="category" only)
  const catSlugs = new Set<string>();
  for (const post of wpPosts) {
    for (const cat of post.category ?? []) {
      if (cat["@_domain"] === "category" && cat["@_nicename"]) {
        catSlugs.add(cat["@_nicename"]);
      }
    }
  }

  // Known category type mapping (same logic as before)
  function getCategoryType(slug: string, parentSlug?: string): CategoryType {
    if (slug === "pena-santri") return "pena_santri";
    if (parentSlug === "pena-santri") return "pena_santri";
    return "berita";
  }

  let catOk = 0, catErr = 0;
  for (const slug of catSlugs) {
    try {
      const existing = await db.query.categories.findFirst({
        where: eq(schema.categories.slug, slug),
      });
      if (existing) {
        catOk++;
        continue;
      }

      // Category not in DB yet — insert with best-guess type
      const type = getCategoryType(slug);
      const result = await db.insert(schema.categories).values({
        name: slug
          .split("-")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
        slug,
        parentId: null,
        type,
      });
      console.log(
        `  ➕ Inserted missing category: "${slug}" (id: ${result[0].insertId})`,
      );
      catOk++;
    } catch (e) {
      console.error(`  ❌ Category "${slug}":`, (e as Error).message);
      catErr++;
    }
  }
  console.log(`  ✅ ${catOk} ok  ❌ ${catErr} errors`);

  // ── 2. Posts ─────────────────────────────────────────────────────────────────

  console.log("\n📝 Migrating posts...");

  const PLACEHOLDER_AUTHOR_ID = 1;

  let postOk = 0, postSkipped = 0, postErr = 0;

  for (const post of wpPosts) {
    const status = resolveStatus(cdata(post["wp:status"]));
    if (!status) {
      postSkipped++;
      continue;
    }

    const slug = resolveSlug(post);
    const title = stripHtml(cdata(post.title));
    const content = cdata(post["content:encoded"]);
    const excerpt = stripHtml(cdata(post["excerpt:encoded"])) || null;
    const featuredImage = getThumbnailUrl(post, attachmentMap);
    const date = resolveDate(post);

    // Resolve category
    const catNicename = post.category?.find(
      (c) => c["@_domain"] === "category",
    )?.["@_nicename"];
    const dbCat = catNicename
      ? await db.query.categories.findFirst({
          where: eq(schema.categories.slug, catNicename),
        })
      : null;
    const categoryId = dbCat?.id ?? 1;

    try {
      const existing = await db.query.posts.findFirst({
        where: eq(schema.posts.slug, slug),
      });

      if (existing) {
        mapping.posts[post["wp:post_id"]] = existing.id;
        postSkipped++;
        continue;
      }

      const result = await db.insert(schema.posts).values({
        title: title || `(Tanpa Judul ${post["wp:post_id"]})`,
        slug,
        content,
        excerpt,
        featuredImage,
        categoryId,
        authorId: PLACEHOLDER_AUTHOR_ID,
        status,
        publishedAt: status === "published" ? date : null,
        createdAt: date,
        updatedAt: date,
      });
      mapping.posts[post["wp:post_id"]] = result[0].insertId;
      postOk++;
    } catch (e) {
      console.error(`  ❌ Post "${slug}":`, (e as Error).message);
      postErr++;
    }
  }

  console.log(
    `  ✅ ${postOk} inserted  ⏭️  ${postSkipped} skipped  ❌ ${postErr} errors`,
  );

  // ── 3. Save mapping ──────────────────────────────────────────────────────────

  const mapPath = path.join(process.cwd(), "scripts/migrate-content-map.json");
  fs.writeFileSync(mapPath, JSON.stringify(mapping, null, 2), "utf-8");
  console.log(`\n💾 Mapping saved to ${mapPath}`);

  // ── Summary ──────────────────────────────────────────────────────────────────

  console.log("\n🎉 Migration complete!");
  console.log(`   Posts : ${Object.keys(mapping.posts).length}`);
  console.log(
    "\n⚠️  Note: post.authorId is set to placeholder (1) until E1-004 user migration runs.",
  );
  console.log(
    "⚠️  Note: post.featuredImage contains original WP URL, will be updated by migrate-media.ts.",
  );

  await connection.execute("SET FOREIGN_KEY_CHECKS = 1");
  await connection.end();
}

main().catch((err) => {
  console.error("\n💥 Migration failed:", err);
  process.exit(1);
});
