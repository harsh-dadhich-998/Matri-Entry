import React from 'react';
import {
  Heart,
  LayoutDashboard,
  FileEdit,
  FolderGit2,
  User as UserIcon,
  Users,
  Database,
  Activity,
  Settings,
  LogOut,
  Clock,
  X,
} from 'lucide-react';
import { User, Role } from '../../types';
import { calculateTimeRemaining } from '../common/CountdownTimer';

interface SidebarProps {
  currentRole: Role;
  activeTab: string;
  onSelectTab: (tab: string) => void;
  currentUser: User;
  onLogout: () => void;
  timeRemainingTarget: string;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentRole,
  activeTab,
  onSelectTab,
  currentUser,
  onLogout,
  timeRemainingTarget,
  isOpenMobile,
  onCloseMobile,
}) => {
  // Live ticking state for sidebar timer
  const [timeLeft, setTimeLeft] = React.useState(() =>
    calculateTimeRemaining(timeRemainingTarget),
  );

  React.useEffect(() => {
    setTimeLeft(calculateTimeRemaining(timeRemainingTarget));
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeRemaining(timeRemainingTarget));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeRemainingTarget]);

  interface NavItem {
    id: string;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: string;
  }

  const operatorNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'data-entry', label: 'Data Entry', icon: FileEdit },
    { id: 'my-records', label: 'My Records', icon: FolderGit2 },
    { id: 'profile', label: 'Profile', icon: UserIcon },
  ];

  const adminNavItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'users', label: 'User Management', icon: Users },
    { id: 'records', label: 'Matrimonial Records', icon: Database },
    { id: 'monitoring', label: 'Live Monitoring', icon: Activity },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  const navItems = currentRole === 'admin' ? adminNavItems : operatorNavItems;

  const content = (
    <div className="brand-sidebar flex flex-col h-full text-slate-300 w-64 border-r border-slate-800/80 select-none">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-indigo-700 flex items-center justify-center text-white shadow-lg shadow-indigo-600/30">
            <Heart className="w-5 h-5 fill-white" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-white text-lg tracking-tight">
                MatriEntry
              </span>
            </div>
            <p className="text-[11px] font-medium text-slate-400">
              Your connected workspace
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="flex-1 py-5 px-3 overflow-y-auto space-y-6">
        <div>
          <div className="px-3 mb-2 text-[10px] font-extrabold tracking-wider text-slate-500 uppercase">
            Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  aria-current={isActive ? 'page' : undefined}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon
                      className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`}
                    />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Account Timer Section (As featured in Figures A1-A4) */}
        {currentRole === 'operator' && timeRemainingTarget && (
          <div className="px-2">
            <div className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase mb-2">
              Account Timer
            </div>
            <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-3.5">
              <div className="flex items-center gap-1.5 text-xs text-slate-400 mb-1.5 font-medium">
                <Clock className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
                <span className="text-[11px] text-slate-300">
                  Time Remaining
                </span>
              </div>
              <div className="font-mono text-emerald-400 font-bold text-xs tracking-wide">
                {timeLeft.isExpired
                  ? 'Expired'
                  : `${timeLeft.days}d ${String(timeLeft.hours).padStart(2, '0')}h ${String(timeLeft.minutes).padStart(2, '0')}m ${String(timeLeft.seconds).padStart(2, '0')}s`}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* User Footer Profile & Sign Out (Matching Figure A1 & A3) */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-full bg-indigo-600/30 border border-indigo-500/40 text-indigo-300 font-bold flex items-center justify-center text-sm shrink-0">
              {currentUser.name
                ? currentUser.name.charAt(0).toUpperCase()
                : 'U'}
            </div>
            <div className="truncate">
              <div className="text-xs font-bold text-white truncate">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-slate-400 truncate">
                @{currentUser.username}
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700/80 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5 text-slate-400" />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:block shrink-0 sticky top-0 h-screen z-20">
        {content}
      </aside>

      {/* Mobile Drawer */}
      {isOpenMobile && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative z-10 h-full">
            <button
              onClick={onCloseMobile}
              aria-label="Close navigation menu"
              className="absolute right-2 top-2 z-20 p-2 text-white rounded-lg bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
            {content}
          </div>
        </div>
      )}
    </>
  );
};
