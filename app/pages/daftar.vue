<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: ["guest"],
});

const state = reactive({
  fullname: "",
  email: "",
  password: "",
  passwordConfirmation: "",
});

const success = ref(false);
const loading = ref(false);
const errorMessage = ref("");
const showPassword = ref(false);
const showPasswordConfirmation = ref(false);

const validate = (data: typeof state) => {
  const errors: { name: string; message: string }[] = [];

  if (!data.fullname) {
    errors.push({ name: "fullname", message: "Nama lengkap wajib diisi" });
  }

  if (!data.email) {
    errors.push({ name: "email", message: "Email wajib diisi" });
  }

  if (!data.password) {
    errors.push({ name: "password", message: "Kata sandi wajib diisi" });
  }

  if (!data.passwordConfirmation) {
    errors.push({
      name: "passwordConfirmation",
      message: "Ulangi kata sandi wajib diisi",
    });
  }

  return errors;
};

async function onSubmit() {
  loading.value = true;
  errorMessage.value = "";

  try {
    await $fetch("/api/auth/register", {
      method: "POST",
      body: {
        fullname: state.fullname,
        email: state.email,
        password: state.password,
        passwordConfirmation: state.passwordConfirmation,
      },
    });

    success.value = true;
  } catch (error: unknown) {
    const fetchError = error as { data?: { message?: string } };
    errorMessage.value =
      fetchError.data?.message ?? "Terjadi kesalahan. Coba lagi.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 flex items-center justify-center p-4">
    <div class="w-full max-w-lg">
      <div
        class="bg-white rounded-2xl shadow-sm border border-slate-100 px-8 py-10"
      >
        <!-- Logo -->
        <div class="flex justify-center mb-6">
          <img
            src="/logo.png"
            alt="Logo Omah Ngaji Al-Anshori"
            class="h-20 w-auto object-contain"
          />
        </div>

        <!-- Title -->
        <h1 class="text-xl font-semibold text-center text-slate-800 mb-6">
          Daftar Akun Santri
        </h1>

        <div v-if="success" class="space-y-6">
          <div
            class="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm leading-relaxed text-emerald-600"
          >
            Terimakasih telah mendaftar! Akun kamu akan diverifikasi oleh tim
            kami, silahkan ditunggu terlebih dahulu atau hubungi admin.
          </div>

          <UButton to="/" block color="primary" class="mt-4">
            Kembali ke Beranda
          </UButton>
        </div>

        <div v-else>
          <div
            class="mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-center text-sm leading-relaxed text-emerald-600"
          >
            Pendaftaran dikhususkan untuk santri Omah Ngaji Al-Anshori dan akan
            melalui proses verifikasi.
          </div>

          <!-- Error alert -->
          <UAlert
            v-if="errorMessage"
            color="error"
            variant="soft"
            :description="errorMessage"
            class="mb-4"
          />

          <!-- Form -->
          <UForm
            :state="state"
            :validate="validate"
            class="space-y-4"
            @submit="onSubmit"
          >
            <UFormField name="fullname" label="Nama Lengkap">
              <UInput
                v-model="state.fullname"
                placeholder="Fulan bin Fulan"
                :disabled="loading"
                class="w-full"
              />
            </UFormField>

            <UFormField name="email" label="Email">
              <UInput
                v-model="state.email"
                placeholder="santri@ojialanshori.com"
                type="email"
                autocomplete="email"
                :disabled="loading"
                class="w-full"
              />
            </UFormField>

            <UFormField name="password" label="Kata Sandi">
              <UInput
                v-model="state.password"
                :type="showPassword ? 'text' : 'password'"
                placeholder="••••••••"
                autocomplete="new-password"
                :disabled="loading"
                class="w-full"
              >
                <template #trailing>
                  <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    :icon="showPassword ? 'i-ph-eye-slash' : 'i-ph-eye'"
                    :aria-label="
                      showPassword
                        ? 'Sembunyikan kata sandi'
                        : 'Tampilkan kata sandi'
                    "
                    @click="showPassword = !showPassword"
                  />
                </template>
              </UInput>
            </UFormField>

            <UFormField name="passwordConfirmation" label="Ulangi Kata Sandi">
              <UInput
                v-model="state.passwordConfirmation"
                :type="showPasswordConfirmation ? 'text' : 'password'"
                placeholder="••••••••"
                autocomplete="new-password"
                :disabled="loading"
                class="w-full"
              >
                <template #trailing>
                  <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    :icon="
                      showPasswordConfirmation ? 'i-ph-eye-slash' : 'i-ph-eye'
                    "
                    :aria-label="
                      showPasswordConfirmation
                        ? 'Sembunyikan kata sandi'
                        : 'Tampilkan kata sandi'
                    "
                    @click="
                      showPasswordConfirmation = !showPasswordConfirmation
                    "
                  />
                </template>
              </UInput>
            </UFormField>

            <UButton
              type="submit"
              block
              :loading="loading"
              class="mt-6"
              color="primary"
            >
              Daftar Akun
            </UButton>
          </UForm>

          <p class="text-sm text-center text-slate-500 mt-6">
            Sudah punya akun?
            <NuxtLink
              to="/masuk"
              class="font-medium text-primary hover:underline"
            >
              Masuk di sini
            </NuxtLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
