<script setup lang="ts">
import { getRoleHomePath } from "~/utils/roleRoute";

definePageMeta({
  layout: false,
  middleware: ["guest"],
});

const { fetch: refreshSession } = useUserSession();
const posthog = usePostHog();

type LoginResponse = {
  user: {
    fullname: string;
    email: string;
    role: string;
  };
};

const state = reactive({
  identifier: "",
  password: "",
  remember: false,
});

const showPassword = ref(false);
const loading = ref(false);
const errorMessage = ref("");

const validate = (data: typeof state) => {
  const errors: { name: string; message: string }[] = [];
  if (!data.identifier) {
    errors.push({
      name: "identifier",
      message: "Email wajib diisi",
    });
  }
  if (!data.password) {
    errors.push({ name: "password", message: "Kata sandi wajib diisi" });
  }
  return errors;
};

async function onSubmit() {
  loading.value = true;
  errorMessage.value = "";
  try {
    const response = await $fetch<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: {
        identifier: state.identifier,
        password: state.password,
        remember: state.remember,
      },
    });
    await refreshSession();
    posthog?.identify(response.user.email, {
      email: response.user.email,
      fullname: response.user.fullname,
    });
    posthog?.capture("user_logged_in", { role: response.user.role });
    await navigateTo(getRoleHomePath(response.user.role));
  } catch (err: unknown) {
    const fetchError = err as { data?: { message?: string } };
    errorMessage.value =
      fetchError.data?.message ?? "Terjadi kesalahan. Coba lagi.";
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 flex items-center justify-center p-4">
    <div class="w-full max-w-md">
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
          Masuk Akun Santri
        </h1>

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
          <UFormField name="identifier" label="Email">
            <UInput
              v-model="state.identifier"
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
              autocomplete="current-password"
              :disabled="loading"
              class="w-full"
            >
              <template #trailing>
                <UButton
                  color="neutral"
                  variant="link"
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

          <UCheckbox
            v-model="state.remember"
            name="remember"
            label="Ingat saya"
          />

          <UButton
            type="submit"
            block
            :loading="loading"
            class="mt-2"
            color="primary"
          >
            Masuk
          </UButton>
        </UForm>

        <p class="text-sm text-center text-slate-500 mt-6">
          Belum punya akun?
          <NuxtLink
            to="/daftar"
            class="font-medium text-primary hover:underline"
          >
            Daftar akun santri
          </NuxtLink>
        </p>
      </div>
    </div>
  </div>
</template>
