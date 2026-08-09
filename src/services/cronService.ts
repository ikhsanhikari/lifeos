import cron from 'node-cron';
import { Telegraf } from 'telegraf';
import { prisma } from '../server';
import { getTodayDate } from '../controllers/habitController';
import { getAnalyticsSummary } from '../controllers/analyticsController';

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
 * Send daily habit list, goal-contextual tasks, and deadline alerts to Telegram linked users.
 * Returns count of reminders sent.
 */
export async function sendMorningReminders(bot: Telegraf, targetHHMM?: string): Promise<number> {
  let sentCount = 0;
  try {
    const activeLinks = await prisma.telegramLink.findMany({
      where: { isActive: true },
      include: {
        user: {
          include: { settings: true },
        },
      },
    });

    const today = getTodayDate();

    for (const link of activeLinks) {
      const userSettings = link.user.settings;

      // Skip if user explicitly disabled reminders
      if (userSettings && !userSettings.remindersEnabled) {
        continue;
      }

      // If targetHHMM is supplied, verify time match
      if (targetHHMM) {
        const userMorningTime = userSettings?.morningReminderTime || '07:00';
        if (userMorningTime !== targetHHMM) {
          continue;
        }
      }

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
      sentCount++;
      console.log(`[CRON ${getWibHHMM()} WIB] ☀️ Morning Reminder sent to ${link.user.name} (${chatId})`);
    }
  } catch (error: any) {
    console.error(`[CRON ERROR ${getWibHHMM()} WIB] Morning Reminder failed:`, error.message || error);
  }
  return sentCount;
}

/**
 * 2. Time-Specific Reminder (Hourly/Windowed Cron Runner)
 * Check habits & tasks scheduled for the current time window and push Telegram alerts.
 * Returns count of reminders sent.
 */
export async function sendTimeSpecificReminders(bot: Telegraf, targetHHMM?: string): Promise<number> {
  let sentCount = 0;
  try {
    const activeLinks = await prisma.telegramLink.findMany({
      where: { isActive: true },
      include: {
        user: {
          include: { settings: true },
        },
      },
    });

    const nowHHMM = targetHHMM || getWibHHMM();
    const [currentHourStr, currentMinStr] = nowHHMM.split(':');
    const currentHour = parseInt(currentHourStr, 10);
    const currentMin = parseInt(currentMinStr, 10);
    const today = getTodayDate();

    for (const link of activeLinks) {
      const userSettings = link.user.settings;

      // Skip if reminders or hourlyRemindersEnabled disabled
      if (userSettings && (!userSettings.remindersEnabled || !userSettings.hourlyRemindersEnabled)) {
        continue;
      }

      const chatId = Number(link.telegramChatId);
      const userId = link.userId;

      // Find habits with reminderTime matching current hour & minute window
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

        if (currentMin === 0) {
          return rMin === 0 || rMin > 50;
        }
        return rMin > currentMin - 10 && rMin <= currentMin;
      });

      // Find tasks with dueTime matching current hour & minute window
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
        const tDate = new Date(t.dueTime);
        const tHour = tDate.getUTCHours();
        const tMin = tDate.getUTCMinutes();

        if (tHour !== currentHour) return false;

        if (currentMin === 0) {
          return tMin === 0 || tMin > 50;
        }
        return tMin > currentMin - 10 && tMin <= currentMin;
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

        const formattedTimeHeader = `${currentHourStr}:${currentMinStr}`;
        const message =
          `⏰ *PENGINGAT WAKTU TIBA (${formattedTimeHeader})* 🔔\n\n` +
          `Halo ${link.user.name}! Waktunya menyelesaikan target kamu sekarang:\n\n` +
          `${habitSection}` +
          `${taskSection}` +
          `_Ketik /habits atau /tasks untuk melakukan check-in!_`;

        await bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        sentCount++;
        console.log(`[CRON ${getWibHHMM()} WIB] ⏰ Item Reminder (${formattedTimeHeader}) sent to ${link.user.name} (${chatId})`);
      }
    }
  } catch (error: any) {
    console.error(`[CRON ERROR ${getWibHHMM()} WIB] Hourly Time-Specific Reminder failed:`, error.message || error);
  }
  return sentCount;
}

/**
 * 3. Evening Recap
 * Prompt user to submit Daily Log & Mood journal if not filled today.
 * Returns count of reminders sent.
 */
export async function sendEveningRecapReminders(bot: Telegraf, targetHHMM?: string): Promise<number> {
  let sentCount = 0;
  try {
    const activeLinks = await prisma.telegramLink.findMany({
      where: { isActive: true },
      include: {
        user: {
          include: { settings: true },
        },
      },
    });

    const today = getTodayDate();

    for (const link of activeLinks) {
      const userSettings = link.user.settings;

      if (userSettings && !userSettings.remindersEnabled) {
        continue;
      }

      if (targetHHMM) {
        const userEveningTime = userSettings?.eveningRecapTime || '21:00';
        if (userEveningTime !== targetHHMM) {
          continue;
        }
      }

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
        sentCount++;
        console.log(`[CRON ${getWibHHMM()} WIB] 🌙 Evening Recap Reminder sent to ${link.user.name} (${chatId})`);
      }
    }
  } catch (error: any) {
    console.error(`[CRON ERROR ${getWibHHMM()} WIB] Evening Recap failed:`, error.message || error);
  }
  return sentCount;
}

/**
 * 4. Streak Alert
 * Warning alert for habits with active streak > 0 that are still unchecked today.
 * Returns count of reminders sent.
 */
export async function sendStreakAlertReminders(bot: Telegraf, targetHHMM?: string): Promise<number> {
  let sentCount = 0;
  try {
    const activeLinks = await prisma.telegramLink.findMany({
      where: { isActive: true },
      include: {
        user: {
          include: { settings: true },
        },
      },
    });

    for (const link of activeLinks) {
      const userSettings = link.user.settings;

      if (userSettings && !userSettings.remindersEnabled) {
        continue;
      }

      if (targetHHMM) {
        const userStreakTime = userSettings?.streakAlertTime || '22:00';
        if (userStreakTime !== targetHHMM) {
          continue;
        }
      }

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
        sentCount++;
        console.log(`[CRON ${getWibHHMM()} WIB] 🚨 Streak Alert Reminder sent to ${link.user.name} (${chatId})`);
      }
    }
  } catch (error: any) {
    console.error(`[CRON ERROR ${getWibHHMM()} WIB] Streak Alert failed:`, error.message || error);
  }
  return sentCount;
}

/**
 * 5. Auto Follow-Up Reminders for Uncompleted Items
 * Sends follow-up alerts for habits/tasks whose original scheduled time + autoFollowUpDelayHours matches current time
 * and are still not completed today.
 */
export async function sendAutoFollowUpReminders(bot: Telegraf, targetHHMM?: string): Promise<number> {
  let sentCount = 0;
  try {
    const activeLinks = await prisma.telegramLink.findMany({
      where: { isActive: true },
      include: {
        user: {
          include: { settings: true },
        },
      },
    });

    const nowHHMM = targetHHMM || getWibHHMM();
    const [currentHourStr, currentMinStr] = nowHHMM.split(':');
    const currentHour = parseInt(currentHourStr, 10);
    const currentMin = parseInt(currentMinStr, 10);
    const today = getTodayDate();

    for (const link of activeLinks) {
      const userSettings = link.user.settings;

      // Skip if reminders or autoFollowUpEnabled disabled
      if (userSettings && (!userSettings.remindersEnabled || !userSettings.autoFollowUpEnabled)) {
        continue;
      }

      const delayHours = userSettings?.autoFollowUpDelayHours ?? 2;
      // Scheduled hour that should trigger a follow-up right now
      const targetScheduledHour = (currentHour - delayHours + 24) % 24;

      const chatId = Number(link.telegramChatId);
      const userId = link.userId;

      // Find uncompleted habits with reminderTime matching targetScheduledHour
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

        if (currentMin === 0) {
          return rMin === 0 || rMin > 50;
        }
        return rMin > currentMin - 10 && rMin <= currentMin;
      });

      // Find uncompleted tasks with dueTime matching targetScheduledHour
      const tasksWithDueTime = await prisma.task.findMany({
        where: {
          userId,
          status: { in: ['TODO', 'IN_PROGRESS'] },
          dueTime: { not: null },
        },
        include: { goal: { select: { title: true } } },
      });

      const pendingFollowUpTasks = tasksWithDueTime.filter((t) => {
        if (!t.dueTime) return false;
        const tDate = new Date(t.dueTime);
        const tHour = tDate.getUTCHours();
        const tMin = tDate.getUTCMinutes();

        if (tHour !== targetScheduledHour) return false;

        if (currentMin === 0) {
          return tMin === 0 || tMin > 50;
        }
        return tMin > currentMin - 10 && tMin <= currentMin;
      });

      if (pendingFollowUpHabits.length > 0 || pendingFollowUpTasks.length > 0) {
        let habitSection = '';
        if (pendingFollowUpHabits.length > 0) {
          habitSection = `🎯 *Habits Tertunda (${delayHours} Jam Lalu):* \n` +
            pendingFollowUpHabits.map((h) => {
              const rDate = new Date(h.reminderTime!);
              const hh = rDate.getUTCHours().toString().padStart(2, '0');
              const mm = rDate.getUTCMinutes().toString().padStart(2, '0');
              return `• ${h.name} _(dijadwalkan ${hh}:${mm})_`;
            }).join('\n') + `\n\n`;
        }

        let taskSection = '';
        if (pendingFollowUpTasks.length > 0) {
          taskSection = `📋 *Tasks Tertunda (${delayHours} Jam Lalu):* \n` +
            pendingFollowUpTasks.map((t) => {
              const goalTag = t.goal ? `_[Goal: ${t.goal.title}]_ ` : '';
              const tDate = new Date(t.dueTime!);
              const hh = tDate.getUTCHours().toString().padStart(2, '0');
              const mm = tDate.getUTCMinutes().toString().padStart(2, '0');
              return `• ${goalTag}${t.title} _(dijadwalkan ${hh}:${mm})_`;
            }).join('\n') + `\n\n`;
        }

        const message =
          `🔔 *FOLLOW-UP PENGINGAT TERTUNDA* ⏰\n\n` +
          `Halo ${link.user.name}! Berikut target yang telah diingatkan namun belum di-checkin:\n\n` +
          `${habitSection}` +
          `${taskSection}` +
          `_Yuk selesaikan dan ketik /habits atau /tasks untuk melakukan check-in!_`;

        await bot.telegram.sendMessage(chatId, message, { parse_mode: 'Markdown' });
        sentCount++;
        console.log(`[CRON ${getWibHHMM()} WIB] 🔔 Auto Follow-Up Reminder (+${delayHours}h) sent to ${link.user.name} (${chatId})`);
      }
    }
  } catch (error: any) {
    console.error(`[CRON ERROR ${getWibHHMM()} WIB] Auto Follow-Up Reminder failed:`, error.message || error);
  }
  return sentCount;
}

/**
 * Master Scheduled Check Handler
 * Evaluates current WIB time against user settings
 */
export async function checkAndRunScheduledReminders(bot: Telegraf) {
  const currentHHMM = getWibHHMM();

  // 1. Morning Reminders matching current time
  const morningCount = await sendMorningReminders(bot, currentHHMM);

  // 2. Evening Recap Reminders matching current time
  const eveningCount = await sendEveningRecapReminders(bot, currentHHMM);

  // 3. Streak Alert Reminders matching current time
  const streakCount = await sendStreakAlertReminders(bot, currentHHMM);

  // 4. Time-Specific Item Reminders (Habits & Tasks)
  const hourlyCount = await sendTimeSpecificReminders(bot, currentHHMM);

  // 5. Auto Follow-Up Reminders for Uncompleted Items
  const followUpCount = await sendAutoFollowUpReminders(bot, currentHHMM);

  const totalSent = morningCount + eveningCount + streakCount + hourlyCount + followUpCount;
  if (totalSent > 0) {
    console.log(`[CRON ${currentHHMM} WIB] ✅ Dispatch complete. Sent total ${totalSent} push reminder(s).`);
  } else {
    console.log(`[CRON ${currentHHMM} WIB] 💤 Ticker checked. No reminders due.`);
  }
}

/**
 * Initialize Cron Scheduler Service based on env config
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
