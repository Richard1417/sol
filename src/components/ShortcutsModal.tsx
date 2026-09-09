import { X, Keyboard } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ShortcutsModal({ isOpen, onClose }: ShortcutsModalProps) {
  if (!isOpen) return null;

  const shortcuts = [
    { key: 'Espacio', desc: 'Reproducir / Pausar' },
    { key: '→', desc: 'Avanzar 5 segundos' },
    { key: '←', desc: 'Retroceder 5 segundos' },
    { key: '↑', desc: 'Subir volumen (+5%)' },
    { key: '↓', desc: 'Bajar volumen (-5%)' },
    { key: 'N', desc: 'Siguiente pista' },
    { key: 'P', desc: 'Pista anterior' },
    { key: 'M', desc: 'Silenciar / Activar sonido' },
    { key: 'F', desc: 'Abrir / Cerrar vista completa' },
    { key: 'L', desc: 'Añadir o quitar de favoritos' },
    { key: 'Esc', desc: 'Cerrar ventanas y modales' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-6 text-zinc-100 flex flex-col gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-white">Atajos de Teclado</h3>
              <p className="text-xs text-zinc-400">Controla la reproducción con tus teclas</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Shortcuts list */}
        <div className="space-y-2 py-1">
          {shortcuts.map((sc) => (
            <div
              key={sc.key}
              className="flex items-center justify-between p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-xs"
            >
              <span className="text-zinc-300 font-medium">{sc.desc}</span>
              <kbd className="px-2 py-1 bg-zinc-800 text-zinc-200 font-mono font-bold rounded-md border border-zinc-700 shadow-sm text-[11px]">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-medium text-xs rounded-xl transition-colors cursor-pointer"
        >
          Entendido
        </button>
      </div>
    </div>
  );
}
