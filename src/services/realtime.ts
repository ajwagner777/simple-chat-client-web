/**
 * Generic Pusher-protocol client connecting to Laravel Reverb.
 * Does NOT use Laravel Echo or any Laravel-specific frontend library.
 */
import Pusher from 'pusher-js'
import type { Channel } from 'pusher-js'

const REVERB_HOST = import.meta.env.VITE_REVERB_HOST || 'localhost'
const REVERB_PORT = Number(import.meta.env.VITE_REVERB_PORT) || 8080
const REVERB_APP_KEY = import.meta.env.VITE_REVERB_APP_KEY || 'chat'
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1'

let pusher: Pusher | null = null

export function connectRealtime(): Pusher {
  if (pusher) return pusher

  const token = localStorage.getItem('access_token')

  pusher = new Pusher(REVERB_APP_KEY, {
    wsHost: REVERB_HOST,
    wsPort: REVERB_PORT,
    wssPort: REVERB_PORT,
    forceTLS: false,
    enabledTransports: ['ws'],
    disableStats: true,
    authEndpoint: `${API_BASE_URL.replace('/api/v1', '')}/broadcasting/auth`,
    auth: {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } as any)

  pusher.connection.bind('error', (err: unknown) => {
    console.error('[Reverb] Connection error', err)
  })

  return pusher
}

export function disconnectRealtime() {
  if (pusher) {
    pusher.disconnect()
    pusher = null
  }
}

/** Subscribe to a presence channel (chat rooms). */
export function subscribeToRoom(
  roomId: number,
  onMessage: (data: unknown) => void,
): Channel {
  const p = connectRealtime()
  const channel = p.subscribe(`presence-chat-room.${roomId}`)
  channel.bind('.message.sent', onMessage)
  return channel
}

/** Subscribe to the authenticated user's private DM channel. */
export function subscribeToDMs(
  userId: number,
  onMessage: (data: unknown) => void,
): Channel {
  const p = connectRealtime()
  const channel = p.subscribe(`private-direct-message.${userId}`)
  channel.bind('.message.sent', onMessage)
  return channel
}

export function unsubscribe(channelName: string) {
  pusher?.unsubscribe(channelName)
}

/** Update the auth token on the Pusher instance (e.g. after token refresh). */
export function updateRealtimeAuth(token: string) {
  if (pusher) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    ; (pusher as any).config.auth = {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  }
}
