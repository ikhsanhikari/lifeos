import { Context, Markup } from 'telegraf';
import { prisma } from '../server';
import { getTodayDate } from './habitController';

export interface DailyLogData {
  id?: string;
  userId?: string;
  date?: Date;
  mood: number;
  energy: number;
  journal: string | null;
  highlights: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

// In-memory temp wizard state for Telegram /log command per user
const wizardSessions = new Map<number, { mood?: number; energy?: number; journal?: string; highlights?: string[] }>();

/**
 * Helper to resolve user ID
 */
async function resolveUserId(telegramChatId?: bigint | null): Promise<string> {
  if (telegramChatId) {
    const telegramLink = await prisma.telegramLink.findUnique({
      where: { telegramChatId },
      select: { userId: true },
    });
    if (telegramLink) {
      return telegramLink.userId;
    }
  }

  const firstUser = await prisma.user.findFirst();
  if (firstUser) {
    return firstUser.id;
  }

  const defaultUser = await prisma.user.create({
    data: {
      email: 'default_user@lifeos.internal',
      name: 'Alex (Default User)',
    },
  });
  return defaultUser.id;
}

/**
 * 1. Ambil Daily Log hari ini
 */
export async function getTodayDailyLog(telegramChatId?: bigint | null): Promise<{
  userId: string;
  dailyLog: DailyLogData | null;
}> {
  const userId = await resolveUserId(telegramChatId);
  const today = getTodayDate();

  const dailyLog = await prisma.dailyLog.findUnique({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
  });

  return { userId, dailyLog };
}

/**
 * 2. Upsert Daily Log (Simpan atau Perbarui Jurnal & Mood hari ini)
 */
export async function upsertDailyLog(data: {
  telegramChatId?: bigint | null;
  userId?: string;
  mood: number;
  energy: number;
  journal?: string | null;
  highlights?: string[];
}) {
  const userId = data.userId || (await resolveUserId(data.telegramChatId));
  const today = getTodayDate();

  const dailyLog = await prisma.dailyLog.upsert({
    where: {
      userId_date: {
        userId,
        date: today,
      },
    },
    create: {
      userId,
      date: today,
      mood: Math.min(5, Math.max(1, data.mood)),
      energy: Math.min(5, Math.max(1, data.energy)),
      journal: data.journal || null,
      highlights: data.highlights || [],
    },
    update: {
      mood: Math.min(5, Math.max(1, data.mood)),
      energy: Math.min(5, Math.max(1, data.energy)),
      journal: data.journal !== undefined ? data.journal : undefined,
      highlights: data.highlights !== undefined ? data.highlights : undefined,
    },
  });

  return dailyLog;
}

/**
 * 3. Telegram Command /log: Wizard langkah pertama (Pilih Mood)
 */
export async function handleDailyLogCommand(ctx: Context) {
  try {
    if (!ctx.chat) return;

    const chatId = ctx.chat.id;
    wizardSessions.set(chatId, {});

    const moodButtons = Markup.inlineKeyboard([
      [
        Markup.button.callback('😭 1 (Sangat Buruk)', 'log_mood:1'),
        Markup.button.callback('🙁 2 (Buruk)', 'log_mood:2'),
      ],
      [
        Markup.button.callback('😐 3 (Biasa)', 'log_mood:3'),
        Markup.button.callback('🙂 4 (Baik)', 'log_mood:4'),
      ],
      [
        Markup.button.callback('😊 5 (Sangat Baik)', 'log_mood:5'),
      ],
    ]);

    await ctx.reply(
      `📖 *Daily Journal & Mood Log*\n\n` +
        `*Langkah 1/2:* Bagaimana suasana hati (Mood) kamu hari ini?`,
      {
        parse_mode: 'Markdown',
        ...moodButtons,
      }
    );
  } catch (error) {
    console.error('Error handling /log command:', error);
    await ctx.reply('❌ Gagal memulai log harian.');
  }
}

/**
 * Callback action handler untuk pemilihan Mood di Telegram
 */
export async function handleLogMoodCallback(ctx: Context) {
  try {
    if (!ctx.chat || !('data' in ctx.callbackQuery!)) return;

    const chatId = ctx.chat.id;
    const callbackData = ctx.callbackQuery.data;
    const moodVal = parseInt(callbackData.replace('log_mood:', ''), 10);

    const session = wizardSessions.get(chatId) || {};
    session.mood = moodVal;
    wizardSessions.set(chatId, session);

    await ctx.answerCbQuery(`Mood dicatat: ${moodVal}/5`);

    const energyButtons = Markup.inlineKeyboard([
      [
        Markup.button.callback('🪫 1 (Sangat Rendah)', 'log_energy:1'),
        Markup.button.callback('🔋 2 (Rendah)', 'log_energy:2'),
      ],
      [
        Markup.button.callback('⚡ 3 (Cukup)', 'log_energy:3'),
        Markup.button.callback('⚡⚡ 4 (Tinggi)', 'log_energy:4'),
      ],
      [
        Markup.button.callback('⚡⚡⚡ 5 (Sangat Tinggi)', 'log_energy:5'),
      ],
    ]);

    await ctx.editMessageText(
      `📖 *Daily Journal & Mood Log*\n\n` +
        `Mood: *${moodVal}/5*\n` +
        `*Langkah 2/2:* Bagaimana tingkat energi fisik kamu hari ini?`,
      {
        parse_mode: 'Markdown',
        ...energyButtons,
      }
    );
  } catch (error) {
    console.error('Error in handleLogMoodCallback:', error);
    await ctx.answerCbQuery('❌ Gagal mencatat mood.');
  }
}

/**
 * Callback action handler untuk pemilihan Energy di Telegram (Simpan ke DB)
 */
export async function handleLogEnergyCallback(ctx: Context) {
  try {
    if (!ctx.chat || !('data' in ctx.callbackQuery!)) return;

    const chatId = ctx.chat.id;
    const callbackData = ctx.callbackQuery.data;
    const energyVal = parseInt(callbackData.replace('log_energy:', ''), 10);

    const session = wizardSessions.get(chatId) || {};
    const moodVal = session.mood || 4;

    const telegramChatId = BigInt(chatId);
    const savedLog = await upsertDailyLog({
      telegramChatId,
      mood: moodVal,
      energy: energyVal,
    });

    wizardSessions.delete(chatId);
    await ctx.answerCbQuery(`Energi dicatat: ${energyVal}/5`);

    const moodLabel = moodVal === 5 ? '😊 Sangat Baik' : moodVal === 4 ? '🙂 Baik' : moodVal === 3 ? '😐 Biasa' : moodVal === 2 ? '🙁 Buruk' : '😭 Sangat Buruk';

    await ctx.editMessageText(
      `🎉 *Daily Log Hari Ini Berhasil Disimpan!*\n\n` +
        `😊 *Mood:* ${moodLabel} (${savedLog.mood}/5)\n` +
        `⚡ *Energi:* ${savedLog.energy}/5\n` +
        `📅 *Tanggal:* ${new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}\n\n` +
        `Log kamu sudah tersimpan di database PostgreSQL dan dapat dilihat di Web Dashboard!`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error in handleLogEnergyCallback:', error);
    await ctx.answerCbQuery('❌ Gagal menyimpan daily log.');
  }
}
