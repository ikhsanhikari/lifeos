import React from 'react';
import { CheckCircle2, Zap, Smile, Activity, Share2 } from 'lucide-react';
import { HabitData, TaskData, DailyLogData, AnalyticsSummaryData } from '../../types';
import { Card } from '../../components/ui/Card';
import { ProgressBar } from '../../components/ui/ProgressBar';

interface StatsGridProps {
  habits: HabitData[];
  tasks: TaskData[];
  dailyLog: DailyLogData | null;
  analytics: AnalyticsSummaryData | null;
  onOpenShareModal?: () => void;
}

export const StatsGrid: React.FC<StatsGridProps> = ({
  habits,
  tasks,
  dailyLog,
  analytics,
  onOpenShareModal,
}) => {
  const completedHabitsCount = habits.filter((h) => h.isDoneToday).length;
  const totalHabitsCount = habits.length;
  const habitCompletionRate = totalHabitsCount > 0 ? Math.round((completedHabitsCount / totalHabitsCount) * 100) : 0;

  const completedTasksCount = tasks.filter((t) => t.status === 'DONE').length;
  const totalTasksCount = tasks.length;
  const taskCompletionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  const focusScore = analytics ? analytics.focusScore : 0;

  const getMoodLabel = (m: number) => {
    switch (m) {
      case 5: return 'Sangat Baik 😊';
      case 4: return 'Baik 🙂';
      case 3: return 'Biasa 😐';
      case 2: return 'Buruk 🙁';
      default: return 'Sangat Buruk 😭';
    }
  };

  return (
    <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {/* 1. Tasks Completion */}
      <Card variant="interactive" className="group relative overflow-hidden p-3 sm:p-5">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-400 truncate">
            Task Selesai
          </span>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform shrink-0">
            <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.75]" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5 sm:gap-2">
          <span className="text-xl sm:text-3xl font-black text-zinc-50 tracking-tight">{completedTasksCount}</span>
          <span className="text-[11px] sm:text-xs font-semibold text-zinc-400">/ {totalTasksCount}</span>
        </div>
        <div className="mt-2 sm:mt-3.5">
          <ProgressBar value={taskCompletionRate} color="indigo" showLabel />
        </div>
      </Card>

      {/* 2. Habits Check-in */}
      <Card variant="interactive" className="group relative overflow-hidden p-3 sm:p-5">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-400 truncate">
            Habit Hari Ini
          </span>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform shrink-0">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.75]" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5 sm:gap-2">
          <span className="text-xl sm:text-3xl font-black text-zinc-50 tracking-tight">{completedHabitsCount}</span>
          <span className="text-[11px] sm:text-xs font-semibold text-zinc-400">/ {totalHabitsCount}</span>
        </div>
        <div className="mt-2 sm:mt-3.5">
          <ProgressBar value={habitCompletionRate} color="emerald" showLabel />
        </div>
      </Card>

      {/* 3. Mood & Energy */}
      <Card variant="interactive" className="group relative overflow-hidden p-3 sm:p-5">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-400 truncate">
            Mood & Energi
          </span>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform shrink-0">
            <Smile className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.75]" />
          </div>
        </div>
        <div className="flex items-baseline gap-1.5 sm:gap-2">
          <span className="text-xl sm:text-3xl font-black text-zinc-50 tracking-tight">
            {dailyLog ? `${dailyLog.mood}.0` : '—'}
          </span>
          <span className="text-[10px] sm:text-xs font-medium text-amber-400 bg-amber-500/10 px-1.5 sm:px-2 py-0.5 rounded border border-amber-500/20 truncate">
            {dailyLog ? getMoodLabel(dailyLog.mood) : 'Belum diisi'}
          </span>
        </div>
        <p className="text-[10px] sm:text-[11px] text-zinc-400 mt-2 sm:mt-3.5 truncate">
          Energi: <strong className="text-amber-300 font-semibold">{dailyLog ? `${dailyLog.energy}/5` : '—'}</strong>
        </p>
      </Card>

      {/* 4. Focus Score */}
      <Card variant="interactive" className="group relative overflow-hidden p-3 sm:p-5">
        <div className="flex items-center justify-between mb-2 sm:mb-3">
          <span className="text-[10px] sm:text-[11px] font-semibold uppercase tracking-wider text-zinc-400 truncate">
            Focus Score
          </span>
          <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform shrink-0">
            <Activity className="w-4 h-4 sm:w-5 sm:h-5 stroke-[1.75]" />
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-1 sm:gap-2">
          <div className="flex items-baseline gap-1 sm:gap-2">
            <span className="text-xl sm:text-3xl font-black text-zinc-50 tracking-tight">{focusScore}%</span>
            <span className="hidden sm:inline-block text-[11px] font-medium text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
              Live
            </span>
          </div>
          {onOpenShareModal && (
            <button
              onClick={onOpenShareModal}
              className="flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold text-violet-300 bg-violet-600/20 hover:bg-violet-600/30 px-2 sm:px-2.5 py-1 rounded-lg border border-violet-500/30 transition-all shrink-0"
              title="Share Achievement Card"
            >
              <Share2 className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-violet-400" />
              <span>Share</span>
            </button>
          )}
        </div>
        <div className="mt-2 sm:mt-3.5">
          <ProgressBar value={focusScore} color="violet" showLabel />
        </div>
      </Card>
    </section>
  );
};
