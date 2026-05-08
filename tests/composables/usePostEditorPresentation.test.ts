import { computed, reactive, ref } from "vue";
import { describe, expect, it } from "vitest";

import { usePostEditorPresentation } from "../../app/composables/post-editor/usePostEditorPresentation";

describe("usePostEditorPresentation", () => {
  it("filters categories to the effective post type and keeps plain labels", () => {
    const categoriesRaw = ref([
      { id: 1, name: "Berita Utama", type: "berita" as const },
      { id: 2, name: "Opini", type: "pena_santri" as const },
      { id: 3, name: "Puisi", type: "pena_santri" as const },
    ]);

    const form = reactive({
      categoryId: undefined as number | undefined,
      featuredImage: null as string | null,
    });

    const presentation = usePostEditorPresentation({
      categoriesRaw,
      effectivePostType: computed(() => "pena_santri" as const),
      currentStatus: ref("draft" as const),
      form,
      showBeritaActions: computed(() => false),
      showReviewActions: computed(() => false),
    });

    expect(presentation.categories.value).toEqual([
      { label: "Opini", value: 2 },
      { label: "Puisi", value: 3 },
    ]);
    expect(presentation.backTo.value).toBe("/admin/pena-santri");
    expect(presentation.canSubmit.value).toBe(false);
  });

  it("auto-assigns the berita category and uses the berita back path", () => {
    const categoriesRaw = ref([
      { id: 9, name: "Berita Utama", type: "berita" as const },
      { id: 3, name: "Puisi", type: "pena_santri" as const },
    ]);

    const form = reactive({
      categoryId: undefined as number | undefined,
      featuredImage: "/cover.jpg" as string | null,
    });

    const presentation = usePostEditorPresentation({
      categoriesRaw,
      effectivePostType: computed(() => "berita" as const),
      currentStatus: ref("published" as const),
      form,
      showBeritaActions: computed(() => true),
      showReviewActions: computed(() => false),
    });

    expect(form.categoryId).toBe(9);
    expect(presentation.canSubmit.value).toBe(true);
    expect(presentation.statusLabel.value).toBe("Terbit");
    expect(presentation.statusColor.value).toBe("success");
    expect(presentation.backTo.value).toBe("/admin/berita");
  });
});
