<script setup lang="ts">
import type { Message } from '../../types'
import { useAuthStore } from '../../stores/auth'
import UserAvatar from '../common/UserAvatar.vue'

defineProps<{ message: Message }>()
const auth = useAuthStore()

function formatTime(iso: string) {
  const d = new Date(iso)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}
function formatDate(iso: string) {
  const d = new Date(iso)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}
</script>

<template>
  <div class="msg" :class="{ mine: message.user?.id === auth.user?.id }">
    <UserAvatar :initial="message.user?.name?.[0] || '?'" />
    <div class="msg-content">
      <div class="msg-meta">
        <span class="msg-author">{{ message.user?.name }}</span>
        <span class="msg-time text-xs text-muted">{{ formatDate(message.created_at) }} {{ formatTime(message.created_at) }}</span>
      </div>
      <div class="msg-body">{{ message.message }}</div>
    </div>
  </div>
</template>

<style scoped>
.msg {
  display: flex;
  gap: 0.75rem;
  padding: 0.5rem 0;
}
.msg.mine .msg-content {
  align-items: flex-end;
}
.msg-content {
  display: flex;
  flex-direction: column;
  gap: 0.2rem;
  min-width: 0;
  flex: 1;
}
.msg-meta {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
}
.msg-author {
  font-size: 0.82rem;
  font-weight: 600;
  color: var(--color-text);
}
.msg-body {
  background: var(--color-bg-3);
  border-radius: 0 var(--radius) var(--radius) var(--radius);
  padding: 0.5rem 0.75rem;
  font-size: 0.9rem;
  line-height: 1.45;
  word-break: break-word;
  display: inline-block;
  max-width: 100%;
}
.mine .msg-body {
  background: var(--color-primary);
  color: #fff;
  border-radius: var(--radius) 0 var(--radius) var(--radius);
}
</style>
