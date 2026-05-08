<script setup lang="ts">
import type { EditorToolbarItem } from "@nuxt/ui";
import { toRef } from "vue";
import type { EditorPost } from "~/composables/post-editor/types";

const props = defineProps<{
  postId?: number;
  postType?: "berita" | "pena_santri";
  initialPost?: EditorPost | null;
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
  backTo,
  titleCount,
  wordCount,
  readingTime,
  showBeritaActions,
  showReviewActions,
  editorExtensions,
  promptEditorImageUpload,
  saveDraft,
  sendPost,
  approve,
  reject,
} = usePostEditor({
  postId: toRef(props, "postId"),
  postType: props.postType,
  initialPost: props.initialPost,
});

const toast = useToast();

function handleEditorImagePrompt(editor: RichTextEditor) {
  if (!import.meta.client || uploadingEditorImage.value) return;

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/jpeg,image/png,image/webp";
  input.onchange = async () => {
    const file = input.files?.[0];
    input.remove();
    if (!file) return;

    try {
      uploadingEditorImage.value = true;
      if (file.size > 2 * 1024 * 1024) {
        throw new Error("Ukuran gambar maksimal 2MB.");
      }

      const formData = new FormData();
      formData.append("image", file);
      const response = await $fetch<{ url: string }>(
        "/api/posts/upload/editor-image",
        {
          method: "POST",
          body: formData,
        },
      );

      editor
        .chain()
        .focus()
        .setImage({
          src: response.url,
          alt: file.name.replace(/\.[^/.]+$/, ""),
        })
        .run();

      toast.add({
        title: "Gambar berhasil diunggah",
        color: "success",
        icon: "i-ph-check",
      });
    } catch (error) {
      const msg =
        (error as { data?: { message?: string } }).data?.message ??
        (error as Error).message ??
        "Terjadi kesalahan.";
      toast.add({
        title: "Gagal mengunggah gambar",
        description: msg,
        color: "error",
        icon: "i-ph-warning-circle",
      });
    } finally {
      uploadingEditorImage.value = false;
    }
  };
  input.click();
}

const toolbarItems: EditorToolbarItem[][] = [
  [
    {
      kind: "undo",
      icon: "i-ph-arrow-bend-up-left",
      tooltip: { text: "Undo" },
    },
    {
      kind: "redo",
      icon: "i-ph-arrow-bend-up-right",
      tooltip: { text: "Redo" },
    },
  ],
  [
    {
      icon: "i-ph-text-h",
      tooltip: { text: "Headings" },
      content: { align: "start" },
      items: [
        {
          kind: "heading",
          level: 1,
          icon: "i-ph-text-h-one",
          label: "Heading 1",
        },
        {
          kind: "heading",
          level: 2,
          icon: "i-ph-text-h-two",
          label: "Heading 2",
        },
        {
          kind: "heading",
          level: 3,
          icon: "i-ph-text-h-three",
          label: "Heading 3",
        },
        {
          kind: "heading",
          level: 4,
          icon: "i-ph-text-h-four",
          label: "Heading 4",
        },
      ],
    },
    {
      icon: "i-ph-text-align-justify",
      tooltip: { text: "Text Align" },
      content: { align: "end" },
      items: [
        {
          kind: "textAlign",
          align: "left",
          icon: "i-ph-text-align-left",
          label: "Align Left",
        },
        {
          kind: "textAlign",
          align: "center",
          icon: "i-ph-text-align-center",
          label: "Align Center",
        },
        {
          kind: "textAlign",
          align: "right",
          icon: "i-ph-text-align-right",
          label: "Align Right",
        },
        {
          kind: "textAlign",
          align: "justify",
          icon: "i-ph-text-align-justify",
          label: "Align Justify",
        },
      ],
    },
    {
      kind: "bulletList",
      icon: "i-ph-list-bullets",
      tooltip: { text: "Bullet List" },
    },
    {
      kind: "orderedList",
      icon: "i-ph-list-numbers",
      tooltip: { text: "Ordered List" },
    },
    {
      kind: "blockquote",
      icon: "i-ph-quotes",
      tooltip: { text: "Blockquote" },
    },
    {
      kind: "horizontalRule",
      icon: "i-ph-minus",
      tooltip: { text: "Horizontal Rule" },
    },
  ],
  [
    {
      kind: "mark",
      mark: "bold",
      icon: "i-ph-text-b",
      tooltip: { text: "Bold" },
    },
    {
      kind: "mark",
      mark: "italic",
      icon: "i-ph-text-italic",
      tooltip: { text: "Italic" },
    },
    {
      kind: "mark",
      mark: "underline",
      icon: "i-ph-text-underline",
      tooltip: { text: "Underline" },
    },
    {
      kind: "mark",
      mark: "strike",
      icon: "i-ph-text-strikethrough",
      tooltip: { text: "Strikethrough" },
    },
    {
      kind: "mark",
      mark: "code",
      icon: "i-ph-code",
      tooltip: { text: "Code" },
    },
  ],
  [
    { kind: "link", icon: "i-ph-link", tooltip: { text: "Link" } },
    {
      kind: "image",
      icon: "i-ph-image-square",
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
      icon: "i-ph-text-h-two",
    },
    {
      kind: "heading" as const,
      level: 3,
      label: "Heading kecil",
      description: "Buat subjudul lanjutan",
      icon: "i-ph-text-h-three",
    },
    {
      kind: "paragraph" as const,
      label: "Paragraf",
      description: "Kembali ke teks biasa",
      icon: "i-ph-paragraph",
    },
  ],
  [
    { type: "label" as const, label: "Blok" },
    {
      kind: "bulletList" as const,
      label: "Daftar poin",
      description: "Tampilkan list berpoin",
      icon: "i-ph-list-bullets",
    },
    {
      kind: "orderedList" as const,
      label: "Daftar nomor",
      description: "Tampilkan list bernomor",
      icon: "i-ph-list-numbers",
    },
    {
      kind: "blockquote" as const,
      label: "Kutipan",
      description: "Sorot kutipan penting",
      icon: "i-ph-quotes",
    },
    {
      kind: "image" as const,
      label: "Gambar",
      description: "Unggah gambar ke isi artikel",
      icon: "i-ph-image-square",
    },
    {
      kind: "emoji" as const,
      label: "Emoji",
      description: "Cari emoji dengan cepat",
      icon: "i-ph-smiley",
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
        icon="i-ph-arrow-left"
        class="justify-start"
      >
        Kembali
      </UButton>

      <div class="flex flex-col gap-2 sm:flex-row">
        <!-- Review mode: Tolak + Publish (reviewer viewing someone else's pena_santri) -->
        <template v-if="showReviewActions">
          <UButton
            color="error"
            variant="light"
            :loading="loadingAction === 'reject'"
            :disabled="!!loadingAction"
            @click="reject()"
          >
            Tolak Artikel
          </UButton>
          <UButton
            color="success"
            :loading="loadingAction === 'approve'"
            :disabled="!!loadingAction"
            @click="approve()"
          >
            Publish Artikel
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
          <UCard class="flex-1" :ui="{ root: 'h-full' }">
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
        <UCard
          v-if="
            !showReviewActions &&
            currentStatus === 'rejected' &&
            existingReviewNote
          "
        >
          <template #header>
            <div class="flex flex-col gap-2">
              <p class="font-semibold">Catatan Penolakan</p>
              <p class="text-sm text-muted">
                Direview oleh: <strong>{{ reviewerName }}</strong>
              </p>
            </div>
          </template>

          <div class="space-y-3">
            <div class="prose-rejection-note" v-html="existingReviewNote" />
          </div>
        </UCard>

        <!-- Fields card -->
        <UCard :ui="{ body: 'p-5' }">
          <div class="space-y-6">
            <UFormField label="Gambar Sampul" name="featuredImage" required>
              <div class="space-y-3">
                <UFileUpload
                  :key="coverInputKey"
                  v-model="coverFile"
                  accept="image/jpeg,image/png"
                  variant="area"
                  layout="grid"
                  size="md"
                  icon="i-ph-image-square"
                  label="Pilih gambar atau jatuhkan"
                  :highlight="!form.featuredImage"
                  class="min-h-40 rounded-xl aspect-3/2"
                />
                <div class="text-sm text-muted">
                  JPG/PNG, maksimal ukuran file 2MB, direkomendasikan aspek
                  rasio 3:2.
                </div>
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
