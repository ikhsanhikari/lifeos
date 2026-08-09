'use client';

import React, { useState } from 'react';
import { Target, Plus, Flame, Sparkles, CheckCircle2, Clock, ClipboardList } from 'lucide-react';
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
    handleOpenEditHabitModal,
    handleCreateHabitSubmit,
    handleReorderHabits,
    setIsAddHabitModalOpen,
    setIsBulkImportModalOpen,
  } = useDashboard();

  const [name, setName] = useState<string>('');
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY'>('DAILY');
  const [color, setColor] = useState<string>('emerald');
  const [reminderTime, setReminderTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleQuickAddHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await handleCreateHabitSubmit(name.trim(), frequency, color, reminderTime || undefined);
      setName('');
      setReminderTime('');
    } finally {
      setIsSubmitting(false);
    }
  };

  const completedCount = habits.filter((h) => h.isDoneToday).length;
  const habitCompletionRate = habits.length > 0 ? Math.round((completedCount / habits.length) * 100) : 0;

  return (
    <div className="space-y-4 sm:space-y-6 max-w-6xl mx-auto">
      {/* 1. Quick-Add Habit Bar (Desktop Only) */}
      <Card className="hidden sm:block p-3 sm:p-4 bg-zinc-900/80 border border-zinc-800/80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-200">⚡ Fast Add Habit</span>
            <span className="text-[10px] font-semibold text-zinc-500 font-mono">Quick Input</span>
          </div>

          <span className="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            Progres Hari Ini: {completedCount}/{habits.length} ({habitCompletionRate}%)
          </span>
        </div>

        {/* Inline Form */}
        <form onSubmit={handleQuickAddHabit} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            required
            placeholder="Tulis habit baru... (contoh: Olahraga 20m, Read 10 pages)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
          />

          <div className="flex items-center gap-1.5 bg-zinc-950 border border-zinc-800 rounded-xl px-2.5 py-1.5" title="Jam Pengingat Telegram">
            <Clock className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="bg-transparent text-xs text-zinc-100 focus:outline-none w-20 font-mono"
            />
          </div>

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

          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-1.5 shrink-0 shadow-md shadow-emerald-950/50"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah</span>
            </button>
            <button
              type="button"
              onClick={() => setIsBulkImportModalOpen(true)}
              title="Paste checklist & impor banyak habit sekaligus"
              className="px-3.5 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 shrink-0"
            >
              <ClipboardList className="w-4 h-4 text-indigo-400" />
              <span className="hidden xs:inline">Import Bulk</span>
              <span className="xs:hidden">Bulk</span>
            </button>
          </div>
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
            onEditHabit={handleOpenEditHabitModal}
            onReorderHabits={handleReorderHabits}
            onOpenAddModal={() => setIsAddHabitModalOpen(true)}
            onOpenBulkModal={() => setIsBulkImportModalOpen(true)}
            showTitle={false}
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
