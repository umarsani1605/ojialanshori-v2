import { computed, toValue } from "vue";

import type {
  LoadingAction,
  PostEditorForm,
  PostStatus,
  PostType,
  ReactiveValue,
  RouterApi,
  ToastApi,
} from "./types";

type MaybeRef<T> = { value: T };

type UsePostEditorActionsOptions = {
  authCanReview: MaybeRef<boolean>;
  effectivePostType: MaybeRef<PostType | undefined>;
  postId?: ReactiveValue<number | undefined>;
  form: PostEditorForm;
  reviewNote: MaybeRef<string>;
  loadingAction: MaybeRef<LoadingAction>;
  currentStatus: MaybeRef<PostStatus>;
  existingReviewNote: MaybeRef<string | null>;
  toast: ToastApi;
  router: RouterApi;
};

type SaveDraftOptions = {
  silent?: boolean;
  redirectAfterCreate?: boolean;
  manageLoading?: boolean;
};

type DraftResponse = {
  id: number;
  status: PostStatus;
};

export function usePostEditorActions(options: UsePostEditorActionsOptions) {
  const resolvedPostId = computed(() => toValue(options.postId));
  const posthog = usePostHog();

  async function saveDraft({
    silent = false,
    redirectAfterCreate = true,
    manageLoading = true,
  }: SaveDraftOptions = {}) {
    if (manageLoading) options.loadingAction.value = "save";

    const postId = resolvedPostId.value;
    try {
      const payload = buildPayload(options.form);
      const response = postId
        ? await $fetch<DraftResponse>(`/api/posts/${postId}`, {
            method: "PATCH",
            body: payload,
          })
        : await $fetch<DraftResponse>("/api/posts", {
            method: "POST",
            body: payload,
          });

      options.currentStatus.value = response.status;
      options.existingReviewNote.value = null;

      if (!postId && redirectAfterCreate) {
        await options.router.replace(getEditPath(options.effectivePostType.value, response.id));
      }

      if (!silent) {
        options.toast.add({
          title: "Draft disimpan",
          color: "success",
          icon: "i-ph-check",
        });
        posthog?.capture("post_draft_saved", {
          post_id: response.id,
          is_new: !postId,
          post_type: options.effectivePostType.value,
        });
      }

      return response.id;
    } catch (error: unknown) {
      posthog?.capture("post.save_failed", {
        post_id: postId,
        is_new: !postId,
        reason: errorMessage(error),
      });

      if (!silent) {
        options.toast.add({
          title: "Gagal menyimpan draft",
          description: errorMessage(error),
          color: "error",
          icon: "i-ph-warning-circle",
        });
      }

      return null;
    } finally {
      if (manageLoading) options.loadingAction.value = null;
    }
  }

  async function sendPost() {
    options.loadingAction.value = "send";

    try {
      const payload = buildPayload(options.form);
      const resolvedId = await resolveDraftId(payload);

      if (!resolvedId) return;

      if (options.authCanReview.value) {
        await $fetch(`/api/posts/${resolvedId}/publish`, {
          method: "POST",
          body: payload,
        });

        options.toast.add({
          title: "Artikel dipublish",
          color: "success",
          icon: "i-ph-check-circle",
        });
        await navigateTo(getListPath(options.effectivePostType.value));
        return;
      }

      const response = await $fetch<{ status: PostStatus }>(
        `/api/posts/${resolvedId}/submit`,
        { method: "POST", body: payload },
      );

      options.currentStatus.value = response.status;
      options.existingReviewNote.value = null;

      await refreshNuxtData("admin-layout-stats");

      options.toast.add({
        title: "Artikel dikirim untuk review",
        color: "success",
        icon: "i-ph-paper-plane-tilt",
      });
      await navigateTo("/dashboard/posts?status=pending_review");
    } catch (error: unknown) {
      posthog?.capture("post.save_failed", {
        post_id: resolvedPostId.value,
        is_new: false,
        action: "submit",
        reason: errorMessage(error),
      });
      options.toast.add({
        title: "Gagal mengirim artikel",
        description: errorMessage(error),
        color: "error",
        icon: "i-ph-warning-circle",
      });
    } finally {
      options.loadingAction.value = null;
    }
  }

  async function approve() {
    const postId = resolvedPostId.value;
    if (!postId) return;

    options.loadingAction.value = "approve";

    try {
      await $fetch(`/api/posts/${postId}/approve`, {
        method: "POST",
        body: buildPayload(options.form),
      });

      await refreshNuxtData("admin-layout-stats");

      options.toast.add({
        title: "Artikel dipublish",
        color: "success",
        icon: "i-ph-check-circle",
      });
      await navigateTo("/admin/pena-santri");
    } catch (error: unknown) {
      options.toast.add({
        title: "Gagal publish",
        description: errorMessage(error),
        color: "error",
        icon: "i-ph-x-circle",
      });
    } finally {
      options.loadingAction.value = null;
    }
  }

  async function reject() {
    const postId = resolvedPostId.value;
    if (!postId) return;

    if (!options.reviewNote.value.trim()) {
      options.toast.add({
        title: "Catatan review wajib diisi",
        color: "warning",
        icon: "i-ph-warning",
      });
      return;
    }

    options.loadingAction.value = "reject";

    try {
      await $fetch(`/api/posts/${postId}/reject`, {
        method: "POST",
        body: {
          reviewNote: options.reviewNote.value,
          ...buildPayload(options.form),
        },
      });

      await refreshNuxtData("admin-layout-stats");

      options.toast.add({
        title: "Artikel ditolak",
        color: "warning",
        icon: "i-ph-x-circle",
      });
      await navigateTo("/admin/pena-santri");
    } catch (error: unknown) {
      options.toast.add({
        title: "Gagal menolak",
        description: errorMessage(error),
        color: "error",
        icon: "i-ph-x-circle",
      });
    } finally {
      options.loadingAction.value = null;
    }
  }

  async function resolveDraftId(payload: ReturnType<typeof buildPayload>) {
    const postId = resolvedPostId.value;
    if (postId) return postId;

    return saveDraft({
      silent: true,
      redirectAfterCreate: false,
      manageLoading: false,
    });
  }

  return {
    saveDraft,
    sendPost,
    approve,
    reject,
  };
}

function buildPayload(form: PostEditorForm) {
  return {
    title: form.title.trim(),
    content: form.content,
    excerpt: form.excerpt.trim() || null,
    categoryId: form.categoryId ?? null,
    featuredImage: form.featuredImage,
  };
}

function getEditPath(type: PostType | undefined, id: number) {
  if (type === "berita") return `/admin/berita/${id}/edit`;
  if (type === "pena_santri") return `/dashboard/posts/${id}/edit`;
  return `/dashboard/posts/${id}/edit`;
}

function getListPath(type: PostType | undefined) {
  return type === "berita" ? "/admin/berita" : "/admin/pena-santri";
}

function errorMessage(error: unknown) {
  return (
    (error as { data?: { message?: string } }).data?.message ??
    (error as Error).message ??
    "Terjadi kesalahan."
  );
}
