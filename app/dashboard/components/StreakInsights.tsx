import React from 'react';
import { Flame, CheckCircle, Clock } from 'lucide-react';
import { AnalyticsSummaryData } from '../../types';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';

interface StreakInsightsProps {
  analytics: AnalyticsSummaryData | null;
}

export const StreakInsights: React.FC<StreakInsightsProps> = ({ analytics }) => {
  if (!analytics || !analytics.habitStreaks || analytics.habitStreaks.length === 0) {
    return null;
  }

  return (
    <Card className="space-y-3 sm:space-y-4">
      <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2 sm:gap-2.5">
          <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
            <Flame className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-bold text-zinc-100 tracking-tight">Analitik Streak Habit</h2>
            <p className="text-[10px] sm:text-[11px] text-zinc-400">Rekam jejak konsistensi harian dari database</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
        {analytics.habitStreaks.map((item) => (
          <div
            key={item.habitId}
            className="p-2.5 sm:p-3.5 rounded-lg sm:rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between space-y-2 hover:border-zinc-700 transition-colors"
          >
            <span className="text-xs font-semibold text-zinc-100 truncate">{item.habitName}</span>
            <div className="flex items-center justify-between gap-1">
              <span className="text-[10px] sm:text-xs font-bold text-amber-400 bg-amber-500/10 px-1.5 sm:px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1 shrink-0">
                <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>{item.currentStreak}h</span>
              </span>

              {item.isDoneToday ? (
                <span className="text-[10px] sm:text-[11px] font-medium text-emerald-400 flex items-center gap-0.5 truncate">
                  <CheckCircle className="w-3 h-3 shrink-0" />
                  <span>Done</span>
                </span>
              ) : (
                <span className="text-[10px] sm:text-[11px] font-medium text-zinc-500 flex items-center gap-0.5 truncate">
                  <Clock className="w-3 h-3 shrink-0" />
                  <span>Pending</span>
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};
