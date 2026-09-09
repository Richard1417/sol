import { X, RotateCcw, Sliders } from 'lucide-react';
import { EqualizerPreset } from '../types';
import { EQ_FREQUENCIES } from '../data/curatedTracks';

interface EqualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  gains: number[];
  currentPresetName: string;
  presets: EqualizerPreset[];
  onSetGain: (bandIndex: number, gainDb: number) => void;
  onSelectPreset: (preset: EqualizerPreset) => void;
  onReset: () => void;
}

export function EqualizerModal({
  isOpen,
  onClose,
  gains,
  currentPresetName,
  presets,
  onSetGain,
  onSelectPreset,
  onReset,
}: EqualizerModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-lg bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-zinc-100 flex flex-col gap-6"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Ecualizador de Audio</h3>
              <p className="text-xs text-zinc-400">Ajuste de frecuencias y perfiles acústicos</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Presets Row */}
        <div>
          <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider block mb-2">
            Ajustes Preestablecidos
          </label>
          <div className="flex flex-wrap gap-1.5">
            {presets.map((preset) => {
              const isSelected = currentPresetName === preset.name;
              return (
                <button
                  key={preset.name}
                  onClick={() => onSelectPreset(preset)}
                  className={`px-3 py-1 text-xs rounded-full font-medium transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/20 font-bold'
                      : 'bg-zinc-800/80 hover:bg-zinc-800 text-zinc-300 border border-zinc-700/60'
                  }`}
                >
                  {preset.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* 5-Band Slider Stage */}
        <div className="bg-zinc-950/60 border border-zinc-800/80 rounded-xl p-4 sm:p-6">
          <div className="grid grid-cols-5 gap-2 sm:gap-4 items-end justify-items-center h-52">
            {EQ_FREQUENCIES.map((freq, index) => {
              const gain = gains[index] ?? 0;
              return (
                <div key={freq.label} className="flex flex-col items-center justify-between h-full w-full">
                  {/* Gain dB Indicator */}
                  <span
                    className={`text-[11px] font-mono font-medium ${
                      gain > 0
                        ? 'text-emerald-400'
                        : gain < 0
                        ? 'text-cyan-400'
                        : 'text-zinc-500'
                    }`}
                  >
                    {gain > 0 ? `+${gain}` : gain} dB
                  </span>

                  {/* Vertical Slider */}
                  <div className="relative flex items-center justify-center my-3 h-32 w-8">
                    {/* Zero center indicator line */}
                    <div className="absolute w-6 h-[1px] bg-zinc-700 pointer-events-none top-1/2 -translate-y-1/2" />
                    
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      value={gain}
                      onChange={(e) => onSetGain(index, parseInt(e.target.value, 10))}
                      className="w-32 h-2 -rotate-90 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-400"
                    />
                  </div>

                  {/* Labels */}
                  <div className="text-center">
                    <div className="text-xs font-bold text-zinc-200">{freq.label}</div>
                    <div className="text-[10px] text-zinc-500 truncate max-w-[64px]">
                      {freq.sub}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={onReset}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Restablecer valores
          </button>

          <button
            onClick={onClose}
            className="px-5 py-1.5 text-xs font-semibold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 rounded-lg transition-colors cursor-pointer shadow-md"
          >
            Listo
          </button>
        </div>
      </div>
    </div>
  );
}
