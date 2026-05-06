<script setup lang="ts">
definePageMeta({
  layout: 'dashboard-santri',
  middleware: ['auth'],
})

const auth = useAuth()

if (auth.isAdmin.value) {
  await navigateTo('/admin/profile', { replace: true })
}
</script>

<template>
  <DashboardProfileSettingsPage />
</template>
