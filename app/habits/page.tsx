'use client';

import React, { useState } from 'react';
import { Target, Plus, Flame, Sparkles, CheckCircle2, Clock } from 'lucide-react';
import { useDashboard } from '../components/DashboardShell';
import { HabitPanel } from '../dashboard/components/HabitPanel';
import { StreakInsights } from '../dashboard/components/StreakInsights';
import { Card } from '../components/ui/Card';

export default function HabitsPage() {
  const {
    habits,
    analytics,
    toggleHabit,
    handleDeleteHabit,
    handleCreateHabitSubmit,
    setIsAddHabitModalOpen,
  } = useDashboard();

  const [name, setName] = useState<string>('');
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY'>('DAILY');
  const [color, setColor] = useState<string>('emerald');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleQuickAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await handleCreateHabitSubmit(name.trim(), frequency, color);
      setName('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedCount = habits.filter((h) => h.isDoneToday).length;
  const habitCompletionRate = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto">
      {/* 1. Inline Quick-Add Habit Banner */}
      <Card className="bg-gradient-to-b from-zinc-900/90 to-zinc-900/40 p-4 sm:p-5 border border-zinc-800/80">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold shrink-0">
              <Target className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 tracking-tight">Manajemen Habit & Rutinitas</h2>
              <p className="text-xs text-zinc-400">Buat habit baru secara instan atau kelola rutinitas harian kamu</p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              Progres Hari Ini: {completedCount}/{habits.length} ({habitCompletionRate}%)
            </span>
          </div>
        </div>

        {/* Inline Form */}
        <form onSubmit={handleQuickAddHabit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 border-t border-zinc-800/60">
          <input
            type="text"
            required
            placeholder="Tulis habit baru... (contoh: Olahraga 20m, Baca 10 Halaman)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />

          <select
            value={frequency}
            onChange={(e) => setFrequency(e.target.value as any)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="DAILY">🔄 Daily (Harian)</option>
            <option value="WEEKLY">📅 Weekly (Mingguan)</option>
          </select>

          <select
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500 font-medium"
          >
            <option value="emerald">🟢 Emerald</option>
            <option value="indigo">🟣 Indigo</option>
            <option value="amber">🟠 Amber</option>
            <option value="rose">🔴 Rose</option>
          </select>

          <button
            type="submit"
            disabled={isSubmitting || !name.trim()}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-emerald-950/50"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Habit</span>
          </button>
        </form>
      </Card>

      {/* 2. Responsive 2-Column Power Layout (Desktop) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Column (7/12): Habit Check-in List */}
        <div className="lg:col-span-7">
          <HabitPanel
            habits={habits}
            onToggleHabit={toggleHabit}
            onDeleteHabit={handleDeleteHabit}
            onOpenAddModal={() => setIsAddHabitModalOpen(true)}
          />
        </div>

        {/* Right Column (5/12): Streak Analytics & Consistency Hub */}
        <div className="lg:col-span-5 space-y-4">
          <StreakInsights analytics={analytics} />

          {/* Quick Tips Card */}
          <Card className="space-y-2.5 p-4 bg-zinc-900/60 border border-zinc-800/80">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs">
              <Sparkles className="w-4 h-4" />
              <span>Tips Konsistensi Habit</span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Kunci membangun kebiasaan permanen adalah keteraturan harian (*consistency*), bukan durasi yang berat. Lakukan habit walau 5 menit setiap hari.
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
