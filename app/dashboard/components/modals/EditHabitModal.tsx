import React, { useState, useEffect } from 'react';
import { X, Target, Check } from 'lucide-react';
import { HabitData } from '../../../types';
import { Button } from '../../../components/ui/Button';

interface EditHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  habit: HabitData | null;
  onSubmit: (habitId: string, updated: { name: string; description?: string; frequency: 'DAILY' | 'WEEKLY'; color: string; reminderTime?: string }) => Promise<void>;
}

export const EditHabitModal: React.FC<EditHabitModalProps> = ({
  isOpen,
  onClose,
  habit,
  onSubmit,
}) => {
  const [name, setName] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [frequency, setFrequency] = useState<'DAILY' | 'WEEKLY'>('DAILY');
  const [color, setColor] = useState<string>('emerald');
  const [reminderTime, setReminderTime] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (habit) {
      setName(habit.name || '');
      setDescription(habit.description || '');
      setFrequency((habit.frequency as any) || 'DAILY');
      setColor(habit.color || 'emerald');
    }
  }, [habit, isOpen]);

  if (!isOpen || !habit) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(habit.id, {
        name: name.trim(),
        description: description.trim(),
        frequency,
        color,
        reminderTime: reminderTime || undefined,
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
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <Target className="w-5 h-5" />
          </div>
          <h3 className="text-lg font-bold text-zinc-100">Edit Habit / Rutinitas</h3>
          <p className="text-xs text-zinc-400">
            Perbarui nama, frekuensi, warna tema, atau jam reminder habit harian kamu.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              Nama Habit
            </label>
            <input
              type="text"
              required
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Frekuensi
              </label>
              <select
                value={frequency}
                onChange={(e) => setFrequency(e.target.value as any)}
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-300 focus:outline-none focus:border-emerald-500 font-medium"
              >
                <option value="DAILY">Harian (Daily)</option>
                <option value="WEEKLY">Mingguan (Weekly)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
                Warna Tema
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
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-300">
              ⏰ Jam Pengingat Telegram (Opsional)
            </label>
            <input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 focus:outline-none focus:border-emerald-500 transition-colors"
            />
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
              Simpan Perubahan Habit
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
