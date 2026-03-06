# WatchTogether — MVP Design

## Overview

A web platform where users watch videos together in real-time with live chat. An admin controls playback and all viewers stay synced. Built as an MVP that can scale.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React (Vite), TypeScript, Socket.io-client |
| Backend | Express.js, Socket.io, TypeScript |
| Database | PostgreSQL (Dockerized) |
| ORM | Drizzle |
| Auth | JWT + bcrypt |
| Video | YouTube IFrame API (abstracted for future self-hosted support) |

## Architecture

Monorepo: `/client` (React/Vite) + `/server` (Express/Socket.io).

- REST API for CRUD operations (auth, channels, playlists)
- Socket.io for real-time features (chat, playback sync, presence)
- Admin controls playback; all viewers mirror admin state

## Project Structure

```
watchtogether/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── VideoPlayer/    # YouTube embed + abstraction layer
│   │   │   ├── Chat/           # Real-time chat UI
│   │   │   ├── Playlist/       # Now Playing / Next / Coming Up
│   │   │   ├── Auth/           # Login / Register forms
│   │   │   └── Admin/          # Admin controls panel
│   │   ├── hooks/              # useSocket, useAuth, usePlayer
│   │   ├── pages/              # Channel, Login, Admin
│   │   ├── services/           # API client, socket client
│   │   └── types/              # Shared TypeScript types
│   └── package.json
├── server/
│   ├── src/
│   │   ├── routes/             # REST API routes
│   │   ├── socket/             # Socket.io event handlers
│   │   ├── db/
│   │   │   ├── schema.ts       # Drizzle schema
│   │   │   └── migrations/
│   │   ├── middleware/         # Auth, error handling
│   │   └── services/           # Business logic
│   └── package.json
├── docker-compose.yml          # PostgreSQL
├── package.json                # Workspace root
└── tsconfig.base.json          # Shared TS config
```

## Database Schema

### users
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| email | varchar | unique |
| password_hash | varchar | bcrypt |
| display_name | varchar | |
| role | enum | 'admin' / 'viewer' |
| created_at | timestamp | |
| updated_at | timestamp | |

### channels
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| name | varchar | |
| slug | varchar | unique, URL-friendly |
| is_active | boolean | enable/disable channel |
| created_by | uuid | FK → users |
| created_at | timestamp | |
| updated_at | timestamp | |

### playlist_items
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| channel_id | uuid | FK → channels |
| title | varchar | |
| video_url | varchar | YouTube URL or file path |
| video_source | enum | 'youtube' / 'self_hosted' |
| duration_seconds | integer | |
| position | integer | ordering |
| created_at | timestamp | |

### playback_state
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| channel_id | uuid | FK → channels, unique |
| current_item_id | uuid | FK → playlist_items |
| status | enum | 'playing' / 'paused' / 'stopped' |
| current_time | float | seconds into current video |
| updated_at | timestamp | |

### chat_messages
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| channel_id | uuid | FK → channels |
| user_id | uuid | FK → users |
| content | text | |
| created_at | timestamp | |

## Real-time Architecture (Socket.io)

### Namespaces & Rooms
- Each channel gets a Socket.io room keyed by channel slug
- All viewers in the same channel join the same room

### Events

| Event | Direction | Payload | Description |
|-------|-----------|---------|-------------|
| `admin:command` | client → server | `{ action, seekTo?, itemId? }` | Admin play/pause/seek/skip |
| `playback:state` | server → clients | `{ status, currentTime, currentItem }` | Broadcast current state |
| `playback:sync` | client → server | `{}` | Viewer requests current state |
| `chat:message` | client → server | `{ content }` | Send chat message |
| `chat:message` | server → clients | `{ id, user, content, createdAt }` | Broadcast message |
| `chat:history` | server → client | `{ messages[] }` | Last 50 messages on join |
| `presence:update` | server → clients | `{ viewerCount }` | Updated on join/leave |

### Admin Playback Control Flow
1. Admin emits `admin:command { action: 'play' }`
2. Server validates admin role via JWT
3. Server updates `playback_state` in DB
4. Server broadcasts `playback:state` to all viewers in room
5. Each viewer's player syncs to broadcasted state

### "Jump to Live" Flow
1. Viewer clicks "Jump to Live"
2. Client emits `playback:sync`
3. Server responds with current `playback_state`
4. Player seeks to admin's current position

## REST API

### Auth
- `POST /api/auth/register` — `{ email, password, displayName }`
- `POST /api/auth/login` — `{ email, password }` → `{ token, user }`
- `GET /api/auth/me` — current user from JWT

### Channels
- `GET /api/channels` — list active channels
- `GET /api/channels/:slug` — channel details + playlist + playback state
- `POST /api/channels` — create channel (admin)
- `PATCH /api/channels/:slug` — update channel (admin)

### Playlist
- `GET /api/channels/:slug/playlist` — ordered playlist items
- `POST /api/channels/:slug/playlist` — add item (admin)
- `PATCH /api/channels/:slug/playlist/:id` — update item (admin)
- `DELETE /api/channels/:slug/playlist/:id` — remove item (admin)
- `POST /api/channels/:slug/playlist/reorder` — reorder items (admin)

### Admin
- `GET /api/admin/channels/:slug/viewers` — viewer count/list

## Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| Login | `/login` | Email/password login |
| Register | `/register` | Registration form |
| Channel | `/channel/:slug` | Video + chat + playlist |
| Admin Dashboard | `/admin` | Channel management |
| Admin Channel | `/admin/channel/:slug` | Playback controls, viewers |

### Channel Page Layout
```
┌─────────────────────────────────────────────────┐
│  Channel Name                    [Jump to Live]  │
├────────────────────────────┬────────────────────┤
│                            │  Now Playing:       │
│     Video Player           │  ► Video Title      │
│     (YouTube Embed)        │  Next:              │
│                            │  • Video 2          │
├────────────────────────────┤  Coming Up:         │
│     Live Chat              │  • Video 3          │
│     ┌──────────────────┐   │  • Video 4          │
│     │ user1: hello      │   │                     │
│     │ user2: nice!      │   │                     │
│     └──────────────────┘   │                     │
│     [Type a message...  ]   │  👤 24 watching     │
└────────────────────────────┴────────────────────┘
```

### Key Components
- `<VideoPlayer>` — wraps YouTube IFrame API, listens for sync events, abstracted for future self-hosted
- `<Chat>` — message list + input, auto-scroll, socket-connected
- `<Playlist>` — current + upcoming items, highlights now playing
- `<JumpToLive>` — requests current state and seeks player
- `<AdminControls>` — play/pause/skip/seek, admin role only

## Auth Flow
1. User registers with email/password → password hashed with bcrypt, stored in DB
2. Login returns JWT token (contains userId, role)
3. Token sent via Authorization header for REST, via handshake auth for Socket.io
4. Middleware validates JWT on all protected routes and socket connections

## Design Decisions
- **Admin-controlled playback** (not scheduled): Admin manually controls play/pause/seek, all viewers mirror state
- **YouTube first, abstracted**: VideoPlayer component wraps YouTube API behind an interface so self-hosted can be added later
- **Drizzle over Prisma**: Lighter weight, no query engine process, SQL-native syntax
- **Persist chat messages**: Enables scroll-back history on join (last 50 messages)
- **Playback state in DB**: Survives server restarts; viewers can always fetch current state
