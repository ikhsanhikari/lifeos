import React from 'react';
import { 
  LayoutDashboard, 
  Target, 
  CheckSquare, 
  BookOpen, 
  Flame, 
  LogOut, 
  Send, 
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import { UserAuthData, TelegramStatusData } from '../page';

interface SidebarProps {
  currentUser: UserAuthData | null;
  telegramStatus: TelegramStatusData;
  activeSection: string;
  setActiveSection: (section: string) => void;
  onOpenLinkModal: () => void;
  onLogout: () => void;
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentUser,
  telegramStatus,
  activeSection,
  setActiveSection,
  onOpenLinkModal,
  onLogout,
  isMobileOpen,
  setIsMobileOpen,
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'goals', label: 'Goals (Mimpi)', icon: Sparkles },
    { id: 'habits', label: 'Habit Tracker', icon: Target },
    { id: 'tasks', label: 'Tugas & Task', icon: CheckSquare },
    { id: 'journal', label: 'Jurnal Harian', icon: BookOpen },
    { id: 'streaks', label: 'Habit Streaks', icon: Flame },
  ];

  return (
    <>
      {/* Desktop & Tablet Sidebar */}
      <aside className="hidden md:flex flex-col w-64 bg-zinc-900/80 border-r border-zinc-800/80 backdrop-blur-xl h-screen sticky top-0 p-5 z-30 justify-between">
        <div className="space-y-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-3 px-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
              <Sparkles className="w-5 h-5 text-white" />
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
              const isActive = activeSection === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveSection(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-indigo-600/10 text-indigo-400 font-semibold border border-indigo-500/20 shadow-sm'
                      : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-indigo-400' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Telegram Sync Widget */}
          <div className="pt-4 border-t border-zinc-800/60">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400 px-3 mb-2">Integrasi Bot</p>
            {telegramStatus.isLinked ? (
              <div className="p-3 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
                <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Telegram Linked</span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  {telegramStatus.telegramLink?.telegramUsername
                    ? `@${telegramStatus.telegramLink.telegramUsername}`
                    : 'Terhubung Aktif'}
                </p>
              </div>
            ) : (
              <button
                onClick={onOpenLinkModal}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/15 border border-indigo-500/20 transition-all text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <Send className="w-4 h-4 text-indigo-400 group-hover:scale-110 transition-transform" />
                  <div>
                    <p className="text-xs font-semibold text-indigo-300">Hubungkan Telegram</p>
                    <p className="text-[10px] text-zinc-400">Sync habit via chat</p>
                  </div>
                </div>
              </button>
            )}
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
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-zinc-950/90 border-t border-zinc-800/80 backdrop-blur-xl px-2 py-2 flex items-center justify-around">
        {navItems.slice(0, 4).map((item) => {
          const Icon = item.icon;
          const isActive = activeSection === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`flex flex-col items-center gap-1 py-1 px-3 rounded-xl transition-all ${
                isActive ? 'text-indigo-400 font-semibold' : 'text-zinc-400'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{item.label.split(' ')[0]}</span>
            </button>
          );
        })}
      </div>
    </>
  );
};
