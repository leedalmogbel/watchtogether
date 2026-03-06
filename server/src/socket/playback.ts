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
