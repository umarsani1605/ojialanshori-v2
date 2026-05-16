<script setup lang="ts">
const props = defineProps<{ template: string }>();
const toast = useToast();

const { data, refresh } = useLazyFetch<{
  data: { title: string; meta: Record<string, any> };
}>(`/api/pages/${props.template}`, {
  key: `admin-page-${props.template}`,
});
const title = ref("");
const meta = ref<Record<string, any>>({});
const saving = ref(false);

watch(
  () => data.value?.data,
  (newData) => {
    if (newData) {
      title.value = newData.title;
      const newMeta = newData.meta;
      // Parse if it's a string, or assign directly if JSON object
      meta.value =
        typeof newMeta === "string" ? JSON.parse(newMeta) : { ...newMeta };
    } else {
      // Initialize default structures based on template
      title.value = props.template;
      if (props.template === "home") {
        meta.value = {
          subtitle: "",
          description: "",
          features: "",
          maxNews: 3,
          maxPena: 3,
        };
      } else if (props.template === "profile") {
        meta.value = { overview: "", vision: "", mission: "" };
      }
    }
  },
  { immediate: true },
);

async function save() {
  saving.value = true;
  try {
    await $fetch(`/api/pages/${props.template}`, {
      method: "PATCH",
      body: {
        title: title.value,
        meta: meta.value,
      },
    });
    toast.add({
      title: "Perubahan disimpan",
      color: "success",
      icon: "i-ph-check-circle",
    });
    await refresh();
  } catch (error: unknown) {
    toast.add({
      title: "Gagal menyimpan",
      description: errorMessage(error),
      color: "error",
      icon: "i-ph-x-circle",
    });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="min-h-[calc(100vh-60px)] bg-slate-50 pb-8">
    <div class="flex items-center justify-between px-2 mb-6">
      <UButton
        to="/admin/pages"
        variant="link"
        color="neutral"
        icon="i-ph-arrow-left"
        class="-ml-2"
      >
        Kembali
      </UButton>
    </div>

    <div class="space-y-6">
      <div
        class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
      >
        <div class="space-y-2">
          <h2 class="text-lg font-semibold">Pengaturan Halaman {{ title }}</h2>
        </div>
        <UButton color="primary" :loading="saving" @click="save">
          Simpan
        </UButton>
      </div>

      <!-- Home Template Form -->
      <UCard v-if="template === 'home'">
        <div class="space-y-6">
          <div class="space-y-6 max-w-3xl">
            <div class="text-lg font-semibold">Header Utama</div>
            <UFormField label="Subjudul" name="subtitle">
              <UInput v-model="meta.subtitle" class="w-full" />
            </UFormField>
            <UFormField label="Judul" name="title">
              <UInput v-model="meta.title" class="w-full" />
            </UFormField>
            <UFormField label="Deskripsi" name="description">
              <UTextarea v-model="meta.description" class="w-full" :rows="5" />
            </UFormField>
          </div>
          <USeparator />
          <div class="space-y-6 max-w-3xl">
            <div class="text-lg font-semibold">Konten</div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <UFormField label="Maks Berita Ditampilkan" name="maxNews">
                <UInput v-model="meta.maxNews" type="number" class="w-full" />
              </UFormField>
              <UFormField label="Maks Pena Santri Ditampilkan" name="maxPena">
                <UInput v-model="meta.maxPena" type="number" class="w-full" />
              </UFormField>
            </div>
          </div>
          <USeparator />
          <div class="space-y-6">
            <div class="text-lg font-semibold">Kata Alumni</div>
            <AdminTestimonialsPage :card="false" />
          </div>
        </div>
      </UCard>

      <!-- Profile Template Form -->
      <UCard v-else-if="template === 'profile'">
        <div class="space-y-6">
          <div class="space-y-6 max-w-3xl">
            <UFormField label="Selayang Pandang" name="overview">
              <UTextarea v-model="meta.overview" class="w-full" :rows="10" />
            </UFormField>
            <UFormField label="Visi" name="vision">
              <UTextarea v-model="meta.vision" class="w-full" :rows="2" />
            </UFormField>
            <UFormField label="Misi" name="mission">
              <UTextarea
                v-model="meta.mission"
                class="w-full"
                :rows="10"
                placeholder="Gunakan baris baru untuk memisahkan poin"
              />
            </UFormField>
          </div>
          <USeparator />
          <div class="space-y-6">
            <div class="text-lg font-semibold">Pengurus</div>
            <AdminBoardMembersPage :card="false" />
          </div>
        </div>
      </UCard>

      <!-- Activities Template Form -->
      <UCard v-else-if="template === 'activities'">
        <div class="space-y-6">
          <div class="text-lg font-semibold">Program</div>
          <AdminActivitiesPage :card="false" />
        </div>
      </UCard>

      <!-- FAQ Template Form -->
      <UCard v-else-if="template === 'faq'">
        <div class="space-y-6">
          <div class="text-lg font-semibold">Daftar Tanya-Jawab</div>
          <AdminFaqsPage :card="false" />
        </div>
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
