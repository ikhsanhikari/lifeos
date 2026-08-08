import React from 'react';
import { CheckCircle2, Zap, Smile, Activity, Share2 } from 'lucide-react';
import { HabitData, TaskData, DailyLogData, AnalyticsSummaryData } from '../page';
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
    <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {/* 1. Tasks Completion */}
      <Card variant="interactive" className="group relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Task Selesai
          </span>
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
            <CheckCircle2 className="w-5 h-5 stroke-[1.75]" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-zinc-50 tracking-tight">{completedTasksCount}</span>
          <span className="text-xs font-semibold text-zinc-400">/ {totalTasksCount} tugas</span>
        </div>
        <div className="mt-3.5">
          <ProgressBar value={taskCompletionRate} color="indigo" showLabel />
        </div>
      </Card>

      {/* 2. Habits Check-in */}
      <Card variant="interactive" className="group relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Habit Hari Ini
          </span>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
            <Zap className="w-5 h-5 stroke-[1.75]" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-zinc-50 tracking-tight">{completedHabitsCount}</span>
          <span className="text-xs font-semibold text-zinc-400">/ {totalHabitsCount} habit</span>
        </div>
        <div className="mt-3.5">
          <ProgressBar value={habitCompletionRate} color="emerald" showLabel />
        </div>
      </Card>

      {/* 3. Mood & Energy */}
      <Card variant="interactive" className="group relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Mood & Energi
          </span>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
            <Smile className="w-5 h-5 stroke-[1.75]" />
          </div>
        </div>
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-black text-zinc-50 tracking-tight">
            {dailyLog ? `${dailyLog.mood}.0` : '—'}
          </span>
          <span className="text-xs font-medium text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
            {dailyLog ? getMoodLabel(dailyLog.mood) : 'Belum diisi'}
          </span>
        </div>
        <p className="text-[11px] text-zinc-400 mt-3.5">
          Tingkat Energi Fisik: <strong className="text-amber-300 font-semibold">{dailyLog ? `${dailyLog.energy}/5` : '—'}</strong>
        </p>
      </Card>

      {/* 4. Focus Score */}
      <Card variant="interactive" className="group relative overflow-hidden">
        <div className="flex items-center justify-between mb-3">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
            Focus Score
          </span>
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-105 transition-transform">
            <Activity className="w-5 h-5 stroke-[1.75]" />
          </div>
        </div>
        <div className="flex items-baseline justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="text-3xl font-black text-zinc-50 tracking-tight">{focusScore}%</span>
            <span className="text-[11px] font-medium text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded border border-violet-500/20">
              Live
            </span>
          </div>
          {onOpenShareModal && (
            <button
              onClick={onOpenShareModal}
              className="flex items-center gap-1 text-[11px] font-semibold text-violet-300 bg-violet-600/20 hover:bg-violet-600/30 px-2.5 py-1 rounded-lg border border-violet-500/30 transition-all"
              title="Share Achievement Card"
            >
              <Share2 className="w-3.5 h-3.5 text-violet-400" />
              <span>Share</span>
            </button>
          )}
        </div>
        <div className="mt-3.5">
          <ProgressBar value={focusScore} color="violet" showLabel />
        </div>
      </Card>
    </section>
  );
};
