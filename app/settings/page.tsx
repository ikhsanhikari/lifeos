'use client';

import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  Clock, 
  ShieldCheck, 
  Check, 
  Flame, 
  Moon, 
  Sun, 
  Sliders, 
  AlertCircle, 
  RotateCcw,
  Send
} from 'lucide-react';
import { useDashboard } from '../components/DashboardShell';
import { Card } from '../components/ui/Card';

// Generating 10-minute interval options for time select dropdowns
const TIME_OPTIONS: string[] = [];
for (let hour = 0; hour < 24; hour++) {
  const hh = hour.toString().padStart(2, '0');
  for (let min = 0; min < 60; min += 10) {
    const mm = min.toString().padStart(2, '0');
    TIME_OPTIONS.push(`${hh}:${mm}`);
  }
}

export default function ReminderSettingsPage() {
  const {
    userSettings,
    handleSaveSettings,
    telegramStatus,
    handleOpenLinkModal,
  } = useDashboard();

  const [remindersEnabled, setRemindersEnabled] = useState<boolean>(true);
  const [morningReminderTime, setMorningReminderTime] = useState<string>('07:00');
  const [eveningRecapTime, setEveningRecapTime] = useState<string>('21:00');
  const [streakAlertTime, setStreakAlertTime] = useState<string>('22:00');
  const [hourlyRemindersEnabled, setHourlyRemindersEnabled] = useState<boolean>(true);
  const [autoFollowUpEnabled, setAutoFollowUpEnabled] = useState<boolean>(true);
  const [autoFollowUpDelayHours, setAutoFollowUpDelayHours] = useState<number>(2);

  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (userSettings) {
      setRemindersEnabled(userSettings.remindersEnabled ?? true);
      setMorningReminderTime(userSettings.morningReminderTime || '07:00');
      setEveningRecapTime(userSettings.eveningRecapTime || '21:00');
      setStreakAlertTime(userSettings.streakAlertTime || '22:00');
      setHourlyRemindersEnabled(userSettings.hourlyRemindersEnabled ?? true);
      setAutoFollowUpEnabled(userSettings.autoFollowUpEnabled ?? true);
      setAutoFollowUpDelayHours(userSettings.autoFollowUpDelayHours || 2);
    }
  }, [userSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      const ok = await handleSaveSettings({
        remindersEnabled,
        morningReminderTime,
        eveningRecapTime,
        streakAlertTime,
        hourlyRemindersEnabled,
        autoFollowUpEnabled,
        autoFollowUpDelayHours,
      });

      if (ok) {
        setSuccessMessage('Pengaturan pengingat berhasil disimpan!');
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setErrorMessage('Gagal menyimpan pengaturan. Silakan coba lagi.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Terjadi kesalahan sistem.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
      <Card className="p-5 sm:p-6 space-y-6">
        {/* Header Summary */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-zinc-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold shrink-0">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 tracking-tight">Pengaturan Telegram Reminder</h2>
              <p className="text-xs text-zinc-400">Konfigurasi jadwal waktu notifikasi push & bot telegram harian kamu</p>
            </div>
          </div>

          <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 self-start sm:self-auto">
            WIB Timezone (Asia/Jakarta)
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Telegram Linking Warning / Status */}
          {!telegramStatus.isLinked ? (
            <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-start justify-between gap-3">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-amber-200">Telegram belum terhubung</p>
                  <p className="text-[11px] text-amber-300/80 mt-0.5">
                    Hubungkan akun Telegram agar bot dapat mengirimkan notifikasi sesuai jadwal yang kamu atur.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleOpenLinkModal}
                className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 text-amber-200 font-semibold rounded-lg text-xs shrink-0 flex items-center gap-1 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
                <span>Hubungkan</span>
              </button>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2.5">
              <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="font-medium">
                Telegram terhubung ({telegramStatus.telegramLink?.telegramUsername ? `@${telegramStatus.telegramLink.telegramUsername}` : 'Aktif'}). Bot siap mengirim notifikasi.
              </span>
            </div>
          )}

          {/* Master Switch */}
          <div className="p-4 rounded-xl bg-zinc-950/80 border border-zinc-800 flex items-center justify-between">
            <div className="space-y-0.5 pr-4">
              <label className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                <Bell className="w-4 h-4 text-indigo-400" />
                Aktifkan Semua Push Notification
              </label>
              <p className="text-[11px] text-zinc-400">Master toggle pengiriman pesan reminder otomatis via bot.</p>
            </div>
            <button
              type="button"
              onClick={() => setRemindersEnabled(!remindersEnabled)}
              className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                remindersEnabled ? 'bg-indigo-600' : 'bg-zinc-700'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  remindersEnabled ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Individual Reminder Time Pickers */}
          <div className={`space-y-3.5 transition-all duration-200 ${!remindersEnabled ? 'opacity-40 pointer-events-none' : ''}`}>
            {/* Morning Reminder Time */}
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-200">Morning Reminder</p>
                  <p className="text-[11px] text-zinc-400">Recap habit, goal, & deadline pagi hari</p>
                </div>
              </div>
              <select
                value={morningReminderTime}
                onChange={(e) => setMorningReminderTime(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-medium text-zinc-200 px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={`m-${time}`} value={time}>
                    {time} WIB
                  </option>
                ))}
              </select>
            </div>

            {/* Evening Recap Time */}
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-200">Evening Recap</p>
                  <p className="text-[11px] text-zinc-400">Pengingat isi Jurnal Harian & Mood Log</p>
                </div>
              </div>
              <select
                value={eveningRecapTime}
                onChange={(e) => setEveningRecapTime(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-medium text-zinc-200 px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={`e-${time}`} value={time}>
                    {time} WIB
                  </option>
                ))}
              </select>
            </div>

            {/* Streak Night Alert Time */}
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-rose-500/10 text-rose-400 border border-rose-500/20">
                  <Flame className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-200">Streak Night Alert</p>
                  <p className="text-[11px] text-zinc-400">Peringatan habit streak terancam putus</p>
                </div>
              </div>
              <select
                value={streakAlertTime}
                onChange={(e) => setStreakAlertTime(e.target.value)}
                className="bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-medium text-zinc-200 px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {TIME_OPTIONS.map((time) => (
                  <option key={`s-${time}`} value={time}>
                    {time} WIB
                  </option>
                ))}
              </select>
            </div>

            {/* Hourly Item Reminder Toggle */}
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-zinc-200">Hourly Task/Habit Alerts</p>
                  <p className="text-[11px] text-zinc-400">Notifikasi tepat jam spesifik per-item habit/task</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setHourlyRemindersEnabled(!hourlyRemindersEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  hourlyRemindersEnabled ? 'bg-indigo-600' : 'bg-zinc-700'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    hourlyRemindersEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Auto Follow-Up Reminders Section */}
            <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    <RotateCcw className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-zinc-200">Auto Follow-Up Pengingat</p>
                    <p className="text-[11px] text-zinc-400">Kirim susulan jika target durasi tertunda belum dikerjakan</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setAutoFollowUpEnabled(!autoFollowUpEnabled)}
                  className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    autoFollowUpEnabled ? 'bg-indigo-600' : 'bg-zinc-700'
                  }`}
                >
                  <span
                    className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                      autoFollowUpEnabled ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {autoFollowUpEnabled && (
                <div className="pt-2 border-t border-zinc-800/60 flex items-center justify-between">
                  <span className="text-[11px] text-zinc-400 font-medium">Jeda Waktu Susulan (Delay):</span>
                  <select
                    value={autoFollowUpDelayHours}
                    onChange={(e) => setAutoFollowUpDelayHours(Number(e.target.value))}
                    className="bg-zinc-900 border border-zinc-700 rounded-lg text-xs font-medium text-zinc-200 px-3 py-1.5 focus:outline-none focus:border-indigo-500 transition-colors"
                  >
                    <option value={1}>1 Jam Setelahnya</option>
                    <option value={2}>2 Jam Setelahnya</option>
                    <option value={3}>3 Jam Setelahnya</option>
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Feedback Alerts */}
          {successMessage && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2 animate-fade-in">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Submit Actions */}
          <div className="pt-4 border-t border-zinc-800 flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all"
            >
              {isSubmitting ? (
                <span>Menyimpan...</span>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Simpan Pengaturan</span>
                </>
              )}
            </button>
          </div>
        </form>
      </Card>
    </div>
  );
}
