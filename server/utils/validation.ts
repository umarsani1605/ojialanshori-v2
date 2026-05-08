import { createError } from "h3";

import type {
  CategoryType,
  PageStatus,
  PostStatus,
  Role,
} from "#server/db/schema";
import { parseSantriPostPayload } from "#server/utils/santriPostEditor";

const VALID_ROLES: Role[] = ["admin", "reviewer", "santri"];
const VALID_PUBLIC_POST_TYPES = ["berita", "pena_santri"] as const;
const VALID_SANTRI_POST_STATUSES = [
  "draft",
  "pending_review",
  "published",
  "rejected",
] as const satisfies PostStatus[];
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type UserUpdateInput = {
  email?: string;
  isActive?: boolean;
  fullname?: string;
  nickname?: string | null;
  bio?: string | null;
  avatar?: string | null;
  faculty?: string | null;
  major?: string | null;
  phone?: string | null;
  role?: Role;
  university?: string | null;
  yearStudy?: number | null;
  yearEnrolled?: number | null;
};

type UserFiltersInput = {
  role?: Role;
  status?: "active" | "inactive";
  search?: string;
  phone?: string;
  university?: string;
  yearEnrolled?: number;
  yearStudy?: number;
};

type RegisterSantriInput = {
  fullname: string;
  email: string;
  password: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function getSingleValue(value: unknown) {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function getOptionalString(value: unknown) {
  const singleValue = getSingleValue(value);

  if (typeof singleValue !== "string") {
    return undefined;
  }

  const normalized = singleValue.trim();
  return normalized.length > 0 ? normalized : undefined;
}

function getPositiveInteger(
  value: unknown,
  fallback: number,
  { min = 1, max = Number.MAX_SAFE_INTEGER } = {},
) {
  const singleValue = getSingleValue(value);
  const parsed =
    typeof singleValue === "number" ? singleValue : Number(singleValue);

  if (!Number.isFinite(parsed)) {
    return fallback;
  }

  return Math.min(max, Math.max(min, Math.trunc(parsed)));
}

function getRequiredRecord(value: unknown, message = "Payload tidak valid.") {
  if (!isRecord(value)) {
    throw createError({ statusCode: 400, message });
  }

  return value;
}

export function validateRouteIdParams(value: unknown) {
  const params = getRequiredRecord(value, "Parameter route tidak valid.");
  const rawId = getSingleValue(params.id);
  const id = typeof rawId === "number" ? rawId : Number(rawId);

  return { id };
}

export function validateSlugParams(value: unknown) {
  const params = getRequiredRecord(value, "Parameter route tidak valid.");
  const slug = getOptionalString(params.slug);

  if (!slug) {
    throw createError({ statusCode: 400, message: "Slug diperlukan." });
  }

  return { slug };
}

export function validatePublicPostsQuery(value: unknown) {
  const query = getRequiredRecord(value, "Query tidak valid.");
  const type = getOptionalString(query.type);

  if (
    !type ||
    !VALID_PUBLIC_POST_TYPES.includes(
      type as (typeof VALID_PUBLIC_POST_TYPES)[number],
    )
  ) {
    throw createError({
      statusCode: 400,
      statusMessage:
        'Query parameter "type" must be "berita" or "pena_santri".',
    });
  }

  return {
    type: type as CategoryType,
    category: getOptionalString(query.category),
    subcategory: getOptionalString(query.subcategory),
    author: getOptionalString(query.author),
    page: getPositiveInteger(query.page, 1),
    limit: getPositiveInteger(query.limit, 9),
  };
}

export function validateDashboardUserCreateBody(value: unknown) {
  const body = getRequiredRecord(value);
  const fullname = getOptionalString(body.fullname);
  const nickname = getOptionalString(body.nickname) ?? null;
  const bio = getOptionalString(body.bio) ?? null;
  const email = getOptionalString(body.email)?.toLowerCase();
  const role = getOptionalString(body.role);
  const password = getOptionalString(body.password);
  const avatar = getOptionalString(body.avatar) ?? null;
  const phone = getOptionalString(body.phone) ?? null;
  const university = getOptionalString(body.university) ?? null;
  const faculty = getOptionalString(body.faculty) ?? null;
  const major = getOptionalString(body.major) ?? null;
  const isActive = "isActive" in body ? body.isActive === true : true;

  if (!fullname || !email || !role || !password) {
    throw createError({ statusCode: 400, message: "Semua field wajib diisi." });
  }

  if (!EMAIL_REGEX.test(email)) {
    throw createError({
      statusCode: 400,
      message: "Format email tidak valid.",
    });
  }

  if (!VALID_ROLES.includes(role as Role)) {
    throw createError({ statusCode: 400, message: "Role tidak valid." });
  }

  if (password.length < 8) {
    throw createError({
      statusCode: 400,
      message: "Password minimal 8 karakter.",
    });
  }

  let yearEnrolled: number | null = null;
  if (
    "yearEnrolled" in body &&
    body.yearEnrolled !== null &&
    body.yearEnrolled !== undefined &&
    body.yearEnrolled !== ""
  ) {
    const raw = getSingleValue(body.yearEnrolled);
    const parsed = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isInteger(parsed) || parsed < 1901 || parsed > 2155) {
      throw createError({
        statusCode: 400,
        message: "Angkatan Oji tidak valid.",
      });
    }
    yearEnrolled = parsed;
  }

  let yearStudy: number | null = null;
  if (
    "yearStudy" in body &&
    body.yearStudy !== null &&
    body.yearStudy !== undefined &&
    body.yearStudy !== ""
  ) {
    const raw = getSingleValue(body.yearStudy);
    const parsed = typeof raw === "number" ? raw : Number(raw);
    if (!Number.isInteger(parsed) || parsed < 1901 || parsed > 2155) {
      throw createError({
        statusCode: 400,
        message: "Angkatan kuliah tidak valid.",
      });
    }
    yearStudy = parsed;
  }

  return {
    fullname,
    nickname,
    bio,
    email,
    role: role as Role,
    password,
    avatar,
    phone,
    university,
    faculty,
    major,
    yearEnrolled,
    yearStudy,
    isActive,
  };
}

export function validateDashboardUserUpdateBody(
  value: unknown,
): UserUpdateInput {
  const body = getRequiredRecord(value);
  const updates: UserUpdateInput = {};

  if ("fullname" in body) {
    const fullname = getOptionalString(body.fullname);

    if (!fullname) {
      throw createError({
        statusCode: 400,
        message: "Nama tidak boleh kosong.",
      });
    }

    updates.fullname = fullname;
  }

  if ("nickname" in body) {
    updates.nickname = getOptionalString(body.nickname) ?? null;
  }

  if ("bio" in body) {
    updates.bio = getOptionalString(body.bio) ?? null;
  }

  if ("email" in body) {
    const email = getOptionalString(body.email)?.toLowerCase();

    if (!email || !EMAIL_REGEX.test(email)) {
      throw createError({
        statusCode: 400,
        message: "Format email tidak valid.",
      });
    }

    updates.email = email;
  }

  if ("role" in body) {
    const role = getOptionalString(body.role);

    if (!role || !VALID_ROLES.includes(role as Role)) {
      throw createError({ statusCode: 400, message: "Role tidak valid." });
    }

    updates.role = role as Role;
  }

  if ("isActive" in body) {
    if (typeof body.isActive !== "boolean") {
      throw createError({
        statusCode: 400,
        message: "Status aktif tidak valid.",
      });
    }

    updates.isActive = body.isActive;
  }

  if ("avatar" in body) {
    updates.avatar = getOptionalString(body.avatar) ?? null;
  }

  if ("phone" in body) {
    updates.phone = getOptionalString(body.phone) ?? null;
  }

  if ("university" in body) {
    updates.university = getOptionalString(body.university) ?? null;
  }

  if ("faculty" in body) {
    updates.faculty = getOptionalString(body.faculty) ?? null;
  }

  if ("major" in body) {
    updates.major = getOptionalString(body.major) ?? null;
  }

  if ("yearEnrolled" in body) {
    if (
      body.yearEnrolled === null ||
      body.yearEnrolled === undefined ||
      body.yearEnrolled === ""
    ) {
      updates.yearEnrolled = null;
    } else {
      const raw = getSingleValue(body.yearEnrolled);
      const parsed = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isInteger(parsed) || parsed < 1901 || parsed > 2155) {
        throw createError({
          statusCode: 400,
          message: "Angkatan Oji tidak valid.",
        });
      }
      updates.yearEnrolled = parsed;
    }
  }

  if ("yearStudy" in body) {
    if (
      body.yearStudy === null ||
      body.yearStudy === undefined ||
      body.yearStudy === ""
    ) {
      updates.yearStudy = null;
    } else {
      const raw = getSingleValue(body.yearStudy);
      const parsed = typeof raw === "number" ? raw : Number(raw);
      if (!Number.isInteger(parsed) || parsed < 1901 || parsed > 2155) {
        throw createError({
          statusCode: 400,
          message: "Angkatan kuliah tidak valid.",
        });
      }
      updates.yearStudy = parsed;
    }
  }

  return updates;
}

export function validateAdminUsersQuery(value: unknown): UserFiltersInput {
  const query = getRequiredRecord(value, "Query tidak valid.");
  const role = getOptionalString(query.role);
  const status = getOptionalString(query.status);
  const yearEnrolled = getOptionalString(query.yearEnrolled);

  return {
    role:
      role && VALID_ROLES.includes(role as Role) ? (role as Role) : undefined,
    status: status === "active" || status === "inactive" ? status : undefined,
    search: getOptionalString(query.search),
    phone: getOptionalString(query.phone),
    university: getOptionalString(query.university),
    yearEnrolled: yearEnrolled
      ? getPositiveInteger(yearEnrolled, 0, { min: 1901, max: 2155 })
      : undefined,
  };
}

export function validateLoginBody(value: unknown) {
  const body = getRequiredRecord(value);
  const identifier = getOptionalString(body.identifier);
  const password = getOptionalString(body.password);

  if (!identifier || !password) {
    throw createError({
      statusCode: 400,
      message: "Identifier dan password wajib diisi.",
    });
  }

  if (
    "remember" in body &&
    typeof body.remember !== "boolean" &&
    body.remember !== undefined
  ) {
    throw createError({
      statusCode: 400,
      message: "Nilai remember tidak valid.",
    });
  }

  return {
    identifier,
    password,
    remember: body.remember === true,
  };
}

export function validateRegisterSantriBody(
  value: unknown,
): RegisterSantriInput {
  const body = getRequiredRecord(value);
  const fullname = getOptionalString(body.fullname);
  const email = getOptionalString(body.email)?.toLowerCase();
  const password = getOptionalString(body.password);
  const passwordConfirmation = getOptionalString(body.passwordConfirmation);

  if (!fullname || !email || !password || !passwordConfirmation) {
    throw createError({ statusCode: 400, message: "Semua field wajib diisi." });
  }

  if (!EMAIL_REGEX.test(email)) {
    throw createError({
      statusCode: 400,
      message: "Format email tidak valid.",
    });
  }

  if (password.length < 8) {
    throw createError({
      statusCode: 400,
      message: "Password minimal 8 karakter.",
    });
  }

  if (password !== passwordConfirmation) {
    throw createError({
      statusCode: 400,
      message: "Konfirmasi kata sandi tidak cocok.",
    });
  }

  return { fullname, email, password };
}

export function validateSantriPostBody(value: unknown) {
  return parseSantriPostPayload(value);
}

export function validateAdminPostsQuery(value: unknown) {
  const query = getRequiredRecord(value, "Query tidak valid.");
  const status = getOptionalString(query.status);

  return {
    status:
      status && VALID_SANTRI_POST_STATUSES.includes(status as PostStatus)
        ? (status as PostStatus)
        : undefined,
  };
}

export function validateAdminBannerBody(value: unknown) {
  const body = getRequiredRecord(value);
  const text = getOptionalString(body.text);

  if (!text) {
    throw createError({ statusCode: 400, message: "Teks banner wajib diisi." });
  }

  if (text.length > 500) {
    throw createError({
      statusCode: 400,
      message: "Teks banner maksimal 500 karakter.",
    });
  }

  const link = getOptionalString(body.link);

  let isActive: boolean | undefined;
  if ("isActive" in body) {
    if (typeof body.isActive !== "boolean") {
      throw createError({
        statusCode: 400,
        message: "Nilai isActive tidak valid.",
      });
    }
    isActive = body.isActive;
  }

  const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
  const startDate = getOptionalString(body.startDate);
  const endDate = getOptionalString(body.endDate);

  if (startDate && !DATE_REGEX.test(startDate)) {
    throw createError({
      statusCode: 400,
      message: "Format startDate tidak valid (YYYY-MM-DD).",
    });
  }

  if (endDate && !DATE_REGEX.test(endDate)) {
    throw createError({
      statusCode: 400,
      message: "Format endDate tidak valid (YYYY-MM-DD).",
    });
  }

  return {
    text,
    link,
    isActive,
    startDate: startDate ?? null,
    endDate: endDate ?? null,
  };
}

export function validateAdminSettingsUpdateBody(value: unknown) {
  const body = getRequiredRecord(value);

  if (!isRecord(body.updates)) {
    throw createError({
      statusCode: 400,
      message: "Field updates harus berupa objek.",
    });
  }

  const entries = Object.entries(body.updates);

  if (entries.length > 50) {
    throw createError({
      statusCode: 400,
      message: "Maksimal 50 setting sekaligus.",
    });
  }

  for (const [k, v] of entries) {
    if (typeof k !== "string" || typeof v !== "string") {
      throw createError({
        statusCode: 400,
        message: "Setiap key dan value harus berupa string.",
      });
    }
  }

  return { updates: body.updates as Record<string, string> };
}

export function validateAdminCategoryBody(value: unknown) {
  const body = getRequiredRecord(value);
  const name = getOptionalString(body.name);

  if (!name) {
    throw createError({
      statusCode: 400,
      message: "Nama kategori wajib diisi.",
    });
  }

  return { name };
}

export function validateReviewActionBody(value: unknown) {
  const body = getRequiredRecord(value);
  return {
    title: getOptionalString(body.title),
    content: typeof body.content === "string" ? body.content : undefined,
    excerpt:
      "excerpt" in body ? (getOptionalString(body.excerpt) ?? null) : undefined,
    categoryId: (() => {
      if (
        !("categoryId" in body) ||
        body.categoryId === null ||
        body.categoryId === undefined
      )
        return undefined;
      const raw = getSingleValue(body.categoryId);
      const n = typeof raw === "number" ? raw : Number(raw);
      return Number.isInteger(n) && n > 0 ? n : undefined;
    })(),
    featuredImage:
      "featuredImage" in body
        ? (getOptionalString(body.featuredImage) ?? null)
        : undefined,
    tags:
      Array.isArray(body.tags) && body.tags.every((t) => typeof t === "string")
        ? (body.tags as string[])
        : undefined,
  };
}

export function validateRejectWithContentBody(value: unknown) {
  const body = getRequiredRecord(value);
  const reviewNote = getOptionalString(body.reviewNote);

  if (!reviewNote) {
    throw createError({
      statusCode: 400,
      message: "Catatan review wajib diisi saat menolak artikel.",
    });
  }

  const contentFields = validateReviewActionBody(value);
  return { reviewNote, ...contentFields };
}

export function validateAdminGalleryBody(value: unknown) {
  const body = getRequiredRecord(value);
  const title = getOptionalString(body.title);

  if (!title) {
    throw createError({
      statusCode: 400,
      message: "Judul gambar wajib diisi.",
    });
  }

  const imagePath = getOptionalString(body.imagePath);

  if (!imagePath) {
    throw createError({ statusCode: 400, message: "Path gambar wajib diisi." });
  }

  const order =
    "order" in body ? getPositiveInteger(body.order, 1, { min: 1 }) : undefined;

  return { title, imagePath, order };
}

const VALID_PAGE_STATUSES = [
  "draft",
  "published",
] as const satisfies PageStatus[];

export function validateAdminPageBody(value: unknown) {
  const body = getRequiredRecord(value);
  const title = getOptionalString(body.title);

  if (!title) {
    throw createError({
      statusCode: 400,
      message: "Judul halaman wajib diisi.",
    });
  }

  const slug = getOptionalString(body.slug);

  if (!slug) {
    throw createError({
      statusCode: 400,
      message: "Slug halaman wajib diisi.",
    });
  }

  const content = typeof body.content === "string" ? body.content : "";
  const statusRaw = getOptionalString(body.status);
  const status: PageStatus =
    statusRaw && VALID_PAGE_STATUSES.includes(statusRaw as PageStatus)
      ? (statusRaw as PageStatus)
      : "draft";

  return { title, slug, content, status };
}
