import cron from 'node-cron';
import { Telegraf } from 'telegraf';
import { prisma } from '../server';
import { getTodayDate } from '../controllers/habitController';
import { getAnalyticsSummary } from '../controllers/analyticsController';
import { sendPushNotificationToUser } from './pushService';

/**
 * Get current time formatted as "HH:mm" in Asia/Jakarta (WIB) timezone
 */
export function getWibHHMM(): string {
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Jakarta',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).formatToParts(new Date());

  const hour = parts.find((p) => p.type === 'hour')?.value || '00';
  const minute = parts.find((p) => p.type === 'minute')?.value || '00';

  return `${hour}:${minute}`;
}

/**
 * 1. Morning Reminder
 * Send daily habit list, goal-contextual tasks, and deadline alerts to all users via Push (and Telegram if linked).
 */
export async function sendMorningReminders(bot: Telegraf, targetHHMM?: string): Promise<number> {
  let sentCount = 0;
  try {
    const allUsers = await prisma.user.findMany({
      include: {
        settings: true,
        telegramLink: true,
      },
    });

    const today = getTodayDate();

    for (const user of allUsers) {
      const userSettings = user.settings;

      // Skip if user explicitly disabled reminders
      if (userSettings && !userSettings.remindersEnabled) {
        continue;
      }

      // Verify time match if targetHHMM specified
      if (targetHHMM) {
        const userMorningTime = userSettings?.morningReminderTime || '07:00';
        if (userMorningTime !== targetHHMM) {
          continue;
        }
      }

      const userId = user.id;
      const tgLink = user.telegramLink;
      const chatId = tgLink && tgLink.isActive ? Number(tgLink.telegramChatId) : null;

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

      // Fetch pending tasks
      const pendingTasks = await prisma.task.findMany({
        where: { userId, status: { in: ['TODO', 'IN_PROGRESS'] } },
        include: {
          goal: { select: { title: true } },
        },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        take: 6,
      });

      // Telegram format
      if (chatId) {
        let habitText = pendingHabits.length > 0
          ? pendingHabits.map((h: any) => `• 🎯 ${h.name}`).join('\n')
          : '• 🎉 Semua habit hari ini sudah selesai!';

        let taskText = pendingTasks.length > 0
          ? pendingTasks.map((t: any) => `• 📋 ${t.title}`).join('\n')
          : '• 🎉 Tidak ada tugas tertunda!';

        const message =
          `☀️ *Selamat Pagi, ${user.name}!*\n` +
          `Berikut pengingat arah & produktivitas kamu hari ini:\n\n` +
          `${goalMessage}` +
          `*Habits Hari Ini:* \n${habitText}\n\n` +
          `*Tasks Tertunda:* \n${taskText}\n\n`;

        try {
          await bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        } catch (e: any) {
          console.warn(`[CRON] Telegram send failed for chatId ${chatId}:`, e.message);
        }
      }

      // Dispatch Push Notification (Web + Android FCM)
      const pushResult = await sendPushNotificationToUser(userId, {
        title: `☀️ Selamat Pagi, ${user.name}!`,
        body: `Kamu memiliki ${pendingHabits.length} habit & ${pendingTasks.length} task prioritas hari ini.`,
        url: '/dashboard',
        tag: `lifeos-morning-${Date.now()}`,
      });

      if (pushResult > 0 || chatId) sentCount++;
      console.log(`[CRON ${getWibHHMM()} WIB] ☀️ Morning Reminder dispatched to ${user.name} (${userId})`);
    }
  } catch (error: any) {
    console.error(`[CRON ERROR ${getWibHHMM()} WIB] Morning Reminder failed:`, error.message || error);
  }
  return sentCount;
}

/**
 * 2. Time-Specific Reminder (Hourly/Windowed Cron Runner)
 * Check habits & tasks scheduled for current time window and push alerts.
 */
export async function sendTimeSpecificReminders(bot: Telegraf, targetHHMM?: string): Promise<number> {
  let sentCount = 0;
  try {
    const allUsers = await prisma.user.findMany({
      include: {
        settings: true,
        telegramLink: true,
      },
    });

    const nowHHMM = targetHHMM || getWibHHMM();
    const [currentHourStr, currentMinStr] = nowHHMM.split(':');
    const currentHour = parseInt(currentHourStr, 10);
    const currentMin = parseInt(currentMinStr, 10);
    const today = getTodayDate();

    for (const user of allUsers) {
      const userSettings = user.settings;

      if (userSettings && (!userSettings.remindersEnabled || !userSettings.hourlyRemindersEnabled)) {
        continue;
      }

      const userId = user.id;
      const tgLink = user.telegramLink;
      const chatId = tgLink && tgLink.isActive ? Number(tgLink.telegramChatId) : null;

      // Find habits matching current hour & minute window
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
        const rDate = new Date(h.reminderTime);
        const rHour = rDate.getUTCHours();
        const rMin = rDate.getUTCMinutes();

        if (rHour !== currentHour) return false;
        if (currentMin === 0) return rMin === 0 || rMin > 50;
        return rMin > currentMin - 10 && rMin <= currentMin;
      });

      // Find tasks matching current hour & minute window
      const tasksWithDueTime = await prisma.task.findMany({
        where: {
          userId,
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueTime: { not: null },
        },
      });

      const dueTasks = tasksWithDueTime.filter((t) => {
        if (!t.dueTime) return false;
        const tDate = new Date(t.dueTime);
        const tHour = tDate.getUTCHours();
        const tMin = tDate.getUTCMinutes();

        if (tHour !== currentHour) return false;
        if (currentMin === 0) return tMin === 0 || tMin > 50;
        return tMin > currentMin - 10 && tMin <= currentMin;
      });

      const formattedTimeHeader = `${currentHourStr}:${currentMinStr}`;

      // 1. Send per-habit individual reminders (1-by-1)
      for (const habit of dueHabits) {
        if (chatId) {
          const habitMessage =
            `⏰ *PENGINGAT HABIT (${formattedTimeHeader})* 🎯\n\n` +
            `Halo ${user.name}, waktunya mengerjakan habit:\n` +
            `📌 *${habit.name}*\n` +
            `🔥 *Streak saat ini:* ${(habit as any).streak || 0} Hari\n\n` +
            `Pilih tindakan di bawah untuk mencatat check-in:`;

          const keyboard = {
            reply_markup: {
              inline_keyboard: [
                [
                  { text: '✅ Selesai', callback_data: `habit_done:${habit.id}` },
                  { text: '⏭️ Skip', callback_data: `habit_skip_prompt:${habit.id}` },
                ],
              ],
            },
          };

          try {
            await bot.telegram.sendMessage(chatId, habitMessage, {
              parse_mode: 'Markdown',
              ...keyboard,
            });
          } catch (e: any) {
            console.warn(`[CRON] Telegram send failed for chatId ${chatId}:`, e.message);
          }
        }

        // Dispatch Unified Push (Web + Android FCM)
        await sendPushNotificationToUser(userId, {
          title: `🎯 ${habit.name} (${formattedTimeHeader})`,
          body: `Waktunya habit ${habit.name}! 🔥 Streak: ${(habit as any).streak || 0} Hari.`,
          url: '/habits',
          tag: `lifeos-habit-${habit.id}-${Date.now()}`,
          habitId: habit.id,
          actions: [
            { action: 'done', title: '✅ Selesai' },
            { action: 'skip', title: '⏭️ Skip' },
          ],
        });

        sentCount++;
        console.log(`[CRON ${getWibHHMM()} WIB] 🎯 Habit Reminder (${habit.name}) sent to ${user.name} (${userId})`);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // 2. Send due tasks reminder
      if (dueTasks.length > 0) {
        if (chatId) {
          const taskSection = dueTasks.map((t) => `• ${t.title}`).join('\n');
          const taskMessage =
            `⏰ *PENGINGAT TASK (${formattedTimeHeader})* 🔔\n\n` +
            `Halo ${user.name}! Waktunya menyelesaikan tugas kamu:\n\n` +
            `${taskSection}\n\n`;

          try {
            await bot.telegram.sendMessage(chatId, taskMessage, { parse_mode: 'Markdown' });
          } catch (e: any) {
            console.warn(`[CRON] Telegram send failed for chatId ${chatId}:`, e.message);
          }
        }

        await sendPushNotificationToUser(userId, {
          title: `📋 Waktunya Task Kamu (${formattedTimeHeader})`,
          body: `Task: ${dueTasks[0]?.title}`,
          url: '/tasks',
          tag: `lifeos-tasks-${formattedTimeHeader}-${Date.now()}`,
        });

        sentCount++;
        console.log(`[CRON ${getWibHHMM()} WIB] 📋 Task Reminder (${formattedTimeHeader}) sent to ${user.name} (${userId})`);
      }
    }
  } catch (error: any) {
    console.error(`[CRON ERROR ${getWibHHMM()} WIB] Hourly Time-Specific Reminder failed:`, error.message || error);
  }
  return sentCount;
}

/**
 * 3. Evening Recap
 */
export async function sendEveningRecapReminders(bot: Telegraf, targetHHMM?: string): Promise<number> {
  let sentCount = 0;
  try {
    const allUsers = await prisma.user.findMany({
      include: { settings: true, telegramLink: true },
    });

    const today = getTodayDate();

    for (const user of allUsers) {
      const userSettings = user.settings;

      if (userSettings && !userSettings.remindersEnabled) continue;

      if (targetHHMM) {
        const userEveningTime = userSettings?.eveningRecapTime || '21:00';
        if (userEveningTime !== targetHHMM) continue;
      }

      const userId = user.id;
      const tgLink = user.telegramLink;
      const chatId = tgLink && tgLink.isActive ? Number(tgLink.telegramChatId) : null;

      const todayLog = await prisma.dailyLog.findUnique({
        where: { userId_date: { userId, date: today } },
      });

      if (!todayLog) {
        if (chatId) {
          const message =
            `🌙 *Selamat Malam, ${user.name}!*\n\n` +
            `Kamu belum mengisi *Daily Journal & Mood Log* untuk hari ini.\n` +
            `Yuk refleksikan hari kamu sejenak! 📖`;
          try {
            await bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
          } catch (e: any) {}
        }

        await sendPushNotificationToUser(userId, {
          title: `🌙 Daily Journal & Mood Log`,
          body: `Halo ${user.name}, yuk refleksikan hari ini dan isi jurnal harian kamu sejenak.`,
          url: '/dashboard',
          tag: `lifeos-evening-${Date.now()}`,
        });
        sentCount++;
        console.log(`[CRON ${getWibHHMM()} WIB] 🌙 Evening Recap Reminder sent to ${user.name} (${userId})`);
      }
    }
  } catch (error: any) {
    console.error(`[CRON ERROR ${getWibHHMM()} WIB] Evening Recap failed:`, error.message || error);
  }
  return sentCount;
}

/**
 * 4. Streak Alert
 */
export async function sendStreakAlertReminders(bot: Telegraf, targetHHMM?: string): Promise<number> {
  let sentCount = 0;
  try {
    const allUsers = await prisma.user.findMany({
      include: { settings: true, telegramLink: true },
    });

    for (const user of allUsers) {
      const userSettings = user.settings;
      if (userSettings && !userSettings.remindersEnabled) continue;

      if (targetHHMM) {
        const userStreakTime = userSettings?.streakAlertTime || '22:00';
        if (userStreakTime !== targetHHMM) continue;
      }

      const userId = user.id;
      const tgLink = user.telegramLink;
      const chatId = tgLink && tgLink.isActive ? Number(tgLink.telegramChatId) : null;

      let endangeredCount = 0;
      if (chatId && tgLink) {
        const summary = await getAnalyticsSummary(tgLink.telegramChatId);
        const endangeredStreaks = summary.habitStreaks.filter((s) => !s.isDoneToday && s.currentStreak > 0);
        endangeredCount = endangeredStreaks.length;
      }

      if (endangeredCount > 0 || !chatId) {
        await sendPushNotificationToUser(userId, {
          title: `🚨 Peringatan Habit Streak Night Alert!`,
          body: `Jangan biarkan habit streak kamu terputus malam ini! Yuk check-in sekarang. 🔥`,
          url: '/habits',
          tag: `lifeos-streak-${Date.now()}`,
        });
        sentCount++;
        console.log(`[CRON ${getWibHHMM()} WIB] 🚨 Streak Alert Reminder sent to ${user.name} (${userId})`);
      }
    }
  } catch (error: any) {
    console.error(`[CRON ERROR ${getWibHHMM()} WIB] Streak Alert failed:`, error.message || error);
  }
  return sentCount;
}

/**
 * 5. Auto Follow-Up Reminders
 */
export async function sendAutoFollowUpReminders(bot: Telegraf, targetHHMM?: string): Promise<number> {
  let sentCount = 0;
  try {
    const allUsers = await prisma.user.findMany({
      include: { settings: true, telegramLink: true },
    });

    const nowHHMM = targetHHMM || getWibHHMM();
    const [currentHourStr, currentMinStr] = nowHHMM.split(':');
    const currentHour = parseInt(currentHourStr, 10);
    const currentMin = parseInt(currentMinStr, 10);
    const today = getTodayDate();

    for (const user of allUsers) {
      const userSettings = user.settings;
      if (userSettings && (!userSettings.remindersEnabled || !userSettings.autoFollowUpEnabled)) continue;

      const delayHours = userSettings?.autoFollowUpDelayHours ?? 2;
      const targetScheduledHour = (currentHour - delayHours + 24) % 24;

      const userId = user.id;

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

      const pendingFollowUpHabits = habitsWithReminder.filter((h) => {
        if (!h.reminderTime || doneHabitIds.has(h.id)) return false;
        const rDate = new Date(h.reminderTime);
        const rHour = rDate.getUTCHours();
        const rMin = rDate.getUTCMinutes();

        if (rHour !== targetScheduledHour) return false;
        if (currentMin === 0) return rMin === 0 || rMin > 50;
        return rMin > currentMin - 10 && rMin <= currentMin;
      });

      if (pendingFollowUpHabits.length > 0) {
        await sendPushNotificationToUser(userId, {
          title: `🔔 Follow-Up Target Tertunda (+${delayHours} Jam)`,
          body: `Kamu memiliki ${pendingFollowUpHabits.length} habit tertunda. Yuk selesaikan sekarang!`,
          url: '/dashboard',
          tag: `lifeos-followup-${delayHours}h-${Date.now()}`,
        });
        sentCount++;
        console.log(`[CRON ${getWibHHMM()} WIB] 🔔 Auto Follow-Up Reminder (+${delayHours}h) sent to ${user.name} (${userId})`);
      }
    }
  } catch (error: any) {
    console.error(`[CRON ERROR ${getWibHHMM()} WIB] Auto Follow-Up Reminder failed:`, error.message || error);
  }
  return sentCount;
}

/**
 * Master Scheduled Check Handler
 */
export async function checkAndRunScheduledReminders(bot: Telegraf) {
  const currentHHMM = getWibHHMM();

  const morningCount = await sendMorningReminders(bot, currentHHMM);
  const eveningCount = await sendEveningRecapReminders(bot, currentHHMM);
  const streakCount = await sendStreakAlertReminders(bot, currentHHMM);
  const hourlyCount = await sendTimeSpecificReminders(bot, currentHHMM);
  const followUpCount = await sendAutoFollowUpReminders(bot, currentHHMM);

  const totalSent = morningCount + eveningCount + streakCount + hourlyCount + followUpCount;
  if (totalSent > 0) {
    console.log(`[CRON ${currentHHMM} WIB] ✅ Dispatch complete. Sent total ${totalSent} push reminder(s).`);
  } else {
    console.log(`[CRON ${currentHHMM} WIB] 💤 Ticker checked. No reminders due.`);
  }
}

/**
 * Initialize Cron Scheduler Service
 */
export function initCronScheduler(bot: Telegraf) {
  const scheduleExp = process.env.CRON_SCHEDULE_EXPRESSION || '*/10 * * * *';
  console.log(`⚙️ Initializing Cron Scheduler Service (Schedule: "${scheduleExp}", Timezone: Asia/Jakarta)...`);
  const cronOptions = { timezone: 'Asia/Jakarta' };

  cron.schedule(scheduleExp, () => {
    checkAndRunScheduledReminders(bot);
  }, cronOptions);

  console.log(`✅ Cron Scheduler initialized successfully with schedule "${scheduleExp}"`);
}
