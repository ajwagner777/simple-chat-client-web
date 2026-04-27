<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAuthStore } from '../stores/auth'
import { usersApi } from '../api/users'

const auth = useAuthStore()

const name = ref('')
const location = ref('')
const loading = ref(false)
const success = ref(false)
const error = ref('')

onMounted(() => {
  name.value = auth.user?.name || ''
  location.value = auth.user?.location || ''
})

async function submit() {
  error.value = ''
  success.value = false
  loading.value = true
  try {
    const res = await usersApi.updateProfile({ name: name.value, location: location.value })
    auth.user = res.data.user
    success.value = true
    setTimeout(() => (success.value = false), 3000)
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    error.value = err.response?.data?.message || 'Could not update profile.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="profile-page">
    <div class="profile-card">
      <div class="profile-header">
        <RouterLink to="/" class="back-link">← Back to Chat</RouterLink>
        <h2>My Profile</h2>
      </div>

      <div class="avatar-block">
        <div class="avatar">{{ auth.user?.name?.[0]?.toUpperCase() }}</div>
        <div>
          <p class="font-semibold">{{ auth.user?.name }}</p>
          <p class="text-muted text-sm">{{ auth.user?.email }}</p>
        </div>
      </div>

      <form @submit.prevent="submit" class="profile-form">
        <div class="form-group">
          <label for="pname">Display Name</label>
          <input id="pname" v-model="name" type="text" placeholder="Your name" required />
        </div>
        <div class="form-group">
          <label for="location">Location</label>
          <input id="location" v-model="location" type="text" placeholder="City, Country (optional)" />
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <p v-if="success" class="success-msg">✓ Profile updated!</p>
        <button type="submit" class="btn-primary" :disabled="loading">
          {{ loading ? 'Saving…' : 'Save Changes' }}
        </button>
      </form>
    </div>
  </div>
</template>

<style scoped>
.profile-page {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  min-height: 100dvh;
  background: var(--color-bg);
  padding: 3rem 1rem;
}
.profile-card {
  width: 100%;
  max-width: 480px;
  background: var(--color-bg-2);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}
.profile-header {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}
.profile-header h2 { font-size: 1.3rem; }
.back-link { font-size: 0.85rem; }
.avatar-block {
  display: flex;
  align-items: center;
  gap: 1rem;
}
.avatar {
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.3rem;
  font-weight: 700;
  flex-shrink: 0;
}
.profile-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
</style>
