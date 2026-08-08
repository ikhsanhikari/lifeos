import cron from 'node-cron';
import { Telegraf } from 'telegraf';
import { prisma } from '../server';
import { getTodayDate } from '../controllers/habitController';
import { getAnalyticsSummary } from '../controllers/analyticsController';

/**
 * 1. Morning Reminder (Default 07:00 AM)
 * Send daily habit list, goal-contextual tasks, and deadline alerts to all Telegram linked users.
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

      // Fetch active goals
      const activeGoal = await prisma.goal.findFirst({
        where: { userId, status: 'ACTIVE' },
        include: {
          tasks: { select: { id: true, status: true } },
        },
        orderBy: [{ deadline: 'asc' }, { createdAt: 'desc' }],
      });

      let goalMessage = '';
      if (activeGoal) {
        const total = activeGoal.tasks.length;
        const done = activeGoal.tasks.filter((t: any) => t.status === 'DONE').length;
        const pct = total > 0 ? Math.round((done / total) * 100) : 0;
        goalMessage =
          `🎯 *Fokus Goal Utama:* *${activeGoal.title}*\n` +
          `   Progres: ${done}/${total} task (${pct}%)\n\n`;
      }

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

      // Fetch pending tasks with Goal context
      const pendingTasks = await prisma.task.findMany({
        where: { userId, status: { in: ['TODO', 'IN_PROGRESS'] } },
        include: {
          goal: { select: { title: true } },
        },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        take: 6,
      });

      // Check tasks & goals due today
      const todayDateStr = today.toISOString().split('T')[0];
      const tasksDueToday = pendingTasks.filter((t) => {
        if (!t.dueDate) return false;
        return t.dueDate.toISOString().split('T')[0] === todayDateStr;
      });

      const goalsDueToday = await prisma.goal.findMany({
        where: {
          userId,
          status: 'ACTIVE',
          deadline: { equals: today },
        },
      });

      let deadlineAlertText = '';
      if (tasksDueToday.length > 0 || goalsDueToday.length > 0) {
        deadlineAlertText = `📅 *TENGGAT WAKTU HARI INI (DEADLINE ALERT):*\n`;
        goalsDueToday.forEach((g) => {
          deadlineAlertText += `• 🚨 *[GOAL DEADLINE]* "${g.title}"\n`;
        });
        tasksDueToday.forEach((t) => {
          const goalTag = t.goal ? `[Goal: ${t.goal.title}] ` : '';
          deadlineAlertText += `• ⚠️ *[TASK DEADLINE]* ${goalTag}${t.title}\n`;
        });
        deadlineAlertText += `\n`;
      }

      let habitText = pendingHabits.length > 0
        ? pendingHabits.map((h: any) => `• 🎯 ${h.name}`).join('\n')
        : '• 🎉 Semua habit hari ini sudah selesai!';

      let taskText = pendingTasks.length > 0
        ? pendingTasks
            .map((t: any) => {
              const goalTag = t.goal ? `_[Goal: ${t.goal.title}]_ ` : '';
              const priorityIcon = t.priority === 'URGENT' || t.priority === 'HIGH' ? '🔥 ' : '';
              return `• 📋 ${priorityIcon}${goalTag}${t.title}`;
            })
            .join('\n')
        : '• 🎉 Tidak ada tugas tertunda!';

      const message =
        `☀️ *Selamat Pagi, ${link.user.name}!*\n` +
        `Berikut pengingat arah & produktivitas kamu hari ini:\n\n` +
        `${deadlineAlertText}` +
        `${goalMessage}` +
        `*Habits Hari Ini:* \n${habitText}\n\n` +
        `*Tasks & Sub-Tasks Tertunda:* \n${taskText}\n\n` +
        `_Ketik /focus untuk melihat fokus utama, atau /goals untuk melihat daftar mimpi kamu!_`;

      await bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    console.error('Error in sendMorningReminders:', error);
  }
}

/**
 * 2. Time-Specific Reminder (Hourly Cron Runner)
 * Check habits & tasks scheduled for the current hour and push Telegram alerts.
 */
export async function sendTimeSpecificReminders(bot: Telegraf) {
  console.log('⏰ Running Hourly Time-Specific Reminder Cron Job...');
  try {
    const activeLinks = await prisma.telegramLink.findMany({
      where: { isActive: true },
      include: { user: true },
    });

    const now = new Date();
    const currentHour = now.getHours(); // Local server hour
    const today = getTodayDate();

    for (const link of activeLinks) {
      const chatId = Number(link.telegramChatId);
      const userId = link.userId;

      // Find habits with reminderTime matching current hour
      const habitsWithReminder = await prisma.habit.findMany({
        where: { userId, isArchived: false, reminderTime: { not: null } },
      });

      const todayDoneLogs = await prisma.habitLog.findMany({
        where: {
          habitId: { in: habitsWithReminder.map((h) => h.id) },
          date: today,
          status: 'DONE',
        },
      });
      const doneHabitIds = new Set(todayDoneLogs.map((l) => l.habitId));

      const dueHabits = habitsWithReminder.filter((h) => {
        if (!h.reminderTime || doneHabitIds.has(h.id)) return false;
        const rHour = new Date(h.reminderTime).getHours();
        return rHour === currentHour;
      });

      // Find tasks with dueTime matching current hour
      const tasksWithDueTime = await prisma.task.findMany({
        where: {
          userId,
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueTime: { not: null },
        },
        include: { goal: { select: { title: true } } },
      });

      const dueTasks = tasksWithDueTime.filter((t) => {
        if (!t.dueTime) return false;
        const tHour = new Date(t.dueTime).getHours();
        return tHour === currentHour;
      });

      if (dueHabits.length > 0 || dueTasks.length > 0) {
        let habitSection = '';
        if (dueHabits.length > 0) {
          habitSection = `🎯 *Habits Waktunya Dikerjakan:* \n` +
            dueHabits.map((h) => `• ${h.name}`).join('\n') + `\n\n`;
        }

        let taskSection = '';
        if (dueTasks.length > 0) {
          taskSection = `📋 *Task Waktunya Dikerjakan:* \n` +
            dueTasks.map((t) => {
              const goalTag = t.goal ? `_[Goal: ${t.goal.title}]_ ` : '';
              return `• ${goalTag}${t.title}`;
            }).join('\n') + `\n\n`;
        }

        const message =
          `⏰ *PENGINGAT WAKTU TIBA (${currentHour}:00)* 🔔\n\n` +
          `Halo ${link.user.name}! Waktunya menyelesaikan target kamu sekarang:\n\n` +
          `${habitSection}` +
          `${taskSection}` +
          `_Ketik /habits atau /tasks untuk melakukan check-in!_`;

        await bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
      }
    }
  } catch (error) {
    console.error('Error in sendTimeSpecificReminders:', error);
  }
}

/**
 * 3. Evening Recap (Default 21:00 PM)
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
 * 4. Streak Alert (Default 22:00 PM)
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
      const summary = await getAnalyticsSummary(link.telegramChatId);

      const endangeredStreaks = summary.habitStreaks.filter(
        (s) => !s.isDoneToday && s.currentStreak > 0
      );

      if (endangeredStreaks.length > 0) {
        const chatId = Number(link.telegramChatId);
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

  // Hourly Time-Specific Reminder at top of every hour (:00)
  cron.schedule('0 * * * *', () => {
    sendTimeSpecificReminders(bot);
  });

  // Evening Recap at 21:00 PM (9:00 PM) every day
  cron.schedule('0 21 * * *', () => {
    sendEveningRecapReminders(bot);
  });

  // Streak Alert at 22:00 PM (10:00 PM) every day
  cron.schedule('0 22 * * *', () => {
    sendStreakAlertReminders(bot);
  });

  console.log('✅ Cron Jobs scheduled: Morning (07:00), Hourly Time-Specific (:00), Evening (21:00), Streak Alert (22:00)');
}
