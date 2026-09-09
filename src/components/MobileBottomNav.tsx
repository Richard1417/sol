import { Home, Youtube, Radio, Heart, Sliders } from 'lucide-react';
import { GenreCategory } from '../types';

interface MobileBottomNavProps {
  selectedCategory: GenreCategory;
  onSelectCategory: (category: GenreCategory) => void;
  favoritesCount: number;
  onOpenYouTubeSearch: () => void;
  onOpenEqualizer: () => void;
}

export function MobileBottomNav({
  selectedCategory,
  onSelectCategory,
  favoritesCount,
  onOpenYouTubeSearch,
  onOpenEqualizer,
}: MobileBottomNavProps) {
  return (
    <nav
      id="android-mobile-bottom-nav"
      aria-label="Navegación inferior móvil"
      className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/95 backdrop-blur-xl border-t border-zinc-800/80 px-2 pt-1 pb-[calc(0.25rem+env(safe-area-inset-bottom))] sm:hidden shadow-[0_-8px_20px_rgba(0,0,0,0.5)] select-none"
    >
      <div className="flex items-center justify-around max-w-md mx-auto">
        
        {/* Inicio / Explorar */}
        <button
          onClick={() => onSelectCategory('all')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[56px] min-h-[48px] ${
            selectedCategory === 'all'
              ? 'text-white'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <Home className={`w-5 h-5 ${selectedCategory === 'all' ? 'text-amber-500' : ''}`} />
            {selectedCategory === 'all' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-amber-500" />
            )}
          </div>
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Inicio</span>
        </button>

        {/* YouTube Music Search */}
        <button
          onClick={onOpenYouTubeSearch}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[56px] min-h-[48px] text-zinc-400 hover:text-red-400 group"
        >
          <div className="relative">
            <div className="p-1 rounded-lg bg-red-600/10 group-hover:bg-red-600/20 text-red-500 transition-colors">
              <Youtube className="w-4 h-4 fill-current" />
            </div>
          </div>
          <span className="text-[10px] font-semibold tracking-tight text-red-400 mt-0.5">Buscar YT</span>
        </button>

        {/* Radios en Vivo 24/7 */}
        <button
          onClick={() => onSelectCategory('radio')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[56px] min-h-[48px] ${
            selectedCategory === 'radio'
              ? 'text-white'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <Radio className={`w-5 h-5 ${selectedCategory === 'radio' ? 'text-cyan-400' : ''}`} />
            {selectedCategory === 'radio' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-cyan-400" />
            )}
          </div>
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Radios</span>
        </button>

        {/* Mis Favoritos */}
        <button
          onClick={() => onSelectCategory('favorites')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[56px] min-h-[48px] ${
            selectedCategory === 'favorites'
              ? 'text-white'
              : 'text-zinc-400 hover:text-zinc-200'
          }`}
        >
          <div className="relative">
            <Heart
              className={`w-5 h-5 ${
                selectedCategory === 'favorites'
                  ? 'text-rose-500 fill-current'
                  : ''
              }`}
            />
            {favoritesCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full bg-rose-600 text-white font-bold text-[8px]">
                {favoritesCount}
              </span>
            )}
            {selectedCategory === 'favorites' && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-rose-500" />
            )}
          </div>
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Favoritos</span>
        </button>

        {/* Ecualizador */}
        <button
          onClick={onOpenEqualizer}
          className="flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all cursor-pointer min-w-[56px] min-h-[48px] text-zinc-400 hover:text-white"
        >
          <div className="relative">
            <Sliders className="w-5 h-5 text-emerald-400" />
          </div>
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Ecualizador</span>
        </button>

      </div>
    </nav>
  );
}
