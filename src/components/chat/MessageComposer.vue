<script setup lang="ts">
import { ref } from 'vue'

const emit = defineEmits<{ send: [text: string] }>()
const text = ref('')
const props = defineProps<{ disabled?: boolean; placeholder?: string }>()

function send() {
  const trimmed = text.value.trim()
  if (!trimmed || props.disabled) return
  emit('send', trimmed)
  text.value = ''
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    send()
  }
}
</script>

<template>
  <div class="composer">
    <textarea
      v-model="text"
      :placeholder="placeholder || 'Type a message… (Enter to send)'"
      :disabled="disabled"
      rows="1"
      class="composer-input"
      @keydown="onKeydown"
    />
    <button class="btn-primary send-btn" :disabled="disabled || !text.trim()" @click="send">
      Send
    </button>
  </div>
</template>

<style scoped>
.composer {
  display: flex;
  gap: 0.6rem;
  align-items: flex-end;
  padding: 0.75rem 1rem;
  background: var(--color-bg-2);
  border-top: 1px solid var(--color-border);
}
.composer-input {
  flex: 1;
  resize: none;
  max-height: 120px;
  line-height: 1.4;
}
.send-btn {
  flex-shrink: 0;
  padding: 0.5rem 1.1rem;
}
</style>
