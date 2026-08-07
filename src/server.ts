import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Telegraf } from 'telegraf';
import { PrismaClient } from '@prisma/client';
import {
  handleHabitsCommand,
  handleHabitToggleCallback,
  getUserDailyHabits,
  toggleHabitStatus,
  createHabit,
  deleteHabit,
} from './controllers/habitController';
import {
  getUserTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
  handleTasksCommand,
  handleCreateTaskCommand,
  handleTaskToggleCallback,
} from './controllers/taskController';
import { generateLinkToken, redeemLinkToken } from './services/telegramLinkService';
import {
  getTodayDailyLog,
  upsertDailyLog,
  handleDailyLogCommand,
  handleLogMoodCallback,
  handleLogEnergyCallback,
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
} from './services/authService';
import { authMiddleware, AuthenticatedRequest } from './middleware/authMiddleware';

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
app.use(express.json());

// Initialize Telegraf Bot
const botToken = process.env.TELEGRAM_BOT_TOKEN;
if (!botToken) {
  console.warn('⚠️ Warning: TELEGRAM_BOT_TOKEN is not defined in environment variables.');
}

export const bot = new Telegraf(botToken || 'DUMMY_TOKEN');

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

// Handler untuk Telegram Magic Login Link (/login)
async function handleLoginCommand(ctx: any) {
  try {
    if (!ctx.chat) return;
    const chatId = BigInt(ctx.chat.id);
    const { magicLinkUrl, userName } = await generateMagicLinkToken(chatId);

    const localhostUrl = magicLinkUrl.replace('127.0.0.1', 'localhost');

    const htmlMessage =
      `🔑 <b>Magic Login Link Web Dashboard</b>\n\n` +
      `Halo <b>${userName}</b>! Klik atau tap tautan biru di bawah ini untuk langsung masuk ke Web Dashboard tanpa password:\n\n` +
      `🚀 <a href="${magicLinkUrl}"><b>👉 KLIK DI SINI UNTUK LOGIN INSTAN 👈</b></a>\n\n` +
      `<i>Atau gunakan tautan alternatif:</i>\n` +
      `• IP: ${magicLinkUrl}\n` +
      `• Localhost: ${localhostUrl}\n\n` +
      `⏳ <b>Catatan:</b> Link ini berlaku selama 15 menit. Begitu masuk, Anda akan tetap login permanen!`;

    await ctx.reply(htmlMessage, {
      parse_mode: 'HTML',
      link_preview_options: { is_disabled: true },
    });
  } catch (error) {
    console.error('Error handling /login command:', error);
    await ctx.reply('❌ Gagal membuat magic login link.');
  }
}

// Telegram Bot Commands
bot.command('menu', handleMainMenuCommand);
bot.command('login', handleLoginCommand);
bot.command('habits', handleHabitsCommand);
bot.command('tasks', handleTasksCommand);
bot.command('task', handleCreateTaskCommand);
bot.command('log', handleDailyLogCommand);
bot.command('today', handleTodaySummaryCommand);
bot.command('streak', handleStreakCommand);

// Telegram Keyboard Button Listeners (Tanpa perlu ketik /)
bot.hears('🎯 Habit Harian', handleHabitsCommand);
bot.hears('📋 Task List', handleTasksCommand);
bot.hears('📖 Jurnal & Mood', handleDailyLogCommand);
bot.hears('📊 Today Summary', handleTodaySummaryCommand);
bot.hears('🔥 Habit Streaks', handleStreakCommand);
bot.hears('⚙️ Menu Utama', handleMainMenuCommand);

// Telegram Bot Callback Actions (Inline Keyboard Click)
bot.action('nav_habits', handleHabitsCommand);
bot.action('nav_tasks', handleTasksCommand);
bot.action('nav_log', handleDailyLogCommand);
bot.action('nav_today', handleTodaySummaryCommand);
bot.action('nav_streak', handleStreakCommand);
bot.action('nav_web_info', handleWebInfoCallback);

bot.action(/^toggle_habit:(.+)$/, handleHabitToggleCallback);
bot.action('refresh_habits', handleHabitToggleCallback);
bot.action(/^toggle_task:(.+)$/, handleTaskToggleCallback);
bot.action('refresh_tasks', handleTaskToggleCallback);
bot.action(/^log_mood:(.+)$/, handleLogMoodCallback);
bot.action(/^log_energy:(.+)$/, handleLogEnergyCallback);

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
    const result = await getUserDailyHabits(chatId);
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

    const { name, description, frequency, color } = req.body;
    if (!name) {
      res.status(400).json({ success: false, message: 'name is required' });
      return;
    }

    const newHabit = await createHabit({ name, description, frequency, color, userId: req.user.id });
    res.json({ success: true, habit: newHabit });
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

// TASK REST API ENDPOINTS
app.get('/api/tasks', async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      res.json({ success: true, tasks: [] });
      return;
    }

    const chatId = req.user.telegramChatId ? BigInt(req.user.telegramChatId) : null;
    const result = await getUserTasks(chatId);
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

    const { title, priority, dueDate } = req.body;
    if (!title) {
      res.status(400).json({ success: false, message: 'title is required' });
      return;
    }

    const newTask = await createTask({ title, priority, dueDate: dueDate ? new Date(dueDate) : undefined, userId: req.user.id });
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
    const { status } = req.body;
    const updatedTask = await updateTaskStatus(taskId, status);
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
    } else {
      res.status(400).json({ success: false, message: 'Invalid job type. Use "morning", "evening", or "streak"' });
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

    // Launch Telegram Bot & Cron Scheduler
    if (botToken && botToken !== 'DUMMY_TOKEN') {
      bot.launch()
        .then(() => {
          console.log('🤖 Telegram Bot launched successfully (Polling mode)');
          registerTelegramCommands(bot);
          initCronScheduler(bot);
        })
        .catch((err) => {
          console.error('❌ Failed to launch Telegram Bot:', err.message);
        });

      // Enable graceful stop for bot
      process.once('SIGINT', () => bot.stop('SIGINT'));
      process.once('SIGTERM', () => bot.stop('SIGTERM'));
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
