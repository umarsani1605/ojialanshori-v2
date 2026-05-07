<script setup lang="ts">
type Setting = {
  key: string
  value: string
  updatedAt: string
}

const toast = useToast()

const { data, refresh } = useLazyFetch<{ data: Setting[] }>('/api/settings')
const settings = computed(() => data.value?.data ?? [])

const form = reactive<Record<string, string>>({})
const saving = ref(false)

watch(settings, (rows) => {
  for (const row of rows) {
    form[row.key] = row.value
  }
}, { immediate: true })

async function save() {
  saving.value = true
  try {
    await $fetch('/api/settings', {
      method: 'PATCH',
      body: { updates: { ...form } },
    })
    toast.add({ title: 'Pengaturan disimpan', color: 'success', icon: 'i-lucide-check-circle' })
    await refresh()
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Terjadi kesalahan.'
    toast.add({ title: 'Gagal menyimpan', description: msg, color: 'error', icon: 'i-lucide-x-circle' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="space-y-6 max-w-2xl">
    <p class="text-muted text-sm">Konfigurasi global website.</p>

    <div v-if="settings.length === 0" class="py-12 text-center">
      <p class="text-muted">Belum ada pengaturan yang tersimpan di database.</p>
    </div>

    <div v-else class="space-y-4">
      <UFormField
        v-for="setting in settings"
        :key="setting.key"
        :label="setting.key"
      >
        <UInput v-model="form[setting.key]" class="w-full" />
      </UFormField>
    </div>

    <div v-if="settings.length > 0" class="flex justify-end">
      <UButton label="Simpan Semua" :loading="saving" @click="save" />
    </div>
  </div>
</template>
