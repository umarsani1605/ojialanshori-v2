<script setup lang="ts">
const props = defineProps<{ template: string }>()
const toast = useToast()

const { data, refresh } = useFetch<{ data: { meta: Record<string, any> } }>(`/api/pages/${props.template}`)
const meta = ref<Record<string, any>>({})
const saving = ref(false)

watch(() => data.value?.data?.meta, (newMeta) => {
  if (newMeta) {
    // Parse if it's a string, or assign directly if JSON object
    meta.value = typeof newMeta === 'string' ? JSON.parse(newMeta) : { ...newMeta }
  } else {
    // Initialize default structures based on template
    if (props.template === 'home') {
      meta.value = { subtitle: '', description: '', features: '', maxNews: 3, maxPena: 3 }
    } else if (props.template === 'profile') {
      meta.value = { overview: '', vision: '', mission: '' }
    }
  }
}, { immediate: true })

async function save() {
  saving.value = true
  try {
    await $fetch(`/api/pages/${props.template}`, {
      method: 'PATCH',
      body: { meta: meta.value }
    })
    toast.add({ title: 'Perubahan disimpan', color: 'success' })
    await refresh()
  } catch (e: any) {
    toast.add({ title: 'Gagal menyimpan', description: e.message, color: 'error' })
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-60px)] bg-slate-50 pb-8">
    <!-- Action Bar -->
    <div class="flex items-center justify-between px-2 mb-6">
      <UButton to="/admin/pages" variant="link" color="neutral" icon="i-ph-arrow-left" class="-ml-2">
        Kembali
      </UButton>
      <UButton color="primary" :loading="saving" @click="save">
        Simpan Perubahan
      </UButton>
    </div>

    <!-- Main Content Area -->
    <div class="max-w-3xl mx-auto px-2 sm:px-0">
      <h2 class="text-xl font-bold mb-4 capitalize">Pengaturan: {{ template }}</h2>

      <!-- Home Template Form -->
      <UCard v-if="template === 'home'" class="space-y-5">
        <UFormField label="Subjudul (Hero)" name="subtitle">
          <UInput v-model="meta.subtitle" class="w-full" />
        </UFormField>
        <UFormField label="Deskripsi (Hero)" name="description">
          <UTextarea v-model="meta.description" class="w-full" :rows="3" />
        </UFormField>
        <UFormField label="Teks Features" name="features">
          <UTextarea v-model="meta.features" class="w-full" :rows="3" placeholder="Gunakan baris baru untuk memisahkan item" />
        </UFormField>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <UFormField label="Maks Berita Ditampilkan" name="maxNews">
            <UInput v-model="meta.maxNews" type="number" class="w-full" />
          </UFormField>
          <UFormField label="Maks Pena Santri Ditampilkan" name="maxPena">
            <UInput v-model="meta.maxPena" type="number" class="w-full" />
          </UFormField>
        </div>
      </UCard>

      <!-- Profile Template Form -->
      <UCard v-else-if="template === 'profile'" class="space-y-5">
        <UFormField label="Selayang Pandang" name="overview">
          <UTextarea v-model="meta.overview" class="w-full" :rows="5" />
        </UFormField>
        <UFormField label="Visi" name="vision">
          <UTextarea v-model="meta.vision" class="w-full" :rows="3" />
        </UFormField>
        <UFormField label="Misi" name="mission">
          <UTextarea v-model="meta.mission" class="w-full" :rows="5" placeholder="Gunakan baris baru untuk memisahkan poin" />
        </UFormField>
      </UCard>

      <!-- Fallback / Empty State -->
      <UCard v-else>
        <div class="text-center py-8 text-muted">
          Konfigurasi untuk halaman ini tidak memerlukan form spesifik di sini.
        </div>
      </UCard>
    </div>
  </div>
</template>