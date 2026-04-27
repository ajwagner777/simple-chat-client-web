<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { authApi } from '../api/auth'

const route = useRoute()
const router = useRouter()

const token = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const loading = ref(false)
const success = ref(false)
const error = ref('')

onMounted(() => {
  // Backend email links include ?token=...&email=...
  token.value = (route.query.token as string) || ''
  email.value = (route.query.email as string) || ''
})

async function submit() {
  error.value = ''
  if (password.value !== passwordConfirmation.value) {
    error.value = 'Passwords do not match.'
    return
  }
  loading.value = true
  try {
    await authApi.resetPassword({
      token: token.value,
      email: email.value,
      password: password.value,
      password_confirmation: passwordConfirmation.value,
    })
    success.value = true
    setTimeout(() => router.push('/login'), 2000)
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    error.value = err.response?.data?.message || 'Reset failed. The link may have expired.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">New Password</h1>

      <div v-if="success" class="success-box">
        <p class="success-msg">✓ Password reset! Redirecting to sign in…</p>
      </div>
      <template v-else>
        <form @submit.prevent="submit" class="auth-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" v-model="email" type="email" required autocomplete="email" />
          </div>
          <div class="form-group">
            <label for="password">New Password</label>
            <input id="password" v-model="password" type="password" placeholder="Min. 8 characters" required minlength="8" autocomplete="new-password" />
          </div>
          <div class="form-group">
            <label for="password-confirm">Confirm New Password</label>
            <input id="password-confirm" v-model="passwordConfirmation" type="password" required autocomplete="new-password" />
          </div>
          <p v-if="error" class="error-msg">{{ error }}</p>
          <button type="submit" class="btn-primary w-full" :disabled="loading">
            {{ loading ? 'Resetting…' : 'Reset Password' }}
          </button>
        </form>
      </template>

      <div class="auth-links">
        <RouterLink to="/login">← Back to Sign In</RouterLink>
      </div>
    </div>
  </div>
</template>

<style scoped>
.auth-page {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 100dvh;
  background: var(--color-bg);
}
.auth-card {
  width: 100%;
  max-width: 400px;
  background: var(--color-bg-2);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 2.5rem 2rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  margin: 1rem;
}
.auth-title {
  font-size: 1.7rem;
  font-weight: 700;
  text-align: center;
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.success-box {
  background: rgba(82, 192, 122, 0.12);
  border: 1px solid rgba(82, 192, 122, 0.3);
  border-radius: var(--radius);
  padding: 1rem;
  text-align: center;
}
.auth-links {
  display: flex;
  justify-content: center;
  font-size: 0.85rem;
}
</style>
