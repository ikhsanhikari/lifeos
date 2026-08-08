'use client';

import React, { useState } from 'react';

export interface GoalData {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'ABANDONED';
  color: string | null;
  totalTasks: number;
  completedTasks: number;
  progress: number;
  tasks?: Array<{ id: string; title: string; status: string; priority: string }>;
  habits?: Array<{ id: string; name: string; color: string | null }>;
}

interface GoalPanelProps {
  goals: GoalData[];
  onDeleteGoal: (goalId: string, e: React.MouseEvent) => void;
  onOpenAddModal: () => void;
  onAddTaskToGoal: (goalId: string, taskTitle: string) => Promise<void>;
  onOpenAiBreakdown?: (goal: GoalData) => void;
  aiAvailable?: boolean;
}

export function GoalPanel({
  goals,
  onDeleteGoal,
  onOpenAddModal,
  onAddTaskToGoal,
  onOpenAiBreakdown,
  aiAvailable = true,
}: GoalPanelProps) {
  const [expandedGoalId, setExpandedGoalId] = useState<string | null>(null);
  const [newTaskInput, setNewTaskInput] = useState<Record<string, string>>({});
  const [isSubmittingTask, setIsSubmittingTask] = useState<boolean>(false);

  const toggleExpand = (id: string) => {
    setExpandedGoalId((prev) => (prev === id ? null : id));
  };

  const handleAddTaskSubmit = async (goalId: string, e: React.FormEvent) => {
    e.preventDefault();
    const title = newTaskInput[goalId]?.trim();
    if (!title) return;

    setIsSubmittingTask(true);
    try {
      await onAddTaskToGoal(goalId, title);
      setNewTaskInput((prev) => ({ ...prev, [goalId]: '' }));
    } finally {
      setIsSubmittingTask(false);
    }
  };

  return (
    <div className="bg-[#121215] border border-zinc-800/80 rounded-2xl p-5 shadow-xl space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 font-bold text-sm">
            🌟
          </div>
          <div>
            <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
              Goals (Mimpi Besar)
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                {goals.length} Total
              </span>
            </h2>
            <p className="text-xs text-zinc-400">Breakdown tujuan besar kamu menjadi langkah-langkah harian</p>
          </div>
        </div>

        <button
          onClick={onOpenAddModal}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600/90 hover:bg-emerald-500 text-white text-xs font-semibold rounded-xl transition shadow-md shadow-emerald-950/40"
        >
          <span>+</span> Buat Goal
        </button>
      </div>

      {goals.length === 0 ? (
        <div className="text-center py-8 px-4 border border-dashed border-zinc-800 rounded-xl bg-zinc-900/30">
          <p className="text-2xl mb-2">🎯</p>
          <h3 className="text-sm font-semibold text-zinc-300">Belum ada Goal yang dibuat</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1 mb-4">
            Aplikasi ini berfungsi menghubungkan mimpi besar kamu dengan aksi harian. Mulai dengan membuat goal pertama kamu!
          </p>
          <button
            onClick={onOpenAddModal}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold transition"
          >
            + Buat Goal Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3.5">
          {goals.map((goal) => {
            const isExpanded = expandedGoalId === goal.id;
            const formattedDeadline = goal.deadline
              ? new Date(goal.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
              : null;

            return (
              <div
                key={goal.id}
                className="bg-[#18181b] border border-zinc-800/90 hover:border-zinc-700/80 rounded-xl p-4 transition space-y-3"
              >
                <div
                  className="flex items-start justify-between cursor-pointer select-none"
                  onClick={() => toggleExpand(goal.id)}
                >
                  <div className="space-y-1 flex-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-base font-bold text-zinc-100">{goal.title}</span>
                      {formattedDeadline && (
                        <span className="text-[11px] px-2 py-0.5 rounded-md bg-zinc-800 text-zinc-300 border border-zinc-700/60 font-medium">
                          📅 {formattedDeadline}
                        </span>
                      )}
                    </div>

                    {goal.description && (
                      <p className="text-xs text-zinc-400 line-clamp-1">{goal.description}</p>
                    )}

                    <div className="pt-2">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="text-zinc-400 text-[11px]">
                          Task Progress: <strong className="text-zinc-200">{goal.completedTasks}/{goal.totalTasks}</strong>
                        </span>
                        <span className="text-emerald-400 font-bold">{goal.progress}%</span>
                      </div>
                      <div className="w-full bg-zinc-800 h-2 rounded-full overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-400 h-full rounded-full transition-all duration-500"
                          style={{ width: `${goal.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => onDeleteGoal(goal.id, e)}
                      className="text-zinc-500 hover:text-rose-400 p-1.5 rounded-lg hover:bg-rose-500/10 transition"
                      title="Hapus Goal"
                    >
                      🗑️
                    </button>
                    <span className="text-zinc-400 text-xs">{isExpanded ? '▲' : '▼'}</span>
                  </div>
                </div>

                {isExpanded && (
                  <div className="pt-3 border-t border-zinc-800/80 space-y-3 animate-fadeIn">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                          <span>📋</span> Sub-Tasks Breakdown:
                        </h4>
                        {aiAvailable && onOpenAiBreakdown && (
                          <button
                            type="button"
                            onClick={() => onOpenAiBreakdown(goal)}
                            className="flex items-center gap-1 px-2.5 py-1 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-semibold rounded-lg transition"
                          >
                            <span>✨</span> AI Breakdown
                          </button>
                        )}
                      </div>

                      {goal.tasks && goal.tasks.length > 0 ? (
                        <div className="space-y-1.5 mb-3">
                          {goal.tasks.map((t) => (
                            <div
                              key={t.id}
                              className="flex items-center gap-2 px-3 py-1.5 bg-[#121215] border border-zinc-800/60 rounded-lg text-xs"
                            >
                              <span className={t.status === 'DONE' ? 'text-emerald-400 font-bold' : 'text-zinc-500'}>
                                {t.status === 'DONE' ? '✅' : '⬜'}
                              </span>
                              <span className={t.status === 'DONE' ? 'line-through text-zinc-400' : 'text-zinc-200'}>
                                {t.title}
                              </span>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-zinc-400 italic mb-3">Belum ada task yang di-breakdown untuk goal ini.</p>
                      )}

                      <form
                        onSubmit={(e) => handleAddTaskSubmit(goal.id, e)}
                        className="flex items-center gap-2"
                      >
                        <input
                          type="text"
                          placeholder="+ Tambah langkah / task konkret ke goal ini..."
                          value={newTaskInput[goal.id] || ''}
                          onChange={(e) => setNewTaskInput((prev) => ({ ...prev, [goal.id]: e.target.value }))}
                          className="flex-1 bg-[#121215] border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
                        />
                        <button
                          type="submit"
                          disabled={isSubmittingTask || !newTaskInput[goal.id]?.trim()}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-semibold transition"
                        >
                          Tambah
                        </button>
                      </form>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
