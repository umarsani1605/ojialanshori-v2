import Emoji from "@tiptap/extension-emoji";
import TextAlign from "@tiptap/extension-text-align";

import { editorEmojiItems } from "~/utils/editorEmoji";

type RichTextEditor = {
  chain: () => {
    focus: () => {
      run?: () => boolean;
      setImage: (attrs: { alt?: string; src: string }) => { run: () => boolean };
    };
  };
  isActive: (name: string) => boolean;
  isEditable: boolean;
};

type EditorPost = {
  id: number;
  title: string;
  content: string;
  excerpt: string | null;
  featuredImage: string | null;
  categoryId: number | null;
  status: "draft" | "pending_review" | "published" | "rejected";
  reviewNote: string | null;
  tags: string[];
  author?: { id: number; name: string; email: string };
  reviewer?: { id: number; name: string } | null;
};

type CategoryItem = { id: number; name: string; type: string };

export function usePostEditor(opts: { postId?: number }) {
  const auth = useAuth();
  const toast = useToast();
  const router = useRouter();
  const { postId } = opts;

  // --- Form state ---
  const form = reactive({
    title: "",
    content: "",
    excerpt: "",
    categoryId: undefined as number | undefined,
    featuredImage: null as string | null,
    tags: [] as string[],
  });

  const currentStatus = ref<EditorPost["status"]>("draft");
  const existingReviewNote = ref<string | null>(null);
  const reviewerName = ref<string | null>(null);
  const reviewNote = ref(""); // reviewer's input for rejection
  const loadingAction = ref<"save" | "send" | "approve" | "reject" | null>(null);
  const uploadingEditorImage = ref(false);
  const coverInputKey = ref(0);
  const coverFile = ref<File | null>(null);

  // --- Categories ---
  const { data: categoriesRaw } = useAsyncData<CategoryItem[]>(
    "post-editor-categories",
    async () => {
      if (auth.canReview.value) {
        const res = await $fetch<{ data: CategoryItem[] }>("/api/admin/categories");
        return res.data;
      }
      const res = await $fetch<{ categories: CategoryItem[] }>(
        "/api/dashboard/santri/posts/meta"
      );
      return res.categories;
    },
    { lazy: true, default: () => [] as CategoryItem[] }
  );

  const categories = computed(() =>
    (categoriesRaw.value ?? []).map((c) => ({
      label:
        c.type === "berita" ? `Berita · ${c.name}` : `Pena Santri · ${c.name}`,
      value: c.id,
    }))
  );

  // --- Post fetch ---
  const { data: postData, status: postStatus } = useAsyncData<EditorPost | null>(
    `post-editor-${postId ?? "new"}`,
    () => {
      if (!postId) return Promise.resolve(null);
      const url = auth.canReview.value
        ? `/api/admin/posts/${postId}`
        : `/api/dashboard/santri/posts/${postId}`;
      return $fetch<{ data: EditorPost }>(url).then((r) => r.data);
    },
    { lazy: true, immediate: !!postId, default: () => null }
  );

  // --- isOwnPost ---
  const isOwnPost = computed(() => {
    if (!auth.canReview.value) return true; // santri API filters by authorId
    return auth.user.value?.id === postData.value?.author?.id;
  });

  // --- showReviewActions: single flag controlling all UI differences ---
  const showReviewActions = computed(
    () => auth.canReview.value && !!postId && !isOwnPost.value
  );

  // --- Populate form when post loads ---
  watch(
    postData,
    (post) => {
      if (!post) return;
      form.title = post.title;
      form.content = post.content;
      form.excerpt = post.excerpt ?? "";
      form.categoryId = post.categoryId ?? undefined;
      form.featuredImage = post.featuredImage;
      form.tags = [...post.tags];
      currentStatus.value = post.status;
      existingReviewNote.value = post.reviewNote;
      reviewerName.value = post.reviewer?.name ?? null;

      // Santri: redirect if pending_review (cannot edit while in review)
      if (
        !auth.canReview.value &&
        post.status === "pending_review" &&
        import.meta.client
      ) {
        toast.add({
          title: "Artikel sedang direview",
          description: "Artikel yang berstatus menunggu review tidak bisa diedit.",
          color: "warning",
          icon: "i-lucide-clock-3",
        });
        void navigateTo("/dashboard/posts?status=pending_review", { replace: true });
      }
    },
    { immediate: true }
  );

  watch(coverFile, (file) => { void handleCoverChange(file); });

  // --- Computed ---
  const canSubmit = computed(() =>
    Boolean(form.featuredImage && form.categoryId !== undefined)
  );

  const titleCount = computed(() => form.title.length);

  const plainTextContent = computed(() =>
    form.content
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );

  const wordCount = computed(() =>
    plainTextContent.value ? plainTextContent.value.split(" ").length : 0
  );

  const readingTime = computed(() =>
    wordCount.value > 0 ? Math.ceil(wordCount.value / 200) : 0
  );

  const statusLabel = computed(
    () =>
      ({
        draft: "Draft",
        pending_review: "Dalam Ulasan",
        rejected: "Ditolak",
        published: "Terbit",
      })[currentStatus.value]
  );

  const statusColor = computed(
    () =>
      ({
        draft: "neutral",
        pending_review: "warning",
        rejected: "error",
        published: "success",
      })[currentStatus.value] as "neutral" | "warning" | "error" | "success"
  );

  // --- Editor config exposed for template ---
  const editorExtensions = [
    Emoji,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
  ];

  // --- Helpers ---
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

  function errorMessage(e: unknown) {
    return (
      (e as { data?: { message?: string } }).data?.message ??
      (e as Error).message ??
      "Terjadi kesalahan."
    );
  }

  // --- Actions ---
  async function saveDraft({ silent = false, redirectAfterCreate = true, manageLoading = true } = {}) {
    if (manageLoading) loadingAction.value = "save";
    try {
      const payload = buildPayload();
      let response: { id: number; status: EditorPost["status"] };

      if (auth.canReview.value && postId) {
        // Admin/reviewer editing own post — use admin PATCH endpoint (status → draft)
        response = await $fetch(`/api/admin/posts/${postId}`, {
          method: "PATCH",
          body: payload,
        });
      } else if (postId) {
        response = await $fetch(`/api/dashboard/santri/posts/${postId}`, {
          method: "PATCH",
          body: payload,
        });
      } else {
        response = await $fetch("/api/dashboard/santri/posts", {
          method: "POST",
          body: payload,
        });
      }

      currentStatus.value = response.status;
      existingReviewNote.value = null;

      if (!postId && redirectAfterCreate) {
        await router.replace(`/dashboard/posts/${response.id}/edit`);
      }
      if (!silent) {
        toast.add({ title: "Draft disimpan", color: "success", icon: "i-lucide-check" });
      }
      return response.id;
    } catch (e) {
      if (!silent) {
        toast.add({
          title: "Gagal menyimpan draft",
          description: errorMessage(e),
          color: "error",
          icon: "i-lucide-alert-circle",
        });
      }
      return null;
    } finally {
      if (manageLoading) loadingAction.value = null;
    }
  }

  async function sendPost() {
    loadingAction.value = "send";
    try {
      const payload = buildPayload();

      if (auth.canReview.value && postId) {
        // Admin/reviewer publishing own post directly — no review queue
        await $fetch(`/api/admin/posts/${postId}/publish`, {
          method: "POST",
          body: payload,
        });
        toast.add({ title: "Artikel dipublish", color: "success", icon: "i-lucide-check-circle" });
        await navigateTo("/admin/posts");
        return;
      }

      // Santri: submit for review (pending_review)
      const resolvedId = postId
        ? postId
        : await saveDraft({ silent: true, redirectAfterCreate: false, manageLoading: false });

      if (!resolvedId) return;

      const response = await $fetch<{ status: EditorPost["status"] }>(
        `/api/dashboard/santri/posts/${resolvedId}/submit`,
        { method: "POST", body: payload }
      );

      currentStatus.value = response.status;
      existingReviewNote.value = null;

      toast.add({
        title: "Artikel dikirim untuk review",
        color: "success",
        icon: "i-lucide-send",
      });
      await navigateTo("/dashboard/posts?status=pending_review");
    } catch (e) {
      toast.add({
        title: "Gagal mengirim artikel",
        description: errorMessage(e),
        color: "error",
        icon: "i-lucide-alert-circle",
      });
    } finally {
      loadingAction.value = null;
    }
  }

  async function approve() {
    if (!postId) return;
    loadingAction.value = "approve";
    try {
      await $fetch(`/api/dashboard/review/${postId}/approve`, {
        method: "POST",
        body: buildPayload(),
      });
      toast.add({ title: "Artikel dipublish", color: "success", icon: "i-lucide-check-circle" });
      await navigateTo("/admin/posts");
    } catch (e) {
      toast.add({
        title: "Gagal publish",
        description: errorMessage(e),
        color: "error",
        icon: "i-lucide-x-circle",
      });
    } finally {
      loadingAction.value = null;
    }
  }

  async function reject() {
    if (!postId) return;
    if (!reviewNote.value.trim()) {
      toast.add({
        title: "Catatan review wajib diisi",
        color: "warning",
        icon: "i-lucide-alert-triangle",
      });
      return;
    }
    loadingAction.value = "reject";
    try {
      await $fetch(`/api/dashboard/review/${postId}/reject`, {
        method: "POST",
        body: { reviewNote: reviewNote.value, ...buildPayload() },
      });
      toast.add({ title: "Artikel ditolak", color: "warning", icon: "i-lucide-x-circle" });
      await navigateTo("/admin/posts");
    } catch (e) {
      toast.add({
        title: "Gagal menolak",
        description: errorMessage(e),
        color: "error",
        icon: "i-lucide-x-circle",
      });
    } finally {
      loadingAction.value = null;
    }
  }

  // --- Cover upload ---
  async function getImageDimensions(file: File) {
    const objectUrl = URL.createObjectURL(file);
    try {
      return await new Promise<{ width: number; height: number }>((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve({ width: image.naturalWidth, height: image.naturalHeight });
        image.onerror = () => reject(new Error("Cover tidak bisa dibaca."));
        image.src = objectUrl;
      });
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  async function handleCoverChange(file: File | null | undefined) {
    if (!file) return;
    try {
      if (file.size > 2 * 1024 * 1024) throw new Error("Ukuran cover maksimal 2MB.");
      const { width, height } = await getImageDimensions(file);
      if (width < 1000 || height < 1000) {
        throw new Error("Ukuran cover minimal 1000px di sisi lebar dan tinggi.");
      }
      const formData = new FormData();
      formData.append("cover", file);
      const response = await $fetch<{ path: string }>("/api/dashboard/santri/upload/cover", {
        method: "POST",
        body: formData,
      });
      form.featuredImage = response.path;
      coverInputKey.value += 1;
      coverFile.value = null;
      toast.add({ title: "Cover berhasil diunggah", color: "success", icon: "i-lucide-check" });
    } catch (e) {
      toast.add({
        title: "Gagal mengunggah cover",
        description: errorMessage(e),
        color: "error",
        icon: "i-lucide-alert-circle",
      });
    }
  }

  async function promptEditorImageUpload(editor: RichTextEditor) {
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
        if (file.size > 2 * 1024 * 1024) throw new Error("Ukuran gambar maksimal 2MB.");
        const formData = new FormData();
        formData.append("image", file);
        const response = await $fetch<{ url: string }>(
          "/api/dashboard/santri/upload/editor-image",
          { method: "POST", body: formData }
        );
        editor
          .chain()
          .focus()
          .setImage({ src: response.url, alt: file.name.replace(/\.[^/.]+$/, "") })
          .run();
        toast.add({ title: "Gambar berhasil diunggah", color: "success", icon: "i-lucide-check" });
      } catch (e) {
        toast.add({
          title: "Gagal mengunggah gambar",
          description: errorMessage(e),
          color: "error",
          icon: "i-lucide-alert-circle",
        });
      } finally {
        uploadingEditorImage.value = false;
      }
    };
    input.click();
  }

  return {
    // Form
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
    // Computed
    categories,
    canSubmit,
    titleCount,
    wordCount,
    readingTime,
    statusLabel,
    statusColor,
    showReviewActions,
    isOwnPost,
    // Editor config
    editorExtensions,
    editorEmojiItems,
    // Handlers
    handleCoverChange,
    promptEditorImageUpload,
    // Actions
    saveDraft,
    sendPost,
    approve,
    reject,
  };
}
