import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { ChatRoom, User, DirectMessageThread, ActiveConversation } from '../types'
import { chatsApi } from '../api/chats'
import { chatRoomsApi } from '../api/chatRooms'
import { usersApi } from '../api/users'

export const useChatStore = defineStore('chat', () => {
  const myRooms = ref<ChatRoom[]>([])           // rooms the user is in (from overview)
  const publicRooms = ref<ChatRoom[]>([])        // all public rooms (for discovery)
  const dmThreads = ref<DirectMessageThread[]>([])
  const users = ref<User[]>([])
  const active = ref<ActiveConversation | null>(null)
  const loading = ref(false)

  async function loadOverview() {
    loading.value = true
    try {
      const [overview, rooms, allUsers] = await Promise.all([
        chatsApi.overview(),
        chatRoomsApi.list(),
        usersApi.list(),
      ])
      myRooms.value = overview.data.chat_rooms
      dmThreads.value = overview.data.active_direct_messages
      publicRooms.value = rooms.data
      users.value = allUsers.data
    } finally {
      loading.value = false
    }
  }

  async function refreshOverview() {
    const [overview, rooms] = await Promise.all([
      chatsApi.overview(),
      chatRoomsApi.list(),
    ])
    myRooms.value = overview.data.chat_rooms
    dmThreads.value = overview.data.active_direct_messages
    publicRooms.value = rooms.data
  }

  function setActive(conv: ActiveConversation | null) {
    active.value = conv
  }

  function addMyRoom(room: ChatRoom) {
    if (!myRooms.value.find((r) => r.id === room.id)) {
      myRooms.value.push(room)
    }
    if (!publicRooms.value.find((r) => r.id === room.id)) {
      publicRooms.value.push(room)
    }
  }

  function removeMyRoom(roomId: number) {
    myRooms.value = myRooms.value.filter((r) => r.id !== roomId)
    if (active.value?.type === 'room' && active.value.room.id === roomId) {
      active.value = null
    }
  }

  function upsertDmThread(thread: DirectMessageThread) {
    const idx = dmThreads.value.findIndex((t) => t.participant.id === thread.participant.id)
    if (idx >= 0) {
      dmThreads.value[idx] = thread
    } else {
      dmThreads.value.unshift(thread)
    }
  }

  return { myRooms, publicRooms, dmThreads, users, active, loading, loadOverview, refreshOverview, setActive, addMyRoom, removeMyRoom, upsertDmThread }
})
