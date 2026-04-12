import {
  mysqlTable,
  int,
  varchar,
  text,
  longtext,
  boolean,
  timestamp,
  date,
  mysqlEnum,
  type AnyMySqlColumn,
} from 'drizzle-orm/mysql-core'
import { relations, sql } from 'drizzle-orm'

// ─── TypeScript types ────────────────────────────────────────────────────────

export type Role = 'superadmin' | 'pengurus' | 'reviewer' | 'santri'
export type PostStatus = 'draft' | 'pending_review' | 'published' | 'rejected'
export type PasswordType = 'phpass' | 'bcrypt'
export type PageStatus = 'draft' | 'published'
export type CategoryType = 'berita' | 'pena_santri'

// ─── Tables ──────────────────────────────────────────────────────────────────

export const users = mysqlTable('users', {
  id: int().primaryKey().autoincrement(),
  name: varchar({ length: 255 }).notNull(),
  username: varchar({ length: 100 }).notNull().unique(),
  email: varchar({ length: 255 }).notNull().unique(),
  passwordHash: varchar({ length: 255 }).notNull(),
  passwordType: mysqlEnum(['phpass', 'bcrypt']).notNull().default('phpass'),
  role: mysqlEnum(['superadmin', 'pengurus', 'reviewer', 'santri']).notNull().default('santri'),
  avatarPath: varchar({ length: 500 }),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp().notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp().notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
})

export const categories = mysqlTable('categories', {
  id: int().primaryKey().autoincrement(),
  name: varchar({ length: 100 }).notNull(),
  slug: varchar({ length: 100 }).notNull().unique(),
  parentId: int().references((): AnyMySqlColumn => categories.id),
  type: mysqlEnum(['berita', 'pena_santri']).notNull(),
})

export const posts = mysqlTable('posts', {
  id: int().primaryKey().autoincrement(),
  title: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull().unique(),
  content: longtext().notNull(),
  excerpt: text(),
  featuredImage: varchar({ length: 500 }),
  categoryId: int().notNull().references(() => categories.id),
  authorId: int().notNull().references(() => users.id),
  status: mysqlEnum(['draft', 'pending_review', 'published', 'rejected']).notNull().default('draft'),
  rejectionNote: text(),
  publishedAt: timestamp(),
  createdAt: timestamp().notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp().notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
})

export const pages = mysqlTable('pages', {
  id: int().primaryKey().autoincrement(),
  title: varchar({ length: 255 }).notNull(),
  slug: varchar({ length: 255 }).notNull().unique(),
  content: longtext().notNull(),
  status: mysqlEnum(['draft', 'published']).notNull().default('draft'),
  updatedAt: timestamp().notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
})

export const gallery = mysqlTable('gallery', {
  id: int().primaryKey().autoincrement(),
  title: varchar({ length: 255 }).notNull(),
  imagePath: varchar({ length: 500 }).notNull(),
  album: varchar({ length: 100 }),
  order: int().notNull().default(0),
  createdAt: timestamp().notNull().default(sql`CURRENT_TIMESTAMP`),
})

export const banners = mysqlTable('banners', {
  id: int().primaryKey().autoincrement(),
  text: varchar({ length: 500 }).notNull(),
  link: varchar({ length: 500 }),
  isActive: boolean().notNull().default(false),
  startDate: date(),
  endDate: date(),
})

export const settings = mysqlTable('settings', {
  key: varchar({ length: 100 }).primaryKey(),
  value: text().notNull(),
  updatedAt: timestamp().notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
})

// ─── Relations ───────────────────────────────────────────────────────────────

export const usersRelations = relations(users, ({ many }) => ({
  posts: many(posts),
}))

export const categoriesRelations = relations(categories, ({ one, many }) => ({
  parent: one(categories, {
    fields: [categories.parentId],
    references: [categories.id],
    relationName: 'parentChild',
  }),
  children: many(categories, { relationName: 'parentChild' }),
  posts: many(posts),
}))

export const postsRelations = relations(posts, ({ one }) => ({
  category: one(categories, {
    fields: [posts.categoryId],
    references: [categories.id],
  }),
  author: one(users, {
    fields: [posts.authorId],
    references: [users.id],
  }),
}))
