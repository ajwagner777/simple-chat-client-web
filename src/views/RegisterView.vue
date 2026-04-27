<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const auth = useAuthStore()
const router = useRouter()

const name = ref('')
const email = ref('')
const password = ref('')
const passwordConfirmation = ref('')
const error = ref('')

async function submit() {
  error.value = ''
  if (password.value !== passwordConfirmation.value) {
    error.value = 'Passwords do not match.'
    return
  }
  try {
    await auth.register(name.value, email.value, password.value, passwordConfirmation.value)
    router.push('/')
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    error.value = err.response?.data?.message || 'Registration failed. Please try again.'
  }
}
</script>

<template>
  <div class="auth-page">
    <div class="auth-card">
      <h1 class="auth-title">Simple Chat</h1>
      <p class="auth-subtitle">Create your account</p>

      <form @submit.prevent="submit" class="auth-form">
        <div class="form-group">
          <label for="name">Name</label>
          <input id="name" v-model="name" type="text" placeholder="Your name" required />
        </div>
        <div class="form-group">
          <label for="email">Email</label>
          <input id="email" v-model="email" type="email" placeholder="you@example.com" required autocomplete="email" />
        </div>
        <div class="form-group">
          <label for="password">Password</label>
          <input id="password" v-model="password" type="password" placeholder="Min. 8 characters" required minlength="8" autocomplete="new-password" />
        </div>
        <div class="form-group">
          <label for="password-confirm">Confirm Password</label>
          <input id="password-confirm" v-model="passwordConfirmation" type="password" placeholder="Repeat password" required autocomplete="new-password" />
        </div>
        <p v-if="error" class="error-msg">{{ error }}</p>
        <button type="submit" class="btn-primary w-full" :disabled="auth.loading">
          {{ auth.loading ? 'Creating account…' : 'Create Account' }}
        </button>
      </form>

      <div class="auth-links">
        <span class="text-muted">Already have an account?</span>
        <RouterLink to="/login">Sign in</RouterLink>
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
  margin-top: -1rem;
}
.auth-form {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}
.auth-links {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  font-size: 0.85rem;
}
</style>
