import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { Message, PaginatedResponse } from '../types'
import { chatRoomsApi } from '../api/chatRooms'
import { directMessagesApi } from '../api/directMessages'

type ConvKey = string // `room:${id}` | `dm:${userId}`

interface ConvState {
  messages: Message[]
  currentPage: number
  total: number
  perPage: number
  loading: boolean
  loadingMore: boolean
  error: string | null
}

export const useMessagesStore = defineStore('messages', () => {
  const convs = ref<Record<ConvKey, ConvState>>({})

  function getKey(type: 'room' | 'dm', id: number): ConvKey {
    return `${type}:${id}`
  }

  function ensure(key: ConvKey): ConvState {
    if (!convs.value[key]) {
      convs.value[key] = {
        messages: [],
        currentPage: 1,
        total: 0,
        perPage: 50,
        loading: false,
        loadingMore: false,
        error: null,
      }
    }
    return convs.value[key]
  }

  function setFromPage(key: ConvKey, data: PaginatedResponse<Message>) {
    const state = ensure(key)
    // Pages come in descending order from API; sort ascending for display
    const sorted = [...data.data].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )
    state.messages = sorted
    state.currentPage = data.current_page
    state.total = data.total
    state.perPage = data.per_page
  }

  function prependFromPage(key: ConvKey, data: PaginatedResponse<Message>) {
    const state = ensure(key)
    const sorted = [...data.data].sort((a, b) =>
      new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
    )
    // Deduplicate
    const existingIds = new Set(state.messages.map((m) => m.id))
    const newOnes = sorted.filter((m) => !existingIds.has(m.id))
    state.messages = [...newOnes, ...state.messages]
    state.currentPage = data.current_page
    state.total = data.total
  }

  function appendMessage(key: ConvKey, message: Message) {
    const state = ensure(key)
    if (!state.messages.find((m) => m.id === message.id)) {
      state.messages.push(message)
      state.total += 1
    }
  }

  async function loadRoom(roomId: number, page = 1) {
    const key = getKey('room', roomId)
    const state = ensure(key)
    if (page === 1) {
      state.loading = true
    } else {
      state.loadingMore = true
    }
    state.error = null
    try {
      const res = await chatRoomsApi.messages(roomId, page)
      if (page === 1) {
        setFromPage(key, res.data)
      } else {
        prependFromPage(key, res.data)
      }
    } catch (e: unknown) {
      state.error = e instanceof Error ? e.message : 'Failed to load messages'
    } finally {
      state.loading = false
      state.loadingMore = false
    }
  }

  async function loadDm(userId: number, page = 1) {
    const key = getKey('dm', userId)
    const state = ensure(key)
    if (page === 1) {
      state.loading = true
    } else {
      state.loadingMore = true
    }
    state.error = null
    try {
      const res = await directMessagesApi.conversation(userId, page)
      if (page === 1) {
        setFromPage(key, res.data)
      } else {
        prependFromPage(key, res.data)
      }
    } catch (e: unknown) {
      state.error = e instanceof Error ? e.message : 'Failed to load messages'
    } finally {
      state.loading = false
      state.loadingMore = false
    }
  }

  async function sendRoomMessage(roomId: number, text: string) {
    const res = await chatRoomsApi.sendMessage(roomId, text)
    appendMessage(getKey('room', roomId), res.data)
    return res.data
  }

  async function sendDm(userId: number, text: string) {
    const res = await directMessagesApi.send(userId, text)
    appendMessage(getKey('dm', userId), res.data)
    return res.data
  }

  function getState(type: 'room' | 'dm', id: number): ConvState | undefined {
    return convs.value[getKey(type, id)]
  }

  function hasMore(type: 'room' | 'dm', id: number): boolean {
    const state = getState(type, id)
    if (!state) return false
    return state.messages.length < state.total
  }

  return { convs, loadRoom, loadDm, sendRoomMessage, sendDm, appendMessage, getState, hasMore, getKey }
})
