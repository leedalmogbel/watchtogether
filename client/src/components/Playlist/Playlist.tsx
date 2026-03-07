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
