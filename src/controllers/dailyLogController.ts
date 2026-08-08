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
export const logWizardSessions = new Map<number, { mood?: number; energy?: number; step?: 'WAITING_MOOD' | 'WAITING_ENERGY' | 'WAITING_JOURNAL_TEXT' }>();

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
    logWizardSessions.set(chatId, { step: 'WAITING_MOOD' });

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
        `*Langkah 1/3:* Bagaimana suasana hati (Mood) kamu hari ini?`,
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

    const session = logWizardSessions.get(chatId) || {};
    session.mood = moodVal;
    session.step = 'WAITING_ENERGY';
    logWizardSessions.set(chatId, session);

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
        `*Langkah 2/3:* Bagaimana tingkat energi fisik kamu hari ini?`,
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
 * Callback action handler untuk pemilihan Energy di Telegram (Langkah 3: Minta Teks Refleksi)
 */
export async function handleLogEnergyCallback(ctx: Context) {
  try {
    if (!ctx.chat || !('data' in ctx.callbackQuery!)) return;

    const chatId = ctx.chat.id;
    const callbackData = ctx.callbackQuery.data;
    const energyVal = parseInt(callbackData.replace('log_energy:', ''), 10);

    const session = logWizardSessions.get(chatId) || {};
    const moodVal = session.mood || 4;

    session.energy = energyVal;
    session.step = 'WAITING_JOURNAL_TEXT';
    logWizardSessions.set(chatId, session);

    const telegramChatId = BigInt(chatId);
    await upsertDailyLog({
      telegramChatId,
      mood: moodVal,
      energy: energyVal,
    });

    await ctx.answerCbQuery(`Energi dicatat: ${energyVal}/5`);

    const moodLabel = moodVal === 5 ? '😊 Sangat Baik' : moodVal === 4 ? '🙂 Baik' : moodVal === 3 ? '😐 Biasa' : moodVal === 2 ? '🙁 Buruk' : '😭 Sangat Buruk';

    const skipButtons = Markup.inlineKeyboard([
      [Markup.button.callback('⏭️ Selesai (Tanpa Catatan Teks)', 'log_skip_journal')],
    ]);

    await ctx.editMessageText(
      `📖 *Daily Journal & Mood Log*\n\n` +
        `😊 *Mood:* ${moodLabel} (${moodVal}/5)\n` +
        `⚡ *Energi:* ${energyVal}/5\n\n` +
        `*Langkah 3/3 (Opsional):*\n` +
        `Ketikkan pesan teks refleksi / cerita harian kamu di chat ini:\n\n` +
        `_(Atau tekan tombol di bawah jika hanya ingin menyimpan Mood & Energi)_`,
      {
        parse_mode: 'Markdown',
        ...skipButtons,
      }
    );
  } catch (error) {
    console.error('Error in handleLogEnergyCallback:', error);
    await ctx.answerCbQuery('❌ Gagal menyimpan mood/energi.');
  }
}

/**
 * Callback action handler jika user memilih lewati teks jurnal
 */
export async function handleLogSkipJournalCallback(ctx: Context) {
  try {
    if (!ctx.chat) return;

    const chatId = ctx.chat.id;
    const session = logWizardSessions.get(chatId) || {};
    const moodVal = session.mood || 4;
    const energyVal = session.energy || 4;

    logWizardSessions.delete(chatId);
    if ('callbackQuery' in ctx && ctx.callbackQuery) {
      await ctx.answerCbQuery('Log selesai disimpan');
    }

    const moodLabel = moodVal === 5 ? '😊 Sangat Baik' : moodVal === 4 ? '🙂 Baik' : moodVal === 3 ? '😐 Biasa' : moodVal === 2 ? '🙁 Buruk' : '😭 Sangat Buruk';
    const dateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const msg =
      `🎉 *Daily Log Hari Ini Berhasil Disimpan!*\n\n` +
      `😊 *Mood:* ${moodLabel} (${moodVal}/5)\n` +
      `⚡ *Energi:* ${energyVal}/5\n` +
      `📅 *Tanggal:* ${dateStr}\n\n` +
      `Log kamu tersimpan di database PostgreSQL dan disinkronkan ke Web Dashboard!`;

    if ('callbackQuery' in ctx && ctx.callbackQuery) {
      await ctx.editMessageText(msg, { parse_mode: 'Markdown' });
    } else {
      await ctx.reply(msg, { parse_mode: 'Markdown' });
    }
  } catch (error) {
    console.error('Error in handleLogSkipJournalCallback:', error);
  }
}

/**
 * Text message handler saat user mengetikkan catatan refleksi jurnal di chat
 */
export async function handleLogJournalText(ctx: Context, text: string) {
  try {
    if (!ctx.chat) return;

    const chatId = ctx.chat.id;
    const session = logWizardSessions.get(chatId);

    if (!session || session.step !== 'WAITING_JOURNAL_TEXT') return;

    const moodVal = session.mood || 4;
    const energyVal = session.energy || 4;

    const telegramChatId = BigInt(chatId);
    const savedLog = await upsertDailyLog({
      telegramChatId,
      mood: moodVal,
      energy: energyVal,
      journal: text.trim(),
    });

    logWizardSessions.delete(chatId);

    const moodLabel = moodVal === 5 ? '😊 Sangat Baik' : moodVal === 4 ? '🙂 Baik' : moodVal === 3 ? '😐 Biasa' : moodVal === 2 ? '🙁 Buruk' : '😭 Sangat Buruk';
    const dateStr = new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    await ctx.reply(
      `🎉 *Daily Log & Refleksi Jurnal Berhasil Disimpan!* 📖\n\n` +
        `😊 *Mood:* ${moodLabel} (${savedLog.mood}/5)\n` +
        `⚡ *Energi:* ${savedLog.energy}/5\n` +
        `📝 *Catatan Refleksi:*\n_"${savedLog.journal}"_\n\n` +
        `📅 *Tanggal:* ${dateStr}\n\n` +
        `Log kamu tersimpan di database PostgreSQL dan dapat di-review oleh AI Coach di Web Dashboard! ✨`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error in handleLogJournalText:', error);
    await ctx.reply('❌ Gagal menyimpan teks jurnal.');
  }
}
