'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Sidebar } from '../dashboard/components/Sidebar';
import { TopBar } from '../dashboard/components/TopBar';
import { LoadingSkeleton } from '../dashboard/components/LoadingSkeleton';
import { GoalData } from '../dashboard/components/GoalPanel';
import { AddGoalModal } from '../dashboard/components/modals/AddGoalModal';
import { AddHabitModal } from '../dashboard/components/modals/AddHabitModal';
import { BulkImportHabitModal } from '../dashboard/components/modals/BulkImportHabitModal';
import { EditGoalModal } from '../dashboard/components/modals/EditGoalModal';
import { EditHabitModal } from '../dashboard/components/modals/EditHabitModal';
import { EditTaskModal } from '../dashboard/components/modals/EditTaskModal';
import { TelegramLinkModal } from '../dashboard/components/modals/TelegramLinkModal';
import { AiGoalBreakdownModal } from '../dashboard/components/modals/AiGoalBreakdownModal';
import { AiSummaryModal, WeeklySummaryData } from '../dashboard/components/modals/AiSummaryModal';
import { ShareCardModal } from '../dashboard/components/modals/ShareCardModal';
import { ReminderSettingsModal, UserSettingsData } from '../dashboard/components/modals/ReminderSettingsModal';
import {
  AiStatusData,
  HabitData,
  TaskData,
  DailyLogData,
  AnalyticsSummaryData,
  TelegramStatusData,
  UserAuthData,
} from '../types';
import { useTelegram } from './TelegramProvider';

export type {
  AiStatusData,
  HabitData,
  TaskData,
  DailyLogData,
  AnalyticsSummaryData,
  TelegramStatusData,
  UserAuthData,
  GoalData,
  UserSettingsData,
};

interface DashboardContextType {
  currentUser: UserAuthData | null;
  goals: GoalData[];
  habits: HabitData[];
  tasks: TaskData[];
  dailyLog: DailyLogData | null;
  analytics: AnalyticsSummaryData | null;
  telegramStatus: TelegramStatusData;
  aiStatus: AiStatusData | null;
  userSettings: UserSettingsData | null;
  isLoading: boolean;
  error: string | null;

  theme: 'dark' | 'light';
  toggleTheme: () => void;

  shareCardData: any;
  isShareLoading: boolean;
  fetchShareCardData: () => Promise<void>;

  fetchData: () => Promise<void>;
  handleDeleteGoal: (goalId: string, e: React.MouseEvent) => Promise<void>;
  handleCreateGoalSubmit: (title: string, description: string, deadline: string, color: string) => Promise<void>;
  handleAddTaskToGoal: (goalId: string, taskTitle: string) => Promise<void>;
  handleDeleteHabit: (habitId: string, e: React.MouseEvent) => Promise<void>;
  handleCreateHabitSubmit: (name: string, frequency: 'DAILY' | 'WEEKLY', color: string, reminderTime?: string) => Promise<void>;
  handleBulkImportHabits: (items: any[]) => Promise<void>;
  isBulkImportModalOpen: boolean;
  setIsBulkImportModalOpen: (open: boolean) => void;
  handleReorderHabits: (orderedIds: string[]) => Promise<void>;
  toggleHabit: (id: string) => Promise<void>;
  toggleTaskStatus: (taskId: string, currentStatus: string) => Promise<void>;
  handleDeleteTask: (taskId: string, e: React.MouseEvent) => Promise<void>;
  handleAddNewTask: (title: string, priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW', dueDate?: string, dueTime?: string) => Promise<void>;
  handleSaveDailyLog: (mood: number, energy: number, journal: string) => Promise<void>;
  handleFetchDailyCoachInsight: (journal: string, mood: number, energy: number) => Promise<{ insight: string; pattern: string; recommendation: string } | null>;
  handleOpenAiBreakdownModal: (goal: GoalData) => void;
  handleFetchAiBreakdown: (goalTitle: string, goalDescription?: string) => Promise<{ tasks: Array<{ title: string; priority: string }>; advice: string } | null>;
  handleAcceptAiTasks: (goalId: string, tasksToAdd: Array<{ title: string; priority: string }>) => Promise<void>;
  handleFetchWeeklySummary: () => Promise<WeeklySummaryData | null>;
  handleOpenShareModal: () => void;
  handleSaveSettings: (updated: Partial<UserSettingsData>) => Promise<boolean>;
  handleLogout: () => void;
  handleOpenLinkModal: () => Promise<void>;

  setIsAddGoalModalOpen: (open: boolean) => void;
  setIsAddHabitModalOpen: (open: boolean) => void;
  setIsAiSummaryModalOpen: (open: boolean) => void;
  setIsSettingsModalOpen: (open: boolean) => void;

  handleOpenEditGoalModal: (goal: GoalData) => void;
  handleOpenEditHabitModal: (habit: HabitData) => void;
  handleOpenEditTaskModal: (task: TaskData) => void;
  handleUpdateGoalSubmit: (goalId: string, updated: { title: string; description: string; deadline: string; status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'ABANDONED'; color: string }) => Promise<void>;
  handleUpdateHabitSubmit: (habitId: string, updated: { name: string; description?: string; frequency: 'DAILY' | 'WEEKLY'; color: string; reminderTime?: string }) => Promise<void>;
  handleUpdateTaskSubmit: (taskId: string, updated: { title: string; priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'; status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'; goalId?: string | null; dueDate?: string | null; dueTime?: string | null }) => Promise<void>;
}

const DashboardContext = createContext<DashboardContextType | null>(null);

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardShell');
  }
  return context;
};

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export function DashboardShell({ children }: { children: React.ReactNode }) {
  const { isTelegram, tgUser, haptic, authStatus } = useTelegram();

  const [currentUser, setCurrentUser] = useState<UserAuthData | null>(null);
  const [goals, setGoals] = useState<GoalData[]>([]);
  const [habits, setHabits] = useState<HabitData[]>([]);
  const [tasks, setTasks] = useState<TaskData[]>([]);
  const [dailyLog, setDailyLog] = useState<DailyLogData | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsSummaryData | null>(null);
  const [telegramStatus, setTelegramStatus] = useState<TelegramStatusData>({ isLinked: false });
  const [aiStatus, setAiStatus] = useState<AiStatusData | null>(null);
  const [userSettings, setUserSettings] = useState<UserSettingsData | null>(null);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lifeos_theme') as 'dark' | 'light' | null;
      if (saved === 'light' || saved === 'dark') {
        setTheme(saved);
        document.documentElement.classList.toggle('light', saved === 'light');
      }
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      if (typeof window !== 'undefined') {
        localStorage.setItem('lifeos_theme', next);
        document.documentElement.classList.toggle('light', next === 'light');
      }
      return next;
    });
  }, []);

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isAddGoalModalOpen, setIsAddGoalModalOpen] = useState<boolean>(false);
  const [isAddHabitModalOpen, setIsAddHabitModalOpen] = useState<boolean>(false);
  const [isBulkImportModalOpen, setIsBulkImportModalOpen] = useState<boolean>(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState<boolean>(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState<boolean>(false);
  const [linkTokenData, setLinkTokenData] = useState<{ token: string; telegramUrl: string; expiresAt: number } | null>(null);
  const [isGeneratingToken, setIsGeneratingToken] = useState<boolean>(false);

  // Edit Modals state
  const [editingGoal, setEditingGoal] = useState<GoalData | null>(null);
  const [editingHabit, setEditingHabit] = useState<HabitData | null>(null);
  const [editingTask, setEditingTask] = useState<TaskData | null>(null);

  // AI Modals state
  const [isAiBreakdownModalOpen, setIsAiBreakdownModalOpen] = useState<boolean>(false);
  const [selectedAiGoal, setSelectedAiGoal] = useState<GoalData | null>(null);
  const [isAiSummaryModalOpen, setIsAiSummaryModalOpen] = useState<boolean>(false);

  // Share modal state & pre-fetched background data
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [shareCardData, setShareCardData] = useState<any>(null);
  const [isShareLoading, setIsShareLoading] = useState<boolean>(false);

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('lifeos_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const fetchShareCardData = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/share/daily-card`, {
        headers: getAuthHeaders(),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setShareCardData(json.data);
        setIsShareLoading(false);

        if (typeof window !== 'undefined') {
          const minimalData = {
            date: json.data.date,
            dateShort: json.data.dateShort,
            userName: json.data.userName,
            habitsCompleted: json.data.habitsCompleted || 0,
            habitsTotal: json.data.habitsTotal || 0,
            tasksCompleted: json.data.tasksCompleted || 0,
            tasksTotal: json.data.tasksTotal || 0,
            focusScore: json.data.focusScore || 0,
            topStreak: json.data.topStreak ? { name: json.data.topStreak.name, streak: json.data.topStreak.streak } : null,
            mood: json.data.mood,
            energy: json.data.energy,
            achievements: Array.isArray(json.data.achievements) ? json.data.achievements.slice(0, 4) : [],
            highlights: Array.isArray(json.data.highlights) ? json.data.highlights.slice(0, 2) : [],
            completedHabitNames: Array.isArray(json.data.completedHabitNames) ? json.data.completedHabitNames.slice(0, 5) : [],
            completedTaskTitles: Array.isArray(json.data.completedTaskTitles) ? json.data.completedTaskTitles.slice(0, 5) : [],
            journalSnippet: json.data.journalSnippet ? String(json.data.journalSnippet).substring(0, 100) : null,
            activeGoalsCount: json.data.activeGoalsCount || 0,
            quote: json.data.quote || '',
          };
          const encData = encodeURIComponent(JSON.stringify(minimalData));
          const defaultUrl = `/og/daily-card?format=square&theme=strava&data=${encData}`;
          const img = new window.Image();
          img.src = defaultUrl;
        }
      }
    } catch (err) {
      console.error('Error prefetching share card data:', err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const headers = getAuthHeaders();
      const token = typeof window !== 'undefined' ? localStorage.getItem('lifeos_token') : null;
      if (token) {
        try {
          const meRes = await fetch(`${API_BASE_URL}/api/auth/me`, { headers });
          const meJson = await meRes.json();
          if (meJson.success && meJson.user) {
            setCurrentUser(meJson.user);
          }
        } catch (e) { }
      }

      const [goalsRes, habitsRes, tasksRes, logRes, analyticsRes, tgRes, aiRes, settingsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/goals`, { headers }),
        fetch(`${API_BASE_URL}/api/habits`, { headers }),
        fetch(`${API_BASE_URL}/api/tasks`, { headers }),
        fetch(`${API_BASE_URL}/api/daily-logs/today`, { headers }),
        fetch(`${API_BASE_URL}/api/analytics/summary`, { headers }),
        fetch(`${API_BASE_URL}/api/telegram/status`, { headers }),
        fetch(`${API_BASE_URL}/api/ai/status`, { headers }),
        fetch(`${API_BASE_URL}/api/settings`, { headers }),
      ]);

      if (!habitsRes.ok || !tasksRes.ok) {
        throw new Error('Gagal terhubung ke backend API server');
      }

      const [goalsJson, habitsJson, tasksJson, logJson, analyticsJson, tgJson, aiJson, settingsJson] = await Promise.all([
        goalsRes.json(),
        habitsRes.json(),
        tasksRes.json(),
        logRes.json(),
        analyticsRes.json(),
        tgRes.json(),
        aiRes.json(),
        settingsRes.json(),
      ]);

      if (goalsJson.success && Array.isArray(goalsJson.goals)) setGoals(goalsJson.goals);
      if (habitsJson.success && Array.isArray(habitsJson.habits)) setHabits(habitsJson.habits);
      if (tasksJson.success && Array.isArray(tasksJson.tasks)) setTasks(tasksJson.tasks);
      if (logJson.success && logJson.dailyLog) setDailyLog(logJson.dailyLog);
      if (analyticsJson.success && analyticsJson.summary) setAnalytics(analyticsJson.summary);
      if (tgJson.success) setTelegramStatus({ isLinked: tgJson.isLinked, telegramLink: tgJson.telegramLink });
      if (aiJson.success) setAiStatus(aiJson);
      if (settingsJson.success && settingsJson.data) setUserSettings(settingsJson.data);
    } catch (err: any) {
      console.error('Error fetching dashboard data:', err);
      setError(err.message || 'Koneksi ke backend API gagal.');
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        fetchShareCardData();
      }, 2500);
    }
  }, [fetchShareCardData]);

  useEffect(() => {
    fetchData();
  }, [fetchData, authStatus]);

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
        } catch (e) { }
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
        } catch (e) { }
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
        } catch (e) { }
        return json.data;
      } else {
        throw new Error(json.message || 'Gagal memuat insight.');
      }
    } catch (err: any) {
      console.error('Error fetching daily coach insight:', err);
      throw err;
    }
  };

  const handleOpenShareModal = () => {
    setIsShareModalOpen(true);
    if (!shareCardData) {
      setIsShareLoading(true);
      fetchShareCardData();
    }
  };

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

  const handleCreateGoalSubmit = async (title: string, description: string, deadline: string, color: string) => {
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

  const handleDeleteGoal = async (goalId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Apakah Anda yakin ingin menghapus goal ini? Seluruh task di bawahnya akan kehilangan asosiasi goal.')) return;
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

  const handleAddTaskToGoal = async (goalId: string, taskTitle: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ title: taskTitle, priority: 'MEDIUM', goalId }),
      });
      const json = await res.json();
      if (json.success) {
        fetchData();
      }
    } catch (err) {
      console.error('Error adding task to goal:', err);
    }
  };

  const handleCreateHabitSubmit = async (name: string, frequency: 'DAILY' | 'WEEKLY', color: string, reminderTime?: string) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/habits`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ name, frequency, color, reminderTime }),
      });
      const json = await res.json();
      if (json.success && json.habit) {
        fetchData();
      }
    } catch (err) {
      console.error('Error creating habit:', err);
    }
  };

  const handleBulkImportHabits = async (items: any[]) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/habits/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ habitItems: items }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || 'Gagal mengimpor habit');
      }
      await fetchData();
    } catch (err: any) {
      console.error('Error bulk importing habits:', err);
      throw err;
    }
  };

  const handleParseHabitsWithAi = async (rawText: string) => {
    const res = await fetch(`${API_BASE_URL}/api/ai/parse-habits`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ rawText }),
    });
    const json = await res.json();
    if (!res.ok || !json.success) {
      throw new Error(json.message || 'Gagal memproses AI Smart Parsing');
    }
    return json.habits || [];
  };

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
      } catch (err) { }
    }, 3000);
    return () => clearInterval(interval);
  }, [isLinkModalOpen]);

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

  const handleReorderHabits = async (orderedIds: string[]) => {
    setHabits((prev) => {
      const map = new Map(prev.map((h) => [h.id, h]));
      const next: HabitData[] = [];
      orderedIds.forEach((id) => {
        const item = map.get(id);
        if (item) next.push(item);
      });
      prev.forEach((h) => {
        if (!orderedIds.includes(h.id)) next.push(h);
      });
      return next;
    });

    try {
      await fetch(`${API_BASE_URL}/api/habits/reorder`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ orderedIds }),
      });
    } catch (err) {
      console.error('Error reordering habits:', err);
      fetchData();
    }
  };

  const toggleHabit = async (id: string) => {
    haptic.success();
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

  const toggleTaskStatus = async (taskId: string, currentStatus: string) => {
    haptic.success();
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
        setTasks((prev) => prev.map((t) => (t.id === taskId ? json.task : t)));
        fetchData();
      }
    } catch (err) {
      console.error('Error updating task status:', err);
    }
  };

  const handleAddNewTask = async (
    title: string,
    priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW',
    dueDate?: string,
    dueTime?: string
  ) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ title, priority, dueDate, dueTime }),
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

  const handleSaveSettings = async (updated: Partial<UserSettingsData>): Promise<boolean> => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(updated),
      });
      const json = await res.json();
      if (json.success && json.data) {
        setUserSettings(json.data);
        return true;
      }
      return false;
    } catch (err) {
      console.error('Error updating user settings:', err);
      return false;
    }
  };

  const handleUpdateGoalSubmit = async (
    goalId: string,
    updated: { title: string; description: string; deadline: string; status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'ABANDONED'; color: string }
  ) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(updated),
      });
      const json = await res.json();
      if (json.success && json.goal) {
        setGoals((prev) => prev.map((g) => (g.id === goalId ? { ...g, ...json.goal } : g)));
        fetchData();
      }
    } catch (err) {
      console.error('Error updating goal:', err);
    }
  };

  const handleUpdateHabitSubmit = async (
    habitId: string,
    updated: { name: string; description?: string; frequency: 'DAILY' | 'WEEKLY'; color: string; reminderTime?: string }
  ) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/habits/${habitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(updated),
      });
      const json = await res.json();
      if (json.success && json.habit) {
        setHabits((prev) => prev.map((h) => (h.id === habitId ? { ...h, ...json.habit } : h)));
        fetchData();
      }
    } catch (err) {
      console.error('Error updating habit:', err);
    }
  };

  const handleUpdateTaskSubmit = async (
    taskId: string,
    updated: { title: string; priority: 'URGENT' | 'HIGH' | 'MEDIUM' | 'LOW'; status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'CANCELLED'; goalId?: string | null; dueDate?: string | null; dueTime?: string | null }
  ) => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(updated),
      });
      const json = await res.json();
      if (json.success && json.task) {
        setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, ...json.task } : t)));
        fetchData();
      }
    } catch (err) {
      console.error('Error updating task:', err);
    }
  };

  return (
    <DashboardContext.Provider
      value={{
        currentUser,
        goals,
        habits,
        tasks,
        dailyLog,
        analytics,
        telegramStatus,
        aiStatus,
        userSettings,
        isLoading,
        error,
        theme,
        toggleTheme,
        shareCardData,
        isShareLoading,
        fetchShareCardData,
        fetchData,
        handleDeleteGoal,
        handleCreateGoalSubmit,
        handleAddTaskToGoal,
        handleDeleteHabit,
        handleCreateHabitSubmit,
        handleBulkImportHabits,
        isBulkImportModalOpen,
        setIsBulkImportModalOpen,
        handleReorderHabits,
        toggleHabit,
        toggleTaskStatus,
        handleDeleteTask,
        handleAddNewTask,
        handleSaveDailyLog,
        handleFetchDailyCoachInsight,
        handleOpenAiBreakdownModal,
        handleFetchAiBreakdown,
        handleAcceptAiTasks,
        handleFetchWeeklySummary,
        handleOpenShareModal,
        handleSaveSettings,
        handleLogout,
        handleOpenLinkModal,
        setIsAddGoalModalOpen,
        setIsAddHabitModalOpen,
        setIsAiSummaryModalOpen,
        setIsSettingsModalOpen,
        handleOpenEditGoalModal: (goal: GoalData) => setEditingGoal(goal),
        handleOpenEditHabitModal: (habit: HabitData) => setEditingHabit(habit),
        handleOpenEditTaskModal: (task: TaskData) => setEditingTask(task),
        handleUpdateGoalSubmit,
        handleUpdateHabitSubmit,
        handleUpdateTaskSubmit,
      }}
    >
      <div className="flex min-h-screen bg-[#09090b]">
        <Sidebar
          currentUser={currentUser}
          telegramStatus={telegramStatus}
          onOpenLinkModal={handleOpenLinkModal}
          onOpenShareModal={handleOpenShareModal}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onLogout={handleLogout}
        />

        <div className="flex-1 flex flex-col min-w-0 pb-20 md:pb-8">
          <main className="flex-1 p-3 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto space-y-3.5 sm:space-y-6">
            {isTelegram && (
              <div className="bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-2.5 px-4 flex items-center justify-between text-xs text-indigo-300 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 relative">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                  </span>
                  <span className="font-semibold text-white">📱 Telegram Mini App Mode</span>
                  <span className="text-indigo-400/80 text-[11px] hidden sm:inline">• Logged in as {tgUser?.first_name || currentUser?.name || 'Telegram User'}</span>
                </div>
                <span className="text-[10px] font-mono bg-indigo-900/50 text-indigo-300 px-2 py-0.5 rounded border border-indigo-700/40">
                  ⚡ Auto-Synced
                </span>
              </div>
            )}

            <TopBar
              currentUser={currentUser}
              onOpenAddGoalModal={() => setIsAddGoalModalOpen(true)}
              onOpenAddHabitModal={() => setIsAddHabitModalOpen(true)}
              onOpenAiSummaryModal={() => setIsAiSummaryModalOpen(true)}
              onOpenShareModal={handleOpenShareModal}
              aiAvailable={aiStatus?.features?.smartSummary ?? aiStatus?.aiAvailable}
            />

            {isLoading ? <LoadingSkeleton /> : children}

            <footer className="text-center text-[11px] text-zinc-400 py-4 border-t border-zinc-800/60 mt-8">
              Life OS Platform — Goal Breakdown, Habit Tracking & Persistent Telegram Bot Sync
            </footer>
          </main>
        </div>

        {/* Global Modals */}
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

        <BulkImportHabitModal
          isOpen={isBulkImportModalOpen}
          onClose={() => setIsBulkImportModalOpen(false)}
          onImportSubmit={handleBulkImportHabits}
          onAiParse={handleParseHabitsWithAi}
          aiAvailable={aiStatus?.features?.smartSummary ?? aiStatus?.aiAvailable}
        />

        <EditGoalModal
          isOpen={!!editingGoal}
          onClose={() => setEditingGoal(null)}
          goal={editingGoal}
          onSubmit={handleUpdateGoalSubmit}
        />

        <EditHabitModal
          isOpen={!!editingHabit}
          onClose={() => setEditingHabit(null)}
          habit={editingHabit}
          onSubmit={handleUpdateHabitSubmit}
        />

        <EditTaskModal
          isOpen={!!editingTask}
          onClose={() => setEditingTask(null)}
          task={editingTask}
          goals={goals}
          onSubmit={handleUpdateTaskSubmit}
        />

        <TelegramLinkModal
          isOpen={isLinkModalOpen}
          onClose={() => setIsLinkModalOpen(false)}
          isGeneratingToken={isGeneratingToken}
          linkTokenData={linkTokenData}
        />

        <ReminderSettingsModal
          isOpen={isSettingsModalOpen}
          onClose={() => setIsSettingsModalOpen(false)}
          settings={userSettings}
          onSaveSettings={handleSaveSettings}
          isTelegramLinked={telegramStatus.isLinked}
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
    </DashboardContext.Provider>
  );
}
