<script setup lang="ts">
definePageMeta({
  layout: 'admin',
  middleware: ['auth', 'role'],
  requiredRole: 'admin',
  navbarTitle: 'Banner',
})

type BannerForm = {
  text: string;
  link: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
};

type BannerResponse = {
  data: {
    text: string;
    link: string | null;
    isActive: boolean;
    startDate: string | null;
    endDate: string | null;
  };
};

const toast = useToast();
const saving = ref(false);

const form = reactive<BannerForm>({
  text: "",
  link: "",
  isActive: false,
  startDate: "",
  endDate: "",
});

const { data, status, refresh } = useLazyFetch<BannerResponse>("/api/banners", {
  key: "admin-banner",
});

watch(
  () => data.value?.data,
  (banner) => {
    form.text = banner?.text ?? "";
    form.link = banner?.link ?? "";
    form.isActive = banner?.isActive ?? false;
    form.startDate = banner?.startDate ?? "";
    form.endDate = banner?.endDate ?? "";
  },
  { immediate: true },
);

const isLoading = computed(() => status.value === "pending");

async function save() {
  saving.value = true;
  try {
    await $fetch("/api/banners", {
      method: "POST",
      body: {
        text: form.text,
        link: form.link || undefined,
        isActive: form.isActive,
        startDate: form.startDate || undefined,
        endDate: form.endDate || undefined,
      },
    });

    toast.add({
      title: "Banner disimpan",
      color: "success",
      icon: "i-ph-check-circle",
    });

    await refresh();
  } catch (error: unknown) {
    const message =
      error instanceof Error ? error.message : "Terjadi kesalahan.";
    toast.add({
      title: "Gagal menyimpan banner",
      description: message,
      color: "error",
      icon: "i-ph-x-circle",
    });
  } finally {
    saving.value = false;
  }
}
</script>

<template>
  <div class="max-w-3xl space-y-6">
    <div
      class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
    >
      <div class="space-y-2">
        <h2 class="text-lg font-semibold">Pengumuman</h2>
        <p class="text-sm text-muted">
          Pengumuman ini tampil di halaman publik website.
        </p>
      </div>
      <UButton label="Simpan" :loading="saving" @click="save" />
    </div>

    <UCard>
      <div v-if="isLoading" class="space-y-4">
        <USkeleton class="h-5 w-40" />
        <USkeleton class="h-24 w-full" />
        <USkeleton class="h-10 w-full" />
        <div class="grid gap-4 md:grid-cols-2">
          <USkeleton class="h-10 w-full" />
          <USkeleton class="h-10 w-full" />
        </div>
        <USkeleton class="h-10 w-32" />
      </div>

      <div v-else class="space-y-5">
        <UFormField label="Teks" required>
          <UTextarea
            v-model="form.text"
            :rows="4"
            class="w-full"
            placeholder="Contoh: Pendaftaran santri baru sudah dibuka."
          />
        </UFormField>

        <UFormField label="Link">
          <UInput
            v-model="form.link"
            class="w-full"
            placeholder="https://..."
          />
        </UFormField>

        <div class="grid gap-4 md:grid-cols-2">
          <UFormField label="Tanggal Mulai">
            <UInput v-model="form.startDate" type="date" class="w-full" />
          </UFormField>

          <UFormField label="Tanggal Selesai">
            <UInput v-model="form.endDate" type="date" class="w-full" />
          </UFormField>
        </div>

        <UFormField label="Status">
          <USwitch v-model="form.isActive" label="Aktif" />
        </UFormField>
      </div>
    </UCard>
  </div>
</template>
