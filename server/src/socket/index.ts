import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { verifyToken, AuthPayload } from '../middleware/auth.js';
import { setupChat } from './chat.js';
import { setupPresence } from './presence.js';
import { setupPlayback } from './playback.js';

export let io: Server;

export function setupSocket(httpServer: HttpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || /^http:\/\/localhost:(5173|5174)$/,
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
      // Skip if already in this channel
      if (socket.data.channel === slug) return;

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
      setupPlayback(socket, slug);
    });

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${user.userId}`);
    });
  });
}
