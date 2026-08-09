import React, { useState, useEffect } from 'react';
import { X, CheckSquare, Check } from 'lucide-react';
import { TaskData } from '../../../types';
import { GoalData } from '../GoalPanel';
import { Button } from '../../../components/ui/Button';

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  task: TaskData | null;
  goals: GoalData[];
  onSubmit: (taskId: string, updated: { title: string; priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'; status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'; goalId?: string | null }) => Promise<void>;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  onClose,
  task,
  goals,
  onSubmit,
}) => {
  const [title, setTitle] = useState<string>('');
  const [priority, setPriority] = useState<'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [status, setStatus] = useState<'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'>('TODO');
  const [goalId, setGoalId] = useState<string>('none');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (task) {
      setTitle(task.title || '');
      setPriority(task.priority || 'MEDIUM');
      setStatus(task.status || 'TODO');
      setGoalId(task.goalId || 'none');
    }
  }, [task, isOpen]);

  if (!isOpen || !task) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(task.id, {
        title: title.trim(),
        priority,
        status,
        goalId: goalId === 'none' ? null : goalId,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-200 p-1 rounded-lg hover:bg-zinc-800 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="text-center space-y-2">
          <div className="w-11 h-11 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto">
            <CheckSquare className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-zinc-100">Edit Task / Tugas</h3>
          <p className="text-xs text-zinc-400">
            Perbarui judul, prioritas, status, atau alokasi goal dari tugas ini.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Judul Task
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Tingkat Prioritas
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="URGENT">🚨 URGENT</option>
                <option value="HIGH">🔥 HIGH</option>
                <option value="MEDIUM">⚡ MEDIUM</option>
                <option value="LOW">🔹 LOW</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Status Task
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 font-medium"
              >
                <option value="TODO">⬜ To Do (Belum)</option>
                <option value="IN_PROGRESS">⏳ In Progress</option>
                <option value="DONE">✅ Done (Selesai)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Alokasi Ke Goal Utama (Opsional)
            </label>
            <select
              value={goalId}
              onChange={(e) => setGoalId(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none focus:border-indigo-500 font-medium"
            >
              <option value="none">Tanpa Goal (Tugas Umum)</option>
              {goals.map((g) => (
                <option key={g.id} value={g.id}>
                  🌟 {g.title}
                </option>
              ))}
            </select>
          </div>

          <div className="pt-2">
            <Button
              type="submit"
              variant="primary"
              size="lg"
              className="w-full"
              isLoading={isSubmitting}
              leftIcon={<Check className="w-4 h-4" />}
            >
              Simpan Perubahan Task
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
