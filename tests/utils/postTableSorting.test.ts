import { describe, expect, it } from "vitest";

import type { AdminPost } from "~~/shared/types";
import {
  DEFAULT_POST_TABLE_SORTING,
  getPostColumnSortState,
  sortAdminPosts,
  togglePostColumnSorting,
} from "~/utils/postTableSorting";

function makePost(overrides: Partial<AdminPost>): AdminPost {
  return {
    id: 1,
    title: "Untitled",
    slug: "untitled",
    featuredImage: null,
    status: "draft",
    updatedAt: "2026-05-10T10:00:00.000Z",
    publishedAt: null,
    author: {
      id: 1,
      fullname: "Zaki",
    },
    category: null,
    ...overrides,
  };
}

describe("sortAdminPosts", () => {
  it("mengikuti urutan status default lalu updatedAt desc", () => {
    const posts = [
      makePost({ id: 1, status: "published", updatedAt: "2026-05-10T10:00:00.000Z" }),
      makePost({ id: 2, status: "pending_review", updatedAt: "2026-05-09T10:00:00.000Z" }),
      makePost({ id: 3, status: "pending_review", updatedAt: "2026-05-11T10:00:00.000Z" }),
      makePost({ id: 4, status: "draft", updatedAt: "2026-05-12T10:00:00.000Z" }),
    ];

    expect(sortAdminPosts(posts).map((post) => post.id)).toEqual([3, 2, 4, 1]);
  });

  it("bisa sort berdasarkan judul", () => {
    const posts = [
      makePost({ id: 1, title: "Zeta" }),
      makePost({ id: 2, title: "Alpha" }),
    ];

    expect(
      sortAdminPosts(posts, [{ id: "title", desc: false }]).map((post) => post.id),
    ).toEqual([2, 1]);
  });

  it("bisa sort berdasarkan penulis", () => {
    const posts = [
      makePost({ id: 1, author: { id: 1, fullname: "Zaki" } }),
      makePost({ id: 2, author: { id: 2, fullname: "Ahmad" } }),
    ];

    expect(
      sortAdminPosts(posts, [{ id: "author", desc: false }]).map((post) => post.id),
    ).toEqual([2, 1]);
  });
});

describe("togglePostColumnSorting", () => {
  it("memakai default sorting awal", () => {
    expect(DEFAULT_POST_TABLE_SORTING).toEqual([
      { id: "status", desc: false },
      { id: "updatedAt", desc: true },
    ]);
  });

  it("mengubah kolom nonaktif menjadi aktif dengan arah awal yang sesuai", () => {
    expect(togglePostColumnSorting(DEFAULT_POST_TABLE_SORTING, "title")).toEqual([
      { id: "title", desc: false },
    ]);
    expect(
      togglePostColumnSorting(DEFAULT_POST_TABLE_SORTING, "updatedAt"),
    ).toEqual([{ id: "updatedAt", desc: true }]);
  });

  it("toggle asc ke desc lalu kembali ke default", () => {
    const asc = [{ id: "title", desc: false }];
    const desc = [{ id: "title", desc: true }];

    expect(togglePostColumnSorting(asc, "title")).toEqual(desc);
    expect(togglePostColumnSorting(desc, "title")).toEqual(
      DEFAULT_POST_TABLE_SORTING,
    );
  });

  it("mendeteksi status sort aktif pada primary column saja", () => {
    expect(getPostColumnSortState(DEFAULT_POST_TABLE_SORTING, "status")).toBe(
      "asc",
    );
    expect(
      getPostColumnSortState(DEFAULT_POST_TABLE_SORTING, "updatedAt"),
    ).toBe(false);
  });
});
