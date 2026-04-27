<script setup lang="ts">
import { ref } from 'vue'
import { authApi } from '../api/auth'

const email = ref('')
const loading = ref(false)
const success = ref(false)
const error = ref('')

async function submit() {
  error.value = ''
  loading.value = true
  try {
    await authApi.forgotPassword(email.value)
    success.value = true
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    error.value = err.response?.data?.message || 'Something went wrong. Please try again.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">Reset Password</h1>

      <div v-if="success" class="success-box">
        <p class="success-msg">✓ Password reset link sent! Check your email.</p>
      </div>
      <template v-else>
        <p class="auth-subtitle">Enter your email and we'll send you a reset link.</p>
        <form @submit.prevent="submit" class="auth-form">
          <div class="form-group">
            <label for="email">Email</label>
            <input id="email" v-model="email" type="email" placeholder="you@example.com" required autocomplete="email" />
          </div>
          <p v-if="error" class="error-msg">{{ error }}</p>
          <button type="submit" class="btn-primary w-full" :disabled="loading">
            {{ loading ? 'Sending…' : 'Send Reset Link' }}
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
.auth-subtitle {
  text-align: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
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
