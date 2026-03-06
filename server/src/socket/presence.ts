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
