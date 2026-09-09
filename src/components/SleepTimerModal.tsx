import { useState, type FormEvent } from 'react';
import { X, Moon, Clock, Check, StopCircle } from 'lucide-react';

interface SleepTimerModalProps {
  isOpen: boolean;
  onClose: () => void;
  sleepTimerSeconds: number | null;
  onStartTimer: (minutes: number, fadeOut: boolean) => void;
  onCancelTimer: () => void;
}

export function SleepTimerModal({
  isOpen,
  onClose,
  sleepTimerSeconds,
  onStartTimer,
  onCancelTimer,
}: SleepTimerModalProps) {
  const [customMinutes, setCustomMinutes] = useState('30');
  const [fadeOut, setFadeOut] = useState(true);

  if (!isOpen) return null;

  const presets = [15, 30, 45, 60, 90];

  const handleSelectPreset = (mins: number) => {
    onStartTimer(mins, fadeOut);
    onClose();
  };

  const handleCustomSubmit = (e: FormEvent) => {
    e.preventDefault();
    const mins = parseInt(customMinutes, 10);
    if (!isNaN(mins) && mins > 0) {
      onStartTimer(mins, fadeOut);
      onClose();
    }
  };

  const formatSeconds = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}m ${s < 10 ? '0' : ''}${s}s`;
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
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Temporizador de Apagado</h3>
              <p className="text-xs text-zinc-400">Detén la música automáticamente al dormir</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Timer Banner */}
        {sleepTimerSeconds !== null && (
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/30">
            <div className="flex items-center gap-2.5">
              <Clock className="w-4 h-4 text-amber-400 animate-spin" />
              <div>
                <span className="text-xs text-amber-200">Apagando en:</span>
                <div className="font-mono text-lg font-bold text-amber-300">
                  {formatSeconds(sleepTimerSeconds)}
                </div>
              </div>
            </div>

            <button
              onClick={() => {
                onCancelTimer();
                onClose();
              }}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-rose-600/80 hover:bg-rose-500 text-white rounded-lg transition-colors cursor-pointer shadow"
            >
              <StopCircle className="w-3.5 h-3.5" />
              Cancelar
            </button>
          </div>
        )}

        {/* Quick Presets */}
        <div>
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
            Seleccionar duración
          </label>
          <div className="grid grid-cols-3 gap-2">
            {presets.map((mins) => (
              <button
                key={mins}
                type="button"
                onClick={() => handleSelectPreset(mins)}
                className="py-2.5 px-3 rounded-xl bg-zinc-950/60 hover:bg-zinc-800 border border-zinc-800 hover:border-amber-500/40 text-center transition-all cursor-pointer group"
              >
                <span className="font-bold text-sm text-zinc-200 group-hover:text-amber-300 block">
                  {mins} min
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom duration input */}
        <form onSubmit={handleCustomSubmit} className="flex gap-2">
          <input
            type="number"
            min="1"
            max="480"
            value={customMinutes}
            onChange={(e) => setCustomMinutes(e.target.value)}
            placeholder="Minutos"
            className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-amber-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold text-xs rounded-xl transition-colors cursor-pointer shrink-0"
          >
            Activar
          </button>
        </form>

        {/* Fade out toggle */}
        <label className="flex items-center gap-2.5 text-xs text-zinc-300 cursor-pointer pt-2 border-t border-zinc-800">
          <input
            type="checkbox"
            checked={fadeOut}
            onChange={(e) => setFadeOut(e.target.checked)}
            className="rounded bg-zinc-950 border-zinc-700 text-amber-500 focus:ring-0 cursor-pointer"
          />
          <span>Atenuar volumen suavemente durante los últimos 30 segundos</span>
        </label>
      </div>
    </div>
  );
}
