import { Context, Markup } from 'telegraf';
import { prisma } from '../server';

/**
 * Helper to get normalized date for today (start of day 00:00:00)
 */

export function getTodayDate(): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export interface HabitWithStatus {
  id: string;
  name: string;
  description: string | null;
  frequency: string;
  color: string | null;
  isDoneToday: boolean;
  logId?: string;
}

/**
 * 1. Fungsi untuk mengambil daftar habit harian dari database berdasarkan Telegram Chat ID.
 * Mengembalikan list habit beserta status apakah sudah di-checkin hari ini.
 */
export async function getUserDailyHabits(telegramChatId?: bigint | null): Promise<{
  userFound: boolean;
  habits: HabitWithStatus[];
}> {
  let userId: string | null = null;

  if (telegramChatId) {
    const telegramLink = await prisma.telegramLink.findUnique({
      where: { telegramChatId },
      select: { userId: true },
    });
    if (telegramLink) {
      userId = telegramLink.userId;
    }
  }

  // Fallback to first user in database if no telegramChatId or link found
  if (!userId) {
    const firstUser = await prisma.user.findFirst();
    if (firstUser) {
      userId = firstUser.id;
    } else {
      // Create initial default user
      const defaultUser = await prisma.user.create({
        data: {
          email: 'default_user@lifeos.internal',
          name: 'Alex (Default User)',
        },
      });
      userId = defaultUser.id;
    }
  }

  let habits = await prisma.habit.findMany({
    where: { userId, isArchived: false },
    orderBy: { sortOrder: 'asc' },
  });

  // Auto-seed sample habits if user has no habits yet
  if (habits.length === 0) {
    console.log(`Creating default habits for user ${userId}...`);
    await prisma.habit.createMany({
      data: [
        { userId, name: '🏋️‍♂️ Olahraga 30 Menit', sortOrder: 1 },
        { userId, name: '💧 Minum Air 2 Liter', sortOrder: 2 },
        { userId, name: '📖 Membaca Buku 15 Menit', sortOrder: 3 },
        { userId, name: '🧘‍♂️ Meditasi 10 Menit', sortOrder: 4 },
        { userId, name: '💻 Koding Project Life OS', sortOrder: 5 },
      ],
    });

    habits = await prisma.habit.findMany({
      where: { userId, isArchived: false },
      orderBy: { sortOrder: 'asc' },
    });
  }

  // Get today's logs for these habits
  const today = getTodayDate();
  const habitIds = habits.map((h: any) => h.id);

  const todayLogs = await prisma.habitLog.findMany({
    where: {
      habitId: { in: habitIds },
      date: today,
    },
  });

  const logsMap = new Map(todayLogs.map((log: any) => [log.habitId, log]));

  const habitsWithStatus: HabitWithStatus[] = habits.map((habit: any) => {
    const log: any = logsMap.get(habit.id);
    const isDoneToday = log?.status === 'DONE';
    return {
      id: habit.id,
      name: habit.name,
      description: habit.description,
      frequency: habit.frequency,
      color: habit.color,
      isDoneToday,
      logId: log?.id,
    };
  });

  return { userFound: true, habits: habitsWithStatus };
}

/**
 * Helper to build Inline Keyboard markup for habit list
 */
function buildHabitsInlineKeyboard(habits: HabitWithStatus[]) {
  const buttons = habits.map((habit) => {
    const statusIcon = habit.isDoneToday ? '✅' : '⬜';
    const label = `${statusIcon} ${habit.name}`;
    const callbackData = `toggle_habit:${habit.id}`;
    return [Markup.button.callback(label, callbackData)];
  });

  // Add refresh button at the bottom
  buttons.push([Markup.button.callback('🔄 Refresh Status', 'refresh_habits')]);

  return Markup.inlineKeyboard(buttons);
}

/**
 * 2. Command Telegram /habits: Menampilkan daftar habit harian dalam bentuk Inline Keyboard.
 */
export async function handleHabitsCommand(ctx: Context) {
  try {
    if (!ctx.chat) return;

    const telegramChatId = BigInt(ctx.chat.id);
    const { userFound, habits } = await getUserDailyHabits(telegramChatId);

    if (!userFound) {
      await ctx.reply(
        '⚠️ Akun Telegram kamu belum terhubung.\nKetik /start terlebih dahulu untuk menghubungkan akun.'
      );
      return;
    }

    if (habits.length === 0) {
      await ctx.reply('📋 Kamu belum memiliki habit harian. Tambahkan habit baru di dashboard!');
      return;
    }

    const completedCount = habits.filter((h) => h.isDoneToday).length;
    const messageText =
      `🎯 *Habit Harian Kamu*\n` +
      `📅 *Tanggal:* ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n` +
      `📊 *Progres:* ${completedCount}/${habits.length} Selesai\n\n` +
      `Klik tombol di bawah untuk mencatat check-in habit hari ini:`;

    await ctx.reply(messageText, {
      parse_mode: 'Markdown',
      ...buildHabitsInlineKeyboard(habits),
    });
  } catch (error) {
    console.error('Error handling /habits command:', error);
    await ctx.reply('❌ Gagal mengambil daftar habit harian.');
  }
}

/**
 * Helper core function untuk me-toggle status habit check-in hari ini
 */
export async function toggleHabitStatus(habitId: string) {
  const today = getTodayDate();

  const existingLog = await prisma.habitLog.findUnique({
    where: {
      habitId_date: {
        habitId,
        date: today,
      },
    },
  });

  if (existingLog && existingLog.status === 'DONE') {
    await prisma.habitLog.delete({
      where: { id: existingLog.id },
    });
    return { isDoneToday: false };
  } else {
    await prisma.habitLog.upsert({
      where: {
        habitId_date: {
          habitId,
          date: today,
        },
      },
      create: {
        habitId,
        date: today,
        status: 'DONE',
        completedAt: new Date(),
      },
      update: {
        status: 'DONE',
        completedAt: new Date(),
      },
    });
    return { isDoneToday: true };
  }
}

/**
 * Action Handler saat user mengeklik tombol habit (Callback Query)
 */
export async function handleHabitToggleCallback(ctx: Context) {
  try {
    if (!ctx.chat || !('data' in ctx.callbackQuery!)) return;

    const callbackData = ctx.callbackQuery.data;

    if (callbackData === 'refresh_habits') {
      await updateHabitsMessage(ctx);
      await ctx.answerCbQuery('🔄 Daftar habit diperbarui!');
      return;
    }

    const habitId = callbackData.replace('toggle_habit:', '');
    const result = await toggleHabitStatus(habitId);

    const toastMsg = result.isDoneToday ? '✅ Habit ditandai Selesai!' : '↩️ Check-in dibatalkan.';
    await ctx.answerCbQuery(toastMsg);

    // Refresh inline keyboard UI
    await updateHabitsMessage(ctx);
  } catch (error) {
    console.error('Error in handleHabitToggleCallback:', error);
    await ctx.answerCbQuery('❌ Gagal memperbarui status habit.');
  }
}

/**
 * Helper core function untuk membuat Habit baru
 */
export async function createHabit(data: {
  userId?: string;
  telegramChatId?: bigint | null;
  name: string;
  description?: string;
  frequency?: 'DAILY' | 'WEEKLY' | 'CUSTOM';
  color?: string;
  reminderTime?: string | Date | null;
}) {
  let userId = data.userId;
  if (!userId && data.telegramChatId) {
    const telegramLink = await prisma.telegramLink.findUnique({
      where: { telegramChatId: data.telegramChatId },
      select: { userId: true },
    });
    if (telegramLink) userId = telegramLink.userId;
  }

  if (!userId) {
    const firstUser = await prisma.user.findFirst();
    if (firstUser) {
      userId = firstUser.id;
    } else {
      const defaultUser = await prisma.user.create({
        data: { email: 'default_user@lifeos.internal', name: 'Alex (Default User)' },
      });
      userId = defaultUser.id;
    }
  }

  let reminderDate: Date | null = null;
  if (data.reminderTime) {
    if (typeof data.reminderTime === 'string') {
      const [h, m] = data.reminderTime.split(':').map(Number);
      reminderDate = new Date(Date.UTC(1970, 0, 1, h || 0, m || 0, 0));
    } else if (data.reminderTime instanceof Date) {
      reminderDate = data.reminderTime;
    }
  }

  const habit = await prisma.habit.create({
    data: {
      userId,
      name: data.name,
      description: data.description || null,
      frequency: (data.frequency as any) || 'DAILY',
      color: data.color || 'indigo',
      reminderTime: reminderDate,
    },
  });

  return habit;
}

/**
 * Helper core function untuk menghapus / mengarsip Habit
 */
export async function deleteHabit(habitId: string) {
  const habit = await prisma.habit.update({
    where: { id: habitId },
    data: { isArchived: true },
  });
  return habit;
}

/**
 * Helper to edit the message UI after toggle/refresh
 */
async function updateHabitsMessage(ctx: Context) {
  if (!ctx.chat) return;

  const telegramChatId = BigInt(ctx.chat.id);
  const { habits } = await getUserDailyHabits(telegramChatId);

  const completedCount = habits.filter((h) => h.isDoneToday).length;
  const messageText =
    `🎯 *Habit Harian Kamu*\n` +
    `📅 *Tanggal:* ${new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n` +
    `📊 *Progres:* ${completedCount}/${habits.length} Selesai\n\n` +
    `Klik tombol di bawah untuk mencatat check-in habit hari ini:`;

  try {
    await ctx.editMessageText(messageText, {
      parse_mode: 'Markdown',
      ...buildHabitsInlineKeyboard(habits),
    });
  } catch (error: any) {
    if (error?.description?.includes('message is not modified')) {
      // Ignore Telegram 400 error when message content hasn't changed
      return;
    }
    throw error;
  }
}
