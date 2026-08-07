import cron from 'node-cron';
import { Telegraf } from 'telegraf';
import { prisma } from '../server';
import { getTodayDate } from '../controllers/habitController';
import { getAnalyticsSummary } from '../controllers/analyticsController';

/**
 * 1. Morning Reminder (Default 07:00 AM)
 * Send daily habit list & tasks due today to all active Telegram linked users.
 */
export async function sendMorningReminders(bot: Telegraf) {
  console.log('⏰ Running Morning Reminder Cron Job...');
  try {
    const activeLinks = await prisma.telegramLink.findMany({
      where: { isActive: true },
      include: { user: true },
    });

    const today = getTodayDate();

    for (const link of activeLinks) {
      const chatId = Number(link.telegramChatId);
      const userId = link.userId;

      // Fetch pending habits for today
      const habits = await prisma.habit.findMany({
        where: { userId, isArchived: false },
      });

      const todayLogs = await prisma.habitLog.findMany({
        where: {
          habitId: { in: habits.map((h: any) => h.id) },
          date: today,
          status: 'DONE',
        },
      });

      const doneHabitSet = new Set(todayLogs.map((l: any) => l.habitId));
      const pendingHabits = habits.filter((h: any) => !doneHabitSet.has(h.id));

      // Fetch pending tasks
      const pendingTasks = await prisma.task.findMany({
        where: { userId, status: { in: ['TODO', 'IN_PROGRESS'] } },
        take: 5,
      });

      let habitText = pendingHabits.length > 0
        ? pendingHabits.map((h: any) => `• 🎯 ${h.name}`).join('\n')
        : '• 🎉 Semua habit hari ini sudah selesai!';

      let taskText = pendingTasks.length > 0
        ? pendingTasks.map((t: any) => `• 📋 ${t.title}`).join('\n')
        : '• 🎉 Tidak ada tugas tertunda!';

      const message =
        `☀️ *Selamat Pagi, ${link.user.name}!*\n` +
        `Berikut pengingat produktivitas kamu hari ini:\n\n` +
        `*Habits Hari Ini:* \n${habitText}\n\n` +
        `*Tasks Tertunda:* \n${taskText}\n\n` +
        `_Ketik /habits untuk check-in habit, atau /tasks untuk kelola tugas!_`;

      await bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    console.error('Error in sendMorningReminders:', error);
  }
}

/**
 * 2. Evening Recap (Default 21:00 PM)
 * Prompt user to submit Daily Log & Mood journal if not filled today.
 */
export async function sendEveningRecapReminders(bot: Telegraf) {
  console.log('⏰ Running Evening Recap Cron Job...');
  try {
    const activeLinks = await prisma.telegramLink.findMany({
      where: { isActive: true },
      include: { user: true },
    });

    const today = getTodayDate();

    for (const link of activeLinks) {
      const chatId = Number(link.telegramChatId);
      const userId = link.userId;

      const todayLog = await prisma.dailyLog.findUnique({
        where: { userId_date: { userId, date: today } },
      });

      if (!todayLog) {
        const message =
          `🌙 *Selamat Malam, ${link.user.name}!*\n\n` +
          `Kamu belum mengisi *Daily Journal & Mood Log* untuk hari ini.\n` +
          `Yuk refleksikan hari kamu sejenak! 📖\n\n` +
          `*Ketik /log sekarang untuk mencatat mood & energi kamu!*`;

        await bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      }
    }
  } catch (error) {
    console.error('Error in sendEveningRecapReminders:', error);
  }
}

/**
 * 3. Streak Alert (Default 22:00 PM)
 * Warning alert for habits with active streak > 0 that are still unchecked today.
 */
export async function sendStreakAlertReminders(bot: Telegraf) {
  console.log('⏰ Running Streak Alert Cron Job...');
  try {
    const activeLinks = await prisma.telegramLink.findMany({
      where: { isActive: true },
      include: { user: true },
    });

    for (const link of activeLinks) {
      const chatId = Number(link.telegramChatId);
      const summary = await getAnalyticsSummary(link.telegramChatId);

      const endangeredStreaks = summary.habitStreaks.filter(
        (s) => !s.isDoneToday && s.currentStreak > 0
      );

      if (endangeredStreaks.length > 0) {
        const streakText = endangeredStreaks
          .map((s) => `• ⚠️ *${s.habitName}* — 🔥 *${s.currentStreak} Hari*`)
          .join('\n');

        const message =
          `🚨 *Peringatan Habit Streak Night Alert!*\n\n` +
          `Habit berikut berisiko terputus streak-nya malam ini jika tidak di-checkin:\n\n` +
          `${streakText}\n\n` +
          `Jangan biarkan konsistensi kamu sia-sia! Ketik /habits untuk check-in sekarang. 🔥`;

        await bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      }
    }
  } catch (error) {
    console.error('Error in sendStreakAlertReminders:', error);
  }
}

/**
 * Initialize all Cron Job schedules
 */
export function initCronScheduler(bot: Telegraf) {
  console.log('⚙️ Initializing Cron Scheduler Service...');

  // Morning Reminder at 07:00 AM every day
  cron.schedule('0 7 * * *', () => {
    sendMorningReminders(bot);
  });

  // Evening Recap at 21:00 PM (9:00 PM) every day
  cron.schedule('0 21 * * *', () => {
    sendEveningRecapReminders(bot);
  });

  // Streak Alert at 22:00 PM (10:00 PM) every day
  cron.schedule('0 22 * * *', () => {
    sendStreakAlertReminders(bot);
  });

  console.log('✅ Cron Jobs scheduled: Morning (07:00), Evening (21:00), Streak Alert (22:00)');
}
