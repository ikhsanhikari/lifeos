'use client';

import React, { useState, useEffect } from 'react';
import { X, ClipboardList, Check, Sparkles, Trash2, AlertCircle, Bot, Clock, RefreshCw } from 'lucide-react';
import { parseBulkHabitText } from '../../../../src/utils/habitParser';

export interface ParsedHabitObject {
  name: string;
  frequency?: string;
  reminderTime?: string | null;
  color?: string;
}

interface BulkImportHabitModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportSubmit: (items: ParsedHabitObject[]) => Promise<void>;
  onAiParse?: (rawText: string) => Promise<ParsedHabitObject[]>;
  aiAvailable?: boolean;
}

export const BulkImportHabitModal: React.FC<BulkImportHabitModalProps> = ({
  isOpen,
  onClose,
  onImportSubmit,
  onAiParse,
  aiAvailable = true,
}) => {
  const [rawText, setRawText] = useState<string>('');
  const [parsedItems, setParsedItems] = useState<ParsedHabitObject[]>([]);
  const [isAiLoading, setIsAiLoading] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isParsedWithAi, setIsParsedWithAi] = useState<boolean>(false);

  useEffect(() => {
    if (!isOpen) {
      setRawText('');
      setParsedItems([]);
      setErrorMessage(null);
      setIsSubmitting(false);
      setIsAiLoading(false);
      setIsParsedWithAi(false);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!rawText.trim()) {
      setParsedItems([]);
      setIsParsedWithAi(false);
      setErrorMessage(null);
      return;
    }

    if (!isParsedWithAi) {
      const extracted = parseBulkHabitText(rawText);
      setParsedItems(extracted.map((name) => ({ name, frequency: 'DAILY', color: 'indigo' })));
    }
  }, [rawText, isParsedWithAi]);

  if (!isOpen) return null;

  const handleParseWithAi = async () => {
    if (!rawText.trim()) {
      setErrorMessage('Teks checklist wajib diisi terlebih dahulu.');
      return;
    }

    if (!onAiParse) {
      setErrorMessage('Layanan AI tidak tersedia.');
      return;
    }

    setIsAiLoading(true);
    setErrorMessage(null);

    try {
      const habits = await onAiParse(rawText);
      setParsedItems(habits);
      setIsParsedWithAi(true);
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan saat memanggil AI.');
    } finally {
      setIsAiLoading(false);
    }
  };

  const handleRemoveItem = (indexToRemove: number) => {
    setParsedItems((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedItems.length === 0) {
      setErrorMessage('Tidak ada item habit yang terdeteksi dari teks.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onImportSubmit(parsedItems);
      onClose();
    } catch (err: any) {
      setErrorMessage(err.message || 'Gagal mengimpor habit.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-3 sm:p-4 animate-fade-in">
      <div className="bg-[#121215] border border-zinc-800 rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl space-y-0 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-zinc-800/80 bg-zinc-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 font-bold shrink-0">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <span>AI Smart Habit Bulk Import</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono">
                  Gemini AI Powered
                </span>
              </h3>
              <p className="text-xs text-zinc-400">Ekstrak checklist, waktu reminder, & habit otomatis dari teks bebas</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300">Paste Teks Checklist / Daily Plan:</label>
              <button
                type="button"
                onClick={handleParseWithAi}
                disabled={isAiLoading || !rawText.trim() || !aiAvailable}
                title={!aiAvailable ? 'Fitur AI dinonaktifkan di Settings' : 'Ekstrak jam & habit dengan AI'}
                className="px-3 py-1 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 shadow-md shadow-purple-950/40"
              >
                {isAiLoading ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>AI Parsing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-purple-200" />
                    <span>Parse via AI ✨</span>
                  </>
                )}
              </button>
            </div>

            <textarea
              rows={6}
              value={rawText}
              onChange={(e) => {
                setRawText(e.target.value);
                setIsParsedWithAi(false);
              }}
              placeholder={`Contoh teks:\nibu sih rencana gini ya\n✅ Checklist Harian\n🤲 Ibadah\n* ⬜ Bangun sebelum Subuh\n* ⬜ Sholat 5 waktu\n🎥 Konten\n* ⬜ Rekam 10 video mentah\n* ⬜ Tidur maksimal pukul 22.00`}
              className="w-full bg-zinc-950/80 border border-zinc-800 rounded-xl p-3 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-purple-500 transition-colors font-mono leading-relaxed"
            />
          </div>

          {/* Live Preview List */}
          {parsedItems.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-zinc-800/80">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>Hasil Ekstraksi ({parsedItems.length} Habit)</span>
                </span>
                {isParsedWithAi && (
                  <span className="text-[10px] font-semibold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                    ✨ Parsed by Gemini AI
                  </span>
                )}
              </div>

              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {parsedItems.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-900/80 border border-zinc-800 text-xs text-zinc-200 group hover:border-purple-500/40 transition-colors"
                  >
                    <div className="flex items-center gap-2.5 min-w-0 pr-2">
                      <span className="w-5 h-5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {idx + 1}
                      </span>
                      <span className="truncate font-medium">{item.name}</span>
                      {item.reminderTime && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1 shrink-0">
                          <Clock className="w-3 h-3" />
                          <span>{item.reminderTime}</span>
                        </span>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(idx)}
                      title="Hapus dari daftar impor"
                      className="p-1 text-zinc-500 hover:text-rose-400 rounded transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Actions */}
          <div className="pt-3 border-t border-zinc-800/80 flex items-center justify-between">
            <span className="text-[11px] text-zinc-500">Impor ini menggunakan AI Service terkonfigurasi pada server</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold rounded-xl transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSubmitting || parsedItems.length === 0}
                className="px-5 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-lg shadow-purple-950/50"
              >
                {isSubmitting ? (
                  <span>Mengimpor...</span>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Impor {parsedItems.length} Habit</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
