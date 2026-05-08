import { computed, reactive, ref } from "vue";
import { mockNuxtImport } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { usePostEditorActions } from "../../app/composables/post-editor/usePostEditorActions";

const { mockNavigateTo } = vi.hoisted(() => ({
  mockNavigateTo: vi.fn<(path: string) => Promise<void>>(),
}));

const mockFetch = vi.fn<(url: string, options?: { method?: string; body?: unknown }) => Promise<unknown>>();

mockNuxtImport("navigateTo", () => mockNavigateTo);

vi.stubGlobal("$fetch", mockFetch);

describe("usePostEditorActions", () => {
  const toast = { add: vi.fn() };
  const router = { replace: vi.fn() };

  beforeEach(() => {
    mockFetch.mockReset();
    mockNavigateTo.mockReset();
    toast.add.mockReset();
    router.replace.mockReset();
  });

  it("creates a draft and redirects new santri posts to the dashboard edit path", async () => {
    mockFetch.mockResolvedValueOnce({ id: 77, status: "draft" });

    const state = createBaseState();
    const actions = usePostEditorActions({
      authCanReview: computed(() => false),
      effectivePostType: computed(() => "pena_santri" as const),
      postId: undefined,
      form: state.form,
      reviewNote: state.reviewNote,
      loadingAction: state.loadingAction,
      currentStatus: state.currentStatus,
      existingReviewNote: state.existingReviewNote,
      toast,
      router,
    });

    const id = await actions.saveDraft();

    expect(id).toBe(77);
    expect(mockFetch).toHaveBeenCalledWith("/api/posts", {
      method: "POST",
      body: {
        title: "Judul Draft",
        content: "<p>isi</p>",
        excerpt: "Ringkasan",
        categoryId: 4,
        featuredImage: "/cover.jpg",
      },
    });
    expect(router.replace).toHaveBeenCalledWith("/dashboard/posts/77/edit");
  });

  it("requires a review note before rejecting a post", async () => {
    const state = createBaseState();
    state.reviewNote.value = "   ";

    const actions = usePostEditorActions({
      authCanReview: computed(() => true),
      effectivePostType: computed(() => "pena_santri" as const),
      postId: 21,
      form: state.form,
      reviewNote: state.reviewNote,
      loadingAction: state.loadingAction,
      currentStatus: state.currentStatus,
      existingReviewNote: state.existingReviewNote,
      toast,
      router,
    });

    await actions.reject();

    expect(mockFetch).not.toHaveBeenCalled();
    expect(toast.add).toHaveBeenCalledWith(
      expect.objectContaining({
        title: "Catatan review wajib diisi",
        color: "warning",
      }),
    );
  });

  it("publishes directly for reviewer-capable users and navigates to the berita list", async () => {
    mockFetch
      .mockResolvedValueOnce({ id: 30, status: "draft" })
      .mockResolvedValueOnce({});

    const state = createBaseState();
    const actions = usePostEditorActions({
      authCanReview: computed(() => true),
      effectivePostType: computed(() => "berita" as const),
      postId: undefined,
      form: state.form,
      reviewNote: state.reviewNote,
      loadingAction: state.loadingAction,
      currentStatus: state.currentStatus,
      existingReviewNote: state.existingReviewNote,
      toast,
      router,
    });

    await actions.sendPost();

    expect(mockFetch.mock.calls).toEqual([
      [
        "/api/posts",
        {
          method: "POST",
          body: {
            title: "Judul Draft",
            content: "<p>isi</p>",
            excerpt: "Ringkasan",
            categoryId: 4,
            featuredImage: "/cover.jpg",
          },
        },
      ],
      [
        "/api/posts/30/publish",
        {
          method: "POST",
          body: {
            title: "Judul Draft",
            content: "<p>isi</p>",
            excerpt: "Ringkasan",
            categoryId: 4,
            featuredImage: "/cover.jpg",
          },
        },
      ],
    ]);
    expect(mockNavigateTo).toHaveBeenCalledWith("/admin/berita");
  });
});

function createBaseState() {
  return {
    form: reactive({
      title: " Judul Draft ",
      content: "<p>isi</p>",
      excerpt: " Ringkasan ",
      categoryId: 4,
      featuredImage: "/cover.jpg" as string | null,
    }),
    reviewNote: ref("Perlu revisi judul"),
    loadingAction: ref<"save" | "send" | "approve" | "reject" | null>(null),
    currentStatus: ref<"draft" | "pending_review" | "published" | "rejected">("draft"),
    existingReviewNote: ref<string | null>(null),
  };
}
