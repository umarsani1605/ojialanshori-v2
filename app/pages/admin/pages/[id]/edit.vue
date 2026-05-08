<script setup lang="ts">
import type { EditorToolbarItem } from '@nuxt/ui'

definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
})

type Page = {
  id: number
  title: string
  slug: string
  content: string
  status: 'draft' | 'published'
  updatedAt: string
}

const route = useRoute()
const pageId = Number(route.params.id)
const toast = useToast()
const router = useRouter()

const { data, status: fetchStatus } = useLazyFetch<{ data: Page }>(
  `/api/pages/${pageId}`,
  { key: `admin-page-edit-${pageId}` },
)

const page = computed(() => data.value?.data ?? null)

const form = reactive({
  title: '',
  slug: '',
  content: '',
  status: 'draft' as 'draft' | 'published',
})

watch(page, (p) => {
  if (p) {
    form.title = p.title
    form.slug = p.slug
    form.content = p.content
    form.status = p.status
  }
}, { immediate: true })

const saving = ref(false)

async function save() {
  if (!form.title.trim() || !form.slug.trim()) {
    toast.add({ title: 'Judul dan slug wajib diisi', color: 'warning', icon: 'i-ph-warning' })
    return
  }
  saving.value = true
  try {
    await $fetch(`/api/pages/${pageId}`, {
      method: 'PATCH',
      body: { title: form.title, slug: form.slug, content: form.content, status: form.status },
    })
    toast.add({ title: 'Halaman disimpan', color: 'success', icon: 'i-ph-check-circle' })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Terjadi kesalahan.'
    toast.add({ title: 'Gagal menyimpan', description: msg, color: 'error', icon: 'i-ph-x-circle' })
  } finally {
    saving.value = false
  }
}

const statusOptions = [
  { label: 'Draft', value: 'draft' },
  { label: 'Published', value: 'published' },
]

const toolbarItems: EditorToolbarItem[][] = [
  [
    { kind: 'mark', mark: 'bold', icon: 'i-ph-text-b', tooltip: { text: 'Bold' } },
    { kind: 'mark', mark: 'italic', icon: 'i-ph-text-italic', tooltip: { text: 'Italic' } },
    { kind: 'mark', mark: 'underline', icon: 'i-ph-text-underline', tooltip: { text: 'Underline' } },
    { kind: 'mark', mark: 'strike', icon: 'i-ph-text-strikethrough', tooltip: { text: 'Strikethrough' } },
  ],
  [
    { kind: 'heading', level: 2, icon: 'i-ph-text-h-two', tooltip: { text: 'Heading 2' } },
    { kind: 'heading', level: 3, icon: 'i-ph-text-h-three', tooltip: { text: 'Heading 3' } },
  ],
  [
    { kind: 'bulletList', icon: 'i-ph-list-bullets', tooltip: { text: 'Bullet List' } },
    { kind: 'orderedList', icon: 'i-ph-list-numbers', tooltip: { text: 'Numbered List' } },
  ],
  [
    { kind: 'link', icon: 'i-ph-link', tooltip: { text: 'Link' } },
    { kind: 'blockquote', icon: 'i-ph-quotes', tooltip: { text: 'Blockquote' } },
  ],
]
</script>

<template>
  <div v-if="fetchStatus === 'pending'" class="p-6 space-y-4">
    <USkeleton class="h-8 w-64" />
    <USkeleton class="h-96 w-full" />
  </div>

  <div v-else-if="!page" class="p-6">
    <UAlert
      color="error"
      icon="i-ph-warning-circle"
      title="Halaman tidak ditemukan"
    />
  </div>

  <div v-else class="p-6 space-y-6 max-w-3xl">
    <div class="flex items-center gap-3">
      <UButton
        to="/admin/pages"
        variant="ghost"
        icon="i-ph-arrow-left"
        label="Kembali"
        class="-ml-2"
      />
      <h1 class="text-xl font-semibold">Edit Halaman</h1>
    </div>

    <div class="space-y-4">
      <UFormField label="Judul" required>
        <UInput v-model="form.title" placeholder="Judul halaman" class="w-full" />
      </UFormField>

      <UFormField label="Slug" required>
        <UInput v-model="form.slug" placeholder="slug-halaman" class="w-full" />
      </UFormField>

      <UFormField label="Status">
        <USelect
          v-model="form.status"
          :items="statusOptions"
          value-key="value"
          label-key="label"
          class="w-48"
        />
      </UFormField>

      <UFormField label="Konten">
        <UEditor
          v-slot="{ editor }"
          v-model="form.content"
          content-type="html"
          class="min-h-96 border rounded-lg"
        >
          <UEditorToolbar :editor="editor" :items="toolbarItems" />
        </UEditor>
      </UFormField>
    </div>

    <div class="flex justify-end gap-2">
      <UButton variant="ghost" label="Batal" to="/admin/pages" />
      <UButton label="Simpan" :loading="saving" @click="save" />
    </div>
  </div>
</template>
