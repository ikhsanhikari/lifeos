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
