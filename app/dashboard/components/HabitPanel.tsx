import React, { useState } from 'react';
import { Target, Check, Trash2, Plus } from 'lucide-react';
import { HabitData } from '../page';
import { Card } from '../../components/ui/Card';
import { Tabs } from '../../components/ui/Tabs';
import { Badge } from '../../components/ui/Badge';
import { EmptyState } from './EmptyState';

interface HabitPanelProps {
  habits: HabitData[];
  onToggleHabit: (id: string) => void;
  onDeleteHabit: (id: string, e: React.MouseEvent) => void;
  onOpenAddModal: () => void;
}

export const HabitPanel: React.FC<HabitPanelProps> = ({
  habits,
  onToggleHabit,
  onDeleteHabit,
  onOpenAddModal,
}) => {
  const [habitTab, setHabitTab] = useState<'all' | 'pending' | 'completed'>('all');

  const completedCount = habits.filter((h) => h.isDoneToday).length;
  const pendingCount = habits.filter((h) => !h.isDoneToday).length;

  const filteredHabits = habits.filter((h) => {
    if (habitTab === 'pending') return !h.isDoneToday;
    if (habitTab === 'completed') return h.isDoneToday;
    return true;
  });

  return (
    <Card className="flex flex-col justify-between space-y-5">
      <div>
        {/* Panel Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 tracking-tight">Habit Tracker</h2>
              <p className="text-[11px] text-zinc-400">Konsistensi harian kamu hari ini</p>
            </div>
          </div>

          <Tabs
            options={[
              { id: 'all', label: 'Semua', count: habits.length },
              { id: 'pending', label: 'Belum', count: pendingCount },
              { id: 'completed', label: 'Selesai', count: completedCount },
            ]}
            activeTab={habitTab}
            onChange={(tabId) => setHabitTab(tabId as any)}
          />
        </div>

        {/* Habits List */}
        <div className="space-y-2.5 mt-4">
          {filteredHabits.map((habit) => (
            <div
              key={habit.id}
              onClick={() => onToggleHabit(habit.id)}
              className={`flex items-center justify-between p-3.5 rounded-xl border transition-all duration-200 cursor-pointer group ${
                habit.isDoneToday
                  ? 'bg-zinc-900/40 border-zinc-800/60 opacity-75'
                  : 'bg-zinc-900/80 border-zinc-800/80 hover:border-indigo-500/40 hover:bg-zinc-800/50 shadow-sm'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                {/* Circular Toggle */}
                <button
                  type="button"
                  aria-label={`Toggle habit ${habit.name}`}
                  className={`w-6 h-6 rounded-full flex items-center justify-center transition-all duration-200 shrink-0 ${
                    habit.isDoneToday
                      ? 'bg-emerald-500 text-zinc-950 shadow-md shadow-emerald-500/30'
                      : 'border-2 border-zinc-600 bg-zinc-800/60 group-hover:border-indigo-400'
                  }`}
                >
                  {habit.isDoneToday && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </button>

                <span
                  className={`text-xs font-semibold truncate ${
                    habit.isDoneToday ? 'line-through text-zinc-500 font-normal' : 'text-zinc-100'
                  }`}
                >
                  {habit.name}
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Badge variant="neutral" size="sm">
                  {habit.frequency || 'DAILY'}
                </Badge>
                <button
                  type="button"
                  onClick={(e) => onDeleteHabit(habit.id, e)}
                  title="Hapus Habit"
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 rounded-lg transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {filteredHabits.length === 0 && (
            <EmptyState
              icon={Target}
              title="Tidak ada habit pada filter ini"
              description="Buat habit harian baru untuk mulai membangun rutinitas produktif kamu."
              actionLabel="+ Tambah Habit Baru"
              onAction={onOpenAddModal}
            />
          )}
        </div>
      </div>

      {/* Quick Add Habit Trigger */}
      <div className="pt-3 border-t border-zinc-800/80 flex justify-end">
        <button
          onClick={onOpenAddModal}
          className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Tambah Habit</span>
        </button>
      </div>
    </Card>
  );
};
