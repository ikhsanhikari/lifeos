import React, { useState, useEffect } from 'react';
import { BookOpen, Save, CheckCircle, Sparkles } from 'lucide-react';
import { DailyLogData } from '../../types';
export type { DailyLogData };
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';

interface DailyJournalProps {
  dailyLog: DailyLogData | null;
  onSaveDailyLog: (mood: number, energy: number, journal: string) => Promise<void>;
  onFetchDailyCoachInsight?: (journal: string, mood: number, energy: number) => Promise<{ insight: string; pattern: string; recommendation: string } | null>;
  aiAvailable?: boolean;
  showTitle?: boolean;
}

export const DailyJournal: React.FC<DailyJournalProps> = ({
  dailyLog,
  onSaveDailyLog,
  onFetchDailyCoachInsight,
  aiAvailable = true,
  showTitle = true,
}) => {
  const [mood, setMood] = useState<number>(4);
  const [energy, setEnergy] = useState<number>(4);
  const [journal, setJournal] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  const [aiInsightData, setAiInsightData] = useState<{ insight: string; pattern: string; recommendation: string } | null>(null);
  const [isFetchingInsight, setIsFetchingInsight] = useState<boolean>(false);
  const [insightError, setInsightError] = useState<string | null>(null);

  useEffect(() => {
    if (dailyLog) {
      setMood(dailyLog.mood || 4);
      setEnergy(dailyLog.energy || 4);
      setJournal(dailyLog.journal || '');
    }
  }, [dailyLog]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await onSaveDailyLog(mood, energy, journal);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const moodOptions = [
    { value: 1, label: 'Sangat Buruk', emoji: '😭' },
    { value: 2, label: 'Buruk', emoji: '🙁' },
    { value: 3, label: 'Biasa', emoji: '😐' },
    { value: 4, label: 'Baik', emoji: '🙂' },
    { value: 5, label: 'Sangat Baik', emoji: '😊' },
  ];

  const energyOptions = [
    { value: 1, label: 'Low Energy', icon: '🪫' },
    { value: 2, label: 'Moderate', icon: '🔋' },
    { value: 3, label: 'Good', icon: '⚡' },
    { value: 4, label: 'High', icon: '⚡⚡' },
    { value: 5, label: 'Peak Performance', icon: '⚡⚡⚡' },
  ];

  const handleRequestInsight = async () => {
    if (!onFetchDailyCoachInsight) return;
    setIsFetchingInsight(true);
    setInsightError(null);
    try {
      const res = await onFetchDailyCoachInsight(journal, mood, energy);
      if (res) {
        setAiInsightData(res);
      } else {
        setInsightError('Gagal mendapatkan respon AI Coach.');
      }
    } catch (err: any) {
      setInsightError(err.message || 'Gagal memanggil AI Coach.');
    } finally {
      setIsFetchingInsight(false);
    }
  };

  return (
    <Card className="relative overflow-hidden">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4 pb-3 sm:pb-4 border-b border-zinc-800/80 mb-3.5 sm:mb-5">
        {showTitle ? (
          <div className="flex items-center gap-2 sm:gap-2.5">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
              <BookOpen className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-zinc-100 tracking-tight">Jurnal Harian & Refleksi</h2>
              <p className="text-[10px] sm:text-[11px] text-zinc-400">Catat mood, energi fisik, dan jurnal singkat harian</p>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-200">Refleksi Hari Ini</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
              {dailyLog ? 'Sudah Diisi' : 'Belum Diisi'}
            </span>
          </div>
        )}

        {saveSuccess && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold animate-in fade-in slide-in-from-top-1 self-start sm:self-auto">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Jurnal Berhasil Disimpan</span>
          </div>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-3.5 sm:space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-5">
          {/* Mood Selector */}
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
              <span>Suasana Hati (Mood)</span>
              <span className="text-indigo-400 font-bold">
                {moodOptions.find((m) => m.value === mood)?.label}
              </span>
            </label>
            <div className="grid grid-cols-5 gap-1 sm:gap-2 bg-zinc-900/90 p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-zinc-800">
              {moodOptions.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMood(m.value)}
                  className={`py-1.5 sm:py-2 rounded-md sm:rounded-lg text-base sm:text-lg transition-all duration-200 flex items-center justify-center ${
                    mood === m.value
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 scale-105 font-bold'
                      : 'hover:bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {m.emoji}
                </button>
              ))}
            </div>
          </div>

          {/* Energy Level Selector */}
          <div className="space-y-1.5 sm:space-y-2">
            <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
              <span>Tingkat Energi Fisik</span>
              <span className="text-amber-400 font-bold">{energy} / 5</span>
            </label>
            <div className="grid grid-cols-5 gap-1 sm:gap-2 bg-zinc-900/90 p-1 sm:p-1.5 rounded-lg sm:rounded-xl border border-zinc-800">
              {energyOptions.map((e) => (
                <button
                  key={e.value}
                  type="button"
                  onClick={() => setEnergy(e.value)}
                  className={`py-1.5 sm:py-2.5 rounded-md sm:rounded-lg text-[10px] sm:text-xs font-semibold transition-all duration-200 ${
                    energy === e.value
                      ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 scale-105'
                      : 'hover:bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {e.icon}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Reflection Textarea */}
        <div className="space-y-1.5 sm:space-y-2">
          <label className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-zinc-300">
            Catatan Jurnal & Refleksi
          </label>
          <textarea
            rows={2}
            placeholder="Apa pencapaian terbaik atau ide penting yang kamu dapatkan hari ini? Tulis di sini..."
            value={journal}
            onChange={(e) => setJournal(e.target.value)}
            className="w-full bg-zinc-900/90 border border-zinc-800 rounded-lg sm:rounded-xl p-2.5 sm:p-3.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none leading-relaxed"
          />
        </div>

        {/* Submit Actions */}
        <div className="flex items-center justify-end gap-3">
          {aiAvailable && onFetchDailyCoachInsight && (
            <button
              type="button"
              onClick={handleRequestInsight}
              disabled={isFetchingInsight}
              className="px-4 py-2 bg-indigo-950/40 hover:bg-indigo-900/60 text-indigo-300 border border-indigo-500/30 text-xs font-semibold rounded-xl transition flex items-center gap-1.5 shadow-sm"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              {isFetchingInsight ? 'Menganalisis...' : '🤖 Minta Insight AI'}
            </button>
          )}

          <Button
            type="submit"
            variant="primary"
            size="md"
            isLoading={isSaving}
            leftIcon={<Save className="w-3.5 h-3.5" />}
          >
            Simpan Jurnal
          </Button>
        </div>

        {/* AI Coach Response Card */}
        {aiInsightData && (
          <div className="mt-4 p-4 rounded-2xl bg-gradient-to-r from-indigo-950/40 via-purple-950/30 to-zinc-900/50 border border-indigo-500/30 space-y-3 animate-fadeIn shadow-xl">
            <div className="flex items-center gap-2 text-indigo-300 font-bold text-xs border-b border-indigo-500/20 pb-2">
              <Sparkles className="w-4 h-4 text-indigo-400" />
              <span>AI Coach Feedback & Refleksi Personal</span>
            </div>

            <div className="space-y-2 text-xs text-zinc-200">
              <p className="leading-relaxed"><strong className="text-indigo-300">Observasi Coach:</strong> {aiInsightData.insight}</p>
              {aiInsightData.pattern && (
                <p className="leading-relaxed"><strong className="text-purple-300">Pola Terdeteksi:</strong> {aiInsightData.pattern}</p>
              )}
              {aiInsightData.recommendation && (
                <p className="leading-relaxed bg-indigo-500/10 p-2.5 rounded-xl border border-indigo-500/20 text-indigo-200">
                  <strong className="text-emerald-400">💡 Aksi Mikro Disarankan:</strong> {aiInsightData.recommendation}
                </p>
              )}
            </div>
          </div>
        )}

        {insightError && (
          <p className="text-xs text-rose-400 mt-2">{insightError}</p>
        )}
      </form>
    </Card>
  );
};
