import { useState, type MouseEvent } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  ListMusic,
  Maximize2,
  Sliders,
  Activity,
  Heart,
  Loader2,
  Youtube,
  Video,
} from 'lucide-react';
import { Track, PlaybackState, RepeatMode, VisualizerMode } from '../types';

interface PlayerBarProps {
  playbackState: PlaybackState;
  isFavorite: boolean;
  queueLength: number;
  visualizerMode: VisualizerMode;
  isVideoMode?: boolean;
  onToggleVideoMode?: () => void;
  onTogglePlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  onSeek: (seconds: number) => void;
  onSetVolume: (vol: number) => void;
  onToggleMute: () => void;
  onToggleShuffle: () => void;
  onToggleRepeat: () => void;
  onSetPlaybackRate: (rate: number) => void;
  onToggleFavorite: () => void;
  onOpenQueue: () => void;
  onOpenEqualizer: () => void;
  onOpenFullScreen: () => void;
  onChangeVisualizerMode: (mode: VisualizerMode) => void;
}

export function PlayerBar({
  playbackState,
  isFavorite,
  queueLength,
  visualizerMode,
  isVideoMode = false,
  onToggleVideoMode,
  onTogglePlayPause,
  onNext,
  onPrev,
  onSeek,
  onSetVolume,
  onToggleMute,
  onToggleShuffle,
  onToggleRepeat,
  onSetPlaybackRate,
  onToggleFavorite,
  onOpenQueue,
  onOpenEqualizer,
  onOpenFullScreen,
  onChangeVisualizerMode,
}: PlayerBarProps) {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    duration,
    volume,
    isMuted,
    playbackRate,
    repeatMode,
    isShuffle,
  } = playbackState;

  const [hoverSeekTime, setHoverSeekTime] = useState<number | null>(null);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs) || secs < 0) return '0:00';
    const minutes = Math.floor(secs / 60);
    const seconds = Math.floor(secs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const isLive = currentTrack?.isLive;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleProgressBarClick = (e: MouseEvent<HTMLDivElement>) => {
    if (isLive || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * duration);
  };

  const handleProgressBarMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (isLive || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const moveX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, moveX / rect.width));
    setHoverSeekTime(ratio * duration);
  };

  const speedOptions = [0.75, 1.0, 1.25, 1.5, 2.0];
  const nextSpeed = () => {
    const currIdx = speedOptions.indexOf(playbackRate);
    const nextIdx = (currIdx + 1) % speedOptions.length;
    onSetPlaybackRate(speedOptions[nextIdx]);
  };

  const cycleVisualizerMode = () => {
    const modes: VisualizerMode[] = ['bars', 'wave', 'radial'];
    const currIdx = modes.indexOf(visualizerMode);
    const nextMode = modes[(currIdx + 1) % modes.length];
    onChangeVisualizerMode(nextMode);
  };

  if (!currentTrack) {
    return null;
  }

  return (
    <footer
      id="main-player-bar"
      className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 px-3 sm:px-6 py-2.5 shadow-2xl transition-all select-none"
    >
      <div className="max-w-7xl mx-auto flex flex-col gap-1.5">
        
        {/* Progress Bar (Scrubber) */}
        {!isLive ? (
          <div className="w-full flex items-center gap-2 group/progress">
            <span className="text-[11px] font-mono text-zinc-400 w-10 text-right shrink-0">
              {formatTime(currentTime)}
            </span>

            <div
              className="relative flex-1 h-3 flex items-center cursor-pointer py-1"
              onClick={handleProgressBarClick}
              onMouseMove={handleProgressBarMouseMove}
              onMouseLeave={() => setHoverSeekTime(null)}
            >
              {/* Background rail */}
              <div className="w-full h-1 group-hover/progress:h-2 bg-zinc-800 rounded-full overflow-hidden transition-all duration-150">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-[width] duration-75 relative"
                  style={{ width: `${Math.min(100, Math.max(0, progressPercent))}%` }}
                />
              </div>

              {/* Scrubber thumb */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -ml-1.5 w-3 h-3 rounded-full bg-white shadow-md shadow-black/60 opacity-0 group-hover/progress:opacity-100 transition-opacity pointer-events-none"
                style={{ left: `${progressPercent}%` }}
              />

              {/* Hover seek preview tooltip */}
              {hoverSeekTime !== null && (
                <div
                  className="absolute -top-7 -translate-x-1/2 px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] font-mono text-zinc-200 shadow-md border border-zinc-700 pointer-events-none"
                  style={{ left: `${(hoverSeekTime / duration) * 100}%` }}
                >
                  {formatTime(hoverSeekTime)}
                </div>
              )}
            </div>

            <span className="text-[11px] font-mono text-zinc-400 w-10 shrink-0">
              {formatTime(duration)}
            </span>
          </div>
        ) : (
          <div className="w-full flex items-center justify-between px-2 py-0.5 bg-emerald-950/20 rounded border border-emerald-500/20 text-[11px] text-emerald-400">
            <span className="flex items-center gap-2 font-medium">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              EN DIRECTO • Emisión online continua
            </span>
            <span className="font-mono text-emerald-400/80 text-[10px]">
              {currentTrack.bitrate || '128 kbps'}
            </span>
          </div>
        )}

        {/* Main 3-Column Controls Grid */}
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          
          {/* Left Column: Track Info */}
          <div className="flex items-center gap-3 min-w-0 w-1/4 sm:w-1/3">
            <div
              className="relative w-11 h-11 sm:w-12 sm:h-12 rounded-lg overflow-hidden bg-zinc-900 shrink-0 shadow-md cursor-pointer group"
              onClick={onOpenFullScreen}
              title="Abrir vista completa"
            >
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
                }}
              />
              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Maximize2 className="w-4 h-4 text-white" />
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5">
                <h4
                  onClick={onOpenFullScreen}
                  className="text-xs sm:text-sm font-bold text-white truncate hover:underline cursor-pointer"
                  title={currentTrack.title}
                >
                  {currentTrack.title}
                </h4>
                {currentTrack.sourceType === 'youtube' && (
                  <span className="px-1.5 py-0.2 rounded bg-red-600/20 text-red-400 border border-red-500/30 text-[9px] font-bold uppercase tracking-wider flex items-center gap-0.5 shrink-0">
                    <Youtube className="w-2.5 h-2.5 fill-current" />
                    YT
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400 truncate" title={currentTrack.artist}>
                {currentTrack.artist}
              </p>
            </div>

            <button
              onClick={onToggleFavorite}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer shrink-0 ${
                isFavorite
                  ? 'text-rose-500 hover:text-rose-400'
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
              title={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
            >
              <Heart className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
            </button>
          </div>

          {/* Center Column: Playback Controls */}
          <div className="flex flex-col items-center justify-center">
            <div className="flex items-center gap-1 sm:gap-3">
              {/* Shuffle */}
              <button
                onClick={onToggleShuffle}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors cursor-pointer ${
                  isShuffle
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title={`Aleatorio: ${isShuffle ? 'Activado' : 'Desactivado'}`}
              >
                <Shuffle className="w-4 h-4" />
              </button>

              {/* Prev */}
              <button
                onClick={onPrev}
                className="p-1.5 sm:p-2 text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer hover:bg-zinc-800/60"
                title="Pista anterior (P)"
              >
                <SkipBack className="w-5 h-5 fill-current" />
              </button>

              {/* Play / Pause Main Button */}
              <button
                id="btn-main-play-pause"
                onClick={onTogglePlayPause}
                disabled={isLoading}
                aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                className="w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white text-zinc-950 flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10 hover:bg-emerald-400 cursor-pointer disabled:opacity-70"
                title="Reproducir / Pausa (Espacio)"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-zinc-950" />
                ) : isPlaying ? (
                  <Pause className="w-5 h-5 fill-current" />
                ) : (
                  <Play className="w-5 h-5 fill-current ml-0.5" />
                )}
              </button>

              {/* Next */}
              <button
                onClick={onNext}
                className="p-1.5 sm:p-2 text-zinc-300 hover:text-white rounded-lg transition-colors cursor-pointer hover:bg-zinc-800/60"
                title="Siguiente pista (N)"
              >
                <SkipForward className="w-5 h-5 fill-current" />
              </button>

              {/* Repeat */}
              <button
                onClick={onToggleRepeat}
                className={`p-1.5 sm:p-2 rounded-lg transition-colors cursor-pointer ${
                  repeatMode !== 'off'
                    ? 'text-emerald-400 bg-emerald-500/10'
                    : 'text-zinc-400 hover:text-zinc-200'
                }`}
                title={`Repetir: ${
                  repeatMode === 'one' ? 'Una pista' : repeatMode === 'all' ? 'Toda la cola' : 'Desactivado'
                }`}
              >
                {repeatMode === 'one' ? (
                  <Repeat1 className="w-4 h-4" />
                ) : (
                  <Repeat className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          {/* Right Column: Volume, EQ, Mode, Queue */}
          <div className="flex items-center justify-end gap-1.5 sm:gap-2.5 w-1/4 sm:w-1/3">
            
            {/* Visualizer Mode cycle */}
            <button
              onClick={cycleVisualizerMode}
              className="hidden lg:flex items-center gap-1 px-2 py-1 text-[11px] font-mono text-zinc-400 hover:text-emerald-300 hover:bg-zinc-900 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
              title={`Modo visualizador: ${visualizerMode.toUpperCase()} (Clic para alternar)`}
            >
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span className="uppercase">{visualizerMode}</span>
            </button>

            {/* Playback speed toggle (0.75x, 1x, etc.) */}
            {!isLive && (
              <button
                onClick={nextSpeed}
                className="hidden sm:inline-flex px-1.5 py-0.5 text-[11px] font-mono font-semibold text-zinc-300 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded transition-colors cursor-pointer"
                title="Velocidad de reproducción"
              >
                {playbackRate}x
              </button>
            )}

            {/* Equalizer trigger */}
            <button
              id="btn-player-equalizer"
              onClick={onOpenEqualizer}
              className="p-1.5 text-zinc-400 hover:text-emerald-400 hover:bg-zinc-900 border border-zinc-800/80 rounded-lg transition-colors cursor-pointer"
              title="Abrir ecualizador de audio"
            >
              <Sliders className="w-4 h-4" />
            </button>

            {/* Volume control */}
            <div className="hidden sm:flex items-center gap-1.5 group/vol">
              <button
                onClick={onToggleMute}
                className="p-1 text-zinc-400 hover:text-white transition-colors cursor-pointer"
                title={isMuted ? 'Activar sonido (M)' : 'Silenciar (M)'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-rose-400" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={(e) => onSetVolume(parseFloat(e.target.value))}
                className="w-16 md:w-20 h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                title={`Volumen: ${Math.round(volume * 100)}%`}
              />
            </div>

            {/* Queue Toggle */}
            <button
              id="btn-player-queue"
              onClick={onOpenQueue}
              className="relative p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800/80 rounded-lg transition-colors cursor-pointer"
              title="Cola de reproducción"
            >
              <ListMusic className="w-4 h-4" />
              {queueLength > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 text-zinc-950 font-bold text-[9px] flex items-center justify-center">
                  {queueLength > 99 ? '99+' : queueLength}
                </span>
              )}
            </button>

            {/* YouTube Video Mode Toggle */}
            {currentTrack.sourceType === 'youtube' && onToggleVideoMode && (
              <button
                onClick={onToggleVideoMode}
                className={`p-1.5 border rounded-lg transition-colors cursor-pointer ${
                  isVideoMode
                    ? 'text-red-400 bg-red-600/20 border-red-500/40 shadow-sm shadow-red-500/10'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-900 border-zinc-800/80'
                }`}
                title={isVideoMode ? 'Ocultar video (Modo Audio)' : 'Ver video de YouTube Music'}
              >
                <Video className="w-4 h-4" />
              </button>
            )}

            {/* Fullscreen Expand */}
            <button
              onClick={onOpenFullScreen}
              className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-900 border border-zinc-800/80 rounded-lg transition-colors cursor-pointer"
              title="Pantalla completa del reproductor (F)"
            >
              <Maximize2 className="w-4 h-4" />
            </button>

          </div>

        </div>

      </div>
    </footer>
  );
}
