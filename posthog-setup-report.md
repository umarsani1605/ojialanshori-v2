<wizard-report>
# PostHog post-wizard report

The wizard has completed a deep integration of PostHog analytics into Omah Ngaji Al-Anshori (ojialanshori.com). The integration covers both client-side and server-side event tracking across the full user journey — from public site visit through registration, login, content creation, editorial review, and publication.

**What was configured:**
- `@posthog/nuxt` module installed and registered in `nuxt.config.ts` with EU region host, automatic client-side exception capture, and server-side error tracking.
- `server/utils/posthog.ts` created as a singleton PostHog Node client for all server routes.
- Environment variables `NUXT_PUBLIC_POSTHOG_PROJECT_TOKEN` and `NUXT_PUBLIC_POSTHOG_HOST` added to `.env`.
- User identification: `posthog.identify()` called client-side on login using the user's email. `posthog.reset()` called on logout.
- Session correlation: `x-posthog-session-id` and `x-posthog-distinct-id` headers automatically forwarded to server routes via `__add_tracing_headers`.

## Events

| Event | Description | File |
|---|---|---|
| `user_logged_in` | User successfully logs in. Also calls `posthog.identify()` with email. | `app/pages/masuk.vue` |
| `user_registered` | New santri submits registration — top of acquisition funnel. | `server/api/auth/register.post.ts` |
| `user_logged_out` | User explicitly logs out. Also calls `posthog.reset()`. | `app/composables/useAuth.ts` |
| `post_draft_saved` | Santri saves a post as draft (create or update). | `app/composables/post-editor/usePostEditorActions.ts` |
| `post_submitted_for_review` | Santri submits a post for editorial review — key workflow conversion. | `server/api/posts/[id]/submit.post.ts` |
| `post_published` | Admin/reviewer directly publishes a post without approval step. | `server/api/posts/[id]/publish.post.ts` |
| `post_approved` | Reviewer approves a pena santri post, publishing it. | `server/api/posts/[id]/approve.post.ts` |
| `post_rejected` | Reviewer rejects a pena santri post with a revision note. | `server/api/posts/[id]/reject.post.ts` |
| `whatsapp_contact_clicked` | Visitor clicks WhatsApp contact link — public site lead intent. | `app/pages/kontak.vue` |

## Next steps

We've built a dashboard and five insights for you to monitor user behavior and content workflow health:

**Dashboard:**
- [Analytics basics](https://eu.posthog.com/project/92575/dashboard/672903)

**Insights:**
- [Daily Active Users (Logins)](https://eu.posthog.com/project/92575/insights/zNPu6IK1) — DAU trend over 30 days
- [New Registrations Over Time](https://eu.posthog.com/project/92575/insights/EZ6748qv) — Weekly registration volume
- [Content Creation Funnel](https://eu.posthog.com/project/92575/insights/fXmQErmU) — Draft saved → Submitted → Approved conversion
- [Post Review Outcomes](https://eu.posthog.com/project/92575/insights/Vyi7mzdl) — Approved vs rejected posts per week
- [WhatsApp Contact Clicks](https://eu.posthog.com/project/92575/insights/5QImnMXP) — Lead intent by contact type (putra/putri)

### Agent skill

We've left an agent skill folder in your project. You can use this context for further agent development when using Claude Code. This will help ensure the model provides the most up-to-date approaches for integrating PostHog.

</wizard-report>
