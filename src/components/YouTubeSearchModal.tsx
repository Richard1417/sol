import React, { useState, useEffect } from 'react';
import {
  Search,
  X,
  Play,
  ListPlus,
  Heart,
  Youtube,
  Clock,
  Sparkles,
  Radio,
  Music2,
  Check,
  Flame,
} from 'lucide-react';
import { Track } from '../types';

interface YouTubeSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayTrack: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  favorites: string[];
  onToggleFavorite: (id: string) => void;
}

interface YtSearchResult {
  id: string;
  videoId: string;
  title: string;
  artist: string;
  duration: string;
  durationSec: number;
  thumbnail: string;
  isLive?: boolean;
}

const QUICK_TAGS = [
  'Coldplay',
  'Bad Bunny',
  'The Weeknd',
  'Dua Lipa',
  'Lofi Hip Hop Beats',
  'Synthwave 80s',
  'Rock Clásico',
  'Pop Latino 2024',
  'Hans Zimmer Soundtrack',
];

export function YouTubeSearchModal({
  isOpen,
  onClose,
  onPlayTrack,
  onAddToQueue,
  favorites,
  onToggleFavorite,
}: YouTubeSearchModalProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<YtSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [addedIds, setAddedIds] = useState<Record<string, boolean>>({});

  // Trigger search when query changes with debounce
  useEffect(() => {
    if (!isOpen) return;
    if (!query.trim()) {
      // Load trending by default
      loadTrending();
      return;
    }

    const timer = setTimeout(() => {
      searchYouTube(query);
    }, 450);

    return () => clearTimeout(timer);
  }, [query, isOpen]);

  const loadTrending = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/yt/trending');
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      }
    } catch {
      setError('No se pudo cargar las canciones destacadas de YouTube Music.');
    } finally {
      setIsLoading(false);
    }
  };

  const searchYouTube = async (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/yt/search?q=${encodeURIComponent(searchTerm)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.results || []);
      } else {
        setError('Error al consultar los servidores de YouTube Music.');
      }
    } catch {
      setError('Error de conexión con el servidor de YouTube.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handlePlayResult = (item: YtSearchResult) => {
    const track: Track = {
      id: item.id || `yt-${item.videoId}`,
      videoId: item.videoId,
      youtubeVideoId: item.videoId,
      title: item.title,
      artist: item.artist ? `${item.artist} • YouTube Music` : 'YouTube Music',
      album: 'YouTube Music Single',
      url: `https://www.youtube.com/watch?v=yKNxeF4KMsY`, // fallback
      coverUrl: item.thumbnail,
      genre: 'YouTube Music Online',
      category: 'youtube',
      isLive: item.isLive || false,
      duration: item.durationSec || 210,
      sourceType: 'youtube',
      bitrate: 'YouTube HQ Audio',
      description: `Transmitido directamente desde YouTube Music (${item.artist})`,
    };

    onPlayTrack(track);
  };

  const handleAddQueue = (item: YtSearchResult) => {
    const track: Track = {
      id: item.id || `yt-${item.videoId}`,
      videoId: item.videoId,
      youtubeVideoId: item.videoId,
      title: item.title,
      artist: item.artist ? `${item.artist} • YouTube Music` : 'YouTube Music',
      album: 'YouTube Music Single',
      url: `https://www.youtube.com/watch?v=yKNxeF4KMsY`,
      coverUrl: item.thumbnail,
      genre: 'YouTube Music Online',
      category: 'youtube',
      isLive: item.isLive || false,
      duration: item.durationSec || 210,
      sourceType: 'youtube',
      bitrate: 'YouTube HQ Audio',
    };

    onAddToQueue(track);
    setAddedIds((prev) => ({ ...prev, [item.videoId]: true }));
    setTimeout(() => {
      setAddedIds((prev) => ({ ...prev, [item.videoId]: false }));
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-3xl max-h-[88vh] flex flex-col bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header */}
        <div className="p-4 sm:p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-red-600 to-rose-600 flex items-center justify-center shadow-lg shadow-red-600/20 text-white">
              <Youtube className="w-6 h-6 fill-current" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                Explorador YouTube Music
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                  Online Server
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Busca y reproduce cualquier canción, artista o video directamente en SOLARE MUSIC.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            aria-label="Cerrar modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar & Quick Tags */}
        <div className="p-4 border-b border-zinc-800 bg-zinc-950 space-y-3">
          <div className="relative">
            <Search className="w-5 h-5 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Escribe el nombre de la canción, artista o banda..."
              autoFocus
              className="w-full bg-zinc-900/90 text-sm text-zinc-100 placeholder:text-zinc-500 pl-11 pr-10 py-3 rounded-xl border border-zinc-800 focus:outline-none focus:border-red-500/60 focus:ring-1 focus:ring-red-500/30 transition-all font-medium"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 hover:text-white p-1"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Search Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs">
            <span className="text-zinc-500 text-[11px] shrink-0 font-medium flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-red-400" />
              Sugerencias:
            </span>
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                onClick={() => setQuery(tag)}
                className={`shrink-0 px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                  query === tag
                    ? 'bg-red-600 text-white border-red-500 font-semibold'
                    : 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>

        {/* Results Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2">
          {isLoading && (
            <div className="py-12 flex flex-col items-center justify-center gap-3 text-zinc-400">
              <div className="w-8 h-8 rounded-full border-2 border-red-500/30 border-t-red-500 animate-spin" />
              <p className="text-xs">Buscando en los servidores de YouTube Music...</p>
            </div>
          )}

          {!isLoading && error && (
            <div className="py-8 text-center text-rose-400 text-sm bg-rose-500/10 border border-rose-500/20 rounded-xl p-4">
              {error}
            </div>
          )}

          {!isLoading && !error && results.length === 0 && (
            <div className="py-12 text-center text-zinc-500 text-sm">
              No se encontraron resultados para &quot;{query}&quot;. Intenta con otro término.
            </div>
          )}

          {!isLoading && !error && results.length > 0 && (
            <>
              <div className="flex items-center justify-between pb-2 text-xs text-zinc-400 font-medium">
                <span className="flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-red-500" />
                  {query ? `Resultados de búsqueda (${results.length})` : 'Música en Tendencia Global'}
                </span>
                <span>Calidad HD Streaming</span>
              </div>

              <div className="grid grid-cols-1 gap-2">
                {results.map((item) => {
                  const trackId = item.id || `yt-${item.videoId}`;
                  const isFav = favorites.includes(trackId);
                  const isAdded = addedIds[item.videoId];

                  return (
                    <div
                      key={item.videoId}
                      className="group flex items-center justify-between gap-3 p-2.5 rounded-xl bg-zinc-900/50 hover:bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 transition-all"
                    >
                      {/* Left: Thumbnail & Info */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-zinc-800">
                          <img
                            src={item.thumbnail}
                            alt={item.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            loading="lazy"
                          />
                          <button
                            onClick={() => handlePlayResult(item)}
                            className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white"
                            title="Reproducir ahora"
                          >
                            <Play className="w-6 h-6 fill-white text-white drop-shadow" />
                          </button>
                          {item.isLive && (
                            <span className="absolute top-1 left-1 px-1 py-0.2 rounded bg-red-600 text-white text-[8px] font-bold tracking-wider uppercase">
                              Live
                            </span>
                          )}
                        </div>

                        <div className="min-w-0 flex-1">
                          <h4
                            onClick={() => handlePlayResult(item)}
                            className="text-sm font-semibold text-zinc-100 hover:text-red-400 transition-colors truncate cursor-pointer"
                            title={item.title}
                          >
                            {item.title}
                          </h4>
                          <p className="text-xs text-zinc-400 truncate flex items-center gap-1.5 mt-0.5">
                            <span className="text-zinc-300">{item.artist || 'YouTube Music'}</span>
                            {item.duration && (
                              <>
                                <span>•</span>
                                <span className="flex items-center gap-1 font-mono text-[11px] text-zinc-500">
                                  <Clock className="w-3 h-3" />
                                  {item.duration}
                                </span>
                              </>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Right: Actions */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Favorite button */}
                        <button
                          onClick={() => onToggleFavorite(trackId)}
                          className={`p-2 rounded-lg transition-colors cursor-pointer ${
                            isFav
                              ? 'text-rose-500 bg-rose-500/10'
                              : 'text-zinc-400 hover:text-rose-400 hover:bg-zinc-800'
                          }`}
                          title={isFav ? 'Quitar de favoritos' : 'Añadir a favoritos'}
                        >
                          <Heart className={`w-4 h-4 ${isFav ? 'fill-current' : ''}`} />
                        </button>

                        {/* Add to Queue */}
                        <button
                          onClick={() => handleAddQueue(item)}
                          disabled={isAdded}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                          title="Añadir a la cola"
                        >
                          {isAdded ? (
                            <Check className="w-4 h-4 text-emerald-400" />
                          ) : (
                            <ListPlus className="w-4 h-4" />
                          )}
                        </button>

                        {/* Play button */}
                        <button
                          onClick={() => handlePlayResult(item)}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold shadow transition-colors cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span className="hidden sm:inline">Reproducir</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between text-xs text-zinc-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Conexión cifrada directa con YouTube Music API</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-medium transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
}
