<template>
  <UApp>
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>

<script setup>
const colorMode = useColorMode()

onMounted(() => {
  // Memaksa mode terang dan menimpa key vueuse/nuxt color scheme yang tersimpan di browser
  if (colorMode.preference !== 'light') {
    colorMode.preference = 'light'
  }
})
</script>
