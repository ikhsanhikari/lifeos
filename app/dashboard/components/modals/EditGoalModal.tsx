import React, { useState, useEffect } from 'react';
import { X, Sparkles, Check } from 'lucide-react';
import { GoalData } from '../GoalPanel';
import { Button } from '../../../components/ui/Button';

interface EditGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: GoalData | null;
  onSubmit: (goalId: string, updated: { title: string; description: string; deadline: string; status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'ABANDONED'; color: string }) => Promise<void>;
}

export const EditGoalModal: React.FC<EditGoalModalProps> = ({
  isOpen,
  onClose,
  goal,
  onSubmit,
}) => {
  const [title, setTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [deadline, setDeadline] = useState<string>('');
  const [status, setStatus] = useState<'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'ABANDONED'>('ACTIVE');
  const [color, setColor] = useState<string>('emerald');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (goal) {
      setTitle(goal.title || '');
      setDescription(goal.description || '');
      setDeadline(goal.deadline ? goal.deadline.split('T')[0] : '');
      setStatus(goal.status || 'ACTIVE');
      setColor(goal.color || 'emerald');
    }
  }, [goal, isOpen]);

  if (!isOpen || !goal) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(goal.id, {
        title: title.trim(),
        description: description.trim(),
        deadline,
        status,
        color,
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
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto font-bold text-lg">
            🌟
          </div>
          <h3 className="text-lg font-bold text-zinc-100">Edit Goal / Mimpi Besar</h3>
          <p className="text-xs text-zinc-400">
            Perbarui detail target, tenggat waktu, dan status pencapaian mimpi kamu.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Judul Goal
            </label>
            <input
              type="text"
              required
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Deskripsi & Catatan
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Target Deadline
              </label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Status Goal
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="ACTIVE">⚡ Active (Berjalan)</option>
                <option value="COMPLETED">✅ Completed (Selesai)</option>
                <option value="PAUSED">⏸️ Paused (Ditunda)</option>
                <option value="ABANDONED">❌ Abandoned (Batal)</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Warna Tema Card
            </label>
            <select
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500 font-medium"
            >
              <option value="emerald">🟢 Emerald</option>
              <option value="indigo">🟣 Indigo</option>
              <option value="amber">🟠 Amber</option>
              <option value="rose">🔴 Rose</option>
              <option value="cyan">🔵 Cyan</option>
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
              Simpan Perubahan Goal
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
