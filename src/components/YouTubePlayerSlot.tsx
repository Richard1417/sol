import { Disc3, EyeOff } from 'lucide-react';
import { Track } from '../types';

interface YouTubePlayerSlotProps {
  currentTrack: Track | null;
  isVideoMode: boolean;
  onToggleVideoMode: () => void;
  className?: string;
}

export function YouTubePlayerSlot({
  currentTrack,
  isVideoMode,
  onToggleVideoMode,
  className = '',
}: YouTubePlayerSlotProps) {
  const isYouTubeTrack =
    currentTrack?.sourceType === 'youtube' || Boolean(currentTrack?.youtubeVideoId);

  const showVideo = isYouTubeTrack && isVideoMode;

  return (
    <div
      className={
        showVideo
          ? `relative w-full aspect-video rounded-2xl overflow-hidden bg-black border border-zinc-800 shadow-2xl ${className}`
          : 'fixed -bottom-96 -right-96 w-32 h-32 opacity-0 pointer-events-none -z-50'
      }
    >
      {showVideo && (
        <div className="absolute top-0 left-0 right-0 z-20 flex items-center justify-between p-3 bg-gradient-to-b from-black/80 via-black/40 to-transparent pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-bold uppercase tracking-wider shadow">
              <Disc3 className="w-3 h-3 animate-spin" />
              YouTube Music
            </span>
            <span className="text-xs text-zinc-300 font-medium truncate max-w-[180px] sm:max-w-xs">
              {currentTrack?.title}
            </span>
          </div>

          <button
            onClick={onToggleVideoMode}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-zinc-900/80 hover:bg-zinc-800 text-xs text-zinc-200 border border-zinc-700/60 backdrop-blur-sm transition-colors cursor-pointer"
            title="Ocultar video y volver a vista visualizador"
          >
            <EyeOff className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Modo Audio</span>
          </button>
        </div>
      )}

      {/* Stable container for YouTube IFrame */}
      <div className="w-full h-full">
        <div id="solare-yt-player-slot" className="w-full h-full" />
      </div>
    </div>
  );
}

