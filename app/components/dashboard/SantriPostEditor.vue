<script setup lang="ts">
import Emoji from "@tiptap/extension-emoji";
import TextAlign from "@tiptap/extension-text-align";
import type { EditorToolbarItem } from "@nuxt/ui";

import { editorEmojiItems } from "../../utils/editorEmoji";

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

type EditorPost = {
  id: number;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  featuredImage: string | null;
  categoryId: number | null;
  status: "draft" | "pending_review" | "published" | "rejected";
  rejectionNote: string | null;
  tags: string[];
};

type CategoryOption = {
  id: number;
  name: string;
  type: "berita" | "pena_santri";
};

const props = defineProps<{
  postId?: number;
}>();

const router = useRouter();
const toast = useToast();

const isEdit = computed(() => typeof props.postId === "number");

const form = reactive({
  title: "",
  content: "",
  excerpt: "",
  categoryId: undefined as number | undefined,
  featuredImage: null as string | null,
  tags: [] as string[],
});

const currentStatus = ref<EditorPost["status"]>("draft");
const rejectionNote = ref<string | null>(null);
const loadingAction = ref<"draft" | "submit" | null>(null);
const uploadingEditorImage = ref(false);
const coverInputKey = ref(0);
const coverFile = ref<File | null>(null);

const { data: metaData } = await useFetch<{ categories: CategoryOption[] }>(
  "/api/dashboard/santri/posts/meta",
  {
    key: "dashboard-santri-posts-meta",
  },
);

const { data: postData, status: postStatus } =
  await useAsyncData<EditorPost | null>(
    () =>
      isEdit.value
        ? `dashboard-santri-post-editor:${props.postId}`
        : "dashboard-santri-post-editor:create",
    () =>
      isEdit.value
        ? $fetch<{ data: EditorPost }>(
            `/api/dashboard/santri/posts/${props.postId}`,
          ).then((response) => response.data)
        : Promise.resolve(null),
    {
      immediate: isEdit.value,
      default: () => null,
    },
  );

const categoryItems = computed(() =>
  (metaData.value?.categories ?? []).map((category) => ({
    label:
      category.type === "berita"
        ? `Berita · ${category.name}`
        : `Pena Santri · ${category.name}`,
    value: category.id,
  })),
);

const toolbarItems: EditorToolbarItem[][] = [
  // History controls
  [
    {
      kind: "undo",
      icon: "i-lucide-undo",
      tooltip: { text: "Undo" },
    },
    {
      kind: "redo",
      icon: "i-lucide-redo",
      tooltip: { text: "Redo" },
    },
  ],
  // Block types
  [
    {
      icon: "i-lucide-heading",
      tooltip: { text: "Headings" },
      content: {
        align: "start",
      },
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
      content: {
        align: "end",
      },
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
      icon: "i-lucide-text-quote",
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
  // Text formatting
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
  // Link
  [
    {
      kind: "link",
      icon: "i-lucide-link",
      tooltip: { text: "Link" },
    },
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

const editorExtensions = [
  Emoji,
  TextAlign.configure({
    types: ["heading", "paragraph"],
  }),
];

const canSubmit = computed(() =>
  Boolean(form.featuredImage && form.categoryId !== undefined),
);

const statusLabel = computed(
  () =>
    ({
      draft: "Draft",
      pending_review: "Dalam Ulasan",
      rejected: "Ditolak",
      published: "Terbit",
    })[currentStatus.value],
);

const statusColor = computed(
  () =>
    ({
      draft: "neutral",
      pending_review: "warning",
      rejected: "error",
      published: "success",
    })[currentStatus.value] as "neutral" | "warning" | "error" | "success",
);

const titleCount = computed(() => form.title.length);

const plainTextContent = computed(() =>
  form.content
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim(),
);

const wordCount = computed(() =>
  plainTextContent.value ? plainTextContent.value.split(" ").length : 0,
);
const readingTime = computed(() =>
  wordCount.value > 0 ? Math.ceil(wordCount.value / 200) : 0,
);

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

watch(
  postData,
  (value) => {
    if (!value) {
      return;
    }

    const post = value;
    form.title = post.title;
    form.content = post.content;
    form.excerpt = post.excerpt ?? "";
    form.categoryId = post.categoryId ?? undefined;
    form.featuredImage = post.featuredImage;
    form.tags = [...post.tags];
    currentStatus.value = post.status;
    rejectionNote.value = post.rejectionNote;

    if (post.status === "pending_review" && import.meta.client) {
      toast.add({
        title: "Artikel sedang direview",
        description:
          "Artikel yang berstatus menunggu review tidak bisa diedit.",
        color: "warning",
        icon: "i-lucide-clock-3",
      });
      void navigateTo("/dashboard/posts?status=pending_review", {
        replace: true,
      });
    }
  },
  { immediate: true },
);

async function getImageDimensions(file: File) {
  const objectUrl = URL.createObjectURL(file);

  try {
    return await new Promise<{ width: number; height: number }>(
      (resolve, reject) => {
        const image = new Image();
        image.onload = () =>
          resolve({ width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = () => reject(new Error("Cover tidak bisa dibaca."));
        image.src = objectUrl;
      },
    );
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

async function handleCoverChange(file: File | null | undefined) {
  if (!file) {
    return;
  }

  try {
    if (file.size > 2 * 1024 * 1024) {
      throw new Error("Ukuran cover maksimal 2MB.");
    }

    const { width, height } = await getImageDimensions(file);
    if (width < 1000 || height < 1000) {
      throw new Error("Ukuran cover minimal 1000px di sisi lebar dan tinggi.");
    }

    const formData = new FormData();
    formData.append("cover", file);

    const response = await $fetch<{ path: string }>(
      "/api/dashboard/santri/upload/cover",
      {
        method: "POST",
        body: formData,
      },
    );

    form.featuredImage = response.path;
    coverInputKey.value += 1;
    coverFile.value = null;

    toast.add({
      title: "Cover berhasil diunggah",
      color: "success",
      icon: "i-lucide-check",
    });
  } catch (error) {
    toast.add({
      title: "Gagal mengunggah cover",
      description:
        (error as { data?: { message?: string }; message?: string }).data
          ?.message ??
        (error as Error).message ??
        "Terjadi kesalahan.",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
  }
}

watch(coverFile, (file) => {
  void handleCoverChange(file);
});

async function uploadEditorImage(file: File) {
  if (file.size > 2 * 1024 * 1024) {
    throw new Error("Ukuran gambar maksimal 2MB.");
  }

  const formData = new FormData();
  formData.append("image", file);

  return await $fetch<{ url: string }>(
    "/api/dashboard/santri/upload/editor-image",
    {
      method: "POST",
      body: formData,
    },
  );
}

async function promptEditorImageUpload(editor: RichTextEditor) {
  if (!import.meta.client || uploadingEditorImage.value) {
    return;
  }

  const input = document.createElement("input");
  input.type = "file";
  input.accept = "image/jpeg,image/png,image/webp";

  input.onchange = async () => {
    const file = input.files?.[0];
    input.remove();

    if (!file) {
      return;
    }

    try {
      uploadingEditorImage.value = true;

      const response = await uploadEditorImage(file);
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
        icon: "i-lucide-check",
      });
    } catch (error) {
      toast.add({
        title: "Gagal mengunggah gambar",
        description:
          (error as { data?: { message?: string }; message?: string }).data
            ?.message ??
          (error as Error).message ??
          "Terjadi kesalahan.",
        color: "error",
        icon: "i-lucide-alert-circle",
      });
    } finally {
      uploadingEditorImage.value = false;
    }
  };

  input.click();
}

function buildPayload() {
  return {
    title: form.title.trim(),
    content: form.content,
    excerpt: form.excerpt.trim() || null,
    categoryId: form.categoryId ?? null,
    featuredImage: form.featuredImage,
    tags: form.tags,
  };
}

async function saveDraft({
  silent = false,
  redirectAfterCreate = true,
  manageLoading = true,
} = {}) {
  if (manageLoading) {
    loadingAction.value = "draft";
  }

  try {
    const payload = buildPayload();

    const response = isEdit.value
      ? await $fetch<{ id: number; status: EditorPost["status"] }>(
          `/api/dashboard/santri/posts/${props.postId}`,
          {
            method: "PATCH",
            body: payload,
          },
        )
      : await $fetch<{ id: number; status: EditorPost["status"] }>(
          "/api/dashboard/santri/posts",
          {
            method: "POST",
            body: payload,
          },
        );

    currentStatus.value = response.status;
    rejectionNote.value = null;

    if (!isEdit.value && redirectAfterCreate) {
      await router.replace(`/dashboard/posts/${response.id}/edit`);
    }

    if (!silent) {
      toast.add({
        title: "Draft disimpan",
        color: "success",
        icon: "i-lucide-check",
      });
    }

    return response.id;
  } catch (error) {
    if (!silent) {
      toast.add({
        title: "Gagal menyimpan draft",
        description:
          (error as { data?: { message?: string }; message?: string }).data
            ?.message ??
          (error as Error).message ??
          "Terjadi kesalahan.",
        color: "error",
        icon: "i-lucide-alert-circle",
      });
    }
    return null;
  } finally {
    if (manageLoading) {
      loadingAction.value = null;
    }
  }
}

async function submitReview() {
  loadingAction.value = "submit";

  try {
    const payload = buildPayload();
    const postId = isEdit.value
      ? props.postId!
      : await saveDraft({
          silent: true,
          redirectAfterCreate: false,
          manageLoading: false,
        });

    if (!postId) {
      return;
    }

    const response = await $fetch<{ status: EditorPost["status"] }>(
      `/api/dashboard/santri/posts/${postId}/submit`,
      {
        method: "POST",
        body: payload,
      },
    );

    currentStatus.value = response.status;
    rejectionNote.value = null;

    toast.add({
      title:
        currentStatus.value === "pending_review"
          ? "Artikel dikirim untuk review"
          : "Artikel diperbarui",
      color: "success",
      icon: "i-lucide-send",
    });

    await navigateTo("/dashboard/posts?status=pending_review");
  } catch (error) {
    toast.add({
      title: "Gagal mengirim post",
      description:
        (error as { data?: { message?: string }; message?: string }).data
          ?.message ??
        (error as Error).message ??
        "Terjadi kesalahan.",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    loadingAction.value = null;
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-60px)] bg-slate-50">
    <UContainer>
      <div
        class="flex flex-col gap-3 px-2 mb-4 md:flex-row md:items-center md:justify-between"
      >
        <UButton
          to="/dashboard/posts"
          variant="link"
          color="neutral"
          icon="i-lucide-arrow-left"
          class="justify-start"
        >
          Kembali
        </UButton>

        <div class="flex flex-col gap-2 sm:flex-row">
          <UButton
            variant="light"
            :loading="loadingAction === 'draft'"
            @click="saveDraft()"
          >
            Simpan Draft
          </UButton>
          <UButton
            color="primary"
            :disabled="!canSubmit"
            :loading="loadingAction === 'submit'"
            @click="submitReview()"
          >
            Kirim Artikel
          </UButton>
        </div>
      </div>
      <div
        class="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px] xl:items-stretch"
      >
        <div class="min-w-0">
          <div v-if="postStatus === 'pending'" class="py-10 text-sm text-muted">
            Memuat editor...
          </div>

          <div v-else class="flex h-full flex-col gap-5">
            <UCard
              :ui="{
                body: 'p-5 md:p-6',
              }"
            >
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

            <UCard
              class="flex-1"
              :ui="{
                root: 'h-full',
                body: 'pt-2!',
              }"
            >
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

        <aside class="min-w-0 h-full">
          <UAlert
            v-if="currentStatus === 'rejected' && rejectionNote"
            color="error"
            variant="subtle"
            icon="i-lucide-triangle-alert"
            title="Catatan Penolakan"
            :description="rejectionNote"
          />

          <UCard
            class="h-full"
            :ui="{
              root: 'h-full',
              body: 'p-5',
            }"
          >
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
                    Maksimal ukuran file 2MB. Direkomendasikan gambar dengan
                    aspek rasio 3:2.
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
                  <span class="text-sm text-muted">{{
                    `${form.excerpt.length}/200`
                  }}</span>
                </div>
              </UFormField>

              <div class="space-y-4">
                <UFormField label="Kategori" name="categoryId" required>
                  <USelect
                    v-model="form.categoryId"
                    class="w-full"
                    :items="categoryItems"
                    placeholder="Pilih kategori"
                  />
                </UFormField>

                <UFormField label="Tag" name="tags">
                  <UInputTags
                    v-model="form.tags"
                    class="w-full"
                    :max="10"
                    :max-length="40"
                    delimiter=","
                  />
                </UFormField>
              </div>
            </div>
          </UCard>
        </aside>
      </div>
    </UContainer>
  </div>
</template>
