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
  const { socket } = useSocket(slug);
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
