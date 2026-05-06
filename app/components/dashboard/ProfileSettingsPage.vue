<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui";
import { roleColorMap, roleLabelMap } from "~/utils/roleDisplay";

type User = {
  id: number;
  name: string;
  username: string;
  email: string;
  role: "superadmin" | "pengurus" | "reviewer" | "santri";
  avatar: string | null;
  phone: string | null;
  university: string | null;
  faculty: string | null;
  major: string | null;
  yearEnrolled: number | null;
  isActive: boolean;
  createdAt: string;
};

const auth = useAuth();
const toast = useToast();

const { data, refresh } = await useFetch<{ user: User }>(
  "/api/dashboard/profile",
  {
    key: "profile-self",
  },
);

const user = computed(() => data.value?.user);
const joinYear = computed(() =>
  user.value?.createdAt ? new Date(user.value.createdAt).getFullYear() : "—",
);
const userRole = computed(
  () => user.value?.role ?? auth.user.value?.role ?? "",
);
const roleLabel = computed(
  () => roleLabelMap[userRole.value] ?? userRole.value,
);
const roleColor = computed(() => roleColorMap[userRole.value] ?? "primary");

const tabItems: TabsItem[] = [
  { label: "Informasi Pribadi", slot: "informasi" },
  { label: "Keamanan", slot: "keamanan" },
];

// ── Informasi Pribadi ────────────────────────────────────────────────────────

const profileForm = reactive({
  name: "",
  phone: "",
  university: "",
  faculty: "",
  major: "",
  yearEnrolled: undefined as number | undefined,
});

const profileSaving = ref(false);
const profileError = ref<string | null>(null);

watch(
  user,
  (val) => {
    if (!val) return;
    profileForm.name = val.name;
    profileForm.phone = val.phone ?? "";
    profileForm.university = val.university ?? "";
    profileForm.faculty = val.faculty ?? "";
    profileForm.major = val.major ?? "";
    profileForm.yearEnrolled = val.yearEnrolled ?? undefined;
  },
  { immediate: true, once: true },
);

function resetProfileForm() {
  if (user.value) {
    profileForm.name = user.value.name;
    profileForm.phone = user.value.phone ?? "";
    profileForm.university = user.value.university ?? "";
    profileForm.faculty = user.value.faculty ?? "";
    profileForm.major = user.value.major ?? "";
    profileForm.yearEnrolled = user.value.yearEnrolled ?? undefined;
  }
  profileError.value = null;
}

async function saveProfile() {
  profileError.value = null;
  profileSaving.value = true;
  try {
    await $fetch("/api/dashboard/profile", {
      method: "PATCH",
      body: {
        name: profileForm.name,
        phone: profileForm.phone || null,
        university: profileForm.university || null,
        faculty: profileForm.faculty || null,
        major: profileForm.major || null,
        yearEnrolled: profileForm.yearEnrolled ?? null,
      },
    });
    toast.add({
      title: "Profil diperbarui",
      color: "success",
      icon: "i-lucide-check",
    });
    await Promise.all([refresh(), auth.fetch()]);
  } catch (err) {
    profileError.value =
      (err as { data?: { message?: string }; message?: string }).data
        ?.message ??
      (err as Error).message ??
      "Gagal menyimpan perubahan.";
  } finally {
    profileSaving.value = false;
  }
}

const currentYear = new Date().getFullYear();
const yearOptions = Array.from({ length: 20 }, (_, i) => ({
  label: String(currentYear - i),
  value: currentYear - i,
}));

// ── Keamanan ─────────────────────────────────────────────────────────────────

const passwordForm = reactive({
  oldPassword: "",
  newPassword: "",
  confirmPassword: "",
});
const passwordError = ref<string | null>(null);
const passwordSaving = ref(false);

async function savePassword() {
  passwordError.value = null;
  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    passwordError.value = "Konfirmasi password baru tidak cocok.";
    return;
  }
  passwordSaving.value = true;
  try {
    await $fetch("/api/dashboard/profile/password", {
      method: "PATCH",
      body: { ...passwordForm },
    });
    toast.add({
      title: "Password diperbarui",
      color: "success",
      icon: "i-lucide-key-round",
    });
    passwordForm.oldPassword = "";
    passwordForm.newPassword = "";
    passwordForm.confirmPassword = "";
  } catch (err) {
    passwordError.value =
      (err as { data?: { message?: string }; message?: string }).data
        ?.message ??
      (err as Error).message ??
      "Gagal mengganti password.";
  } finally {
    passwordSaving.value = false;
  }
}

// ── Avatar ───────────────────────────────────────────────────────────────────

const fileInput = ref<HTMLInputElement | null>(null);
const avatarUploading = ref(false);
const avatarDeleting = ref(false);

function pickFile() {
  fileInput.value?.click();
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement;
  const file = input.files?.[0];
  input.value = "";
  if (!file) return;

  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    toast.add({
      title: "Format tidak didukung",
      description: "Gunakan JPG, PNG, atau WebP.",
      color: "error",
    });
    return;
  }
  if (file.size > 2 * 1024 * 1024) {
    toast.add({
      title: "File terlalu besar",
      description: "Maksimal 2MB.",
      color: "error",
    });
    return;
  }

  avatarUploading.value = true;
  try {
    const fd = new FormData();
    fd.append("file", file);
    await $fetch("/api/dashboard/profile/avatar", { method: "POST", body: fd });
    toast.add({
      title: "Avatar diperbarui",
      color: "success",
      icon: "i-lucide-check",
    });
    await Promise.all([refresh(), auth.fetch()]);
  } catch (err) {
    toast.add({
      title: "Gagal upload avatar",
      description:
        (err as { data?: { message?: string }; message?: string }).data
          ?.message ??
        (err as Error).message ??
        "Terjadi kesalahan.",
      color: "error",
    });
  } finally {
    avatarUploading.value = false;
  }
}

async function deleteAvatar() {
  avatarDeleting.value = true;
  try {
    await $fetch("/api/dashboard/profile/avatar", { method: "DELETE" });
    toast.add({
      title: "Avatar dihapus",
      color: "success",
      icon: "i-lucide-check",
    });
    await Promise.all([refresh(), auth.fetch()]);
  } catch (err) {
    toast.add({
      title: "Gagal menghapus avatar",
      description:
        (err as { data?: { message?: string }; message?: string }).data
          ?.message ??
        (err as Error).message ??
        "Terjadi kesalahan.",
      color: "error",
    });
  } finally {
    avatarDeleting.value = false;
  }
}
</script>

<template>
  <UContainer class="max-w-2xl px-6 py-8">
    <div class="space-y-6">
      <!-- Card Profil -->
      <div
        class="flex items-center gap-5 rounded-xl border border-slate-200 bg-white p-6"
      >
        <div class="relative shrink-0">
          <AppAvatar :name="user?.name" :src="user?.avatar" size="3xl" />
          <button
            type="button"
            class="absolute -bottom-1 -right-1 rounded-full border border-slate-200 bg-white p-1.5 shadow-sm transition-colors hover:bg-slate-50"
            :disabled="avatarUploading || avatarDeleting"
            @click="pickFile"
          >
            <UIcon
              :name="
                avatarUploading ? 'i-lucide-loader-circle' : 'i-lucide-camera'
              "
              class="size-3.5 text-muted"
              :class="{ 'animate-spin': avatarUploading }"
            />
          </button>
        </div>

        <div class="min-w-0 flex-1">
          <p class="truncate text-lg font-semibold">{{ user?.name }}</p>
          <div class="mt-1 flex items-center gap-2">
            <UBadge :color="roleColor" variant="subtle" size="sm">{{
              roleLabel
            }}</UBadge>
            <span class="text-xs text-dimmed">Bergabung {{ joinYear }}</span>
          </div>
          <p class="mt-1 truncate text-sm text-muted">{{ user?.email }}</p>
        </div>

        <UButton
          v-if="user?.avatar"
          icon="i-lucide-trash-2"
          color="error"
          variant="ghost"
          size="xs"
          :loading="avatarDeleting"
          aria-label="Hapus avatar"
          @click="deleteAvatar"
        />
      </div>

      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        class="hidden"
        @change="onFileChange"
      />

      <!-- Tabs -->
      <UTabs :items="tabItems" class="w-full">
        <template #informasi>
          <div class="mt-4 rounded-xl border border-slate-200 bg-white p-6">
            <form class="space-y-5" @submit.prevent="saveProfile">
              <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <UFormField
                  label="Nama Lengkap"
                  name="name"
                  required
                  class="sm:col-span-2"
                >
                  <UInput
                    v-model="profileForm.name"
                    :disabled="profileSaving"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="No. HP / WhatsApp" name="phone">
                  <UInput
                    v-model="profileForm.phone"
                    :disabled="profileSaving"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="Angkatan" name="yearEnrolled">
                  <USelect
                    v-model="profileForm.yearEnrolled"
                    :items="yearOptions"
                    placeholder="Pilih angkatan"
                    :disabled="profileSaving"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="Universitas / Kampus" name="university">
                  <UInput
                    v-model="profileForm.university"
                    :disabled="profileSaving"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="Fakultas" name="faculty">
                  <UInput
                    v-model="profileForm.faculty"
                    :disabled="profileSaving"
                    class="w-full"
                  />
                </UFormField>

                <UFormField label="Jurusan" name="major" class="sm:col-span-2">
                  <UInput
                    v-model="profileForm.major"
                    :disabled="profileSaving"
                    class="w-full"
                  />
                </UFormField>

                <UFormField
                  label="Email"
                  name="email"
                  hint="Email tidak bisa diubah"
                  class="sm:col-span-2"
                >
                  <UInput :model-value="user?.email" disabled class="w-full" />
                </UFormField>
              </div>

              <p
                v-if="profileError"
                class="rounded bg-red-50 px-3 py-2 text-sm text-red-600"
              >
                {{ profileError }}
              </p>

              <div class="flex justify-end gap-2">
                <UButton
                  type="button"
                  color="neutral"
                  variant="outline"
                  :disabled="profileSaving"
                  @click="resetProfileForm"
                >
                  Batal
                </UButton>
                <UButton type="submit" color="primary" :loading="profileSaving">
                  Simpan Perubahan
                </UButton>
              </div>
            </form>
          </div>
        </template>

        <template #keamanan>
          <div class="mt-4 rounded-xl border border-slate-200 bg-white p-6">
            <form class="space-y-5" @submit.prevent="savePassword">
              <UFormField label="Password Lama" name="oldPassword" required>
                <UInput
                  v-model="passwordForm.oldPassword"
                  type="password"
                  :disabled="passwordSaving"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Password Baru"
                name="newPassword"
                required
                hint="Minimal 8 karakter"
              >
                <UInput
                  v-model="passwordForm.newPassword"
                  type="password"
                  :disabled="passwordSaving"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Konfirmasi Password Baru"
                name="confirmPassword"
                required
              >
                <UInput
                  v-model="passwordForm.confirmPassword"
                  type="password"
                  :disabled="passwordSaving"
                  class="w-full"
                />
              </UFormField>

              <p
                v-if="passwordError"
                class="rounded bg-red-50 px-3 py-2 text-sm text-red-600"
              >
                {{ passwordError }}
              </p>

              <div class="flex justify-end">
                <UButton
                  type="submit"
                  color="primary"
                  :loading="passwordSaving"
                >
                  Ganti Password
                </UButton>
              </div>
            </form>
          </div>
        </template>
      </UTabs>
    </div>
  </UContainer>
</template>
