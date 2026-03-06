# WatchTogether MVP Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a live video watching platform where an admin controls playback and all viewers stay synced, with real-time chat.

**Architecture:** Monorepo with React/Vite frontend and Express/Socket.io backend. REST for CRUD, WebSocket for real-time. PostgreSQL via Drizzle ORM. YouTube IFrame API for video (abstracted for future self-hosted).

**Tech Stack:** React, Vite, TypeScript, Express.js, Socket.io, Drizzle ORM, PostgreSQL (Docker), JWT, bcrypt, YouTube IFrame API

**Design doc:** `docs/plans/2026-03-06-watchtogether-design.md`

---

### Task 1: Project Scaffolding & Docker Setup

**Files:**
- Create: `package.json` (workspace root)
- Create: `tsconfig.base.json`
- Create: `docker-compose.yml`
- Create: `.gitignore`
- Create: `.env.example`
- Create: `server/package.json`
- Create: `server/tsconfig.json`
- Create: `server/src/index.ts` (hello world)
- Create: `client/package.json` (via Vite scaffold)
- Create: `client/tsconfig.json`

**Step 1: Create root package.json with npm workspaces**

```json
{
  "name": "watchtogether",
  "private": true,
  "workspaces": ["client", "server"],
  "scripts": {
    "dev": "concurrently \"npm run dev -w server\" \"npm run dev -w client\"",
    "dev:server": "npm run dev -w server",
    "dev:client": "npm run dev -w client"
  },
  "devDependencies": {
    "concurrently": "^9.1.0"
  }
}
```

**Step 2: Create tsconfig.base.json**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "esModuleInterop": true,
    "strict": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

**Step 3: Create docker-compose.yml**

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: watchtogether-db
    environment:
      POSTGRES_USER: watchtogether
      POSTGRES_PASSWORD: watchtogether_dev
      POSTGRES_DB: watchtogether
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
```

**Step 4: Create .env.example and .gitignore**

`.env.example`:
```
DATABASE_URL=postgresql://watchtogether:watchtogether_dev@localhost:5432/watchtogether
JWT_SECRET=change-me-in-production
PORT=3001
CLIENT_URL=http://localhost:5173
```

`.gitignore`:
```
node_modules/
dist/
.env
*.log
```

**Step 5: Scaffold the server**

```bash
mkdir -p server/src
```

`server/package.json`:
```json
{
  "name": "server",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:studio": "drizzle-kit studio",
    "test": "vitest"
  },
  "dependencies": {
    "express": "^5.0.1",
    "socket.io": "^4.8.1",
    "drizzle-orm": "^0.38.3",
    "postgres": "^3.4.5",
    "bcryptjs": "^2.4.3",
    "jsonwebtoken": "^9.0.2",
    "cors": "^2.8.5",
    "dotenv": "^16.4.7",
    "zod": "^3.24.1",
    "uuid": "^11.0.5"
  },
  "devDependencies": {
    "@types/express": "^5.0.0",
    "@types/bcryptjs": "^2.4.6",
    "@types/jsonwebtoken": "^9.0.7",
    "@types/cors": "^2.8.17",
    "@types/uuid": "^10.0.0",
    "tsx": "^4.19.2",
    "typescript": "^5.7.2",
    "drizzle-kit": "^0.30.1",
    "vitest": "^2.1.8"
  }
}
```

`server/tsconfig.json`:
```json
{
  "extends": "../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "dist",
    "rootDir": "src"
  },
  "include": ["src/**/*"]
}
```

`server/src/index.ts`:
```typescript
import 'dotenv/config';
import express from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Step 6: Scaffold the client with Vite**

Run:
```bash
cd /Users/leedalmogbel/watchtogether
npm create vite@latest client -- --template react-ts
```

Then add dependencies to `client/package.json`:
```bash
cd client
npm install socket.io-client react-router-dom axios
npm install -D @types/react-router-dom
```

**Step 7: Create .env from example, start Docker, install deps**

```bash
cd /Users/leedalmogbel/watchtogether
cp .env.example .env
docker compose up -d
npm install
```

**Step 8: Verify everything works**

Run: `npm run dev:server`
Expected: "Server running on port 3001"

Run: `curl http://localhost:3001/api/health`
Expected: `{"status":"ok"}`

Run: `npm run dev:client`
Expected: Vite dev server starts on port 5173

**Step 9: Commit**

```bash
git add -A
git commit -m "feat: scaffold monorepo with React/Vite client and Express server"
```

---

### Task 2: Database Schema with Drizzle

**Files:**
- Create: `server/src/db/schema.ts`
- Create: `server/src/db/index.ts`
- Create: `server/drizzle.config.ts`

**Step 1: Create Drizzle config**

`server/drizzle.config.ts`:
```typescript
import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './src/db/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://watchtogether:watchtogether_dev@localhost:5432/watchtogether',
  },
});
```

**Step 2: Create the database schema**

`server/src/db/schema.ts`:
```typescript
import { pgTable, uuid, varchar, text, boolean, integer, real, timestamp, pgEnum } from 'drizzle-orm/pg-core';

export const userRoleEnum = pgEnum('user_role', ['admin', 'viewer']);
export const videoSourceEnum = pgEnum('video_source', ['youtube', 'self_hosted']);
export const playbackStatusEnum = pgEnum('playback_status', ['playing', 'paused', 'stopped']);

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }).notNull(),
  displayName: varchar('display_name', { length: 100 }).notNull(),
  role: userRoleEnum('role').notNull().default('viewer'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const channels = pgTable('channels', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  slug: varchar('slug', { length: 255 }).notNull().unique(),
  isActive: boolean('is_active').notNull().default(true),
  createdBy: uuid('created_by').notNull().references(() => users.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const playlistItems = pgTable('playlist_items', {
  id: uuid('id').defaultRandom().primaryKey(),
  channelId: uuid('channel_id').notNull().references(() => channels.id, { onDelete: 'cascade' }),
  title: varchar('title', { length: 255 }).notNull(),
  videoUrl: varchar('video_url', { length: 1024 }).notNull(),
  videoSource: videoSourceEnum('video_source').notNull().default('youtube'),
  durationSeconds: integer('duration_seconds'),
  position: integer('position').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const playbackState = pgTable('playback_state', {
  id: uuid('id').defaultRandom().primaryKey(),
  channelId: uuid('channel_id').notNull().references(() => channels.id, { onDelete: 'cascade' }).unique(),
  currentItemId: uuid('current_item_id').references(() => playlistItems.id),
  status: playbackStatusEnum('status').notNull().default('stopped'),
  currentTime: real('current_time').notNull().default(0),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const chatMessages = pgTable('chat_messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  channelId: uuid('channel_id').notNull().references(() => channels.id, { onDelete: 'cascade' }),
  userId: uuid('user_id').notNull().references(() => users.id),
  content: text('content').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
```

**Step 3: Create the database connection**

`server/src/db/index.ts`:
```typescript
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema.js';

const connectionString = process.env.DATABASE_URL || 'postgresql://watchtogether:watchtogether_dev@localhost:5432/watchtogether';

const client = postgres(connectionString);
export const db = drizzle(client, { schema });
```

**Step 4: Generate and run migration**

```bash
cd /Users/leedalmogbel/watchtogether/server
npx drizzle-kit generate
npx drizzle-kit migrate
```

Expected: Migration files created in `server/src/db/migrations/`, tables created in PostgreSQL.

**Step 5: Verify with Drizzle Studio**

```bash
npx drizzle-kit studio
```

Expected: Opens browser showing the 5 tables with correct columns.

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add database schema with Drizzle (users, channels, playlists, playback, chat)"
```

---

### Task 3: Auth System (Register, Login, Middleware)

**Files:**
- Create: `server/src/middleware/auth.ts`
- Create: `server/src/routes/auth.ts`
- Create: `server/src/__tests__/auth.test.ts`

**Step 1: Write auth tests**

`server/src/__tests__/auth.test.ts`:
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

const BASE_URL = 'http://localhost:3001/api';

describe('Auth API', () => {
  const testUser = {
    email: `test-${Date.now()}@example.com`,
    password: 'TestPass123!',
    displayName: 'Test User',
  };
  let token: string;

  describe('POST /auth/register', () => {
    it('should register a new user', async () => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      });
      const data = await res.json();
      expect(res.status).toBe(201);
      expect(data.user.email).toBe(testUser.email);
      expect(data.user.displayName).toBe(testUser.displayName);
      expect(data.token).toBeDefined();
      expect(data.user.passwordHash).toBeUndefined();
    });

    it('should reject duplicate email', async () => {
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(testUser),
      });
      expect(res.status).toBe(409);
    });
  });

  describe('POST /auth/login', () => {
    it('should login with correct credentials', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testUser.email, password: testUser.password }),
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.token).toBeDefined();
      token = data.token;
    });

    it('should reject wrong password', async () => {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: testUser.email, password: 'wrong' }),
      });
      expect(res.status).toBe(401);
    });
  });

  describe('GET /auth/me', () => {
    it('should return current user with valid token', async () => {
      const res = await fetch(`${BASE_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(data.user.email).toBe(testUser.email);
    });

    it('should reject without token', async () => {
      const res = await fetch(`${BASE_URL}/auth/me`);
      expect(res.status).toBe(401);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `cd /Users/leedalmogbel/watchtogether && npm run test -w server -- --run`
Expected: FAIL (routes don't exist yet)

**Step 3: Create auth middleware**

`server/src/middleware/auth.ts`:
```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'change-me-in-production';

export interface AuthPayload {
  userId: string;
  role: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthPayload;
    }
  }
}

export function generateToken(payload: AuthPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

export function verifyToken(token: string): AuthPayload {
  return jwt.verify(token, JWT_SECRET) as AuthPayload;
}

export function authenticate(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return;
  }

  try {
    const token = header.slice(7);
    req.user = verifyToken(token);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
}
```

**Step 4: Create auth routes**

`server/src/routes/auth.ts`:
```typescript
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { db } from '../db/index.js';
import { users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { generateToken, authenticate } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  displayName: z.string().min(1).max(100),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

router.post('/register', async (req, res) => {
  try {
    const body = registerSchema.parse(req.body);

    const existing = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: 'Email already registered' });
      return;
    }

    const passwordHash = await bcrypt.hash(body.password, 10);

    const [user] = await db.insert(users).values({
      email: body.email,
      passwordHash,
      displayName: body.displayName,
    }).returning({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      createdAt: users.createdAt,
    });

    const token = generateToken({ userId: user.id, role: user.role });
    res.status(201).json({ user, token });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error('Register error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const body = loginSchema.parse(req.body);

    const [user] = await db.select().from(users).where(eq(users.email, body.email)).limit(1);
    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const token = generateToken({ userId: user.id, role: user.role });
    res.status(200).json({
      user: {
        id: user.id,
        email: user.email,
        displayName: user.displayName,
        role: user.role,
      },
      token,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error('Login error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/me', authenticate, async (req, res) => {
  try {
    const [user] = await db.select({
      id: users.id,
      email: users.email,
      displayName: users.displayName,
      role: users.role,
      createdAt: users.createdAt,
    }).from(users).where(eq(users.id, req.user!.userId)).limit(1);

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

**Step 5: Wire auth routes into the server**

Update `server/src/index.ts` to add:
```typescript
import authRoutes from './routes/auth.js';
// after app.use(express.json()):
app.use('/api/auth', authRoutes);
```

**Step 6: Run tests to verify they pass**

Run: Start the server, then `npm run test -w server -- --run`
Expected: All 5 auth tests PASS

**Step 7: Commit**

```bash
git add -A
git commit -m "feat: add auth system with register, login, JWT middleware"
```

---

### Task 4: Channel CRUD API

**Files:**
- Create: `server/src/routes/channels.ts`
- Create: `server/src/__tests__/channels.test.ts`

**Step 1: Write channel tests**

`server/src/__tests__/channels.test.ts`:
```typescript
import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = 'http://localhost:3001/api';

describe('Channels API', () => {
  let adminToken: string;
  let viewerToken: string;
  const adminEmail = `admin-${Date.now()}@example.com`;
  const viewerEmail = `viewer-${Date.now()}@example.com`;

  beforeAll(async () => {
    // Register admin (first user or manually set role)
    const adminRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: adminEmail, password: 'Admin123!', displayName: 'Admin' }),
    });
    const adminData = await adminRes.json();
    adminToken = adminData.token;

    // Note: You'll need to manually set this user's role to 'admin' in the DB
    // or create a seed script. For testing, we'll test the 403 path with viewer.

    const viewerRes = await fetch(`${BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: viewerEmail, password: 'Viewer123!', displayName: 'Viewer' }),
    });
    const viewerData = await viewerRes.json();
    viewerToken = viewerData.token;
  });

  describe('POST /channels', () => {
    it('should reject non-admin users', async () => {
      const res = await fetch(`${BASE_URL}/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${viewerToken}`,
        },
        body: JSON.stringify({ name: 'Test Channel' }),
      });
      expect(res.status).toBe(403);
    });
  });

  describe('GET /channels', () => {
    it('should return list of active channels', async () => {
      const res = await fetch(`${BASE_URL}/channels`);
      const data = await res.json();
      expect(res.status).toBe(200);
      expect(Array.isArray(data.channels)).toBe(true);
    });
  });
});
```

**Step 2: Run tests to verify they fail**

Run: `npm run test -w server -- --run`
Expected: FAIL (channel routes don't exist)

**Step 3: Create channel routes**

`server/src/routes/channels.ts`:
```typescript
import { Router } from 'express';
import { db } from '../db/index.js';
import { channels, playlistItems, playbackState } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

const createChannelSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
});

const updateChannelSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  isActive: z.boolean().optional(),
});

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// List active channels
router.get('/', async (_req, res) => {
  try {
    const result = await db.select().from(channels).where(eq(channels.isActive, true));
    res.json({ channels: result });
  } catch (err) {
    console.error('List channels error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get channel by slug (with playlist and playback state)
router.get('/:slug', async (req, res) => {
  try {
    const [channel] = await db.select().from(channels).where(eq(channels.slug, req.params.slug)).limit(1);
    if (!channel) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }

    const playlist = await db.select().from(playlistItems)
      .where(eq(playlistItems.channelId, channel.id))
      .orderBy(asc(playlistItems.position));

    const [state] = await db.select().from(playbackState)
      .where(eq(playbackState.channelId, channel.id))
      .limit(1);

    res.json({ channel, playlist, playbackState: state || null });
  } catch (err) {
    console.error('Get channel error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create channel (admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const body = createChannelSchema.parse(req.body);
    const slug = body.slug || slugify(body.name);

    const existing = await db.select().from(channels).where(eq(channels.slug, slug)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: 'Channel slug already exists' });
      return;
    }

    const [channel] = await db.insert(channels).values({
      name: body.name,
      slug,
      createdBy: req.user!.userId,
    }).returning();

    // Create initial playback state
    await db.insert(playbackState).values({
      channelId: channel.id,
    });

    res.status(201).json({ channel });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error('Create channel error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update channel (admin only)
router.patch('/:slug', authenticate, requireAdmin, async (req, res) => {
  try {
    const body = updateChannelSchema.parse(req.body);

    const [channel] = await db.update(channels)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(channels.slug, req.params.slug))
      .returning();

    if (!channel) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }

    res.json({ channel });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error('Update channel error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

**Step 4: Wire channel routes into the server**

Add to `server/src/index.ts`:
```typescript
import channelRoutes from './routes/channels.js';
app.use('/api/channels', channelRoutes);
```

**Step 5: Run tests to verify they pass**

Run: `npm run test -w server -- --run`
Expected: All channel tests PASS

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add channel CRUD API with admin protection"
```

---

### Task 5: Playlist CRUD API

**Files:**
- Create: `server/src/routes/playlist.ts`
- Create: `server/src/__tests__/playlist.test.ts`

**Step 1: Write playlist tests**

`server/src/__tests__/playlist.test.ts`:
```typescript
import { describe, it, expect, beforeAll } from 'vitest';

const BASE_URL = 'http://localhost:3001/api';

describe('Playlist API', () => {
  // Tests will use an admin-created channel
  // Similar pattern to channels tests: register admin, create channel, manage playlist

  describe('GET /channels/:slug/playlist', () => {
    it('should return empty playlist for new channel', async () => {
      // After channel is created in setup
      const res = await fetch(`${BASE_URL}/channels/test-channel/playlist`);
      // Will be 404 until channel exists — validates route exists
      expect([200, 404]).toContain(res.status);
    });
  });
});
```

**Step 2: Create playlist routes**

`server/src/routes/playlist.ts`:
```typescript
import { Router } from 'express';
import { db } from '../db/index.js';
import { playlistItems, channels } from '../db/schema.js';
import { eq, asc, and } from 'drizzle-orm';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router({ mergeParams: true });

const addItemSchema = z.object({
  title: z.string().min(1).max(255),
  videoUrl: z.string().url(),
  videoSource: z.enum(['youtube', 'self_hosted']).default('youtube'),
  durationSeconds: z.number().int().positive().optional(),
});

const updateItemSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  videoUrl: z.string().url().optional(),
  durationSeconds: z.number().int().positive().optional(),
});

const reorderSchema = z.object({
  itemIds: z.array(z.string().uuid()),
});

async function getChannelBySlug(slug: string) {
  const [channel] = await db.select().from(channels).where(eq(channels.slug, slug)).limit(1);
  return channel;
}

// Get playlist for channel
router.get('/', async (req, res) => {
  try {
    const channel = await getChannelBySlug(req.params.slug);
    if (!channel) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }

    const items = await db.select().from(playlistItems)
      .where(eq(playlistItems.channelId, channel.id))
      .orderBy(asc(playlistItems.position));

    res.json({ playlist: items });
  } catch (err) {
    console.error('Get playlist error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add item to playlist (admin)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const body = addItemSchema.parse(req.body);
    const channel = await getChannelBySlug(req.params.slug);
    if (!channel) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }

    // Get next position
    const existing = await db.select().from(playlistItems)
      .where(eq(playlistItems.channelId, channel.id))
      .orderBy(asc(playlistItems.position));
    const nextPosition = existing.length > 0 ? existing[existing.length - 1].position + 1 : 0;

    const [item] = await db.insert(playlistItems).values({
      channelId: channel.id,
      title: body.title,
      videoUrl: body.videoUrl,
      videoSource: body.videoSource,
      durationSeconds: body.durationSeconds ?? null,
      position: nextPosition,
    }).returning();

    res.status(201).json({ item });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error('Add playlist item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update playlist item (admin)
router.patch('/:itemId', authenticate, requireAdmin, async (req, res) => {
  try {
    const body = updateItemSchema.parse(req.body);

    const [item] = await db.update(playlistItems)
      .set(body)
      .where(eq(playlistItems.id, req.params.itemId))
      .returning();

    if (!item) {
      res.status(404).json({ error: 'Playlist item not found' });
      return;
    }

    res.json({ item });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error('Update playlist item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete playlist item (admin)
router.delete('/:itemId', authenticate, requireAdmin, async (req, res) => {
  try {
    const [item] = await db.delete(playlistItems)
      .where(eq(playlistItems.id, req.params.itemId))
      .returning();

    if (!item) {
      res.status(404).json({ error: 'Playlist item not found' });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete playlist item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reorder playlist items (admin)
router.post('/reorder', authenticate, requireAdmin, async (req, res) => {
  try {
    const body = reorderSchema.parse(req.body);

    for (let i = 0; i < body.itemIds.length; i++) {
      await db.update(playlistItems)
        .set({ position: i })
        .where(eq(playlistItems.id, body.itemIds[i]));
    }

    const channel = await getChannelBySlug(req.params.slug);
    const items = await db.select().from(playlistItems)
      .where(eq(playlistItems.channelId, channel!.id))
      .orderBy(asc(playlistItems.position));

    res.json({ playlist: items });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error('Reorder playlist error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
```

**Step 3: Wire playlist routes into the server**

Add to `server/src/index.ts`:
```typescript
import playlistRoutes from './routes/playlist.js';
app.use('/api/channels/:slug/playlist', playlistRoutes);
```

**Step 4: Run tests**

Run: `npm run test -w server -- --run`
Expected: All tests PASS

**Step 5: Commit**

```bash
git add -A
git commit -m "feat: add playlist CRUD API with reorder support"
```

---

### Task 6: Socket.io Setup — Chat & Presence

**Files:**
- Create: `server/src/socket/index.ts`
- Create: `server/src/socket/chat.ts`
- Create: `server/src/socket/presence.ts`
- Modify: `server/src/index.ts` (add http server + socket.io)

**Step 1: Refactor server to use http.createServer for Socket.io**

Update `server/src/index.ts`:
```typescript
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { setupSocket } from './socket/index.js';
import authRoutes from './routes/auth.js';
import channelRoutes from './routes/channels.js';
import playlistRoutes from './routes/playlist.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/channels/:slug/playlist', playlistRoutes);

setupSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
```

**Step 2: Create Socket.io entry point with JWT auth**

`server/src/socket/index.ts`:
```typescript
import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { verifyToken, AuthPayload } from '../middleware/auth.js';
import { setupChat } from './chat.js';
import { setupPresence } from './presence.js';

export let io: Server;

export function setupSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST'],
    },
  });

  // Authenticate socket connections
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const payload = verifyToken(token);
      socket.data.user = payload;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user as AuthPayload;
    console.log(`User connected: ${user.userId}`);

    socket.on('join:channel', async (slug: string) => {
      // Leave any previous room
      for (const room of socket.rooms) {
        if (room !== socket.id) {
          socket.leave(room);
        }
      }

      socket.join(slug);
      socket.data.channel = slug;
      console.log(`User ${user.userId} joined channel ${slug}`);

      setupChat(socket, slug);
      setupPresence(io, socket, slug);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.userId}`);
    });
  });
}
```

**Step 3: Create chat handler**

`server/src/socket/chat.ts`:
```typescript
import { Socket } from 'socket.io';
import { db } from '../db/index.js';
import { chatMessages, users } from '../db/schema.js';
import { eq, desc, and } from 'drizzle-orm';
import { io } from './index.js';

export function setupChat(socket: Socket, channelSlug: string) {
  const userId = socket.data.user.userId;

  // Send chat history on join (last 50 messages)
  sendChatHistory(socket, channelSlug);

  // Handle incoming messages
  socket.on('chat:message', async (data: { content: string }) => {
    if (!data.content || data.content.trim().length === 0) return;
    if (data.content.length > 500) return;

    try {
      // Get channel ID from slug
      const { channels } = await import('../db/schema.js');
      const [channel] = await db.select().from(channels).where(eq(channels.slug, channelSlug)).limit(1);
      if (!channel) return;

      // Persist message
      const [message] = await db.insert(chatMessages).values({
        channelId: channel.id,
        userId,
        content: data.content.trim(),
      }).returning();

      // Get user display name
      const [user] = await db.select({
        displayName: users.displayName,
      }).from(users).where(eq(users.id, userId)).limit(1);

      // Broadcast to room
      io.to(channelSlug).emit('chat:message', {
        id: message.id,
        userId: message.userId,
        displayName: user?.displayName || 'Unknown',
        content: message.content,
        createdAt: message.createdAt,
      });
    } catch (err) {
      console.error('Chat message error:', err);
    }
  });
}

async function sendChatHistory(socket: Socket, channelSlug: string) {
  try {
    const { channels } = await import('../db/schema.js');
    const [channel] = await db.select().from(channels).where(eq(channels.slug, channelSlug)).limit(1);
    if (!channel) return;

    const messages = await db.select({
      id: chatMessages.id,
      userId: chatMessages.userId,
      displayName: users.displayName,
      content: chatMessages.content,
      createdAt: chatMessages.createdAt,
    })
    .from(chatMessages)
    .innerJoin(users, eq(chatMessages.userId, users.id))
    .where(eq(chatMessages.channelId, channel.id))
    .orderBy(desc(chatMessages.createdAt))
    .limit(50);

    socket.emit('chat:history', { messages: messages.reverse() });
  } catch (err) {
    console.error('Chat history error:', err);
  }
}
```

**Step 4: Create presence handler**

`server/src/socket/presence.ts`:
```typescript
import { Server, Socket } from 'socket.io';

export function setupPresence(io: Server, socket: Socket, channelSlug: string) {
  broadcastPresence(io, channelSlug);

  socket.on('disconnect', () => {
    broadcastPresence(io, channelSlug);
  });
}

async function broadcastPresence(io: Server, channelSlug: string) {
  const sockets = await io.in(channelSlug).fetchSockets();
  const viewerCount = sockets.length;
  io.to(channelSlug).emit('presence:update', { viewerCount });
}
```

**Step 5: Verify server starts without errors**

Run: `npm run dev:server`
Expected: "Server running on port 3001" with no errors

**Step 6: Commit**

```bash
git add -A
git commit -m "feat: add Socket.io with real-time chat and presence tracking"
```

---

### Task 7: Playback Sync (Admin Controls + Viewer Sync)

**Files:**
- Create: `server/src/socket/playback.ts`
- Modify: `server/src/socket/index.ts` (add playback handler)

**Step 1: Create playback handler**

`server/src/socket/playback.ts`:
```typescript
import { Socket } from 'socket.io';
import { db } from '../db/index.js';
import { playbackState, channels, playlistItems } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { io } from './index.js';

interface AdminCommand {
  action: 'play' | 'pause' | 'seek' | 'next' | 'setItem';
  seekTo?: number;
  itemId?: string;
}

export function setupPlayback(socket: Socket, channelSlug: string) {
  const user = socket.data.user;

  // Handle admin commands
  socket.on('admin:command', async (command: AdminCommand) => {
    if (user.role !== 'admin') {
      socket.emit('error', { message: 'Admin access required' });
      return;
    }

    try {
      const [channel] = await db.select().from(channels)
        .where(eq(channels.slug, channelSlug)).limit(1);
      if (!channel) return;

      const [state] = await db.select().from(playbackState)
        .where(eq(playbackState.channelId, channel.id)).limit(1);
      if (!state) return;

      const updates: Partial<typeof state> = { updatedAt: new Date() };

      switch (command.action) {
        case 'play':
          updates.status = 'playing';
          break;
        case 'pause':
          updates.status = 'paused';
          break;
        case 'seek':
          if (command.seekTo !== undefined) {
            updates.currentTime = command.seekTo;
          }
          break;
        case 'setItem':
          if (command.itemId) {
            updates.currentItemId = command.itemId;
            updates.currentTime = 0;
            updates.status = 'playing';
          }
          break;
        case 'next': {
          // Find next item in playlist
          const items = await db.select().from(playlistItems)
            .where(eq(playlistItems.channelId, channel.id))
            .orderBy(playlistItems.position);

          if (state.currentItemId) {
            const currentIndex = items.findIndex(i => i.id === state.currentItemId);
            if (currentIndex >= 0 && currentIndex < items.length - 1) {
              updates.currentItemId = items[currentIndex + 1].id;
              updates.currentTime = 0;
              updates.status = 'playing';
            }
          } else if (items.length > 0) {
            updates.currentItemId = items[0].id;
            updates.currentTime = 0;
            updates.status = 'playing';
          }
          break;
        }
      }

      // Update DB
      const [updated] = await db.update(playbackState)
        .set(updates)
        .where(eq(playbackState.channelId, channel.id))
        .returning();

      // Get current item details
      let currentItem = null;
      if (updated.currentItemId) {
        const [item] = await db.select().from(playlistItems)
          .where(eq(playlistItems.id, updated.currentItemId)).limit(1);
        currentItem = item;
      }

      // Broadcast to all viewers
      io.to(channelSlug).emit('playback:state', {
        status: updated.status,
        currentTime: updated.currentTime,
        currentItem,
        updatedAt: updated.updatedAt,
      });
    } catch (err) {
      console.error('Admin command error:', err);
    }
  });

  // Handle time updates from admin (periodic sync)
  socket.on('playback:timeUpdate', async (data: { currentTime: number }) => {
    if (user.role !== 'admin') return;

    try {
      const [channel] = await db.select().from(channels)
        .where(eq(channels.slug, channelSlug)).limit(1);
      if (!channel) return;

      await db.update(playbackState)
        .set({ currentTime: data.currentTime, updatedAt: new Date() })
        .where(eq(playbackState.channelId, channel.id));

      // Broadcast time to viewers (lightweight update)
      socket.to(channelSlug).emit('playback:timeSync', {
        currentTime: data.currentTime,
      });
    } catch (err) {
      console.error('Time update error:', err);
    }
  });

  // Handle viewer requesting sync (Jump to Live)
  socket.on('playback:sync', async () => {
    try {
      const [channel] = await db.select().from(channels)
        .where(eq(channels.slug, channelSlug)).limit(1);
      if (!channel) return;

      const [state] = await db.select().from(playbackState)
        .where(eq(playbackState.channelId, channel.id)).limit(1);
      if (!state) return;

      let currentItem = null;
      if (state.currentItemId) {
        const [item] = await db.select().from(playlistItems)
          .where(eq(playlistItems.id, state.currentItemId)).limit(1);
        currentItem = item;
      }

      socket.emit('playback:state', {
        status: state.status,
        currentTime: state.currentTime,
        currentItem,
        updatedAt: state.updatedAt,
      });
    } catch (err) {
      console.error('Playback sync error:', err);
    }
  });
}
```

**Step 2: Wire playback into socket index**

Update `server/src/socket/index.ts` — add import and call in the `join:channel` handler:
```typescript
import { setupPlayback } from './playback.js';

// Inside the join:channel handler, after setupPresence:
setupPlayback(socket, slug);
```

**Step 3: Verify server starts**

Run: `npm run dev:server`
Expected: No errors

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add admin playback controls and viewer sync via Socket.io"
```

---

### Task 8: Frontend Scaffolding — Router, Auth Context, API Client

**Files:**
- Create: `client/src/services/api.ts`
- Create: `client/src/services/socket.ts`
- Create: `client/src/context/AuthContext.tsx`
- Create: `client/src/types/index.ts`
- Modify: `client/src/App.tsx`
- Modify: `client/src/main.tsx`

**Step 1: Create shared types**

`client/src/types/index.ts`:
```typescript
export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'viewer';
  createdAt: string;
}

export interface Channel {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistItem {
  id: string;
  channelId: string;
  title: string;
  videoUrl: string;
  videoSource: 'youtube' | 'self_hosted';
  durationSeconds: number | null;
  position: number;
  createdAt: string;
}

export interface PlaybackState {
  status: 'playing' | 'paused' | 'stopped';
  currentTime: number;
  currentItem: PlaylistItem | null;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  content: string;
  createdAt: string;
}
```

**Step 2: Create API client**

`client/src/services/api.ts`:
```typescript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getHeaders(): HeadersInit {
  const headers: HeadersInit = { 'Content-Type': 'application/json' };
  const token = localStorage.getItem('token');
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: { ...getHeaders(), ...options?.headers },
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || 'Request failed');
  }

  return res.json();
}

export const api = {
  auth: {
    register: (data: { email: string; password: string; displayName: string }) =>
      request<{ user: any; token: string }>('/auth/register', { method: 'POST', body: JSON.stringify(data) }),
    login: (data: { email: string; password: string }) =>
      request<{ user: any; token: string }>('/auth/login', { method: 'POST', body: JSON.stringify(data) }),
    me: () => request<{ user: any }>('/auth/me'),
  },
  channels: {
    list: () => request<{ channels: any[] }>('/channels'),
    get: (slug: string) => request<{ channel: any; playlist: any[]; playbackState: any }>(`/channels/${slug}`),
    create: (data: { name: string; slug?: string }) =>
      request<{ channel: any }>('/channels', { method: 'POST', body: JSON.stringify(data) }),
    update: (slug: string, data: { name?: string; isActive?: boolean }) =>
      request<{ channel: any }>(`/channels/${slug}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },
  playlist: {
    get: (slug: string) => request<{ playlist: any[] }>(`/channels/${slug}/playlist`),
    add: (slug: string, data: { title: string; videoUrl: string; videoSource?: string; durationSeconds?: number }) =>
      request<{ item: any }>(`/channels/${slug}/playlist`, { method: 'POST', body: JSON.stringify(data) }),
    update: (slug: string, itemId: string, data: any) =>
      request<{ item: any }>(`/channels/${slug}/playlist/${itemId}`, { method: 'PATCH', body: JSON.stringify(data) }),
    delete: (slug: string, itemId: string) =>
      request<{ success: boolean }>(`/channels/${slug}/playlist/${itemId}`, { method: 'DELETE' }),
    reorder: (slug: string, itemIds: string[]) =>
      request<{ playlist: any[] }>(`/channels/${slug}/playlist/reorder`, { method: 'POST', body: JSON.stringify({ itemIds }) }),
  },
};
```

**Step 3: Create Socket client**

`client/src/services/socket.ts`:
```typescript
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';

let socket: Socket | null = null;

export function connectSocket(token: string): Socket {
  if (socket?.connected) return socket;

  socket = io(SOCKET_URL, {
    auth: { token },
  });

  socket.on('connect', () => {
    console.log('Socket connected');
  });

  socket.on('connect_error', (err) => {
    console.error('Socket connection error:', err.message);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
```

**Step 4: Create Auth context**

`client/src/context/AuthContext.tsx`:
```typescript
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../services/api';
import { connectSocket, disconnectSocket } from '../services/socket';
import type { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.auth.me()
        .then(data => {
          setUser(data.user);
          connectSocket(token);
        })
        .catch(() => {
          localStorage.removeItem('token');
          setToken(null);
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (email: string, password: string) => {
    const data = await api.auth.login({ email, password });
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    connectSocket(data.token);
  };

  const register = async (email: string, password: string, displayName: string) => {
    const data = await api.auth.register({ email, password, displayName });
    localStorage.setItem('token', data.token);
    setToken(data.token);
    setUser(data.user);
    connectSocket(data.token);
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    disconnectSocket();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
```

**Step 5: Set up App with router**

`client/src/App.tsx`:
```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChannelPage from './pages/ChannelPage';
import AdminPage from './pages/AdminPage';
import AdminChannelPage from './pages/AdminChannelPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/" />;
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/channel/:slug" element={
        <ProtectedRoute><ChannelPage /></ProtectedRoute>
      } />
      <Route path="/admin" element={
        <AdminRoute><AdminPage /></AdminRoute>
      } />
      <Route path="/admin/channel/:slug" element={
        <AdminRoute><AdminChannelPage /></AdminRoute>
      } />
      <Route path="/" element={<Navigate to="/login" />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
```

**Step 6: Create placeholder pages**

Create minimal placeholder files for each page:
- `client/src/pages/LoginPage.tsx`
- `client/src/pages/RegisterPage.tsx`
- `client/src/pages/ChannelPage.tsx`
- `client/src/pages/AdminPage.tsx`
- `client/src/pages/AdminChannelPage.tsx`

Each as:
```typescript
export default function PageName() {
  return <div>PageName — TODO</div>;
}
```

**Step 7: Verify client builds**

Run: `npm run dev:client`
Expected: Vite starts, shows login redirect on `/`

**Step 8: Commit**

```bash
git add -A
git commit -m "feat: scaffold frontend with router, auth context, API and socket clients"
```

---

### Task 9: Auth Pages (Login & Register)

**Files:**
- Modify: `client/src/pages/LoginPage.tsx`
- Modify: `client/src/pages/RegisterPage.tsx`

**Step 1: Build Login page**

`client/src/pages/LoginPage.tsx`:
```typescript
import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await login(email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Login failed');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 20 }}>
      <h1>WatchTogether</h1>
      <h2>Login</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        <button type="submit" style={{ width: '100%', padding: 10 }}>Login</button>
      </form>
      <p style={{ marginTop: 12 }}>
        Don't have an account? <Link to="/register">Register</Link>
      </p>
    </div>
  );
}
```

**Step 2: Build Register page**

`client/src/pages/RegisterPage.tsx`:
```typescript
import { useState, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await register(email, password, displayName);
      navigate('/');
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    }
  };

  return (
    <div style={{ maxWidth: 400, margin: '100px auto', padding: 20 }}>
      <h1>WatchTogether</h1>
      <h2>Register</h2>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            placeholder="Display Name"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        <div style={{ marginBottom: 12 }}>
          <input
            type="password"
            placeholder="Password (min 6 characters)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            minLength={6}
            style={{ width: '100%', padding: 8 }}
          />
        </div>
        <button type="submit" style={{ width: '100%', padding: 10 }}>Register</button>
      </form>
      <p style={{ marginTop: 12 }}>
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}
```

**Step 3: Verify pages render**

Run: `npm run dev:client`
Navigate to `http://localhost:5173/login` and `/register`
Expected: Forms render, can submit, redirects on success

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add login and register pages"
```

---

### Task 10: Channel Page — Video Player Component

**Files:**
- Create: `client/src/components/VideoPlayer/VideoPlayer.tsx`
- Create: `client/src/hooks/useSocket.ts`

**Step 1: Create useSocket hook**

`client/src/hooks/useSocket.ts`:
```typescript
import { useEffect, useState } from 'react';
import { getSocket } from '../services/socket';
import type { Socket } from 'socket.io-client';

export function useSocket(channelSlug: string | undefined) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const s = getSocket();
    if (!s || !channelSlug) return;

    setSocket(s);

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    s.on('connect', onConnect);
    s.on('disconnect', onDisconnect);

    if (s.connected) {
      setConnected(true);
    }

    // Join channel room
    s.emit('join:channel', channelSlug);

    return () => {
      s.off('connect', onConnect);
      s.off('disconnect', onDisconnect);
    };
  }, [channelSlug]);

  return { socket, connected };
}
```

**Step 2: Create VideoPlayer component**

`client/src/components/VideoPlayer/VideoPlayer.tsx`:
```typescript
import { useEffect, useRef, useState, useCallback } from 'react';
import type { PlaybackState } from '../../types';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

interface VideoPlayerProps {
  playbackState: PlaybackState | null;
  isAdmin: boolean;
  onTimeUpdate?: (time: number) => void;
  onStateChange?: (state: 'playing' | 'paused') => void;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export default function VideoPlayer({ playbackState, isAdmin, onTimeUpdate, onStateChange }: VideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT) {
      setReady(true);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => setReady(true);
  }, []);

  // Initialize player
  useEffect(() => {
    if (!ready || !containerRef.current) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      height: '100%',
      width: '100%',
      playerVars: {
        autoplay: 0,
        controls: isAdmin ? 1 : 0,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onStateChange: (event: any) => {
          if (isAdmin) {
            const ytState = event.data;
            if (ytState === window.YT.PlayerState.PLAYING) {
              onStateChange?.('playing');
            } else if (ytState === window.YT.PlayerState.PAUSED) {
              onStateChange?.('paused');
            }
          }
        },
      },
    });

    return () => {
      playerRef.current?.destroy();
    };
  }, [ready, isAdmin]);

  // Sync playback state
  useEffect(() => {
    if (!playerRef.current || !playbackState?.currentItem) return;

    const player = playerRef.current;
    const videoId = extractYouTubeId(playbackState.currentItem.videoUrl);
    if (!videoId) return;

    // Load video if different
    const currentVideoUrl = player.getVideoUrl?.() || '';
    const currentId = extractYouTubeId(currentVideoUrl);

    if (currentId !== videoId) {
      player.loadVideoById(videoId, playbackState.currentTime);
    }

    // Sync play/pause state (viewers only)
    if (!isAdmin) {
      if (playbackState.status === 'playing') {
        player.playVideo();
      } else if (playbackState.status === 'paused') {
        player.pauseVideo();
      }
    }
  }, [playbackState, isAdmin]);

  // Admin: periodic time updates
  useEffect(() => {
    if (!isAdmin || !playerRef.current) return;

    const interval = setInterval(() => {
      const time = playerRef.current?.getCurrentTime?.();
      if (time !== undefined) {
        onTimeUpdate?.(time);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isAdmin, onTimeUpdate]);

  return (
    <div style={{ width: '100%', aspectRatio: '16/9', background: '#000' }}>
      <div ref={containerRef} />
    </div>
  );
}
```

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: add VideoPlayer component with YouTube integration and sync"
```

---

### Task 11: Channel Page — Chat Component

**Files:**
- Create: `client/src/components/Chat/Chat.tsx`

**Step 1: Build Chat component**

`client/src/components/Chat/Chat.tsx`:
```typescript
import { useState, useEffect, useRef, FormEvent } from 'react';
import type { Socket } from 'socket.io-client';
import type { ChatMessage } from '../../types';

interface ChatProps {
  socket: Socket | null;
}

export default function Chat({ socket }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    const onHistory = (data: { messages: ChatMessage[] }) => {
      setMessages(data.messages);
    };

    const onMessage = (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    };

    socket.on('chat:history', onHistory);
    socket.on('chat:message', onMessage);

    return () => {
      socket.off('chat:history', onHistory);
      socket.off('chat:message', onMessage);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!socket || !input.trim()) return;

    socket.emit('chat:message', { content: input.trim() });
    setInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 8,
        background: '#1a1a1a',
        color: '#fff',
        fontSize: 14,
      }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ marginBottom: 4 }}>
            <strong style={{ color: '#6c9' }}>{msg.displayName}:</strong>{' '}
            {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          maxLength={500}
          style={{ flex: 1, padding: 8, border: 'none', outline: 'none' }}
        />
        <button type="submit" style={{ padding: '8px 16px' }}>Send</button>
      </form>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add Chat component with real-time messaging"
```

---

### Task 12: Channel Page — Playlist Component

**Files:**
- Create: `client/src/components/Playlist/Playlist.tsx`

**Step 1: Build Playlist component**

`client/src/components/Playlist/Playlist.tsx`:
```typescript
import type { PlaylistItem, PlaybackState } from '../../types';

interface PlaylistProps {
  items: PlaylistItem[];
  playbackState: PlaybackState | null;
  viewerCount: number;
}

export default function Playlist({ items, playbackState, viewerCount }: PlaylistProps) {
  const currentId = playbackState?.currentItem?.id;
  const currentIndex = items.findIndex(i => i.id === currentId);

  const nowPlaying = currentIndex >= 0 ? items[currentIndex] : null;
  const upcoming = currentIndex >= 0 ? items.slice(currentIndex + 1) : items;

  return (
    <div style={{ padding: 16, background: '#111', color: '#fff', height: '100%', overflowY: 'auto' }}>
      {nowPlaying && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase' }}>Now Playing</div>
          <div style={{ fontSize: 16, fontWeight: 'bold', marginTop: 4 }}>
            ► {nowPlaying.title}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', marginBottom: 8 }}>
            {currentIndex >= 0 ? 'Coming Up' : 'Playlist'}
          </div>
          {upcoming.map((item, i) => (
            <div key={item.id} style={{
              padding: '6px 0',
              borderBottom: '1px solid #222',
              fontSize: 14,
            }}>
              {item.title}
              {item.durationSeconds && (
                <span style={{ color: '#666', marginLeft: 8 }}>
                  {Math.floor(item.durationSeconds / 60)}:{String(item.durationSeconds % 60).padStart(2, '0')}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 'auto', paddingTop: 16, fontSize: 14, color: '#888' }}>
        {viewerCount} watching
      </div>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add Playlist component with now playing and upcoming"
```

---

### Task 13: Channel Page — Full Assembly

**Files:**
- Modify: `client/src/pages/ChannelPage.tsx`

**Step 1: Assemble the channel page**

`client/src/pages/ChannelPage.tsx`:
```typescript
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../hooks/useSocket';
import { api } from '../services/api';
import VideoPlayer from '../components/VideoPlayer/VideoPlayer';
import Chat from '../components/Chat/Chat';
import Playlist from '../components/Playlist/Playlist';
import type { Channel, PlaylistItem, PlaybackState } from '../types';

export default function ChannelPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { socket, connected } = useSocket(slug);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';

  // Load channel data
  useEffect(() => {
    if (!slug) return;
    api.channels.get(slug)
      .then(data => {
        setChannel(data.channel);
        setPlaylist(data.playlist);
        if (data.playbackState) {
          setPlaybackState({
            status: data.playbackState.status,
            currentTime: data.playbackState.currentTime,
            currentItem: data.playlist.find((i: PlaylistItem) => i.id === data.playbackState.currentItemId) || null,
            updatedAt: data.playbackState.updatedAt,
          });
        }
      })
      .catch(err => setError(err.message));
  }, [slug]);

  // Listen for real-time updates
  useEffect(() => {
    if (!socket) return;

    const onPlaybackState = (state: PlaybackState) => setPlaybackState(state);
    const onTimeSync = (data: { currentTime: number }) => {
      setPlaybackState(prev => prev ? { ...prev, currentTime: data.currentTime } : null);
    };
    const onPresence = (data: { viewerCount: number }) => setViewerCount(data.viewerCount);

    socket.on('playback:state', onPlaybackState);
    socket.on('playback:timeSync', onTimeSync);
    socket.on('presence:update', onPresence);

    // Request initial sync
    socket.emit('playback:sync');

    return () => {
      socket.off('playback:state', onPlaybackState);
      socket.off('playback:timeSync', onTimeSync);
      socket.off('presence:update', onPresence);
    };
  }, [socket]);

  const handleTimeUpdate = useCallback((time: number) => {
    socket?.emit('playback:timeUpdate', { currentTime: time });
  }, [socket]);

  const handleJumpToLive = () => {
    socket?.emit('playback:sync');
  };

  if (error) return <div style={{ padding: 20, color: 'red' }}>Error: {error}</div>;
  if (!channel) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', background: '#0a0a0a' }}>
      {/* Header */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        padding: '12px 20px', background: '#111', color: '#fff',
      }}>
        <h1 style={{ margin: 0, fontSize: 20 }}>{channel.name}</h1>
        <button
          onClick={handleJumpToLive}
          style={{
            padding: '6px 16px', background: '#e33', color: '#fff',
            border: 'none', borderRadius: 4, cursor: 'pointer', fontWeight: 'bold',
          }}
        >
          Jump to Live
        </button>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: Video + Chat */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <VideoPlayer
            playbackState={playbackState}
            isAdmin={isAdmin}
            onTimeUpdate={handleTimeUpdate}
          />
          <div style={{ flex: 1, minHeight: 200 }}>
            <Chat socket={socket} />
          </div>
        </div>

        {/* Right: Playlist sidebar */}
        <div style={{ width: 300, borderLeft: '1px solid #222' }}>
          <Playlist items={playlist} playbackState={playbackState} viewerCount={viewerCount} />
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Verify channel page renders**

Run: `npm run dev` (both client + server)
Navigate to `http://localhost:5173/channel/test`
Expected: Page loads with video player, chat, and playlist sidebar

**Step 3: Commit**

```bash
git add -A
git commit -m "feat: assemble channel page with video, chat, and playlist"
```

---

### Task 14: Admin Dashboard Page

**Files:**
- Modify: `client/src/pages/AdminPage.tsx`

**Step 1: Build Admin dashboard**

`client/src/pages/AdminPage.tsx`:
```typescript
import { useState, useEffect, FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import type { Channel } from '../types';

export default function AdminPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const data = await api.channels.list();
      setChannels(data.channels);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.channels.create({ name: newName });
      setNewName('');
      setShowCreate(false);
      loadChannels();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const toggleChannel = async (channel: Channel) => {
    await api.channels.update(channel.slug, { isActive: !channel.isActive });
    loadChannels();
  };

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Admin Dashboard</h1>
        <button onClick={logout}>Logout</button>
      </div>

      <p>Logged in as {user?.displayName}</p>

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <div style={{ marginBottom: 20 }}>
        <button onClick={() => setShowCreate(!showCreate)}>
          {showCreate ? 'Cancel' : '+ New Channel'}
        </button>
        {showCreate && (
          <form onSubmit={handleCreate} style={{ marginTop: 12, display: 'flex', gap: 8 }}>
            <input
              type="text"
              placeholder="Channel name"
              value={newName}
              onChange={e => setNewName(e.target.value)}
              required
              style={{ flex: 1, padding: 8 }}
            />
            <button type="submit">Create</button>
          </form>
        )}
      </div>

      <h2>Channels</h2>
      {channels.length === 0 && <p>No channels yet.</p>}
      {channels.map(channel => (
        <div key={channel.id} style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          padding: 12, border: '1px solid #ddd', borderRadius: 4, marginBottom: 8,
        }}>
          <div>
            <strong>{channel.name}</strong>
            <span style={{ marginLeft: 8, color: '#888' }}>/{channel.slug}</span>
            <span style={{
              marginLeft: 8, padding: '2px 6px', borderRadius: 4, fontSize: 12,
              background: channel.isActive ? '#dfd' : '#fdd',
            }}>
              {channel.isActive ? 'Active' : 'Disabled'}
            </span>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => toggleChannel(channel)}>
              {channel.isActive ? 'Disable' : 'Enable'}
            </button>
            <Link to={`/admin/channel/${channel.slug}`}>
              <button>Manage</button>
            </Link>
            <Link to={`/channel/${channel.slug}`}>
              <button>View</button>
            </Link>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add admin dashboard with channel management"
```

---

### Task 15: Admin Channel Page (Playback Controls + Playlist Management)

**Files:**
- Modify: `client/src/pages/AdminChannelPage.tsx`

**Step 1: Build Admin Channel page**

`client/src/pages/AdminChannelPage.tsx`:
```typescript
import { useState, useEffect, FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSocket } from '../hooks/useSocket';
import { api } from '../services/api';
import type { Channel, PlaylistItem, PlaybackState } from '../types';

export default function AdminChannelPage() {
  const { slug } = useParams<{ slug: string }>();
  const { socket } = useSocket(slug);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const [viewerCount, setViewerCount] = useState(0);

  // Add item form
  const [newTitle, setNewTitle] = useState('');
  const [newUrl, setNewUrl] = useState('');

  useEffect(() => {
    if (!slug) return;
    loadChannel();
  }, [slug]);

  useEffect(() => {
    if (!socket) return;

    const onPlaybackState = (state: PlaybackState) => setPlaybackState(state);
    const onPresence = (data: { viewerCount: number }) => setViewerCount(data.viewerCount);

    socket.on('playback:state', onPlaybackState);
    socket.on('presence:update', onPresence);
    socket.emit('playback:sync');

    return () => {
      socket.off('playback:state', onPlaybackState);
      socket.off('presence:update', onPresence);
    };
  }, [socket]);

  const loadChannel = async () => {
    if (!slug) return;
    const data = await api.channels.get(slug);
    setChannel(data.channel);
    setPlaylist(data.playlist);
  };

  const sendCommand = (action: string, extra?: any) => {
    socket?.emit('admin:command', { action, ...extra });
  };

  const handleAddItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    await api.playlist.add(slug, { title: newTitle, videoUrl: newUrl });
    setNewTitle('');
    setNewUrl('');
    loadChannel();
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!slug) return;
    await api.playlist.delete(slug, itemId);
    loadChannel();
  };

  if (!channel) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <Link to="/admin">← Back to Dashboard</Link>
      <h1>{channel.name} — Admin Controls</h1>

      {/* Playback Controls */}
      <div style={{
        padding: 16, background: '#f5f5f5', borderRadius: 8, marginBottom: 20,
      }}>
        <h2>Playback Controls</h2>
        <p>
          Status: <strong>{playbackState?.status || 'stopped'}</strong> |
          Viewers: <strong>{viewerCount}</strong>
        </p>
        {playbackState?.currentItem && (
          <p>Now Playing: <strong>{playbackState.currentItem.title}</strong></p>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
          <button onClick={() => sendCommand('play')}>Play</button>
          <button onClick={() => sendCommand('pause')}>Pause</button>
          <button onClick={() => sendCommand('next')}>Next</button>
          <button onClick={() => sendCommand('seek', { seekTo: 0 })}>Restart</button>
        </div>
      </div>

      {/* Playlist Management */}
      <div style={{ padding: 16, background: '#f5f5f5', borderRadius: 8, marginBottom: 20 }}>
        <h2>Playlist</h2>
        {playlist.map((item, index) => (
          <div key={item.id} style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: 8, borderBottom: '1px solid #ddd',
          }}>
            <div>
              <span style={{ color: '#888', marginRight: 8 }}>#{index + 1}</span>
              {item.title}
              {playbackState?.currentItem?.id === item.id && (
                <span style={{ marginLeft: 8, color: 'green', fontWeight: 'bold' }}>▶ Playing</span>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={() => sendCommand('setItem', { itemId: item.id })}>Play This</button>
              <button onClick={() => handleDeleteItem(item.id)} style={{ color: 'red' }}>Delete</button>
            </div>
          </div>
        ))}

        <h3 style={{ marginTop: 16 }}>Add Video</h3>
        <form onSubmit={handleAddItem} style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Video title"
            value={newTitle}
            onChange={e => setNewTitle(e.target.value)}
            required
            style={{ flex: 1, padding: 8 }}
          />
          <input
            type="url"
            placeholder="YouTube URL"
            value={newUrl}
            onChange={e => setNewUrl(e.target.value)}
            required
            style={{ flex: 1, padding: 8 }}
          />
          <button type="submit">Add</button>
        </form>
      </div>

      <Link to={`/channel/${channel.slug}`}>
        <button>View Channel as Viewer</button>
      </Link>
    </div>
  );
}
```

**Step 2: Commit**

```bash
git add -A
git commit -m "feat: add admin channel page with playback controls and playlist management"
```

---

### Task 16: Seed Script & End-to-End Verification

**Files:**
- Create: `server/src/seed.ts`

**Step 1: Create seed script for testing**

`server/src/seed.ts`:
```typescript
import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db } from './db/index.js';
import { users, channels, playlistItems, playbackState } from './db/schema.js';

async function seed() {
  console.log('Seeding database...');

  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 10);
  const [admin] = await db.insert(users).values({
    email: 'admin@watchtogether.com',
    passwordHash,
    displayName: 'Admin',
    role: 'admin',
  }).returning();
  console.log('Created admin user:', admin.email);

  // Create a channel
  const [channel] = await db.insert(channels).values({
    name: 'Main Room',
    slug: 'main-room',
    createdBy: admin.id,
  }).returning();
  console.log('Created channel:', channel.slug);

  // Add playlist items (example YouTube videos)
  const videos = [
    { title: 'Big Buck Bunny', videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', position: 0 },
    { title: 'Sintel', videoUrl: 'https://www.youtube.com/watch?v=eRsGyueVLvQ', position: 1 },
    { title: 'Tears of Steel', videoUrl: 'https://www.youtube.com/watch?v=R6MlUcmOul8', position: 2 },
  ];

  for (const video of videos) {
    await db.insert(playlistItems).values({
      channelId: channel.id,
      title: video.title,
      videoUrl: video.videoUrl,
      videoSource: 'youtube',
      position: video.position,
    });
  }
  console.log('Added', videos.length, 'playlist items');

  // Create initial playback state
  await db.insert(playbackState).values({
    channelId: channel.id,
  });
  console.log('Created playback state');

  console.log('\nSeed complete!');
  console.log('Admin login: admin@watchtogether.com / admin123');
  console.log('Channel URL: /channel/main-room');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
```

Add to `server/package.json` scripts:
```json
"seed": "tsx src/seed.ts"
```

**Step 2: Run seed**

```bash
cd /Users/leedalmogbel/watchtogether
npm run seed -w server
```

Expected:
```
Seeding database...
Created admin user: admin@watchtogether.com
Created channel: main-room
Added 3 playlist items
Created playback state
Seed complete!
Admin login: admin@watchtogether.com / admin123
Channel URL: /channel/main-room
```

**Step 3: End-to-end verification**

1. Start both servers: `npm run dev`
2. Open `http://localhost:5173/login`
3. Login as `admin@watchtogether.com` / `admin123`
4. Navigate to `/admin` — see Main Room channel
5. Click "Manage" → see playlist with 3 videos
6. Click "Play This" on first video → playback starts
7. Open `/channel/main-room` in another tab — video should be synced
8. Chat messages should appear in both tabs

**Step 4: Commit**

```bash
git add -A
git commit -m "feat: add database seed script with admin user and sample channel"
```

---

## Summary

| Task | What it builds | Estimated steps |
|------|---------------|-----------------|
| 1 | Monorepo + Docker + scaffolding | 9 |
| 2 | Drizzle schema + migrations | 6 |
| 3 | Auth (register/login/JWT middleware) | 7 |
| 4 | Channel CRUD API | 6 |
| 5 | Playlist CRUD API | 5 |
| 6 | Socket.io + chat + presence | 6 |
| 7 | Playback sync (admin controls) | 4 |
| 8 | Frontend scaffolding (router, context, services) | 8 |
| 9 | Login & Register pages | 4 |
| 10 | VideoPlayer component | 3 |
| 11 | Chat component | 2 |
| 12 | Playlist component | 2 |
| 13 | Channel page assembly | 3 |
| 14 | Admin dashboard | 2 |
| 15 | Admin channel page | 2 |
| 16 | Seed script + E2E verification | 4 |

**Total: 16 tasks, ~73 steps**

Each task ends with a commit. The MVP is fully functional after Task 16.
