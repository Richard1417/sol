import { useState, useEffect, type RefObject, type MouseEvent } from 'react';
import {
  X,
  Minimize2,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Heart,
  Sliders,
  Radio,
  Music,
  Activity,
  Youtube,
  Video,
  EyeOff,
} from 'lucide-react';
import { Track, PlaybackState, VisualizerMode } from '../types';
import { AudioVisualizer } from './AudioVisualizer';

interface FullScreenPlayerProps {
  isOpen: boolean;
  onClose: () => void;
  playbackState: PlaybackState;
  isFavorite: boolean;
  visualizerMode: VisualizerMode;
  analyserRef: RefObject<AnalyserNode | null>;
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
  onToggleFavorite: () => void;
  onOpenEqualizer: () => void;
  onChangeVisualizerMode: (mode: VisualizerMode) => void;
}

export function FullScreenPlayer({
  isOpen,
  onClose,
  playbackState,
  isFavorite,
  visualizerMode,
  analyserRef,
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
  onToggleFavorite,
  onOpenEqualizer,
  onChangeVisualizerMode,
}: FullScreenPlayerProps) {
  if (!isOpen || !playbackState.currentTrack) return null;

  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    volume,
    isMuted,
    repeatMode,
    isShuffle,
  } = playbackState;

  const isLive = currentTrack.isLive;
  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const isYoutube = currentTrack.sourceType === 'youtube' || Boolean(currentTrack.youtubeVideoId);

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const handleProgressBarClick = (e: MouseEvent<HTMLDivElement>) => {
    if (isLive || duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = Math.max(0, Math.min(1, clickX / rect.width));
    onSeek(ratio * duration);
  };

  return (
    <div className="fixed inset-0 z-50 bg-zinc-950/95 backdrop-blur-2xl text-white flex flex-col justify-between p-6 sm:p-10 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto">
      
      {/* Top Header */}
      <div className="flex items-center justify-between w-full max-w-5xl mx-auto">
        <div className="flex items-center gap-2.5 text-xs text-zinc-400 font-medium">
          {isYoutube ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 font-bold uppercase tracking-wider">
              <Youtube className="w-3.5 h-3.5 fill-current" />
              SOLARE MUSIC • YouTube Music
            </span>
          ) : currentTrack.sourceType === 'radio' ? (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider font-semibold">
              <Radio className="w-3.5 h-3.5" />
              Radio Online en Directo
            </span>
          ) : (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 uppercase tracking-wider font-semibold">
              <Music className="w-3.5 h-3.5" />
              Reproducción Online
            </span>
          )}
        </div>

        {/* Action controls & Visualizer switcher */}
        <div className="flex items-center gap-3">
          {/* YouTube Video / Audio Toggle */}
          {isYoutube && onToggleVideoMode && (
            <button
              onClick={onToggleVideoMode}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                isVideoMode
                  ? 'bg-red-600 text-white border-red-500 shadow-md shadow-red-600/20'
                  : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border-zinc-800'
              }`}
              title={isVideoMode ? 'Cambiar a Modo Visualizador' : 'Ver video de YouTube'}
            >
              {isVideoMode ? (
                <>
                  <EyeOff className="w-3.5 h-3.5" />
                  <span>Modo Audio</span>
                </>
              ) : (
                <>
                  <Video className="w-3.5 h-3.5" />
                  <span>Ver Video</span>
                </>
              )}
            </button>
          )}

          {/* Visualizer Mode Switcher */}
          <div className="flex items-center gap-1 bg-zinc-900/80 p-1 rounded-xl border border-zinc-800">
            {(['bars', 'wave', 'radial'] as VisualizerMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => onChangeVisualizerMode(mode)}
                className={`px-3 py-1 rounded-lg text-xs font-mono uppercase transition-colors cursor-pointer ${
                  visualizerMode === mode
                    ? 'bg-red-600 text-white font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {mode}
              </button>
            ))}
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800/80 rounded-full transition-colors cursor-pointer"
            title="Minimizar (ESC)"
          >
            <Minimize2 className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Main Center Stage */}
      <div className="flex-1 max-w-5xl w-full mx-auto flex flex-col lg:flex-row items-center justify-center gap-8 my-6">
        
        {/* Cover Art with Ambient Glow */}
        <div className="relative group w-64 sm:w-80 md:w-96 aspect-square rounded-3xl overflow-hidden shadow-2xl shadow-emerald-500/10 border border-zinc-800 shrink-0">
          <img
            src={currentTrack.coverUrl}
            alt={currentTrack.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover shadow-2xl"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent flex flex-col justify-end p-6">
            <span className="px-2.5 py-1 rounded-md bg-zinc-950/70 text-xs font-semibold text-emerald-300 w-fit backdrop-blur-md border border-white/10 mb-1">
              {currentTrack.genre}
            </span>
            <span className="text-[11px] text-zinc-300">
              {currentTrack.bitrate || '320 kbps High Quality'}
            </span>
          </div>
        </div>

        {/* Visualizer Canvas & Track Description */}
        <div className="flex-1 w-full flex flex-col justify-between max-w-lg space-y-6">
          <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-snug">
                  {currentTrack.title}
                </h1>
                <p className="text-base text-zinc-400 font-medium mt-1">
                  {currentTrack.artist}
                </p>
                {currentTrack.album && (
                  <p className="text-xs text-zinc-500 mt-0.5">
                    Álbum: {currentTrack.album}
                  </p>
                )}
              </div>

              <button
                onClick={onToggleFavorite}
                className={`p-3 rounded-2xl border transition-all cursor-pointer ${
                  isFavorite
                    ? 'text-rose-500 bg-rose-500/10 border-rose-500/30'
                    : 'text-zinc-400 bg-zinc-900 border-zinc-800 hover:text-white'
                }`}
              >
                <Heart className={`w-6 h-6 ${isFavorite ? 'fill-current' : ''}`} />
              </button>
            </div>

            {currentTrack.description && (
              <p className="text-xs text-zinc-400/90 mt-4 leading-relaxed bg-zinc-900/60 p-3.5 rounded-xl border border-zinc-800/80">
                {currentTrack.description}
              </p>
            )}
          </div>

          {/* Audio Visualizer Stage */}
          <div className="bg-zinc-950/80 border border-zinc-800/80 p-4 rounded-2xl shadow-inner">
            <div className="flex items-center justify-between text-xs text-zinc-400 mb-2">
              <span className="flex items-center gap-1.5 font-mono text-[11px] text-emerald-400">
                <Activity className="w-3.5 h-3.5" />
                Espectro en tiempo real
              </span>
              <span className="text-[10px] text-zinc-500">
                Audio Reactivo
              </span>
            </div>
            <AudioVisualizer
              analyserRef={analyserRef}
              isPlaying={isPlaying}
              mode={visualizerMode}
              className="h-32 sm:h-40 w-full"
            />
          </div>

        </div>

      </div>

      {/* Bottom Controls Stage */}
      <div className="w-full max-w-3xl mx-auto flex flex-col gap-4">
        
        {/* Progress Scrubber */}
        {!isLive ? (
          <div className="w-full flex items-center gap-3">
            <span className="text-xs font-mono text-zinc-400 w-12 text-right">
              {formatTime(currentTime)}
            </span>
            <div
              className="relative flex-1 h-3 flex items-center cursor-pointer"
              onClick={handleProgressBarClick}
            >
              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
            <span className="text-xs font-mono text-zinc-400 w-12">
              {formatTime(duration)}
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 py-1 text-xs text-emerald-400 font-medium">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            TRANSMISIÓN EN VIVO SIN PAUSAS
          </div>
        )}

        {/* Buttons Row */}
        <div className="flex items-center justify-between">
          
          <button
            onClick={onOpenEqualizer}
            className="p-2.5 text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800 rounded-xl transition-colors cursor-pointer"
            title="Ecualizador"
          >
            <Sliders className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={onToggleShuffle}
              className={`p-2 transition-colors cursor-pointer ${
                isShuffle ? 'text-emerald-400' : 'text-zinc-500 hover:text-white'
              }`}
              title="Aleatorio"
            >
              <Shuffle className="w-5 h-5" />
            </button>

            <button
              onClick={onPrev}
              className="p-2 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Anterior"
            >
              <SkipBack className="w-7 h-7 fill-current" />
            </button>

            <button
              onClick={onTogglePlayPause}
              className="w-16 h-16 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 flex items-center justify-center shadow-xl shadow-emerald-500/20 hover:scale-105 active:scale-95 transition-all cursor-pointer"
            >
              {isPlaying ? (
                <Pause className="w-7 h-7 fill-current" />
              ) : (
                <Play className="w-7 h-7 fill-current ml-1" />
              )}
            </button>

            <button
              onClick={onNext}
              className="p-2 text-zinc-300 hover:text-white transition-colors cursor-pointer"
              title="Siguiente"
            >
              <SkipForward className="w-7 h-7 fill-current" />
            </button>

            <button
              onClick={onToggleRepeat}
              className={`p-2 transition-colors cursor-pointer ${
                repeatMode !== 'off' ? 'text-emerald-400' : 'text-zinc-500 hover:text-white'
              }`}
              title="Repetir"
            >
              {repeatMode === 'one' ? (
                <Repeat1 className="w-5 h-5" />
              ) : (
                <Repeat className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Volume */}
          <div className="flex items-center gap-2">
            <button
              onClick={onToggleMute}
              className="p-2 text-zinc-400 hover:text-white cursor-pointer"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5 text-rose-400" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => onSetVolume(parseFloat(e.target.value))}
              className="w-24 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
            />
          </div>

        </div>

      </div>

    </div>
  );
}
