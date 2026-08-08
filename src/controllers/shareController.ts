import { Response } from 'express';
import { prisma } from '../server';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { getAnalyticsSummary } from './analyticsController';

/**
 * Share Card Data Controller
 * Aggregates user productivity data for social share card rendering
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

    // Get analytics summary (reuse existing function)
    const analytics = await getAnalyticsSummary(chatId);

    // Get today's daily log for highlights
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

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
    if (dailyLog && (dailyLog as any).highlights) {
      try {
        const raw = (dailyLog as any).highlights;
        highlights = Array.isArray(raw) ? raw : (typeof raw === 'string' ? JSON.parse(raw) : []);
      } catch {
        highlights = [];
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
