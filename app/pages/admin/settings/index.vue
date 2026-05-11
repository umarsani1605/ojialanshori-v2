<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
  navbarTitle: 'Pengaturan',
})

type Setting = {
  key: string;
  value: string;
  updatedAt: string;
};

const toast = useToast();

const { data, refresh } = useLazyFetch<{ data: Setting[] }>("/api/settings", {
  key: "admin-settings",
});
const settings = computed(() => data.value?.data ?? []);

const form = reactive({
  site_name: "",
  site_description: "",
  contact_address: "",
  contact_wa_putra: "",
  contact_wa_putri: "",
  social_facebook: "",
  social_instagram: "",
  social_youtube_link: "",
  social_youtube_embed: "",
  social_tiktok: "",
});
const saving = ref(false);

watch(
  settings,
  (rows) => {
    for (const row of rows) {
      if (row.key in form) form[row.key as keyof typeof form] = row.value;
    }
  },
  { immediate: true },
);

async function save() {
  saving.value = true;
  try {
    await $fetch("/api/settings", {
      method: "PATCH",
      body: { updates: { ...form } },
    });
    toast.add({
      title: "Pengaturan disimpan",
      color: "success",
      icon: "i-ph-check-circle",
    });
    await refresh();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Terjadi kesalahan.";
    toast.add({
      title: "Gagal menyimpan",
      description: msg,
      color: "error",
      icon: "i-ph-x-circle",
    });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="space-y-8 max-w-3xl">
    <div
      class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
    >
      <div>
        <h2 class="text-lg font-semibold">Pengaturan Website</h2>
      </div>
      <UButton
        label="Simpan Perubahan"
        :loading="saving"
        @click="save"
        color="primary"
      />
    </div>

    <!-- SEO dan Identitas Website -->
    <UCard>
      <template #header>
        <h3 class="font-medium">Identitas Website dan SEO</h3>
      </template>
      <div class="space-y-4">
        <UFormField label="Nama Situs" name="site_name">
          <UInput v-model="form.site_name" class="w-full" />
        </UFormField>
        <UFormField label="Deskripsi Situs" name="site_description">
          <UTextarea v-model="form.site_description" class="w-full" :rows="3" />
        </UFormField>
      </div>
    </UCard>

    <!-- Kontak -->
    <UCard>
      <template #header><h3 class="font-medium">Kontak</h3></template>
      <div class="space-y-4">
        <UFormField label="Nomor WhatsApp Putra" name="contact_wa_putra">
          <UInput
            v-model="form.contact_wa_putra"
            class="w-full"
            placeholder="+628..."
          />
        </UFormField>
        <UFormField label="Nomor WhatsApp Putri" name="contact_wa_putri">
          <UInput
            v-model="form.contact_wa_putri"
            class="w-full"
            placeholder="+628..."
          />
        </UFormField>
      </div>
    </UCard>

    <!-- Sosial Media -->
    <UCard>
      <template #header><h3 class="font-medium">Sosial Media</h3></template>
      <div class="space-y-4">
        <UFormField label="Link Facebook" name="social_facebook">
          <UInput v-model="form.social_facebook" class="w-full" />
        </UFormField>
        <UFormField label="Link Instagram" name="social_instagram">
          <UInput v-model="form.social_instagram" class="w-full" />
        </UFormField>
        <UFormField label="Link YouTube" name="social_youtube_link">
          <UInput v-model="form.social_youtube_link" class="w-full" />
        </UFormField>
        <UFormField label="Link TikTok" name="social_tiktok">
          <UInput v-model="form.social_tiktok" class="w-full" />
        </UFormField>
        <UFormField
          label="YouTube Embed"
          name="social_youtube_embed"
          help="Video akan tampil di halaman depan"
        >
          <UInput v-model="form.social_youtube_embed" class="w-full" />
        </UFormField>
      </div>
    </UCard>
  </div>
</template>
