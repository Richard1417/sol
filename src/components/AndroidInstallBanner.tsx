import { useState, useEffect } from 'react';
import { Download, Smartphone, X, Sparkles, CheckCircle2, ShieldCheck, Wifi } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

interface AndroidInstallBannerProps {
  onDismiss?: () => void;
}

export function AndroidInstallBanner({ onDismiss }: AndroidInstallBannerProps) {
  const { isInstallable, isInstalled, isAndroid, install } = usePWAInstall();
  const [isDismissed, setIsDismissed] = useState<boolean>(false);
  const [showAndroidInstructions, setShowAndroidInstructions] = useState<boolean>(false);

  useEffect(() => {
    try {
      const dismissed = sessionStorage.getItem('solare_pwa_dismissed');
      if (dismissed === 'true') {
        setIsDismissed(true);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    try {
      sessionStorage.setItem('solare_pwa_dismissed', 'true');
    } catch {
      // ignore
    }
    if (onDismiss) onDismiss();
  };

  const handleInstallClick = async () => {
    if (isInstallable) {
      const success = await install();
      if (success) {
        setIsDismissed(true);
      }
    } else {
      // Show manual Android Chrome instructions
      setShowAndroidInstructions(true);
    }
  };

  // If already installed or dismissed, don't show
  if (isInstalled || isDismissed) {
    return null;
  }

  return (
    <>
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-red-950/40 via-zinc-900 to-amber-950/30 border border-red-500/25 p-4 sm:p-5 shadow-xl mb-6 backdrop-blur-md">
        {/* Glow ambient background */}
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          
          {/* Left info & Android badge */}
          <div className="flex items-start gap-3.5">
            <div className="relative w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-amber-600 p-0.5 shadow-lg shadow-red-500/20 shrink-0">
              <div className="w-full h-full rounded-[10px] bg-zinc-950 flex items-center justify-center overflow-hidden">
                <img
                  src="/icon.svg"
                  alt="SOLARE MUSIC"
                  className="w-8 h-8 object-contain"
                  onError={(e) => {
                    // Fallback to smartphone icon
                    (e.currentTarget as HTMLElement).style.display = 'none';
                  }}
                />
                <Smartphone className="w-6 h-6 text-red-500 hidden fallback-icon" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-emerald-500 text-zinc-950">
                <CheckCircle2 className="w-3 h-3 stroke-[3]" />
              </span>
            </div>

            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold tracking-wider uppercase flex items-center gap-1">
                  <Smartphone className="w-2.5 h-2.5" />
                  Optimizado para Android
                </span>
                <span className="px-2 py-0.5 rounded-full bg-red-600/20 text-red-400 border border-red-500/30 text-[10px] font-semibold flex items-center gap-1">
                  <Sparkles className="w-2.5 h-2.5" />
                  App PWA Nativa
                </span>
              </div>

              <h4 className="text-sm sm:text-base font-bold text-white mt-1">
                Instala SOLARE MUSIC en tu celular Android
              </h4>
              <p className="text-xs text-zinc-300 mt-0.5 leading-relaxed max-w-xl">
                Escucha YouTube Music con pantalla apagada, reproducción en segundo plano, controles multimedia en tu barra de notificaciones y cero consumo de memoria adicional.
              </p>

              {/* Feature pills for Android */}
              <div className="flex items-center gap-3 mt-2.5 text-[11px] text-zinc-400 flex-wrap">
                <span className="flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Sin descargas APK peligrosas
                </span>
                <span className="flex items-center gap-1">
                  <Wifi className="w-3.5 h-3.5 text-cyan-400" />
                  Caché ultra rápido
                </span>
              </div>
            </div>
          </div>

          {/* Right action buttons */}
          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <button
              onClick={handleInstallClick}
              className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white text-xs sm:text-sm font-bold shadow-lg shadow-red-600/30 transition-all active:scale-95 cursor-pointer min-h-[44px]"
            >
              <Download className="w-4 h-4" />
              <span>Instalar en Android</span>
            </button>

            <button
              onClick={handleDismiss}
              className="p-2.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center"
              title="Cerrar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Manual Android Chrome Instructions Modal if native prompt not triggered */}
      {showAndroidInstructions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-2xl bg-zinc-900 border border-zinc-800 p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-red-600/20 text-red-500">
                  <Smartphone className="w-5 h-5" />
                </div>
                <h3 className="text-base font-bold text-white">Cómo instalar en Android</h3>
              </div>
              <button
                onClick={() => setShowAndroidInstructions(false)}
                className="p-1 text-zinc-400 hover:text-white rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs text-zinc-300">
              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
                <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  1
                </div>
                <div>
                  <p className="font-semibold text-white">Abre el menú de tu navegador</p>
                  <p className="text-zinc-400 mt-0.5">
                    Toca el icono de <strong>tres puntos verticales (⋮)</strong> en la esquina superior o inferior derecha de Google Chrome o tu navegador.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
                <div className="w-6 h-6 rounded-full bg-red-600 text-white flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  2
                </div>
                <div>
                  <p className="font-semibold text-white">Selecciona "Instalar aplicación"</p>
                  <p className="text-zinc-400 mt-0.5">
                    Pulsa en <strong>"Instalar aplicación"</strong> o <strong>"Añadir a la pantalla de inicio"</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-zinc-950/80 border border-zinc-800/80">
                <div className="w-6 h-6 rounded-full bg-emerald-500 text-zinc-950 flex items-center justify-center font-bold text-xs shrink-0 mt-0.5">
                  3
                </div>
                <div>
                  <p className="font-semibold text-white">¡Listo para usar!</p>
                  <p className="text-zinc-400 mt-0.5">
                    SOLARE MUSIC aparecerá en el cajón de aplicaciones de tu Android como una app nativa a pantalla completa.
                  </p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowAndroidInstructions(false)}
              className="mt-5 w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white font-semibold text-xs transition-colors cursor-pointer"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
}
