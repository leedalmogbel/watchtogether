# UI Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign WatchTogether frontend from inline styles to a professional, polished UI using Shadcn/ui + Tailwind CSS with custom color palette and dark/light mode toggle.

**Architecture:** Install Tailwind + Shadcn/ui, define custom theme with CSS variables for dark/light modes, create shared Navbar component, then restyle each page component by component. All inline styles replaced with Tailwind classes + Shadcn components.

**Tech Stack:** Tailwind CSS, Shadcn/ui, Lucide React icons, CSS variables for theming

**Design doc:** `docs/plans/2026-03-08-ui-redesign-design.md`

**Colors:** `#355872` (deep steel), `#7AAACE` (sky blue), `#9CD5FF` (light blue), `#F7F8F0` (warm off-white)

---

### Task 1: Install Tailwind CSS + Shadcn/ui + Configure Theme

**Files:**
- Modify: `client/package.json` (new deps)
- Modify: `client/vite.config.ts` (path alias)
- Modify: `client/tsconfig.json` (path alias)
- Modify: `client/tsconfig.app.json` (path alias)
- Create/Modify: `client/src/index.css` (Tailwind directives + theme variables)
- Create: `client/components.json` (shadcn config)
- Create: `client/src/lib/utils.ts` (cn utility)

**Step 1: Install Tailwind CSS v4 and dependencies**

```bash
cd /Users/leedalmogbel/watchtogether/client
npm install tailwindcss @tailwindcss/vite
```

**Step 2: Update vite.config.ts to add Tailwind plugin and path alias**

```typescript
import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from "@tailwindcss/vite"

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
```

**Step 3: Update tsconfig.json to add path alias**

```json
{
  "files": [],
  "references": [
    { "path": "./tsconfig.app.json" },
    { "path": "./tsconfig.node.json" }
  ],
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

**Step 4: Update tsconfig.app.json to add baseUrl and paths**

Add to `compilerOptions`:
```json
"baseUrl": ".",
"paths": {
  "@/*": ["./src/*"]
}
```

**Step 5: Initialize Shadcn/ui**

```bash
cd /Users/leedalmogbel/watchtogether/client
npx shadcn@latest init
```

When prompted, select defaults. This creates `components.json` and `src/lib/utils.ts`.

**Step 6: Replace `client/src/index.css` with Tailwind + custom theme**

```css
@import "tailwindcss";
@import "tw-animate/css";

@custom-variant dark (&:is(.dark *));

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --radius-sm: calc(var(--radius) - 4px);
  --radius-md: calc(var(--radius) - 2px);
  --radius-lg: var(--radius);
  --radius-xl: calc(var(--radius) + 4px);
}

:root {
  --radius: 0.625rem;
  --background: #F7F8F0;
  --foreground: #1A2D3D;
  --card: #FFFFFF;
  --card-foreground: #1A2D3D;
  --popover: #FFFFFF;
  --popover-foreground: #1A2D3D;
  --primary: #355872;
  --primary-foreground: #F7F8F0;
  --secondary: #E8EAE0;
  --secondary-foreground: #355872;
  --muted: #E8EAE0;
  --muted-foreground: #5A7A90;
  --accent: #9CD5FF;
  --accent-foreground: #1A2D3D;
  --destructive: #EF4444;
  --destructive-foreground: #F7F8F0;
  --border: #D4D6CC;
  --input: #D4D6CC;
  --ring: #7AAACE;
}

.dark {
  --background: #0F1A24;
  --foreground: #F7F8F0;
  --card: #1A2D3D;
  --card-foreground: #F7F8F0;
  --popover: #1A2D3D;
  --popover-foreground: #F7F8F0;
  --primary: #7AAACE;
  --primary-foreground: #0F1A24;
  --secondary: #253D52;
  --secondary-foreground: #F7F8F0;
  --muted: #253D52;
  --muted-foreground: #8BA4B8;
  --accent: #355872;
  --accent-foreground: #F7F8F0;
  --destructive: #EF4444;
  --destructive-foreground: #F7F8F0;
  --border: #253D52;
  --input: #253D52;
  --ring: #7AAACE;
}

@layer base {
  * {
    @apply border-border;
  }
  body {
    @apply bg-background text-foreground;
  }
}
```

**Step 7: Add required Shadcn components**

```bash
cd /Users/leedalmogbel/watchtogether/client
npx shadcn@latest add button card input label sonner
```

**Step 8: Verify build**

```bash
cd /Users/leedalmogbel/watchtogether/client
npx tsc --noEmit && npx vite build
```

**Step 9: Commit**

```bash
git add -A
git commit -m "setup Tailwind CSS + Shadcn/ui with custom theme"
```

---

### Task 2: Theme Provider + Navbar Component

**Files:**
- Create: `client/src/context/ThemeContext.tsx`
- Create: `client/src/components/Navbar.tsx`
- Modify: `client/src/App.tsx` (wrap with ThemeProvider, add Navbar)

**Step 1: Create theme provider**

`client/src/context/ThemeContext.tsx`:
```typescript
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(() => {
    const stored = localStorage.getItem('theme') as Theme;
    return stored || 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

**Step 2: Create Navbar component**

`client/src/components/Navbar.tsx`:
```tsx
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui/button';
import { Sun, Moon, LogOut, User } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold text-primary">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground text-sm font-bold">W</span>
          WatchTogether
        </Link>

        {user && (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              {user.displayName}
            </div>
            <Button variant="ghost" size="icon" onClick={toggleTheme}>
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            <Button variant="ghost" size="icon" onClick={logout}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
```

**Step 3: Update App.tsx to include ThemeProvider and Navbar**

Wrap the app with `ThemeProvider` (outside `AuthProvider`). Add `<Navbar />` inside `AppRoutes` for authenticated pages. Add `import { Toaster } from '@/components/ui/sonner'` and `<Toaster />`.

Update `App.tsx`:
```tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { Toaster } from '@/components/ui/sonner';
import Navbar from '@/components/Navbar';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import ChannelPage from '@/pages/ChannelPage';
import AdminPage from '@/pages/AdminPage';
import AdminChannelPage from '@/pages/AdminChannelPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'admin') return <Navigate to="/" />;
  return <>{children}</>;
}

function GuestRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (user) return <Navigate to={user.role === 'admin' ? '/admin' : '/channel/main-room'} />;
  return <>{children}</>;
}

function HomeRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex h-screen items-center justify-center text-muted-foreground">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  return <Navigate to={user.role === 'admin' ? '/admin' : '/channel/main-room'} />;
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      {children}
    </div>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<GuestRoute><LoginPage /></GuestRoute>} />
      <Route path="/register" element={<GuestRoute><RegisterPage /></GuestRoute>} />
      <Route path="/channel/:slug" element={
        <ProtectedRoute><Layout><ChannelPage /></Layout></ProtectedRoute>
      } />
      <Route path="/admin" element={
        <AdminRoute><Layout><AdminPage /></Layout></AdminRoute>
      } />
      <Route path="/admin/channel/:slug" element={
        <AdminRoute><Layout><AdminChannelPage /></Layout></AdminRoute>
      } />
      <Route path="/" element={<HomeRedirect />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <AppRoutes />
          <Toaster />
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
```

**Step 4: Update imports in AuthContext.tsx**

Change relative imports to use `@/` alias:
```typescript
import { api } from '@/services/api';
import { connectSocket, disconnectSocket } from '@/services/socket';
import type { User } from '@/types';
```

**Step 5: Verify build**

```bash
npx tsc --noEmit && npx vite build
```

**Step 6: Commit**

```bash
git add -A
git commit -m "add ThemeProvider, Navbar, and Toaster components"
```

---

### Task 3: Redesign Login & Register Pages

**Files:**
- Modify: `client/src/pages/LoginPage.tsx`
- Modify: `client/src/pages/RegisterPage.tsx`

**Step 1: Redesign LoginPage**

`client/src/pages/LoginPage.tsx`:
```tsx
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#355872] to-[#0F1A24] p-4">
      <Card className="w-full max-w-md border-border/50 bg-card/80 shadow-2xl backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-bold">
            W
          </div>
          <CardTitle className="text-2xl">WatchTogether</CardTitle>
          <CardDescription>Sign in to start watching</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Sign In'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary underline-offset-4 hover:underline">
              Register
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 2: Redesign RegisterPage**

`client/src/pages/RegisterPage.tsx`:
```tsx
import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await register(email, password, displayName);
      navigate('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#355872] to-[#0F1A24] p-4">
      <Card className="w-full max-w-md border-border/50 bg-card/80 shadow-2xl backdrop-blur-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground text-lg font-bold">
            W
          </div>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Join and start watching together</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                type="text"
                placeholder="Your name"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary underline-offset-4 hover:underline">
              Sign In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
```

**Step 3: Delete `client/src/App.css`** (no longer needed)

**Step 4: Verify and commit**

```bash
npx tsc --noEmit && npx vite build
git add -A
git commit -m "redesign login and register pages with Shadcn/ui"
```

---

### Task 4: Redesign Channel Page

**Files:**
- Modify: `client/src/pages/ChannelPage.tsx`
- Modify: `client/src/components/VideoPlayer/VideoPlayer.tsx`
- Modify: `client/src/components/Chat/Chat.tsx`
- Modify: `client/src/components/Playlist/Playlist.tsx`

**Step 1: Redesign Chat component**

`client/src/components/Chat/Chat.tsx`:
```tsx
import { useState, useEffect, useRef, type FormEvent } from 'react';
import type { Socket } from 'socket.io-client';
import type { ChatMessage } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

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
    <div className="flex h-full flex-col border-t border-border">
      <div className="border-b border-border px-4 py-2">
        <h3 className="text-sm font-semibold text-foreground">Live Chat</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Say hello!</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className="text-sm leading-relaxed">
            <span className="font-semibold text-primary">{msg.displayName}</span>{' '}
            <span className="text-foreground">{msg.content}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border p-3">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          maxLength={500}
          className="flex-1"
        />
        <Button type="submit" size="icon" variant="default">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
```

**Step 2: Redesign Playlist component**

`client/src/components/Playlist/Playlist.tsx`:
```tsx
import type { PlaylistItem, PlaybackState } from '@/types';
import { Music, Eye } from 'lucide-react';

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
    <div className="flex h-full flex-col">
      <div className="border-b border-border px-4 py-2">
        <h3 className="text-sm font-semibold text-foreground">Playlist</h3>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {nowPlaying && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">Now Playing</p>
            <div className="rounded-lg border border-primary/30 bg-primary/10 p-3">
              <div className="flex items-center gap-2">
                <Music className="h-4 w-4 text-primary" />
                <span className="font-semibold text-sm text-foreground">{nowPlaying.title}</span>
              </div>
            </div>
          </div>
        )}

        {upcoming.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {currentIndex >= 0 ? 'Coming Up' : 'Playlist'}
            </p>
            <div className="space-y-1">
              {upcoming.map(item => (
                <div key={item.id} className="flex items-center justify-between rounded-md px-3 py-2 text-sm hover:bg-muted/50 transition-colors">
                  <span className="text-foreground">{item.title}</span>
                  {item.durationSeconds && (
                    <span className="text-xs text-muted-foreground">
                      {Math.floor(item.durationSeconds / 60)}:{String(item.durationSeconds % 60).padStart(2, '0')}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-border px-4 py-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
            <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
          </span>
          <Eye className="h-3.5 w-3.5" />
          {viewerCount} watching
        </div>
      </div>
    </div>
  );
}
```

**Step 3: Update VideoPlayer styling**

In `client/src/components/VideoPlayer/VideoPlayer.tsx`, change the return div from inline styles to:
```tsx
return (
  <div className="w-full aspect-video bg-black rounded-none">
    <div ref={containerRef} />
  </div>
);
```

Keep all the logic/hooks the same. Only change the return JSX wrapper and remove all inline `style` props. Update imports to use `@/` alias for types.

**Step 4: Redesign ChannelPage**

`client/src/pages/ChannelPage.tsx`:
```tsx
import { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/services/api';
import VideoPlayer from '@/components/VideoPlayer/VideoPlayer';
import Chat from '@/components/Chat/Chat';
import Playlist from '@/components/Playlist/Playlist';
import { Button } from '@/components/ui/button';
import { Radio } from 'lucide-react';
import type { Channel, PlaylistItem, PlaybackState } from '@/types';

export default function ChannelPage() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const { socket } = useSocket(slug);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [error, setError] = useState('');

  const isAdmin = user?.role === 'admin';

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

  if (error) return <div className="flex h-screen items-center justify-center text-destructive">Error: {error}</div>;
  if (!channel) return <div className="flex h-screen items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* Left: Video + Controls + Chat */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <VideoPlayer
          playbackState={playbackState}
          isAdmin={isAdmin}
          onTimeUpdate={handleTimeUpdate}
        />

        {/* Controls bar below video */}
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-semibold text-foreground">{channel.name}</h2>
            {playbackState?.status === 'playing' && (
              <span className="flex items-center gap-1.5 rounded-full bg-red-500/10 px-2.5 py-0.5 text-xs font-medium text-red-500">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-red-500"></span>
                </span>
                LIVE
              </span>
            )}
          </div>
          <Button variant="outline" size="sm" onClick={handleJumpToLive} className="gap-1.5">
            <Radio className="h-3.5 w-3.5" />
            Jump to Live
          </Button>
        </div>

        {/* Chat */}
        <div className="flex-1 overflow-hidden">
          <Chat socket={socket} />
        </div>
      </div>

      {/* Right: Playlist sidebar */}
      <div className="hidden w-80 flex-col border-l border-border bg-card md:flex">
        <Playlist items={playlist} playbackState={playbackState} viewerCount={viewerCount} />
      </div>
    </div>
  );
}
```

**Step 5: Verify and commit**

```bash
npx tsc --noEmit && npx vite build
git add -A
git commit -m "redesign channel page with video, chat, and playlist"
```

---

### Task 5: Redesign Admin Dashboard Page

**Files:**
- Modify: `client/src/pages/AdminPage.tsx`

**Step 1: Redesign AdminPage**

`client/src/pages/AdminPage.tsx`:
```tsx
import { useState, useEffect, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Settings, ExternalLink, Power } from 'lucide-react';
import { toast } from 'sonner';
import type { Channel } from '@/types';

export default function AdminPage() {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadChannels();
  }, []);

  const loadChannels = async () => {
    try {
      const data = await api.channels.list();
      setChannels(data.channels);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to load channels');
    }
  };

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await api.channels.create({ name: newName });
      setNewName('');
      setShowCreate(false);
      loadChannels();
      toast.success('Channel created!');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to create channel');
    }
  };

  const toggleChannel = async (channel: Channel) => {
    await api.channels.update(channel.slug, { isActive: !channel.isActive });
    loadChannels();
    toast.success(channel.isActive ? 'Channel disabled' : 'Channel enabled');
  };

  return (
    <div className="mx-auto max-w-4xl p-6">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground">Manage your channels</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
          <Plus className="h-4 w-4" />
          New Channel
        </Button>
      </div>

      {showCreate && (
        <Card className="mb-6">
          <CardContent className="pt-6">
            <form onSubmit={handleCreate} className="flex gap-3">
              <Input
                placeholder="Channel name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                required
                className="flex-1"
              />
              <Button type="submit">Create</Button>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancel</Button>
            </form>
          </CardContent>
        </Card>
      )}

      {channels.length === 0 && (
        <div className="py-16 text-center text-muted-foreground">
          <p className="text-lg">No channels yet</p>
          <p className="text-sm">Create your first channel to get started.</p>
        </div>
      )}

      <div className="space-y-3">
        {channels.map(channel => (
          <Card key={channel.id} className="transition-colors hover:border-primary/30">
            <CardContent className="flex items-center justify-between py-4">
              <div className="flex items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{channel.name}</h3>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                      channel.isActive
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}>
                      {channel.isActive ? 'Active' : 'Disabled'}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">/{channel.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" onClick={() => toggleChannel(channel)} title={channel.isActive ? 'Disable' : 'Enable'}>
                  <Power className="h-4 w-4" />
                </Button>
                <Link to={`/admin/channel/${channel.slug}`}>
                  <Button variant="outline" size="sm" className="gap-1.5">
                    <Settings className="h-3.5 w-3.5" />
                    Manage
                  </Button>
                </Link>
                <Link to={`/channel/${channel.slug}`}>
                  <Button variant="ghost" size="icon" title="View channel">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

**Step 2: Verify and commit**

```bash
npx tsc --noEmit && npx vite build
git add -A
git commit -m "redesign admin dashboard with Shadcn cards and toast notifications"
```

---

### Task 6: Redesign Admin Channel Page

**Files:**
- Modify: `client/src/pages/AdminChannelPage.tsx`

**Step 1: Redesign AdminChannelPage**

`client/src/pages/AdminChannelPage.tsx`:
```tsx
import { useState, useEffect, type FormEvent } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useSocket } from '@/hooks/useSocket';
import { api } from '@/services/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Play, Pause, SkipForward, RotateCcw, Trash2, Plus, ArrowLeft, Eye, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import type { Channel, PlaylistItem, PlaybackState } from '@/types';

export default function AdminChannelPage() {
  const { slug } = useParams<{ slug: string }>();
  const { socket } = useSocket(slug);
  const [channel, setChannel] = useState<Channel | null>(null);
  const [playlist, setPlaylist] = useState<PlaylistItem[]>([]);
  const [playbackState, setPlaybackState] = useState<PlaybackState | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
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

  const sendCommand = (action: string, extra?: Record<string, unknown>) => {
    socket?.emit('admin:command', { action, ...extra });
  };

  const handleAddItem = async (e: FormEvent) => {
    e.preventDefault();
    if (!slug) return;
    await api.playlist.add(slug, { title: newTitle, videoUrl: newUrl });
    setNewTitle('');
    setNewUrl('');
    loadChannel();
    toast.success('Video added to playlist');
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!slug) return;
    await api.playlist.delete(slug, itemId);
    loadChannel();
    toast.success('Video removed');
  };

  if (!channel) return <div className="flex h-screen items-center justify-center text-muted-foreground">Loading...</div>;

  return (
    <div className="mx-auto max-w-5xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin">
            <Button variant="ghost" size="icon"><ArrowLeft className="h-4 w-4" /></Button>
          </Link>
          <div>
            <h1 className="text-xl font-bold text-foreground">{channel.name}</h1>
            <p className="text-sm text-muted-foreground">Channel Controls</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <Eye className="h-4 w-4" />
            {viewerCount} watching
          </div>
          <Link to={`/channel/${channel.slug}`}>
            <Button variant="outline" size="sm" className="gap-1.5">
              <ExternalLink className="h-3.5 w-3.5" />
              View Channel
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Playback Controls */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Playback Controls</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Status</span>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  playbackState?.status === 'playing'
                    ? 'bg-green-500/10 text-green-500'
                    : playbackState?.status === 'paused'
                    ? 'bg-yellow-500/10 text-yellow-500'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {playbackState?.status || 'stopped'}
                </span>
              </div>
              {playbackState?.currentItem && (
                <div className="mt-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Now Playing</span>
                  <span className="text-sm font-medium text-foreground">{playbackState.currentItem.title}</span>
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button onClick={() => sendCommand('play')} className="flex-1 gap-1.5">
                <Play className="h-4 w-4" /> Play
              </Button>
              <Button variant="outline" onClick={() => sendCommand('pause')} className="flex-1 gap-1.5">
                <Pause className="h-4 w-4" /> Pause
              </Button>
              <Button variant="outline" onClick={() => sendCommand('next')} className="flex-1 gap-1.5">
                <SkipForward className="h-4 w-4" /> Next
              </Button>
              <Button variant="ghost" size="icon" onClick={() => sendCommand('seek', { seekTo: 0 })} title="Restart">
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Playlist */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Playlist</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {playlist.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">No videos yet. Add one below.</p>
            )}
            {playlist.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between rounded-lg border border-border p-3 transition-colors hover:bg-muted/30">
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">#{index + 1}</span>
                  <span className="text-sm font-medium text-foreground">{item.title}</span>
                  {playbackState?.currentItem?.id === item.id && (
                    <span className="rounded-full bg-green-500/10 px-2 py-0.5 text-xs font-medium text-green-500">Playing</span>
                  )}
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => sendCommand('setItem', { itemId: item.id })}>
                    <Play className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteItem(item.id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            ))}

            <form onSubmit={handleAddItem} className="flex gap-2 pt-2 border-t border-border">
              <Input
                placeholder="Title"
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                required
                className="flex-1"
              />
              <Input
                type="url"
                placeholder="YouTube URL"
                value={newUrl}
                onChange={e => setNewUrl(e.target.value)}
                required
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Plus className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

**Step 2: Verify and commit**

```bash
npx tsc --noEmit && npx vite build
git add -A
git commit -m "redesign admin channel page with playback controls and playlist cards"
```

---

### Task 7: Final Cleanup & Polish

**Files:**
- Delete: `client/src/App.css` (if still exists)
- Modify: `client/src/main.tsx` (remove App.css import if present)
- Modify: `client/src/hooks/useSocket.ts` (update imports to @/ alias)

**Step 1: Clean up old CSS and update all remaining imports to @/ alias**

Go through every file in client/src and ensure:
- No inline `style={{}}` props remain
- All imports use `@/` alias instead of relative `../`
- `App.css` is deleted and not imported
- No unused imports

**Step 2: Verify full build**

```bash
cd /Users/leedalmogbel/watchtogether/client
npx tsc --noEmit && npx vite build
```

**Step 3: Final commit**

```bash
git add -A
git commit -m "cleanup old CSS and finalize UI redesign"
```

---

## Summary

| Task | What it does |
|------|-------------|
| 1 | Install Tailwind + Shadcn/ui, configure custom theme with CSS variables |
| 2 | Create ThemeProvider (dark/light toggle) + Navbar component |
| 3 | Redesign Login & Register pages (glassmorphic cards, gradient bg) |
| 4 | Redesign Channel page (video + chat + playlist with new components) |
| 5 | Redesign Admin dashboard (cards, toasts, icons) |
| 6 | Redesign Admin channel page (playback controls, playlist management) |
| 7 | Final cleanup (remove inline styles, old CSS, fix imports) |

**Total: 7 tasks**
