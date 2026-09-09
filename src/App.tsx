/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useMemo, useEffect } from 'react';
import {
  Radio,
  Music,
  Heart,
  Sparkles,
  Flame,
  Volume2,
  Sliders,
  Play,
  Pause,
  PlusCircle,
  FolderUp,
  Activity,
  Maximize2,
  AlertCircle,
  Compass,
  Headphones,
  Youtube,
  Video,
  EyeOff,
} from 'lucide-react';
import { Track, GenreCategory, VisualizerMode } from './types';
import { useAudioEngine } from './hooks/useAudioEngine';
import { Navbar } from './components/Navbar';
import { TrackCard } from './components/TrackCard';
import { PlayerBar } from './components/PlayerBar';
import { AudioVisualizer } from './components/AudioVisualizer';
import { EqualizerModal } from './components/EqualizerModal';
import { QueueDrawer } from './components/QueueDrawer';
import { CustomStreamModal } from './components/CustomStreamModal';
import { SleepTimerModal } from './components/SleepTimerModal';
import { FullScreenPlayer } from './components/FullScreenPlayer';
import { ShortcutsModal } from './components/ShortcutsModal';
import { LocalAudioModal } from './components/LocalAudioModal';
import { YouTubeSearchModal } from './components/YouTubeSearchModal';
import { YouTubePlayerSlot } from './components/YouTubePlayerSlot';
import { AndroidInstallBanner } from './components/AndroidInstallBanner';
import { MobileBottomNav } from './components/MobileBottomNav';

export default function App() {
  const {
    state,
    queue,
    currentIndex,
    analyserRef,
    eqGains,
    currentPresetName,
    presets,
    sleepTimerSeconds,
    favorites,
    customTracks,
    serverStatus,
    isVideoMode,
    toggleVideoMode,
    playTrack,
    togglePlayPause,
    seek,
    setVolume,
    toggleMute,
    setPlaybackRate,
    toggleRepeat,
    toggleShuffle,
    nextTrack,
    prevTrack,
    setEqGain,
    applyEqPreset,
    resetEq,
    startSleepTimer,
    cancelSleepTimer,
    toggleFavorite,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    addCustomTrack,
  } = useAudioEngine();

  // Navigation & Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GenreCategory>('all');
  const [visualizerMode, setVisualizerMode] = useState<VisualizerMode>('bars');

  // Modals
  const [isEqOpen, setIsEqOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isCustomStreamOpen, setIsCustomStreamOpen] = useState(false);
  const [isSleepTimerOpen, setIsSleepTimerOpen] = useState(false);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isYouTubeSearchOpen, setIsYouTubeSearchOpen] = useState(false);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return;
      }

      switch (e.code) {
        case 'Space':
          e.preventDefault();
          togglePlayPause();
          break;
        case 'ArrowRight':
          e.preventDefault();
          if (state.currentTrack && !state.currentTrack.isLive) {
            seek(state.currentTime + 5);
          }
          break;
        case 'ArrowLeft':
          e.preventDefault();
          if (state.currentTrack && !state.currentTrack.isLive) {
            seek(state.currentTime - 5);
          }
          break;
        case 'ArrowUp':
          e.preventDefault();
          setVolume(Math.min(1, state.volume + 0.05));
          break;
        case 'ArrowDown':
          e.preventDefault();
          setVolume(Math.max(0, state.volume - 0.05));
          break;
        case 'KeyM':
          e.preventDefault();
          toggleMute();
          break;
        case 'KeyN':
          e.preventDefault();
          nextTrack();
          break;
        case 'KeyP':
          e.preventDefault();
          prevTrack();
          break;
        case 'KeyF':
          e.preventDefault();
          setIsFullScreenOpen((prev) => !prev);
          break;
        case 'KeyL':
          e.preventDefault();
          if (state.currentTrack) {
            toggleFavorite(state.currentTrack.id);
          }
          break;
        case 'Escape':
          setIsEqOpen(false);
          setIsQueueOpen(false);
          setIsCustomStreamOpen(false);
          setIsSleepTimerOpen(false);
          setIsFullScreenOpen(false);
          setIsShortcutsOpen(false);
          setIsUploadOpen(false);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlayPause, seek, setVolume, toggleMute, nextTrack, prevTrack, toggleFavorite, state]);

  // Handle Android PWA shortcuts & initial URL parameters (?action=search, ?tab=radio, etc.)
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const params = new URLSearchParams(window.location.search);
      const action = params.get('action');
      const tab = params.get('tab');
      if (action === 'search') {
        setIsYouTubeSearchOpen(true);
      }
      if (tab === 'radio') {
        setSelectedCategory('radio');
      } else if (tab === 'favorites') {
        setSelectedCategory('favorites');
      }
    } catch {
      // ignore
    }
  }, []);

  // Combine default and custom tracks for browsing
  const allTracks = useMemo(() => {
    // Avoid duplicates
    const combined = [...customTracks];
    queue.forEach((item) => {
      if (!combined.some((t) => t.id === item.id)) {
        combined.push(item);
      }
    });
    return combined;
  }, [queue, customTracks]);

  // Filtered tracks
  const filteredTracks = useMemo(() => {
    return allTracks.filter((track) => {
      // Category filter
      if (selectedCategory === 'youtube') {
        if (track.category !== 'youtube' && track.sourceType !== 'youtube' && !track.youtubeVideoId) {
          return false;
        }
      } else if (selectedCategory === 'radio' && !track.isLive) {
        return false;
      } else if (selectedCategory === 'favorites' && !favorites.includes(track.id)) {
        return false;
      } else if (selectedCategory !== 'all' && selectedCategory !== 'radio' && selectedCategory !== 'favorites') {
        if (track.category !== selectedCategory) return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchTitle = track.title.toLowerCase().includes(q);
        const matchArtist = track.artist.toLowerCase().includes(q);
        const matchGenre = track.genre.toLowerCase().includes(q);
        const matchAlbum = track.album?.toLowerCase().includes(q);
        if (!matchTitle && !matchArtist && !matchGenre && !matchAlbum) {
          return false;
        }
      }

      return true;
    });
  }, [allTracks, selectedCategory, searchQuery, favorites]);

  // Categories list
  const categories: { id: GenreCategory; label: string; icon: typeof Music }[] = [
    { id: 'all', label: 'Todos', icon: Compass },
    { id: 'youtube', label: 'YouTube Music', icon: Youtube },
    { id: 'radio', label: 'Radios en Vivo 24/7', icon: Radio },
    { id: 'favorites', label: `Mis Favoritos (${favorites.length})`, icon: Heart },
    { id: 'lofi', label: 'Lo-Fi & Chill', icon: Headphones },
    { id: 'classical', label: 'Clásica & Orquesta', icon: Music },
    { id: 'jazz', label: 'Jazz & Lounge', icon: Sparkles },
    { id: 'electronic', label: 'Electrónica & Synth', icon: Flame },
    { id: 'ambient', label: 'Ambient & Relax', icon: Volume2 },
  ];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col pb-32 selection:bg-emerald-500 selection:text-zinc-950">
      
      {/* Top Navigation */}
      <Navbar
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onOpenYouTubeSearch={() => setIsYouTubeSearchOpen(true)}
        serverStatus={serverStatus}
        onOpenCustomStream={() => setIsCustomStreamOpen(true)}
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenSleepTimer={() => setIsSleepTimerOpen(true)}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
        sleepTimerSeconds={sleepTimerSeconds}
        isPlaying={state.isPlaying}
        currentTrackTitle={state.currentTrack?.title}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6 pb-40 sm:pb-28">
        
        {/* Android PWA Install Banner */}
        <AndroidInstallBanner />
        
        {/* Playback Error Alert if any */}
        {state.error && (
          <div className="mb-6 p-3.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
              <span>{state.error}</span>
            </div>
            <button
              onClick={togglePlayPause}
              className="px-3 py-1 bg-amber-400 text-zinc-950 rounded-lg font-semibold hover:bg-amber-300 transition-colors shrink-0 cursor-pointer"
            >
              Reintentar
            </button>
          </div>
        )}

        {/* Featured Hero: Live Audio Visualizer & Current Playing Stage */}
        {state.currentTrack && (
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-zinc-900 via-zinc-900/90 to-zinc-950 border border-zinc-800/80 p-5 sm:p-7 mb-8 shadow-2xl">
            {/* Ambient Background Aura */}
            <div
              className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none transition-all duration-700"
              style={{ opacity: state.isPlaying ? 0.35 : 0.08 }}
            />
            <div
              className="absolute -left-20 -bottom-20 w-80 h-80 rounded-full bg-cyan-500/10 blur-3xl pointer-events-none transition-all duration-700"
              style={{ opacity: state.isPlaying ? 0.25 : 0.05 }}
            />

            <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6">
              
              {/* Left Info & Cover Art */}
              <div className="flex items-center gap-5 w-full lg:w-auto">
                <div
                  className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden bg-zinc-800 shadow-2xl shrink-0 group cursor-pointer ring-1 ring-white/10"
                  onClick={() => setIsFullScreenOpen(true)}
                  title="Abrir vista completa"
                >
                  <img
                    src={state.currentTrack.coverUrl}
                    alt={state.currentTrack.title}
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
                    }}
                  />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <Maximize2 className="w-5 h-5 text-white" />
                  </div>
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                    {state.currentTrack.sourceType === 'youtube' || state.currentTrack.youtubeVideoId ? (
                      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-bold tracking-wider uppercase">
                        <Youtube className="w-3 h-3 fill-current" />
                        YouTube Music
                      </span>
                    ) : state.currentTrack.isLive ? (
                      <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-600/90 text-white text-[10px] font-bold tracking-wider uppercase shadow-sm">
                        <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                        En Directo
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold tracking-wider uppercase">
                        Streaming HD
                      </span>
                    )}

                    <span className="px-2 py-0.5 rounded-full bg-zinc-800/80 text-zinc-300 text-[10px] font-mono">
                      {state.currentTrack.genre}
                    </span>
                  </div>

                  <h2
                    className="text-lg sm:text-2xl font-black text-white tracking-tight truncate leading-tight hover:text-emerald-300 cursor-pointer transition-colors"
                    onClick={() => setIsFullScreenOpen(true)}
                    title={state.currentTrack.title}
                  >
                    {state.currentTrack.title}
                  </h2>
                  <p className="text-xs sm:text-sm text-zinc-400 truncate mt-0.5" title={state.currentTrack.artist}>
                    {state.currentTrack.artist}
                  </p>

                  <div className="flex items-center gap-2 sm:gap-3 mt-3 flex-wrap">
                    <button
                      onClick={togglePlayPause}
                      className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-zinc-950 font-bold text-xs shadow-lg shadow-emerald-500/25 transition-transform active:scale-95 cursor-pointer"
                    >
                      {state.isPlaying ? (
                        <>
                          <Pause className="w-3.5 h-3.5 fill-current" /> Pausar
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 fill-current ml-0.5" /> Reproducir
                        </>
                      )}
                    </button>

                    {(state.currentTrack.sourceType === 'youtube' || state.currentTrack.youtubeVideoId) && (
                      <button
                        onClick={toggleVideoMode}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                          isVideoMode
                            ? 'bg-red-600 text-white shadow-md shadow-red-600/30'
                            : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                        }`}
                        title={isVideoMode ? 'Ocultar video (Modo Audio)' : 'Ver video de YouTube'}
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

                    <button
                      onClick={() => setIsEqOpen(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium transition-colors cursor-pointer"
                    >
                      <Sliders className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ecualizador</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Right: Audio Visualizer Canvas Stage */}
              <div className="w-full lg:w-96 flex flex-col justify-between bg-zinc-950/70 p-3.5 rounded-2xl border border-zinc-800/80">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-mono">
                    <Activity className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Visualizador de Audio</span>
                  </div>

                  <div className="flex items-center gap-1 bg-zinc-900 p-0.5 rounded-lg border border-zinc-800">
                    {(['bars', 'wave', 'radial'] as VisualizerMode[]).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setVisualizerMode(mode)}
                        className={`px-2 py-0.5 text-[10px] font-mono rounded transition-colors cursor-pointer ${
                          visualizerMode === mode
                            ? 'bg-emerald-500 text-zinc-950 font-bold'
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        {mode.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>

                <AudioVisualizer
                  analyserRef={analyserRef}
                  isPlaying={state.isPlaying}
                  mode={visualizerMode}
                  className="h-24 w-full"
                />
              </div>

            </div>
          </div>
        )}

        {/* YouTube Video Player Component (keeps iframe active in audio mode, shows video when toggled) */}
        <YouTubePlayerSlot
          currentTrack={state.currentTrack}
          isVideoMode={isVideoMode}
          onToggleVideoMode={toggleVideoMode}
          className="mb-8"
        />

        {/* Category Filters Bar */}
        <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-6 no-scrollbar">
          {categories.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.id;
            const isYouTube = cat.id === 'youtube';
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? isYouTube
                      ? 'bg-red-600 text-white shadow-md shadow-red-600/25 scale-[1.02]'
                      : 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 scale-[1.02]'
                    : isYouTube
                    ? 'bg-red-500/10 hover:bg-red-500/20 text-red-300 border border-red-500/20 hover:border-red-500/40'
                    : 'bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 border border-zinc-800/80 hover:border-zinc-700'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isSelected ? (isYouTube ? 'text-white' : 'text-zinc-950') : isYouTube ? 'text-red-400' : 'text-zinc-400'}`} />
                <span>{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tracks Grid Section Header */}
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <div>
            <h3 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
              <span>
                {selectedCategory === 'youtube'
                  ? 'Música de YouTube Music Online'
                  : selectedCategory === 'radio'
                  ? 'Emisoras de Radio en Directo'
                  : selectedCategory === 'favorites'
                  ? 'Tus Canciones Favoritas'
                  : 'Catálogo de Música Online'}
              </span>
              <span className="text-xs font-normal text-zinc-400 px-2 py-0.5 rounded-full bg-zinc-900 border border-zinc-800">
                {filteredTracks.length} {filteredTracks.length === 1 ? 'resultado' : 'resultados'}
              </span>
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              {selectedCategory === 'youtube'
                ? 'Pistas conectadas directamente con los servidores de YouTube Music con audio y video opcional.'
                : 'Haz clic sobre cualquier pista para reproducirla al instante con audio de alta fidelidad.'}
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsYouTubeSearchOpen(true)}
              className="flex items-center gap-1.5 text-xs text-red-300 hover:text-white font-semibold px-3 py-1.5 rounded-xl bg-red-600/15 hover:bg-red-600/30 border border-red-500/30 transition-all cursor-pointer shadow-sm"
            >
              <Youtube className="w-3.5 h-3.5 text-red-500 fill-current" />
              <span>Buscar en YouTube</span>
            </button>

            <button
              onClick={() => setIsCustomStreamOpen(true)}
              className="hidden sm:flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300 font-medium px-2 py-1 rounded-lg hover:bg-emerald-500/10 transition-colors cursor-pointer"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>Añadir Stream</span>
            </button>
          </div>
        </div>

        {/* Tracks Grid */}
        {filteredTracks.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
            {filteredTracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                isCurrentTrack={state.currentTrack?.id === track.id}
                isPlaying={state.isPlaying}
                isFavorite={favorites.includes(track.id)}
                onPlay={() => playTrack(track, filteredTracks)}
                onTogglePlayPause={togglePlayPause}
                onToggleFavorite={() => toggleFavorite(track.id)}
                onAddToQueue={() => addToQueue(track)}
              />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="text-center py-16 px-4 rounded-3xl bg-zinc-900/40 border border-dashed border-zinc-800 flex flex-col items-center justify-center">
            <Music className="w-12 h-12 text-zinc-600 mb-3" />
            <h4 className="text-base font-bold text-zinc-200">
              No se encontraron resultados
            </h4>
            <p className="text-xs text-zinc-400 max-w-sm mt-1">
              {searchQuery
                ? `No hay coincidencias para "${searchQuery}". Prueba buscando otro artista o género.`
                : selectedCategory === 'favorites'
                ? 'Aún no has agregado canciones a favoritos. Haz clic en el icono del corazón en cualquier canción.'
                : 'No hay elementos disponibles en esta categoría.'}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 px-4 py-1.5 text-xs font-semibold bg-zinc-800 hover:bg-zinc-700 text-white rounded-lg transition-colors cursor-pointer"
              >
                Limpiar búsqueda
              </button>
            )}
          </div>
        )}

      </main>

      {/* Sticky Bottom Player Bar */}
      <PlayerBar
        playbackState={state}
        isFavorite={Boolean(state.currentTrack && favorites.includes(state.currentTrack.id))}
        queueLength={queue.length}
        visualizerMode={visualizerMode}
        isVideoMode={isVideoMode}
        onToggleVideoMode={toggleVideoMode}
        onTogglePlayPause={togglePlayPause}
        onNext={nextTrack}
        onPrev={prevTrack}
        onSeek={seek}
        onSetVolume={setVolume}
        onToggleMute={toggleMute}
        onToggleShuffle={toggleShuffle}
        onToggleRepeat={toggleRepeat}
        onSetPlaybackRate={setPlaybackRate}
        onToggleFavorite={() => state.currentTrack && toggleFavorite(state.currentTrack.id)}
        onOpenQueue={() => setIsQueueOpen(true)}
        onOpenEqualizer={() => setIsEqOpen(true)}
        onOpenFullScreen={() => setIsFullScreenOpen(true)}
        onChangeVisualizerMode={setVisualizerMode}
      />

      {/* Android Mobile Ergonomic Bottom Nav */}
      <MobileBottomNav
        selectedCategory={selectedCategory}
        onSelectCategory={setSelectedCategory}
        favoritesCount={favorites.length}
        onOpenYouTubeSearch={() => setIsYouTubeSearchOpen(true)}
        onOpenEqualizer={() => setIsEqOpen(true)}
      />

      {/* Modals & Drawers */}
      <YouTubeSearchModal
        isOpen={isYouTubeSearchOpen}
        onClose={() => setIsYouTubeSearchOpen(false)}
        onPlayTrack={(track) => playTrack(track)}
        onAddToQueue={(track) => addToQueue(track)}
        favorites={favorites}
        onToggleFavorite={toggleFavorite}
      />

      <EqualizerModal
        isOpen={isEqOpen}
        onClose={() => setIsEqOpen(false)}
        gains={eqGains}
        currentPresetName={currentPresetName}
        presets={presets}
        onSetGain={setEqGain}
        onSelectPreset={applyEqPreset}
        onReset={resetEq}
      />

      <QueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        queue={queue}
        currentIndex={currentIndex}
        isPlaying={state.isPlaying}
        onPlayTrack={(track) => playTrack(track)}
        onRemoveTrack={removeFromQueue}
        onReorder={reorderQueue}
        onClearQueue={clearQueue}
      />

      <CustomStreamModal
        isOpen={isCustomStreamOpen}
        onClose={() => setIsCustomStreamOpen(false)}
        onAddTrack={(track, playImmediately) => addCustomTrack(track, playImmediately)}
      />

      <SleepTimerModal
        isOpen={isSleepTimerOpen}
        onClose={() => setIsSleepTimerOpen(false)}
        sleepTimerSeconds={sleepTimerSeconds}
        onStartTimer={startSleepTimer}
        onCancelTimer={cancelSleepTimer}
      />

      <FullScreenPlayer
        isOpen={isFullScreenOpen}
        onClose={() => setIsFullScreenOpen(false)}
        playbackState={state}
        isFavorite={Boolean(state.currentTrack && favorites.includes(state.currentTrack.id))}
        visualizerMode={visualizerMode}
        analyserRef={analyserRef}
        isVideoMode={isVideoMode}
        onToggleVideoMode={toggleVideoMode}
        onTogglePlayPause={togglePlayPause}
        onNext={nextTrack}
        onPrev={prevTrack}
        onSeek={seek}
        onSetVolume={setVolume}
        onToggleMute={toggleMute}
        onToggleShuffle={toggleShuffle}
        onToggleRepeat={toggleRepeat}
        onToggleFavorite={() => state.currentTrack && toggleFavorite(state.currentTrack.id)}
        onOpenEqualizer={() => setIsEqOpen(true)}
        onChangeVisualizerMode={setVisualizerMode}
      />

      <ShortcutsModal
        isOpen={isShortcutsOpen}
        onClose={() => setIsShortcutsOpen(false)}
      />

      <LocalAudioModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onAddTracks={(tracks, playFirst) => {
          tracks.forEach((t) => addCustomTrack(t, false));
          if (playFirst && tracks[0]) {
            playTrack(tracks[0]);
          }
        }}
      />

    </div>
  );
}
