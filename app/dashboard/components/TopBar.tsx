import React from 'react';
import { Plus, Calendar, ShieldCheck, Sparkles, Send } from 'lucide-react';
import { UserAuthData } from '../page';
import { Button } from '../../components/ui/Button';

interface TopBarProps {
  currentUser: UserAuthData | null;
  onOpenAddGoalModal: () => void;
  onOpenAddHabitModal: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentUser,
  onOpenAddGoalModal,
  onOpenAddHabitModal,
}) => {
  const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-zinc-900/60 border border-zinc-800/80 p-5 rounded-2xl backdrop-blur-md relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute right-0 top-0 w-48 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />

      <div>
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-400 mb-1">
          <Calendar className="w-3.5 h-3.5 text-indigo-400" />
          <span>{currentDateFormatted}</span>
          <span className="text-zinc-600">•</span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {currentUser ? `Sesi ${currentUser.name}` : 'Mode Tamu'}
          </span>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold text-zinc-50 tracking-tight">
          {currentUser ? (
            <>Selamat Datang, <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-pink-400 bg-clip-text text-transparent">{currentUser.name}</span></>
          ) : (
            <>Dashboard Life OS</>
          )}
        </h1>
        <p className="text-xs text-zinc-400 mt-1">
          Breakdown mimpi besar, kelola kebiasaan harian, dan refleksi jurnal secara terpadu.
        </p>
      </div>

      <div className="flex items-center gap-2.5 self-start sm:self-auto">
        <Button
          variant="secondary"
          size="md"
          className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30"
          leftIcon={<Sparkles className="w-4 h-4 text-emerald-400" />}
          onClick={onOpenAddGoalModal}
        >
          Goal Baru
        </Button>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={onOpenAddHabitModal}
        >
          Habit Baru
        </Button>
      </div>
    </header>
  );
};
