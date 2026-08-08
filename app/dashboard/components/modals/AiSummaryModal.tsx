'use client';

import React, { useState, useEffect } from 'react';

export interface WeeklySummaryData {
  highlights: string[];
  improvements: string[];
  summary: string;
  advice: string;
}

interface AiSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFetchSummary: () => Promise<WeeklySummaryData | null>;
}

export function AiSummaryModal({ isOpen, onClose, onFetchSummary }: AiSummaryModalProps) {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<WeeklySummaryData | null>(null);

  useEffect(() => {
    if (isOpen) {
      handleLoad();
    } else {
      setData(null);
      setError(null);
    }
  }, [isOpen]);

  const handleLoad = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await onFetchSummary();
      if (res) {
        setData(res);
      } else {
        setError('Gagal memuat Weekly Smart Summary.');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan saat meminta summary.');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-[#121215] border border-teal-500/30 rounded-2xl p-6 max-w-lg w-full shadow-2xl space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-500/30 flex items-center justify-center text-xl">
              📊
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                AI Weekly Smart Summary
              </h2>
              <p className="text-xs text-teal-400 font-medium">
                Rangkuman performa 7 hari terakhir oleh AI Coach
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

        {/* Content */}
        {isLoading ? (
          <div className="py-12 text-center space-y-3">
            <div className="inline-block w-8 h-8 border-3 border-teal-500/20 border-t-teal-500 rounded-full animate-spin" />
            <p className="text-sm font-semibold text-zinc-200">
              📊 AI Coach sedang menganalisis data 7 hari terakhir kamu...
            </p>
            <p className="text-xs text-zinc-400">
              Mengkalkulasi tren mood, task selesai, konsistensi habit, dan progres goals.
            </p>
          </div>
        ) : error ? (
          <div className="py-6 px-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-center space-y-3">
            <p className="text-rose-400 text-xs font-medium">{error}</p>
            <button
              onClick={handleLoad}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold rounded-xl transition"
            >
              🔄 Coba Lagi
            </button>
          </div>
        ) : data ? (
          <div className="space-y-4 text-xs text-zinc-200">
            {/* Overview Summary */}
            <div className="p-3.5 bg-zinc-900/80 border border-zinc-800 rounded-xl">
              <h4 className="font-bold text-teal-300 mb-1 flex items-center gap-1.5">
                <span>📝</span> Evaluasi Singkat:
              </h4>
              <p className="leading-relaxed text-zinc-300">{data.summary}</p>
            </div>

            {/* Highlights & Improvements */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Highlights */}
              <div className="p-3 bg-emerald-950/20 border border-emerald-500/20 rounded-xl space-y-1.5">
                <h5 className="font-bold text-emerald-400 flex items-center gap-1">
                  <span>🌟</span> Pencapaian Utama:
                </h5>
                {data.highlights.length > 0 ? (
                  <ul className="space-y-1">
                    {data.highlights.map((h, i) => (
                      <li key={i} className="text-zinc-300 flex items-start gap-1.5">
                        <span className="text-emerald-500">✓</span> {h}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-zinc-400 italic">Belum ada highlight.</p>
                )}
              </div>

              {/* Improvements */}
              <div className="p-3 bg-amber-950/20 border border-amber-500/20 rounded-xl space-y-1.5">
                <h5 className="font-bold text-amber-400 flex items-center gap-1">
                  <span>⚠️</span> Area Perbaikan:
                </h5>
                {data.improvements.length > 0 ? (
                  <ul className="space-y-1">
                    {data.improvements.map((imp, i) => (
                      <li key={i} className="text-zinc-300 flex items-start gap-1.5">
                        <span className="text-amber-500">•</span> {imp}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-zinc-400 italic">Performa konsisten!</p>
                )}
              </div>
            </div>

            {/* Advice */}
            <div className="p-3.5 bg-gradient-to-r from-teal-950/40 to-indigo-950/30 border border-teal-500/30 rounded-xl">
              <h4 className="font-bold text-teal-300 mb-1 flex items-center gap-1.5">
                <span>💡</span> Rekomendasi Fokus Minggu Depan:
              </h4>
              <p className="italic text-zinc-200">{data.advice}</p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end pt-3 border-t border-zinc-800">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 bg-teal-600 hover:bg-teal-500 text-white rounded-xl font-semibold transition text-xs shadow-lg shadow-teal-950/40"
              >
                Tutup
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
