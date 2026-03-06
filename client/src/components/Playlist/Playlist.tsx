import type { PlaylistItem, PlaybackState } from '../../types';

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
    <div style={{ padding: 16, background: '#111', color: '#fff', height: '100%', overflowY: 'auto' }}>
      {nowPlaying && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase' }}>Now Playing</div>
          <div style={{ fontSize: 16, fontWeight: 'bold', marginTop: 4 }}>
            {nowPlaying.title}
          </div>
        </div>
      )}

      {upcoming.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: '#888', textTransform: 'uppercase', marginBottom: 8 }}>
            {currentIndex >= 0 ? 'Coming Up' : 'Playlist'}
          </div>
          {upcoming.map((item) => (
            <div key={item.id} style={{
              padding: '6px 0',
              borderBottom: '1px solid #222',
              fontSize: 14,
            }}>
              {item.title}
              {item.durationSeconds && (
                <span style={{ color: '#666', marginLeft: 8 }}>
                  {Math.floor(item.durationSeconds / 60)}:{String(item.durationSeconds % 60).padStart(2, '0')}
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 'auto', paddingTop: 16, fontSize: 14, color: '#888' }}>
        {viewerCount} watching
      </div>
    </div>
  );
}
