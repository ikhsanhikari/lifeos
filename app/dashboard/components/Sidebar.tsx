import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  LayoutDashboard, 
  Target, 
  CheckSquare, 
  BookOpen, 
  Flame, 
  LogOut, 
  Send, 
  Sparkles,
  ShieldCheck,
  Share2,
  Sliders,
  Sun,
  Moon
} from 'lucide-react';
import { UserAuthData, TelegramStatusData } from '../../types';
import { useDashboard } from '../../components/DashboardShell';

interface SidebarProps {
  currentUser: UserAuthData | null;
  telegramStatus: TelegramStatusData;
  onOpenLinkModal: () => void;
  onOpenShareModal?: () => void;
  onOpenSettingsModal?: () => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  telegramStatus,
  onOpenLinkModal,
  onOpenShareModal,
  onOpenSettingsModal,
  onLogout,
}) => {
  const pathname = usePathname();
  const { theme, toggleTheme } = useDashboard();

  const navItems = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/goals', label: 'Goals (Mimpi)', icon: Sparkles },
    { href: '/habits', label: 'Habit Tracker', icon: Target },
    { href: '/tasks', label: 'Tugas & Task', icon: CheckSquare },
    { href: '/journal', label: 'Jurnal Harian', icon: BookOpen },
    { href: '/streaks', label: 'Habit Streaks', icon: Flame },
  ];

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-zinc-900/80 border-r border-zinc-800/80 backdrop-blur-xl h-screen sticky top-0 p-5 z-30 justify-between">
        <div className="space-y-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shadow-lg shadow-indigo-500/25 overflow-hidden p-1">
              <img src="/icon.svg" alt="Life OS Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="font-bold text-base text-zinc-50 tracking-tight flex items-center gap-1.5">
                Life OS <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-400 font-semibold border border-indigo-500/20">v1.0</span>
              </h1>
              <p className="text-[11px] text-zinc-400">Calm Productivity</p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 px-3 mb-2">Navigasi Utama</p>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600/10 text-indigo-400 font-semibold border border-indigo-500/20 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Secondary Quick Links */}
          <div className="pt-4 border-t border-zinc-800/80 space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 px-3 mb-1">Pengaturan & Tools</p>
            
            {/* Telegram Link Status Card */}
            {telegramStatus.isLinked ? (
              <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Telegram Active</span>
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            ) : (
              <button
                onClick={onOpenLinkModal}
                className="w-full flex items-center justify-between p-2.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 text-amber-300 text-xs font-medium transition-all group"
              >
                <span className="flex items-center gap-2">
                  <Send className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                  <span>Hubungkan Bot</span>
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 font-bold">Connect</span>
              </button>
            )}

            <Link
              href="/share"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all border border-zinc-800 ${
                pathname === '/share'
                  ? 'bg-violet-600/10 text-violet-400 font-semibold border-violet-500/20'
                  : 'text-zinc-300 hover:text-zinc-100 bg-zinc-800/40 hover:bg-zinc-800/80'
              }`}
            >
              <Share2 className="w-4 h-4 text-violet-400" />
              <span>Share Studio</span>
            </Link>

            <Link
              href="/settings"
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition-all border border-zinc-800 ${
                pathname === '/settings'
                  ? 'bg-indigo-600/10 text-indigo-400 font-semibold border-indigo-500/20'
                  : 'text-zinc-300 hover:text-zinc-100 bg-zinc-800/40 hover:bg-zinc-800/80'
              }`}
            >
              <Sliders className="w-4 h-4 text-indigo-400" />
              <span>Pengaturan Reminder</span>
            </Link>

            <button
              onClick={toggleTheme}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-semibold bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition-all"
              title={theme === 'dark' ? 'Ganti ke Mode Day (Terang)' : 'Ganti ke Mode Night (Gelap)'}
            >
              {theme === 'dark' ? (
                <>
                  <Sun className="w-4 h-4 text-amber-400" />
                  <span>Mode Terang (Day ☀️)</span>
                </>
              ) : (
                <>
                  <Moon className="w-4 h-4 text-amber-400" />
                  <span>Mode Gelap (Night 🌙)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* User Profile & Logout Footer */}
        <div className="pt-4 border-t border-zinc-800/80">
          {currentUser ? (
            <div className="flex items-center justify-between p-2 rounded-xl bg-zinc-800/40">
              <div className="min-w-0 flex-1 pr-2">
                <p className="text-xs font-semibold text-zinc-200 truncate">{currentUser.name}</p>
                <p className="text-[10px] text-zinc-400 truncate">{currentUser.email}</p>
              </div>
              <button
                onClick={onLogout}
                title="Keluar Akun"
                className="p-2 rounded-lg text-zinc-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <a
              href="https://t.me/LifeOSBot"
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-all shadow-md shadow-emerald-600/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Login via Telegram</span>
            </a>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 border-t border-zinc-800/80 backdrop-blur-xl px-1.5 py-1.5 flex items-center justify-around">
        {[
          { href: '/', label: 'Home', icon: LayoutDashboard },
          { href: '/goals', label: 'Goals', icon: Sparkles },
          { href: '/habits', label: 'Habits', icon: Target },
          { href: '/tasks', label: 'Tasks', icon: CheckSquare },
          { href: '/share', label: 'Share', icon: Share2 },
          { href: '/settings', label: 'Setting', icon: Sliders },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 py-1 px-2 rounded-xl transition-all ${
                isActive ? 'text-indigo-400 font-semibold' : 'text-zinc-400'
              }`}
            >
              <Icon className="w-4.5 h-4.5" />
              <span className="text-[10px]">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </>
  );
};
