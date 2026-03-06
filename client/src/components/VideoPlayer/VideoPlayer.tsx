import { useEffect, useRef, useState } from 'react';
import type { PlaybackState } from '../../types';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

interface VideoPlayerProps {
  playbackState: PlaybackState | null;
  isAdmin: boolean;
  onTimeUpdate?: (time: number) => void;
  onStateChange?: (state: 'playing' | 'paused') => void;
}

function extractYouTubeId(url: string): string | null {
  const match = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : null;
}

export default function VideoPlayer({ playbackState, isAdmin, onTimeUpdate, onStateChange }: VideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [ready, setReady] = useState(false);

  // Load YouTube IFrame API
  useEffect(() => {
    if (window.YT) {
      setReady(true);
      return;
    }

    const tag = document.createElement('script');
    tag.src = 'https://www.youtube.com/iframe_api';
    document.head.appendChild(tag);

    window.onYouTubeIframeAPIReady = () => setReady(true);
  }, []);

  // Initialize player
  useEffect(() => {
    if (!ready || !containerRef.current) return;

    playerRef.current = new window.YT.Player(containerRef.current, {
      height: '100%',
      width: '100%',
      playerVars: {
        autoplay: 0,
        controls: isAdmin ? 1 : 0,
        modestbranding: 1,
        rel: 0,
      },
      events: {
        onStateChange: (event: any) => {
          if (isAdmin) {
            const ytState = event.data;
            if (ytState === window.YT.PlayerState.PLAYING) {
              onStateChange?.('playing');
            } else if (ytState === window.YT.PlayerState.PAUSED) {
              onStateChange?.('paused');
            }
          }
        },
      },
    });

    return () => {
      playerRef.current?.destroy();
    };
  }, [ready, isAdmin]);

  // Sync playback state
  useEffect(() => {
    if (!playerRef.current || !playbackState?.currentItem) return;

    const player = playerRef.current;
    const videoId = extractYouTubeId(playbackState.currentItem.videoUrl);
    if (!videoId) return;

    // Load video if different
    const currentVideoUrl = player.getVideoUrl?.() || '';
    const currentId = extractYouTubeId(currentVideoUrl);

    if (currentId !== videoId) {
      player.loadVideoById(videoId, playbackState.currentTime);
    }

    // Sync play/pause state (viewers only)
    if (!isAdmin) {
      if (playbackState.status === 'playing') {
        player.playVideo();
      } else if (playbackState.status === 'paused') {
        player.pauseVideo();
      }
    }
  }, [playbackState, isAdmin]);

  // Admin: periodic time updates
  useEffect(() => {
    if (!isAdmin || !playerRef.current) return;

    const interval = setInterval(() => {
      const time = playerRef.current?.getCurrentTime?.();
      if (time !== undefined) {
        onTimeUpdate?.(time);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [isAdmin, onTimeUpdate]);

  return (
    <div style={{ width: '100%', aspectRatio: '16/9', background: '#000' }}>
      <div ref={containerRef} />
    </div>
  );
}
