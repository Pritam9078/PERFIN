'use client';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/components/theme-provider';
import { cn } from '@/lib/utils';

export function ThemeToggle({ className, showLabel = false }: { className?: string; showLabel?: boolean }) {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={cn(
        'glass relative flex items-center justify-center rounded-full text-white/80 transition-all hover:text-white hover:scale-105 active:scale-95',
        showLabel ? 'h-11 px-4 gap-2 text-sm font-semibold' : 'h-11 w-11',
        className
      )}
      aria-label={theme === 'dark' ? 'Switch to bright mode' : 'Switch to dark mode'}
      title={theme === 'dark' ? 'Switch to bright mode' : 'Switch to dark mode'}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 text-lime transition-transform" />
      ) : (
        <Moon className="h-4 w-4 text-amber-500 transition-transform" />
      )}
      {showLabel && (
        <span>{theme === 'dark' ? 'Bright mode' : 'Dark mode'}</span>
      )}
    </button>
  );
}
