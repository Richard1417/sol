export type AudioSourceType = 'youtube' | 'stream' | 'track' | 'radio' | 'custom' | 'local';

export type GenreCategory = 
  | 'all'
  | 'youtube'
  | 'radio'
  | 'lofi'
  | 'classical'
  | 'jazz'
  | 'electronic'
  | 'ambient'
  | 'acoustic'
  | 'favorites';

export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string;
  url: string;
  coverUrl: string;
  duration?: number; // in seconds, undefined if live radio
  genre: string;
  category: GenreCategory;
  isLive?: boolean;
  sourceType: AudioSourceType;
  youtubeVideoId?: string;
  videoId?: string;
  bitrate?: string;
  description?: string;
  addedAt?: number;
}

export interface ServerConnectionStatus {
  online: boolean;
  youtubeConnected: boolean;
  latencyMs: number;
  lastChecked: number;
}

export type RepeatMode = 'off' | 'all' | 'one';

export type VisualizerMode = 'bars' | 'wave' | 'radial' | 'minimal';

export interface EqualizerPreset {
  name: string;
  values: [number, number, number, number, number]; // 60Hz, 250Hz, 1kHz, 4kHz, 16kHz (in dB: -12 to +12)
}

export interface PlaybackState {
  currentTrack: Track | null;
  isPlaying: boolean;
  isLoading: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  repeatMode: RepeatMode;
  isShuffle: boolean;
  error: string | null;
}
