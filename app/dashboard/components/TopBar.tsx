import React from 'react';
import { Plus, Calendar, ShieldCheck, Sparkles, Send, Share2 } from 'lucide-react';
import { UserAuthData } from '../page';
import { Button } from '../../components/ui/Button';

interface TopBarProps {
  currentUser: UserAuthData | null;
  onOpenAddGoalModal: () => void;
  onOpenAddHabitModal: () => void;
  onOpenAiSummaryModal?: () => void;
  onOpenShareModal?: () => void;
  aiAvailable?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentUser,
  onOpenAddGoalModal,
  onOpenAddHabitModal,
  onOpenAiSummaryModal,
  onOpenShareModal,
  aiAvailable = true,
}) => {
  const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-zinc-900/60 border border-zinc-800/80 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl backdrop-blur-md relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute right-0 top-0 w-48 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />

      <div>
        <div className="flex items-center gap-2 text-[11px] sm:text-xs font-medium text-zinc-400 mb-0.5 sm:mb-1">
          <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="truncate">{currentDateFormatted}</span>
          <span className="text-zinc-600">•</span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {currentUser ? `Sesi ${currentUser.name}` : 'Mode Tamu'}
          </span>
        </div>

        <h1 className="text-lg sm:text-2xl font-extrabold text-zinc-50 tracking-tight">
          {currentUser ? (
            <>Selamat Datang, <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-pink-400 bg-clip-text text-transparent">{currentUser.name}</span></>
          ) : (
            <>Dashboard Life OS</>
          )}
        </h1>
        <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 sm:mt-1">
          Breakdown mimpi besar, kelola kebiasaan harian, dan refleksi jurnal secara terpadu.
        </p>
      </div>

      <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
        {aiAvailable && onOpenAiSummaryModal && (
          <button
            onClick={onOpenAiSummaryModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/20 rounded-lg transition-all"
            title="Ringkasan Mingguan AI"
          >
            <Sparkles className="w-3.5 h-3.5 text-teal-400" />
            <span>AI Summary</span>
          </button>
        )}
        {onOpenShareModal && (
          <button
            onClick={onOpenShareModal}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-violet-300 bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 rounded-lg transition-all"
            title="Bagikan Kartu Pencapaian Harian"
          >
            <Share2 className="w-3.5 h-3.5 text-violet-400" />
            <span>Share</span>
          </button>
        )}
      </div>
    </header>
  );
};
