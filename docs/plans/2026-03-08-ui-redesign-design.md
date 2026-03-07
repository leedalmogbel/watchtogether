# WatchTogether UI Redesign — Design Doc

## Overview

Redesign all frontend pages from inline styles to a professional, polished UI using Shadcn/ui + Tailwind CSS with a custom color palette. Support dark and light mode with toggle.

## Tech

- **Tailwind CSS** — utility-first styling
- **Shadcn/ui** — pre-built accessible components (Button, Card, Input, Dialog, etc.)
- **CSS variables** — theme tokens for dark/light mode

## Color Palette

Brand colors: `#355872`, `#7AAACE`, `#9CD5FF`, `#F7F8F0`

### Dark Mode
| Token | Color | Usage |
|-------|-------|-------|
| background | #0F1A24 | Page background |
| card | #1A2D3D | Cards, panels, sidebar |
| muted | #253D52 | Borders, dividers |
| primary | #7AAACE | Buttons, links, active states |
| primary-hover | #9CD5FF | Hover on primary |
| accent | #355872 | Secondary buttons, tags |
| foreground | #F7F8F0 | Main text |
| muted-foreground | #8BA4B8 | Subtle text |
| destructive | #EF4444 | Delete, errors |

### Light Mode
| Token | Color | Usage |
|-------|-------|-------|
| background | #F7F8F0 | Page background |
| card | #FFFFFF | Cards, panels |
| muted | #E8EAE0 | Borders, dividers |
| primary | #355872 | Buttons, links |
| primary-hover | #7AAACE | Hover states |
| accent | #9CD5FF | Highlights, badges |
| foreground | #1A2D3D | Main text |
| muted-foreground | #5A7A90 | Subtle text |

## Pages

### Login / Register
- Gradient background (#355872 to #0F1A24 diagonal)
- Glassmorphic card (backdrop blur, soft border)
- Primary gradient button
- Links to switch between login/register

### Channel Page
- Fixed navbar with logo, channel name, user, theme toggle
- Video player (16:9, rounded, shadow)
- LIVE badge (red pulsing dot) + Jump to Live button below player
- Chat panel below video with message bubbles, auto-scroll
- Playlist sidebar: now playing highlighted with accent border + glow, upcoming items

### Admin Dashboard
- Navbar
- Channel list as cards with status badges, viewer count, manage/view buttons
- Create channel button opens form/dialog
- Cards with hover lift effect

### Admin Channel Page
- Two-column layout: playback controls (left) + playlist management (right)
- Playback: status display, play/pause/next/restart buttons
- Playlist: ordered list with play/delete per item, add video form at bottom

## Components

### Navbar (new, shared)
- Fixed top, backdrop blur
- Logo + app name left
- User avatar + display name + theme toggle (sun/moon) + logout right

### Buttons (shadcn)
- Primary: gradient #355872 to #7AAACE, hover glow
- Secondary: outlined with #7AAACE border
- Destructive: red
- Ghost: transparent for toolbar icons

### Cards (shadcn)
- Rounded-lg, subtle shadow
- Hover: slight lift + border shift to #7AAACE
- Dark: #1A2D3D bg, #253D52 border

### Chat
- Message bubbles with rounded corners
- User names in #7AAACE, timestamps muted
- Pill-shaped input, primary gradient send button
- Auto-scroll with new messages indicator

### Playlist sidebar
- Now playing: left accent border (#7AAACE) + subtle glow
- Upcoming: hover highlight
- Viewer count badge with pulsing dot

### Video player
- LIVE badge (red pulse + text)
- Jump to Live button below
- Rounded container with shadow

### Theme toggle
- Sun/moon icon in navbar
- Smooth CSS transition

### Toasts (shadcn)
- Success/error notifications for actions
