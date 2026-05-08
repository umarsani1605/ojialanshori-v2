<script setup lang="ts">
definePageMeta({
  layout: false,
  middleware: ['guest'],
})

const state = reactive({
  fullname: '',
  email: '',
  password: '',
  passwordConfirmation: '',
})

const success = ref(false)
const loading = ref(false)
const errorMessage = ref('')
const showPassword = ref(false)
const showPasswordConfirmation = ref(false)

const validate = (data: typeof state) => {
  const errors: { name: string; message: string }[] = []

  if (!data.fullname) {
    errors.push({ name: 'fullname', message: 'Nama lengkap wajib diisi' })
  }

  if (!data.email) {
    errors.push({ name: 'email', message: 'Email wajib diisi' })
  }

  if (!data.password) {
    errors.push({ name: 'password', message: 'Kata sandi wajib diisi' })
  }

  if (!data.passwordConfirmation) {
    errors.push({ name: 'passwordConfirmation', message: 'Ulangi kata sandi wajib diisi' })
  }

  return errors
}

async function onSubmit() {
  loading.value = true
  errorMessage.value = ''

  try {
    await $fetch('/api/auth/register', {
      method: 'POST',
      body: { 
        fullname: state.fullname,
        email: state.email,
        password: state.password,
        passwordConfirmation: state.passwordConfirmation
      },
    })

    success.value = true
  } catch (error: unknown) {
    const fetchError = error as { data?: { message?: string } }
    errorMessage.value = fetchError.data?.message ?? 'Terjadi kesalahan. Coba lagi.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen bg-slate-100 px-4 py-6 md:px-6 md:py-10">
    <div class="mx-auto w-full max-w-6xl rounded-[2rem] border border-slate-100 bg-white px-6 py-10 shadow-sm md:px-12 md:py-14">
      <div class="mx-auto max-w-4xl">
        <div class="mb-8 flex justify-center">
          <NuxtImg
            src="/logo.png"
            alt="Logo Omah Ngaji Al-Anshori"
            class="h-28 w-auto object-contain md:h-32"
          />
        </div>

        <h1 class="mb-8 text-center text-4xl font-semibold text-slate-800 md:text-5xl">
          Daftar Akun Santri
        </h1>

        <div class="mx-auto mb-6 max-w-4xl rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5 text-center text-xl leading-relaxed text-emerald-600 md:px-10 md:text-2xl">
          Pendaftaran dikhususkan untuk santri Omah Ngaji Al-Anshori dan akan melalui proses verifikasi.
        </div>

        <div v-if="success" class="mx-auto max-w-4xl space-y-6">
          <div class="rounded-2xl border border-emerald-200 bg-emerald-50 px-6 py-5 text-center text-xl leading-relaxed text-emerald-600 md:px-10 md:text-2xl">
            Terimakasih telah mendaftar! Akun kamu akan diverifikasi oleh tim kami, silahkan ditunggu terlebih dahulu atau hubungi admin.
          </div>

          <UButton
            to="/"
            block
            color="primary"
            class="h-16 rounded-2xl text-2xl font-medium"
          >
            Kembali ke Beranda
          </UButton>
        </div>

        <div v-else class="mx-auto max-w-4xl">
          <UAlert
            v-if="errorMessage"
            color="error"
            variant="soft"
            :description="errorMessage"
            class="mb-6"
          />

          <UForm
            :state="state"
            :validate="validate"
            class="space-y-7"
            @submit="onSubmit"
          >
            <UFormField name="fullname" label="Nama Lengkap" class="text-xl">
              <UInput
                v-model="state.fullname"
                :disabled="loading"
                class="w-full"
                size="xl"
              />
            </UFormField>

            <UFormField name="email" label="Email" class="text-xl">
              <UInput
                v-model="state.email"
                type="email"
                autocomplete="email"
                :disabled="loading"
                class="w-full"
                size="xl"
              />
            </UFormField>

            <UFormField name="password" label="Kata Sandi" class="text-xl">
              <UInput
                v-model="state.password"
                :type="showPassword ? 'text' : 'password'"
                autocomplete="new-password"
                :disabled="loading"
                class="w-full"
                size="xl"
              >
                <template #trailing>
                  <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    :icon="showPassword ? 'i-ph-eye-slash' : 'i-ph-eye'"
                    :aria-label="showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
                    @click="showPassword = !showPassword"
                  />
                </template>
              </UInput>
            </UFormField>

            <UFormField name="passwordConfirmation" label="Ulangi Kata Sandi" class="text-xl">
              <UInput
                v-model="state.passwordConfirmation"
                :type="showPasswordConfirmation ? 'text' : 'password'"
                autocomplete="new-password"
                :disabled="loading"
                class="w-full"
                size="xl"
              >
                <template #trailing>
                  <UButton
                    color="neutral"
                    variant="link"
                    size="sm"
                    :icon="showPasswordConfirmation ? 'i-ph-eye-slash' : 'i-ph-eye'"
                    :aria-label="showPasswordConfirmation ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'"
                    @click="showPasswordConfirmation = !showPasswordConfirmation"
                  />
                </template>
              </UInput>
            </UFormField>

            <UButton
              type="submit"
              block
              color="primary"
              :loading="loading"
              class="mt-6 h-16 rounded-2xl text-2xl font-medium"
            >
              Daftar Akun
            </UButton>
          </UForm>
        </div>
      </div>
    </div>
  </div>
</template>
