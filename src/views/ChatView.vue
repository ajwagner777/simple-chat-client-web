<script setup lang="ts">
import { onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'
import { useChatStore } from '../stores/chat'
import { useMessagesStore } from '../stores/messages'
import {
  connectRealtime,
  disconnectRealtime,
  subscribeToRoom,
  subscribeToDMs,
  unsubscribe,
} from '../services/realtime'
import type { Message } from '../types'
import ChatSidebar from '../components/chat/ChatSidebar.vue'
import MessagePane from '../components/chat/MessagePane.vue'

const auth = useAuthStore()
const chat = useChatStore()
const messages = useMessagesStore()
const router = useRouter()

// Track active room subscriptions so we can clean up
const subscribedRooms = new Set<number>()

async function logout() {
  await auth.logout()
  disconnectRealtime()
  router.push('/login')
}

function setupDmSocket() {
  if (!auth.user) return
  subscribeToDMs(auth.user.id, (data: unknown) => {
    const msg = (data as { message?: Message }).message ?? (data as Message)
    if (!msg?.id) return
    // Determine DM partner
    const partnerId = msg.user_id === auth.user!.id ? msg.recipient_id! : msg.user_id!
    messages.appendMessage(messages.getKey('dm', partnerId), msg)
    // Refresh sidebar overview so last-message preview updates
    chat.refreshOverview()
  })
}

function subscribeRoom(roomId: number) {
  if (subscribedRooms.has(roomId)) return
  subscribedRooms.add(roomId)
  subscribeToRoom(roomId, (data: unknown) => {
    const msg = (data as { message?: Message }).message ?? (data as Message)
    if (!msg?.id) return
    messages.appendMessage(messages.getKey('room', roomId), msg)
  })
}

function unsubscribeRoom(roomId: number) {
  if (!subscribedRooms.has(roomId)) return
  subscribedRooms.delete(roomId)
  unsubscribe(`presence-chat-room.${roomId}`)
}

// Keep room subscriptions in sync with myRooms
watch(
  () => chat.myRooms,
  (rooms) => {
    const current = new Set(rooms.map((r) => r.id))
    // Subscribe to new rooms
    rooms.forEach((r) => subscribeRoom(r.id))
    // Unsubscribe from left rooms
    subscribedRooms.forEach((id) => {
      if (!current.has(id)) unsubscribeRoom(id)
    })
  },
  { immediate: true },
)

onMounted(async () => {
  await chat.loadOverview()
  connectRealtime()
  setupDmSocket()
  // Subscribe to all rooms the user is already in
  chat.myRooms.forEach((r) => subscribeRoom(r.id))
})

onUnmounted(() => {
  disconnectRealtime()
  subscribedRooms.clear()
})
</script>

<template>
  <div class="chat-layout">
    <ChatSidebar />
    <div class="chat-main">
      <div class="chat-topbar">
        <span class="topbar-brand">Simple Chat</span>
        <div class="topbar-actions">
          <RouterLink to="/profile" class="topbar-link">{{ auth.user?.name }}</RouterLink>
          <button class="btn-ghost topbar-logout" @click="logout">Sign out</button>
        </div>
      </div>
      <div class="chat-content">
        <MessagePane />
      </div>
    </div>
  </div>
</template>

<style scoped>
.chat-layout {
  display: flex;
  height: 100dvh;
  overflow: hidden;
}
.chat-main {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-width: 0;
  overflow: hidden;
}
.chat-topbar {
  height: 48px;
  padding: 0 1.25rem;
  background: var(--color-bg-2);
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
}
.topbar-brand {
  font-weight: 700;
  font-size: 1rem;
  color: var(--color-primary);
}
.topbar-actions {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}
.topbar-link {
  font-size: 0.85rem;
  color: var(--color-text-muted);
}
.topbar-link:hover {
  color: var(--color-text);
  text-decoration: none;
}
.topbar-logout {
  font-size: 0.82rem;
  padding: 0.3rem 0.7rem;
}
.chat-content {
  flex: 1;
  overflow: hidden;
}
</style>
