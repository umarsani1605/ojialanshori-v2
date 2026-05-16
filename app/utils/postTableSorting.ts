import type { AdminPost, PostStatus } from "~~/shared/types";

export type TableSortState = Array<{
  id: string;
  desc: boolean;
}>;

export type PostSortKey =
  | "title"
  | "author"
  | "status"
  | "updatedAt"
  | "category";

const POST_STATUS_SORT_ORDER: Record<PostStatus, number> = {
  pending_review: 0,
  rejected: 1,
  draft: 2,
  published: 3,
};

const INITIAL_SORT_DIRECTION: Record<PostSortKey, boolean> = {
  title: false,
  author: false,
  status: false,
  updatedAt: true,
  category: false,
};

export const DEFAULT_POST_TABLE_SORTING: TableSortState = [
  { id: "status", desc: false },
  { id: "updatedAt", desc: true },
];

function compareStrings(a: string, b: string) {
  return a.localeCompare(b, "id", { sensitivity: "base", numeric: true });
}

function compareNumbers(a: number, b: number) {
  if (a === b) return 0;
  return a < b ? -1 : 1;
}

function getPostSortValue(post: AdminPost, key: string) {
  switch (key) {
    case "title":
      return post.title;
    case "author":
      return post.author.fullname;
    case "status":
      return POST_STATUS_SORT_ORDER[post.status];
    case "updatedAt":
      return new Date(post.updatedAt).getTime();
    case "category":
      return post.category?.name ?? "";
    default:
      return "";
  }
}

function comparePostRows(a: AdminPost, b: AdminPost, key: string) {
  const left = getPostSortValue(a, key);
  const right = getPostSortValue(b, key);

  if (typeof left === "number" && typeof right === "number") {
    return compareNumbers(left, right);
  }

  return compareStrings(String(left), String(right));
}

export function sortAdminPosts(
  posts: AdminPost[],
  sorting: TableSortState = DEFAULT_POST_TABLE_SORTING,
) {
  const activeSorting =
    sorting.length > 0 ? sorting : DEFAULT_POST_TABLE_SORTING;

  return [...posts].sort((a, b) => {
    for (const sort of activeSorting) {
      const result = comparePostRows(a, b, sort.id);
      if (result !== 0) {
        return sort.desc ? -result : result;
      }
    }

    return 0;
  });
}

export function getPostColumnSortState(
  sorting: TableSortState,
  key: PostSortKey,
) {
  const active = sorting[0];
  if (!active || active.id !== key) return false;
  return active.desc ? "desc" : "asc";
}

export function togglePostColumnSorting(
  sorting: TableSortState,
  key: PostSortKey,
): TableSortState {
  const active = sorting[0];

  if (!active || active.id !== key) {
    return [{ id: key, desc: INITIAL_SORT_DIRECTION[key] }];
  }

  if (!active.desc) {
    return [{ id: key, desc: true }];
  }

  return [...DEFAULT_POST_TABLE_SORTING];
}
