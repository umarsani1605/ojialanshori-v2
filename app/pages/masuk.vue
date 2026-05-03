<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: ['guest'],
});

const { fetch: refreshSession } = useUserSession();

const state = reactive({
  identifier: '',
  password: '',
  remember: false,
});

const showPassword = ref(false);
const loading = ref(false);
const errorMessage = ref('');

const validate = (data: typeof state) => {
  const errors: { name: string; message: string }[] = [];
  if (!data.identifier) {
    errors.push({ name: 'identifier', message: 'Email atau username wajib diisi' });
  }
  if (!data.password) {
    errors.push({ name: 'password', message: 'Kata sandi wajib diisi' });
  }
  return errors;
};

async function onSubmit() {
  loading.value = true;
  errorMessage.value = '';
  try {
    await $fetch('/api/auth/login', {
      method: 'POST',
      body: {
        identifier: state.identifier,
        password: state.password,
        remember: state.remember,
      },
    });
    await refreshSession();
    await navigateTo('/dashboard');
  } catch (err: unknown) {
    const fetchError = err as { data?: { message?: string } };
    errorMessage.value = fetchError.data?.message ?? 'Terjadi kesalahan. Coba lagi.';
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-neutral-100 flex items-center justify-center p-4">
    <div class="w-full max-w-sm">
      <div class="bg-white rounded-2xl shadow-sm border border-neutral-100 px-8 py-10">
        <!-- Logo -->
        <div class="flex justify-center mb-6">
          <NuxtImg src="/logo.png" alt="Logo Omah Ngaji Al-Anshori" class="h-20 w-auto object-contain" />
        </div>

        <!-- Title -->
        <h1 class="text-xl font-semibold text-center text-neutral-800 mb-6">Masuk Akun Santri</h1>

        <!-- Error alert -->
        <UAlert v-if="errorMessage" color="error" variant="soft" :description="errorMessage" class="mb-4" />

        <!-- Form -->
        <UForm :state="state" :validate="validate" class="space-y-4" @submit="onSubmit">
          <UFormField name="identifier" label="Username atau Email">
            <UInput
              v-model="state.identifier"
              placeholder="admin@ojialanshori.com"
              type="text"
              autocomplete="username"
              :disabled="loading"
              class="w-full"
            />
          </UFormField>

          <UFormField name="password" label="Kata Sandi">
            <UInput
              v-model="state.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              autocomplete="current-password"
              :disabled="loading"
              class="w-full"
              :trailing-icon="showPassword ? 'i-lucide-eye-off' : 'i-lucide-eye'"
              @click:trailing="showPassword = !showPassword"
            />
          </UFormField>

          <div class="flex items-center gap-2">
            <input
              id="remember"
              v-model="state.remember"
              type="checkbox"
              class="h-4 w-4 rounded border-neutral-300 text-primary-600 focus:ring-primary-500"
            />
            <label for="remember" class="text-sm text-neutral-600 cursor-pointer"> Ingat saya </label>
          </div>

          <UButton type="submit" block :loading="loading" class="mt-2" color="primary"> Masuk </UButton>
        </UForm>

        <!-- Register link (disabled until registration flow exists) -->
        <p class="text-sm text-center text-neutral-500 mt-6">
          Belum punya akun?
          <span>Daftar akun santri</span>
        </p>
      </div>
    </div>
  </div>
</template>
