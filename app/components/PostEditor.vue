<script setup lang="ts">
import type { EditorToolbarItem } from "@nuxt/ui";

const props = defineProps<{
  postId?: number;
  postType?: "berita" | "pena_santri";
}>();

type RichTextEditor = {
  chain: () => {
    focus: () => {
      run?: () => boolean;
      setImage: (attrs: { alt?: string; src: string }) => {
        run: () => boolean;
      };
    };
  };
  isActive: (name: string) => boolean;
  isEditable: boolean;
};

const {
  form,
  currentStatus,
  postStatus,
  existingReviewNote,
  reviewerName,
  reviewNote,
  loadingAction,
  uploadingEditorImage,
  coverFile,
  coverInputKey,
  categories,
  effectivePostType,
  canSubmit,
  titleCount,
  wordCount,
  readingTime,
  showBeritaActions,
  showReviewActions,
  editorExtensions,
  editorEmojiItems,
  promptEditorImageUpload,
  saveDraft,
  sendPost,
  approve,
  reject,
} = usePostEditor({ postId: props.postId, postType: props.postType });

const toolbarItems: EditorToolbarItem[][] = [
  [
    { kind: "undo", icon: "i-lucide-undo", tooltip: { text: "Undo" } },
    { kind: "redo", icon: "i-lucide-redo", tooltip: { text: "Redo" } },
  ],
  [
    {
      icon: "i-lucide-heading",
      tooltip: { text: "Headings" },
      content: { align: "start" },
      items: [
        {
          kind: "heading",
          level: 1,
          icon: "i-lucide-heading-1",
          label: "Heading 1",
        },
        {
          kind: "heading",
          level: 2,
          icon: "i-lucide-heading-2",
          label: "Heading 2",
        },
        {
          kind: "heading",
          level: 3,
          icon: "i-lucide-heading-3",
          label: "Heading 3",
        },
        {
          kind: "heading",
          level: 4,
          icon: "i-lucide-heading-4",
          label: "Heading 4",
        },
      ],
    },
    {
      icon: "i-lucide-align-justify",
      tooltip: { text: "Text Align" },
      content: { align: "end" },
      items: [
        {
          kind: "textAlign",
          align: "left",
          icon: "i-lucide-align-left",
          label: "Align Left",
        },
        {
          kind: "textAlign",
          align: "center",
          icon: "i-lucide-align-center",
          label: "Align Center",
        },
        {
          kind: "textAlign",
          align: "right",
          icon: "i-lucide-align-right",
          label: "Align Right",
        },
        {
          kind: "textAlign",
          align: "justify",
          icon: "i-lucide-align-justify",
          label: "Align Justify",
        },
      ],
    },
    {
      kind: "bulletList",
      icon: "i-lucide-list",
      tooltip: { text: "Bullet List" },
    },
    {
      kind: "orderedList",
      icon: "i-lucide-list-ordered",
      tooltip: { text: "Ordered List" },
    },
    {
      kind: "blockquote",
      icon: "i-lucide-square-code",
      tooltip: { text: "Blockquote" },
    },
    {
      kind: "codeBlock",
      icon: "i-lucide-square-code",
      tooltip: { text: "Code Block" },
    },
    {
      kind: "horizontalRule",
      icon: "i-lucide-separator-horizontal",
      tooltip: { text: "Horizontal Rule" },
    },
  ],
  [
    {
      kind: "mark",
      mark: "bold",
      icon: "i-lucide-bold",
      tooltip: { text: "Bold" },
    },
    {
      kind: "mark",
      mark: "italic",
      icon: "i-lucide-italic",
      tooltip: { text: "Italic" },
    },
    {
      kind: "mark",
      mark: "underline",
      icon: "i-lucide-underline",
      tooltip: { text: "Underline" },
    },
    {
      kind: "mark",
      mark: "strike",
      icon: "i-lucide-strikethrough",
      tooltip: { text: "Strikethrough" },
    },
    {
      kind: "mark",
      mark: "code",
      icon: "i-lucide-code",
      tooltip: { text: "Code" },
    },
  ],
  [
    { kind: "link", icon: "i-lucide-link", tooltip: { text: "Link" } },
    {
      kind: "image",
      icon: "i-lucide-image-up",
      tooltip: { text: "Upload Image" },
    },
  ],
];

const suggestionItems = [
  [
    { type: "label" as const, label: "Teks" },
    {
      kind: "heading" as const,
      level: 2,
      label: "Heading besar",
      description: "Buat subjudul utama",
      icon: "i-lucide-heading-2",
    },
    {
      kind: "heading" as const,
      level: 3,
      label: "Heading kecil",
      description: "Buat subjudul lanjutan",
      icon: "i-lucide-heading-3",
    },
    {
      kind: "paragraph" as const,
      label: "Paragraf",
      description: "Kembali ke teks biasa",
      icon: "i-lucide-pilcrow",
    },
  ],
  [
    { type: "label" as const, label: "Blok" },
    {
      kind: "bulletList" as const,
      label: "Daftar poin",
      description: "Tampilkan list berpoin",
      icon: "i-lucide-list",
    },
    {
      kind: "orderedList" as const,
      label: "Daftar nomor",
      description: "Tampilkan list bernomor",
      icon: "i-lucide-list-ordered",
    },
    {
      kind: "blockquote" as const,
      label: "Kutipan",
      description: "Sorot kutipan penting",
      icon: "i-lucide-quote",
    },
    {
      kind: "image" as const,
      label: "Gambar",
      description: "Unggah gambar ke isi artikel",
      icon: "i-lucide-image-up",
    },
    {
      kind: "emoji" as const,
      label: "Emoji",
      description: "Cari emoji dengan cepat",
      icon: "i-lucide-smile",
    },
  ],
];

const editorHandlers = {
  image: {
    canExecute: (editor: RichTextEditor) => editor.isEditable,
    execute: (editor: RichTextEditor) => {
      void promptEditorImageUpload(editor);
      return editor.chain().focus();
    },
    isActive: (editor: RichTextEditor) => editor.isActive("image"),
    isDisabled: () => uploadingEditorImage.value,
  },
};

const backTo = computed(() => {
  if (showReviewActions.value || effectivePostType.value === "pena_santri")
    return "/admin/pena-santri";
  if (showBeritaActions.value || effectivePostType.value === "berita")
    return "/admin/berita";
  return "/dashboard/posts";
});
</script>

<template>
  <div class="min-h-[calc(100vh-60px)] bg-slate-50">
    <div
      class="flex flex-col gap-3 px-2 mb-4 md:flex-row md:items-center md:justify-between"
    >
      <UButton
        :to="backTo"
        variant="link"
        color="neutral"
        icon="i-lucide-arrow-left"
        class="justify-start"
      >
        Kembali
      </UButton>

      <div class="flex flex-col gap-2 sm:flex-row">
        <!-- Review mode: Tolak + Publish (reviewer viewing someone else's pena_santri) -->
        <template v-if="showReviewActions">
          <UButton
            color="error"
            variant="subtle"
            :loading="loadingAction === 'reject'"
            :disabled="!!loadingAction"
            @click="reject()"
          >
            Tolak
          </UButton>
          <UButton
            color="success"
            :loading="loadingAction === 'approve'"
            :disabled="!!loadingAction"
            @click="approve()"
          >
            Publish
          </UButton>
        </template>

        <!-- Berita mode: Simpan Draft + Publish (admin writing berita) -->
        <template v-else-if="showBeritaActions">
          <UButton
            variant="subtle"
            :loading="loadingAction === 'save'"
            :disabled="!!loadingAction"
            @click="saveDraft()"
          >
            Simpan Draft
          </UButton>
          <UButton
            color="primary"
            :disabled="!canSubmit || !!loadingAction"
            :loading="loadingAction === 'send'"
            @click="sendPost()"
          >
            Publish
          </UButton>
        </template>

        <!-- Santri / own pena_santri mode: Simpan Draft + Kirim Artikel -->
        <template v-else>
          <UButton
            variant="subtle"
            :loading="loadingAction === 'save'"
            :disabled="!!loadingAction"
            @click="saveDraft()"
          >
            Simpan Draft
          </UButton>
          <UButton
            color="primary"
            :disabled="!canSubmit || !!loadingAction"
            :loading="loadingAction === 'send'"
            @click="sendPost()"
          >
            Kirim Artikel
          </UButton>
        </template>
      </div>
    </div>

    <!-- Main grid -->
    <div class="flex flex-col md:flex-row gap-6">
      <!-- Left column -->
      <div class="flex-3 min-w-0">
        <div v-if="postStatus === 'pending'" class="py-10 text-sm text-muted">
          Memuat editor...
        </div>

        <div v-else class="flex h-full flex-col gap-5">
          <!-- Rejection notice for santri viewing a rejected post -->
          <UAlert
            v-if="
              !showReviewActions &&
              currentStatus === 'rejected' &&
              existingReviewNote
            "
            color="error"
            variant="subtle"
            icon="i-lucide-triangle-alert"
            title="Catatan Penolakan"
          >
            <template #description>
              <p v-if="reviewerName" class="text-xs text-muted mb-2">
                Direview oleh: <strong>{{ reviewerName }}</strong>
              </p>
              <div
                class="prose prose-sm max-w-none"
                v-html="existingReviewNote"
              />
            </template>
          </UAlert>

          <!-- Title card -->
          <UCard :ui="{ body: 'p-5 md:p-6' }">
            <UFormField label="Judul" name="title" required>
              <UInput
                v-model="form.title"
                class="w-full"
                size="xl"
                maxlength="120"
                placeholder="Tulis judul artikel"
              />
            </UFormField>
            <p class="mt-3 text-xs text-dimmed">
              {{ titleCount }}/120 karakter
            </p>
          </UCard>

          <!-- Content card -->
          <UCard class="flex-1" :ui="{ root: 'h-full', body: 'pt-2!' }">
            <template #header>
              <h2 class="text-sm font-semibold">Konten</h2>
            </template>

            <UEditor
              v-model="form.content"
              autofocus="start"
              content-type="html"
              :extensions="editorExtensions"
              :handlers="editorHandlers"
              :placeholder="{
                placeholder: 'Mulai menulis isi artikel kamu...',
                mode: 'firstLine',
              }"
              :starter-kit="{ link: { openOnClick: false } }"
              :ui="{
                root: 'min-h-[520px]',
                content: 'py-4',
                base: 'min-h-[420px] max-w-none px-2!',
              }"
            >
              <template #default="{ editor }">
                <UEditorToolbar
                  :editor="editor"
                  :items="toolbarItems"
                  size="md"
                />
                <UEditorEmojiMenu
                  :editor="editor"
                  :items="editorEmojiItems"
                  :limit="48"
                  :suggestion="{ allowedPrefixes: null }"
                />
              </template>
            </UEditor>

            <template #footer>
              <div class="text-sm text-right">
                {{ wordCount }} kata · {{ readingTime }} menit baca
              </div>
            </template>
          </UCard>
        </div>
      </div>

      <!-- Right sidebar -->
      <aside class="flex-2 min-w-0 space-y-5">
        <!-- ReviewNoteEditor: hanya untuk reviewer bukan pemilik post -->
        <ReviewNoteEditor
          v-if="showReviewActions"
          v-model="reviewNote"
          :disabled="!!loadingAction"
        />

        <!-- Fields card -->
        <UCard :ui="{ body: 'p-5' }">
          <div class="space-y-5">
            <UFormField label="Gambar Sampul" name="featuredImage" required>
              <div class="space-y-3">
                <UFileUpload
                  :key="coverInputKey"
                  v-model="coverFile"
                  accept="image/jpeg,image/png,image/webp"
                  variant="area"
                  size="md"
                  icon="i-lucide-image-up"
                  label="Pilih gambar atau jatuhkan"
                  :highlight="!form.featuredImage"
                  class="min-h-40 w-full"
                />
                <div
                  v-if="form.featuredImage"
                  class="overflow-hidden rounded-xl border border-default"
                >
                  <img
                    :src="form.featuredImage"
                    alt="Preview cover artikel"
                    class="h-40 w-full object-cover"
                  />
                </div>
                <div class="text-sm text-muted">
                  Maksimal ukuran file 2MB. Direkomendasikan aspek rasio 3:2.
                </div>
              </div>
            </UFormField>

            <UFormField label="Ringkasan" name="excerpt">
              <UTextarea
                v-model="form.excerpt"
                class="w-full"
                :rows="4"
                maxlength="200"
                autoresize
                placeholder="Tulis ringkasan singkat artikel..."
              />
              <div class="mt-2 flex justify-end">
                <span class="text-sm text-muted"
                  >{{ form.excerpt.length }}/200</span
                >
              </div>
            </UFormField>

            <div class="space-y-4">
              <!-- Hide category selector for berita (auto-assigned) -->
              <UFormField
                v-if="effectivePostType !== 'berita'"
                label="Kategori"
                name="categoryId"
                required
              >
                <USelect
                  v-model="form.categoryId"
                  class="w-full"
                  :items="categories"
                  placeholder="Pilih kategori"
                />
              </UFormField>
            </div>
          </div>
        </UCard>
      </aside>
    </div>
  </div>
</template>
