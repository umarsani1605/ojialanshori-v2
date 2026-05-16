<script setup lang="ts">
import { h, resolveComponent } from "vue";
import type { DropdownMenuItem, TableColumn } from "@nuxt/ui";
import type { RoleColor } from "~/constants/roleDisplay";
import { roleColorMap, roleLabelMap } from "~/constants/roleDisplay";
import type { Role, RoleFilter, SafeUser as User } from "~~/shared/types";

definePageMeta({
  layout: "admin",
  middleware: ["auth", "role"],
  navbarTitle: "Users",
});

type StatusFilter = "active" | "inactive" | "all";

const auth = useAuth();
const toast = useToast();
const posthog = usePostHog();

const filters = reactive({
  role: "all" as RoleFilter,
  status: "all" as StatusFilter,
  search: "",
});

const isFiltered = computed(
  () =>
    filters.role !== "all" || filters.status !== "all" || filters.search !== "",
);

function resetFilters() {
  filters.role = "all";
  filters.status = "all";
  filters.search = "";
}

const query = computed(() => ({
  role: filters.role === "all" ? undefined : filters.role,
  status: filters.status === "all" ? undefined : filters.status,
  search: filters.search || undefined,
}));

const { data, status, refresh } = useLazyFetch<{ data: User[] }>("/api/users", {
  key: "admin-users-list",
  query,
  watch: [() => filters.role, () => filters.status, () => filters.search],
});

const users = computed(() => data.value?.data ?? []);
const total = computed(() => users.value.length);

const roleOptions: { label: string; value: RoleFilter }[] = [
  { label: "Semua role", value: "all" },
  { label: "Administrator", value: "admin" },
  { label: "Reviewer", value: "reviewer" },
  { label: "Santri", value: "santri" },
];

const statusOptions: { label: string; value: StatusFilter }[] = [
  { label: "Semua status", value: "all" },
  { label: "Aktif", value: "active" },
  { label: "Nonaktif", value: "inactive" },
];

const formOpen = ref(false);
const formMode = ref<"create" | "edit">("create");
const formTarget = ref<User | null>(null);
const formSubmitting = ref(false);
const formError = ref<string | null>(null);
const avatarFile = ref<File | null>(null);
const avatarUploading = ref(false);

const form = reactive({
  fullname: "",
  nickname: "",
  bio: "",
  email: "",
  role: "santri" as Role,
  password: "",
  avatar: "",
  phone: "",
  yearEnrolled: undefined as number | undefined,
  yearStudy: undefined as number | undefined,
  university: "",
  faculty: "",
  major: "",
});

function resetForm() {
  form.fullname = "";
  form.nickname = "";
  form.bio = "";
  form.email = "";
  form.role = "santri";
  form.password = "";
  form.avatar = "";
  form.phone = "";
  form.yearEnrolled = undefined;
  form.yearStudy = undefined;
  form.university = "";
  form.faculty = "";
  form.major = "";
  avatarFile.value = null;
  formError.value = null;
}

function openCreate() {
  formMode.value = "create";
  formTarget.value = null;
  resetForm();
  formOpen.value = true;
}

function openEdit(user: User) {
  formMode.value = "edit";
  formTarget.value = user;
  form.fullname = user.fullname;
  form.nickname = user.nickname ?? "";
  form.bio = user.bio ?? "";
  form.email = user.email;
  form.role = user.role;
  form.password = "";
  form.avatar = user.avatar ?? "";
  form.phone = user.phone ?? "";
  form.yearEnrolled = user.yearEnrolled ?? undefined;
  form.yearStudy = user.yearStudy ?? undefined;
  form.university = user.university ?? "";
  form.faculty = user.faculty ?? "";
  form.major = user.major ?? "";
  avatarFile.value = null;
  formError.value = null;
  formOpen.value = true;
}

function buildPayload(avatar: string | null) {
  return {
    fullname: form.fullname,
    nickname: form.nickname || null,
    bio: form.bio || null,
    email: form.email,
    role: form.role,
    avatar,
    phone: form.phone || null,
    yearEnrolled: form.yearEnrolled ?? null,
    yearStudy: form.yearStudy ?? null,
    university: form.university || null,
    faculty: form.faculty || null,
    major: form.major || null,
  };
}

function removeAvatar() {
  form.avatar = "";
  avatarFile.value = null;
}

async function submitForm() {
  formError.value = null;
  formSubmitting.value = true;
  try {
    let avatarPath = form.avatar || null;

    if (avatarFile.value) {
      avatarUploading.value = true;
      const formData = new FormData();
      formData.append("image", avatarFile.value);

      const { path } = await $fetch<{ path: string }>(
        "/api/users/upload-avatar",
        {
          method: "POST",
          body: formData,
        },
      );

      avatarPath = path;
      form.avatar = path;
      avatarUploading.value = false;
    }

    if (formMode.value === "create") {
      await $fetch("/api/users", {
        method: "POST",
        body: {
          ...buildPayload(avatarPath),
          password: form.password,
        },
      });
      toast.add({
        title: "User baru dibuat",
        color: "success",
        icon: "i-ph-user-plus",
      });
    } else if (formTarget.value) {
      await $fetch(`/api/users/${formTarget.value.id}`, {
        method: "PATCH",
        body: buildPayload(avatarPath),
      });
      toast.add({
        title: "User diperbarui",
        color: "success",
        icon: "i-ph-check",
      });
    }
    formOpen.value = false;
    await refresh();
  } catch (error: unknown) {
    if (avatarUploading.value) {
      posthog?.capture("upload.failed", {
        endpoint: "/api/users/upload-avatar",
        reason: errorMessage(error),
        file_size: avatarFile.value?.size,
      });
    }
    formError.value = errorMessage(error);
  } finally {
    avatarUploading.value = false;
    formSubmitting.value = false;
  }
}

const confirm = reactive<{
  open: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  color: "error" | "warning" | "primary";
  action: (() => Promise<void>) | null;
}>({
  open: false,
  title: "",
  description: "",
  confirmLabel: "Konfirmasi",
  color: "primary",
  action: null,
});
const confirmRunning = ref(false);

function askToggleActive(user: User) {
  const willActivate = !user.isActive;
  confirm.title = willActivate ? "Aktifkan user?" : "Nonaktifkan user?";
  confirm.description = willActivate
    ? `User ${user.fullname} akan bisa login kembali.`
    : `User ${user.fullname} tidak akan bisa login sampai diaktifkan lagi.`;
  confirm.confirmLabel = willActivate ? "Aktifkan" : "Nonaktifkan";
  confirm.color = willActivate ? "primary" : "error";
  confirm.action = async () => {
    await $fetch(`/api/users/${user.id}`, {
      method: "PATCH",
      body: { isActive: willActivate },
    });
    toast.add({
      title: willActivate ? "User diaktifkan" : "User dinonaktifkan",
      color: "success",
      icon: "i-ph-check",
    });
    await refresh();
  };
  confirm.open = true;
}

function askResetPassword(user: User) {
  confirm.title = "Reset password?";
  confirm.description = `Password baru akan dikirim ke email ${user.email}. Lanjutkan?`;
  confirm.confirmLabel = "Reset Password";
  confirm.color = "error";
  confirm.action = async () => {
    await $fetch(`/api/users/${user.id}/reset-password`, { method: "POST" });
    toast.add({
      title: "Password baru dikirim ke email user",
      color: "success",
      icon: "i-ph-envelope",
    });
  };
  confirm.open = true;
}

async function runConfirm() {
  if (!confirm.action) return;
  confirmRunning.value = true;
  try {
    await confirm.action();
    confirm.open = false;
  } catch (error: unknown) {
    toast.add({
      title: "Gagal",
      description: errorMessage(error),
      color: "error",
      icon: "i-ph-warning-circle",
    });
  } finally {
    confirmRunning.value = false;
  }
}

function isSelf(user: User) {
  return auth.user.value?.id === user.id;
}

const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UDropdownMenu = resolveComponent("UDropdownMenu");
const UTooltip = resolveComponent("UTooltip");

function rowMenu(user: User): DropdownMenuItem[][] {
  return [
    [
      {
        label: user.isActive ? "Nonaktifkan" : "Aktifkan",
        icon: user.isActive
          ? "i-ph-user-circle-minus"
          : "i-ph-user-circle-plus",
        color: "neutral",
        onSelect: () => askToggleActive(user),
      },
    ],
    [
      {
        label: "Reset Password",
        icon: "i-ph-key-bold",
        color: "error",
        onSelect: () => askResetPassword(user),
      },
    ],
  ];
}

const columns: TableColumn<User>[] = [
  {
    accessorKey: "fullname",
    header: "Nama Lengkap",
    cell: ({ row }) =>
      h("span", { class: "font-medium" }, row.original.fullname),
  },
  {
    accessorKey: "nickname",
    header: "Nama Panggilan",
    cell: ({ row }) =>
      h("div", { class: "flex items-center gap-3" }, [
        h("span", { class: "text-sm" }, row.original.nickname ?? "—"),
      ]),
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => h("span", { class: "text-sm" }, row.original.email),
  },
  {
    accessorKey: "yearEnrolled",
    header: "Angkatan Oji",
    cell: ({ row }) =>
      h(
        "span",
        { class: "text-sm" },
        row.original.yearEnrolled ? String(row.original.yearEnrolled) : "—",
      ),
  },
  {
    accessorKey: "university",
    header: "Kampus",
    cell: ({ row }) =>
      h("span", { class: "text-sm" }, row.original.university ?? "—"),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) =>
      h(UBadge, {
        color: row.original.isActive ? "success" : "neutral",
        variant: "subtle",
        label: row.original.isActive
          ? "Aktif"
          : row.original.role === "santri"
            ? "Menunggu Verifikasi"
            : "Nonaktif",
      }),
  },
  {
    id: "actions",
    header: () => h("div", { class: "text-right" }, "Aksi"),
    cell: ({ row }) => {
      const user = row.original;
      const self = isSelf(user);

      const editButton = h(
        UButton,
        {
          size: "sm",
          variant: "light",
          icon: "i-ph-pencil-simple",
          disabled: self,
          onClick: () => openEdit(user),
        },
        () => "Edit",
      );

      const wrap = (button: ReturnType<typeof h>) =>
        self
          ? h(
              UTooltip,
              { text: "Tidak tersedia untuk akun sendiri" },
              () => button,
            )
          : button;

      const menu = h(UDropdownMenu, { items: rowMenu(user) }, () =>
        h(UButton, {
          size: "sm",
          color: "neutral",
          variant: "light",
          icon: "i-ph-dots-three-vertical-bold",
        }),
      );

      return h("div", { class: "flex justify-end gap-1" }, [
        wrap(editButton),
        self ? wrap(menu) : menu,
      ]);
    },
  },
];
</script>

<template>
  <AdminDataTable
    v-model:search="filters.search"
    :data="users"
    :columns="columns"
    :loading="status === 'pending'"
    search-placeholder="Cari nama, email, angkatan, kampus…"
  >
    <template #toolbar-left>
      <USelect
        v-model="filters.role"
        :items="roleOptions"
        value-key="value"
        class="w-48"
      />
      <USelect
        v-model="filters.status"
        :items="statusOptions"
        value-key="value"
        class="w-40"
      />
      <UButton
        v-if="isFiltered"
        variant="link"
        color="neutral"
        icon="i-ph-x"
        label="Reset"
        @click="resetFilters"
      />
    </template>

    <template #toolbar-right>
      <UButton icon="i-ph-user-plus-bold" @click="openCreate">
        Tambah User
      </UButton>
    </template>

    <template #empty>
      <div class="py-12 text-center">
        <p class="text-muted">Tidak ada user yang cocok dengan filter.</p>
      </div>
    </template>
  </AdminDataTable>

  <UModal
    v-model:open="formOpen"
    :title="formMode === 'create' ? 'Tambah User' : 'Edit User'"
    :ui="{ content: 'max-w-4xl' }"
  >
    <template #body>
      <form class="space-y-5" @submit.prevent="submitForm">
        <div class="grid gap-6 lg:grid-cols-2">
          <div class="space-y-4">
            <h3 class="font-medium">Informasi Akun</h3>
            <UFormField label="Avatar">
              <div class="space-y-3">
                <div
                  v-if="form.avatar && !avatarFile"
                  class="flex items-center gap-3 rounded-lg border border-default p-3"
                >
                  <UAvatar
                    :src="form.avatar"
                    :alt="form.fullname || 'Avatar user'"
                    :text="getInitials(form.fullname || form.email)"
                    size="xl"
                  />
                  <div class="min-w-0 flex-1">
                    <p class="text-sm font-medium">Avatar saat ini</p>
                    <p class="text-xs text-muted">
                      Upload file baru untuk mengganti avatar.
                    </p>
                  </div>
                  <UButton
                    type="button"
                    color="neutral"
                    variant="ghost"
                    size="sm"
                    icon="i-ph-trash"
                    :disabled="formSubmitting || avatarUploading"
                    @click="removeAvatar"
                  >
                    Hapus
                  </UButton>
                </div>

                <UFileUpload
                  v-model="avatarFile"
                  accept="image/jpeg,image/png,image/webp"
                  label="Upload avatar"
                  description="JPG, PNG, WebP · Maks 2MB"
                  icon="i-ph-image"
                  :disabled="formSubmitting || avatarUploading"
                  class="w-full min-h-40"
                />
              </div>
            </UFormField>
            <UFormField label="Nama lengkap" required>
              <UInput
                v-model="form.fullname"
                :disabled="formSubmitting"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Nama panggilan">
              <UInput
                v-model="form.nickname"
                :disabled="formSubmitting"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Bio">
              <UTextarea
                v-model="form.bio"
                :disabled="formSubmitting"
                class="w-full"
                placeholder="Tulis bio singkat..."
              />
            </UFormField>
            <UFormField label="Email" required>
              <UInput
                v-model="form.email"
                type="email"
                :disabled="formSubmitting"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Role" required>
              <USelect
                v-model="form.role"
                :items="roleOptions.filter((option) => option.value !== 'all')"
                value-key="value"
                :disabled="formSubmitting"
                class="w-full"
              />
            </UFormField>
            <UFormField
              v-if="formMode === 'create'"
              label="Password"
              required
              help="Minimal 8 karakter"
            >
              <UInput
                v-model="form.password"
                type="password"
                :disabled="formSubmitting"
                class="w-full"
              />
            </UFormField>
          </div>

          <div class="space-y-4">
            <h3 class="font-medium">Informasi Personal</h3>
            <UFormField label="Nomor HP">
              <UInput
                v-model="form.phone"
                :disabled="formSubmitting"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Angkatan Oji">
              <USelect
                v-model="form.yearEnrolled"
                :items="YEAR_OPTIONS"
                placeholder="Pilih angkatan"
                :disabled="formSubmitting"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Angkatan Kuliah">
              <USelect
                v-model="form.yearStudy"
                :items="YEAR_OPTIONS"
                placeholder="Pilih angkatan"
                :disabled="formSubmitting"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Kampus">
              <UInput
                v-model="form.university"
                :disabled="formSubmitting"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Fakultas">
              <UInput
                v-model="form.faculty"
                :disabled="formSubmitting"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Jurusan">
              <UInput
                v-model="form.major"
                :disabled="formSubmitting"
                class="w-full"
              />
            </UFormField>
          </div>
        </div>

        <p
          v-if="formError"
          class="rounded bg-red-50 px-3 py-2 text-sm text-red-600"
        >
          {{ formError }}
        </p>

        <div class="flex justify-end gap-2 pt-2">
          <UButton
            color="neutral"
            variant="ghost"
            :disabled="formSubmitting"
            @click="formOpen = false"
          >
            Batal
          </UButton>
          <UButton type="submit" color="primary" :loading="formSubmitting">
            {{ formMode === "create" ? "Buat User" : "Simpan Perubahan" }}
          </UButton>
        </div>
      </form>
    </template>
  </UModal>

  <UModal v-model:open="confirm.open" :title="confirm.title">
    <template #body>
      <p class="text-sm text-muted">{{ confirm.description }}</p>
      <div class="flex justify-end gap-2 pt-4">
        <UButton
          color="neutral"
          variant="ghost"
          :disabled="confirmRunning"
          @click="confirm.open = false"
        >
          Batal
        </UButton>
        <UButton
          :color="confirm.color"
          :loading="confirmRunning"
          @click="runConfirm"
        >
          {{ confirm.confirmLabel }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
