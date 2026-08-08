'use client';

import React, { useState, useEffect } from 'react';

export interface GeneratedTask {
  id: string;
  title: string;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  selected: boolean;
}

interface AiGoalBreakdownModalProps {
  isOpen: boolean;
  onClose: () => void;
  goalId?: string;
  goalTitle: string;
  goalDescription?: string;
  onAcceptTasks: (goalId: string, tasksToAdd: Array<{ title: string; priority: string }>) => Promise<void>;
  onFetchBreakdown: (goalTitle: string, goalDescription?: string) => Promise<{ tasks: Array<{ title: string; priority: string }>; advice: string } | null>;
}

export function AiGoalBreakdownModal({
  isOpen,
  onClose,
  goalId,
  goalTitle,
  goalDescription,
  onAcceptTasks,
  onFetchBreakdown,
}: AiGoalBreakdownModalProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [advice, setAdvice] = useState<string>('');
  const [tasks, setTasks] = useState<GeneratedTask[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen && goalTitle) {
      handleGenerate();
    } else {
      setTasks([]);
      setAdvice('');
      setError(null);
    }
  }, [isOpen, goalTitle]);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await onFetchBreakdown(goalTitle, goalDescription);
      if (res && Array.isArray(res.tasks) && res.tasks.length > 0) {
        setTasks(
          res.tasks.map((t, idx) => ({
            id: `gen-${idx}-${Date.now()}`,
            title: t.title,
            priority: (t.priority as any) || 'MEDIUM',
            selected: true,
          }))
        );
        setAdvice(res.advice || '');
      } else {
        setError('Tidak ada hasil task breakdown dari AI. Coba lagi.');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menghasilkan breakdown dengan AI.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const toggleTaskSelected = (id: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === id ? { ...t, selected: !t.selected } : t))
    );
  };

  const toggleSelectAll = () => {
    const allSelected = tasks.every((t) => t.selected);
    setTasks((prev) => prev.map((t) => ({ ...t, selected: !allSelected })));
  };

  const selectedCount = tasks.filter((t) => t.selected).length;

  const handleSubmit = async () => {
    if (!goalId || selectedCount === 0) return;
    setIsSubmitting(true);
    try {
      const selectedTasks = tasks
        .filter((t) => t.selected)
        .map((t) => ({ title: t.title, priority: t.priority }));
      await onAcceptTasks(goalId, selectedTasks);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan task ke Goal.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#121215] border border-emerald-500/30 rounded-2xl p-6 max-w-lg w-full shadow-2xl shadow-emerald-950/40 space-y-5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-xl shadow-inner">
              ✨
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                AI Goal Breakdown
              </h2>
              <p className="text-xs text-emerald-400 font-medium line-clamp-1">
                📌 Goal: "{goalTitle}"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg text-sm transition"
          >
            ✕
          </button>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <div className="inline-block w-8 h-8 border-3 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
            <p className="text-sm font-semibold text-zinc-200">
              🧠 AI Executive Coach sedang menganalisis & menyusun langkah konkret...
            </p>
            <p className="text-xs text-zinc-400">
              Memecahkan mimpi besar menjadi tugas harian yang actionable dalam beberapa detik.
            </p>
          </div>
        ) : error ? (
          <div className="py-6 px-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center space-y-3">
            <p className="text-rose-400 text-xs font-medium">{error}</p>
            <button
              onClick={handleGenerate}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition"
            >
              🔄 Coba Lagi
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* AI Advice Card */}
            {advice && (
              <div className="p-3.5 bg-gradient-to-r from-emerald-950/40 to-teal-950/30 border border-emerald-500/20 rounded-xl text-xs text-zinc-300 flex items-start gap-2.5">
                <span className="text-base">💡</span>
                <div>
                  <span className="font-semibold text-emerald-300 block mb-0.5">Saran AI Coach:</span>
                  <p className="italic text-zinc-300">{advice}</p>
                </div>
              </div>
            )}

            {/* Sub-tasks list */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-zinc-300">
                  Rekomendasi Task ({selectedCount}/{tasks.length} Terpilih):
                </span>
                <button
                  type="button"
                  onClick={toggleSelectAll}
                  className="text-[11px] text-emerald-400 hover:underline font-medium"
                >
                  {tasks.every((t) => t.selected) ? 'Deselect Semua' : 'Select Semua'}
                </button>
              </div>

              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => toggleTaskSelected(task.id)}
                    className={`flex items-center justify-between p-3 rounded-xl border text-xs cursor-pointer select-none transition ${
                      task.selected
                        ? 'bg-emerald-950/30 border-emerald-500/40 text-zinc-100'
                        : 'bg-zinc-900/40 border-zinc-800/80 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-3 pr-2">
                      <input
                        type="checkbox"
                        checked={task.selected}
                        onChange={() => {}} // handled by parent div onClick
                        className="rounded border-zinc-700 text-emerald-600 focus:ring-emerald-500/20 bg-zinc-900"
                      />
                      <span className={task.selected ? 'font-medium text-zinc-100' : 'line-through text-zinc-400'}>
                        {task.title}
                      </span>
                    </div>

                    <span
                      className={`text-[10px] px-2 py-0.5 rounded font-bold uppercase ${
                        task.priority === 'HIGH' || task.priority === 'URGENT'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-zinc-800 text-zinc-400'
                      }`}
                    >
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isLoading || isSubmitting}
                className="text-xs text-zinc-400 hover:text-zinc-200 transition flex items-center gap-1.5"
              >
                <span>🔄</span> Regenerate
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || selectedCount === 0 || !goalId}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-950/40 transition flex items-center gap-1.5"
                >
                  {isSubmitting ? 'Menambahkan...' : `➕ Tambah (${selectedCount}) Task`}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
