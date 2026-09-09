import { X, Play, Trash2, ArrowUp, ArrowDown, ListMusic, Music } from 'lucide-react';
import { Track } from '../types';

interface QueueDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  queue: Track[];
  currentIndex: number;
  isPlaying: boolean;
  onPlayTrack: (track: Track) => void;
  onRemoveTrack: (index: number) => void;
  onReorder: (from: number, to: number) => void;
  onClearQueue: () => void;
}

export function QueueDrawer({
  isOpen,
  onClose,
  queue,
  currentIndex,
  isPlaying,
  onPlayTrack,
  onRemoveTrack,
  onReorder,
  onClearQueue,
}: QueueDrawerProps) {
  if (!isOpen) return null;

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'En vivo';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="absolute inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-zinc-900 border-l border-zinc-800 shadow-2xl flex flex-col text-zinc-100">
          
          {/* Header */}
          <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <ListMusic className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-white">Cola de Reproducción</h3>
                <p className="text-xs text-zinc-400">
                  {queue.length} {queue.length === 1 ? 'pista' : 'pistas'} en cola
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {queue.length > 1 && (
                <button
                  onClick={onClearQueue}
                  className="p-1.5 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
                  title="Vaciar cola"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onClose}
                className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Queue List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {queue.length === 0 ? (
              <div className="text-center py-16 text-zinc-500 flex flex-col items-center">
                <Music className="w-12 h-12 stroke-1 mb-2 opacity-40" />
                <p className="text-sm">La cola está vacía</p>
                <p className="text-xs mt-1">Añade canciones o emisoras desde el catálogo</p>
              </div>
            ) : (
              queue.map((track, idx) => {
                const isCurrent = idx === currentIndex;
                return (
                  <div
                    key={`${track.id}-${idx}`}
                    className={`group relative flex items-center gap-3 p-2.5 rounded-xl border transition-all ${
                      isCurrent
                        ? 'bg-zinc-800/90 border-emerald-500/50 shadow-md ring-1 ring-emerald-500/20'
                        : 'bg-zinc-950/40 hover:bg-zinc-800/50 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    {/* Index or active equalizer icon */}
                    <div className="w-5 text-center shrink-0">
                      {isCurrent ? (
                        <span className="flex items-center justify-center gap-0.5">
                          <span className={`w-1 bg-emerald-400 rounded-full h-3 ${isPlaying ? 'animate-bounce' : ''}`} />
                          <span className={`w-1 bg-emerald-400 rounded-full h-4 ${isPlaying ? 'animate-[bounce_0.8s_infinite]' : ''}`} />
                          <span className={`w-1 bg-emerald-400 rounded-full h-2 ${isPlaying ? 'animate-[bounce_1.2s_infinite]' : ''}`} />
                        </span>
                      ) : (
                        <span className="text-xs font-mono text-zinc-500 group-hover:hidden">
                          {idx + 1}
                        </span>
                      )}
                      {!isCurrent && (
                        <button
                          onClick={() => onPlayTrack(track)}
                          className="hidden group-hover:flex items-center justify-center text-zinc-300 hover:text-emerald-400 cursor-pointer"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}
                    </div>

                    {/* Thumbnail */}
                    <div
                      className="relative w-10 h-10 rounded-lg overflow-hidden bg-zinc-800 shrink-0 cursor-pointer"
                      onClick={() => onPlayTrack(track)}
                    >
                      <img
                        src={track.coverUrl}
                        alt={track.title}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src =
                            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80';
                        }}
                      />
                    </div>

                    {/* Track info */}
                    <div
                      className="min-w-0 flex-1 cursor-pointer"
                      onClick={() => onPlayTrack(track)}
                    >
                      <h4
                        className={`text-xs font-semibold truncate ${
                          isCurrent ? 'text-emerald-400 font-bold' : 'text-zinc-200 group-hover:text-white'
                        }`}
                      >
                        {track.title}
                      </h4>
                      <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                        {track.artist}
                      </p>
                    </div>

                    {/* Duration / Source */}
                    <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                      {formatDuration(track.duration)}
                    </span>

                    {/* Reorder / Delete Actions */}
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                      {idx > 0 && (
                        <button
                          onClick={() => onReorder(idx, idx - 1)}
                          className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60 rounded cursor-pointer"
                          title="Subir"
                        >
                          <ArrowUp className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {idx < queue.length - 1 && (
                        <button
                          onClick={() => onReorder(idx, idx + 1)}
                          className="p-1 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700/60 rounded cursor-pointer"
                          title="Bajar"
                        >
                          <ArrowDown className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {queue.length > 1 && (
                        <button
                          onClick={() => onRemoveTrack(idx)}
                          className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-zinc-700/60 rounded cursor-pointer"
                          title="Eliminar de la cola"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="p-3 border-t border-zinc-800 text-center text-xs text-zinc-400 bg-zinc-950/40">
            Arrastra o usa las flechas para reorganizar la reproducción
          </div>

        </div>
      </div>
    </div>
  );
}
