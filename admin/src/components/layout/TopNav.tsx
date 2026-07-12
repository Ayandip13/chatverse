import { Moon, Sun, UserCircle } from 'lucide-react';
import { useThemeStore } from '../../store/themeStore';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';

export const TopNav = () => {
  const { theme, toggleTheme } = useThemeStore();
  const user = useAuthStore((state) => state.user);

  return (
    <header className="h-16 bg-surface-light dark:bg-surface-dark border-b border-border-light dark:border-border-dark flex items-center justify-between px-4 z-10 shadow-sm">
      <div className="flex-1" />
      
      <div className="flex items-center gap-4">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-full text-textSecondary-light dark:text-textSecondary-dark hover:bg-background-light dark:hover:bg-background-dark transition-colors"
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
        </button>

        <div className="flex items-center gap-3 border-l border-border-light dark:border-border-dark pl-4">
          <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-textMain-light dark:text-textMain-dark">
              {user?.name || 'Admin'}
            </span>
            <span className="text-xs text-textSecondary-light dark:text-textSecondary-dark capitalize">
              {user?.role || 'Administrator'}
            </span>
          </div>
          <Link to="/profile" className="p-1 text-textSecondary-light dark:text-textSecondary-dark hover:text-primary transition-colors">
            <UserCircle className="w-8 h-8" />
          </Link>
        </div>
      </div>
    </header>
  );
};
