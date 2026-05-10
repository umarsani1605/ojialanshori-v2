/**
 * Migration script: Posts, Pages, Categories
 * Source: WordPress REST API (https://ojialanshori.com/wp-json/wp/v2/)
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
import fs from "node:fs/promises";
import path from "node:path";
import * as schema from "../server/db/schema.js";
import type { CategoryType, PageStatus } from "../server/db/schema.js";

// ─── WordPress API types ─────────────────────────────────────────────────────

interface WPCategory {
  id: number;
  name: string;
  slug: string;
  parent: number;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const WP_API = "https://ojialanshori.com/wp-json/wp/v2";

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

async function fetchAll<T>(
  endpoint: string,
  params: Record<string, string> = {},
): Promise<T[]> {
  const results: T[] = [];
  let page = 1;
  let totalPages = 1;

  while (page <= totalPages) {
    const url = new URL(`${WP_API}${endpoint}`);
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
    url.searchParams.set("page", String(page));
    url.searchParams.set("per_page", "100");

    const res = await fetch(url.toString(), {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        Accept: "application/json, text/plain, */*",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
        Referer: "https://ojialanshori.com/",
        Origin: "https://ojialanshori.com/",
      },
    });
    if (!res.ok) {
      const errorBody = await res.text();
      console.log(
        `\n🔴 Debug Error Body (first 300 chars):\n${errorBody.substring(0, 300)}...`,
      );
      throw new Error(`WP API ${res.status}: ${url}`);
    }

    if (page === 1) {
      totalPages = parseInt(res.headers.get("X-WP-TotalPages") ?? "1", 10);
      const total = res.headers.get("X-WP-Total");
      console.log(`    Total: ${total} items across ${totalPages} pages`);
    }

    const data = (await res.json()) as T[];
    results.push(...data);
    console.log(
      `    Page ${page}/${totalPages} — fetched ${data.length} items`,
    );
    page++;
  }

  return results;
}

// ─── SQL Parser ──────────────────────────────────────────────────────────────

function splitSqlValues(row: string): string[] {
  const values: string[] = [];
  let current = "";
  let inString = false;
  let escaped = false;
  for (let i = 0; i < row.length; i++) {
    const char = row[i];
    if (escaped) {
      current += char;
      escaped = false;
    } else if (char === "\\") {
      current += char;
      escaped = true;
    } else if (char === "'") {
      inString = !inString;
      current += char;
    } else if (char === "," && !inString) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function unquote(val: string): string | null {
  if (val === "NULL") return null;
  if (val.startsWith("'") && val.endsWith("'")) {
    return val
      .slice(1, -1)
      .replace(/\\'/g, "'")
      .replace(/\\"/g, '"')
      .replace(/\\n/g, "\n")
      .replace(/\\r/g, "\r")
      .replace(/\\t/g, "\t")
      .replace(/\\\\/g, "\\");
  }
  return val;
}

function parseWPPostsSql(sqlContent: string): any[] {
  const posts: any[] = [];
  const insertRegex = /INSERT INTO `wp_posts` \((.*?)\) VALUES\s*([\s\S]*?);/g;
  let match;

  while ((match = insertRegex.exec(sqlContent)) !== null) {
    const columns = match[1].split(",").map((c) => c.trim().replace(/`/g, ""));
    const valuesPart = match[2].trim();

    let currentRow = "";
    let inString = false;
    let escaped = false;
    let parenLevel = 0;

    for (let i = 0; i < valuesPart.length; i++) {
      const char = valuesPart[i];
      if (escaped) {
        currentRow += char;
        escaped = false;
      } else if (char === "\\") {
        currentRow += char;
        escaped = true;
      } else if (char === "'") {
        inString = !inString;
        currentRow += char;
      } else if (!inString) {
        if (char === "(") {
          parenLevel++;
          if (parenLevel > 1) currentRow += char;
        } else if (char === ")") {
          parenLevel--;
          if (parenLevel === 0) {
            const values = splitSqlValues(currentRow);
            const post: any = {};
            columns.forEach((col, idx) => {
              post[col] = unquote(values[idx]);
            });
            posts.push(post);
            currentRow = "";
          } else {
            currentRow += char;
          }
        } else if (char === "," && parenLevel === 0) {
          // Skip comma between rows
        } else {
          currentRow += char;
        }
      } else {
        currentRow += char;
      }
    }
  }
  return posts;
}

function mapWPStatusToPostStatus(wpStatus: string): PostStatus {
  switch (wpStatus) {
    case "publish":
    case "future":
      return "published";
    case "pending":
      return "pending_review";
    case "draft":
    case "private":
    case "trash":
    default:
      return "draft";
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  if (!process.env.MYSQL_URL) {
    throw new Error("MYSQL_URL is not set. Check your .env file.");
  }

  console.log("🔌 Connecting to database...");
  const connection = mysql.createPool(process.env.MYSQL_URL);
  const db = drizzle(connection, {
    schema,
    casing: "snake_case",
    mode: "default",
  });

  const mapping = {
    categories: {} as Record<number, number>,
    posts: {} as Record<number, number>,
    pages: {} as Record<number, number>,
  };

  // ── 1. Categories ───────────────────────────────────────────────────────────

  console.log("\n📁 Migrating categories...");
  const wpCategories = await fetchAll<WPCategory>("/categories");

  // Build wp_id → slug map for parent resolution
  const wpSlugById = new Map(wpCategories.map((c) => [c.id, c.slug]));

  // Determine category type based on slug ancestry
  function getCategoryType(slug: string, parentId: number): CategoryType {
    if (slug === "pena-santri") return "pena_santri";
    if (parentId) {
      const parentSlug = wpSlugById.get(parentId);
      if (parentSlug === "pena-santri") return "pena_santri";
    }
    return "berita";
  }

  // Sort: parents (parent === 0) first so FK references resolve in order
  const sortedCats = [...wpCategories].sort((a, b) => a.parent - b.parent);

  let catOk = 0,
    catErr = 0;
  for (const cat of sortedCats) {
    const type = getCategoryType(cat.slug, cat.parent);
    const parentNewId = cat.parent
      ? (mapping.categories[cat.parent] ?? null)
      : null;

    try {
      // Check if already exists (idempotent)
      const existing = await db.query.categories.findFirst({
        where: eq(schema.categories.slug, cat.slug),
      });

      if (existing) {
        mapping.categories[cat.id] = existing.id;
        catOk++;
        continue;
      }

      const result = await db.insert(schema.categories).values({
        name: cat.name,
        slug: cat.slug,
        parentId: parentNewId,
        type,
      });
      mapping.categories[cat.id] = result[0].insertId;
      catOk++;
    } catch (e) {
      console.error(`  ❌ Category "${cat.slug}":`, (e as Error).message);
      catErr++;
    }
  }
  console.log(`  ✅ ${catOk} ok  ❌ ${catErr} errors`);

  // ── 2. Posts ────────────────────────────────────────────────────────────────

  console.log("\n📝 Migrating posts from SQL...");
  const sqlPath = path.join(process.cwd(), "scripts/wp_posts.sql");
  const sqlContent = await fs.readFile(sqlPath, "utf-8");
  const wpPostsRaw = parseWPPostsSql(sqlContent);

  const wpPosts = wpPostsRaw.filter(
    (p) => p.post_type === "post" && p.post_status !== "auto-draft",
  );
  console.log(`    Found ${wpPosts.length} posts in SQL (excluding auto-drafts)`);

  // Default author ID — placeholder until E1-004 (user migration)
  // All posts temporarily attributed to author ID 1 (admin)
  const PLACEHOLDER_AUTHOR_ID = 1;

  // Ensure placeholder user exists to satisfy foreign key constraint
  const existingUser = await db.query.users.findFirst({
    where: eq(schema.users.id, PLACEHOLDER_AUTHOR_ID),
  });

  if (!existingUser) {
    console.log("  👤 Creating placeholder user (ID 1)...");
    await db.insert(schema.users).values({
      fullname: "System Admin",
      email: "admin@ojialanshori.com",
      password: "placeholder",
      role: "admin",
      isActive: true,
    });
    // In case the auto-increment wasn't 1, force update it
    await connection.query(
      `UPDATE users SET id = 1 WHERE email = 'admin@ojialanshori.com'`,
    );
  }

  let postOk = 0,
    postErr = 0;
  for (const post of wpPosts) {
    // Categories are NOT available in SQL wp_posts table, default to 1
    const categoryNewId = 1;

    // Featured image is NOT available in SQL directly
    const featuredImageUrl = null;

    // Generate slug if post_name is empty
    const slug =
      post.post_name ||
      stripHtml(post.post_title)
        .toLowerCase()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .substring(0, 200) ||
      `post-${post.ID}`;

    try {
      const existing = await db.query.posts.findFirst({
        where: eq(schema.posts.slug, slug),
      });

      if (existing) {
        mapping.posts[post.ID] = existing.id;
        postOk++;
        continue;
      }

      const result = await db.insert(schema.posts).values({
        title: stripHtml(post.post_title) || "Untitled Post",
        slug: slug,
        content: post.post_content || "",
        excerpt: stripHtml(post.post_excerpt) || null,
        featuredImage: featuredImageUrl,
        categoryId: categoryNewId,
        authorId: PLACEHOLDER_AUTHOR_ID,
        status: mapWPStatusToPostStatus(post.post_status),
        publishedAt: new Date(post.post_date),
        createdAt: new Date(post.post_date),
        updatedAt: new Date(post.post_modified),
      });
      mapping.posts[post.ID] = result[0].insertId;
      postOk++;
    } catch (e: any) {
      console.error(
        `  ❌ Post "${slug}":`,
        e.message,
        e.cause?.message || e.cause || "",
      );
      postErr++;
    }
  }
  console.log(`  ✅ ${postOk} ok  ❌ ${postErr} errors`);

  // ── 4. Save mapping for E1-005 (media migration) ────────────────────────────

  const mapPath = path.join(process.cwd(), "scripts/migrate-content-map.json");
  await fs.writeFile(mapPath, JSON.stringify(mapping, null, 2), "utf-8");
  console.log(`\n💾 Mapping saved to ${mapPath}`);

  // ── Summary ─────────────────────────────────────────────────────────────────

  console.log("\n🎉 Migration complete!");
  console.log(`   Categories : ${Object.keys(mapping.categories).length}`);
  console.log(`   Posts      : ${Object.keys(mapping.posts).length}`);
  console.log(`   Pages      : ${Object.keys(mapping.pages).length}`);
  console.log(
    "\n⚠️  Note: post.authorId is set to placeholder (1) until E1-004 user migration runs.",
  );
  console.log(
    "⚠️  Note: post.featuredImage contains original WP URL, will be updated by E1-005.",
  );

  await connection.end();
}

main().catch((err) => {
  console.error("\n💥 Migration failed:", err);
  process.exit(1);
});
