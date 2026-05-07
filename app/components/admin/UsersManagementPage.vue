<script setup lang="ts">
import { h, resolveComponent } from "vue";
import type { TableColumn } from "@nuxt/ui";
import type { RoleColor } from "~/constants/roleDisplay";
import { roleColorMap, roleLabelMap } from "~/constants/roleDisplay";

type Role = "admin" | "reviewer" | "santri";

type User = {
  id: number;
  name: string;
  username: string;
  email: string;
  role: Role;
  avatar: string | null;
  isActive: boolean;
  createdAt: string;
};

const auth = useAuth();
const toast = useToast();

const PAGE_SIZE = 20;
const page = ref(1);

const filters = reactive({
  role: "" as Role | "",
  status: "" as "active" | "inactive" | "",
  search: "",
});

watch([() => filters.role, () => filters.status, () => filters.search], () => {
  page.value = 1;
});

const { data, status, refresh } = useLazyFetch<{ data: User[] }>(
  "/api/dashboard/users",
);

const users = computed(() => data.value?.data ?? []);

const filteredUsers = computed(() => {
  let result = users.value;
  if (filters.role) {
    result = result.filter((u) => u.role === filters.role);
  }
  if (filters.status) {
    const active = filters.status === "active";
    result = result.filter((u) => u.isActive === active);
  }
  if (filters.search.trim()) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.username.toLowerCase().includes(q),
    );
  }
  return result;
});

const total = computed(() => filteredUsers.value.length);

const paginatedUsers = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE;
  return filteredUsers.value.slice(start, start + PAGE_SIZE);
});

const roleOptions: { label: string; value: Role }[] = [
  { label: "Administrator", value: "admin" },
  { label: "Reviewer", value: "reviewer" },
  { label: "Santri", value: "santri" },
];

const statusOptions: { label: string; value: "active" | "inactive" }[] = [
  { label: "Aktif", value: "active" },
  { label: "Nonaktif", value: "inactive" },
];

// Form modal
const formOpen = ref(false);
const formMode = ref<"create" | "edit">("create");
const formTarget = ref<User | null>(null);
const form = reactive({
  name: "",
  username: "",
  email: "",
  role: "santri" as Role,
  password: "",
});
const formSubmitting = ref(false);
const formError = ref<string | null>(null);

function openCreate() {
  formMode.value = "create";
  formTarget.value = null;
  form.name = "";
  form.username = "";
  form.email = "";
  form.role = "santri";
  form.password = "";
  formError.value = null;
  formOpen.value = true;
}

function openEdit(user: User) {
  formMode.value = "edit";
  formTarget.value = user;
  form.name = user.name;
  form.username = user.username;
  form.email = user.email;
  form.role = user.role;
  form.password = "";
  formError.value = null;
  formOpen.value = true;
}

async function submitForm() {
  formError.value = null;
  formSubmitting.value = true;
  try {
    if (formMode.value === "create") {
      await $fetch("/api/dashboard/users", {
        method: "POST",
        body: { ...form },
      });
      toast.add({
        title: "User baru dibuat",
        color: "success",
        icon: "i-lucide-user-plus",
      });
    } else if (formTarget.value) {
      await $fetch(`/api/dashboard/users/${formTarget.value.id}`, {
        method: "PATCH",
        body: {
          name: form.name,
          username: form.username,
          email: form.email,
          role: form.role,
        },
      });
      toast.add({
        title: "User diperbarui",
        color: "success",
        icon: "i-lucide-check",
      });
    }
    formOpen.value = false;
    await refresh();
  } catch (err) {
    formError.value =
      (err as { data?: { message?: string }; message?: string }).data
        ?.message ??
      (err as Error).message ??
      "Terjadi kesalahan.";
  } finally {
    formSubmitting.value = false;
  }
}

// Confirm modal
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
    ? `User ${user.name} akan bisa login kembali.`
    : `User ${user.name} tidak akan bisa login sampai diaktifkan lagi.`;
  confirm.confirmLabel = willActivate ? "Aktifkan" : "Nonaktifkan";
  confirm.color = willActivate ? "primary" : "warning";
  confirm.action = async () => {
    await $fetch(`/api/dashboard/users/${user.id}`, {
      method: "PATCH",
      body: { isActive: willActivate },
    });
    toast.add({
      title: willActivate ? "User diaktifkan" : "User dinonaktifkan",
      color: "success",
      icon: "i-lucide-check",
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
    await $fetch(`/api/dashboard/users/${user.id}/reset-password`, {
      method: "POST",
    });
    toast.add({
      title: "Password baru dikirim ke email user",
      color: "success",
      icon: "i-lucide-mail",
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
  } catch (err) {
    toast.add({
      title: "Gagal",
      description:
        (err as { data?: { message?: string }; message?: string }).data
          ?.message ??
        (err as Error).message ??
        "Terjadi kesalahan.",
      color: "error",
      icon: "i-lucide-alert-circle",
    });
  } finally {
    confirmRunning.value = false;
  }
}

function isSelf(user: User) {
  return auth.user.value?.id === user.id;
}

const AppAvatar = resolveComponent("AppAvatar");
const UBadge = resolveComponent("UBadge");
const UButton = resolveComponent("UButton");
const UTooltip = resolveComponent("UTooltip");

const columns: TableColumn<User>[] = [
  {
    accessorKey: "name",
    header: "User",
    cell: ({ row }) => {
      const u = row.original;
      return h("div", { class: "flex items-center gap-3" }, [
        h(AppAvatar, { name: u.name, src: u.avatar, size: "sm" }),
        h("div", { class: "min-w-0" }, [
          h("p", { class: "text-sm font-medium truncate" }, u.name),
          h("p", { class: "text-xs text-muted truncate" }, `@${u.username}`),
        ]),
      ]);
    },
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) =>
      h("span", { class: "text-sm" }, row.original.email),
  },
  {
    accessorKey: "role",
    header: "Role",
    cell: ({ row }) =>
      h(
        UBadge,
        {
          color: (roleColorMap[row.original.role] ?? "primary") as RoleColor,
          variant: "subtle",
          size: "xs",
        },
        () => roleLabelMap[row.original.role] ?? row.original.role,
      ),
  },
  {
    accessorKey: "isActive",
    header: "Status",
    cell: ({ row }) =>
      h(
        UBadge,
        {
          color: row.original.isActive ? "success" : "neutral",
          variant: "subtle",
          size: "xs",
        },
        () => (row.original.isActive ? "Aktif" : "Nonaktif"),
      ),
  },
  {
    accessorKey: "createdAt",
    header: "Bergabung",
    cell: ({ row }) =>
      h("span", { class: "text-sm text-muted" }, formatDate(row.original.createdAt)),
  },
  {
    id: "actions",
    header: () => h("div", { class: "text-right" }, "Aksi"),
    cell: ({ row }) => {
      const u = row.original;
      const self = isSelf(u);
      const editBtn = h(
        UButton,
        {
          size: "xs",
          color: "neutral",
          variant: "ghost",
          icon: "i-lucide-pencil",
          disabled: self,
          onClick: () => openEdit(u),
        },
        () => "Edit",
      );
      const toggleBtn = h(
        UButton,
        {
          size: "xs",
          color: u.isActive ? "warning" : "success",
          variant: "ghost",
          icon: u.isActive ? "i-lucide-user-x" : "i-lucide-user-check",
          disabled: self,
          onClick: () => askToggleActive(u),
        },
        () => (u.isActive ? "Nonaktifkan" : "Aktifkan"),
      );
      const resetBtn = h(
        UButton,
        {
          size: "xs",
          color: "error",
          variant: "ghost",
          icon: "i-lucide-key-round",
          disabled: self,
          onClick: () => askResetPassword(u),
        },
        () => "Reset",
      );

      const wrap = (btn: ReturnType<typeof h>) =>
        self
          ? h(UTooltip, { text: "Tidak tersedia untuk akun sendiri" }, () => btn)
          : btn;

      return h("div", { class: "flex justify-end gap-1" }, [
        wrap(editBtn),
        wrap(toggleBtn),
        wrap(resetBtn),
      ]);
    },
  },
];
</script>

<template>
  <UCard
    class="shadow-none!"
    :ui="{
      root: 'ring-transparent divide-y divide-default overflow-hidden',
      header: 'px-4 py-3',
      footer: 'px-4 py-3',
    }"
  >
    <template #header>
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div class="flex flex-wrap items-center gap-2">
          <UInput
            v-model="filters.search"
            placeholder="Cari nama atau email…"
            icon="i-ph-magnifying-glass-bold"
            class="w-full sm:w-64"
          />
          <USelect
            v-model="filters.role"
            :items="roleOptions"
            value-key="value"
            placeholder="Semua role"
            class="w-40"
          />
          <USelect
            v-model="filters.status"
            :items="statusOptions"
            value-key="value"
            placeholder="Semua status"
            class="w-40"
          />
        </div>
        <UButton icon="i-ph-user-plus-bold" @click="openCreate">
          Tambah User
        </UButton>
      </div>
    </template>

    <div class="overflow-x-auto">
      <UTable
        :data="paginatedUsers"
        :columns="columns"
        :loading="status === 'pending'"
        :ui="{ th: 'text-xs', td: 'align-middle' }"
      >
        <template #empty>
          <div class="py-12 text-center">
            <p class="text-muted">Tidak ada user yang cocok dengan filter.</p>
          </div>
        </template>
      </UTable>
    </div>

    <template #footer>
      <div class="flex flex-col sm:flex-row items-center justify-between gap-3">
        <p class="text-sm text-muted shrink-0">Total {{ total }} user</p>
        <UPagination
          v-model:page="page"
          :total="total"
          :items-per-page="PAGE_SIZE"
          size="sm"
          variant="ghost"
        />
      </div>
    </template>
  </UCard>

  <!-- Form Modal -->
  <UModal
    v-model:open="formOpen"
    :title="formMode === 'create' ? 'Tambah User' : 'Edit User'"
  >
    <template #body>
      <form class="space-y-4" @submit.prevent="submitForm">
        <UFormField label="Nama lengkap" required>
          <UInput v-model="form.name" :disabled="formSubmitting" class="w-full" />
        </UFormField>
        <UFormField label="Username" required>
          <UInput v-model="form.username" :disabled="formSubmitting" class="w-full" />
        </UFormField>
        <UFormField label="Email" required>
          <UInput v-model="form.email" type="email" :disabled="formSubmitting" class="w-full" />
        </UFormField>
        <UFormField label="Role" required>
          <USelect
            v-model="form.role"
            :items="roleOptions"
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

        <p v-if="formError" class="text-sm text-red-600 bg-red-50 rounded px-3 py-2">
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

  <!-- Confirm Modal -->
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
        <UButton :color="confirm.color" :loading="confirmRunning" @click="runConfirm">
          {{ confirm.confirmLabel }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
