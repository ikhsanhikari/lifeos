import React from 'react';
import { Flame, CheckCircle, Clock } from 'lucide-react';
import { AnalyticsSummaryData } from '../page';
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
    <Card className="space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 tracking-tight">Analitik Streak Habit</h2>
            <p className="text-[11px] text-zinc-400">Rekam jejak konsistensi harian dari database</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
        {analytics.habitStreaks.map((item) => (
          <div
            key={item.habitId}
            className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between space-y-2.5 hover:border-zinc-700 transition-colors"
          >
            <span className="text-xs font-semibold text-zinc-100 truncate">{item.habitName}</span>
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20 flex items-center gap-1">
                <Flame className="w-3 h-3 text-amber-400 fill-amber-400" />
                <span>{item.currentStreak} Hari</span>
              </span>

              {item.isDoneToday ? (
                <span className="text-[11px] font-medium text-emerald-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  <span>Done</span>
                </span>
              ) : (
                <span className="text-[11px] font-medium text-zinc-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
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
