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
    <div className="flex h-[calc(100vh-3.5rem)] flex-col lg:flex-row">
      {/* Left: Video + Controls */}
      <div className="flex flex-col lg:flex-1 lg:min-w-0">
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

        {/* Playlist below video on mobile */}
        <div className="border-b border-border bg-card lg:hidden">
          <Playlist items={playlist} playbackState={playbackState} viewerCount={viewerCount} />
        </div>

        {/* Chat below video on mobile */}
        <div className="flex-1 overflow-hidden lg:hidden">
          <Chat socket={socket} />
        </div>
      </div>

      {/* Right sidebar: Chat + Playlist (desktop) */}
      <div className="hidden lg:flex w-96 flex-col border-l border-border bg-card">
        {/* Chat takes most space */}
        <div className="flex-1 overflow-hidden">
          <Chat socket={socket} />
        </div>

        {/* Playlist at bottom */}
        <div className="h-64 border-t border-border overflow-hidden">
          <Playlist items={playlist} playbackState={playbackState} viewerCount={viewerCount} />
        </div>
      </div>
    </div>
  );
}
