import { Context, Markup } from 'telegraf';
import { prisma } from '../server';

export interface GoalWithDetails {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  deadline: Date | null;
  status: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'ABANDONED';
  color: string | null;
  totalTasks: number;
  completedTasks: number;
  progress: number;
  tasks?: any[];
  habits?: any[];
  createdAt: Date;
  updatedAt: Date;
}

// In-memory breakdown wizard state for Telegram per user
// userId/chatId -> goalId
export const goalWizardSessions = new Map<number, { goalId: string; goalTitle: string; taskCount: number }>();

/**
 * Helper to resolve user ID from Telegram Chat ID or fallback to default user
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
 * Helper to generate visual progress bar string (e.g. "████░░░░░░ 40%")
 */
export function renderProgressBar(percentage: number, length: number = 10): string {
  const filledLength = Math.round((percentage / 100) * length);
  const emptyLength = length - filledLength;
  return '█'.repeat(filledLength) + '░'.repeat(emptyLength) + ` ${percentage}%`;
}

/**
 * 1. Get all active goals with calculated task progress for a user
 */
export async function getUserGoals(telegramChatId?: bigint | null): Promise<GoalWithDetails[]> {
  const userId = await resolveUserId(telegramChatId);

  const rawGoals = await prisma.goal.findMany({
    where: {
      userId,
      status: { in: ['ACTIVE', 'COMPLETED', 'PAUSED'] },
    },
    include: {
      tasks: {
        select: { id: true, title: true, status: true, priority: true },
      },
      habits: {
        select: { id: true, name: true, color: true },
      },
    },
    orderBy: [
      { status: 'asc' },
      { deadline: 'asc' },
      { createdAt: 'desc' },
    ],
  });

  return rawGoals.map((g) => {
    const totalTasks = g.tasks.length;
    const completedTasks = g.tasks.filter((t) => t.status === 'DONE').length;
    const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    return {
      id: g.id,
      userId: g.userId,
      title: g.title,
      description: g.description,
      deadline: g.deadline,
      status: g.status,
      color: g.color,
      totalTasks,
      completedTasks,
      progress,
      tasks: g.tasks,
      habits: g.habits,
      createdAt: g.createdAt,
      updatedAt: g.updatedAt,
    };
  });
}

/**
 * 2. Get single Goal detail with tasks & habits
 */
export async function getGoalById(goalId: string): Promise<GoalWithDetails | null> {
  const goal = await prisma.goal.findUnique({
    where: { id: goalId },
    include: {
      tasks: {
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      },
      habits: true,
    },
  });

  if (!goal) return null;

  const totalTasks = goal.tasks.length;
  const completedTasks = goal.tasks.filter((t) => t.status === 'DONE').length;
  const progress = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return {
    id: goal.id,
    userId: goal.userId,
    title: goal.title,
    description: goal.description,
    deadline: goal.deadline,
    status: goal.status,
    color: goal.color,
    totalTasks,
    completedTasks,
    progress,
    tasks: goal.tasks,
    habits: goal.habits,
    createdAt: goal.createdAt,
    updatedAt: goal.updatedAt,
  };
}

/**
 * 3. Create Goal
 */
export async function createGoal(data: {
  userId?: string;
  telegramChatId?: bigint | null;
  title: string;
  description?: string;
  deadline?: Date;
  color?: string;
}) {
  let userId = data.userId;
  if (!userId && data.telegramChatId) {
    userId = await resolveUserId(data.telegramChatId);
  }
  if (!userId) {
    userId = await resolveUserId(null);
  }

  const newGoal = await prisma.goal.create({
    data: {
      userId,
      title: data.title,
      description: data.description || null,
      deadline: data.deadline || null,
      color: data.color || 'emerald',
    },
  });

  return newGoal;
}

/**
 * 4. Update Goal
 */
export async function updateGoal(
  goalId: string,
  data: {
    title?: string;
    description?: string;
    deadline?: Date | null;
    status?: 'ACTIVE' | 'COMPLETED' | 'PAUSED' | 'ABANDONED';
    color?: string;
  }
) {
  const updated = await prisma.goal.update({
    where: { id: goalId },
    data,
  });
  return updated;
}

/**
 * 5. Delete / Archive Goal
 */
export async function deleteGoal(goalId: string) {
  const deleted = await prisma.goal.delete({
    where: { id: goalId },
  });
  return deleted;
}

/**
 * 6. Telegram Command /goals: Tampilkan semua Goal + Progress Bar
 */
export async function handleGoalsCommand(ctx: Context) {
  try {
    if (!ctx.chat) return;

    const telegramChatId = BigInt(ctx.chat.id);
    const goals = await getUserGoals(telegramChatId);

    if (goals.length === 0) {
      await ctx.reply(
        `🎯 *Daftar Mimpi / Goal Kamu Kosong!*\n\n` +
          `Aplikasi ini dirancang untuk me-breakdown mimpi besar kamu ke aksi harian.\n\n` +
          `Mulai sekarang dengan mengetik:\n` +
          `👉 \`/goal Launch Produk Saya\`\n\n` +
          `Bot akan memandu kamu me-breakdown goal tersebut menjadi tugas-tugas harian! 🚀`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    let messageText = `🎯 *Daftar Goals (Mimpi Besar) Kamu*\n\n`;

    const buttons = goals.map((g, index) => {
      const deadlineStr = g.deadline
        ? ` (Deadline: ${new Date(g.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })})`
        : '';
      const bar = renderProgressBar(g.progress);

      messageText +=
        `*${index + 1}. ${g.title}*${deadlineStr}\n` +
        `   ${bar} (${g.completedTasks}/${g.totalTasks} task selesai)\n\n`;

      return [Markup.button.callback(`📌 ${g.title} (${g.progress}%)`, `goal_detail:${g.id}`)];
    });

    buttons.push([Markup.button.callback('➕ Tambah Goal Baru', 'prompt_add_goal')]);

    messageText += `_Tap pada salah satu goal untuk melihat detail task & habit yang terhubung._`;

    await ctx.reply(messageText, {
      parse_mode: 'Markdown',
      ...Markup.inlineKeyboard(buttons),
    });
  } catch (error) {
    console.error('Error handling /goals command:', error);
    await ctx.reply('❌ Terjadi kesalahan saat mengambil daftar goal.');
  }
}

/**
 * 7. Telegram Command /goal <judul>: Buat goal baru & jalankan breakdown wizard
 */
export async function handleCreateGoalCommand(ctx: Context) {
  try {
    if (!ctx.chat) return;

    const chatId = ctx.chat.id;
    const telegramChatId = BigInt(chatId);
    const userId = await resolveUserId(telegramChatId);

    const messageText = (ctx.message as any)?.text || '';
    const goalTitle = messageText.replace('/goal', '').trim();

    if (!goalTitle) {
      await ctx.reply(
        `⚠️ *Judul Goal tidak boleh kosong!*\n\n` +
          `Gunakan format: \`/goal <Judul Mimpi Besar>\`\n` +
          `Contoh: \`/goal Launch LifeOS ke 100 User\`\n\n` +
          `Atau ketik /goals untuk melihat daftar goal yang ada.`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    const newGoal = await createGoal({
      title: goalTitle,
      userId,
    });

    // Start breakdown wizard session
    goalWizardSessions.set(chatId, {
      goalId: newGoal.id,
      goalTitle: newGoal.title,
      taskCount: 0,
    });

    await ctx.reply(
      `🎉 *Goal Baru Dibuat!*\n` +
        `📌 *"${newGoal.title}"*\n\n` +
        `⚡ *Breakdown Mode Aktif!*\n` +
        `Ketikkan langkah-langkah / task konkret untuk mencapai goal ini satu per satu (langsung kirim teks di chat):\n\n` +
        `• Kirim teks biasa untuk tambah task baru\n` +
        `• Ketik \`/done\` jika sudah selesai me-breakdown\n` +
        `• Ketik \`/skip\` jika ingin me-breakdown nanti`,
      { parse_mode: 'Markdown' }
    );
  } catch (error) {
    console.error('Error handling /goal command:', error);
    await ctx.reply('❌ Terjadi kesalahan saat membuat goal baru.');
  }
}

/**
 * 8. Telegram Command /focus: Tampilkan Goal dengan deadline terdekat & task-nya
 */
export async function handleFocusCommand(ctx: Context) {
  try {
    if (!ctx.chat) return;

    const telegramChatId = BigInt(ctx.chat.id);
    const goals = await getUserGoals(telegramChatId);
    const activeGoals = goals.filter((g) => g.status === 'ACTIVE');

    if (activeGoals.length === 0) {
      await ctx.reply(
        `🔎 *Focus Mode*\n\n` +
          `Kamu belum memiliki Goal aktif saat ini.\n` +
          `Ketik \`/goal <Judul Goal>\` untuk menetapkan fokus utama kamu!`,
        { parse_mode: 'Markdown' }
      );
      return;
    }

    // Sort by deadline or priority
    const focusedGoal = activeGoals[0]; // Already sorted by deadline
    const pendingTasks = focusedGoal.tasks?.filter((t) => t.status !== 'DONE') || [];

    const deadlineText = focusedGoal.deadline
      ? `📅 *Deadline:* ${new Date(focusedGoal.deadline).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}\n`
      : '';

    let taskListText = '';
    if (pendingTasks.length > 0) {
      taskListText = pendingTasks
        .slice(0, 5)
        .map((t, idx) => `  ${idx + 1}. ⬜ ${t.title}`)
        .join('\n');
    } else {
      taskListText = `  🎉 Semua task untuk goal ini sudah selesai!`;
    }

    const messageText =
      `🔎 *Focus Mode — Prioritas Utama Kamu*\n\n` +
      `🎯 *Goal:* *${focusedGoal.title}*\n` +
      `${deadlineText}` +
      `📊 *Progres:* ${renderProgressBar(focusedGoal.progress)}\n\n` +
      `📋 *Langkah Konkret yang Harus Dikerjakan:* \n${taskListText}\n\n` +
      `_Disiplin pada 1 fokus utama hingga selesai akan membawa dampak terbesar dalam hidupmu!_`;

    await ctx.reply(messageText, { parse_mode: 'Markdown' });
  } catch (error) {
    console.error('Error handling /focus command:', error);
    await ctx.reply('❌ Terjadi kesalahan saat memuat Focus Mode.');
  }
}

/**
 * 9. Callback Handler untuk Detail Goal
 */
export async function handleGoalDetailCallback(ctx: Context) {
  try {
    if (!ctx.chat || !('data' in ctx.callbackQuery!)) return;

    const callbackData = ctx.callbackQuery.data;
    const goalId = callbackData.replace('goal_detail:', '');

    const goal = await getGoalById(goalId);
    if (!goal) {
      await ctx.answerCbQuery('⚠️ Goal tidak ditemukan.');
      return;
    }

    await ctx.answerCbQuery();

    const bar = renderProgressBar(goal.progress);
    const deadlineText = goal.deadline
      ? `📅 *Deadline:* ${new Date(goal.deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}\n`
      : '';

    let tasksText = 'Belum ada task.';
    if (goal.tasks && goal.tasks.length > 0) {
      tasksText = goal.tasks
        .map((t) => {
          const icon = t.status === 'DONE' ? '✅' : '⬜';
          return `${icon} ${t.title}`;
        })
        .join('\n');
    }

    let habitsText = '';
    if (goal.habits && goal.habits.length > 0) {
      habitsText = `\n🔄 *Linked Habits (Kontribusi Harian):*\n` + goal.habits.map((h) => `• 🎯 ${h.name}`).join('\n');
    }

    const messageText =
      `🎯 *Detail Goal:* *${goal.title}*\n\n` +
      `${deadlineText}` +
      `📊 *Progres:* ${bar}\n` +
      `📌 *Task Completed:* ${goal.completedTasks}/${goal.totalTasks}\n\n` +
      `📋 *Daftar Task Breakdown:*\n${tasksText}` +
      `${habitsText}`;

    const actionButtons = Markup.inlineKeyboard([
      [
        Markup.button.callback('➕ Tambah Task ke Goal', `goal_add_task_wizard:${goal.id}`),
        Markup.button.callback('🔙 Kembali ke Goals', 'nav_goals'),
      ],
    ]);

    await ctx.reply(messageText, { parse_mode: 'Markdown', ...actionButtons });
  } catch (error) {
    console.error('Error handling goal detail callback:', error);
  }
}
