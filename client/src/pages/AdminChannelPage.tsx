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
