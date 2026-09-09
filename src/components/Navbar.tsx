import { Search, Disc3, PlusCircle, FolderUp, Moon, Keyboard, Youtube, Wifi } from 'lucide-react';
import { ServerConnectionStatus } from '../types';

interface NavbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  onOpenCustomStream: () => void;
  onOpenUpload: () => void;
  onOpenSleepTimer: () => void;
  onOpenShortcuts: () => void;
  onOpenYouTubeSearch?: () => void;
  sleepTimerSeconds: number | null;
  isPlaying: boolean;
  currentTrackTitle?: string;
  serverStatus?: ServerConnectionStatus;
}

export function Navbar({
  searchQuery,
  onSearchChange,
  onOpenCustomStream,
  onOpenUpload,
  onOpenSleepTimer,
  onOpenShortcuts,
  onOpenYouTubeSearch,
  sleepTimerSeconds,
  isPlaying,
  currentTrackTitle,
  serverStatus,
}: NavbarProps) {
  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <header className="sticky top-0 z-30 w-full bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800/80 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-3">
        
        {/* Logo & Brand: SOLARE MUSIC */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 via-red-500 to-rose-600 flex items-center justify-center shadow-lg shadow-red-500/20 ring-1 ring-white/20">
            <Disc3 className={`w-5 h-5 text-white ${isPlaying ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-base tracking-wider text-white flex items-center gap-1.5 font-mono">
                SOLARE<span className="text-red-500">MUSIC</span>
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-500/15 text-red-400 border border-red-500/30 flex items-center gap-1">
                <Youtube className="w-2.5 h-2.5 fill-current" />
                YT Server
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[11px] text-zinc-400 hidden sm:flex">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Conectado a YouTube Music Online</span>
              {serverStatus?.latencyMs ? (
                <span className="text-[10px] text-zinc-500 font-mono">({serverStatus.latencyMs}ms)</span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Live Audio Activity pill (if playing) */}
        {isPlaying && currentTrackTitle && (
          <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 max-w-[240px] truncate shadow-inner">
            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
            <span className="truncate">{currentTrackTitle}</span>
          </div>
        )}

        {/* Search Bar with YouTube Music capability */}
        <div className="flex-1 max-w-md mx-2">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="music-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Buscar en YouTube Music o canciones online..."
              className="w-full bg-zinc-900/90 hover:bg-zinc-900 text-sm text-zinc-100 placeholder:text-zinc-500 pl-9 pr-8 py-1.5 rounded-xl border border-zinc-800 focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => onSearchChange('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white px-1"
                aria-label="Limpiar búsqueda"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          {/* Quick YouTube Music Search Dialog button */}
          {onOpenYouTubeSearch && (
            <button
              id="btn-yt-search"
              onClick={onOpenYouTubeSearch}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-white bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 rounded-lg shadow-sm shadow-red-500/20 transition-all cursor-pointer"
              title="Buscar directamente en los servidores de YouTube Music"
            >
              <Youtube className="w-4 h-4 fill-current" />
              <span className="hidden sm:inline">Explorar YT</span>
            </button>
          )}

          {/* Custom stream URL / YouTube Link */}
          <button
            id="btn-add-stream"
            onClick={onOpenCustomStream}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-colors cursor-pointer"
            title="Pegar link de YouTube Music o URL de stream"
          >
            <PlusCircle className="w-4 h-4 text-emerald-400" />
            <span className="hidden lg:inline">Añadir Link</span>
          </button>

          {/* Upload local file */}
          <button
            id="btn-upload-local"
            onClick={onOpenUpload}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-zinc-200 hover:text-white bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 hover:border-zinc-700 rounded-lg transition-colors cursor-pointer"
            title="Cargar archivos de audio local"
          >
            <FolderUp className="w-4 h-4 text-cyan-400" />
            <span className="hidden lg:inline">Archivos</span>
          </button>

          {/* Sleep Timer */}
          <button
            id="btn-sleep-timer"
            onClick={onOpenSleepTimer}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors cursor-pointer ${
              sleepTimerSeconds !== null
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/40'
                : 'text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 hover:bg-zinc-800 border-zinc-800'
            }`}
            title="Temporizador de apagado"
          >
            <Moon className="w-4 h-4" />
            {sleepTimerSeconds !== null && (
              <span className="font-mono text-[11px]">{formatTimer(sleepTimerSeconds)}</span>
            )}
          </button>

          {/* Shortcuts Help */}
          <button
            id="btn-keyboard-shortcuts"
            onClick={onOpenShortcuts}
            className="p-1.5 text-zinc-400 hover:text-zinc-200 bg-zinc-900/60 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
            title="Atajos de teclado"
          >
            <Keyboard className="w-4 h-4" />
          </button>
        </div>

      </div>
    </header>
  );
}
