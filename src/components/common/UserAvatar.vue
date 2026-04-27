<script setup lang="ts">
defineProps<{ initial: string; size?: number }>()
</script>

<template>
  <div class="avatar" :style="size ? `width:${size}px;height:${size}px;font-size:${size * 0.4}px` : ''">
    {{ initial?.toUpperCase() }}
  </div>
</template>

<style scoped>
.avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--color-primary);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.9rem;
  font-weight: 700;
  flex-shrink: 0;
}
</style>
