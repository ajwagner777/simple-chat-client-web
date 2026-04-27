<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted } from 'vue'
import { useMessagesStore } from '../../stores/messages'
import { useChatStore } from '../../stores/chat'
import MessageItem from './MessageItem.vue'
import MessageComposer from './MessageComposer.vue'

const messagesStore = useMessagesStore()
const chatStore = useChatStore()

const scrollEl = ref<HTMLElement | null>(null)
const sendError = ref('')

const conv = computed(() => chatStore.active)
const convKey = computed(() => {
  if (!conv.value) return null
  return conv.value.type === 'room'
    ? messagesStore.getKey('room', conv.value.room.id)
    : messagesStore.getKey('dm', conv.value.user.id)
})
const state = computed(() => {
  if (!convKey.value) return null
  return messagesStore.getState(
    conv.value!.type,
    conv.value!.type === 'room' ? conv.value!.room.id : conv.value!.user.id,
  )
})
const messages = computed(() => state.value?.messages ?? [])
const hasMore = computed(() => {
  if (!conv.value) return false
  const type = conv.value.type
  const id = type === 'room' ? conv.value.room.id : conv.value.user.id
  return messagesStore.hasMore(type, id)
})

const title = computed(() => {
  if (!conv.value) return ''
  return conv.value.type === 'room' ? `# ${conv.value.room.name}` : conv.value.user.name
})
const subtitle = computed(() => {
  if (!conv.value) return ''
  if (conv.value.type === 'room') {
    return conv.value.room.description || (conv.value.room.is_private ? 'Private room' : 'Public room')
  }
  return conv.value.user.location || 'Direct message'
})

async function scrollBottom(smooth = false) {
  await nextTick()
  if (scrollEl.value) {
    scrollEl.value.scrollTo({ top: scrollEl.value.scrollHeight, behavior: smooth ? 'smooth' : 'instant' })
  }
}

watch(conv, async (newConv) => {
  if (!newConv) return
  if (newConv.type === 'room') {
    await messagesStore.loadRoom(newConv.room.id)
  } else {
    await messagesStore.loadDm(newConv.user.id)
  }
  scrollBottom()
})

watch(messages, async (msgs, oldMsgs) => {
  if (msgs.length > (oldMsgs?.length ?? 0)) {
    scrollBottom(true)
  }
}, { flush: 'post' })

onMounted(() => scrollBottom())

async function loadMore() {
  if (!conv.value || !state.value) return
  const nextPage = state.value.currentPage + 1
  const prevHeight = scrollEl.value?.scrollHeight || 0
  if (conv.value.type === 'room') {
    await messagesStore.loadRoom(conv.value.room.id, nextPage)
  } else {
    await messagesStore.loadDm(conv.value.user.id, nextPage)
  }
  await nextTick()
  if (scrollEl.value) {
    scrollEl.value.scrollTop = scrollEl.value.scrollHeight - prevHeight
  }
}

async function onSend(text: string) {
  if (!conv.value) return
  sendError.value = ''
  try {
    if (conv.value.type === 'room') {
      await messagesStore.sendRoomMessage(conv.value.room.id, text)
    } else {
      await messagesStore.sendDm(conv.value.user.id, text)
    }
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    sendError.value = err.response?.data?.message || 'Failed to send message.'
  }
}
</script>

<template>
  <div class="message-pane">
    <div v-if="!conv" class="empty-state">
      <p>Select a conversation from the sidebar to start chatting.</p>
    </div>
    <template v-else>
      <div class="pane-header">
        <div>
          <p class="pane-title">{{ title }}</p>
          <p class="text-muted text-xs">{{ subtitle }}</p>
        </div>
      </div>

      <div ref="scrollEl" class="messages-scroll">
        <div v-if="hasMore" class="load-more-wrap">
          <button class="btn-ghost text-sm load-more-btn" :disabled="state?.loadingMore" @click="loadMore">
            {{ state?.loadingMore ? 'Loading…' : 'Load older messages' }}
          </button>
        </div>

        <div v-if="state?.loading" class="loading-state">Loading messages…</div>
        <div v-else-if="messages.length === 0" class="empty-msgs">No messages yet. Say hello!</div>
        <div v-else class="messages-list">
          <MessageItem v-for="msg in messages" :key="msg.id" :message="msg" />
        </div>
      </div>

      <p v-if="sendError" class="send-error">{{ sendError }}</p>
      <MessageComposer @send="onSend" :placeholder="conv.type === 'room' ? `Message #${conv.room.name}` : `Message ${conv.user.name}`" />
    </template>
  </div>
</template>

<style scoped>
.message-pane {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: var(--color-bg);
  overflow: hidden;
}
.empty-state {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-size: 0.95rem;
}
.pane-header {
  padding: 0.85rem 1.25rem;
  border-bottom: 1px solid var(--color-border);
  background: var(--color-bg-2);
  flex-shrink: 0;
}
.pane-title {
  font-weight: 600;
  font-size: 1rem;
}
.messages-scroll {
  flex: 1;
  overflow-y: auto;
  padding: 0.75rem 1.25rem;
  display: flex;
  flex-direction: column;
}
.messages-list {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  margin-top: auto;
}
.load-more-wrap {
  display: flex;
  justify-content: center;
  padding: 0.5rem 0 1rem;
}
.load-more-btn {
  border: 1px solid var(--color-border);
  font-size: 0.8rem;
  padding: 0.35rem 0.75rem;
}
.loading-state, .empty-msgs {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  font-size: 0.9rem;
  min-height: 80px;
}
.send-error {
  padding: 0.3rem 1.25rem;
  font-size: 0.8rem;
  color: var(--color-danger);
  background: rgba(224, 82, 82, 0.08);
}
</style>
