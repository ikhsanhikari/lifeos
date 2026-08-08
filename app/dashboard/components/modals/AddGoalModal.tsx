'use client';

import React, { useState } from 'react';

interface AddGoalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (title: string, description: string, deadline: string, color: string) => Promise<void>;
}

const COLOR_OPTIONS = [
  { name: 'Emerald Green', value: 'emerald', bg: 'bg-emerald-500' },
  { name: 'Indigo Blue', value: 'indigo', bg: 'bg-indigo-500' },
  { name: 'Amber Gold', value: 'amber', bg: 'bg-amber-500' },
  { name: 'Rose Pink', value: 'rose', bg: 'bg-rose-500' },
  { name: 'Purple Violet', value: 'purple', bg: 'bg-purple-500' },
];

export function AddGoalModal({ isOpen, onClose, onSubmit }: AddGoalModalProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [color, setColor] = useState('emerald');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit(title.trim(), description.trim(), deadline, color);
      setTitle('');
      setDescription('');
      setDeadline('');
      setColor('emerald');
      onClose();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
              <span>🌟</span> Buat Goal / Mimpi Baru
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5">
              Breakdown tujuan besar kamu menjadi langkah-langkah harian
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-zinc-300 p-1 rounded-lg text-sm transition"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Judul Mimpi / Goal <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              placeholder="e.g. Launch LifeOS ke 100 User Pertama"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full bg-[#18181b] border border-zinc-700/70 rounded-xl px-3.5 py-2.5 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Deskripsi / Motivasi Utama (Opsional)
            </label>
            <textarea
              placeholder="Mengapa goal ini sangat penting untuk kehidupan kamu saat ini?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full bg-[#18181b] border border-zinc-700/70 rounded-xl px-3.5 py-2 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-emerald-500 transition resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">
              Target Deadline (Opsional)
            </label>
            <input
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="w-full bg-[#18181b] border border-zinc-700/70 rounded-xl px-3.5 py-2 text-sm text-zinc-100 focus:outline-none focus:border-emerald-500 transition"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2">
              Tema Warna Highlight
            </label>
            <div className="flex items-center gap-3">
              {COLOR_OPTIONS.map((c) => (
                <button
                  type="button"
                  key={c.value}
                  onClick={() => setColor(c.value)}
                  className={`w-7 h-7 rounded-full ${c.bg} flex items-center justify-center transition-transform ${
                    color === c.value ? 'scale-125 ring-2 ring-white' : 'opacity-70 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-xs text-emerald-300 flex items-center gap-2">
            <span>✨</span>
            <p>Setelah disimpan, kamu bisa klik tombol <strong>"AI Breakdown"</strong> di Goal untuk meng-generate sub-task harian secara otomatis.</p>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-zinc-400 hover:text-zinc-200 transition"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-xl text-xs font-semibold shadow-lg shadow-emerald-900/30 transition flex items-center gap-2"
            >
              {isSubmitting ? 'Menyimpan...' : 'Simpan Goal'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
