import { useEffect, useState } from 'react';
import { getSocket } from '@/services/socket';
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
