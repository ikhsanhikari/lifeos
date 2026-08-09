'use client';

import React from 'react';
import Link from 'next/link';
import { Target, CheckSquare, Sparkles, BookOpen, Check, ArrowRight, Zap, Award } from 'lucide-react';
import { useDashboard } from './components/DashboardShell';
import { StatsGrid } from './dashboard/components/StatsGrid';
import { Card } from './components/ui/Card';
import { Badge } from './components/ui/Badge';

export default function OverviewPage() {
  const {
    habits,
    tasks,
    dailyLog,
    analytics,
    goals,
    handleOpenShareModal,
    toggleHabit,
    toggleTaskStatus,
    setIsAddHabitModalOpen,
    setIsAddGoalModalOpen,
  } = useDashboard();

  // Pending habits for today
  const pendingHabits = habits.filter((h) => !h.isDoneToday);
  const completedHabitsCount = habits.filter((h) => h.isDoneToday).length;

  // Priority tasks (Urgent or High, not DONE) or fallback to top TODO tasks
  const priorityTasks = tasks
    .filter((t) => t.status !== 'DONE')
    .sort((a, b) => {
      const pOrder: Record<string, number> = { URGENT: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
      return (pOrder[a.priority] || 9) - (pOrder[b.priority] || 9);
    })
    .slice(0, 4);

  // Active goals (top 2)
  const activeGoals = goals.filter((g) => g.status === 'ACTIVE').slice(0, 2);

  const getMoodEmoji = (m?: number) => {
    switch (m) {
      case 5: return '😊';
      case 4: return '🙂';
      case 3: return '😐';
      case 2: return '🙁';
      case 1: return '😭';
      default: return '📝';
    }
  };

  return (
    <div className="space-y-3.5 sm:space-y-6">
      {/* 1. Top KPI Stats Grid */}
      <StatsGrid
        habits={habits}
        tasks={tasks}
        dailyLog={dailyLog}
        analytics={analytics}
        onOpenShareModal={handleOpenShareModal}
      />

      {/* 2. Today's Action Center (Side-by-side 2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-6">
        {/* Habit Action Widget */}
        <Card className="flex flex-col justify-between space-y-3 sm:space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                  <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-zinc-100 tracking-tight">Habit Perlu Dicentang</h2>
                  <p className="text-[10px] sm:text-[11px] text-zinc-400">
                    {pendingHabits.length > 0 ? `${pendingHabits.length} habit belum selesai hari ini` : 'Semua habit hari ini selesai'}
                  </p>
                </div>
              </div>

              <Link
                href="/habits"
                className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors shrink-0"
              >
                <span>Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2 mt-3">
              {pendingHabits.length > 0 ? (
                pendingHabits.slice(0, 4).map((habit) => (
                  <div
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id)}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-900/80 border border-zinc-800/80 hover:border-emerald-500/40 hover:bg-zinc-800/50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        className="w-5 h-5 rounded-full border-2 border-zinc-600 bg-zinc-800/60 group-hover:border-emerald-400 flex items-center justify-center shrink-0 transition-colors"
                      >
                        <Check className="w-3 h-3 text-transparent group-hover:text-emerald-400" />
                      </button>
                      <span className="text-xs font-semibold text-zinc-100 truncate">{habit.name}</span>
                    </div>

                    <Badge variant="neutral" size="sm">
                      {habit.frequency || 'DAILY'}
                    </Badge>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                  <p className="text-lg">🎉</p>
                  <p className="text-xs font-bold text-emerald-400">Luar Biasa!</p>
                  <p className="text-[11px] text-zinc-400">Seluruh habit harian kamu ({completedHabitsCount}) sudah tuntas dicentang hari ini.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800/60 flex justify-between items-center text-xs">
            <span className="text-zinc-500 text-[11px]">{completedHabitsCount} selesai hari ini</span>
            <button
              onClick={() => setIsAddHabitModalOpen(true)}
              className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold transition-colors"
            >
              + Habit Baru
            </button>
          </div>
        </Card>

        {/* Task Priority Action Widget */}
        <Card className="flex flex-col justify-between space-y-3 sm:space-y-4">
          <div>
            <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-zinc-800/80">
              <div className="flex items-center gap-2 sm:gap-2.5">
                <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
                  <CheckSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </div>
                <div>
                  <h2 className="text-sm sm:text-base font-bold text-zinc-100 tracking-tight">Tugas Utama Hari Ini</h2>
                  <p className="text-[10px] sm:text-[11px] text-zinc-400">Prioritas utama yang butuh dieksekusi</p>
                </div>
              </div>

              <Link
                href="/tasks"
                className="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition-colors shrink-0"
              >
                <span>Semua</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="space-y-2 mt-3">
              {priorityTasks.length > 0 ? (
                priorityTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleTaskStatus(task.id, task.status)}
                    className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-900/80 border border-zinc-800/80 hover:border-indigo-500/40 hover:bg-zinc-800/50 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        className="w-4.5 h-4.5 rounded-md border border-zinc-600 bg-zinc-800/60 group-hover:border-indigo-400 flex items-center justify-center shrink-0 transition-colors"
                      >
                        <Check className="w-3 h-3 text-transparent group-hover:text-indigo-400" />
                      </button>
                      <span className="text-xs font-semibold text-zinc-100 truncate">{task.title}</span>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {task.goal && (
                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 max-w-[80px] truncate">
                          🌟 {task.goal.title}
                        </span>
                      )}
                      <Badge
                        variant={
                          task.priority === 'URGENT'
                            ? 'urgent'
                            : task.priority === 'HIGH'
                            ? 'high'
                            : task.priority === 'MEDIUM'
                            ? 'medium'
                            : 'low'
                        }
                        size="sm"
                      >
                        {task.priority}
                      </Badge>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-center space-y-1">
                  <p className="text-lg">✨</p>
                  <p className="text-xs font-bold text-indigo-300">Tidak ada tugas mendesak!</p>
                  <p className="text-[11px] text-zinc-400">Seluruh tugas prioritas utama kamu sudah selesai.</p>
                </div>
              )}
            </div>
          </div>

          <div className="pt-2 border-t border-zinc-800/60 flex justify-between items-center text-xs">
            <span className="text-zinc-500 text-[11px]">{tasks.filter((t) => t.status === 'DONE').length} tugas selesai hari ini</span>
            <Link
              href="/tasks"
              className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold transition-colors"
            >
              + Tambah Task
            </Link>
          </div>
        </Card>
      </div>

      {/* 3. Bottom Quick Summary (Active Goals & Daily Reflection) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3.5 sm:gap-6">
        {/* Active Goals Ringkasan */}
        <Card className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
                <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-zinc-100 tracking-tight">Progres Goal Utama</h2>
                <p className="text-[10px] sm:text-[11px] text-zinc-400">{goals.length} total goal terdaftar</p>
              </div>
            </div>

            <Link
              href="/goals"
              className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors shrink-0"
            >
              <span>Kelola</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="space-y-2.5">
            {activeGoals.length > 0 ? (
              activeGoals.map((goal) => (
                <div key={goal.id} className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="text-zinc-100 truncate">{goal.title}</span>
                    <span className="text-emerald-400 font-bold">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                      style={{ width: `${goal.progress}%` }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-xs text-zinc-400 border border-dashed border-zinc-800 rounded-xl">
                Belum ada goal aktif.
                <button
                  onClick={() => setIsAddGoalModalOpen(true)}
                  className="block mx-auto mt-1 text-emerald-400 font-semibold hover:underline"
                >
                  + Buat Goal Pertama
                </button>
              </div>
            )}
          </div>
        </Card>

        {/* Refleksi & Jurnal Hari Ini */}
        <Card className="space-y-3 sm:space-y-4">
          <div className="flex items-center justify-between pb-2.5 sm:pb-3 border-b border-zinc-800/80">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              </div>
              <div>
                <h2 className="text-sm sm:text-base font-bold text-zinc-100 tracking-tight">Refleksi Hari Ini</h2>
                <p className="text-[10px] sm:text-[11px] text-zinc-400">Mood & catatan jurnal harian</p>
              </div>
            </div>

            <Link
              href="/journal"
              className="text-xs font-semibold text-amber-400 hover:text-amber-300 flex items-center gap-1 transition-colors shrink-0"
            >
              <span>Jurnal</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800/80 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{getMoodEmoji(dailyLog?.mood)}</span>
              <div>
                <p className="text-xs font-bold text-zinc-100">
                  {dailyLog ? `Mood: ${dailyLog.mood}/5 • Energi: ${dailyLog.energy}/5` : 'Jurnal Belum Diisi'}
                </p>
                <p className="text-[11px] text-zinc-400 line-clamp-1">
                  {dailyLog?.journal || 'Klik untuk mencatat evaluasi dan perasaan hari ini.'}
                </p>
              </div>
            </div>

            <Link
              href="/journal"
              className="px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 rounded-lg text-xs font-semibold shrink-0 transition-colors"
            >
              {dailyLog?.journal ? 'Edit' : 'Isi Jurnal'}
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
