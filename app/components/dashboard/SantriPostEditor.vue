<script setup lang="ts">
import type { EditorToolbarItem } from "@nuxt/ui";

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
const coverInputKey = ref(0);
const coverFile = ref<File | null>(null);
const tagInput = ref("");

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
  [
    { kind: "heading", level: 2, icon: "i-lucide-heading-2" },
    { kind: "mark", mark: "bold", icon: "i-lucide-bold" },
    { kind: "mark", mark: "italic", icon: "i-lucide-italic" },
  ],
  [
    { kind: "blockquote", icon: "i-lucide-quote" },
    { kind: "bulletList", icon: "i-lucide-list" },
    { kind: "orderedList", icon: "i-lucide-list-ordered" },
  ],
  [
    { kind: "link", icon: "i-lucide-link" },
    { kind: "image", icon: "i-lucide-image" },
    { kind: "undo", icon: "i-lucide-undo-2" },
    { kind: "redo", icon: "i-lucide-redo-2" },
  ],
];

const canSubmit = computed(() =>
  Boolean(form.featuredImage && form.categoryId !== undefined),
);

const statusLabel = computed(
  () =>
    ({
      draft: "Draft",
      pending_review: "Menunggu Review",
      rejected: "Ditolak",
      published: "Terpublikasi",
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
        title: "Post sedang direview",
        description: "Post yang berstatus menunggu review tidak bisa diedit.",
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

function addTag() {
  const nextTag = tagInput.value.trim();
  if (!nextTag) {
    return;
  }

  if (!form.tags.includes(nextTag) && form.tags.length < 10) {
    form.tags.push(nextTag);
  }

  tagInput.value = "";
}

function removeTag(tag: string) {
  form.tags = form.tags.filter((item) => item !== tag);
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
          ? "Post dikirim untuk review"
          : "Post diperbarui",
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

const backLabel = computed(() =>
  isEdit.value ? "Edit Post" : "Tulis Post Baru",
);
</script>

<template>
  <div class="min-h-[calc(100vh-60px)] bg-white">
    <div class="sticky top-[60px] z-20 border-b border-slate-200 bg-white">
      <div
        class="flex min-h-[48px] flex-col gap-3 px-4 py-3 md:flex-row md:items-center md:justify-between md:px-5 md:py-0"
      >
        <UButton
          to="/dashboard/posts"
          variant="ghost"
          icon="i-lucide-arrow-left"
          size="sm"
          class="justify-start"
        >
          {{ backLabel }}
        </UButton>

        <UBadge
          :color="statusColor"
          variant="subtle"
          class="self-start md:self-auto"
        >
          {{ statusLabel }}
        </UBadge>

        <div class="flex flex-col gap-2 sm:flex-row">
          <UButton
            variant="outline"
            color="neutral"
            size="sm"
            :loading="loadingAction === 'draft'"
            @click="saveDraft()"
          >
            Simpan Draft
          </UButton>
          <UButton
            color="primary"
            size="sm"
            :loading="loadingAction === 'submit'"
            @click="submitReview()"
          >
            {{
              currentStatus === "rejected"
                ? "Kirim Ulang"
                : "Kirim untuk Review"
            }}
          </UButton>
        </div>
      </div>
    </div>

    <div class="flex min-h-[calc(100vh-108px)] flex-col lg:flex-row">
      <div class="min-w-0 flex-1 overflow-y-auto p-4 lg:p-6">
        <div v-if="postStatus === 'pending'" class="py-10 text-sm text-muted">
          Memuat editor...
        </div>

        <div v-else class="space-y-4">
          <div>
            <input
              v-model="form.title"
              type="text"
              maxlength="120"
              placeholder="Judul post kamu..."
              class="w-full border-0 bg-transparent text-2xl font-bold outline-none placeholder:text-slate-300"
            />
            <p class="mt-1 text-right text-xs text-dimmed">
              {{ titleCount }}/120
            </p>
          </div>

          <div class="border-t border-slate-200 pt-4">
            <UEditor
              v-model="form.content"
              content-type="html"
              placeholder="Mulai menulis isi post kamu..."
              :starter-kit="{ link: { openOnClick: false } }"
              class="min-h-[420px] rounded-xl border border-slate-200 bg-white"
            >
              <template #default="{ editor }">
                <UEditorToolbar
                  :editor="editor"
                  :items="toolbarItems"
                  class="border-b border-slate-200 px-3 py-2"
                />
              </template>
            </UEditor>
          </div>

          <p class="border-t border-slate-200 pt-3 text-xs text-dimmed">
            {{ wordCount }} kata · ~{{ readingTime }} menit baca
          </p>
        </div>
      </div>

      <aside
        class="w-full border-t border-slate-200 bg-slate-50 p-4 lg:w-[320px] lg:border-t-0 lg:border-l lg:p-5"
      >
        <div class="space-y-5">
          <UAlert
            v-if="currentStatus === 'rejected' && rejectionNote"
            color="error"
            variant="subtle"
            icon="i-lucide-triangle-alert"
            title="Catatan Penolakan"
            :description="rejectionNote"
          />

          <div class="space-y-2">
            <div class="flex items-center justify-between gap-2">
              <label class="text-sm font-medium">Cover</label>
              <span class="text-xs text-dimmed">Wajib saat submit</span>
            </div>

            <UFileUpload
              :key="coverInputKey"
              v-model="coverFile"
              accept="image/jpeg,image/png,image/webp"
              variant="area"
              size="md"
              icon="i-lucide-image-up"
              label="Drop cover di sini"
              description="JPG, PNG, atau WebP. Minimal 1000px dan maksimal 2MB."
              :highlight="!form.featuredImage"
              class="min-h-40 w-full"
            />

            <div
              v-if="form.featuredImage"
              class="overflow-hidden rounded-xl border border-slate-200 bg-white"
            >
              <img
                :src="form.featuredImage"
                alt="Preview cover post"
                class="h-40 w-full object-cover"
              />
            </div>
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between gap-2">
              <label class="text-sm font-medium">Ringkasan</label>
              <span class="text-xs text-dimmed"
                >{{ form.excerpt.length }}/200</span
              >
            </div>
            <UTextarea
              v-model="form.excerpt"
              :rows="4"
              maxlength="200"
              autoresize
              placeholder="Jika kosong, ringkasan akan diambil dari konten."
            />
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between gap-2">
              <label class="text-sm font-medium">Kategori</label>
              <span class="text-xs text-dimmed">Wajib saat submit</span>
            </div>
            <USelect
              v-model="form.categoryId"
              :items="categoryItems"
              placeholder="Pilih kategori"
            />
          </div>

          <div class="space-y-2">
            <div class="flex items-center justify-between gap-2">
              <label class="text-sm font-medium">Tag</label>
              <span class="text-xs text-dimmed">{{ form.tags.length }}/10</span>
            </div>

            <div class="rounded-xl border border-slate-200 bg-white p-3">
              <div v-if="form.tags.length" class="mb-2 flex flex-wrap gap-2">
                <span
                  v-for="tag in form.tags"
                  :key="tag"
                  class="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700"
                >
                  {{ tag }}
                  <button
                    type="button"
                    class="text-dimmed hover:text-slate-900"
                    @click="removeTag(tag)"
                  >
                    ×
                  </button>
                </span>
              </div>

              <input
                v-model="tagInput"
                type="text"
                maxlength="40"
                placeholder="Tambah tag lalu Enter"
                class="w-full border-0 bg-transparent text-sm outline-none placeholder:text-slate-400"
                @keydown.enter.prevent="addTag"
                @keydown.comma.prevent="addTag"
              />
            </div>
          </div>

          <div class="space-y-3 border-t border-slate-200 pt-4">
            <UButton
              variant="outline"
              color="neutral"
              class="w-full justify-center"
              :loading="loadingAction === 'draft'"
              @click="saveDraft()"
            >
              Simpan Draft
            </UButton>
            <UButton
              color="primary"
              class="w-full justify-center"
              :disabled="!canSubmit"
              :loading="loadingAction === 'submit'"
              @click="submitReview()"
            >
              {{
                currentStatus === "rejected"
                  ? "Kirim Ulang"
                  : "Kirim untuk Review"
              }}
            </UButton>
          </div>
        </div>
      </aside>
    </div>
  </div>
</template>
