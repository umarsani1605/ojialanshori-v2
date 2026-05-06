<script setup lang="ts">
const { data: settings } = await useFetch<Record<string, string>>(
  "/api/public/settings",
  {
    key: "public-settings",
    default: () => ({}),
  },
);

const address = computed(
  () =>
    settings.value?.contact_address ??
    "Ngemplak, RT.01/RW.29, Mojosongo, Kec. Jebres, Kota Surakarta, Jawa Tengah 57127",
);

const email = computed(
  () => settings.value?.contact_email ?? "kontak@ojialanshori.com",
);

const whatsappPutra = computed(
  () => settings.value?.contact_whatsapp_putra ?? "0881-0261-69525",
);

const whatsappPutri = computed(
  () => settings.value?.contact_whatsapp_putri ?? "0823-2846-2702",
);

const mapsEmbedUrl = computed(
  () =>
    settings.value?.contact_maps_embed ??
    settings.value?.maps_embed ??
    "https://www.google.com/maps/embed?pb=!1m14!1m8!1m3!1d4439.636936115365!2d110.85348123043434!3d-7.545847830514026!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x2e7a16e1cb921e67%3A0xf2ca3eeac2c4569e!2sPesantren%20Mahasiswa%20Omah%20Ngaji%20Al%20Anshori!5e0!3m2!1sid!2sid!4v1730611092747!5m2!1sid!2sid",
);

useSeoMeta({
  title: "Kontak",
  description: "Informasi kontak dan lokasi Omah Ngaji Al-Anshori.",
});
</script>

<template>
  <section class="py-16 md:py-20">
    <UContainer>
      <div class="mx-auto max-w-6xl">
        <PublicSectionHeading title="Kontak" />

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
          <div
            class="flex flex-col items-start text-left p-6 rounded-2xl border border-slate-200 bg-white"
          >
            <div class="flex w-full gap-8">
              <div
                class="mt-1 flex size-10 w-10 max-w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-500"
              >
                <UIcon name="i-lucide-map-pin" class="size-5" />
              </div>
              <div class="min-w-0">
                <h3 class="text-xl font-bold">Alamat</h3>
                <p class="mt-3 text-base leading-8 text-muted">
                  {{ address }}
                </p>
              </div>
            </div>
          </div>

          <div
            class="flex flex-col items-start text-left p-6 rounded-2xl border border-slate-200 bg-white"
          >
            <div class="flex w-full gap-8">
              <div
                class="mt-1 flex size-10 w-10 max-w-10 shrink-0 items-center justify-center rounded-2xl bg-brand-50 text-brand-500"
              >
                <UIcon name="i-simple-icons-whatsapp" class="size-5" />
              </div>
              <div class="min-w-0">
                <h3 class="text-xl font-bold">WhatsApp</h3>

                <div class="mt-3 space-y-6 text-base text-muted">
                  <div>
                    <p>Kontak putra:</p>
                    <a
                      :href="`https://wa.me/${whatsappPutra.replace(/\D/g, '')}`"
                      target="_blank"
                      rel="noopener"
                      class="mt-1 inline-block transition-colors hover:text-brand-600"
                    >
                      {{ whatsappPutra }}
                    </a>
                  </div>

                  <div>
                    <p>Kontak putri:</p>
                    <a
                      :href="`https://wa.me/${whatsappPutri.replace(/\D/g, '')}`"
                      target="_blank"
                      rel="noopener"
                      class="mt-1 inline-block transition-colors hover:text-brand-600"
                    >
                      {{ whatsappPutri }}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          class="mt-8 overflow-hidden rounded-3xl border border-default bg-white"
        >
          <iframe
            :src="mapsEmbedUrl"
            title="Peta lokasi Omah Ngaji Al-Anshori"
            class="h-90 w-full md:h-180"
            loading="lazy"
            allowfullscreen
            referrerpolicy="no-referrer-when-downgrade"
          />
        </div>
      </div>
    </UContainer>
  </section>
</template>
