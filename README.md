# WatchTogether

A real-time collaborative video watching platform. Create channels, load YouTube playlists, and watch synchronized video with friends — complete with live chat and presence tracking.

## What It Does

- **Synchronized Playback** — Everyone in a channel sees the same video at the same time. Admin controls play/pause/skip, viewers stay in sync automatically.
- **Live Chat** — Real-time messaging per channel via Socket.io.
- **Playlist Management** — Admins add YouTube videos to a channel playlist, reorder, or remove them.
- **Presence Tracking** — See how many people are currently watching.
- **Dark/Light Theme** — Toggle between dark and light mode, persisted in localStorage.
- **Role-Based Access** — Admins manage channels and control playback. Viewers watch and chat.

## Tech Stack

| Layer | Tech |
|-------|------|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS 4, Shadcn/ui |
| Backend | Node.js, Express 5, TypeScript, Socket.io |
| Database | PostgreSQL 16, Drizzle ORM |
| Auth | JWT + bcryptjs |
| Validation | Zod |

## Prerequisites

- Node.js 20+
- Docker (for PostgreSQL)

## Getting Started

### 1. Clone and install

```bash
git clone <repo-url>
cd watchtogether
npm install
```

### 2. Start the database

```bash
docker compose up -d
```

### 3. Configure environment

```bash
cp .env.example server/.env
```

Default `.env` values work out of the box with the Docker setup:

```
DATABASE_URL=postgresql://watchtogether:watchtogether_dev@localhost:5432/watchtogether
JWT_SECRET=change-me-in-production
PORT=3001
CLIENT_URL=http://localhost:5173
```

### 4. Run migrations and seed

```bash
npm run db:migrate -w server
npm run seed -w server
```

### 5. Start development

```bash
npm run dev
```

This starts both the server (port 3001) and client (port 5173) concurrently.

## Demo Accounts

After seeding, the following account is available:

| Role | Email | Password |
|------|-------|----------|
| Admin | `admin@watchtogether.com` | `admin123` |

Register a new account via `/register` to get a viewer account.

### Pre-seeded Content

- **Channel:** Main Room (`/channel/main-room`)
- **Playlist:** Big Buck Bunny, Sintel, Tears of Steel (open-source films)

## Project Structure

```
watchtogether/
├── client/                  # React frontend
│   └── src/
│       ├── components/      # UI components (Chat, Playlist, VideoPlayer, Navbar)
│       ├── context/         # AuthContext, ThemeContext
│       ├── hooks/           # useSocket
│       ├── pages/           # LoginPage, RegisterPage, ChannelPage, AdminPage
│       ├── services/        # API client, socket connection
│       └── types/           # Shared TypeScript types
├── server/                  # Express backend
│   └── src/
│       ├── db/              # Drizzle schema, migrations
│       ├── routes/          # REST endpoints (auth, channels, playlist)
│       ├── socket/          # Real-time handlers (chat, playback, presence)
│       ├── middleware/       # JWT auth middleware
│       └── seed.ts          # Database seeder
├── docker-compose.yml       # PostgreSQL container
└── .env.example             # Environment template
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start server + client concurrently |
| `npm run dev:server` | Start server only |
| `npm run dev:client` | Start client only |
| `npm run db:migrate -w server` | Run database migrations |
| `npm run db:generate -w server` | Generate new migration from schema changes |
| `npm run db:studio -w server` | Open Drizzle Studio (visual DB browser) |
| `npm run seed -w server` | Seed database with sample data |
| `npm run build -w client` | Production build of the frontend |
| `npm run test -w server` | Run server tests |

## How It Works

1. **Admin** logs in, creates a channel, adds YouTube URLs to the playlist.
2. **Admin** opens the channel control page, hits Play — playback state is broadcast to all connected viewers via Socket.io.
3. **Viewers** join the channel URL, the YouTube player auto-syncs to the current position and play state.
4. **Chat** messages are sent and received in real-time within the channel room.
5. **Presence** updates show the live viewer count.
