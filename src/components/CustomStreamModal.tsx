import { useState, type FormEvent } from 'react';
import { X, Globe, Plus, Youtube, Sparkles, Loader2, Music2 } from 'lucide-react';
import { Track } from '../types';

interface CustomStreamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddTrack: (track: Track, playImmediately: boolean) => void;
}

export function CustomStreamModal({
  isOpen,
  onClose,
  onAddTrack,
}: CustomStreamModalProps) {
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [genre, setGenre] = useState('YouTube Music');
  const [coverUrl, setCoverUrl] = useState('');
  const [isLiveStream, setIsLiveStream] = useState(false);
  const [playNow, setPlayNow] = useState(true);
  const [isFetchingInfo, setIsFetchingInfo] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const sampleLinks = [
    {
      name: 'Coldplay - Yellow',
      url: 'https://music.youtube.com/watch?v=yKNxeF4KMsY',
      artist: 'Coldplay',
      type: 'youtube',
    },
    {
      name: 'Bad Bunny - DÁKITI',
      url: 'https://music.youtube.com/watch?v=TmKh7lAwnBI',
      artist: 'Bad Bunny x Jhay Cortez',
      type: 'youtube',
    },
    {
      name: 'Radio Swiss Classic (Directo)',
      url: 'https://stream.srg-ssr.ch/m/rsc_de/mp3_128',
      artist: 'Swiss Public Broadcasting',
      type: 'radio',
    },
  ];

  const handleAutoDetect = async () => {
    if (!url.trim()) {
      setError('Por favor ingresa primero la URL.');
      return;
    }

    setIsFetchingInfo(true);
    setError(null);

    const isYt =
      url.includes('youtube.com') ||
      url.includes('youtu.be') ||
      url.includes('music.youtube.com');

    if (isYt) {
      try {
        const res = await fetch(`/api/yt/info?url=${encodeURIComponent(url.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setTitle(data.title || '');
          setArtist(data.artist || 'YouTube Music');
          setCoverUrl(data.thumbnail || '');
          setIsLiveStream(data.isLive || false);
          setGenre('YouTube Music Online');
        } else {
          setError('No se pudo extraer información automática. Puedes completar los campos manualmente.');
        }
      } catch {
        setError('Error conectando al servidor de extracción de metadatos.');
      } finally {
        setIsFetchingInfo(false);
      }
    } else {
      setIsFetchingInfo(false);
      if (!title) setTitle('Stream de Audio Personalizado');
      if (!artist) setArtist('Emisión Online');
      setIsLiveStream(true);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('Por favor ingresa una URL válida.');
      return;
    }

    const trimmedUrl = url.trim();
    const isYt =
      trimmedUrl.includes('youtube.com') ||
      trimmedUrl.includes('youtu.be') ||
      trimmedUrl.includes('music.youtube.com');

    let ytVideoId: string | undefined = undefined;
    if (isYt) {
      const match = trimmedUrl.match(/(?:v=|\/embed\/|\/watch\?v=|\.be\/|\/v\/)([\w-]{11})/);
      if (match) {
        ytVideoId = match[1];
      }
    }

    const newTrack: Track = {
      id: ytVideoId ? `yt-${ytVideoId}` : `custom-${Date.now()}`,
      title: title.trim() || (isYt ? 'Canción de YouTube Music' : 'Emisión Online'),
      artist: artist.trim() || (isYt ? 'YouTube Music' : 'Radio Web'),
      url: trimmedUrl,
      coverUrl:
        coverUrl.trim() ||
        (ytVideoId
          ? `https://i.ytimg.com/vi/${ytVideoId}/hqdefault.jpg`
          : 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=600&auto=format&fit=crop&q=80'),
      genre: genre || (isYt ? 'YouTube Music' : 'Personalizado'),
      category: isYt ? 'youtube' : 'radio',
      isLive: isLiveStream,
      sourceType: isYt ? 'youtube' : 'custom',
      youtubeVideoId: ytVideoId,
      bitrate: isYt ? 'YouTube Music HQ' : 'Stream en Directo',
      description: isYt
        ? 'Pista importada directamente desde YouTube Music servers.'
        : 'Stream de audio personalizado agregado por el usuario.',
      addedAt: Date.now(),
    };

    onAddTrack(newTrack, playNow);
    setUrl('');
    setTitle('');
    setArtist('');
    setCoverUrl('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
      <div
        className="relative w-full max-w-lg bg-zinc-950 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-zinc-100 flex flex-col gap-5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 rounded-xl bg-red-600/10 text-red-500 border border-red-500/20">
              <Youtube className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white flex items-center gap-2">
                Añadir Música o Stream Online
                <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-red-500/20 text-red-400">
                  YouTube / Audio
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Pega cualquier enlace de YouTube Music, YouTube video o stream de radio web
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Sample Links */}
        <div>
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
            Ejemplos listos para probar
          </label>
          <div className="grid grid-cols-1 gap-1.5">
            {sampleLinks.map((sample) => (
              <button
                key={sample.url}
                type="button"
                onClick={() => {
                  setUrl(sample.url);
                  setTitle(sample.name);
                  setArtist(sample.artist);
                  setError(null);
                }}
                className="flex items-center justify-between px-3 py-2 text-xs rounded-xl bg-zinc-900/60 hover:bg-zinc-900 border border-zinc-800 hover:border-red-500/40 text-left transition-colors cursor-pointer"
              >
                <div className="truncate flex items-center gap-2">
                  {sample.type === 'youtube' ? (
                    <Youtube className="w-3.5 h-3.5 text-red-500 fill-current shrink-0" />
                  ) : (
                    <Globe className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                  <span className="font-semibold text-zinc-200">{sample.name}</span>
                  <span className="text-zinc-500">({sample.artist})</span>
                </div>
                <span className="text-[11px] text-red-400 font-semibold shrink-0 ml-2">
                  Probar
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5">
          {error && (
            <div className="p-2.5 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs">
              {error}
            </div>
          )}

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-zinc-300">
                URL de YouTube Music o Stream de Audio *
              </label>
              {url.trim() && (
                <button
                  type="button"
                  onClick={handleAutoDetect}
                  disabled={isFetchingInfo}
                  className="flex items-center gap-1 text-[11px] text-red-400 hover:text-red-300 font-semibold cursor-pointer"
                >
                  {isFetchingInfo ? (
                    <Loader2 className="w-3 h-3 animate-spin" />
                  ) : (
                    <Sparkles className="w-3 h-3" />
                  )}
                  Auto-detectar con YouTube
                </button>
              )}
            </div>
            <div className="relative">
              <input
                type="text"
                required
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://music.youtube.com/watch?v=... o https://stream.radio..."
                className="w-full bg-zinc-900/90 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Título de la Canción o Estación
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ej. Yellow"
                className="w-full bg-zinc-900/90 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-zinc-300 block mb-1">
                Artista o Canal
              </label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                placeholder="Ej. Coldplay"
                className="w-full bg-zinc-900/90 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-red-500"
              />
            </div>
          </div>

          {/* Options */}
          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={isLiveStream}
                onChange={(e) => setIsLiveStream(e.target.checked)}
                className="rounded bg-zinc-950 border-zinc-700 text-red-500 focus:ring-0 cursor-pointer"
              />
              <span>Es transmisión en directo (Live)</span>
            </label>

            <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={playNow}
                onChange={(e) => setPlayNow(e.target.checked)}
                className="rounded bg-zinc-950 border-zinc-700 text-red-500 focus:ring-0 cursor-pointer"
              />
              <span>Reproducir ahora</span>
            </label>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-xl transition-colors cursor-pointer shadow-md shadow-red-600/20"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              Conectar y Reproducir
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
