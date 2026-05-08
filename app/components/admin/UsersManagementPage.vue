<script setup lang="ts">
import { h, resolveComponent } from 'vue'
import type { TableColumn } from '@nuxt/ui'
import type { RoleColor } from '~/constants/roleDisplay'
import { roleColorMap, roleLabelMap } from '~/constants/roleDisplay'

type Role = 'admin' | 'reviewer' | 'santri'
type RoleFilter = Role | 'all'
type StatusFilter = 'active' | 'inactive' | 'all'

type User = {
  id: number
  name: string
  username: string
  email: string
  role: Role
  avatar: string | null
  phone: string | null
  university: string | null
  faculty: string | null
  major: string | null
  yearEnrolled: number | null
  isActive: boolean
  createdAt: string
}

const auth = useAuth()
const toast = useToast()

const PAGE_SIZE = 20
const page = ref(1)

const filters = reactive({
  role: 'all' as RoleFilter,
  status: 'all' as StatusFilter,
  search: '',
  phone: '',
  yearEnrolled: '',
  university: '',
})

watch([
  () => filters.role,
  () => filters.status,
  () => filters.search,
  () => filters.phone,
  () => filters.yearEnrolled,
  () => filters.university,
], () => {
  page.value = 1
})

const query = computed(() => ({
  role: filters.role === 'all' ? undefined : filters.role,
  status: filters.status === 'all' ? undefined : filters.status,
  search: filters.search || undefined,
  phone: filters.phone || undefined,
  yearEnrolled: filters.yearEnrolled || undefined,
  university: filters.university || undefined,
}))

const { data, status, refresh } = useLazyFetch<{ data: User[] }>('/api/users', {
  query,
  watch: [
    () => filters.role,
    () => filters.status,
    () => filters.search,
    () => filters.phone,
    () => filters.yearEnrolled,
    () => filters.university,
  ],
})

const users = computed(() => data.value?.data ?? [])
const total = computed(() => users.value.length)
const paginatedUsers = computed(() => {
  const start = (page.value - 1) * PAGE_SIZE
  return users.value.slice(start, start + PAGE_SIZE)
})

const roleOptions: { label: string; value: RoleFilter }[] = [
  { label: 'Semua role', value: 'all' },
  { label: 'Administrator', value: 'admin' },
  { label: 'Reviewer', value: 'reviewer' },
  { label: 'Santri', value: 'santri' },
]

const statusOptions: { label: string; value: StatusFilter }[] = [
  { label: 'Semua status', value: 'all' },
  { label: 'Aktif', value: 'active' },
  { label: 'Nonaktif', value: 'inactive' },
]

const formOpen = ref(false)
const formMode = ref<'create' | 'edit'>('create')
const formTarget = ref<User | null>(null)
const formSubmitting = ref(false)
const formError = ref<string | null>(null)

const form = reactive({
  name: '',
  username: '',
  email: '',
  role: 'santri' as Role,
  password: '',
  avatar: '',
  phone: '',
  yearEnrolled: '',
  university: '',
  faculty: '',
  major: '',
  isActive: true,
})

function resetForm() {
  form.name = ''
  form.username = ''
  form.email = ''
  form.role = 'santri'
  form.password = ''
  form.avatar = ''
  form.phone = ''
  form.yearEnrolled = ''
  form.university = ''
  form.faculty = ''
  form.major = ''
  form.isActive = true
  formError.value = null
}

function openCreate() {
  formMode.value = 'create'
  formTarget.value = null
  resetForm()
  formOpen.value = true
}

function openEdit(user: User) {
  formMode.value = 'edit'
  formTarget.value = user
  form.name = user.name
  form.username = user.username
  form.email = user.email
  form.role = user.role
  form.password = ''
  form.avatar = user.avatar ?? ''
  form.phone = user.phone ?? ''
  form.yearEnrolled = user.yearEnrolled ? String(user.yearEnrolled) : ''
  form.university = user.university ?? ''
  form.faculty = user.faculty ?? ''
  form.major = user.major ?? ''
  form.isActive = user.isActive
  formError.value = null
  formOpen.value = true
}

function buildPayload() {
  return {
    name: form.name,
    username: form.username,
    email: form.email,
    role: form.role,
    avatar: form.avatar || null,
    phone: form.phone || null,
    yearEnrolled: form.yearEnrolled || null,
    university: form.university || null,
    faculty: form.faculty || null,
    major: form.major || null,
    isActive: form.isActive,
  }
}

async function submitForm() {
  formError.value = null
  formSubmitting.value = true
  try {
    if (formMode.value === 'create') {
      await $fetch('/api/users', {
        method: 'POST',
        body: {
          ...buildPayload(),
          password: form.password,
        },
      })
      toast.add({ title: 'User baru dibuat', color: 'success', icon: 'i-ph-user-plus' })
    } else if (formTarget.value) {
      await $fetch(`/api/users/${formTarget.value.id}`, {
        method: 'PATCH',
        body: buildPayload(),
      })
      toast.add({ title: 'User diperbarui', color: 'success', icon: 'i-ph-check' })
    }
    formOpen.value = false
    await refresh()
  } catch (error) {
    formError.value = (error as { data?: { message?: string }, message?: string }).data?.message
      ?? (error as Error).message
      ?? 'Terjadi kesalahan.'
  } finally {
    formSubmitting.value = false
  }
}

const confirm = reactive<{
  open: boolean
  title: string
  description: string
  confirmLabel: string
  color: 'error' | 'warning' | 'primary'
  action: (() => Promise<void>) | null
}>({
  open: false,
  title: '',
  description: '',
  confirmLabel: 'Konfirmasi',
  color: 'primary',
  action: null,
})
const confirmRunning = ref(false)

function askToggleActive(user: User) {
  const willActivate = !user.isActive
  confirm.title = willActivate ? 'Aktifkan user?' : 'Nonaktifkan user?'
  confirm.description = willActivate
    ? `User ${user.name} akan bisa login kembali.`
    : `User ${user.name} tidak akan bisa login sampai diaktifkan lagi.`
  confirm.confirmLabel = willActivate ? 'Aktifkan' : 'Nonaktifkan'
  confirm.color = willActivate ? 'primary' : 'warning'
  confirm.action = async () => {
    await $fetch(`/api/users/${user.id}`, {
      method: 'PATCH',
      body: { isActive: willActivate },
    })
    toast.add({
      title: willActivate ? 'User diaktifkan' : 'User dinonaktifkan',
      color: 'success',
      icon: 'i-ph-check',
    })
    await refresh()
  }
  confirm.open = true
}

function askResetPassword(user: User) {
  confirm.title = 'Reset password?'
  confirm.description = `Password baru akan dikirim ke email ${user.email}. Lanjutkan?`
  confirm.confirmLabel = 'Reset Password'
  confirm.color = 'error'
  confirm.action = async () => {
    await $fetch(`/api/users/${user.id}/reset-password`, { method: 'POST' })
    toast.add({ title: 'Password baru dikirim ke email user', color: 'success', icon: 'i-ph-envelope' })
  }
  confirm.open = true
}

async function runConfirm() {
  if (!confirm.action) return
  confirmRunning.value = true
  try {
    await confirm.action()
    confirm.open = false
  } catch (error) {
    toast.add({
      title: 'Gagal',
      description: (error as { data?: { message?: string }, message?: string }).data?.message
        ?? (error as Error).message
        ?? 'Terjadi kesalahan.',
      color: 'error',
      icon: 'i-ph-warning-circle',
    })
  } finally {
    confirmRunning.value = false
  }
}

function isSelf(user: User) {
  return auth.user.value?.id === user.id
}

const UAvatar = resolveComponent('UAvatar')
const UBadge = resolveComponent('UBadge')
const UButton = resolveComponent('UButton')
const UTooltip = resolveComponent('UTooltip')

const columns: TableColumn<User>[] = [
  {
    id: 'index',
    header: 'No',
    cell: ({ row }) => {
      const index = (page.value - 1) * PAGE_SIZE + row.index + 1
      return h('span', { class: 'text-sm tabular-nums text-muted' }, String(index))
    },
  },
  {
    accessorKey: 'name',
    header: 'Nama Lengkap',
    cell: ({ row }) => h('span', { class: 'font-medium' }, row.original.name),
  },
  {
    accessorKey: 'username',
    header: 'Nama Panggilan',
    cell: ({ row }) =>
      h('div', { class: 'flex items-center gap-3' }, [
        h(UAvatar, {
          src: row.original.avatar ?? undefined,
          alt: row.original.name,
          text: getInitials(row.original.name),
          size: 'sm',
        }),
        h('span', { class: 'text-sm' }, row.original.username),
      ]),
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => h('span', { class: 'text-sm' }, row.original.email),
  },
  {
    accessorKey: 'yearEnrolled',
    header: 'Angkatan OJI',
    cell: ({ row }) => h('span', { class: 'text-sm' }, row.original.yearEnrolled ? String(row.original.yearEnrolled) : '—'),
  },
  {
    accessorKey: 'university',
    header: 'Kampus',
    cell: ({ row }) => h('span', { class: 'text-sm' }, row.original.university ?? '—'),
  },
  {
    accessorKey: 'isActive',
    header: 'Status',
    cell: ({ row }) =>
      h(UBadge, {
        color: row.original.isActive ? 'success' : 'neutral',
        variant: 'subtle',
        label: row.original.isActive ? 'Aktif' : 'Nonaktif',
      }),
  },
  {
    id: 'actions',
    header: () => h('div', { class: 'text-right' }, 'Aksi'),
    cell: ({ row }) => {
      const user = row.original
      const self = isSelf(user)

      const editButton = h(UButton, {
        size: 'xs',
        color: 'neutral',
        variant: 'ghost',
        icon: 'i-ph-pencil-simple',
        disabled: self,
        onClick: () => openEdit(user),
      }, () => 'Edit')

      const toggleButton = h(UButton, {
        size: 'xs',
        color: user.isActive ? 'warning' : 'success',
        variant: 'ghost',
        icon: user.isActive ? 'i-ph-user-minus' : 'i-ph-user-check',
        disabled: self,
        onClick: () => askToggleActive(user),
      }, () => (user.isActive ? 'Nonaktifkan' : 'Aktifkan'))

      const resetButton = h(UButton, {
        size: 'xs',
        color: 'error',
        variant: 'ghost',
        icon: 'i-ph-key',
        disabled: self,
        onClick: () => askResetPassword(user),
      }, () => 'Reset')

      const wrap = (button: ReturnType<typeof h>) =>
        self ? h(UTooltip, { text: 'Tidak tersedia untuk akun sendiri' }, () => button) : button

      return h('div', { class: 'flex justify-end gap-1' }, [
        wrap(editButton),
        wrap(toggleButton),
        wrap(resetButton),
      ])
    },
  },
]
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
        <div class="grid w-full gap-2 lg:grid-cols-6">
          <UInput
            v-model="filters.search"
            placeholder="Cari nama, panggilan, email…"
            icon="i-ph-magnifying-glass-bold"
            class="lg:col-span-2"
          />
          <UInput v-model="filters.phone" placeholder="Nomor HP" class="w-full" />
          <UInput v-model="filters.yearEnrolled" placeholder="Angkatan OJI" type="number" class="w-full" />
          <UInput v-model="filters.university" placeholder="Kampus" class="w-full" />
          <div class="flex gap-2">
            <USelect v-model="filters.role" :items="roleOptions" value-key="value" class="w-full" />
            <USelect v-model="filters.status" :items="statusOptions" value-key="value" class="w-full" />
          </div>
        </div>
        <UButton icon="i-ph-user-plus-bold" @click="openCreate">
          Tambah User
        </UButton>
      </div>
    </template>

    <div class="overflow-x-auto">
      <UTable :data="paginatedUsers" :columns="columns" :loading="status === 'pending'" :ui="{ th: 'text-xs', td: 'align-middle' }">
        <template #empty>
          <div class="py-12 text-center">
            <p class="text-muted">Tidak ada user yang cocok dengan filter.</p>
          </div>
        </template>
      </UTable>
    </div>

    <template #footer>
      <div class="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p class="shrink-0 text-sm text-muted">Total {{ total }} user</p>
        <UPagination v-model:page="page" :total="total" :items-per-page="PAGE_SIZE" size="sm" variant="ghost" />
      </div>
    </template>
  </UCard>

  <UModal v-model:open="formOpen" :title="formMode === 'create' ? 'Tambah User' : 'Edit User'" :ui="{ content: 'max-w-4xl' }">
    <template #body>
      <form class="space-y-5" @submit.prevent="submitForm">
        <div class="grid gap-6 lg:grid-cols-2">
          <div class="space-y-4">
            <h3 class="font-medium">Informasi Akun</h3>
            <UFormField label="Nama lengkap" required>
              <UInput v-model="form.name" :disabled="formSubmitting" class="w-full" />
            </UFormField>
            <UFormField label="Nama panggilan" required>
              <UInput v-model="form.username" :disabled="formSubmitting" class="w-full" />
            </UFormField>
            <UFormField label="Email" required>
              <UInput v-model="form.email" type="email" :disabled="formSubmitting" class="w-full" />
            </UFormField>
            <UFormField label="Role" required>
              <USelect v-model="form.role" :items="roleOptions.filter(option => option.value !== 'all')" value-key="value" :disabled="formSubmitting" class="w-full" />
            </UFormField>
            <UFormField label="Avatar URL">
              <UInput v-model="form.avatar" :disabled="formSubmitting" class="w-full" />
            </UFormField>
            <UFormField label="Status">
              <USwitch v-model="form.isActive" :disabled="formSubmitting" label="Aktif" />
            </UFormField>
            <UFormField v-if="formMode === 'create'" label="Password" required help="Minimal 8 karakter">
              <UInput v-model="form.password" type="password" :disabled="formSubmitting" class="w-full" />
            </UFormField>
          </div>

          <div class="space-y-4">
            <h3 class="font-medium">Informasi Pribadi</h3>
            <UFormField label="Nomor HP">
              <UInput v-model="form.phone" :disabled="formSubmitting" class="w-full" />
            </UFormField>
            <UFormField label="Angkatan OJI">
              <UInput v-model="form.yearEnrolled" type="number" :disabled="formSubmitting" class="w-full" />
            </UFormField>
            <UFormField label="Kampus">
              <UInput v-model="form.university" :disabled="formSubmitting" class="w-full" />
            </UFormField>
            <UFormField label="Fakultas">
              <UInput v-model="form.faculty" :disabled="formSubmitting" class="w-full" />
            </UFormField>
            <UFormField label="Jurusan">
              <UInput v-model="form.major" :disabled="formSubmitting" class="w-full" />
            </UFormField>
          </div>
        </div>

        <p v-if="formError" class="rounded bg-red-50 px-3 py-2 text-sm text-red-600">
          {{ formError }}
        </p>

        <div class="flex justify-end gap-2 pt-2">
          <UButton color="neutral" variant="ghost" :disabled="formSubmitting" @click="formOpen = false">
            Batal
          </UButton>
          <UButton type="submit" color="primary" :loading="formSubmitting">
            {{ formMode === 'create' ? 'Buat User' : 'Simpan Perubahan' }}
          </UButton>
        </div>
      </form>
    </template>
  </UModal>

  <UModal v-model:open="confirm.open" :title="confirm.title">
    <template #body>
      <p class="text-sm text-muted">{{ confirm.description }}</p>
      <div class="flex justify-end gap-2 pt-4">
        <UButton color="neutral" variant="ghost" :disabled="confirmRunning" @click="confirm.open = false">
          Batal
        </UButton>
        <UButton :color="confirm.color" :loading="confirmRunning" @click="runConfirm">
          {{ confirm.confirmLabel }}
        </UButton>
      </div>
    </template>
  </UModal>
</template>
