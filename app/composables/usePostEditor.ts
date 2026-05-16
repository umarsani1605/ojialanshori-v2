import { reactive, ref, watch } from "vue";
import Emoji from "@tiptap/extension-emoji";
import TextAlign from "@tiptap/extension-text-align";

import { editorEmojiItems } from "~/utils/editorEmoji";

import { usePostEditorActions } from "./post-editor/usePostEditorActions";
import { usePostEditorContext } from "./post-editor/usePostEditorContext";
import { usePostEditorMetrics } from "./post-editor/usePostEditorMetrics";
import { usePostEditorPresentation } from "./post-editor/usePostEditorPresentation";
import type {
  LoadingAction,
  PostEditorForm,
  PostStatus,
  ReactiveValue,
  PostType,
} from "./post-editor/types";
import { usePostEditorUploads } from "./post-editor/usePostEditorUploads";

export async function usePostEditor(opts: {
  postId?: ReactiveValue<number | undefined>;
  postType?: PostType;
}) {
  const toast = useToast();
  const router = useRouter();

  const form = reactive<PostEditorForm>({
    title: "",
    content: "",
    excerpt: "",
    categoryId: undefined,
    featuredImage: null,
  });

  const currentStatus = ref<PostStatus>("draft");
  const existingReviewNote = ref<string | null>(null);
  const reviewerName = ref<string | null>(null);
  const reviewNote = ref("");
  const loadingAction = ref<LoadingAction>(null);
  const uploadingEditorImage = ref(false);
  const coverInputKey = ref(0);
  const coverFile = ref<File | null>(null);

  const isInitializingCover = ref(false);

  async function initCoverFile(imageUrl: string | null) {
    if (!imageUrl) return;
    if (import.meta.server) return;
    try {
      isInitializingCover.value = true;
      const res = await fetch(imageUrl);
      const blob = await res.blob();
      const filename = imageUrl.split("/").pop()?.split("?")[0] ?? "cover.jpg";
      coverFile.value = new File([blob], filename, { type: blob.type });
    } catch {
      // ignore
    } finally {
      setTimeout(() => {
        isInitializingCover.value = false;
      }, 50);
    }
  }

  const context = usePostEditorContext({
    postId: opts.postId,
    postType: opts.postType,
    form,
    state: {
      currentStatus,
      existingReviewNote,
      reviewerName,
    },
    toast,
  });

  watch(
    () => context.postData.value?.featuredImage,
    (url) => {
      void initCoverFile(url ?? null);
    },
    { immediate: true },
  );

  const presentation = usePostEditorPresentation({
    categoriesRaw: context.categoriesRaw,
    effectivePostType: context.effectivePostType,
    currentStatus,
    form,
    showBeritaActions: context.showBeritaActions,
    showReviewActions: context.showReviewActions,
  });

  const metrics = usePostEditorMetrics(form);

  const uploads = usePostEditorUploads({
    form,
    coverInputKey,
    coverFile,
    uploadingEditorImage,
    toast,
  });

  watch(coverFile, (file) => {
    if (isInitializingCover.value) return;
    void uploads.handleCoverChange(file);
  });

  const actions = usePostEditorActions({
    authCanReview: context.auth.canReview,
    effectivePostType: context.effectivePostType,
    postId: opts.postId,
    form,
    reviewNote,
    loadingAction,
    currentStatus,
    existingReviewNote,
    toast,
    router,
  });

  const editorExtensions = [
    Emoji,
    TextAlign.configure({ types: ["heading", "paragraph"] }),
  ];

  if (import.meta.server) {
    await context.ready;
  }

  return {
    form,
    currentStatus,
    postStatus: context.postStatus,
    existingReviewNote,
    reviewerName,
    reviewNote,
    loadingAction,
    uploadingEditorImage,
    coverFile,
    coverInputKey,
    categories: presentation.categories,
    effectivePostType: context.effectivePostType,
    canSubmit: presentation.canSubmit,
    titleCount: metrics.titleCount,
    wordCount: metrics.wordCount,
    readingTime: metrics.readingTime,
    statusLabel: presentation.statusLabel,
    statusColor: presentation.statusColor,
    showBeritaActions: context.showBeritaActions,
    showReviewActions: context.showReviewActions,
    isOwnPost: context.isOwnPost,
    backTo: presentation.backTo,
    editorExtensions,
    editorEmojiItems,
    handleCoverChange: uploads.handleCoverChange,
    promptEditorImageUpload: uploads.promptEditorImageUpload,
    saveDraft: actions.saveDraft,
    sendPost: actions.sendPost,
    approve: actions.approve,
    reject: actions.reject,
  };
}
