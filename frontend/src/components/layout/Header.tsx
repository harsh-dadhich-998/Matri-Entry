import { Menu, Settings } from 'lucide-react';
import { User } from '../../types';
interface HeaderProps {
  title: string;
  subtitle?: string;
  currentUser: User;
  onOpenMobileMenu: () => void;
  onOpenDatabaseSettings: () => void;
}
export function Header({
  title,
  subtitle,
  currentUser,
  onOpenMobileMenu,
  onOpenDatabaseSettings,
}: HeaderProps) {
  return (
    <header className="workspace-header sticky top-0 z-10 bg-white/90 backdrop-blur-xl border-b border-slate-200/70 px-4 sm:px-7 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3 min-w-0">
        <button
          onClick={onOpenMobileMenu}
          aria-label="Open navigation menu"
          className="md:hidden p-2 rounded-xl hover:bg-indigo-50"
        >
          <Menu className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-slate-900 tracking-tight">
            {title}
          </h1>
          {subtitle && (
            <p className="text-xs text-slate-500 mt-1">{subtitle}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-4">
        {currentUser.role === 'admin' && (
          <button
            onClick={onOpenDatabaseSettings}
            aria-label="Workspace settings"
            className="p-2.5 border border-slate-200 rounded-xl hover:bg-indigo-50 text-slate-600"
          >
            <Settings className="w-5 h-5" />
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-semibold">
            {currentUser.name.charAt(0).toUpperCase()}
          </div>
          <p className="hidden lg:block text-sm font-semibold text-slate-700">
            {currentUser.name}
          </p>
        </div>
      </div>
    </header>
  );
}
