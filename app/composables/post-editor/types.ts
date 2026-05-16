import type { ComputedRef, MaybeRefOrGetter, Ref } from "vue";

export type PostType = "berita" | "pena_santri";
export type PostStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "rejected";
export type LoadingAction = "save" | "send" | "approve" | "reject" | null;

export type RichTextEditor = {
  chain: () => {
    focus: () => {
      run?: () => boolean;
      setImage: (attrs: { alt?: string; src: string }) => {
        run: () => boolean;
      };
    };
  };
  isActive: (name: string) => boolean;
  isEditable: boolean;
};

export type EditorPost = {
  id: number;
  title: string;
  content: string;
  excerpt: string | null;
  featuredImage: string | null;
  categoryId: number | null;
  status: PostStatus;
  reviewNote: string | null;
  author?: { id: number; fullname: string; email: string };
  reviewer?: { id: number; fullname: string } | null;
  category?: {
    id: number;
    name: string;
    type: PostType;
  } | null;
};

export type CategoryItem = {
  id: number;
  name: string;
  type: PostType | (string & {});
};

export type CategoryOption = {
  label: string;
  value: number;
};

export type ReactiveValue<T> = MaybeRefOrGetter<T>;

export type PostEditorForm = {
  title: string;
  content: string;
  excerpt: string;
  categoryId: number | undefined;
  featuredImage: string | null;
};

export type ToastApi = ReturnType<typeof useToast>;

export type RouterApi = {
  replace: (path: string) => Promise<unknown> | unknown;
};

export type PostEditorStateRefs = {
  currentStatus: Ref<PostStatus>;
  existingReviewNote: Ref<string | null>;
  reviewerName: Ref<string | null>;
  reviewNote: Ref<string>;
  loadingAction: Ref<LoadingAction>;
};

export type PostEditorModeRefs = {
  effectivePostType: ComputedRef<PostType | undefined>;
  showBeritaActions: ComputedRef<boolean>;
  showReviewActions: ComputedRef<boolean>;
};
