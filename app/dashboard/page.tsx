'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { StatsGrid } from './components/StatsGrid';
import { HabitPanel } from './components/HabitPanel';
import { TaskPanel } from './components/TaskPanel';
import { DailyJournal } from './components/DailyJournal';
import { StreakInsights } from './components/StreakInsights';
import { LoadingSkeleton } from './components/LoadingSkeleton';
import { GoalPanel, GoalData } from './components/GoalPanel';
import { AddGoalModal } from './components/modals/AddGoalModal';
import { AddHabitModal } from './components/modals/AddHabitModal';
import { TelegramLinkModal } from './components/modals/TelegramLinkModal';
import { AiGoalBreakdownModal } from './components/modals/AiGoalBreakdownModal';
import { AiSummaryModal, WeeklySummaryData } from './components/modals/AiSummaryModal';
import { ShareCardModal } from './components/modals/ShareCardModal';

export interface AiStatusData {
  aiAvailable: boolean;
  features: {
    goalBreakdown: boolean;
    dailyCoach: boolean;
    smartSummary: boolean;
  };
  quota: {
    used: number;
    limit: number;
    remaining: number;
  };
}

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
  goalId?: string | null;
  goal?: { id: string; title: string } | null;
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
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [habits, setHabits] = useState<HabitData[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [dailyLog, setDailyLog] = useState<DailyLogData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummaryData | null>(null);
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatusData>({ isLinked: false });
  const [aiStatus, setAiStatus] = useState<AiStatusData | null>(null);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Navigation section state
  const [activeSection, setActiveSection] = useState<string>('dashboard');
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  // Modals state
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState<boolean>(false);
  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState<boolean>(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState<boolean>(false);
  const [linkTokenData, setLinkTokenData] = useState<{ token: string; telegramUrl: string; expiresAt: number } | null>(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState<boolean>(false);

  // AI Modals state
  const [isAiBreakdownModalOpen, setIsAiBreakdownModalOpen] = useState<boolean>(false);
  const [selectedAiGoal, setSelectedAiGoal] = useState<GoalData | null>(null);
  const [isAiSummaryModalOpen, setIsAiSummaryModalOpen] = useState<boolean>(false);

  // Share modal state & pre-fetched background data
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareCardData, setShareCardData] = useState<any>(null);
  const [isShareLoading, setIsShareLoading] = useState<boolean>(false);

  // Section references for smooth scrolling
  const goalsRef = useRef<HTMLDivElement>(null);
  const habitsRef = useRef<HTMLDivElement>(null);
  const tasksRef = useRef<HTMLDivElement>(null);
  const journalRef = useRef<HTMLDivElement>(null);
  const streaksRef = useRef<HTMLDivElement>(null);

  // Helper for Authorization Headers
  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('lifeos_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Lightweight pre-fetch share card data in background (0 impact on dashboard load speed)
  const fetchShareCardData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/share/daily-card`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setShareCardData(json.data);
        setIsShareLoading(false);

        // Pre-load ONLY 1 default square preview image lazily in background
        if (typeof window !== 'undefined') {
          const encData = encodeURIComponent(JSON.stringify(json.data));
          const defaultUrl = `/og/daily-card?format=square&theme=strava&data=${encData}`;
          const img = new window.Image();
          img.src = defaultUrl;
        }
      }
    } catch (err) {
      console.error('Error prefetching share card data:', err);
    }
  }, []);

  // Fetch goals, habits, tasks, daily logs, analytics, telegram status, and AI status from Backend API
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

      const [goalsRes, habitsRes, tasksRes, logRes, analyticsRes, tgRes, aiRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/goals`, { headers }),
        fetch(`${API_BASE_URL}/api/habits`, { headers }),
        fetch(`${API_BASE_URL}/api/tasks`, { headers }),
        fetch(`${API_BASE_URL}/api/daily-logs/today`, { headers }),
        fetch(`${API_BASE_URL}/api/analytics/summary`, { headers }),
        fetch(`${API_BASE_URL}/api/telegram/status`, { headers }),
        fetch(`${API_BASE_URL}/api/ai/status`, { headers }),
      ]);

      if (!habitsRes.ok || !tasksRes.ok) {
        throw new Error('Gagal terhubung ke backend API server');
      }

      const [goalsJson, habitsJson, tasksJson, logJson, analyticsJson, tgJson, aiJson] = await Promise.all([
        goalsRes.json(),
        habitsRes.json(),
        tasksRes.json(),
        logRes.json(),
        analyticsRes.json(),
        tgRes.json(),
        aiRes.json(),
      ]);

      if (goalsJson.success && Array.isArray(goalsJson.goals)) {
        setGoals(goalsJson.goals);
      }

      if (habitsJson.success && Array.isArray(habitsJson.habits)) {
        setHabits(habitsJson.habits);
      }

      if (tasksJson.success && Array.isArray(tasksJson.tasks)) {
        setTasks(tasksJson.tasks);
      }

      if (logJson.success && logJson.dailyLog) {
        setDailyLog(logJson.dailyLog);
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

      if (aiJson.success) {
        setAiStatus(aiJson);
      }
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Koneksi ke backend API (http://localhost:3000) gagal.');
    } finally {
      setIsLoading(false);
      // Trigger share data fetch lazily 2.5s AFTER dashboard has loaded
      setTimeout(() => {
        fetchShareCardData();
      }, 2500);
    }
  }, [fetchShareCardData]);

  const handleOpenAiBreakdownModal = (goal: GoalData) => {
    setSelectedAiGoal(goal);
    setIsAiBreakdownModalOpen(true);
  };

  const handleFetchAiBreakdown = async (
    goalTitle: string,
    goalDescription?: string
  ): Promise<{ tasks: Array<{ title: string; priority: string }>; advice: string } | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/goal-breakdown`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ goalTitle, goalDescription }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        try {
          const stRes = await fetch(`${API_BASE_URL}/api/ai/status`, { headers: getAuthHeaders() });
          const stJson = await stRes.json();
          if (stJson.success) setAiStatus(stJson);
        } catch (e) {}

        return { tasks: json.data.tasks, advice: json.data.advice };
      } else {
        throw new Error(json.message || 'Gagal membuat breakdown.');
      }
    } catch (err: any) {
      console.error('Error fetching AI breakdown:', err);
      throw err;
    }
  };

  const handleAcceptAiTasks = async (
    goalId: string,
    tasksToAdd: Array<{ title: string; priority: string }>
  ) => {
    for (const t of tasksToAdd) {
      await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ title: t.title, priority: t.priority, goalId }),
      });
    }
    await fetchData();
  };

  const handleFetchWeeklySummary = async (): Promise<WeeklySummaryData | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/weekly-summary`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success && json.data) {
        try {
          const stRes = await fetch(`${API_BASE_URL}/api/ai/status`, { headers: getAuthHeaders() });
          const stJson = await stRes.json();
          if (stJson.success) setAiStatus(stJson);
        } catch (e) {}
        return json.data;
      } else {
        throw new Error(json.message || 'Gagal memuat summary.');
      }
    } catch (err: any) {
      console.error('Error fetching weekly summary:', err);
      throw err;
    }
  };

  const handleFetchDailyCoachInsight = async (
    journal: string,
    mood: number,
    energy: number
  ): Promise<{ insight: string; pattern: string; recommendation: string } | null> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/ai/daily-coach`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ journal, mood, energy }),
      });
      const json = await res.json();
      if (json.success && json.data) {
        try {
          const stRes = await fetch(`${API_BASE_URL}/api/ai/status`, { headers: getAuthHeaders() });
          const stJson = await stRes.json();
          if (stJson.success) setAiStatus(stJson);
        } catch (e) {}
        return json.data;
      } else {
        throw new Error(json.message || 'Gagal memuat insight.');
      }
    } catch (err: any) {
      console.error('Error fetching daily coach insight:', err);
      throw err;
    }
  };

  // Instant opening of Share Modal with pre-loaded background data
  const handleOpenShareModal = () => {
    setIsShareModalOpen(true);
    if (!shareCardData) {
      setIsShareLoading(true);
      fetchShareCardData();
    }
  };

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle section scrolling on sidebar navigation click
  const handleSelectSection = (section: string) => {
    setActiveSection(section);
    if (section === 'goals' && goalsRef.current) {
      goalsRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'habits' && habitsRef.current) {
      habitsRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'tasks' && tasksRef.current) {
      tasksRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'journal' && journalRef.current) {
      journalRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'streaks' && streaksRef.current) {
      streaksRef.current.scrollIntoView({ behavior: 'smooth' });
    } else if (section === 'dashboard') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Handle Logout
  const handleLogout = () => {
    localStorage.removeItem('lifeos_token');
    document.cookie = 'lifeos_token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;';
    setCurrentUser(null);
    setGoals([]);
    setHabits([]);
    setTasks([]);
    setDailyLog(null);
    setAnalytics(null);
    setTelegramStatus({ isLinked: false, telegramLink: null });
  };

  // Create Goal
  const handleCreateGoalSubmit = async (
    title: string,
    description: string,
    deadline: string,
    color: string
  ) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/goals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ title, description, deadline: deadline || undefined, color }),
      });
      const json = await res.json();
      if (json.success && json.goal) {
        fetchData();
      }
    } catch (err) {
      console.error('Error creating goal:', err);
    }
  };

  // Delete Goal
  const handleDeleteGoal = async (goalId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Apakah Anda yakin ingin menghapus goal ini?')) return;

    setGoals((prev) => prev.filter((g) => g.id !== goalId));
    try {
      await fetch(`${API_BASE_URL}/api/goals/${goalId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      fetchData();
    } catch (err) {
      console.error('Error deleting goal:', err);
    }
  };

  // Add Task to Goal
  const handleAddTaskToGoal = async (goalId: string, taskTitle: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ title: taskTitle, goalId }),
      });
      const json = await res.json();
      if (json.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Error adding task to goal:', err);
    }
  };

  // Create Habit
  const handleCreateHabitSubmit = async (
    name: string,
    frequency: 'DAILY' | 'WEEKLY',
    color: string
  ) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name, frequency, color }),
      });

      const json = await res.json();
      if (json.success && json.habit) {
        fetchData();
      }
    } catch (err) {
      console.error('Error creating habit:', err);
    }
  };

  // Delete Habit
  const handleDeleteHabit = async (habitId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Apakah Anda yakin ingin menghapus habit ini?')) return;

    setHabits((prev) => prev.filter((h) => h.id !== habitId));
    try {
      await fetch(`${API_BASE_URL}/api/habits/${habitId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
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
      await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
      });
      fetchData();
    } catch (err) {
      console.error('Error deleting task:', err);
    }
  };

  // Save Daily Log
  const handleSaveDailyLog = async (mood: number, energy: number, journal: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/daily-logs`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ mood, energy, journal }),
      });

      const json = await res.json();
      if (json.success && json.dailyLog) {
        setDailyLog(json.dailyLog);
        fetchData();
      }
    } catch (err) {
      console.error('Error saving daily log:', err);
    }
  };

  // Poll Telegram status while link modal is open
  useEffect(() => {
    if (!isLinkModalOpen) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/telegram/status`, {
          headers: getAuthHeaders(),
        });
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
        setTasks((prev) => (prev.map((t) => (t.id === taskId ? json.task : t))));
        fetchData();
      }
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  // Create New Task
  const handleAddNewTask = async (
    title: string,
    priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'
  ) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ title, priority }),
      });

      const json = await res.json();
      if (json.success && json.task) {
        setTasks((prev) => [json.task, ...prev]);
        fetchData();
      }
    } catch (err) {
      console.error('Error creating task:', err);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#09090b]">
      {/* Sidebar Component */}
      <Sidebar
        currentUser={currentUser}
        telegramStatus={telegramStatus}
        activeSection={activeSection}
        setActiveSection={handleSelectSection}
        onOpenLinkModal={handleOpenLinkModal}
        onOpenShareModal={handleOpenShareModal}
        onLogout={handleLogout}
        isMobileOpen={isMobileOpen}
        setIsMobileOpen={setIsMobileOpen}
      />

      {/* Main Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-6">
          {/* Top Header Bar */}
          <TopBar
            currentUser={currentUser}
            onOpenAddGoalModal={() => setIsAddGoalModalOpen(true)}
            onOpenAddHabitModal={() => setIsAddHabitModalOpen(true)}
            onOpenAiSummaryModal={() => setIsAiSummaryModalOpen(true)}
            onOpenShareModal={handleOpenShareModal}
            aiAvailable={aiStatus?.features?.smartSummary ?? aiStatus?.aiAvailable}
          />

          {isLoading ? (
            <LoadingSkeleton />
          ) : (
            <>
              {/* Stats Overview Grid */}
              <StatsGrid
                habits={habits}
                tasks={tasks}
                dailyLog={dailyLog}
                analytics={analytics}
                onOpenShareModal={handleOpenShareModal}
              />

              {/* Goal Breakdown Section */}
              <div ref={goalsRef}>
                <GoalPanel
                  goals={goals}
                  onDeleteGoal={handleDeleteGoal}
                  onOpenAddModal={() => setIsAddGoalModalOpen(true)}
                  onAddTaskToGoal={handleAddTaskToGoal}
                  onOpenAiBreakdown={handleOpenAiBreakdownModal}
                  aiAvailable={aiStatus?.features?.goalBreakdown ?? aiStatus?.aiAvailable}
                />
              </div>

              {/* Habit Streaks Insight Section */}
              <div ref={streaksRef}>
                <StreakInsights analytics={analytics} />
              </div>

              {/* Main Interactive Grid (Habit Tracker & Task Management) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div ref={habitsRef}>
                  <HabitPanel
                    habits={habits}
                    onToggleHabit={toggleHabit}
                    onDeleteHabit={handleDeleteHabit}
                    onOpenAddModal={() => setIsAddHabitModalOpen(true)}
                  />
                </div>

                <div ref={tasksRef}>
                  <TaskPanel
                    tasks={tasks}
                    onToggleTask={toggleTaskStatus}
                    onDeleteTask={handleDeleteTask}
                    onAddTask={handleAddNewTask}
                  />
                </div>
              </div>

              {/* Daily Log & Reflection Journal Section */}
              <div ref={journalRef}>
                <DailyJournal
                  dailyLog={dailyLog}
                  onSaveDailyLog={handleSaveDailyLog}
                  onFetchDailyCoachInsight={handleFetchDailyCoachInsight}
                  aiAvailable={aiStatus?.features?.dailyCoach ?? aiStatus?.aiAvailable}
                />
              </div>
            </>
          )}

          <footer className="text-center text-[11px] text-zinc-400 py-4 border-t border-zinc-800/60 mt-8">
            Life OS Platform — Goal Breakdown, Habit Tracking & Persistent Telegram Bot Sync
          </footer>
        </main>
      </div>

      {/* Modals */}
      <AddGoalModal
        isOpen={isAddGoalModalOpen}
        onClose={() => setIsAddGoalModalOpen(false)}
        onSubmit={handleCreateGoalSubmit}
      />

      <AddHabitModal
        isOpen={isAddHabitModalOpen}
        onClose={() => setIsAddHabitModalOpen(false)}
        onSubmit={handleCreateHabitSubmit}
      />

      <TelegramLinkModal
        isOpen={isLinkModalOpen}
        onClose={() => setIsLinkModalOpen(false)}
        isGeneratingToken={isGeneratingToken}
        linkTokenData={linkTokenData}
      />

      {selectedAiGoal && (
        <AiGoalBreakdownModal
          isOpen={isAiBreakdownModalOpen}
          onClose={() => {
            setIsAiBreakdownModalOpen(false);
            setSelectedAiGoal(null);
          }}
          goalId={selectedAiGoal.id}
          goalTitle={selectedAiGoal.title}
          goalDescription={selectedAiGoal.description || undefined}
          onAcceptTasks={handleAcceptAiTasks}
          onFetchBreakdown={handleFetchAiBreakdown}
        />
      )}

      <AiSummaryModal
        isOpen={isAiSummaryModalOpen}
        onClose={() => setIsAiSummaryModalOpen(false)}
        onFetchSummary={handleFetchWeeklySummary}
      />

      <ShareCardModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        cardData={shareCardData}
        isLoading={isShareLoading}
      />
    </div>
  );
}
