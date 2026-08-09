import React from 'react';
import { usePathname } from 'next/navigation';
import { Calendar } from 'lucide-react';
import { UserAuthData } from '../../types';

interface TopBarProps {
  currentUser: UserAuthData | null;
  onOpenAddGoalModal?: () => void;
  onOpenAddHabitModal?: () => void;
  onOpenAiSummaryModal?: () => void;
  onOpenShareModal?: () => void;
  aiAvailable?: boolean;
}

export const TopBar: React.FC<TopBarProps> = ({
  currentUser,
}) => {
  const pathname = usePathname();

  const currentDateFormatted = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const getPageHeaderInfo = () => {
    switch (pathname) {
      case '/goals':
        return {
          title: <>Goals & Mimpi Besar</>,
          subtitle: 'Breakdown tujuan besar kamu menjadi aksi harian',
        };
      case '/habits':
        return {
          title: <>Habit Tracker</>,
          subtitle: 'Bangun kebiasaan positif dan rekam konsistensi harian',
        };
      case '/tasks':
        return {
          title: <>Daftar Tugas (Tasks)</>,
          subtitle: 'Eksekusi tugas harian berdasarkan tingkat prioritas',
        };
      case '/journal':
        return {
          title: <>Jurnal Harian & Refleksi</>,
          subtitle: 'Catat mood, energi fisik, dan dapatkan insight AI Coach',
        };
      case '/streaks':
        return {
          title: <>Analitik Streaks Habit</>,
          subtitle: 'Rekam jejak konsistensi harian dari waktu ke waktu',
        };
      case '/share':
        return {
          title: <>Share Card Studio 📤</>,
          subtitle: 'Bagikan pencapaian produktivitas harian kamu ke media sosial dengan style estetik',
        };
      case '/settings':
        return {
          title: <>Pengaturan Telegram Reminder ⏰</>,
          subtitle: 'Atur jadwal notifikasi push harian, pengingat habit, dan recap malam',
        };
      default:
        return {
          title: currentUser ? (
            <>Selamat Datang, <span className="bg-gradient-to-r from-indigo-400 via-violet-300 to-pink-400 bg-clip-text text-transparent">{currentUser.name}</span></>
          ) : (
            <>Dashboard Life OS</>
          ),
          subtitle: 'Fokus pada eksekusi hal penting, kebiasaan harian, dan refleksi terpadu.',
        };
    }
  };

  const headerInfo = getPageHeaderInfo();

  return (
    <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 bg-zinc-900/60 border border-zinc-800/80 p-3.5 sm:p-5 rounded-xl sm:rounded-2xl backdrop-blur-md relative overflow-hidden">
      {/* Background Accent */}
      <div className="absolute right-0 top-0 w-48 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />

      <div>
        <div className="flex items-center gap-2 text-[11px] sm:text-xs font-medium text-zinc-400 mb-0.5 sm:mb-1">
          <Calendar className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
          <span className="truncate">{currentDateFormatted}</span>
          <span className="text-zinc-600">•</span>
          <span className="flex items-center gap-1 text-emerald-400 font-medium shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {currentUser ? `Sesi ${currentUser.name}` : 'Mode Tamu'}
          </span>
        </div>

        <h1 className="text-lg sm:text-2xl font-extrabold text-zinc-50 tracking-tight">
          {headerInfo.title}
        </h1>
        <p className="text-[11px] sm:text-xs text-zinc-400 mt-0.5 sm:mt-1">
          {headerInfo.subtitle}
        </p>
      </div>

    </header>
  );
};
