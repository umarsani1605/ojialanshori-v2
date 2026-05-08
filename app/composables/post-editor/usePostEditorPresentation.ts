import { computed, watch } from "vue";

import type {
  CategoryItem,
  CategoryOption,
  PostEditorForm,
  PostStatus,
  PostType,
} from "./types";

type MaybeRef<T> = { value: T };

type UsePostEditorPresentationOptions = {
  categoriesRaw: MaybeRef<CategoryItem[] | null | undefined>;
  effectivePostType: MaybeRef<PostType | undefined>;
  currentStatus: MaybeRef<PostStatus>;
  form: PostEditorForm;
  showBeritaActions: MaybeRef<boolean>;
  showReviewActions: MaybeRef<boolean>;
};

export function usePostEditorPresentation(
  options: UsePostEditorPresentationOptions,
) {
  const categories = computed<CategoryOption[]>(() => {
    const all = options.categoriesRaw.value ?? [];
    const filtered = options.effectivePostType.value
      ? all.filter((category) => category.type === options.effectivePostType.value)
      : all;

    return filtered.map((category) => ({
      label: category.name,
      value: category.id,
    }));
  });

  watch(
    [() => options.categoriesRaw.value, () => options.effectivePostType.value],
    ([categoriesList, type]) => {
      if (type !== "berita" || !categoriesList?.length) return;

      const beritaCategory = categoriesList.find(
        (category) => category.type === "berita",
      );

      if (beritaCategory && !options.form.categoryId) {
        options.form.categoryId = beritaCategory.id;
      }
    },
    { immediate: true },
  );

  const canSubmit = computed(() => {
    if (options.effectivePostType.value === "berita") {
      return Boolean(options.form.featuredImage);
    }

    return Boolean(
      options.form.featuredImage && options.form.categoryId !== undefined,
    );
  });

  const statusLabel = computed(
    () =>
      ({
        draft: "Draft",
        pending_review: "Dalam Ulasan",
        rejected: "Ditolak",
        published: "Terbit",
      })[options.currentStatus.value],
  );

  const statusColor = computed(
    () =>
      ({
        draft: "neutral",
        pending_review: "warning",
        rejected: "error",
        published: "success",
      })[options.currentStatus.value] as "neutral" | "warning" | "error" | "success",
  );

  const backTo = computed(() => {
    if (
      options.showReviewActions.value ||
      options.effectivePostType.value === "pena_santri"
    ) {
      return "/admin/pena-santri";
    }

    if (
      options.showBeritaActions.value ||
      options.effectivePostType.value === "berita"
    ) {
      return "/admin/berita";
    }

    return "/dashboard/posts";
  });

  return {
    categories,
    canSubmit,
    statusLabel,
    statusColor,
    backTo,
  };
}
