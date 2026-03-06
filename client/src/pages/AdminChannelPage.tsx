import { useState, useEffect, type FormEvent } from 'react';
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
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!slug) return;
    await api.playlist.delete(slug, itemId);
    loadChannel();
  };

  if (!channel) return <div style={{ padding: 20 }}>Loading...</div>;

  return (
    <div style={{ maxWidth: 900, margin: '0 auto', padding: 20 }}>
      <Link to="/admin">Back to Dashboard</Link>
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
                <span style={{ marginLeft: 8, color: 'green', fontWeight: 'bold' }}>Playing</span>
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
