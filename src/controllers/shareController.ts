import { Response } from 'express';
import { prisma } from '../server';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { getAnalyticsSummary } from './analyticsController';
import { getTodayDate } from './habitController';

/**
 * Share Card Data Controller
 * Aggregates rich productivity data for social share card rendering
 */

export interface ShareCardData {
  date: string;
  dateShort: string;
  userName: string;
  habitsCompleted: number;
  habitsTotal: number;
  tasksCompleted: number;
  tasksTotal: number;
  focusScore: number;
  topStreak: { name: string; streak: number } | null;
  mood: number | null;
  energy: number | null;
  achievements: string[];
  highlights: string[];
  completedHabitNames: string[];
  completedTaskTitles: string[];
  journalSnippet: string | null;
  activeGoalsCount: number;
  quote: string;
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

// Curated motivational quotes
const MOTIVATIONAL_QUOTES = [
  'Consistency beats intensity.',
  'Small daily improvements lead to stunning results.',
  'The secret of getting ahead is getting started.',
  'Progress, not perfection.',
  'Discipline is choosing between what you want now and what you want most.',
  'Every expert was once a beginner.',
  'You are what you repeatedly do.',
  'The only bad workout is the one that didn\'t happen.',
  'Focus on the process, and the results will follow.',
  'One day or day one. You decide.',
];

function getRandomQuote(): string {
  return MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)];
}

function computeAchievements(data: {
  habitsCompleted: number;
  habitsTotal: number;
  tasksCompleted: number;
  tasksTotal: number;
  focusScore: number;
  topStreakDays: number;
}): string[] {
  const badges: string[] = [];

  if (data.habitsTotal > 0 && data.habitsCompleted === data.habitsTotal) {
    badges.push('🎯 Perfect Habits');
  }

  if (data.tasksTotal > 0 && data.tasksCompleted === data.tasksTotal) {
    badges.push('✅ All Tasks Done');
  }

  if (data.focusScore >= 90) {
    badges.push('⭐ Focus Master');
  } else if (data.focusScore >= 75) {
    badges.push('💪 Highly Focused');
  }

  if (data.topStreakDays >= 30) {
    badges.push('🏆 30-Day Legend');
  } else if (data.topStreakDays >= 14) {
    badges.push('🔥 14-Day Warrior');
  } else if (data.topStreakDays >= 7) {
    badges.push('🌟 7-Day Streak');
  }

  if (data.habitsCompleted > 0 && data.tasksCompleted > 0) {
    badges.push('🚀 Productive Day');
  }

  return badges;
}

/**
 * GET /api/share/daily-card
 * Returns structured data for rendering a social share card
 */
export async function getShareCardData(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const userId = req.user.id;
    const chatId = req.user.telegramChatId ? BigInt(req.user.telegramChatId) : null;
    const today = getTodayDate();

    // Get analytics summary
    const analytics = await getAnalyticsSummary(chatId);

    // Get today's completed habit names
    const habits = await prisma.habit.findMany({
      where: { userId, isArchived: false },
    });
    const habitIds = habits.map((h: any) => h.id);

    const todayHabitLogs = await prisma.habitLog.findMany({
      where: { habitId: { in: habitIds }, date: today, status: 'DONE' },
    });

    const doneHabitIds = new Set(todayHabitLogs.map((l: any) => l.habitId));
    const completedHabitNames = habits
      .filter((h: any) => doneHabitIds.has(h.id))
      .map((h: any) => h.name);

    // Get today's completed task titles
    const completedTasks = await prisma.task.findMany({
      where: { userId, status: 'DONE' },
      take: 5,
      orderBy: { completedAt: 'desc' },
    });
    const completedTaskTitles = completedTasks.map((t: any) => t.title);

    // Count active goals
    const activeGoalsCount = await prisma.goal.count({
      where: { userId, status: 'ACTIVE' },
    });

    // Get today's daily log for highlights & journal snippet
    const dailyLog = await prisma.dailyLog.findUnique({
      where: { userId_date: { userId, date: today } },
    });

    // Find top streak
    let topStreak: { name: string; streak: number } | null = null;
    if (analytics.habitStreaks.length > 0) {
      const best = analytics.habitStreaks.reduce((max, s) =>
        s.currentStreak > max.currentStreak ? s : max
      );
      if (best.currentStreak > 0) {
        topStreak = { name: best.habitName, streak: best.currentStreak };
      }
    }

    // Parse highlights from daily log
    let highlights: string[] = [];
    let journalSnippet: string | null = null;
    if (dailyLog) {
      if ((dailyLog as any).highlights) {
        try {
          const raw = (dailyLog as any).highlights;
          highlights = Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : []);
        } catch {
          highlights = [];
        }
      }
      if (dailyLog.journal) {
        journalSnippet = dailyLog.journal.length > 120
          ? dailyLog.journal.substring(0, 120) + '...'
          : dailyLog.journal;
      }
    }

    // Compute achievements
    const achievements = computeAchievements({
      habitsCompleted: analytics.habitsDoneToday,
      habitsTotal: analytics.totalHabitsToday,
      tasksCompleted: analytics.tasksDoneToday,
      tasksTotal: analytics.totalTasksToday,
      focusScore: analytics.focusScore,
      topStreakDays: topStreak?.streak || 0,
    });

    // Format date in Indonesian
    const dateFormatted = new Date().toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const dateShort = new Date().toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });

    const cardData: ShareCardData = {
      date: dateFormatted,
      dateShort,
      userName: analytics.userName,
      habitsCompleted: analytics.habitsDoneToday,
      habitsTotal: analytics.totalHabitsToday,
      tasksCompleted: analytics.tasksDoneToday,
      tasksTotal: analytics.totalTasksToday,
      focusScore: analytics.focusScore,
      topStreak,
      mood: analytics.todayMood,
      energy: analytics.todayEnergy,
      achievements,
      highlights,
      completedHabitNames,
      completedTaskTitles,
      journalSnippet,
      activeGoalsCount,
      quote: getRandomQuote(),
      habitStreaks: analytics.habitStreaks,
      recentMoodLogs: analytics.recentMoodLogs,
    };

    res.json({ success: true, data: cardData });
  } catch (error: any) {
    console.error('Error fetching share card data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
