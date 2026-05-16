import { computed, toValue, watch } from "vue";

import type {
  EditorPost,
  PostEditorForm,
  PostEditorStateRefs,
  ReactiveValue,
  PostType,
  ToastApi,
} from "./types";

type UsePostEditorContextOptions = {
  postId?: ReactiveValue<number | undefined>;
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

export function shouldUseAdminCategorySource(isAdmin: boolean) {
  return isAdmin;
}

export function usePostEditorContext(options: UsePostEditorContextOptions) {
  const auth = useAuth();
  const requestFetch = useRequestFetch();
  const resolvedPostId = computed(() => toValue(options.postId));
  const categoriesAsync = useAsyncData<CategoryItem[]>(
    "post-editor-categories",
    async () => {
      if (shouldUseAdminCategorySource(auth.isAdmin.value)) {
        const response = await requestFetch<{ data: CategoryItem[] }>(
          "/api/categories",
        );
        return response.data;
      }

      const response = await requestFetch<{ categories: CategoryItem[] }>(
        "/api/posts/meta",
      );
      return response.categories;
    },
    { default: () => [] as CategoryItem[] },
  );

  const shouldFetchPost = computed(
    () => resolvedPostId.value !== undefined,
  );

  const postDataKey = computed(() =>
    shouldFetchPost.value ? `post-editor-${resolvedPostId.value}` : "post-editor-idle",
  );

  const postAsync = useAsyncData<EditorPost | null>(
    postDataKey,
    async () => {
      const postId = resolvedPostId.value;
      if (!postId) {
        throw createError({
          statusCode: 400,
          message: "Id post tidak ditemukan.",
        });
      }

      const response = await requestFetch<{ data: EditorPost }>(
        `/api/posts/${postId}`,
      );
      return response.data;
    },
    {
      immediate: shouldFetchPost.value,
      default: () => null,
      watch: [resolvedPostId],
    },
  );

  const { data: categoriesRaw } = categoriesAsync;
  const { data: postData, status: postStatus } = postAsync;

  function populateForm(post: EditorPost | null) {
    if (!post) return;

    options.form.title = post.title;
    options.form.content = post.content;
    options.form.excerpt = post.excerpt ?? "";
    options.form.categoryId = post.categoryId ?? undefined;
    options.form.featuredImage = post.featuredImage;
    options.state.currentStatus.value = post.status;
    options.state.existingReviewNote.value = post.reviewNote;
    options.state.reviewerName.value = post.reviewer?.fullname ?? null;
  }

  populateForm(postData.value);
  watch(postData, populateForm);

  const effectivePostType = computed<PostType | undefined>(
    () =>
      options.postType ??
      postData.value?.category?.type ??
      (auth.canReview.value ? undefined : "pena_santri"),
  );

  const isOwnPost = computed(() => {
    if (!auth.canReview.value) return true;
    const authorId = postData.value?.author?.id;
    const userId = auth.user.value?.id;
    if (authorId == null || userId == null) return true;
    return userId === authorId;
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

  const ready = Promise.all([categoriesAsync, postAsync]).then(() => {
    populateForm(postData.value);
  });

  return {
    auth,
    categoriesRaw,
    postData,
    postStatus,
    effectivePostType,
    isOwnPost,
    showBeritaActions,
    showReviewActions,
    ready,
  };
}
