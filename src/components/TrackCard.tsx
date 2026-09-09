import { Play, Pause, Heart, ListPlus, Radio, Music, Youtube } from 'lucide-react';
import { Track } from '../types';

interface TrackCardProps {
  key?: string | number;
  track: Track;
  isCurrentTrack: boolean;
  isPlaying: boolean;
  isFavorite: boolean;
  onPlay: () => void;
  onTogglePlayPause: () => void;
  onToggleFavorite: () => void;
  onAddToQueue: () => void;
}

export function TrackCard({
  track,
  isCurrentTrack,
  isPlaying,
  isFavorite,
  onPlay,
  onTogglePlayPause,
  onToggleFavorite,
  onAddToQueue,
}: TrackCardProps) {
  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleMainAction = () => {
    if (isCurrentTrack) {
      onTogglePlayPause();
    } else {
      onPlay();
    }
  };

  return (
    <div
      id={`track-card-${track.id}`}
      className={`group relative flex flex-col bg-zinc-900/60 hover:bg-zinc-900 p-3 rounded-2xl border transition-all duration-200 hover:shadow-xl hover:shadow-black/40 ${
        isCurrentTrack
          ? 'border-emerald-500/50 bg-zinc-900/90 ring-1 ring-emerald-500/20 shadow-lg shadow-emerald-500/5'
          : 'border-zinc-800/80 hover:border-zinc-700'
      }`}
    >
      {/* Cover Image Container */}
      <div className="relative aspect-square w-full rounded-xl overflow-hidden bg-zinc-800 mb-3 shadow-inner">
        <img
          src={track.coverUrl}
          alt={track.title}
          referrerPolicy="no-referrer"
          loading="lazy"
          className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
            isCurrentTrack && isPlaying ? 'brightness-90' : ''
          }`}
          onError={(e) => {
            // Fallback image if unsplash URL fails
            (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
          }}
        />

        {/* Live, YouTube, or Format Badge */}
        <div className="absolute top-2 left-2 flex items-center gap-1.5 z-10">
          {track.sourceType === 'youtube' || track.youtubeVideoId ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold tracking-wider uppercase backdrop-blur-md shadow-sm">
              <Youtube className="w-2.5 h-2.5 fill-current" />
              YT Music
            </span>
          ) : track.isLive ? (
            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600/90 text-white text-[10px] font-bold tracking-wider uppercase backdrop-blur-md shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              En Vivo
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-zinc-950/70 text-zinc-300 text-[10px] font-medium backdrop-blur-md border border-white/10">
              {track.duration ? formatDuration(track.duration) : 'Online'}
            </span>
          )}
        </div>

        {/* Bitrate / Source badge */}
        {track.bitrate && (
          <div className="absolute top-2 right-2 z-10">
            <span className="px-1.5 py-0.5 rounded bg-zinc-950/80 text-[10px] text-zinc-400 backdrop-blur-md font-mono">
              {track.bitrate.split(' ')[0]}
            </span>
          </div>
        )}

        {/* Play Button Overlay */}
        <div
          className={`absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center transition-opacity duration-200 ${
            isCurrentTrack ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          <button
            onClick={handleMainAction}
            aria-label={isCurrentTrack && isPlaying ? 'Pausar' : 'Reproducir'}
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-transform transform active:scale-95 cursor-pointer ${
              isCurrentTrack && isPlaying
                ? 'bg-emerald-500 text-zinc-950 shadow-emerald-500/50 scale-100'
                : 'bg-white text-zinc-950 hover:scale-105 hover:bg-emerald-400'
            }`}
          >
            {isCurrentTrack && isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>
        </div>

        {/* Active frequency wave animation icon on corner */}
        {isCurrentTrack && isPlaying && (
          <div className="absolute bottom-2 right-2 px-2 py-1 rounded-md bg-zinc-950/85 backdrop-blur-md flex items-end gap-0.5 h-5 z-10 border border-emerald-500/30">
            <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.8s_infinite] h-3" />
            <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_1.1s_infinite] h-4" />
            <span className="w-1 bg-emerald-400 rounded-full animate-[bounce_0.6s_infinite] h-2" />
          </div>
        )}
      </div>

      {/* Metadata & Details */}
      <div className="flex-1 flex flex-col justify-between">
        <div>
          <h3
            className={`text-sm font-semibold truncate leading-tight transition-colors ${
              isCurrentTrack ? 'text-emerald-400 font-bold' : 'text-zinc-100 group-hover:text-white'
            }`}
            title={track.title}
          >
            {track.title}
          </h3>
          <p className="text-xs text-zinc-400 truncate mt-1" title={track.artist}>
            {track.artist}
          </p>
        </div>

        {/* Bottom tags & actions */}
        <div className="mt-3 pt-2.5 border-t border-zinc-800/60 flex items-center justify-between">
          <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400 max-w-[120px] truncate">
            {track.sourceType === 'youtube' || track.youtubeVideoId ? (
              <Youtube className="w-3 h-3 text-red-500 fill-current shrink-0" />
            ) : track.sourceType === 'radio' ? (
              <Radio className="w-3 h-3 text-cyan-400 shrink-0" />
            ) : (
              <Music className="w-3 h-3 text-emerald-400 shrink-0" />
            )}
            <span className="truncate">{track.genre}</span>
          </span>

          <div className="flex items-center gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAddToQueue();
              }}
              className="p-1.5 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              title="Añadir a la cola"
            >
              <ListPlus className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isFavorite
                  ? 'text-rose-500 hover:text-rose-400 hover:bg-rose-500/10'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
              title={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            >
              <Heart className={`w-3.5 h-3.5 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
