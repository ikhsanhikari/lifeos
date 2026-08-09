'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Sparkles, 
  Target, 
  CheckSquare, 
  BookOpen, 
  ArrowUpRight, 
  CheckCircle2, 
  Zap, 
  Smile, 
  Activity, 
  Check, 
  Flame,
  ArrowRight
} from 'lucide-react';
import { useDashboard } from './components/DashboardShell';
import { Badge } from './components/ui/Badge';
import { ProgressBar } from './components/ui/ProgressBar';

export default function OverviewPage() {
  const {
    currentUser,
    habits,
    tasks,
    dailyLog,
    analytics,
    goals,
    toggleHabit,
    toggleTaskStatus,
  } = useDashboard();

  // Next pending habit for today
  const pendingHabits = habits.filter((h) => !h.isDoneToday);
  const nextHabit = pendingHabits[0];

  // Top priority task
  const pendingTasks = tasks
    .filter((t) => t.status !== 'DONE')
    .sort((a, b) => {
      const pOrder: Record<string, number> = { URGENT: 1, HIGH: 2, MEDIUM: 3, LOW: 4 };
      return (pOrder[a.priority] || 9) - (pOrder[b.priority] || 9);
    });
  const topTask = pendingTasks[0];

  // Completion metrics
  const completedHabitsCount = habits.filter((h) => h.isDoneToday).length;
  const habitRate = habits.length > 0 ? Math.round((completedHabitsCount / habits.length) * 100) : 0;
  const completedTasksCount = tasks.filter((t) => t.status === 'DONE').length;
  const taskRate = tasks.length > 0 ? Math.round((completedTasksCount / tasks.length) * 100) : 0;
  const focusScore = analytics ? analytics.focusScore : 0;

  const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <div className="space-y-6 sm:space-y-8 max-w-6xl mx-auto py-2">
      {/* 1. Ambient Hero Welcome Banner */}
      <section className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900/90 via-zinc-900/40 to-transparent p-6 sm:p-8 border border-zinc-800/80 backdrop-blur-xl">
        <div className="absolute right-0 top-0 w-96 h-full bg-gradient-to-l from-indigo-500/10 via-violet-500/5 to-transparent pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-2 text-xs font-medium text-zinc-400">
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 font-semibold">
              📅 {currentDateFormatted}
            </span>
            <span>•</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {currentUser ? `Sesi ${currentUser.name}` : 'Mode Tamu'}
            </span>
          </div>

          <h1 className="text-2xl sm:text-4xl font-extrabold text-zinc-50 tracking-tight leading-tight">
            {currentUser ? (
              <>Selamat Datang Kembali, <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-pink-400 bg-clip-text text-transparent">{currentUser.name}</span></>
            ) : (
              <>Selamat Datang di Life OS</>
            )}
          </h1>

          <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl leading-relaxed">
            Fokus pada eksekusi hal-hal terpenting hari ini. Kelola tujuan besar, bangun rutinitas positif, dan catat evaluasi harian secara tenang.
          </p>
        </div>
      </section>

      {/* 2. Sleek KPI Metrics Strip */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1 */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Tugas Selesai</p>
            <p className="text-xl sm:text-2xl font-black text-zinc-100">{completedTasksCount} <span className="text-xs font-normal text-zinc-500">/ {tasks.length}</span></p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <CheckCircle2 className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>

        {/* Metric 2 */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Habit Check-in</p>
            <p className="text-xl sm:text-2xl font-black text-zinc-100">{completedHabitsCount} <span className="text-xs font-normal text-zinc-500">/ {habits.length}</span></p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Zap className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>

        {/* Metric 3 */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Mood & Energi</p>
            <p className="text-xl sm:text-2xl font-black text-zinc-100">{dailyLog ? `${dailyLog.mood}.0` : '—'}</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
            <Smile className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>

        {/* Metric 4 */}
        <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800/80 flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Focus Score</p>
            <p className="text-xl sm:text-2xl font-black text-zinc-100">{focusScore}%</p>
          </div>
          <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
            <Activity className="w-4.5 h-4.5 stroke-[1.75]" />
          </div>
        </div>
      </section>

      {/* 3. Today's Single Focus Hub */}
      <section className="p-5 sm:p-6 rounded-2xl bg-zinc-900/80 border border-zinc-800/90 space-y-4 shadow-xl">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-800/80">
          <div>
            <h2 className="text-base font-bold text-zinc-100 tracking-tight flex items-center gap-2">
              <span>⚡ Eksekusi Hari Ini</span>
            </h2>
            <p className="text-xs text-zinc-400">Tindakan paling utama yang membutuhkan perhatian kamu sekarang</p>
          </div>

          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            Fokus Utama
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Priority Task Focus */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
              <span className="flex items-center gap-1.5 text-indigo-400">
                <CheckSquare className="w-4 h-4" />
                <span>Tugas Prioritas Utama</span>
              </span>
              <Link href="/tasks" className="hover:text-zinc-200 transition-colors">Daftar Task →</Link>
            </div>

            {topTask ? (
              <div
                onClick={() => toggleTaskStatus(topTask.id, topTask.status)}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-indigo-500/40 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    className="w-5 h-5 rounded-md border border-zinc-600 bg-zinc-800 group-hover:border-indigo-400 flex items-center justify-center shrink-0 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5 text-transparent group-hover:text-indigo-400" />
                  </button>
                  <span className="text-xs font-bold text-zinc-100 truncate">{topTask.title}</span>
                </div>
                <Badge variant={topTask.priority === 'URGENT' ? 'urgent' : 'high'} size="sm">
                  {topTask.priority}
                </Badge>
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-zinc-500 bg-zinc-900/50 rounded-xl border border-zinc-800/50">
                🎉 Semua tugas prioritas sudah selesai!
              </div>
            )}
          </div>

          {/* Pending Habit Focus */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold text-zinc-400">
              <span className="flex items-center gap-1.5 text-emerald-400">
                <Target className="w-4 h-4" />
                <span>Habit Berikutnya</span>
              </span>
              <Link href="/habits" className="hover:text-zinc-200 transition-colors">Habit Tracker →</Link>
            </div>

            {nextHabit ? (
              <div
                onClick={() => toggleHabit(nextHabit.id)}
                className="flex items-center justify-between p-3 rounded-xl bg-zinc-900 border border-zinc-800 hover:border-emerald-500/40 cursor-pointer transition-all group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <button
                    type="button"
                    className="w-5 h-5 rounded-full border-2 border-zinc-600 bg-zinc-800 group-hover:border-emerald-400 flex items-center justify-center shrink-0 transition-colors"
                  >
                    <Check className="w-3.5 h-3.5 text-transparent group-hover:text-emerald-400" />
                  </button>
                  <span className="text-xs font-bold text-zinc-100 truncate">{nextHabit.name}</span>
                </div>
                <Badge variant="neutral" size="sm">
                  {nextHabit.frequency || 'DAILY'}
                </Badge>
              </div>
            ) : (
              <div className="p-3 text-center text-xs text-emerald-400 bg-emerald-500/10 rounded-xl border border-emerald-500/20 font-semibold">
                ✨ Seluruh habit harian hari ini sudah tuntas!
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. Spacious Workspace Navigation Hub */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-wider">Ruang Kerja & Ruang Fokus</h2>
          <span className="text-xs text-zinc-500">Pilih modul kerja</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Goals */}
          <Link
            href="/goals"
            className="group p-5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800/80 hover:border-emerald-500/40 transition-all space-y-4 relative overflow-hidden shadow-md hover:shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <Sparkles className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>

            <div>
              <h3 className="text-base font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors">Goals & Mimpi</h3>
              <p className="text-xs text-zinc-400 mt-1">Breakdown tujuan besar menjadi aksi harian</p>
            </div>

            <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
              <span>{goals.length} Goal Terdaftar</span>
              <span className="text-emerald-400 font-semibold">Buka →</span>
            </div>
          </Link>

          {/* Card 2: Habits */}
          <Link
            href="/habits"
            className="group p-5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800/80 hover:border-emerald-500/40 transition-all space-y-4 relative overflow-hidden shadow-md hover:shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-105 transition-transform">
                <Target className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>

            <div>
              <h3 className="text-base font-bold text-zinc-100 group-hover:text-emerald-300 transition-colors">Habit Tracker</h3>
              <p className="text-xs text-zinc-400 mt-1">Bangun kebiasaan positif & jaga konsistensi</p>
            </div>

            <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
              <span>{habits.length} Habit Rutin</span>
              <span className="text-emerald-400 font-semibold">Buka →</span>
            </div>
          </Link>

          {/* Card 3: Tasks */}
          <Link
            href="/tasks"
            className="group p-5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800/80 hover:border-indigo-500/40 transition-all space-y-4 relative overflow-hidden shadow-md hover:shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform">
                <CheckSquare className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>

            <div>
              <h3 className="text-base font-bold text-zinc-100 group-hover:text-indigo-300 transition-colors">Daftar Tugas</h3>
              <p className="text-xs text-zinc-400 mt-1">Eksekusi task harian berdasarkan prioritas</p>
            </div>

            <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
              <span>{tasks.filter((t) => t.status !== 'DONE').length} Pending Tasks</span>
              <span className="text-indigo-400 font-semibold">Buka →</span>
            </div>
          </Link>

          {/* Card 4: Journal */}
          <Link
            href="/journal"
            className="group p-5 rounded-2xl bg-zinc-900/60 hover:bg-zinc-900/90 border border-zinc-800/80 hover:border-amber-500/40 transition-all space-y-4 relative overflow-hidden shadow-md hover:shadow-xl"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-105 transition-transform">
                <BookOpen className="w-5 h-5" />
              </div>
              <ArrowUpRight className="w-4 h-4 text-zinc-500 group-hover:text-amber-400 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
            </div>

            <div>
              <h3 className="text-base font-bold text-zinc-100 group-hover:text-amber-300 transition-colors">Jurnal Harian</h3>
              <p className="text-xs text-zinc-400 mt-1">Refleksi mood, energi, & insight AI Coach</p>
            </div>

            <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between text-xs text-zinc-400">
              <span>{dailyLog ? 'Sudah Diisi' : 'Belum Diisi'}</span>
              <span className="text-amber-400 font-semibold">Buka →</span>
            </div>
          </Link>
        </div>
      </section>
    </div>
  );
}
