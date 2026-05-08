import { computed, watch } from "vue";

import type {
  EditorPost,
  PostEditorForm,
  PostEditorStateRefs,
  PostType,
  ToastApi,
} from "./types";

type UsePostEditorContextOptions = {
  postId?: number;
  postType?: PostType;
  form: PostEditorForm;
  state: Pick<
    PostEditorStateRefs,
    "currentStatus" | "existingReviewNote" | "reviewerName"
  >;
  toast: ToastApi;
};

type CategoryItem = {
  id: number;
  name: string;
  type: string;
};

export function usePostEditorContext(options: UsePostEditorContextOptions) {
  const auth = useAuth();

  const { data: categoriesRaw } = useAsyncData<CategoryItem[]>(
    "post-editor-categories",
    async () => {
      if (auth.canReview.value) {
        const response = await $fetch<{ data: CategoryItem[] }>("/api/categories");
        return response.data;
      }

      const response = await $fetch<{ categories: CategoryItem[] }>(
        "/api/posts/meta",
      );
      return response.categories;
    },
    { default: () => [] as CategoryItem[] },
  );

  const { data: postData, status: postStatus } = useAsyncData<EditorPost | null>(
    `post-editor-${options.postId ?? "new"}`,
    () => {
      if (!options.postId) return Promise.resolve(null);

      return $fetch<{ data: EditorPost }>(`/api/posts/${options.postId}`).then(
        (response) => response.data,
      );
    },
    { lazy: true, immediate: !!options.postId, default: () => null },
  );

  const effectivePostType = computed<PostType | undefined>(
    () =>
      options.postType ??
      postData.value?.category?.type ??
      (auth.canReview.value ? undefined : "pena_santri"),
  );

  const isOwnPost = computed(() => {
    if (!auth.canReview.value) return true;
    return auth.user.value?.id === postData.value?.author?.id;
  });

  const showBeritaActions = computed(
    () => auth.canReview.value && effectivePostType.value === "berita",
  );

  const showReviewActions = computed(
    () =>
      auth.canReview.value &&
      !!options.postId &&
      !isOwnPost.value &&
      effectivePostType.value === "pena_santri",
  );

  watch(
    postData,
    (post) => {
      if (!post) return;

      options.form.title = post.title;
      options.form.content = post.content;
      options.form.excerpt = post.excerpt ?? "";
      options.form.categoryId = post.categoryId ?? undefined;
      options.form.featuredImage = post.featuredImage;
      options.state.currentStatus.value = post.status;
      options.state.existingReviewNote.value = post.reviewNote;
      options.state.reviewerName.value = post.reviewer?.name ?? null;

      if (
        !auth.canReview.value &&
        post.status === "pending_review" &&
        import.meta.client
      ) {
        options.toast.add({
          title: "Artikel sedang direview",
          description:
            "Artikel yang berstatus menunggu review tidak bisa diedit.",
          color: "warning",
          icon: "i-ph-clock",
        });
        void navigateTo("/dashboard/posts?status=pending_review", {
          replace: true,
        });
      }
    },
    { immediate: true },
  );

  return {
    auth,
    categoriesRaw,
    postData,
    postStatus,
    effectivePostType,
    isOwnPost,
    showBeritaActions,
    showReviewActions,
  };
}
