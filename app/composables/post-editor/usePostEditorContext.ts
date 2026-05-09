import { computed, ref, toValue, watch } from "vue";

import type {
  EditorPost,
  PostDataSource,
  PostEditorForm,
  PostEditorStateRefs,
  ReactiveValue,
  PostType,
  ToastApi,
} from "./types";

type UsePostEditorContextOptions = {
  postId?: ReactiveValue<number | undefined>;
  postType?: PostType;
  initialPost?: PostDataSource;
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
  const resolvedPostId = computed(() => toValue(options.postId));
  const { data: categoriesRaw } = useAsyncData<CategoryItem[]>(
    "post-editor-categories",
    async () => {
      if (auth.canReview.value) {
        const response = await $fetch<{ data: CategoryItem[] }>(
          "/api/categories",
        );
        return response.data;
      }

      const response = await $fetch<{ categories: CategoryItem[] }>(
        "/api/posts/meta",
      );
      return response.categories;
    },
    { default: () => [] as CategoryItem[] },
  );

  const postData = ref<EditorPost | null>(options.initialPost ?? null);
  const postStatus = ref<"idle" | "pending" | "success" | "error">(
    options.initialPost === undefined ? "idle" : "success",
  );

  if (options.initialPost === undefined) {
    const postDataKey = computed(
      () => `post-editor-${resolvedPostId.value ?? "new"}`,
    );

    const { data, status } = useAsyncData<EditorPost | null>(
      postDataKey,
      async () => {
        const postId = resolvedPostId.value;
        if (!postId) return null;

        const response = await $fetch<{ data: EditorPost }>(
          `/api/posts/${postId}`,
        );
        return response.data;
      },
      {
        immediate: resolvedPostId.value !== undefined,
        default: () => null,
        watch: [resolvedPostId],
      },
    );

    watch(
      data,
      (post) => {
        postData.value = post ?? null;
      },
      { immediate: true },
    );

    watch(
      status,
      (value) => {
        postStatus.value = value;
      },
      { immediate: true },
    );
  }

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
      !!resolvedPostId.value &&
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
      options.state.reviewerName.value = post.reviewer?.fullname ?? null;
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
