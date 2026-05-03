<script setup lang="ts">
definePageMeta({
  middleware: ['auth'],
})

type User = {
  id: number
  name: string
  username: string
  email: string
  role: 'superadmin' | 'pengurus' | 'reviewer' | 'santri'
  avatarPath: string | null
  isActive: boolean
  createdAt: string
}

const auth = useAuth()
const toast = useToast()

const { data, refresh } = await useFetch<{ user: User }>('/api/dashboard/profile', {
  key: 'profile-self',
})

const user = computed(() => data.value?.user)

// ── Section: Data Diri ──
const profileForm = reactive({ name: '', username: '', email: '' })
watchEffect(() => {
  if (user.value) {
    profileForm.name = user.value.name
    profileForm.username = user.value.username
    profileForm.email = user.value.email
  }
})
const profileError = ref<string | null>(null)
const profileSaving = ref(false)

async function saveProfile() {
  profileError.value = null
  profileSaving.value = true
  try {
    await $fetch('/api/dashboard/profile', {
      method: 'PATCH',
      body: { ...profileForm },
    })
    toast.add({ title: 'Profil diperbarui', color: 'success', icon: 'i-lucide-check' })
    await Promise.all([refresh(), auth.fetch()])
  }
  catch (err) {
    profileError.value = (err as { data?: { message?: string }, message?: string }).data?.message
      ?? (err as Error).message
      ?? 'Gagal menyimpan perubahan.'
  }
  finally {
    profileSaving.value = false
  }
}

// ── Section: Password ──
const passwordForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: '',
})
const passwordError = ref<string | null>(null)
const passwordSaving = ref(false)

async function savePassword() {
  passwordError.value = null
  passwordSaving.value = true
  try {
    await $fetch('/api/dashboard/profile/password', {
      method: 'PATCH',
      body: { ...passwordForm },
    })
    toast.add({ title: 'Password diperbarui', color: 'success', icon: 'i-lucide-key-round' })
    passwordForm.oldPassword = ''
    passwordForm.newPassword = ''
    passwordForm.confirmPassword = ''
  }
  catch (err) {
    passwordError.value = (err as { data?: { message?: string }, message?: string }).data?.message
      ?? (err as Error).message
      ?? 'Gagal mengganti password.'
  }
  finally {
    passwordSaving.value = false
  }
}

// ── Section: Avatar ──
const fileInput = ref<HTMLInputElement | null>(null)
const avatarUploading = ref(false)
const avatarDeleting = ref(false)

function pickFile() {
  fileInput.value?.click()
}

async function onFileChange(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  input.value = ''
  if (!file) return

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    toast.add({ title: 'Format tidak didukung', description: 'Gunakan JPG, PNG, atau WebP.', color: 'error' })
    return
  }
  if (file.size > 2 * 1024 * 1024) {
    toast.add({ title: 'File terlalu besar', description: 'Maksimal 2MB.', color: 'error' })
    return
  }

  avatarUploading.value = true
  try {
    const fd = new FormData()
    fd.append('file', file)
    await $fetch('/api/dashboard/profile/avatar', { method: 'POST', body: fd })
    toast.add({ title: 'Avatar diperbarui', color: 'success', icon: 'i-lucide-check' })
    await Promise.all([refresh(), auth.fetch()])
  }
  catch (err) {
    toast.add({
      title: 'Gagal upload avatar',
      description: (err as { data?: { message?: string }, message?: string }).data?.message
        ?? (err as Error).message
        ?? 'Terjadi kesalahan.',
      color: 'error',
    })
  }
  finally {
    avatarUploading.value = false
  }
}

async function deleteAvatar() {
  avatarDeleting.value = true
  try {
    await $fetch('/api/dashboard/profile/avatar', { method: 'DELETE' })
    toast.add({ title: 'Avatar dihapus', color: 'success', icon: 'i-lucide-check' })
    await Promise.all([refresh(), auth.fetch()])
  }
  catch (err) {
    toast.add({
      title: 'Gagal menghapus avatar',
      description: (err as { data?: { message?: string }, message?: string }).data?.message
        ?? (err as Error).message
        ?? 'Terjadi kesalahan.',
      color: 'error',
    })
  }
  finally {
    avatarDeleting.value = false
  }
}
</script>

<template>
  <AppContent title="Profil Saya">
    <div class="p-6 max-w-2xl space-y-6">
        <!-- Section 1: Avatar -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-neutral-700">
              Foto Profil
            </h3>
          </template>

          <div class="flex items-center gap-4">
            <AppAvatar
              :name="user?.name"
              :src="user?.avatarPath"
              size="3xl"
            />
            <div class="flex flex-col gap-2">
              <div class="flex gap-2">
                <UButton
                  icon="i-lucide-upload"
                  size="sm"
                  color="primary"
                  :loading="avatarUploading"
                  @click="pickFile"
                >
                  {{ user?.avatarPath ? 'Ganti Foto' : 'Upload Foto' }}
                </UButton>
                <UButton
                  v-if="user?.avatarPath"
                  icon="i-lucide-trash-2"
                  size="sm"
                  color="error"
                  variant="ghost"
                  :loading="avatarDeleting"
                  @click="deleteAvatar"
                >
                  Hapus
                </UButton>
              </div>
              <p class="text-xs text-neutral-500">
                JPG, PNG, atau WebP. Maksimal 2MB.
              </p>
            </div>
            <input
              ref="fileInput"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              class="hidden"
              @change="onFileChange"
            >
          </div>
        </UCard>

        <!-- Section 2: Data Diri -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-neutral-700">
              Data Diri
            </h3>
          </template>

          <form class="space-y-4" @submit.prevent="saveProfile">
            <UFormField label="Nama lengkap" required>
              <UInput v-model="profileForm.name" :disabled="profileSaving" class="w-full" />
            </UFormField>
            <UFormField label="Username" required>
              <UInput v-model="profileForm.username" :disabled="profileSaving" class="w-full" />
            </UFormField>
            <UFormField label="Email" required>
              <UInput v-model="profileForm.email" type="email" :disabled="profileSaving" class="w-full" />
            </UFormField>

            <p v-if="profileError" class="text-sm text-red-600 bg-red-50 rounded px-3 py-2">
              {{ profileError }}
            </p>

            <div class="flex justify-end">
              <UButton
                type="submit"
                color="primary"
                :loading="profileSaving"
              >
                Simpan Perubahan
              </UButton>
            </div>
          </form>
        </UCard>

        <!-- Section 3: Password -->
        <UCard>
          <template #header>
            <h3 class="text-sm font-semibold text-neutral-700">
              Ganti Password
            </h3>
          </template>

          <form class="space-y-4" @submit.prevent="savePassword">
            <UFormField label="Password lama" required>
              <UInput
                v-model="passwordForm.oldPassword"
                type="password"
                :disabled="passwordSaving"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Password baru" required help="Minimal 8 karakter">
              <UInput
                v-model="passwordForm.newPassword"
                type="password"
                :disabled="passwordSaving"
                class="w-full"
              />
            </UFormField>
            <UFormField label="Konfirmasi password baru" required>
              <UInput
                v-model="passwordForm.confirmPassword"
                type="password"
                :disabled="passwordSaving"
                class="w-full"
              />
            </UFormField>

            <p v-if="passwordError" class="text-sm text-red-600 bg-red-50 rounded px-3 py-2">
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
        </UCard>
    </div>
  </AppContent>
</template>
