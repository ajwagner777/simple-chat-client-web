<script setup lang="ts">
import { ref, computed } from 'vue'
import { useChatStore } from '../../stores/chat'
import { useAuthStore } from '../../stores/auth'
import { chatRoomsApi } from '../../api/chatRooms'
import type { ChatRoom, User } from '../../types'
import UserAvatar from '../common/UserAvatar.vue'

const chat = useChatStore()
const auth = useAuthStore()

// Panels
const showAllRooms = ref(false)
const showCreateRoom = ref(false)
const showJoinPrivate = ref<ChatRoom | null>(null)
const showStartDm = ref(false)

// Create room form
const newRoomName = ref('')
const newRoomDesc = ref('')
const newRoomPrivate = ref(false)
const newRoomPassword = ref('')
const createLoading = ref(false)
const createError = ref('')

// Join private form
const joinPassword = ref('')
const joinLoading = ref(false)
const joinError = ref('')

// DM search
const dmSearch = ref('')

const myRoomIds = computed(() => new Set(chat.myRooms.map((r) => r.id)))

const joinableRooms = computed(() =>
  chat.publicRooms.filter((r) => !myRoomIds.value.has(r.id)),
)

const filteredUsers = computed(() =>
  chat.users.filter(
    (u) =>
      u.id !== auth.user?.id &&
      u.name.toLowerCase().includes(dmSearch.value.toLowerCase()),
  ),
)

function selectRoom(room: ChatRoom) {
  chat.setActive({ type: 'room', room })
  showAllRooms.value = false
}

function selectDm(user: User) {
  chat.setActive({ type: 'dm', user })
  showStartDm.value = false
  dmSearch.value = ''
}

async function createRoom() {
  createError.value = ''
  if (!newRoomName.value.trim()) { createError.value = 'Room name is required.'; return }
  createLoading.value = true
  try {
    const res = await chatRoomsApi.create({
      name: newRoomName.value.trim(),
      description: newRoomDesc.value.trim() || undefined,
      is_private: newRoomPrivate.value,
      password: newRoomPrivate.value ? newRoomPassword.value : undefined,
    })
    // Join automatically after create
    await chatRoomsApi.join(res.data.id, newRoomPrivate.value ? newRoomPassword.value : undefined)
    chat.addMyRoom(res.data)
    chat.setActive({ type: 'room', room: res.data })
    showCreateRoom.value = false
    newRoomName.value = ''
    newRoomDesc.value = ''
    newRoomPrivate.value = false
    newRoomPassword.value = ''
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    createError.value = err.response?.data?.message || 'Could not create room.'
  } finally {
    createLoading.value = false
  }
}

async function joinPublicRoom(room: ChatRoom) {
  try {
    await chatRoomsApi.join(room.id)
    chat.addMyRoom(room)
    chat.setActive({ type: 'room', room })
    showAllRooms.value = false
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    alert(err.response?.data?.message || 'Could not join room.')
  }
}

function attemptJoinPrivate(room: ChatRoom) {
  showJoinPrivate.value = room
  joinPassword.value = ''
  joinError.value = ''
}

async function confirmJoinPrivate() {
  if (!showJoinPrivate.value) return
  joinLoading.value = true
  joinError.value = ''
  try {
    await chatRoomsApi.join(showJoinPrivate.value.id, joinPassword.value)
    chat.addMyRoom(showJoinPrivate.value)
    chat.setActive({ type: 'room', room: showJoinPrivate.value })
    showJoinPrivate.value = null
    showAllRooms.value = false
  } catch (e: unknown) {
    const err = e as { response?: { data?: { message?: string } } }
    joinError.value = err.response?.data?.message || 'Wrong password or join failed.'
  } finally {
    joinLoading.value = false
  }
}

async function leaveRoom(room: ChatRoom, event: Event) {
  event.stopPropagation()
  if (!confirm(`Leave #${room.name}?`)) return
  try {
    await chatRoomsApi.leave(room.id)
    chat.removeMyRoom(room.id)
  } catch {
    // ignore
  }
}
</script>

<template>
  <aside class="sidebar">
    <!-- User header -->
    <div class="sidebar-header">
      <UserAvatar :initial="auth.user?.name?.[0] || '?'" :size="32" />
      <span class="font-semibold truncate">{{ auth.user?.name }}</span>
      <RouterLink to="/profile" class="icon-btn" title="Profile">⚙</RouterLink>
    </div>

    <div class="sidebar-body">
      <!-- Direct Messages -->
      <section class="sidebar-section">
        <div class="section-label">
          <span>Direct Messages</span>
          <button class="icon-btn" title="New DM" @click="showStartDm = !showStartDm">+</button>
        </div>

        <div v-if="showStartDm" class="dm-search">
          <input v-model="dmSearch" placeholder="Search users…" />
          <div class="user-list">
            <div
              v-for="u in filteredUsers"
              :key="u.id"
              class="user-item"
              @click="selectDm(u)"
            >
              <UserAvatar :initial="u.name[0]" :size="28" />
              <div class="truncate">
                <p class="text-sm font-semibold truncate">{{ u.name }}</p>
                <p class="text-xs text-muted truncate">{{ u.location || 'No location' }}</p>
              </div>
            </div>
            <p v-if="filteredUsers.length === 0" class="text-xs text-muted" style="padding: 0.4rem 0.5rem;">No users found</p>
          </div>
        </div>

        <div
          v-for="thread in chat.dmThreads"
          :key="thread.participant.id"
          class="conv-item"
          :class="{ active: chat.active?.type === 'dm' && chat.active.user.id === thread.participant.id }"
          @click="selectDm(thread.participant)"
        >
          <UserAvatar :initial="thread.participant.name[0]" :size="30" />
          <div class="conv-info">
            <p class="text-sm font-semibold truncate">{{ thread.participant.name }}</p>
            <p class="text-xs text-muted truncate">{{ thread.last_message?.message || 'No messages yet' }}</p>
          </div>
        </div>

        <p v-if="chat.dmThreads.length === 0 && !showStartDm" class="sidebar-empty">
          No active conversations.<br>Start one with the + button.
        </p>
      </section>

      <!-- Chat Rooms -->
      <section class="sidebar-section">
        <div class="section-label">
          <span>My Rooms</span>
          <button class="icon-btn" title="Create room" @click="showCreateRoom = !showCreateRoom">+</button>
        </div>

        <!-- Create room form -->
        <div v-if="showCreateRoom" class="mini-form">
          <input v-model="newRoomName" placeholder="Room name" />
          <input v-model="newRoomDesc" placeholder="Description (optional)" />
          <label class="checkbox-label">
            <input type="checkbox" v-model="newRoomPrivate" />
            Private room
          </label>
          <input v-if="newRoomPrivate" v-model="newRoomPassword" type="password" placeholder="Room password" />
          <p v-if="createError" class="error-msg">{{ createError }}</p>
          <div style="display:flex;gap:0.5rem">
            <button class="btn-primary" style="flex:1" :disabled="createLoading" @click="createRoom">
              {{ createLoading ? 'Creating…' : 'Create' }}
            </button>
            <button class="btn-ghost" @click="showCreateRoom = false">Cancel</button>
          </div>
        </div>

        <div
          v-for="room in chat.myRooms"
          :key="room.id"
          class="conv-item"
          :class="{ active: chat.active?.type === 'room' && chat.active.room.id === room.id }"
          @click="selectRoom(room)"
        >
          <span class="room-icon">{{ room.is_private ? '🔒' : '#' }}</span>
          <div class="conv-info">
            <p class="text-sm font-semibold truncate">{{ room.name }}</p>
            <p class="text-xs text-muted truncate">{{ room.description || (room.is_private ? 'Private' : 'Public') }}</p>
          </div>
          <button class="leave-btn icon-btn text-xs" title="Leave room" @click="leaveRoom(room, $event)">✕</button>
        </div>

        <button class="discover-btn" @click="showAllRooms = !showAllRooms">
          {{ showAllRooms ? '▲ Hide Discover' : '▼ Discover Rooms' }}
        </button>

        <!-- Discover rooms panel -->
        <div v-if="showAllRooms" class="discover-panel">
          <p v-if="joinableRooms.length === 0" class="text-xs text-muted" style="padding:0.4rem 0">No rooms to join yet.</p>
          <div
            v-for="room in joinableRooms"
            :key="room.id"
            class="discover-item"
          >
            <div class="conv-info">
              <p class="text-sm font-semibold truncate">{{ room.is_private ? '🔒 ' : '# ' }}{{ room.name }}</p>
              <p class="text-xs text-muted truncate">{{ room.description || 'No description' }} · {{ room.users_count }} members</p>
            </div>
            <button
              class="btn-primary"
              style="font-size:0.75rem;padding:0.3rem 0.6rem;flex-shrink:0"
              @click="room.is_private ? attemptJoinPrivate(room) : joinPublicRoom(room)"
            >
              Join
            </button>
          </div>
        </div>
      </section>
    </div>

    <!-- Join private room modal -->
    <div v-if="showJoinPrivate" class="modal-overlay" @click.self="showJoinPrivate = null">
      <div class="modal-card">
        <h3>Join #{{ showJoinPrivate.name }}</h3>
        <p class="text-sm text-muted">This is a private room. Enter the password to join.</p>
        <input v-model="joinPassword" type="password" placeholder="Room password" @keydown.enter="confirmJoinPrivate" />
        <p v-if="joinError" class="error-msg">{{ joinError }}</p>
        <div style="display:flex;gap:0.5rem;margin-top:0.5rem">
          <button class="btn-primary" style="flex:1" :disabled="joinLoading" @click="confirmJoinPrivate">
            {{ joinLoading ? 'Joining…' : 'Join' }}
          </button>
          <button class="btn-ghost" @click="showJoinPrivate = null">Cancel</button>
        </div>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.sidebar {
  width: var(--sidebar-width);
  min-width: var(--sidebar-width);
  background: var(--color-bg-2);
  border-right: 1px solid var(--color-border);
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
  position: relative;
}
.sidebar-header {
  padding: 0.85rem 1rem;
  border-bottom: 1px solid var(--color-border);
  display: flex;
  align-items: center;
  gap: 0.6rem;
  background: var(--color-bg-3);
  flex-shrink: 0;
}
.sidebar-body {
  flex: 1;
  overflow-y: auto;
  padding: 0.5rem 0;
}
.sidebar-section {
  padding: 0.5rem 0;
  border-bottom: 1px solid var(--color-border);
}
.section-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.3rem 1rem;
  font-size: 0.72rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted);
}
.icon-btn {
  background: transparent;
  border: none;
  padding: 2px 6px;
  cursor: pointer;
  color: var(--color-text-muted);
  border-radius: 4px;
  font-size: 1rem;
  line-height: 1;
  transition: color 0.1s, background 0.1s;
}
.icon-btn:hover { color: var(--color-text); background: var(--color-bg-hover); }
.conv-item {
  display: flex;
  align-items: center;
  gap: 0.6rem;
  padding: 0.45rem 1rem;
  cursor: pointer;
  border-radius: 0;
  transition: background 0.1s;
  position: relative;
}
.conv-item:hover { background: var(--color-bg-hover); }
.conv-item.active { background: rgba(108, 99, 255, 0.18); }
.conv-item.active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: var(--color-primary);
  border-radius: 0 2px 2px 0;
}
.conv-info {
  flex: 1;
  min-width: 0;
}
.room-icon {
  font-size: 0.95rem;
  width: 30px;
  height: 30px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted);
  flex-shrink: 0;
}
.leave-btn {
  opacity: 0;
  font-size: 0.7rem;
  padding: 2px 5px;
}
.conv-item:hover .leave-btn { opacity: 1; }
.sidebar-empty {
  padding: 0.5rem 1rem;
  font-size: 0.78rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}
.mini-form {
  padding: 0.5rem 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  background: var(--color-bg-3);
  border-bottom: 1px solid var(--color-border);
}
.mini-form input { font-size: 0.82rem; }
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.82rem;
  color: var(--color-text-muted);
  cursor: pointer;
}
.checkbox-label input[type="checkbox"] {
  width: auto;
  accent-color: var(--color-primary);
}
.discover-btn {
  background: transparent;
  border: none;
  width: 100%;
  padding: 0.4rem 1rem;
  text-align: left;
  font-size: 0.75rem;
  color: var(--color-text-muted);
  cursor: pointer;
  transition: color 0.1s;
}
.discover-btn:hover { color: var(--color-text); }
.discover-panel {
  padding: 0 0.5rem;
}
.discover-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.4rem 0.5rem;
  border-radius: var(--radius);
}
.discover-item:hover { background: var(--color-bg-hover); }
.dm-search {
  padding: 0.5rem 1rem;
  background: var(--color-bg-3);
  border-bottom: 1px solid var(--color-border);
}
.dm-search input { margin-bottom: 0.35rem; font-size: 0.82rem; }
.user-list {
  max-height: 160px;
  overflow-y: auto;
}
.user-item {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.35rem 0.5rem;
  cursor: pointer;
  border-radius: var(--radius);
}
.user-item:hover { background: var(--color-bg-hover); }
/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
}
.modal-card {
  background: var(--color-bg-2);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 1.75rem;
  width: 340px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}
.modal-card h3 { font-size: 1.1rem; }
</style>
