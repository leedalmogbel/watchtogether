export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'viewer';
  createdAt: string;
}

export interface Channel {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface PlaylistItem {
  id: string;
  channelId: string;
  title: string;
  videoUrl: string;
  videoSource: 'youtube' | 'self_hosted';
  durationSeconds: number | null;
  position: number;
  createdAt: string;
}

export interface PlaybackState {
  status: 'playing' | 'paused' | 'stopped';
  currentTime: number;
  currentItem: PlaylistItem | null;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  displayName: string;
  content: string;
  createdAt: string;
}
