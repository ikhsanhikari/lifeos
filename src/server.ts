import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import { Telegraf, Markup } from 'telegraf';
import { PrismaClient } from '@prisma/client';
import {
  handleHabitsCommand,
  handleHabitToggleCallback,
  getUserDailyHabits,
  toggleHabitStatus,
  skipHabitStatus,
  handleHabitDoneAction,
  handleHabitSkipPromptAction,
  handleHabitSkipPresetAction,
  createHabit,
  deleteHabit,
  reorderHabits,
  parseBulkHabitText,
  createHabitsBulk,
} from './controllers/habitController';
import {
  getUserTasks,
  createTask,
  updateTaskStatus,
  updateTask,
  deleteTask,
  handleTasksCommand,
  handleCreateTaskCommand,
  handleTaskToggleCallback,
  handleTasksPageCallback,
} from './controllers/taskController';
import { generateLinkToken, redeemLinkToken } from './services/telegramLinkService';
import {
  getTodayDailyLog,
  upsertDailyLog,
  handleDailyLogCommand,
  handleLogMoodCallback,
  handleLogEnergyCallback,
  handleLogSkipJournalCallback,
  handleLogJournalText,
  logWizardSessions,
} from './controllers/dailyLogController';
import {
  getAnalyticsSummary,
  handleTodaySummaryCommand,
  handleStreakCommand,
} from './controllers/analyticsController';
import {
  initCronScheduler,
  sendMorningReminders,
  sendEveningRecapReminders,
  sendStreakAlertReminders,
  sendTimeSpecificReminders,
} from './services/cronService';
import {
  registerTelegramCommands,
  getPersistentMenuKeyboard,
  handleMainMenuCommand,
  handleWebInfoCallback,
} from './controllers/menuController';
import {
  generateMagicLinkToken,
  verifyMagicLinkToken,
  verifyJwtSessionToken,
  verifyTelegramWebAppData,
} from './services/authService';
import {
  getUserGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
  handleGoalsCommand,
  handleCreateGoalCommand,
  handleFocusCommand,
  handleGoalDetailCallback,
  goalWizardSessions,
  renderProgressBar,
  handleAiGoalBreakdownCallback,
  handleGoalsPageCallback,
} from './controllers/goalController';
import {
  handleAiStatus,
  handleAiGoalBreakdown,
  handleAiDailyCoach,
  handleAiWeeklySummary,
} from './controllers/aiController';
import { getShareCardData, sendShareCardToTelegram, fetchCardDataInternal } from './controllers/shareController';
import { handleGetUserSettings, handleUpdateUserSettings } from './controllers/settingsController';
import { generateWeeklySummary, isAiGloballyEnabled, parseHabitsWithAi } from './services/aiService';
import { authMiddleware, AuthenticatedRequest } from './middleware/authMiddleware';
import { getVapidPublicKey, savePushSubscription, removePushSubscription, sendPushNotificationToUser, registerUserFcmToken } from './services/pushService';

// Load environment variables
dotenv.config();

// Fix JSON serialization for BigInt (Telegram chat ID uses BigInt in Prisma)
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

const app = express();
const port = process.env.PORT || 3000;

// Initialize Prisma Client
export const prisma = new PrismaClient();

// Middlewares
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Initialize Telegraf Bot
const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  console.warn('⚠️ Warning: TELEGRAM_BOT_TOKEN is not defined in environment variables.');
}

export const bot = new Telegraf(botToken || 'DUMMY_TOKEN');

// Configure Telegram Bot Chat Menu Button (Web App)
const getWebAppUrl = () =>
  (
    process.env.APP_URL ||
    process.env.NEXT_PUBLIC_WEB_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:3011'
  ).replace(/\/$/, '');

if (botToken && botToken !== 'DUMMY_TOKEN') {
  const url = getWebAppUrl();
  bot.telegram
    .setChatMenuButton({
      menuButton: {
        type: 'web_app',
        text: '🚀 Launch App',
        web_app: { url },
      },
    })
    .then(() => console.log(`✅ Set Telegram Chat Menu Button to Mini App URL: ${url}`))
    .catch((err) => console.warn('Could not set Telegram Chat Menu Button:', err.message));
}

// Telegram Bot Command: /start
bot.command('start', async (ctx) => {
  try {
    const telegramChatId = BigInt(ctx.chat.id);
    const username = ctx.from?.username || null;
    const firstName = ctx.from?.first_name || 'User';
    const lastName = ctx.from?.last_name || '';
    const fullName = `${firstName} ${lastName}`.trim();
    const tokenPayload = ctx.payload?.trim();

    console.log(`Received /start from Telegram Chat ID: ${telegramChatId} (${fullName}), payload: "${tokenPayload || ''}"`);

    // Case 1: Start triggered with a deep-link token from Web Dashboard (/start link_xxx)
    if (tokenPayload) {
      const redeemResult = await redeemLinkToken(tokenPayload, telegramChatId, username);
      if (redeemResult.success) {
        await ctx.reply(
          `🎉 *Koneksi Akun Berhasil!*\n\n` +
            `Akun Telegram kamu sekarang telah terhubung secara resmi ke *${redeemResult.user?.name}* di Web Dashboard Life OS!\n\n` +
            `Gunakan tombol menu di bawah ini untuk mengakses fitur dengan mudah! 👇`,
          { parse_mode: 'Markdown', ...getPersistentMenuKeyboard() }
        );
        return;
      } else {
        await ctx.reply(`⚠️ *Gagal Menghubungkan Akun*\n\n${redeemResult.message}`, {
          parse_mode: 'Markdown',
        });
        return;
      }
    }

    // Case 2: Standard /start command
    let telegramLink = await prisma.telegramLink.findUnique({
      where: { telegramChatId },
      include: { user: true },
    });

    if (!telegramLink) {
      const newUser = await prisma.user.create({
        data: {
          email: `tg_${ctx.chat.id}@lifeos.internal`,
          name: fullName || `Telegram User ${ctx.chat.id}`,
          telegramLink: {
            create: {
              telegramChatId,
              telegramUsername: username,
              isActive: true,
            },
          },
        },
        include: {
          telegramLink: {
            include: {
              user: true,
            },
          },
        },
      });

      telegramLink = newUser.telegramLink;

      await ctx.reply(
        `Halo ${firstName}! 👋 Selamat datang di *Life OS*.\n\n` +
          `Akun Telegram kamu telah berhasil didaftarkan ke sistem!\n` +
          `Gunakan menu di bawah ini untuk mengelola habits, tasks, dan jurnal kamu. 👇`,
        { parse_mode: 'Markdown', ...getPersistentMenuKeyboard() }
      );
    } else {
      if (username && telegramLink.telegramUsername !== username) {
        await prisma.telegramLink.update({
          where: { id: telegramLink.id },
          data: { telegramUsername: username },
        });
      }

      await ctx.reply(
        `Halo kembali, ${firstName}! 😊\n\n` +
          `Akun Telegram kamu terhubung dengan *${telegramLink.user.name}* di Life OS.\n` +
          `Silakan pilih menu di bawah ini: 👇`,
        { parse_mode: 'Markdown', ...getPersistentMenuKeyboard() }
      );
    }
  } catch (error) {
    console.error('Error handling /start command:', error);
    await ctx.reply('❌ Terjadi kesalahan saat menghubungkan akun kamu ke sistem. Silakan coba lagi.');
  }
});

interface OtpRecord {
  code: string;
  chatId: bigint;
  userId: string;
  expiresAt: number;
}
const activeOtpCodes = new Map<string, OtpRecord>();

// Handler untuk Telegram Magic Login Link (/login)
async function handleLoginCommand(ctx: any) {
  try {
    if (!ctx.chat) return;
    const chatId = BigInt(ctx.chat.id);
    const { magicLinkUrl, userName } = await generateMagicLinkToken(chatId);

    // Generate 6-digit numeric OTP code (e.g. "849201")
    const numericOtp = Math.floor(100000 + Math.random() * 900000).toString();

    // Find linked user ID
    const link = await prisma.telegramLink.findUnique({
      where: { telegramChatId: chatId },
    });
    const userId = link?.userId || '';

    activeOtpCodes.set(numericOtp, {
      code: numericOtp,
      chatId,
      userId,
      expiresAt: Date.now() + 5 * 60 * 1000, // 5 minutes
    });

    const htmlMessage =
      `🔑 <b>AKSES LOGIN LIFE OS</b>\n\n` +
      `Halo <b>${userName}</b>! Berikut akses masuk kamu:\n\n` +
      `📱 <b>Kode OTP Android (6-Digit):</b>\n` +
      `<code>${numericOtp}</code>\n` +
      `<i>(Masukkan kode 6-digit ini di aplikasi Android Life OS kamu)</i>\n\n` +
      `🌐 <b>Magic Link Web Dashboard:</b>\n` +
      `🚀 <a href="${magicLinkUrl}"><b>👉 KLIK DI SINI UNTUK LOGIN WEB 👈</b></a>\n\n` +
      `⏳ <b>Catatan:</b> Kode OTP & Link berlaku selama 5-15 menit.`;

    await ctx.reply(htmlMessage, {
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
    });
  } catch (error) {
    console.error('Error handling /login command:', error);
    await ctx.reply('❌ Gagal membuat kode login.');
  }
}

// Handler untuk Impor Bulk Habit via Telegram (/importhabit)
async function handleImportHabitsCommand(ctx: any) {
  try {
    if (!ctx.chat || !ctx.message?.text) return;
    const rawText = ctx.message.text.replace(/^\/importhabit\s*/i, '').trim();

    if (!rawText) {
      await ctx.reply(
        `📋 *Cara Impor Bulk Habit via Telegram*\n\n` +
        `Ketik \`/importhabit\` diikuti dengan daftar checklist kamu, contoh:\n\n` +
        `\`/importhabit\`\n` +
        `* ⬜ Bangun Subuh\n` +
        `* ⬜ Sholat 5 Waktu\n` +
        `* ⬜ Olahraga 20 Menit\n` +
        `* ⬜ Minum Air 2 Liter`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const telegramChatId = BigInt(ctx.chat.id);
    const user = await prisma.user.findFirst({
      where: { telegramLink: { telegramChatId, isActive: true } },
    });

    if (!user) {
      await ctx.reply('⚠️ Akun Telegram belum terhubung. Silakan hubungkan via Web Dashboard terlebih dahulu.');
      return;
    }

    let itemsToInsert: Array<string | { name: string; frequency?: string; reminderTime?: string | null; color?: string }> = [];
    let isAiUsed = false;

    const aiRes = await parseHabitsWithAi(user.id, rawText);
    if (aiRes.success && aiRes.habits && aiRes.habits.length > 0) {
      itemsToInsert = aiRes.habits;
      isAiUsed = true;
    } else {
      itemsToInsert = parseBulkHabitText(rawText);
    }

    if (itemsToInsert.length === 0) {
      await ctx.reply(`⚠️ Gagal mengekstrak item habit.\n${aiRes.message || 'Pastikan teks berisi baris checklist.'}`);
      return;
    }

    const created = await createHabitsBulk(itemsToInsert, user.id);
    await ctx.reply(
      `🎉 *Berhasil Mengimpor ${created.length} Habit!* ${isAiUsed ? '(powered by AI ✨)' : ''}\n\n` +
      created.map((h, i) => `${i + 1}. ✅ *${h.name}*`).join('\n') +
      `\n\nGunakan perintah /habits untuk melihat checklist harian kamu!`,
      { parse_mode: 'Markdown' }
    );
  } catch (err: any) {
    console.error('Error in /importhabit:', err);
    await ctx.reply(`❌ Gagal mengimpor habit: ${err.message}`);
  }
}

// Handler untuk Telegram Mini App Direct Launch (/app)
async function handleAppCommand(ctx: any) {
  try {
    const webAppUrl = getWebAppUrl();
    await ctx.reply(
      `🚀 *Life OS Telegram Mini App*\n\n` +
      `Buka dashboard produktivitas interaktif kamu langsung di dalam Telegram! ✨\n\n` +
      `• Auto Login Instant\n` +
      `• Habit & Task Check-in\n` +
      `• AI Daily Coach & Journal`,
      {
        parse_mode: 'Markdown',
        ...Markup.inlineKeyboard([
          [Markup.button.webApp('🚀 Buka Telegram Mini App', webAppUrl)],
        ]),
      }
    );
  } catch (error) {
    console.error('Error handling /app command:', error);
  }
}

// Telegram Bot Commands
bot.command('app', handleAppCommand);
bot.command('menu', handleMainMenuCommand);
bot.command('login', handleLoginCommand);
bot.command('goals', (ctx) => handleGoalsCommand(ctx));
bot.command('goal', handleCreateGoalCommand);
bot.command('focus', handleFocusCommand);
bot.command('habits', handleHabitsCommand);
bot.command('importhabit', handleImportHabitsCommand);
bot.command('tasks', (ctx) => handleTasksCommand(ctx));
bot.command('task', handleCreateTaskCommand);
bot.command('log', handleDailyLogCommand);
bot.command('today', handleTodaySummaryCommand);
bot.command('streak', handleStreakCommand);
bot.command('summary', handleWeeklySummaryCommand);
bot.command('ai', handleAiInfoCommand);

async function handleWeeklySummaryCommand(ctx: any) {
  try {
    if (!ctx.chat) return;
    const chatId = BigInt(ctx.chat.id);
    const link = await prisma.telegramLink.findUnique({
      where: { telegramChatId: chatId },
      select: { userId: true },
    });
    const firstUser = await prisma.user.findFirst();
    const userId = link?.userId || firstUser?.id;

    if (!userId) {
      await ctx.reply('❌ User tidak ditemukan.');
      return;
    }

    await ctx.reply('📊 *AI Coach sedang menyusun Rangkuman Mingguan Cerdas...*\n_Mohon tunggu sebentar..._', { parse_mode: 'Markdown' });

    const result = await generateWeeklySummary(userId);

    if (!result.success || !result.data) {
      await ctx.reply(`⚠️ *Gagal membuat summary:* ${result.message || 'Terjadi kesalahan'}`);
      return;
    }

    const { highlights, improvements, summary, advice } = result.data;

    let msg = `📊 *Weekly Smart Summary (AI Coach)* 🏆\n\n` +
      `📝 *Ringkasan Evaluasi:*\n${summary}\n\n` +
      `🌟 *Pencapaian Utama:*\n` + (highlights.length ? highlights.map((h) => `• ${h}`).join('\n') : '• Belum ada data pencapaian khusus') + `\n\n` +
      `⚠️ *Area Perbaikan:*\n` + (improvements.length ? improvements.map((i) => `• ${i}`).join('\n') : '• Pertahankan performa baik kamu!') + `\n\n` +
      `💡 *Fokus Minggu Depan:*\n_${advice}_`;

    await ctx.reply(msg, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error handling /summary command:', error);
    await ctx.reply('❌ Gagal memuat weekly summary.');
  }
}

async function handleAiInfoCommand(ctx: any) {
  try {
    const enabled = isAiGloballyEnabled();
    const msg = enabled
      ? `🧠 *LifeOS AI Assistant & Coach*\n\n` +
        `Fitur AI aktif di akun kamu! ✨\n\n` +
        `• \`/goal <judul>\` — Buat goal & AI breakdown otomatis\n` +
        `• \`/summary\` — Rangkuman Mingguan Cerdas oleh AI Coach\n` +
        `• Web Dashboard — AI Daily Journal Coach & Sub-tasks breakdown`
      : `⚠️ *Layanan AI Saat Ini Nonaktif*\n\n` +
        `OPENAI_API_KEY tidak dikonfigurasi di server. Semua fungsi dasar LifeOS tetap berjalan 100% normal tanpa AI.`;

    await ctx.reply(msg, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error(error);
  }
}

// Telegram Keyboard Button Listeners (Tanpa perlu ketik /)
bot.hears('🌟 Goals (Mimpi)', (ctx) => handleGoalsCommand(ctx));
bot.hears('🔎 Focus Mode', handleFocusCommand);
bot.hears('🎯 Habit Harian', handleHabitsCommand);
bot.hears('📋 Task List', (ctx) => handleTasksCommand(ctx));
bot.hears('📖 Jurnal & Mood', handleDailyLogCommand);
bot.hears('📊 Today Summary', handleTodaySummaryCommand);
bot.hears('🔥 Habit Streaks', handleStreakCommand);
bot.hears('⚙️ Menu Utama', handleMainMenuCommand);

// Telegram Bot Callback Actions (Inline Keyboard Click)
bot.action('nav_goals', (ctx) => handleGoalsCommand(ctx));
bot.action('nav_focus', handleFocusCommand);
bot.action('nav_habits', handleHabitsCommand);
bot.action('nav_tasks', (ctx) => handleTasksCommand(ctx));
bot.action('nav_log', handleDailyLogCommand);
bot.action('nav_today', handleTodaySummaryCommand);
bot.action('nav_streak', handleStreakCommand);
bot.action('nav_web_info', handleWebInfoCallback);
bot.action('prompt_add_goal', async (ctx) => {
  await ctx.answerCbQuery();
  await ctx.reply(
    '🚀 *Ketik perintah berikut untuk membuat Goal baru:*\n\n' +
      'Format: `/goal Judul Goal Kamu`\n' +
      'Contoh: `/goal Launch LifeOS ke 100 User`',
    { parse_mode: 'Markdown' }
  );
});

bot.action(/^goal_detail:(.+)$/, handleGoalDetailCallback);
bot.action(/^goal_add_task_wizard:(.+)$/, async (ctx) => {
  if (!ctx.chat || !('data' in ctx.callbackQuery!)) return;
  const chatId = ctx.chat.id;
  const goalId = ctx.callbackQuery.data.replace('goal_add_task_wizard:', '');
  const goal = await getGoalById(goalId);
  if (!goal) return;

  goalWizardSessions.set(chatId, {
    goalId: goal.id,
    goalTitle: goal.title,
    taskCount: goal.totalTasks,
  });

  await ctx.answerCbQuery();
  await ctx.reply(
    `⚡ *Breakdown Mode Aktif untuk Goal "${goal.title}"*\n\n` +
      `Ketikkan task baru langsung di chat (satu per satu):\n` +
      `• Kirim teks biasa untuk tambah task\n` +
      `• Ketik \`/done\` untuk selesai`,
    { parse_mode: 'Markdown' }
  );
});

const habitSkipCustomSessions = new Map<number, string>(); // chatId -> habitId

bot.action(/^toggle_habit:(.+)$/, handleHabitToggleCallback);
bot.action('refresh_habits', handleHabitToggleCallback);
bot.action(/^habit_done:(.+)$/, (ctx) => {
  const habitId = ctx.match[1];
  return handleHabitDoneAction(ctx, habitId);
});
bot.action(/^habit_skip_prompt:(.+)$/, (ctx) => {
  const habitId = ctx.match[1];
  return handleHabitSkipPromptAction(ctx, habitId);
});
bot.action(/^habit_skip_preset:(.+):(.+)$/, (ctx) => {
  const habitId = ctx.match[1];
  const presetNote = ctx.match[2];
  return handleHabitSkipPresetAction(ctx, habitId, presetNote);
});
bot.action(/^habit_skip_custom:(.+)$/, async (ctx) => {
  const habitId = ctx.match[1];
  if (ctx.chat) {
    habitSkipCustomSessions.set(ctx.chat.id, habitId);
  }
  await ctx.answerCbQuery('Ketik catatan kustom...');
  await ctx.reply('✍️ *Silakan balas pesan ini dengan mengetik alasan/catatan skip untuk habit ini:*', {
    parse_mode: 'Markdown',
    reply_markup: { force_reply: true },
  });
});

bot.action(/^toggle_task:(.+)$/, handleTaskToggleCallback);
bot.action('refresh_tasks', handleTaskToggleCallback);
bot.action(/^nav_tasks_page:(.+)$/, handleTasksPageCallback);
bot.action(/^nav_goals_page:(.+)$/, handleGoalsPageCallback);
bot.action(/^log_mood:(.+)$/, handleLogMoodCallback);
bot.action(/^log_energy:(.+)$/, handleLogEnergyCallback);
bot.action('log_skip_journal', handleLogSkipJournalCallback);
bot.action(/^ai_breakdown_goal:(.+)$/, handleAiGoalBreakdownCallback);

// Text Message Middleware for Goal Breakdown Wizard & Daily Journal Text Entry
bot.on('text', async (ctx, next) => {
  if (!ctx.chat) return next();
  const chatId = ctx.chat.id;
  const text = ctx.message.text.trim();

  // Check Habit Skip Custom Note session
  const habitSkipId = habitSkipCustomSessions.get(chatId);
  if (habitSkipId) {
    habitSkipCustomSessions.delete(chatId);
    if (!text.startsWith('/')) {
      await skipHabitStatus(habitSkipId, text);
      await ctx.reply(`⏭️ Catatan skip berhasil disimpan: _"${text}"_`, { parse_mode: 'Markdown' });
      return;
    }
  }

  // Check Daily Log Journal Text session
  const logSession = logWizardSessions.get(chatId);
  if (logSession && logSession.step === 'WAITING_JOURNAL_TEXT') {
    if (text === '/skip' || text === '/done') {
      await handleLogSkipJournalCallback(ctx);
      return;
    }
    if (!text.startsWith('/')) {
      await handleLogJournalText(ctx, text);
      return;
    }
  }

  const session = goalWizardSessions.get(chatId);
  if (!session) {
    return next();
  }

  if (text.startsWith('/')) {
    if (text === '/done') {
      goalWizardSessions.delete(chatId);
      const goal = await getGoalById(session.goalId);
      const progressText = goal ? renderProgressBar(goal.progress) : '';
      await ctx.reply(
        `🎉 *Breakdown Mode Selesai!*\n\n` +
          `📌 Goal: *"${session.goalTitle}"*\n` +
          `📊 Progres: ${progressText}\n\n` +
          `Ketik /goals untuk melihat daftar mimpi kamu, atau /focus untuk melihat prioritas!`,
        { parse_mode: 'Markdown' }
      );
      return;
    } else if (text === '/skip') {
      goalWizardSessions.delete(chatId);
      await ctx.reply('⏩ Breakdown dilewati. Kamu bisa me-breakdown task kapan saja!');
      return;
    } else {
      // If user runs another command like /menu or /goals, cancel wizard & proceed
      goalWizardSessions.delete(chatId);
      return next();
    }
  }

  // Create task for active breakdown wizard session
  try {
    const telegramChatId = BigInt(chatId);
    const telegramLink = await prisma.telegramLink.findUnique({
      where: { telegramChatId },
      select: { userId: true },
    });
    const firstUser = await prisma.user.findFirst();
    const userId = telegramLink?.userId || firstUser?.id;

    if (!userId) {
      await ctx.reply('❌ User tidak ditemukan.');
      return;
    }

    const newTask = await createTask({
      title: text,
      goalId: session.goalId,
      userId,
    });

    session.taskCount += 1;
    goalWizardSessions.set(chatId, session);

    await ctx.reply(
      `✅ *Task #${session.taskCount} ditambahkan!*\n` +
        `📋 *"${newTask.title}"*\n\n` +
        `Kirim task berikutnya, atau ketik \`/done\` jika sudah selesai.`,
      { parse_mode: 'Markdown' }
    );
  } catch (err) {
    console.error('Error creating task in breakdown wizard:', err);
    await ctx.reply('❌ Gagal menambahkan task.');
  }
});

// Express API Routes & Auth Middleware Registration
app.use(authMiddleware);

app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'Life OS API',
    timestamp: new Date().toISOString(),
  });
});

// AUTH REST API ENDPOINTS
app.post('/api/auth/dev-login', async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    let user = await prisma.user.findFirst({
      where: email ? { email } : undefined,
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: email || 'user@lifeos.internal',
          name: 'Ikhya (Life OS User)',
        },
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name },
      process.env.JWT_SECRET || 'lifeos_secret_key_2026_hikari',
      { expiresIn: '30d' }
    );

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/verify-otp', async (req: Request, res: Response) => {
  try {
    const { otpCode } = req.body;
    if (!otpCode) {
      res.status(400).json({ success: false, message: 'Kode OTP 6-digit harus diisi.' });
      return;
    }

    const cleanCode = otpCode.toString().trim();
    const record = activeOtpCodes.get(cleanCode);

    if (!record) {
      res.status(400).json({ success: false, message: 'Kode OTP tidak valid atau sudah kadaluwarsa. Silakan ketik /login di Telegram.' });
      return;
    }

    if (Date.now() > record.expiresAt) {
      activeOtpCodes.delete(cleanCode);
      res.status(400).json({ success: false, message: 'Kode OTP sudah kadaluwarsa (berlaku 5 menit). Ketik /login di Telegram untuk kode baru.' });
      return;
    }

    // Single-use OTP code
    activeOtpCodes.delete(cleanCode);

    // Resolve user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { id: record.userId },
          { telegramLink: { telegramChatId: record.chatId } },
        ],
      },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: `tg_${record.chatId}@lifeos.internal`,
          name: `User ${record.chatId}`,
          telegramLink: {
            create: {
              telegramChatId: record.chatId,
              isActive: true,
            },
          },
        },
      });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email, name: user.name, telegramChatId: record.chatId.toString() },
      process.env.JWT_SECRET || 'lifeos_secret_key_2026_hikari',
      { expiresIn: '30d' }
    );

    console.log(`[AUTH] Successfully verified Telegram OTP ${cleanCode} for user ${user.name} (${user.id})`);

    res.json({
      success: true,
      token,
      user: { id: user.id, name: user.name, email: user.email },
    });
  } catch (error: any) {
    console.error('Error verifying OTP code:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/push/register-fcm', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const { fcmToken } = req.body;
    if (!fcmToken) {
      res.status(400).json({ success: false, message: 'fcmToken is required' });
      return;
    }

    await registerUserFcmToken(req.user.id, fcmToken);
    console.log(`[FCM PUSH] Registered Android FCM device token for user ${req.user.name} (${req.user.id})`);
    res.json({ success: true, message: 'FCM Token registered successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/telegram-webapp', async (req: Request, res: Response) => {
  try {
    const { initData } = req.body;
    if (!initData) {
      res.status(400).json({ success: false, message: 'initData string is required' });
      return;
    }

    const result = await verifyTelegramWebAppData(initData);
    if (!result.success) {
      res.status(401).json({ success: false, message: result.message });
      return;
    }

    res.json({
      success: true,
      token: result.jwtToken,
      user: result.user,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/auth/verify-magic-link', async (req: Request, res: Response) => {
  try {
    const { token } = req.body;
    if (!token) {
      res.status(400).json({ success: false, message: 'Magic link token is required' });
      return;
    }

    const result = await verifyMagicLinkToken(token);
    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }

    res.json({
      success: true,
      token: result.jwtToken,
      user: result.user,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/auth/me', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { telegramLink: true },
    });

    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    res.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        telegramLink: user.telegramLink,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ANALYTICS REST API ENDPOINTS
app.get('/api/analytics/summary', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.json({
        success: true,
        summary: { focusScore: 0, habitStreaks: [], recentMoodLogs: [] },
      });
      return;
    }

    const chatId = req.user.telegramChatId ? BigInt(req.user.telegramChatId) : null;
    const summary = await getAnalyticsSummary(chatId);
    res.json({ success: true, summary });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// DAILY LOG REST API ENDPOINTS
app.get('/api/daily-logs/today', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.json({ success: true, dailyLog: null });
      return;
    }

    const chatId = req.user.telegramChatId ? BigInt(req.user.telegramChatId) : null;
    const result = await getTodayDailyLog(chatId);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/daily-logs', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { mood, energy, journal, highlights } = req.body;
    if (mood === undefined || energy === undefined) {
      res.status(400).json({ success: false, message: 'mood and energy are required' });
      return;
    }

    const savedLog = await upsertDailyLog({
      userId: req.user.id,
      mood: parseInt(mood, 10),
      energy: parseInt(energy, 10),
      journal,
      highlights,
    });
    res.json({ success: true, dailyLog: savedLog });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route to get daily habits via REST API
app.get('/api/habits', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.json({ success: true, habits: [] });
      return;
    }

    const chatId = req.user.telegramChatId ? BigInt(req.user.telegramChatId) : null;
    const result = await getUserDailyHabits(chatId, req.user.id);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route to create new habit via REST API
app.post('/api/habits', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { name, description, frequency, color, reminderTime } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'name is required' });
      return;
    }

    const newHabit = await createHabit({ name, description, frequency, color, reminderTime, userId: req.user.id });
    res.json({ success: true, habit: newHabit });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route to reorder habits (Drag and Drop sortOrder update)
app.post('/api/habits/reorder', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { orderedIds } = req.body;
    if (!Array.isArray(orderedIds)) {
      res.status(400).json({ success: false, message: 'orderedIds array is required' });
      return;
    }

    await reorderHabits(orderedIds);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route to AI parse habit checklist via REST API
app.post('/api/ai/parse-habits', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { rawText } = req.body;
    if (!rawText || typeof rawText !== 'string' || !rawText.trim()) {
      res.status(400).json({ success: false, message: 'Teks checklist (rawText) wajib diisi.' });
      return;
    }

    const result = await parseHabitsWithAi(req.user.id, rawText);
    if (!result.success) {
      res.status(400).json({ success: false, message: result.message });
      return;
    }

    res.json({ success: true, habits: result.habits, quotaRemaining: result.quotaRemaining });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route to bulk import habits via REST API
app.post('/api/habits/bulk', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { rawText, habitItems, habitNames, useAi } = req.body;
    let itemsToInsert: Array<string | { name: string; frequency?: string; reminderTime?: string | null; color?: string }> = [];

    if (Array.isArray(habitItems) && habitItems.length > 0) {
      itemsToInsert = habitItems;
    } else if (Array.isArray(habitNames) && habitNames.length > 0) {
      itemsToInsert = habitNames;
    } else if (rawText && typeof rawText === 'string') {
      if (useAi) {
        const aiRes = await parseHabitsWithAi(req.user.id, rawText);
        if (!aiRes.success) {
          res.status(400).json({ success: false, message: aiRes.message });
          return;
        }
        itemsToInsert = aiRes.habits || [];
      } else {
        itemsToInsert = parseBulkHabitText(rawText);
      }
    }

    if (itemsToInsert.length === 0) {
      res.status(400).json({ success: false, message: 'Tidak ada item habit yang dapat diekstrak' });
      return;
    }

    const created = await createHabitsBulk(itemsToInsert, req.user.id);
    res.json({ success: true, count: created.length, habits: created });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route to update habit (e.g. reminderTime, name, color) via REST API
app.put('/api/habits/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const habitId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const { name, description, frequency, color, reminderTime } = req.body;

    let reminderDate: Date | null | undefined = undefined;
    if (reminderTime !== undefined) {
      if (reminderTime === null || reminderTime === '') {
        reminderDate = null;
      } else if (typeof reminderTime === 'string') {
        const [h, m] = reminderTime.split(':').map(Number);
        reminderDate = new Date(Date.UTC(1970, 0, 1, h || 0, m || 0, 0));
      }
    }

    const updatedHabit = await prisma.habit.update({
      where: { id: habitId },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(frequency && { frequency }),
        ...(color && { color }),
        ...(reminderDate !== undefined && { reminderTime: reminderDate }),
      },
    });

    res.json({ success: true, habit: updatedHabit });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route to archive/delete habit via REST API
app.delete('/api/habits/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const habitId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const archivedHabit = await deleteHabit(habitId);
    res.json({ success: true, habit: archivedHabit });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Route to toggle habit check-in status via REST API
app.post('/api/habits/check-in', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { habitId } = req.body;
    if (!habitId) {
      res.status(400).json({ success: false, message: 'habitId is required' });
      return;
    }

    const result = await toggleHabitStatus(habitId);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GOAL REST API ENDPOINTS
app.get('/api/goals', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.json({ success: true, goals: [] });
      return;
    }

    const chatId = req.user.telegramChatId ? BigInt(req.user.telegramChatId) : null;
    const goals = await getUserGoals(chatId);
    res.json({ success: true, goals });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/goals', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { title, description, deadline, color } = req.body;
    if (!title) {
      res.status(400).json({ success: false, message: 'title is required' });
      return;
    }

    const goal = await createGoal({
      title,
      description,
      deadline: deadline ? new Date(deadline) : undefined,
      color,
      userId: req.user.id,
    });

    res.json({ success: true, goal });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/goals/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const goalId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const goal = await getGoalById(goalId);
    if (!goal) {
      res.status(404).json({ success: false, message: 'Goal not found' });
      return;
    }
    res.json({ success: true, goal });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.patch('/api/goals/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const goalId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const { title, description, deadline, status, color } = req.body;

    const updated = await updateGoal(goalId, {
      title,
      description,
      deadline: deadline !== undefined ? (deadline ? new Date(deadline) : null) : undefined,
      status,
      color,
    });

    res.json({ success: true, goal: updated });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/goals/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const goalId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const deleted = await deleteGoal(goalId);
    res.json({ success: true, goal: deleted });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// AI REST API ENDPOINTS
app.get('/api/ai/status', handleAiStatus);
app.post('/api/ai/goal-breakdown', handleAiGoalBreakdown);
app.post('/api/ai/daily-coach', handleAiDailyCoach);
app.get('/api/ai/weekly-summary', handleAiWeeklySummary);

// SHARE CARD REST API ENDPOINTS
app.get('/api/share/daily-card', getShareCardData);

// TASK REST API ENDPOINTS
app.get('/api/tasks', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.json({ success: true, tasks: [] });
      return;
    }

    const chatId = req.user.telegramChatId ? BigInt(req.user.telegramChatId) : null;
    const result = await getUserTasks(chatId, req.user.id);
    res.json({ success: true, ...result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/tasks', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { title, priority, dueDate, dueTime, goalId } = req.body;
    if (!title) {
      res.status(400).json({ success: false, message: 'title is required' });
      return;
    }

    let parsedDueTime: Date | undefined = undefined;
    if (dueTime) {
      const [h, m] = dueTime.split(':').map(Number);
      parsedDueTime = new Date(Date.UTC(1970, 0, 1, h || 0, m || 0, 0));
    }

    const newTask = await createTask({
      title,
      priority,
      dueDate: dueDate ? new Date(dueDate) : undefined,
      dueTime: parsedDueTime,
      goalId,
      userId: req.user.id,
    });
    res.json({ success: true, task: newTask });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.patch('/api/tasks/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const taskId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const { title, description, priority, status, goalId, dueDate, dueTime } = req.body;

    let parsedDueTime: Date | null | undefined = undefined;
    if (dueTime !== undefined) {
      if (dueTime === null || dueTime === '') {
        parsedDueTime = null;
      } else if (typeof dueTime === 'string') {
        const [h, m] = dueTime.split(':').map(Number);
        parsedDueTime = new Date(Date.UTC(1970, 0, 1, h || 0, m || 0, 0));
      }
    }

    const updatedTask = await updateTask(taskId, {
      title,
      description,
      priority,
      status,
      goalId,
      dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
      dueTime: parsedDueTime,
    });
    res.json({ success: true, task: updatedTask });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/tasks/:id', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const taskId = Array.isArray(req.params.id) ? req.params.id[0] : (req.params.id as string);
    const deletedTask = await deleteTask(taskId);
    res.json({ success: true, task: deletedTask });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// TELEGRAM LINKING REST API ENDPOINTS
app.post('/api/telegram/link-token', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }

    const { token, expiresAt, botUsername } = await generateLinkToken(req.user.id);
    const telegramUrl = `https://t.me/${botUsername}?start=${token}`;

    res.json({
      success: true,
      token,
      expiresAt,
      telegramUrl,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/telegram/status', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.json({ success: true, isLinked: false, telegramLink: null });
      return;
    }

    const telegramLink = await prisma.telegramLink.findUnique({
      where: { userId: req.user.id },
      include: { user: true },
    });

    res.json({
      success: true,
      isLinked: !!telegramLink && telegramLink.isActive,
      telegramLink,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// CRON TRIGGER REST API (Manual On-Demand Testing)
app.post('/api/cron/trigger', async (req: Request, res: Response) => {
  try {
    const { job } = req.body;
    if (job === 'morning') {
      await sendMorningReminders(bot);
      res.json({ success: true, message: 'Morning reminder push sent to Telegram' });
    } else if (job === 'evening') {
      await sendEveningRecapReminders(bot);
      res.json({ success: true, message: 'Evening recap push sent to Telegram' });
    } else if (job === 'streak') {
      await sendStreakAlertReminders(bot);
      res.json({ success: true, message: 'Streak alert push sent to Telegram' });
    } else if (job === 'time-specific') {
      await sendTimeSpecificReminders(bot);
      res.json({ success: true, message: 'Hourly time-specific reminder push sent to Telegram' });
    } else {
      res.status(400).json({ success: false, message: 'Invalid job type. Use "morning", "evening", "streak", or "time-specific"' });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Optional route to list linked Telegram users
app.get('/api/telegram-users', async (req: Request, res: Response) => {
  try {
    const links = await prisma.telegramLink.findMany({
      include: {
        user: true,
      },
    });
    res.json({ success: true, data: links });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// SHARE CARD & TELEGRAM FLEX API ENDPOINTS
app.get('/api/share/daily-card', authMiddleware, getShareCardData);
app.post('/api/share/send-telegram', authMiddleware, sendShareCardToTelegram);

// USER SETTINGS REST API ENDPOINTS
app.get('/api/settings', authMiddleware, handleGetUserSettings);
app.put('/api/settings', authMiddleware, handleUpdateUserSettings);

// WEB PUSH NOTIFICATION API ENDPOINTS
app.get('/api/notifications/vapid-key', (req: Request, res: Response) => {
  res.json({ success: true, publicKey: getVapidPublicKey() });
});

app.post('/api/notifications/subscribe', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const { subscription } = req.body;
    if (!subscription || !subscription.endpoint || !subscription.keys) {
      res.status(400).json({ success: false, message: 'Invalid push subscription object' });
      return;
    }
    const userAgent = req.headers['user-agent'];
    await savePushSubscription(req.user.id, subscription, userAgent);
    res.json({ success: true, message: 'Push subscription saved successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/notifications/unsubscribe', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { endpoint } = req.body;
    if (!endpoint) {
      res.status(400).json({ success: false, message: 'Endpoint is required' });
      return;
    }
    await removePushSubscription(endpoint);
    res.json({ success: true, message: 'Unsubscribed successfully' });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/notifications/test-push', authMiddleware, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.status(401).json({ success: false, message: 'Unauthorized' });
      return;
    }
    const count = await sendPushNotificationToUser(req.user.id, {
      title: '🔔 Tes Web Push Life OS',
      body: 'Hebat! Notifikasi browser Life OS berhasil aktif & siap mengirimkan pengingat.',
      url: '/dashboard',
    });
    res.json({
      success: true,
      sentCount: count,
      message: count > 0 ? 'Notifikasi tes berhasil terkirim! 🚀' : 'Belum ada browser yang terdaftar.',
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// TELEGRAM BOT COMMAND: /flex or /share
bot.command(['flex', 'share'], async (ctx) => {
  try {
    const telegramChatId = BigInt(ctx.chat.id);
    const tgLink = await prisma.telegramLink.findUnique({
      where: { telegramChatId },
      include: { user: true },
    });

    if (!tgLink || !tgLink.user) {
      await ctx.reply(
        `⚠️ *Akun Telegram Belum Terhubung*\n\n` +
          `Silakan buka Web Dashboard Life OS dan klik tombol *Hubungkan Telegram* di sidebar untuk menghubungkan akun kamu.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    await ctx.reply(`🎨 *Sedang me-render Daily Flex Share Card kamu...*`, { parse_mode: 'Markdown' });

    const cardData = await fetchCardDataInternal(tgLink.userId);
    if (!cardData) {
      await ctx.reply('⚠️ Gagal membuat kartu produktivitas.');
      return;
    }

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3011';
    const ogUrl = `${frontendUrl}/og/daily-card?format=square&theme=strava&data=${encodeURIComponent(JSON.stringify(cardData))}`;

    const imgRes = await fetch(ogUrl);
    if (!imgRes.ok) {
      throw new Error(`HTTP ${imgRes.status}`);
    }
    const arrayBuf = await imgRes.arrayBuffer();
    const imageBuffer = Buffer.from(arrayBuf);

    const streakText = cardData.topStreak ? `🔥 *Top Streak:* ${cardData.topStreak.name} (${cardData.topStreak.streak} Hari)\n` : '';
    const caption =
      `✨ *DAILY PERFORMANCE FLEX* — ${cardData.dateShort}\n\n` +
      `👤 *User:* ${cardData.userName}\n` +
      `⭐ *Focus Score:* ${cardData.focusScore}%\n` +
      `🎯 *Habits Done:* ${cardData.habitsCompleted}/${cardData.habitsTotal}\n` +
      `✅ *Tasks Done:* ${cardData.tasksCompleted}/${cardData.tasksTotal}\n` +
      streakText +
      `\n⚡ _Generated by Life OS Bot_`;

    await ctx.replyWithPhoto({ source: imageBuffer }, { caption, parse_mode: 'Markdown' });
  } catch (err: any) {
    console.error('Error in /flex bot command:', err);
    await ctx.reply('⚠️ Terjadi kesalahan saat membuat kartu flex.');
  }
});

// Start Express Server & Telegram Bot
async function main() {
  try {
    // Connect to PostgreSQL database
    await prisma.$connect();
    console.log('✅ Connected to Database via Prisma');

    // Start Express HTTP Server
    app.listen(port, () => {
      console.log(`🚀 Express server running on http://localhost:${port}`);
    });

    // Initialize Cron Scheduler (runs independently of Telegram Bot polling state)
    if (botToken && botToken !== 'DUMMY_TOKEN') {
      // Register slash command menu in Telegram
      registerTelegramCommands(bot);

      // Start Cron Scheduler for background Telegram push reminders
      initCronScheduler(bot);

      // Launch Telegram Bot (Polling mode for receiving commands)
      bot.launch()
        .then(() => {
          console.log('🤖 Telegram Bot launched successfully (Polling mode)');
        })
        .catch((err) => {
          console.error('❌ Failed to launch Telegram Bot polling:', err.message);
          console.log('💡 Note: Scheduled push reminders will still send, but incoming /bot commands won\'t respond until polling reconnects.');
        });

      // Enable graceful stop for bot
      process.once('SIGINT', () => {
        try { bot.stop('SIGINT'); } catch (e) {}
      });
      process.once('SIGTERM', () => {
        try { bot.stop('SIGTERM'); } catch (e) {}
      });
    } else {
      console.warn('⚠️ Telegram bot polling skipped (No valid TELEGRAM_BOT_TOKEN provided).');
    }
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    await prisma.$disconnect();
    process.exit(1);
  }
}

main();
