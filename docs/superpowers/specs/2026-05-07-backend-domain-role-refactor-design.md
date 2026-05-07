# Backend Domain and Role Refactor Design

**Date:** 2026-05-07
**Project:** `omahngaji-v2`
**Status:** Draft for review

## Summary

This spec defines the target backend architecture and business-role model for the current Nuxt fullstack application.

The refactor has four goals:

1. Remove role drift and standardize the business roles to `admin`, `reviewer`, and `santri`.
2. Reorganize backend code by domain instead of by UI namespace or role namespace.
3. Simplify request handlers so they stop owning business logic and stop doing server-side search, filter, pagination, `limit`, and `offset`.
4. Move the codebase to a consistent `route -> service -> repo` structure across all domains, while keeping per-route DB access for Cloudflare Worker deployment.

This refactor explicitly does **not** require compatibility layers, legacy route preservation, or controller wrappers.

## Business Role Model

### Admin

- Owns platform operations and institutional content.
- Manages website settings, banners, gallery, categories, static pages, user accounts, and official publication flows.
- Owns `berita` as institutional content.
- May supervise `pena_santri` workflows when needed.

### Reviewer

- Acts as editor and quality controller for community content.
- Reviews, evaluates, approves, or rejects submitted `pena_santri`.
- May refine or edit `pena_santri` during review flow if the use case requires it.
- Does **not** own `berita` as a business domain.

### Santri

- Acts as community author.
- Creates, edits, and submits `pena_santri` drafts.
- Does not moderate, approve, or manage operational platform resources.

## Business Content Model

### `berita`

- Official institutional content.
- Primary domain owner is `admin`.
- Reviewer is not the business owner of this content type.

### `pena_santri`

- Community contribution content.
- Primary author is `santri`.
- Primary curator is `reviewer`.
- `admin` may supervise or intervene, but is not the primary business owner of the workflow.

## Final Access Intent

### Admin

- May manage operational domains: `users`, `settings`, `banners`, `gallery`, `pages`, `categories`.
- May create, edit, publish, and delete `berita`.
- May view and supervise `pena_santri`.
- May approve or reject `pena_santri`.

### Reviewer

- May access editorial work for `pena_santri`.
- May view submitted `pena_santri`.
- May approve or reject `pena_santri`.
- May edit `pena_santri` during review flow when required by workflow.
- May not own or manage `berita` as a normal workflow.
- May not manage operational domains such as `users`, `settings`, or `banners`.

### Santri

- May create, edit, and delete own `pena_santri` drafts.
- May submit own `pena_santri` for review.
- May view own workflow state and review notes.
- May not approve, reject, or operate institutional domains.

## Architecture Decision

### Chosen structure

The backend will be reorganized using:

- `route -> service -> repo`

This structure will be applied consistently to **all** domains.

### Why this structure

- `route` becomes thin and predictable.
- `service` owns business use cases and orchestration.
- `repo` owns Drizzle query logic.
- The project gains strong separation of concerns without the weight of a dedicated controller layer.

### Explicitly rejected

- `route -> controller -> service -> repo`
  - Rejected as too heavy for the current project stage.
- `route -> service` only
  - Rejected because service files would quickly become the new source of drift and query sprawl.
- Wrapper-first handler abstraction
  - Rejected for the initial refactor. The project will stay explicit first.

## Domain Grouping Decision

All backend modules will be grouped by **domain**, not by role and not by UI layout cluster.

Target domain families:

- `auth`
- `posts`
- `users`
- `categories`
- `gallery`
- `banners`
- `pages`
- `settings`
- `profile`
- `public`

This applies to:

- `server/api`
- `server/services`
- `server/repositories`
- `server/policies` where needed

## Target Folder Shape

```text
server/
  api/
    auth/
    posts/
    users/
    categories/
    gallery/
    banners/
    pages/
    settings/
    profile/
    public/
  services/
    auth/
    posts/
    users/
    categories/
    gallery/
    banners/
    pages/
    settings/
    profile/
    public/
  repositories/
    auth/
    posts/
    users/
    categories/
    gallery/
    banners/
    pages/
    settings/
    profile/
    public/
  policies/
    posts.ts
    users.ts
```

Not every domain must have a policy file. Policy files only exist where access decisions are non-trivial.

## Handler Simplification Rules

All handlers should be simplified with these rules:

1. No server-side pagination.
2. No server-side search.
3. No server-side filter query composition for list screens.
4. No `limit` / `offset` for admin/dashboard list pages driven by client-side filtering.
5. No business branching embedded directly in route handlers unless the branch is trivial.

Handlers should only:

- validate request input
- read session user / actor
- call service
- return response

## DB Access Decision

Per-route DB access remains intentional.

The application is expected to deploy to Cloudflare Workers, so this refactor does **not** attempt to introduce a shared long-lived DB pool abstraction across handlers.

The current direction remains:

- each route gets DB access from `useDb(event)`
- service and repo layers accept the DB object explicitly
- no global connection lifecycle abstraction is introduced in this refactor

## `posts` Domain Design

### Resource model

`posts` remains a **single domain resource**.

There will not be separate backend resources for `berita` and `pena_santri`.

Behavior differences are driven by:

- `post.type`
- actor `role`
- ownership
- workflow action

### Route shape

Representative route set:

- `GET /api/posts`
- `GET /api/posts/:id`
- `POST /api/posts`
- `PATCH /api/posts/:id`
- `DELETE /api/posts/:id`
- `POST /api/posts/:id/submit`
- `POST /api/posts/:id/approve`
- `POST /api/posts/:id/reject`
- `POST /api/posts/:id/publish`

The route design is domain-first, even if the UI for `admin`, `reviewer`, and `santri` differs.

### Service responsibilities

Examples:

- `listPostsForActor`
- `getPostForActor`
- `createPost`
- `updatePost`
- `deletePost`
- `submitPost`
- `approvePost`
- `rejectPost`
- `publishPost`

### Repo responsibilities

Examples:

- `findPostById`
- `listPostsByType`
- `listPostsVisibleToActor`
- `insertPost`
- `updatePostById`
- `deletePostById`

### Policy responsibilities

Examples:

- `canCreatePost`
- `canEditPost`
- `canDeletePost`
- `canSubmitPost`
- `canApprovePost`
- `canRejectPost`
- `canPublishPost`

## Non-Posts Domains

All other domains follow the same structure, but with simpler use cases.

### Expected simplicity

- `settings`, `banners`, `gallery`, `categories`, `pages`, `public`
  - mostly straightforward CRUD/read flows
  - no complex workflow state machine
- `users`, `profile`, `auth`
  - role-sensitive and identity-sensitive
  - require more explicit business tests and edge-case handling

## TDD Strategy

TDD is part of the refactor plan, but it will be applied **after the refactor structure is stable across all domains**.

### Domain-small TDD

For small domains:

- `settings`
- `banners`
- `gallery`
- `categories`
- `pages`
- `public`

Testing scope is intentionally simple:

- positive case
- negative case
- basic authorization failure where relevant
- basic invalid payload case where relevant

### Domain-complex TDD

For complex domains:

- `posts`
- `users`
- `profile`
- `auth`

Testing scope is more detailed:

- role-based access behavior
- ownership rules
- allowed and disallowed state transitions
- invalid action attempts
- invalid payload cases
- key business edge cases

### TDD timing

Refactor order for delivery:

1. complete domain refactor to final structure across the backend
2. then write/update tests to match final domain architecture
3. small domains get lightweight positive/negative coverage
4. complex domains get richer case coverage

This is a deliberate deviation from strict per-change TDD sequencing in order to avoid rewriting test scaffolding repeatedly while the domain structure is still moving.

## Refactor Scope

### In scope

- unify business roles to `admin`, `reviewer`, `santri`
- remove route grouping by role or UI namespace where practical
- simplify handlers
- remove server-side list pagination/search/filter handling for admin/dashboard screens
- move query logic into repos
- move business logic into services
- introduce per-domain policies where needed
- align post workflow to the approved business model

### Out of scope

- compatibility routes
- legacy namespace preservation
- controller layer introduction
- wrapper abstraction for handlers
- shared global DB lifecycle abstraction
- preserving current API layout for migration convenience

## Migration Direction

The refactor should be done as a clean development refactor, not a compatibility-preserving migration.

Because the project is still in development:

- route shapes may change
- internal structure may change aggressively
- old code paths do not need compatibility shims
- deprecated route aliases are not required

## Risks

### Role drift during partial rollout

If some domains move to domain-first rules while others keep role-first rules, the codebase will stay inconsistent.

Mitigation:

- define role and policy semantics first
- refactor all domains into the same structural pattern

### UI-cluster naming leaking into backend again

If new backend modules are still named around `/admin` or `/dashboard`, the same drift will return.

Mitigation:

- enforce domain-first naming in `api`, `services`, and `repositories`

### Services becoming fat query containers

If services keep writing inline Drizzle, repo separation will fail.

Mitigation:

- all Drizzle query composition should move to repo files

### Over-simplifying post workflow

Because `admin` and `reviewer` overlap partially, careless simplification could erase the business distinction.

Mitigation:

- keep one `posts` resource
- encode distinction through policy decisions by `type`, `role`, ownership, and action

## Final Decisions

- Role model is fixed to `admin`, `reviewer`, `santri`.
- Backend grouping is by domain, not by role or UI cluster.
- Backend layering is `route -> service -> repo`.
- Policy helpers are allowed and encouraged for complex domains.
- `posts` remains a single resource with behavior driven by `type`.
- `berita` belongs primarily to `admin`.
- `pena_santri` belongs primarily to `santri` with `reviewer` moderation.
- `admin` may supervise `pena_santri`.
- No compatibility layer is needed.
- No controller layer is needed.
- No wrapper abstraction is needed for the first refactor phase.
- No server-side pagination/search/filter is needed for admin/dashboard list handlers.
- Per-route DB access remains intentional for Worker deployment.
- TDD will be applied after refactor completion, with lightweight coverage for small domains and richer coverage for complex domains.
