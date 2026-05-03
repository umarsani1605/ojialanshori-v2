<template>
  <AppContent title="Dashboard Utama" :loading="pending">
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-emerald-100 text-emerald-600 rounded-lg">
            <UIcon name="i-lucide-users" class="w-6 h-6" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Total Santri</p>
            <h3 class="text-2xl font-bold text-gray-900">128</h3>
          </div>
        </div>
      </UCard>
      
      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-blue-100 text-blue-600 rounded-lg">
            <UIcon name="i-lucide-book-open" class="w-6 h-6" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Total Kelas</p>
            <h3 class="text-2xl font-bold text-gray-900">12</h3>
          </div>
        </div>
      </UCard>
      
      <UCard>
        <div class="flex items-center gap-4">
          <div class="p-3 bg-amber-100 text-amber-600 rounded-lg">
            <UIcon name="i-lucide-graduation-cap" class="w-6 h-6" />
          </div>
          <div>
            <p class="text-sm font-medium text-gray-500">Total Pengajar</p>
            <h3 class="text-2xl font-bold text-gray-900">24</h3>
          </div>
        </div>
      </UCard>
    </div>

    <UCard class="mt-8">
      <template #header>
        <h3 class="font-semibold text-gray-800">Aktivitas Terbaru</h3>
      </template>
      <div class="flex flex-col gap-4">
        <p class="text-gray-500 text-sm">Selamat datang, {{ user?.email || 'Administrator' }}! Ini adalah contoh tampilan halaman menggunakan struktur layout yang baru.</p>
        
        <!-- Contoh tabel zebra -->
        <div class="overflow-x-auto mt-4 border border-default rounded-lg">
          <table class="table-primary">
            <thead>
              <tr>
                <th>Tanggal</th>
                <th>Aktivitas</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>{{ new Date().toLocaleDateString('id-ID') }}</td>
                <td>Login ke sistem</td>
                <td><UBadge color="success" variant="subtle">Berhasil</UBadge></td>
              </tr>
              <tr>
                <td>Kemarin</td>
                <td>Update data santri</td>
                <td><UBadge color="success" variant="subtle">Berhasil</UBadge></td>
              </tr>
              <tr>
                <td>Kemarin</td>
                <td>Percobaan login</td>
                <td><UBadge color="error" variant="subtle">Gagal</UBadge></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </UCard>
  </AppContent>
</template>

<script setup>
definePageMeta({
  middleware: ['auth'] // Pastikan user login
})

const { user } = useUserSession()
const pending = ref(false)
</script>
