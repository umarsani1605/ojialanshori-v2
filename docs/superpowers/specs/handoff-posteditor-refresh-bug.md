# Handoff Notes: PostEditor Refresh Bug — Data Fetching Issue

## Problem Statement

Saat **refresh** (F5 / hard reload) halaman edit post:
- `useAsyncData` di `usePostEditorContext` tidak fetching
- Tidak ada network request ke `/api/posts/{id}`
- Form kosong, tidak terpopulate data

Saat **navigasi dari halaman list** (klik tombol edit):
- Fetching berjalan normal
- Data tampil dengan benar

---

## Current Code State

### `app/composables/post-editor/usePostEditorContext.ts`

```ts
const { data: postData, status: postStatus } = useAsyncData<EditorPost | null>(
  `post-editor-${options.postId}`,
  async () => {
    console.log("[PostEditorContext] fetching post:", options.postId);
    if (!options.postId) return null;
    const response = await $fetch<{ data: EditorPost }>(`/api/posts/${options.postId}`);
    return response.data;
  },
  { immediate: true, default: () => null },
);
```

Cache key: `` `post-editor-${options.postId}` ``

### `app/pages/dashboard/posts/[id]/edit.vue`

```vue
<script setup lang="ts">
definePageMeta({
  layout: "dashboard-santri",
  middleware: ["auth", "role"],
  requiredRole: "santri",
});

const route = useRoute();
const postId = computed(() => Number(route.params.id));
</script>

<template>
  <UContainer>
    <PostEditor :post-id="postId" />
  </UContainer>
</template>
```

`postId` adalah `computed()` — kemungkinan masalah ada di sini.

---

## Root Cause Hypothesis

1. **`postId` sebagai `computed()`** — Cache key `` `post-editor-${options.postId}` `` menghasilkan key berbeda saat SSR vs client hydration. Saat hard reload, SSR menyelesaikan dengan `postId = someNumber` tapi client hydration menghasilkan `computed()` wrapper yang berbeda, menyebabkan Nuxt payload mismatch.

2. **`immediate: true`** di `useAsyncData` seharusnya fetch saat init, tapi tidak terjadi saat refresh — kemungkinan cache key collision atau SSR payload tidak di-inject dengan benar ke client.

3. **Middleware interaction** — `auth.ts` middleware menggunakan `navigateTo('/masuk')` jika `!loggedIn`. Saat hard refresh, session mungkin belum ter-resolve sebelum `useAsyncData` dijalankan di SSR, sehingga API call gagal/ditolak.

---

## What Has Been Tried

1. Hapus `lazy: true` → tidak membantu
2. Ganti `computed()` → `number` → tidak membantu
3. Fetch di level page (`edit.vue`) dengan `await useAsyncData` → menyebabkan error lain
4. Pasang `console.log` untuk debugging

Ada 2 `console.log` yang sudah ditambahkan di `usePostEditorContext.ts`:
- `console.log("[PostEditorContext] init, postId:", options.postId);`
- `console.log("[PostEditorContext] fetching post:", options.postId);`

---

## Files to Investigate

| File | Notes |
|------|-------|
| `app/composables/post-editor/usePostEditorContext.ts` | Utama — `useAsyncData` fetch di composable |
| `app/pages/dashboard/posts/[id]/edit.vue` | Page level — pass `postId` |
| `app/middleware/auth.ts` | Cek apakah session resolve sebelum fetch |
| `app/middleware/role.ts` | Role checking |
| `app/composables/useAuth.ts` | `useUserSession()` usage |
| `server/api/posts/[id].get.ts` | API endpoint — butuh `requireAuth` |
| `server/middleware/auth.ts` | Server-side session injection ke `event.context.user` |

---

## Key Technical Questions to Answer

1. Apakah `useAsyncData` dijalankan di SSR saat hard refresh?
2. Apakah `postId` prop sampai dengan benar ke composable saat SSR?
3. Apakah `console.log` muncul di server terminal saat hard refresh?
4. Apakah session/user ter-resolve di SSR sebelum composable init?
5. Apakah API `/api/posts/{id}` mengembalikan data yang benar saat dipanggil langsung (curl/test)?

---

## Suggested Debugging Approach

1. **Verify SSR execution** — cek apakah `console.log` di `usePostEditorContext` muncul di terminal server saat hard refresh
2. **Check payload** — inspect Nuxt payload di page source untuk memastikan data di-inject
3. **Test API directly** — curl ke `/api/posts/{id}` dengan session cookie untuk verify API works
4. **Try moving fetch to page level** — refactor agar fetch terjadi di `edit.vue` dengan `await useAsyncData`, pastikan prop `initialPost` di-pass dengan benar
5. **Check middleware timing** — apakah auth middleware sudah resolve session sebelum `useAsyncData` jalan

---

## Related Bugs Already Fixed (dari session sebelumnya)

- `author.name` → `author.fullname` consistency (guard, services, API handlers, UI)
- Cover image preview di `UFileUpload` (fetch existing URL → convert ke `File`)
- Clipboard image paste error (ganti `promptEditorImageUpload` dengan inline `handleEditorImagePrompt`)
- Reading time formula (200 WPM → 225 WPM)
- Review rejection note styling (`.prose-rejection-note` CSS)
- `UAlert` → `UCard` conversion untuk rejection notice
- `editor.reviewer?.fullname` type fix di `types.ts`

---

## Next Steps

1. Tambahkan debug console.log di `edit.vue` page level untuk verify SSR execution
2. Test dengan `curl` ke API endpoint dengan cookie session
3. Jika semua gagal, pertimbangkan untuk move data fetching ke page level (`edit.vue`) dengan pattern `await useAsyncData` + `initialPost` prop yang sudah pernah dicoba tapi error

