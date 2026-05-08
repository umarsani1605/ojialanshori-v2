# User Identity Refactoring Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor the user identity system by removing `username`, renaming `name` to `fullname`, adding `nickname`, `bio`, and `yearStudy` fields, and renaming `passwordHash` to `password` across all layers.

**Architecture:** Database-first migration followed by bottom-up refactoring of the backend (repos, services, validation) and top-down refactoring of the frontend (types, components, pages).

**Tech Stack:** Nuxt 4, Nuxt UI v4, Drizzle ORM, MySQL.

---

### Task 1: Database Schema Migration

**Files:**
- Modify: `server/db/schema.ts`

- [ ] **Step 1: Update Drizzle schema**

```typescript
// server/db/schema.ts

// ... existing imports

export const users = mysqlTable('users', {
  id: int().primaryKey().autoincrement(),
  fullname: varchar({ length: 255 }).notNull(), // Renamed from name
  nickname: varchar({ length: 100 }), // New field
  email: varchar({ length: 255 }).notNull().unique(),
  password: varchar({ length: 255 }).notNull(), // Renamed from passwordHash
  passwordType: mysqlEnum(['phpass', 'bcrypt']).notNull().default('phpass'),
  role: mysqlEnum(['admin', 'reviewer', 'santri']).notNull().default('santri'),
  avatar: varchar({ length: 500 }),
  bio: text(), // New field
  phone: varchar({ length: 20 }),
  university: varchar({ length: 255 }),
  faculty: varchar({ length: 255 }),
  major: varchar({ length: 255 }),
  yearStudy: year('year_study'), // New field
  yearEnrolled: year('year_enrolled'),
  isActive: boolean().notNull().default(true),
  createdAt: timestamp().notNull().default(sql`CURRENT_TIMESTAMP`),
  updatedAt: timestamp().notNull().default(sql`CURRENT_TIMESTAMP`).onUpdateNow(),
})

// ... rest of file
```

- [ ] **Step 2: Generate migration**

Run: `pnpm db:generate`
Expected: A new migration file that renames `name` -> `fullname`, `passwordHash` -> `password`, drops `username`, and adds new fields.

- [ ] **Step 3: Run migration**

Run: `pnpm db:migrate`
Expected: Migration succeeds.

- [ ] **Step 4: Commit schema changes**

```bash
git add server/db/schema.ts server/db/migrations/
git commit -m "db: rename columns, drop username, add nickname/bio/yearStudy"
```

### Task 2: Backend Type and Validation Refactoring

**Files:**
- Modify: `server/utils/validation.ts`
- Modify: `auth.d.ts`

- [ ] **Step 1: Update validation types and schemas**

```typescript
// server/utils/validation.ts
// Update UserUpdateInput, validateDashboardUserCreateBody, and validateDashboardUserUpdateBody
// Ensure 'name' is 'fullname' and 'username' is removed.
```

- [ ] **Step 2: Update Auth session types**

```typescript
// auth.d.ts
declare module '#auth-utils' {
  interface User {
    id: number
    fullname: string 
    email: string
    role: 'admin' | 'reviewer' | 'santri'
    avatar: string | null
  }
}
```

- [ ] **Step 3: Commit validation updates**

```bash
git add server/utils/validation.ts auth.d.ts
git commit -m "refactor: update user validation and auth types"
```

### Task 3: Repository Refactoring

**Files:**
- Modify: `server/repositories/users/userRepository.ts`
- Modify: `server/repositories/auth/authRepository.ts`
- Modify: `server/repositories/public/publicContentRepository.ts`
- Modify: `server/repositories/profile/profileRepository.ts`

- [ ] **Step 1: Update User Repository**

```typescript
// server/repositories/users/userRepository.ts
// Update listUsers (searchfullname/nickname, selection list), findUserByEmail, findUserByEmailExcluding
```

- [ ] **Step 2: Update Auth Repository**

```typescript
// server/repositories/auth/authRepository.ts
// Update findUserForAuth to use 'password' instead of 'passwordHash'
```

- [ ] **Step 3: Update Public Content Repository**

```typescript
// server/repositories/public/publicContentRepository.ts
// Remove authorUsername dependencies entirely
```

- [ ] **Step 4: Commit repository changes**

```bash
git add server/repositories/
git commit -m "refactor: update user and public content repositories"
```

### Task 4: Service Layer Refactoring

**Files:**
- Modify: `server/services/users/userService.ts`
- Modify: `server/services/auth/authService.ts`
- Modify: `server/services/profile/profileService.ts`

- [ ] **Step 1: Update User Service**

```typescript
// server/services/users/userService.ts
// Update createUser and patchUser to use new column names (fullname, password)
```

- [ ] **Step 2: Update Auth Service**

```typescript
// server/services/auth/authService.ts
// Remove resolveUniqueUsername. Update registerSantri and verifyLogin to use 'password' column.
```

- [ ] **Step 3: Update Profile Service**

```typescript
// server/services/profile/profileService.ts
// Update updateOwnProfile and updateOwnPassword to use new column names.
```

- [ ] **Step 4: Commit service changes**

```bash
git add server/services/
git commit -m "refactor: update user, auth, and profile services"
```

### Task 5: Frontend Refactoring - Components

**Files:**
- Modify: `app/components/admin/UsersManagementPage.vue`
- Modify: `app/components/dashboard/ProfileSettingsPage.vue`

- [ ] **Step 1: Refactor Users Management Page**

- [ ] **Step 2: Refactor Profile Settings Page**

- [ ] **Step 3: Commit component changes**

```bash
git add app/components/
git commit -m "feat: update user management and profile settings UI"
```

### Task 6: Frontend Refactoring - Pages and Layouts

**Files:**
- Modify: `app/pages/masuk.vue`
- Modify: `app/pages/daftar.vue`
- Modify: `app/layouts/admin.vue`
- Modify: `app/layouts/dashboard-santri.vue`
- Modify: `app/components/AppSidebar.vue`

- [ ] **Step 1: Update Login and Registration pages**

- [ ] **Step 2: Update Layouts and Sidebar**

- [ ] **Step 3: Commit final frontend changes**

```bash
git add app/pages/ app/layouts/ app/components/AppSidebar.vue
git commit -m "feat: final UI updates for user field refactoring"
```

### Task 7: Comprehensive Cleanup & Legacy Code Check (Round 1)

**Files:**
- Scan: Entire workspace for `username`, `passwordHash`, and `name` (in user context)

- [ ] **Step 1: Search and verify no occurrences of `username` remain in logic.**
- [ ] **Step 2: Search and verify no occurrences of `passwordHash` remain.**
- [ ] **Step 3: Verify all user display labels are "Nama Lengkap" and "Nama Panggilan".**
- [ ] **Step 4: Run full build and type check.**

Run: `pnpm nuxi typecheck && pnpm nuxi build`

- [ ] **Step 5: Commit cleanups.**

### Task 8: Comprehensive Cleanup & Legacy Code Check (Round 2)

**Files:**
- Scan: Related repositories and public pages

- [ ] **Step 1: Verify public article listings no longer have author filter UI or logic.**
- [ ] **Step 2: Check all API endpoints for unexpected `username` or `name` fields in responses.**
- [ ] **Step 3: Final end-to-end test of Login -> Dashboard -> Admin User Edit.**
- [ ] **Step 4: Commit final verification notes.**

