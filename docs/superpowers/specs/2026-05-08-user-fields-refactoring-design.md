# Design Spec: User Identity Refactoring & Extended Profile Fields

Refactor the user identity system to simplify authentication, standardize naming, and enrich user profiles.

## 1. Background & Motivation
The current user system uses both `username` and `email` for identity, but `username` is rarely used and often confusingly labeled. Additionally, the profile lacks essential fields for a student-based organization like `nickname`, `bio`, and `year_study` (distinct from Oji enrollment year). Removing the `username` dependency also allows us to simplify public filtering logic.

## 2. Scope & Impact
- **Database**: Schema migration for the `users` table.
- **Authentication**: Switch to 100% email-based identity.
- **Admin UI**: Complete overhaul of the User Management table and form.
- **Member Dashboard**: New profile editing capabilities.
- **Public API**: Removal of author filtering by username.

## 3. Proposed Solution

### 3.1 Data Model Changes (`server/db/schema.ts`)
- **Rename**: `name` (varchar 255) -> `fullname`
- **Drop**: `username` (varchar 100)
- **Add**: `nickname` (varchar 100, nullable)
- **Add**: `bio` (text, nullable)
- **Add**: `yearStudy` (year, nullable, mapped to `year_study` column)

### 3.2 Backend Refactoring

#### Validation & Types (`server/utils/validation.ts`)
- Remove `username` from all schemas.
- Replace `name` with `fullname`.
- Add `nickname`, `bio`, `yearStudy` to `UserUpdateInput` and `validateDashboardUserUpdateBody`.
- Update `validateLoginBody` to remove any mention of username-based login.

#### Services & Repositories
- **Auth Service**: Remove unique username resolution logic in `registerSantri`.
- **User Repository**:
    - Update `listUsers` to search within `fullname` and `nickname`.
    - Replace `findUserByEmailOrUsername` with `findUserByEmail`.
- **Public Content Repository**:
    - Remove `author` from `NormalizedListOptions`.
    - Remove author username selection and joining in `getPublicPostListing` and `getPublicPostBySlug`.

### 3.3 Frontend Refactoring

#### Admin User Management (`app/components/admin/UsersManagementPage.vue`)
- Update `User` interface.
- Table Columns:
    - "Nama Lengkap" (mapped to `fullname`).
    - "Nama Panggilan" (mapped to `nickname`).
    - Keep "Angkatan Oji" and "Status".
- Edit/Create Modal:
    - Two-column layout remains.
    - Column 1: Akun (Email, Role, Password, Status).
    - Column 2: Profil (Fullname, Nickname, Bio, Phone, Year Study, Year Enrolled, Campus details).

#### Member Profile (`app/components/dashboard/ProfileSettingsPage.vue`)
- Add `nickname` (Nama Panggilan) and `bio` (Bio) inputs.
- Activate "Angkatan Kuliah" (`yearStudy`) input.

#### Layouts
- Update `auth.d.ts` to reflect `fullname` and `nickname`.
- Update sidebar and headers to use `fullname` for display and initials.

## 4. Alternatives Considered
- **Keep username as a slug**: Decided against this as it adds complexity for little gain in the current use case. Users prefer email login and display names.
- **Filter author by ID**: Could be done, but the requirement is to remove it entirely to simplify the public interface.

## 5. Verification Plan

### Database Migration
- [ ] `pnpm db:generate` produces a clean migration renaming and adding fields.
- [ ] `pnpm db:migrate` runs successfully.

### API Tests
- [ ] POST `/api/auth/login` works with email.
- [ ] GET `/api/users` returns new fields and renames.
- [ ] PATCH `/api/profile` updates nickname and bio.
- [ ] GET `/api/public/posts` no longer accepts `author` filter.

### Manual UI Checklist
- [ ] Admin: Can create a user without providing a username.
- [ ] Admin: Can see nickname in the table.
- [ ] Member: Bio and Nickname persist after saving profile.
- [ ] Layout: Initials are generated correctly from `fullname`.

## 6. Migration & Rollback
- **Migration**: Existing `name` data will be moved to `fullname`. `username` data will be lost (deemed acceptable by user).
- **Rollback**: Standard git revert and database snapshot restore if necessary.
