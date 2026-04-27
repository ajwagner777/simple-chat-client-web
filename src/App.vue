<script setup lang="ts">
import { onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from './stores/auth'

const auth = useAuthStore()
const router = useRouter()

onMounted(async () => {
  await auth.bootstrap()
  if (!auth.isAuthenticated()) {
    const route = router.currentRoute.value
    if (route.meta.requiresAuth) {
      router.push('/login')
    }
  }
})
</script>

<template>
  <RouterView />
</template>
