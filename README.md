# simple-chat-client-web

A Vue 3 SPA chat client for the [simple-chat-service](https://github.com/ajwagner777/simple-chat-service) backend.

## Features

- **Auth** — Register, login, logout, forgot/reset password, session bootstrap from stored JWT
- **Profile** — Update display name and location
- **Chat Rooms** — Create public or private (password-protected) rooms, join/leave, real-time messages
- **Direct Messages** — Message any registered user, full conversation history
- **Real-time** — Powered by [pusher-js](https://github.com/pusher/pusher-js) against Laravel Reverb (no Laravel Echo)
- **Two-pane layout** — Sidebar (DMs + rooms) on the left; message thread on the right

## Requirements

- Node 18+
- The [simple-chat-service](https://github.com/ajwagner777/simple-chat-service) backend running locally

## Quick Start

```bash
cp .env.example .env
# Edit .env — set VITE_REVERB_APP_KEY to match REVERB_APP_KEY in the backend .env
npm install
npm run dev
```

Open http://localhost:5173

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:8000/api/v1` | Backend REST API base URL |
| `VITE_REVERB_HOST` | `localhost` | Laravel Reverb WebSocket host |
| `VITE_REVERB_PORT` | `8080` | Laravel Reverb WebSocket port |
| `VITE_REVERB_APP_KEY` | — | Must match `REVERB_APP_KEY` in the backend `.env` |

## Password Reset Emails

For the reset-password screen to work end-to-end, set `FRONTEND_URL=http://localhost:5173`
in the backend `.env`. The backend will then generate email links pointing at
`http://localhost:5173/reset-password?token=...&email=...`

## Tech Stack

- Vite + Vue 3 + TypeScript
- Pinia (state management)
- Vue Router 4 (routing + guards)
- axios (HTTP client, JWT refresh-retry interceptor)
- pusher-js (WebSocket client — Pusher protocol / Reverb, no Laravel Echo)
