'use client';

import React, { useState, useEffect, useCallback } from 'react';

export interface HabitData {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  color: string | null;
  isDoneToday: boolean;
  logId?: string;
}

export interface TaskData {
  id: string;
  title: string;
  description: string | null;
  priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED';
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
}

export interface DailyLogData {
  id?: string;
  mood: number;
  energy: number;
  journal?: string | null;
  highlights?: string[];
}

export interface AnalyticsSummaryData {
  focusScore: number;
  habitStreaks: Array<{
    habitId: string;
    habitName: string;
    currentStreak: number;
    isDoneToday: boolean;
  }>;
  recentMoodLogs: Array<{
    date: string;
    mood: number;
    energy: number;
  }>;
}

export interface TelegramStatusData {
  isLinked: boolean;
  telegramLink?: {
    telegramUsername?: string;
    telegramChatId?: string;
  } | null;
}

export interface UserAuthData {
  id: string;
  name: string;
  email: string;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState<UserAuthData | null>(null);
  const [habits, setHabits] = useState<HabitData[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [dailyLog, setDailyLog] = useState<DailyLogData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummaryData | null>(null);
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatusData>({ isLinked: false });

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Daily Log Form State
  const [selectedMood, setSelectedMood] = useState<number>(4);
  const [selectedEnergy, setSelectedEnergy] = useState<number>(4);
  const [journalText, setJournalText] = useState<string>('');
  const [isSavingLog, setIsSavingLog] = useState<boolean>(false);
  const [logSaveSuccess, setLogSaveSuccess] = useState<boolean>(false);

  // Add Habit Modal State
  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState<boolean>(false);
  const [newHabitName, setNewHabitName] = useState<string>('');
  const [newHabitFrequency, setNewHabitFrequency] = useState<'DAILY' | 'WEEKLY'>('DAILY');
  const [newHabitColor, setNewHabitColor] = useState<string>('indigo');
  const [isCreatingHabit, setIsCreatingHabit] = useState<boolean>(false);

  // Filter States
  const [habitTab, setHabitTab] = useState<'all' | 'pending' | 'completed'>('all');
  const [taskTab, setTaskTab] = useState<'all' | 'todo' | 'done'>('all');

  // New Task Input Form
  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskPriority, setNewTaskPriority] = useState<'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'>('MEDIUM');
  const [isAddingTask, setIsAddingTask] = useState<boolean>(false);

  // Telegram Linking Modal State
  const [isLinkModalOpen, setIsLinkModalOpen] = useState<boolean>(false);
  const [linkTokenData, setLinkTokenData] = useState<{ token: string; telegramUrl: string; expiresAt: number } | null>(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState<boolean>(false);

  // Helper for Authorization Headers
  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('lifeos_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Fetch habits, tasks, daily logs, analytics, and telegram status from Backend API
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = getAuthHeaders();

      // Check current auth user
      const token = typeof window !== 'undefined' ? localStorage.getItem('lifeos_token') : null;
      if (token) {
        try {
          const meRes = await fetch(`${API_BASE_URL}/api/auth/me`, { headers });
          const meJson = await meRes.json();
          if (meJson.success && meJson.user) {
            setCurrentUser(meJson.user);
          }
        } catch (e) {
          // ignore auth check failure
        }
      }

      const [habitsRes, tasksRes, logRes, analyticsRes, tgRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/habits`, { headers }),
        fetch(`${API_BASE_URL}/api/tasks`, { headers }),
        fetch(`${API_BASE_URL}/api/daily-logs/today`, { headers }),
        fetch(`${API_BASE_URL}/api/analytics/summary`, { headers }),
        fetch(`${API_BASE_URL}/api/telegram/status`, { headers }),
      ]);

      if (!habitsRes.ok || !tasksRes.ok) {
        throw new Error('Gagal terhubung ke backend API server');
      }

      const [habitsJson, tasksJson, logJson, analyticsJson, tgJson] = await Promise.all([
        habitsRes.json(),
        tasksRes.json(),
        logRes.json(),
        analyticsRes.json(),
        tgRes.json(),
      ]);

      if (habitsJson.success && Array.isArray(habitsJson.habits)) {
        setHabits(habitsJson.habits);
      }

      if (tasksJson.success && Array.isArray(tasksJson.tasks)) {
        setTasks(tasksJson.tasks);
      }

      if (logJson.success && logJson.dailyLog) {
        setDailyLog(logJson.dailyLog);
        setSelectedMood(logJson.dailyLog.mood || 4);
        setSelectedEnergy(logJson.dailyLog.energy || 4);
        setJournalText(logJson.dailyLog.journal || '');
      }

      if (analyticsJson.success && analyticsJson.summary) {
        setAnalytics(analyticsJson.summary);
      }

      if (tgJson.success) {
        setTelegramStatus({
          isLinked: tgJson.isLinked,
          telegramLink: tgJson.telegramLink,
        });
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Koneksi ke backend API (http://localhost:3000) gagal.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('lifeos_token');
    document.cookie = 'lifeos_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    setCurrentUser(null);
    setHabits([]);
    setTasks([]);
    setDailyLog(null);
    setAnalytics(null);
    setTelegramStatus({ isLinked: false, telegramLink: null });
  };

  // Create Habit
  const handleCreateHabitSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newHabitName.trim()) return;

    setIsCreatingHabit(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          name: newHabitName.trim(),
          frequency: newHabitFrequency,
          color: newHabitColor,
        }),
      });

      const json = await res.json();
      if (json.success && json.habit) {
        setNewHabitName('');
        setIsAddHabitModalOpen(false);
        fetchData();
      }
    } catch (err) {
      console.error('Error creating habit:', err);
    } finally {
      setIsCreatingHabit(false);
    }
  };

  // Delete Habit
  const handleDeleteHabit = async (habitId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Apakah Anda yakin ingin menghapus habit ini?')) return;

    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    try {
      await fetch(`${API_BASE_URL}/api/habits/${habitId}`, { method: 'DELETE', headers: getAuthHeaders() });
      fetchData();
    } catch (err) {
      console.error('Error deleting habit:', err);
    }
  };

  // Delete Task
  const handleDeleteTask = async (taskId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Apakah Anda yakin ingin menghapus task ini?')) return;

    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    try {
      await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, { method: 'DELETE', headers: getAuthHeaders() });
      fetchData();
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // Save Daily Log
  const handleSaveDailyLog = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingLog(true);
    setLogSaveSuccess(false);

    try {
      const res = await fetch(`${API_BASE_URL}/api/daily-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          mood: selectedMood,
          energy: selectedEnergy,
          journal: journalText,
        }),
      });

      const json = await res.json();
      if (json.success && json.dailyLog) {
        setDailyLog(json.dailyLog);
        setLogSaveSuccess(true);
        setTimeout(() => setLogSaveSuccess(false), 3000);
        fetchData();
      }
    } catch (err) {
      console.error('Error saving daily log:', err);
    } finally {
      setIsSavingLog(false);
    }
  };

  // Poll Telegram status while link modal is open
  useEffect(() => {
    if (!isLinkModalOpen) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/telegram/status`, { headers: getAuthHeaders() });
        const json = await res.json();
        if (json.success && json.isLinked) {
          setTelegramStatus({ isLinked: true, telegramLink: json.telegramLink });
          setIsLinkModalOpen(false);
          setLinkTokenData(null);
        }
      } catch (err) {
        // ignore polling errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [isLinkModalOpen]);

  // Open Telegram Linking Modal
  const handleOpenLinkModal = async () => {
    setIsGeneratingToken(true);
    setIsLinkModalOpen(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/telegram/link-token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({}),
      });
      const json = await res.json();
      if (json.success) {
        setLinkTokenData({
          token: json.token,
          telegramUrl: json.telegramUrl,
          expiresAt: json.expiresAt,
        });
      }
    } catch (err) {
      console.error('Error generating link token:', err);
    } finally {
      setIsGeneratingToken(false);
    }
  };

  // Toggle habit check-in status
  const toggleHabit = async (id: string) => {
    setHabits((prev) =>
      prev.map((h) => (h.id === id ? { ...h, isDoneToday: !h.isDoneToday } : h))
    );

    try {
      const res = await fetch(`${API_BASE_URL}/api/habits/check-in`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ habitId: id }),
      });
      const json = await res.json();
      if (json.success) {
        setHabits((prev) =>
          prev.map((h) => (h.id === id ? { ...h, isDoneToday: json.isDoneToday } : h))
        );
        fetchData();
      }
    } catch (err) {
      console.error('Error toggling habit:', err);
    }
  };

  // Toggle task status
  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'DONE' ? 'TODO' : 'DONE';
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, status: nextStatus as any } : t))
    );

    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: nextStatus }),
      });
      const json = await res.json();
      if (json.success && json.task) {
        setTasks((prev) =>
          prev.map((t) => (t.id === taskId ? json.task : t))
        );
        fetchData();
      }
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  // Create New Task via Web API
  const handleAddNewTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;

    setIsAddingTask(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          title: newTaskTitle.trim(),
          priority: newTaskPriority,
        }),
      });

      const json = await res.json();
      if (json.success && json.task) {
        setTasks((prev) => [json.task, ...prev]);
        setNewTaskTitle('');
        fetchData();
      }
    } catch (err) {
      console.error('Error creating task:', err);
    } finally {
      setIsAddingTask(false);
    }
  };

  // Stats Calculations
  const completedHabitsCount = habits.filter((h) => h.isDoneToday).length;
  const totalHabitsCount = habits.length;
  const habitCompletionRate = totalHabitsCount > 0 ? Math.round((completedHabitsCount / totalHabitsCount) * 100) : 0;

  const completedTasksCount = tasks.filter((t) => t.status === 'DONE').length;
  const totalTasksCount = tasks.length;
  const taskCompletionRate = totalTasksCount > 0 ? Math.round((completedTasksCount / totalTasksCount) * 100) : 0;

  // Filtered lists
  const filteredHabits = habits.filter((h) => {
    if (habitTab === 'pending') return !h.isDoneToday;
    if (habitTab === 'completed') return h.isDoneToday;
    return true;
  });

  const filteredTasks = tasks.filter((t) => {
    if (taskTab === 'todo') return t.status !== 'DONE';
    if (taskTab === 'done') return t.status === 'DONE';
    return true;
  });

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'URGENT':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/10 border border-rose-500/30 text-rose-400">🔴 URGENT</span>;
      case 'HIGH':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 border border-amber-500/30 text-amber-400">🟠 HIGH</span>;
      case 'MEDIUM':
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400">🟡 MEDIUM</span>;
      default:
        return <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 border border-slate-700 text-slate-400">⚪ LOW</span>;
    }
  };

  const getMoodLabel = (m: number) => {
    switch (m) {
      case 5: return '😊 Sangat Baik';
      case 4: return '🙂 Baik';
      case 3: return '😐 Biasa';
      case 2: return '🙁 Buruk';
      default: return '😭 Sangat Buruk';
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 p-4 sm:p-6 lg:p-10 font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl pointer-events-none -z-10" />
      <div className="fixed top-20 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto space-y-8">
        {/* HEADER SECTION */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 glass-card p-6 rounded-2xl border border-slate-800/80 shadow-2xl relative overflow-hidden">
          <div className="absolute right-0 top-0 w-64 h-full bg-gradient-to-l from-indigo-500/10 to-transparent pointer-events-none" />

          <div>
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-400 mb-1">
              <span className={`w-2 h-2 rounded-full ${currentUser ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
              {currentUser ? `Sesi Aktif · ${currentUser.email}` : 'Mode Tamu · Silakan Login via Telegram'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {currentUser ? (
                <>Selamat Datang Kembali, <span className="bg-gradient-to-r from-indigo-400 via-violet-400 to-pink-400 bg-clip-text text-transparent">{currentUser.name}</span> 👋</>
              ) : (
                <>Status: <span className="text-amber-400">Mode Tamu (Guest)</span> 🔒</>
              )}
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              {new Date().toLocaleDateString('id-ID', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}{' '}
              — {currentUser ? 'Kelola habit, tugas, dan jurnal harian kamu secara terpadu.' : 'Gunakan perintah /login di bot Telegram untuk masuk ke akun Anda.'}
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto flex-wrap">
            <button
              onClick={() => setIsAddHabitModalOpen(true)}
              className="px-3.5 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-1.5"
            >
              <span>🎯 + Habit Baru</span>
            </button>

            {currentUser ? (
              <button
                onClick={handleLogout}
                title="Keluar dari Sesi"
                className="px-3 py-1.5 rounded-full bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-xs font-medium text-rose-400 transition-all flex items-center gap-1"
              >
                <span>🚪 Logout ({currentUser.name})</span>
              </button>
            ) : (
              <a
                href="https://t.me/LifeOSBot"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all flex items-center gap-1.5 animate-bounce"
              >
                <span>🔑 Magic Login (/login)</span>
              </a>
            )}

            {telegramStatus.isLinked ? (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-xs font-medium text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span>🤖 Telegram Linked ({telegramStatus.telegramLink?.telegramUsername ? `@${telegramStatus.telegramLink.telegramUsername}` : 'Connected'})</span>
              </div>
            ) : (
              <button
                onClick={handleOpenLinkModal}
                className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all flex items-center gap-1.5"
              >
                <span>✈️ Hubungkan Telegram</span>
              </button>
            )}
          </div>
        </header>

        {/* SECTION 1: STATS CARDS GRID */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="glass-card glass-card-hover p-6 rounded-2xl border border-slate-800/80 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Task Selesai (DB Live)
              </span>
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{completedTasksCount}</span>
              <span className="text-sm font-semibold text-slate-400">/ {totalTasksCount} task</span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-400 mb-1 font-medium">
                <span>Pencapaian Target</span>
                <span className="text-indigo-400 font-bold">{taskCompletionRate}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-violet-500 rounded-full transition-all duration-500"
                  style={{ width: `${taskCompletionRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl border border-slate-800/80 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Habit Selesai (DB Live)
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{completedHabitsCount}</span>
              <span className="text-sm font-semibold text-slate-400">/ {totalHabitsCount} habit</span>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-slate-400 mb-1 font-medium">
                <span>Rasio Check-in Hari Ini</span>
                <span className="text-emerald-400 font-bold">{habitCompletionRate}%</span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full transition-all duration-500"
                  style={{ width: `${habitCompletionRate}%` }}
                />
              </div>
            </div>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl border border-slate-800/80 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Mood & Energi (DB Live)
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{dailyLog ? `${dailyLog.mood}.0` : '4.8'}</span>
              <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                {dailyLog ? getMoodLabel(dailyLog.mood) : 'Sangat Baik 😊'}
              </span>
            </div>
            <p className="text-slate-400 text-xs mt-3">
              Tingkat Energi Fisik: <strong className="text-amber-400">{dailyLog ? `${dailyLog.energy}/5` : '4/5'}</strong>
            </p>
          </div>

          <div className="glass-card glass-card-hover p-6 rounded-2xl border border-slate-800/80 relative overflow-hidden group">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Overall Focus Score
              </span>
              <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 group-hover:scale-110 transition-transform">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-black text-white">{analytics ? `${analytics.focusScore}%` : '80%'}</span>
              <span className="text-xs font-medium text-indigo-400">Live Calculated</span>
            </div>
            <p className="text-slate-400 text-xs mt-3">
              Kombinasi 50% Habit + 50% Task Completion.
            </p>
          </div>
        </section>

        {/* ANALYTICS & HABIT STREAK INSIGHTS SECTION */}
        {analytics && analytics.habitStreaks && analytics.habitStreaks.length > 0 && (
          <section className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800/80 shadow-2xl">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-800">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <span>🔥</span> Analitik Streak Habit (Telegram Bot `/streak`)
                </h2>
                <p className="text-slate-400 text-xs mt-0.5">Penghitungan hari beruntun (Streak) secara konsisten dari database PostgreSQL</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
              {analytics.habitStreaks.map((streakItem) => (
                <div
                  key={streakItem.habitId}
                  className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-2"
                >
                  <span className="text-xs font-semibold text-white line-clamp-1">{streakItem.habitName}</span>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      🔥 {streakItem.currentStreak} Hari
                    </span>
                    <span className={`text-xs font-semibold ${streakItem.isDoneToday ? 'text-emerald-400' : 'text-slate-500'}`}>
                      {streakItem.isDoneToday ? '✅ Done' : '⬜ Pending'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* SECTION 2: DAILY JOURNAL & MOOD LOG WIDGET */}
        <section className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800/80 shadow-2xl">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
            <div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>📖</span> Daily Log & Jurnal Harian (Bisa diisi via Telegram `/log`)
              </h2>
              <p className="text-slate-400 text-sm mt-0.5">
                Catat refleksi mood, energi fisik, dan jurnal singkat kamu hari ini.
              </p>
            </div>

            {logSaveSuccess && (
              <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 animate-pulse">
                ✓ Jurnal Berhasil Disimpan!
              </span>
            )}
          </div>

          <form onSubmit={handleSaveDailyLog} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  1. Suasana Hati (Mood): <span className="text-indigo-400">{getMoodLabel(selectedMood)}</span>
                </label>
                <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                  {[
                    { val: 1, icon: '😭' },
                    { val: 2, icon: '🙁' },
                    { val: 3, icon: '😐' },
                    { val: 4, icon: '🙂' },
                    { val: 5, icon: '😊' },
                  ].map((m) => (
                    <button
                      key={m.val}
                      type="button"
                      onClick={() => setSelectedMood(m.val)}
                      className={`flex-1 py-2.5 rounded-lg text-lg transition-all ${
                        selectedMood === m.val
                          ? 'bg-indigo-600 shadow-lg scale-110 text-white'
                          : 'hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {m.icon}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                  2. Tingkat Energi Fisik: <span className="text-amber-400">{selectedEnergy}/5</span>
                </label>
                <div className="flex items-center justify-between bg-slate-900/80 p-2 rounded-xl border border-slate-800">
                  {[
                    { val: 1, icon: '🪫 1' },
                    { val: 2, icon: '🔋 2' },
                    { val: 3, icon: '⚡ 3' },
                    { val: 4, icon: '⚡⚡ 4' },
                    { val: 5, icon: '⚡⚡⚡ 5' },
                  ].map((e) => (
                    <button
                      key={e.val}
                      type="button"
                      onClick={() => setSelectedEnergy(e.val)}
                      className={`flex-1 py-2.5 rounded-lg text-xs font-bold transition-all ${
                        selectedEnergy === e.val
                          ? 'bg-amber-500/20 border border-amber-500/40 text-amber-400 scale-105'
                          : 'hover:bg-slate-800 text-slate-400'
                      }`}
                    >
                      {e.icon}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                3. Catatan Refleksi & Jurnal Hari Ini
              </label>
              <textarea
                rows={3}
                placeholder="Apa hal terbaik yang kamu selesaikan hari ini? Tulis catatan refleksi kamu di sini..."
                value={journalText}
                onChange={(e) => setJournalText(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all resize-none"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSavingLog}
                className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold text-xs rounded-xl shadow-lg shadow-indigo-500/25 transition-all disabled:opacity-50"
              >
                {isSavingLog ? 'Menyimpan Log...' : '💾 Simpan Jurnal & Mood Hari Ini'}
              </button>
            </div>
          </form>
        </section>

        {/* SECTION 3: GRID LAYOUT (HABITS & TASKS) */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <section className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800/80 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>🎯</span> Habit Harian
                  </h2>
                  <p className="text-slate-400 text-xs mt-0.5">Check-in habit dari web atau Telegram (`/habits`)</p>
                </div>

                <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-medium">
                  <button
                    onClick={() => setHabitTab('all')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      habitTab === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Semua ({habits.length})
                  </button>
                  <button
                    onClick={() => setHabitTab('pending')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      habitTab === 'pending' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Belum ({habits.filter((h) => !h.isDoneToday).length})
                  </button>
                  <button
                    onClick={() => setHabitTab('completed')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      habitTab === 'completed' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Selesai ({completedHabitsCount})
                  </button>
                </div>
              </div>

              {isLoading && (
                <div className="py-12 text-center text-slate-400 text-sm">Memuat data habit...</div>
              )}

              {!isLoading && (
                <div className="space-y-3">
                  {filteredHabits.map((habit) => (
                    <div
                      key={habit.id}
                      onClick={() => toggleHabit(habit.id)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer group ${
                        habit.isDoneToday
                          ? 'bg-slate-900/40 border-slate-800/60 opacity-80'
                          : 'bg-slate-900/80 border-slate-700/60 hover:border-indigo-500/40 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                            habit.isDoneToday
                              ? 'bg-emerald-500 text-slate-950 scale-105'
                              : 'border-2 border-slate-600 bg-slate-800/50'
                          }`}
                        >
                          {habit.isDoneToday && (
                            <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span
                          className={`text-sm font-semibold ${
                            habit.isDoneToday ? 'line-through text-slate-400 font-normal' : 'text-white'
                          }`}
                        >
                          {habit.name}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-slate-400">
                          {habit.frequency || 'DAILY'}
                        </span>
                        <button
                          onClick={(e) => handleDeleteHabit(habit.id, e)}
                          title="Hapus Habit"
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded transition-all"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}

                  {filteredHabits.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-xs">Tidak ada habit pada filter ini.</div>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="glass-card p-6 sm:p-8 rounded-2xl border border-slate-800/80 shadow-2xl flex flex-col justify-between">
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <span>📋</span> Task Management
                  </h2>
                  <p className="text-slate-400 text-xs mt-0.5">Kelola tugas harian atau buat via Telegram (`/task &lt;judul&gt;`)</p>
                </div>

                <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-800 text-xs font-medium">
                  <button
                    onClick={() => setTaskTab('all')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      taskTab === 'all' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Semua ({tasks.length})
                  </button>
                  <button
                    onClick={() => setTaskTab('todo')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      taskTab === 'todo' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    To Do ({tasks.filter((t) => t.status !== 'DONE').length})
                  </button>
                  <button
                    onClick={() => setTaskTab('done')}
                    className={`px-2.5 py-1 rounded-lg transition-all ${
                      taskTab === 'done' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Selesai ({completedTasksCount})
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddNewTask} className="flex items-center gap-2 mb-4">
                <input
                  type="text"
                  placeholder="Ketik task baru dan tekan Enter..."
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  className="flex-1 bg-slate-900/90 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                />
                <select
                  value={newTaskPriority}
                  onChange={(e) => setNewTaskPriority(e.target.value as any)}
                  className="bg-slate-900/90 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-medium"
                >
                  <option value="MEDIUM">🟡 Medium</option>
                  <option value="URGENT">🔴 Urgent</option>
                  <option value="HIGH">🟠 High</option>
                  <option value="LOW">⚪ Low</option>
                </select>
                <button
                  type="submit"
                  disabled={isAddingTask || !newTaskTitle.trim()}
                  className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-xl transition-all disabled:opacity-50"
                >
                  + Tambah
                </button>
              </form>

              {isLoading && (
                <div className="py-12 text-center text-slate-400 text-sm">Memuat data task...</div>
              )}

              {!isLoading && (
                <div className="space-y-3">
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      onClick={() => toggleTaskStatus(task.id, task.status)}
                      className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer group ${
                        task.status === 'DONE'
                          ? 'bg-slate-900/40 border-slate-800/60 opacity-80'
                          : 'bg-slate-900/80 border-slate-700/60 hover:border-indigo-500/40 shadow-sm'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center transition-all ${
                            task.status === 'DONE'
                              ? 'bg-emerald-500 text-slate-950 scale-105'
                              : 'border-2 border-slate-600 bg-slate-800/50'
                          }`}
                        >
                          {task.status === 'DONE' && (
                            <svg className="w-3.5 h-3.5 stroke-[3]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                            </svg>
                          )}
                        </div>
                        <span
                          className={`text-sm font-semibold ${
                            task.status === 'DONE' ? 'line-through text-slate-400 font-normal' : 'text-white'
                          }`}
                        >
                          {task.title}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {getPriorityBadge(task.priority)}
                        <button
                          onClick={(e) => handleDeleteTask(task.id, e)}
                          title="Hapus Task"
                          className="opacity-0 group-hover:opacity-100 p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded transition-all"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  ))}

                  {filteredTasks.length === 0 && (
                    <div className="text-center py-8 text-slate-500 text-xs">Tidak ada task pada filter ini.</div>
                  )}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* MODAL TAMBAH HABIT BARU */}
        {isAddHabitModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-card p-6 sm:p-8 rounded-2xl max-w-md w-full border border-slate-700 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setIsAddHabitModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto text-2xl">
                  🎯
                </div>
                <h3 className="text-xl font-bold text-white">Tambah Habit Baru</h3>
                <p className="text-slate-400 text-xs">
                  Buat kebiasaan harian baru yang akan dipantau di web dan bot Telegram.
                </p>
              </div>

              <form onSubmit={handleCreateHabitSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                    Nama Habit
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Olahraga 30 Menit, Belajar Next.js"
                    value={newHabitName}
                    onChange={(e) => setNewHabitName(e.target.value)}
                    className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-all"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Frekuensi
                    </label>
                    <select
                      value={newHabitFrequency}
                      onChange={(e) => setNewHabitFrequency(e.target.value as any)}
                      className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-medium"
                    >
                      <option value="DAILY">Harian (Daily)</option>
                      <option value="WEEKLY">Mingguan (Weekly)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold uppercase tracking-wider text-slate-300">
                      Warna Tema
                    </label>
                    <select
                      value={newHabitColor}
                      onChange={(e) => setNewHabitColor(e.target.value)}
                      className="w-full bg-slate-900/90 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 font-medium"
                    >
                      <option value="indigo">🟣 Indigo</option>
                      <option value="emerald">🟢 Emerald</option>
                      <option value="amber">🟠 Amber</option>
                      <option value="rose">🔴 Rose</option>
                      <option value="cyan">🔵 Cyan</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isCreatingHabit || !newHabitName.trim()}
                  className="w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold text-center rounded-xl shadow-lg shadow-indigo-500/25 transition-all text-xs disabled:opacity-50"
                >
                  {isCreatingHabit ? 'Membuat Habit...' : '🚀 Buat Habit Sekarang'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* TELEGRAM LINKING MODAL */}
        {isLinkModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center p-4">
            <div className="glass-card p-6 sm:p-8 rounded-2xl max-w-md w-full border border-slate-700 shadow-2xl relative space-y-5 animate-in fade-in zoom-in-95 duration-200">
              <button
                onClick={() => setIsLinkModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                ✕
              </button>

              <div className="text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 flex items-center justify-center mx-auto text-2xl">
                  ✈️
                </div>
                <h3 className="text-xl font-bold text-white">Hubungkan Bot Telegram</h3>
                <p className="text-slate-400 text-xs">
                  Buka Telegram dan klik tombol di bawah untuk mengizinkan bot menyinkronkan habits & tasks kamu.
                </p>
              </div>

              {isGeneratingToken && (
                <div className="py-8 text-center text-slate-400 text-xs animate-pulse">
                  Mengekstrak One-Time Token (5 Menit)...
                </div>
              )}

              {linkTokenData && !isGeneratingToken && (
                <div className="space-y-4">
                  <div className="p-3 bg-slate-900/90 rounded-xl border border-slate-800 text-center space-y-1">
                    <span className="text-[10px] uppercase font-semibold text-slate-500 tracking-wider">One-Time Token</span>
                    <p className="font-mono text-lg font-bold text-indigo-400">{linkTokenData.token}</p>
                    <p className="text-[10px] text-amber-400">⏳ Berlaku selama 5 menit</p>
                  </div>

                  <a
                    href={linkTokenData.telegramUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full py-3 px-4 bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-semibold text-center rounded-xl shadow-lg shadow-indigo-500/25 transition-all text-xs"
                  >
                    🚀 Buka Bot Telegram di Aplikasi
                  </a>

                  <p className="text-slate-500 text-[11px] text-center">
                    Modal ini akan otomatis tertutup begitu akun Telegram kamu berhasil terhubung!
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <footer className="text-center text-xs text-slate-500 py-4">
          Life OS Platform — Full CRUD Habit, Task, Journaling & Persistent Telegram Magic Login Live
        </footer>
      </div>
    </div>
  );
}
