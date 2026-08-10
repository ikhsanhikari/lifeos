import { Response } from 'express';
import { prisma, bot } from '../server';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { getAnalyticsSummary } from './analyticsController';
import { getTodayDate } from './habitController';

/**
 * Share Card Data Controller
 * Aggregates rich productivity data for social share card rendering and Telegram delivery
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
 * Internal helper to aggregate user productivity data
 */
export async function fetchCardDataInternal(userId: string): Promise<ShareCardData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { telegramLink: true },
  });

  if (!user) return null;

  const chatId = user.telegramLink?.telegramChatId ? BigInt(user.telegramLink.telegramChatId) : null;
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
    .slice(0, 5)
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

  return {
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

    const cardData = await fetchCardDataInternal(req.user.id);
    if (!cardData) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({ success: true, data: cardData });
  } catch (error: any) {
    console.error('Error fetching share card data:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}

/**
 * POST /api/share/send-telegram
 * Sends the user's selected Share Card PNG directly to their linked Telegram Chat
 */
export async function sendShareCardToTelegram(req: AuthenticatedRequest, res: Response) {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const userId = req.user.id;
    const { format = 'story', theme = 'strava', slide = 0, bgImage, customImageBase64 } = req.body;

    // Check if user has linked Telegram account
    const tgLink = await prisma.telegramLink.findUnique({
      where: { userId },
    });

    if (!tgLink || !tgLink.isActive) {
      res.status(400).json({
        success: false,
        message: 'Akun Telegram kamu belum terhubung. Klik "Hubungkan Telegram" di Sidebar terlebih dahulu!',
      });
      return;
    }

    // Get share card data
    const cardData = await fetchCardDataInternal(userId);
    if (!cardData) {
      res.status(500).json({ success: false, message: 'Gagal mengambil data produktivitas.' });
      return;
    }

    let imageBuffer: Buffer;

    if (customImageBase64 && typeof customImageBase64 === 'string') {
      const base64Data = customImageBase64.replace(/^data:image\/\w+;base64,/, '');
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      // Next.js OG endpoint URL
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3011';
      let ogUrl = `${frontendUrl}/og/daily-card?format=${format}&slide=${slide}&theme=${theme}&data=${encodeURIComponent(JSON.stringify(cardData))}`;
      if (bgImage && typeof bgImage === 'string' && bgImage.startsWith('http') && bgImage.length < 500) {
        ogUrl += `&bgImage=${encodeURIComponent(bgImage)}`;
      }

      // Fetch image as Buffer
      const imgRes = await fetch(ogUrl);
      if (!imgRes.ok) {
        throw new Error(`Gagal me-render gambar kartu (HTTP ${imgRes.status})`);
      }
      const arrayBuf = await imgRes.arrayBuffer();
      imageBuffer = Buffer.from(arrayBuf);
    }

    // Telegram Caption
    const streakText = cardData.topStreak ? `🔥 *Top Streak:* ${cardData.topStreak.name} (${cardData.topStreak.streak} Hari)\n` : '';
    const caption =
      `✨ *DAILY PERFORMANCE FLEX* — ${cardData.dateShort}\n\n` +
      `👤 *User:* ${cardData.userName}\n` +
      `⭐ *Focus Score:* ${cardData.focusScore}%\n` +
      `🎯 *Habits Done:* ${cardData.habitsCompleted}/${cardData.habitsTotal}\n` +
      `✅ *Tasks Done:* ${cardData.tasksCompleted}/${cardData.tasksTotal}\n` +
      streakText +
      `\n⚡ _Dikirim via Web Dashboard Life OS_`;

    const chatIdStr = tgLink.telegramChatId.toString();
    try {
      await bot.telegram.sendPhoto(chatIdStr, { source: imageBuffer }, { caption, parse_mode: 'Markdown' });
    } catch (photoErr: any) {
      console.warn('sendPhoto failed, falling back to sendDocument:', photoErr.message);
      await bot.telegram.sendDocument(
        chatIdStr,
        { source: imageBuffer, filename: `lifeos-story-${Date.now()}.jpg` },
        { caption, parse_mode: 'Markdown' }
      );
    }

    res.json({
      success: true,
      message: 'Kartu pencapaian berhasil dikirim ke Telegram kamu! ✈️',
    });
  } catch (error: any) {
    console.error('Error sending share card to Telegram:', error);
    res.status(500).json({ success: false, error: error.message });
  }
}
