import { Context } from 'telegraf';
import { prisma } from '../server';
import { getTodayDate } from './habitController';

export interface AnalyticsSummary {
  userId: string;
  userName: string;
  habitsDoneToday: number;
  totalHabitsToday: number;
  habitCompletionRate: number;
  tasksDoneToday: number;
  totalTasksToday: number;
  taskCompletionRate: number;
  todayMood: number | null;
  todayEnergy: number | null;
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

/**
 * Helper to resolve user ID
 */
async function resolveUserId(telegramChatId?: bigint | null): Promise<{ userId: string; userName: string }> {
  if (telegramChatId) {
    const telegramLink = await prisma.telegramLink.findUnique({
      where: { telegramChatId },
      include: { user: true },
    });
    if (telegramLink && telegramLink.user) {
      return { userId: telegramLink.userId, userName: telegramLink.user.name };
    }
  }

  const firstUser = await prisma.user.findFirst();
  if (firstUser) {
    return { userId: firstUser.id, userName: firstUser.name };
  }

  const defaultUser = await prisma.user.create({
    data: {
      email: 'default_user@lifeos.internal',
      name: 'Alex (Default User)',
    },
  });
  return { userId: defaultUser.id, userName: defaultUser.name };
}

/**
 * Helper to calculate habit consecutive streak days up to today
 */
async function calculateHabitStreak(habitId: string): Promise<number> {
  const logs = await prisma.habitLog.findMany({
    where: { habitId, status: 'DONE' },
    orderBy: { date: 'desc' },
  });

  if (logs.length === 0) return 0;

  const today = getTodayDate();
  let streak = 0;
  let checkDate = new Date(today);

  // Check if checked in today
  const hasTodayLog = logs.some((l) => l.date.getTime() === checkDate.getTime());

  if (!hasTodayLog) {
    // If not checked in today, check if checked in yesterday to maintain streak
    checkDate.setUTCDate(checkDate.getUTCDate() - 1);
    const hasYesterdayLog = logs.some((l) => l.date.getTime() === checkDate.getTime());
    if (!hasYesterdayLog) {
      return 0; // Streak broken
    }
  }

  // Count backwards consecutive days
  const logDatesSet = new Set(logs.map((l) => l.date.getTime()));
  let d = new Date(checkDate);

  while (logDatesSet.has(d.getTime())) {
    streak++;
    d.setUTCDate(d.getUTCDate() - 1);
  }

  return streak;
}

/**
 * 1. Mengambil ringkasan statistik & analitik lengkap pengguna
 */
export async function getAnalyticsSummary(telegramChatId?: bigint | null): Promise<AnalyticsSummary> {
  const { userId, userName } = await resolveUserId(telegramChatId);
  const today = getTodayDate();

  // Fetch active habits & today's habit logs
  const habits = await prisma.habit.findMany({
    where: { userId, isArchived: false },
    orderBy: { sortOrder: 'asc' },
  });

  const habitIds = habits.map((h) => h.id);
  const todayHabitLogs = await prisma.habitLog.findMany({
    where: { habitId: { in: habitIds }, date: today, status: 'DONE' },
  });

  const doneHabitSet = new Set(todayHabitLogs.map((l) => l.habitId));
  const habitsDoneToday = doneHabitSet.size;
  const totalHabitsToday = habits.length;
  const habitCompletionRate = totalHabitsToday > 0 ? Math.round((habitsDoneToday / totalHabitsToday) * 100) : 0;

  // Calculate streak for each habit
  const habitStreaks = await Promise.all(
    habits.map(async (habit) => {
      const streak = await calculateHabitStreak(habit.id);
      return {
        habitId: habit.id,
        habitName: habit.name,
        currentStreak: streak,
        isDoneToday: doneHabitSet.has(habit.id),
      };
    })
  );

  // Fetch tasks
  const tasks = await prisma.task.findMany({
    where: { userId, status: { in: ['TODO', 'IN_PROGRESS', 'DONE'] } },
  });

  const tasksDoneToday = tasks.filter((t) => t.status === 'DONE').length;
  const totalTasksToday = tasks.length;
  const taskCompletionRate = totalTasksToday > 0 ? Math.round((tasksDoneToday / totalTasksToday) * 100) : 0;

  // Fetch today's daily log (mood & energy)
  const todayLog = await prisma.dailyLog.findUnique({
    where: { userId_date: { userId, date: today } },
  });

  // Fetch last 7 days daily logs
  const sevenDaysAgo = new Date(today);
  sevenDaysAgo.setUTCDate(sevenDaysAgo.getUTCDate() - 6);

  const recentLogs = await prisma.dailyLog.findMany({
    where: { userId, date: { gte: sevenDaysAgo } },
    orderBy: { date: 'asc' },
  });

  const recentMoodLogs = recentLogs.map((log) => ({
    date: log.date.toISOString().split('T')[0],
    mood: log.mood,
    energy: log.energy,
  }));

  // Focus score formula: 50% habit completion + 50% task completion
  const focusScore = Math.round(habitCompletionRate * 0.5 + taskCompletionRate * 0.5);

  return {
    userId,
    userName,
    habitsDoneToday,
    totalHabitsToday,
    habitCompletionRate,
    tasksDoneToday,
    totalTasksToday,
    taskCompletionRate,
    todayMood: todayLog?.mood || null,
    todayEnergy: todayLog?.energy || null,
    focusScore,
    habitStreaks,
    recentMoodLogs,
  };
}

/**
 * 2. Telegram Command /today: Ringkasan produktivitas harian
 */
export async function handleTodaySummaryCommand(ctx: Context) {
  try {
    if (!ctx.chat) return;

    const telegramChatId = BigInt(ctx.chat.id);
    const summary = await getAnalyticsSummary(telegramChatId);

    const moodEmoji = summary.todayMood === 5 ? '😊 Sangat Baik' : summary.todayMood === 4 ? '🙂 Baik' : summary.todayMood === 3 ? '😐 Biasa' : summary.todayMood === 2 ? '🙁 Buruk' : summary.todayMood === 1 ? '😭 Buruk' : 'Belum diisi (Ketik /log)';

    const messageText =
      `📊 *Ringkasan Life OS Hari Ini*\n` +
      `📅 *Tanggal:* ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}\n\n` +
      `🎯 *Habit:* ${summary.habitsDoneToday}/${summary.totalHabitsToday} Selesai (${summary.habitCompletionRate}%)\n` +
      `📋 *Task:* ${summary.tasksDoneToday}/${summary.totalTasksToday} Selesai (${summary.taskCompletionRate}%)\n` +
      `😊 *Mood:* ${moodEmoji}\n` +
      `⚡ *Energi:* ${summary.todayEnergy ? `${summary.todayEnergy}/5` : '-'}\n\n` +
      `⭐ *Focus Score:* *${summary.focusScore}%*\n` +
      `_Ketik /habits untuk check-in habit, atau /tasks untuk daftar tugas._`;

    await ctx.reply(messageText, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error handling /today command:', error);
    await ctx.reply('❌ Gagal menyusun ringkasan hari ini.');
  }
}

/**
 * 3. Telegram Command /streak: Menampilkan perincian streak per habit
 */
export async function handleStreakCommand(ctx: Context) {
  try {
    if (!ctx.chat) return;

    const telegramChatId = BigInt(ctx.chat.id);
    const summary = await getAnalyticsSummary(telegramChatId);

    if (summary.habitStreaks.length === 0) {
      await ctx.reply('📋 Kamu belum memiliki habit aktif untuk dihitung streak-nya.');
      return;
    }

    const streakLines = summary.habitStreaks.map((item) => {
      const statusIcon = item.isDoneToday ? '✅' : '⬜';
      return `${statusIcon} *${item.habitName}* — 🔥 *${item.currentStreak} Hari*`;
    });

    const bestStreak = Math.max(...summary.habitStreaks.map((s) => s.currentStreak), 0);

    const messageText =
      `🔥 *Daftar Habit Streak Kamu*\n\n` +
      `${streakLines.join('\n')}\n\n` +
      `🏆 *Rekor Streak Tertinggi:* ${bestStreak} Hari\n` +
      `_Pertahankan konsistensi harian kamu agar streak tidak terputus!_`;

    await ctx.reply(messageText, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error handling /streak command:', error);
    await ctx.reply('❌ Gagal mengambil data streak.');
  }
}
