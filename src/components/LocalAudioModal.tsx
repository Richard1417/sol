import { useState, useRef, type DragEvent } from 'react';
import { X, FolderUp, Music, UploadCloud, CheckCircle2 } from 'lucide-react';
import { Track } from '../types';

interface LocalAudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTracks: (tracks: Track[], playFirst: boolean) => void;
}

export function LocalAudioModal({
  isOpen,
  onClose,
  onAddTracks,
}: LocalAudioModalProps) {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const processFiles = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newTracks: Track[] = [];

    Array.from(files).forEach((file) => {
      if (!file.type.startsWith('audio/') && !file.name.match(/\.(mp3|wav|ogg|flac|m4a|aac)$/i)) {
        return;
      }

      const blobUrl = URL.createObjectURL(file);
      const nameWithoutExt = file.name.replace(/\.[^/.]+$/, '');
      const parts = nameWithoutExt.split(' - ');
      const artist = parts.length > 1 ? parts[0].trim() : 'Archivo Local';
      const title = parts.length > 1 ? parts.slice(1).join(' - ').trim() : nameWithoutExt;

      newTracks.push({
        id: `local-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        title,
        artist,
        album: 'Música Local',
        url: blobUrl,
        coverUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
        genre: 'Audio Local',
        category: 'all',
        isLive: false,
        sourceType: 'local',
        bitrate: 'Local File',
        description: `Archivo cargado localmente: ${file.name} (${(file.size / (1024 * 1024)).toFixed(1)} MB)`,
        addedAt: Date.now(),
      });
    });

    if (newTracks.length > 0) {
      onAddTracks(newTracks, true);
      onClose();
    }
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    processFiles(e.dataTransfer.files);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-zinc-100 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <FolderUp className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Cargar Música Local</h3>
              <p className="text-xs text-zinc-400">Reproduce tus canciones locales sin conexión</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drop Zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-cyan-400 bg-cyan-500/10 scale-[0.99]'
              : 'border-zinc-700 hover:border-zinc-500 bg-zinc-950/50 hover:bg-zinc-950/80'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a,.aac"
            onChange={(e) => processFiles(e.target.files)}
            className="hidden"
          />

          <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center mb-3">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h4 className="text-sm font-bold text-zinc-100">
            Arrastra archivos de audio aquí
          </h4>
          <p className="text-xs text-zinc-400 mt-1">
            o haz clic para explorar en tu equipo
          </p>

          <span className="text-[10px] text-zinc-500 font-mono mt-3 px-2 py-1 rounded bg-zinc-900 border border-zinc-800">
            Soporta MP3, WAV, FLAC, AAC, OGG
          </span>
        </div>

        {/* Info */}
        <div className="text-[11px] text-zinc-400 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 flex items-start gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>
            Los archivos se reproducen directamente en tu navegador con el ecualizador y visualizador, sin subirse a ningún servidor externo.
          </span>
        </div>
      </div>
    </div>
  );
}
