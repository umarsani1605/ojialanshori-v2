<script setup lang="ts">
import type { TabsItem } from "@nuxt/ui";

type User = {
  id: number;
  name: string;
  username: string;
  email: string;
  role: "admin" | "reviewer" | "santri";
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
  "/api/profile",
  {
    key: "profile-self",
  },
);

const user = computed(() => data.value?.user);

const tabItems: TabsItem[] = [
  { label: "Informasi Pribadi", slot: "informasi" },
  { label: "Keamanan", slot: "keamanan" },
];

const profileForm = reactive({
  name: "",
  email: "",
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
    profileForm.email = val.email;
    profileForm.phone = val.phone ?? "";
    profileForm.university = val.university ?? "";
    profileForm.faculty = val.faculty ?? "";
    profileForm.major = val.major ?? "";
    profileForm.yearEnrolled = val.yearEnrolled ?? undefined;
  },
  { immediate: true },
);

function resetProfileForm() {
  if (user.value) {
    profileForm.name = user.value.name;
    profileForm.email = user.value.email;
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
    await $fetch("/api/profile", {
      method: "PATCH",
      body: {
        name: profileForm.name,
        email: profileForm.email,
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

const yearOptions = Array.from({ length: 12 }, (_, index) => {
  const year = 2015 + index;
  return {
    label: String(year),
    value: year,
  };
});

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
    await $fetch("/api/profile/password", {
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
    await $fetch("/api/profile/avatar", { method: "POST", body: fd });
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
    await $fetch("/api/profile/avatar", { method: "DELETE" });
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
  <UContainer>
    <UCard :ui="{ body: 'pt-4!' }">
      <template #header>
        <div class="flex items-start justify-between gap-4">
          <div class="flex min-w-0 items-center gap-4">
            <div class="relative shrink-0">
              <AppAvatar
                :name="user?.name"
                :src="user?.avatar"
                size="3xl"
                fallback-color="primary"
              />
              <UButton
                type="button"
                icon="i-lucide-camera"
                color="neutral"
                variant="outline"
                size="xs"
                square
                class="absolute -right-1 -bottom-1 rounded-full"
                :loading="avatarUploading"
                :disabled="avatarDeleting"
                aria-label="Ubah avatar"
                @click="pickFile"
              />
            </div>

            <div class="min-w-0">
              <p class="truncate text-lg font-semibold">{{ user?.name }}</p>
              <p class="truncate text-sm text-muted">{{ user?.email }}</p>
            </div>
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
      </template>

      <input
        ref="fileInput"
        type="file"
        accept="image/jpeg,image/png,image/webp"
        class="hidden"
        @change="onFileChange"
      />

      <UTabs :items="tabItems" variant="link" class="w-full">
        <template #informasi>
          <form class="mt-4 max-w-2xl space-y-5" @submit.prevent="saveProfile">
            <div class="space-y-4">
              <UFormField label="Nama Lengkap" name="name" required>
                <UInput
                  v-model="profileForm.name"
                  :disabled="profileSaving"
                  class="w-full"
                />
              </UFormField>

              <UFormField label="Email" name="email" required>
                <UInput
                  v-model="profileForm.email"
                  type="email"
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

              <UFormField label="Angkatan Masuk OJI" name="yearEnrolled">
                <USelect
                  v-model="profileForm.yearEnrolled"
                  :items="yearOptions"
                  placeholder="Pilih angkatan"
                  :disabled="profileSaving"
                  class="w-full"
                />
              </UFormField>

              <UFormField
                label="Angkatan Kuliah"
                name="collegeYear"
                hint="Belum tersedia di data profil saat ini."
              >
                <UInput model-value="Belum tersedia" disabled class="w-full" />
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

              <UFormField label="Jurusan" name="major">
                <UInput
                  v-model="profileForm.major"
                  :disabled="profileSaving"
                  class="w-full"
                />
              </UFormField>
            </div>

            <p
              v-if="profileError"
              class="rounded-md bg-error/10 px-3 py-2 text-sm text-error"
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
        </template>

        <template #keamanan>
          <form class="mt-4 max-w-3xl space-y-5" @submit.prevent="savePassword">
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
              class="rounded-md bg-error/10 px-3 py-2 text-sm text-error"
            >
              {{ passwordError }}
            </p>

            <div class="flex justify-end">
              <UButton type="submit" color="primary" :loading="passwordSaving">
                Ganti Password
              </UButton>
            </div>
          </form>
        </template>
      </UTabs>
    </UCard>
  </UContainer>
</template>
